package lk.apluskids.platform.kidschamp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import lk.apluskids.platform.common.error.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
class KidsChampWhatsAppAdminService {
    private static final Pattern VERSION = Pattern.compile("v[0-9]{1,3}\\.[0-9]+");
    private final KidsChampWhatsAppConfigRepository repository;
    private final KidsChampWhatsAppTemplateRepository templates;
    private final byte[] encryptionKey;
    private final String fallbackVersion;
    private final String fallbackPhoneId;
    private final String fallbackAccountId;
    private final String fallbackToken;
    private final RestClient graph;

    KidsChampWhatsAppAdminService(
        KidsChampWhatsAppConfigRepository repository,
        KidsChampWhatsAppTemplateRepository templates,
        @Value("${aplus.whatsapp.credential-encryption-key:${aplus.auth.jwt-secret}}") String encryptionSecret,
        @Value("${aplus.whatsapp.graph-api-version:v25.0}") String version,
        @Value("${aplus.whatsapp.phone-number-id:}") String phoneId,
        @Value("${aplus.whatsapp.business-account-id:}") String accountId,
        @Value("${aplus.whatsapp.access-token:}") String token,
        @Value("${aplus.whatsapp.graph-base-url:https://graph.facebook.com}") String graphBaseUrl
    ) {
        this.repository = repository;
        this.templates = templates;
        fallbackVersion = version;
        fallbackPhoneId = digits(phoneId);
        fallbackAccountId = digits(accountId);
        fallbackToken = token == null ? "" : token.trim();
        graph = RestClient.builder().baseUrl(graphBaseUrl).build();
        try {
            encryptionKey = MessageDigest.getInstance("SHA-256")
                .digest(required(encryptionSecret, "Credential encryption key").getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }

    @Transactional(readOnly = true)
    ConfigResponse config() {
        return repository.findById((short) 1)
            .map(item -> new ConfigResponse(
                item.getGraphApiVersion(), item.getPhoneNumberId(), item.getBusinessAccountId(), true,
                mask(decrypt(item.getAccessTokenEncrypted())), item.getLastTestStatus(),
                item.getLastTestMessage(), item.getLastTestedAt()
            ))
            .orElse(new ConfigResponse(
                fallbackVersion, fallbackPhoneId, fallbackAccountId, !fallbackToken.isBlank(),
                mask(fallbackToken), null, null, null
            ));
    }

    @Transactional
    ConfigResponse save(ConfigRequest request) {
        String version = required(request.graphApiVersion(), "Graph API version");
        if (!VERSION.matcher(version).matches()) {
            throw bad("WHATSAPP_VERSION_INVALID", "Enter a Graph API version such as v25.0.");
        }
        String phone = requiredDigits(request.phoneNumberId(), "Phone Number ID");
        String account = requiredDigits(request.businessAccountId(), "Business Account ID");
        KidsChampWhatsAppConfigEntity entity = repository.findById((short) 1)
            .orElseGet(KidsChampWhatsAppConfigEntity::new);
        String previousAccount = entity.getId() == null ? fallbackAccountId : entity.getBusinessAccountId();
        String token = request.accessToken() == null || request.accessToken().isBlank()
            ? entity.getId() == null ? fallbackToken : decrypt(entity.getAccessTokenEncrypted())
            : request.accessToken().trim();
        if (token.isBlank()) throw bad("WHATSAPP_TOKEN_REQUIRED", "Enter a permanent Meta access token.");
        entity.save(version, phone, account, encrypt(token));
        repository.save(entity);
        if (!previousAccount.isBlank() && !previousAccount.equals(account)) templates.deleteAll();
        return config();
    }

    @Transactional
    TestResponse testTemplate(String rawPhone, String templateName, String languageCode, List<String> parameters) {
        ActiveConfig active = requireActive();
        String phone = normalizeSriLanka(rawPhone);
        if (phone.length() < 10 || phone.length() > 15) {
            throw bad("WHATSAPP_PHONE_INVALID", "Enter a valid WhatsApp number with its country code.");
        }
        KidsChampWhatsAppConfigEntity entity = repository.findById((short) 1).orElse(null);
        try {
            String id = sendTemplate(active, phone, templateName, languageCode, parameters);
            if (entity != null) entity.testResult(true, "Meta accepted the approved template message.");
            return new TestResponse(true, "Meta accepted the approved template message.", id, Instant.now());
        } catch (RuntimeException error) {
            String message = friendly(error);
            if (entity != null) entity.testResult(false, message);
            return new TestResponse(false, message, null, Instant.now());
        }
    }

    @Transactional
    ConnectionTestResponse connectionTest() {
        ActiveConfig active;
        try {
            active = requireActive();
        } catch (ApiException error) {
            return new ConnectionTestResponse(false, error.getMessage(), List.of(
                "Enter the WABA ID, Phone Number ID and a permanent access token.",
                "Save the account before testing the connection."
            ), Instant.now(), null, null);
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = graph.get()
                .uri("/{version}/{account}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating", active.version(), active.businessAccountId())
                .header("Authorization", "Bearer " + active.token())
                .retrieve().body(Map.class);
            Map<?, ?> matched = phoneRecords(response).stream()
                .filter(item -> active.phoneNumberId().equals(Objects.toString(item.get("id"), "")))
                .findFirst().orElse(null);
            if (matched == null) {
                return new ConnectionTestResponse(false,
                    "The Phone Number ID does not belong to the configured WhatsApp Business Account.",
                    List.of("Copy both IDs from the same WhatsApp Business Account in Meta."),
                    Instant.now(), null, null);
            }
            String name = Objects.toString(matched.get("verified_name"), "");
            String number = Objects.toString(matched.get("display_phone_number"), "");
            String quality = Objects.toString(matched.get("quality_rating"), "");
            String message = name.isBlank() ? "Meta connection is working." : "Connected to Meta as " + name + ".";
            return new ConnectionTestResponse(true, message, List.of(), Instant.now(), number, quality);
        } catch (RuntimeException error) {
            return new ConnectionTestResponse(false, friendly(error), List.of(
                "Confirm the token has whatsapp_business_messaging and whatsapp_business_management permissions.",
                "Generate a new permanent system-user token if the current token has expired.",
                "Confirm the WABA and Phone Number IDs belong to the same Meta account."
            ), Instant.now(), null, null);
        }
    }

    @Transactional(readOnly = true)
    ActiveConfig active() {
        return repository.findById((short) 1)
            .map(item -> new ActiveConfig(
                item.getGraphApiVersion(), item.getPhoneNumberId(), item.getBusinessAccountId(),
                decrypt(item.getAccessTokenEncrypted())
            ))
            .orElse(new ActiveConfig(fallbackVersion, fallbackPhoneId, fallbackAccountId, fallbackToken));
    }

    ActiveConfig requireActive() {
        ActiveConfig active = active();
        if (active.phoneNumberId().isBlank() || active.businessAccountId().isBlank() || active.token().isBlank()) {
            throw bad("WHATSAPP_NOT_CONFIGURED", "Complete the WhatsApp API account settings before sending messages.");
        }
        return active;
    }

    RestClient graph() { return graph; }

    String send(ActiveConfig active, String destination, String message) {
        requireSendConfig(active);
        @SuppressWarnings("unchecked")
        Map<String, Object> response = graph.post().uri("/{version}/{id}/messages", active.version(), active.phoneNumberId())
            .header("Authorization", "Bearer " + active.token()).contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "messaging_product", "whatsapp", "recipient_type", "individual", "to", digits(destination),
                "type", "text", "text", Map.of("preview_url", false, "body", message)
            )).retrieve().body(Map.class);
        return providerMessageId(response);
    }

    String sendTemplate(ActiveConfig active, String destination, String name, String languageCode,
                        List<String> parameters) {
        requireSendConfig(active);
        List<Map<String, String>> values = parameters == null ? List.of() : parameters.stream()
            .map(value -> Map.of("type", "text", "text", value)).toList();
        Map<String, Object> template = new LinkedHashMap<>();
        template.put("name", name);
        template.put("language", Map.of("code", languageCode));
        if (!values.isEmpty()) template.put("components", List.of(Map.of("type", "body", "parameters", values)));
        @SuppressWarnings("unchecked")
        Map<String, Object> response = graph.post().uri("/{version}/{id}/messages", active.version(), active.phoneNumberId())
            .header("Authorization", "Bearer " + active.token()).contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("messaging_product", "whatsapp", "to", digits(destination), "type", "template", "template", template))
            .retrieve().body(Map.class);
        return providerMessageId(response);
    }

    private static List<Map<?, ?>> phoneRecords(Map<String, Object> response) {
        Object data = response == null ? null : response.get("data");
        if (!(data instanceof List<?> list)) return List.of();
        List<Map<?, ?>> values = new ArrayList<>();
        for (Object item : list) if (item instanceof Map<?, ?> map) values.add(map);
        return values;
    }

    private static String providerMessageId(Map<String, Object> response) {
        Object messages = response == null ? null : response.get("messages");
        if (messages instanceof List<?> list && !list.isEmpty() && list.getFirst() instanceof Map<?, ?> value
            && value.get("id") != null) return value.get("id").toString();
        throw new IllegalStateException("Meta did not return a message ID.");
    }

    private static void requireSendConfig(ActiveConfig active) {
        if (active.phoneNumberId().isBlank() || active.token().isBlank()) {
            throw bad("WHATSAPP_NOT_CONFIGURED", "Complete the WhatsApp API account settings before sending messages.");
        }
    }

    private String encrypt(String value) {
        try {
            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(128, iv));
            return Base64.getEncoder().encodeToString(iv) + "."
                + Base64.getEncoder().encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception error) {
            throw new IllegalStateException("Token encryption failed.", error);
        }
    }

    private String decrypt(String value) {
        try {
            String[] parts = value.split("\\.", 2);
            byte[] iv = Base64.getDecoder().decode(parts[0]);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(Base64.getDecoder().decode(parts[1])), StandardCharsets.UTF_8);
        } catch (Exception error) {
            throw new IllegalStateException("Saved WhatsApp credentials could not be decrypted.", error);
        }
    }

    static String friendly(RuntimeException error) {
        if (error instanceof ApiException api) return api.getMessage();
        if (error instanceof RestClientResponseException response) {
            int status = response.getStatusCode().value();
            String lower = response.getResponseBodyAsString().toLowerCase();
            if (lower.contains("access token") || lower.contains("oauth") || status == 401 || status == 403) {
                return "The Meta access token is invalid, expired, or missing a required permission.";
            }
            if (lower.contains("phone number id") || lower.contains("unsupported post request")) {
                return "The configured Meta Phone Number ID could not be used.";
            }
            if (lower.contains("template") && (lower.contains("parameter") || lower.contains("param"))) {
                return "The template values do not match the approved Meta template.";
            }
            if (status == 429) return "Meta is temporarily limiting requests. Try again shortly.";
            return "Meta rejected the WhatsApp request. Review the account configuration and try again.";
        }
        return "The WhatsApp service could not complete the request. Try again shortly.";
    }

    private static String required(String value, String label) {
        if (value == null || value.isBlank()) throw bad("WHATSAPP_FIELD_REQUIRED", label + " is required.");
        return value.trim();
    }

    private static String requiredDigits(String value, String label) {
        String result = digits(value);
        if (result.isBlank()) throw bad("WHATSAPP_FIELD_REQUIRED", label + " is required.");
        return result;
    }

    static String digits(String value) { return value == null ? "" : value.replaceAll("[^0-9]", ""); }
    static String normalizeSriLanka(String value) {
        String phone = digits(value);
        return phone.startsWith("0") ? "94" + phone.substring(1) : phone;
    }
    private static String mask(String value) {
        if (value == null || value.isBlank()) return "";
        return value.substring(0, Math.min(6, value.length())) + "••••••••";
    }
    private static ApiException bad(String code, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, code, message);
    }

    record ActiveConfig(String version, String phoneNumberId, String businessAccountId, String token) {}
    record ConfigRequest(String graphApiVersion, String phoneNumberId, String businessAccountId, String accessToken) {}
    record ConfigResponse(String graphApiVersion, String phoneNumberId, String businessAccountId,
                          boolean tokenConfigured, String maskedToken, String lastTestStatus,
                          String lastTestMessage, Instant lastTestedAt) {}
    record TestResponse(boolean success, String message, String providerMessageId, Instant testedAt) {}
    record ConnectionTestResponse(boolean success, String message, List<String> solutions, Instant testedAt,
                                  String displayPhoneNumber, String qualityRating) {}
}
