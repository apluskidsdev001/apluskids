package lk.apluskids.platform.kidschamp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lk.apluskids.platform.common.error.ApiException;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class KidsChampWhatsAppTemplateService {
    private static final Logger log = LoggerFactory.getLogger(KidsChampWhatsAppTemplateService.class);
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Pattern VARIABLE = Pattern.compile("\\{\\{([0-9]+)}}");
    private final KidsChampWhatsAppTemplateRepository templates;
    private final KidsChampWhatsAppAdminService whatsapp;

    KidsChampWhatsAppTemplateService(KidsChampWhatsAppTemplateRepository templates,
                                     KidsChampWhatsAppAdminService whatsapp) {
        this.templates = templates;
        this.whatsapp = whatsapp;
    }

    @Transactional(readOnly = true)
    List<TemplateResponse> list() {
        return templates.findAllByOrderByNameAscLanguageCodeAsc().stream().map(TemplateResponse::from).toList();
    }

    @Transactional
    List<TemplateResponse> synchronize() {
        KidsChampWhatsAppAdminService.ActiveConfig active = whatsapp.requireActive();
        List<MetaTemplate> remote = fetchAll(active);
        for (MetaTemplate value : remote) {
            KidsChampWhatsAppTemplateEntity entity = templates
                .findByNameAndLanguageCode(value.name(), value.languageCode())
                .orElseGet(KidsChampWhatsAppTemplateEntity::new);
            entity.synchronize(value.id(), value.name(), value.languageCode(), value.category(),
                value.status(), value.body(), value.variables());
            if ("hello_world".equals(value.name()) || visiblyCorrupted(value)) entity.setDisabled(true);
            templates.save(entity);
        }
        return list();
    }

    @Transactional
    TemplateResponse setDisabled(UUID id, boolean disabled) {
        KidsChampWhatsAppTemplateEntity entity = templates.findByPublicId(id)
            .orElseThrow(() -> bad("WHATSAPP_TEMPLATE_NOT_FOUND", "The selected WhatsApp template was not found."));
        MetaTemplate current = new MetaTemplate(entity.getMetaTemplateId(), entity.getName(), entity.getLanguageCode(),
            entity.getCategory(), entity.getStatus(), entity.getBody(), entity.getVariables());
        if (!disabled && ("hello_world".equals(entity.getName()) || visiblyCorrupted(current))) {
            throw bad("WHATSAPP_TEMPLATE_UNUSABLE", "This template cannot be enabled for the connected production number.");
        }
        entity.setDisabled(disabled);
        return TemplateResponse.from(entity);
    }

    @Transactional(readOnly = true)
    CampaignTemplate requireApproved(UUID id, List<String> parameters) {
        if (id == null) throw bad("WHATSAPP_TEMPLATE_REQUIRED", "Choose an approved WhatsApp template.");
        KidsChampWhatsAppTemplateEntity entity = templates.findByPublicId(id)
            .orElseThrow(() -> bad("WHATSAPP_TEMPLATE_NOT_FOUND", "The selected WhatsApp template was not found."));
        if (!"APPROVED".equalsIgnoreCase(entity.getStatus()) || entity.isDisabled()) {
            throw bad("WHATSAPP_TEMPLATE_UNAVAILABLE", "Choose an approved and enabled WhatsApp template.");
        }
        List<String> values = parameters == null ? List.of() : parameters.stream().map(value -> value == null ? "" : value.trim()).toList();
        if (values.size() != entity.getVariables().size() || values.stream().anyMatch(String::isBlank)) {
            throw bad("WHATSAPP_TEMPLATE_VALUES_INVALID",
                "Complete all " + entity.getVariables().size() + " values required by this WhatsApp template.");
        }
        return new CampaignTemplate(entity.getPublicId(), entity.getName(), entity.getLanguageCode(),
            entity.getBody(), entity.getVariables(), values);
    }

    @Transactional(readOnly = true)
    ReadinessResponse readiness() {
        KidsChampWhatsAppAdminService.ConfigResponse config = whatsapp.config();
        long approved = templates.findAllByOrderByNameAscLanguageCodeAsc().stream()
            .filter(value -> "APPROVED".equalsIgnoreCase(value.getStatus()) && !value.isDisabled()).count();
        List<String> issues = new ArrayList<>();
        if (!config.tokenConfigured() || config.phoneNumberId().isBlank() || config.businessAccountId().isBlank()) {
            issues.add("Complete the WhatsApp API account settings.");
        }
        if (approved == 0) issues.add("Synchronize at least one approved Meta template.");
        return new ReadinessResponse(issues.isEmpty(), config.tokenConfigured(), approved, issues);
    }

    private List<MetaTemplate> fetchAll(KidsChampWhatsAppAdminService.ActiveConfig active) {
        List<MetaTemplate> values = new ArrayList<>();
        String next = null;
        int pages = 0;
        try {
            do {
                String payload = next == null
                    ? whatsapp.graph().get().uri(
                        "/{version}/{account}/message_templates?fields=id,name,status,category,language,components&limit=100",
                        active.version(), active.businessAccountId())
                        .header("Authorization", "Bearer " + active.token()).retrieve().body(String.class)
                    : whatsapp.graph().get().uri(URI.create(next))
                        .header("Authorization", "Bearer " + active.token()).retrieve().body(String.class);
                JsonNode response = parse(payload);
                if (response == null || !response.path("data").isArray()) {
                    throw new IllegalStateException("Meta returned an invalid template response.");
                }
                for (JsonNode item : response.path("data")) values.add(meta(item));
                next = response.path("paging").path("next").asText("");
                pages++;
            } while (!next.isBlank() && pages < 25);
            if (!next.isBlank()) throw new IllegalStateException("Meta returned too many template pages.");
            return values;
        } catch (RuntimeException error) {
            log.warn("WhatsApp template synchronization failed: {}", error.getMessage(), error);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "WHATSAPP_TEMPLATE_SYNC_FAILED",
                KidsChampWhatsAppAdminService.friendly(error));
        }
    }

    private static JsonNode parse(String payload) {
        try {
            return JSON.readTree(payload == null ? "" : payload);
        } catch (Exception error) {
            throw new IllegalStateException("Meta returned unreadable template data.", error);
        }
    }

    private static MetaTemplate meta(JsonNode item) {
        String body = "";
        for (JsonNode component : item.path("components")) {
            if ("BODY".equalsIgnoreCase(component.path("type").asText())) {
                body = component.path("text").asText("");
                break;
            }
        }
        Set<String> found = new LinkedHashSet<>();
        Matcher matcher = VARIABLE.matcher(body);
        while (matcher.find()) found.add(matcher.group(1));
        List<String> variables = found.stream().sorted(Comparator.comparingInt(Integer::parseInt)).toList();
        return new MetaTemplate(
            item.path("id").asText(null),
            item.path("name").asText(""),
            item.path("language").asText(""),
            item.path("category").asText("UNKNOWN").toUpperCase(Locale.ROOT),
            item.path("status").asText("UNKNOWN").toUpperCase(Locale.ROOT),
            body,
            variables
        );
    }

    private static boolean visiblyCorrupted(MetaTemplate template) {
        if (!template.languageCode().toLowerCase(Locale.ROOT).startsWith("si")) return false;
        long questionMarks = template.body().chars().filter(value -> value == '?').count();
        long nonAscii = template.body().chars().filter(value -> value > 127).count();
        return questionMarks >= 10 && nonAscii == 0;
    }

    private static ApiException bad(String code, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, code, message);
    }

    private record MetaTemplate(String id, String name, String languageCode, String category,
                                String status, String body, List<String> variables) {}
    record CampaignTemplate(UUID id, String name, String languageCode, String body,
                            List<String> variables, List<String> parameters) {}
    record ReadinessResponse(boolean ready, boolean tokenConfigured, long approvedTemplateCount,
                             List<String> issues) {}
    record TemplateResponse(UUID id, String metaTemplateId, String name, String languageCode,
                            String category, String status, String body, List<String> variables,
                            boolean disabled, java.time.Instant syncedAt) {
        static TemplateResponse from(KidsChampWhatsAppTemplateEntity entity) {
            return new TemplateResponse(entity.getPublicId(), entity.getMetaTemplateId(), entity.getName(),
                entity.getLanguageCode(), entity.getCategory(), entity.getStatus(), entity.getBody(),
                entity.getVariables(), entity.isDisabled(), entity.getSyncedAt());
        }
    }
}
