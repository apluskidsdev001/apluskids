package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import lk.apluskids.platform.common.error.ApiException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class KidsChampWhatsAppIntegrationTests {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final AtomicReference<String> SENT_BODY = new AtomicReference<>();
    private static HttpServer meta;

    @Autowired private KidsChampWhatsAppAdminService whatsapp;
    @Autowired private KidsChampWhatsAppTemplateService templates;
    @Autowired private KidsChampWhatsAppTemplateRepository templateRepository;
    @Autowired private KidsChampWhatsAppConfigRepository configRepository;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        ensureMeta();
        registry.add("aplus.whatsapp.graph-base-url", () -> "http://127.0.0.1:" + meta.getAddress().getPort());
        registry.add("aplus.whatsapp.credential-encryption-key", () -> "whatsapp-test-encryption-key-32-characters");
    }

    @BeforeEach
    void reset() {
        templateRepository.deleteAll();
        configRepository.deleteAll();
        SENT_BODY.set(null);
        whatsapp.save(new KidsChampWhatsAppAdminService.ConfigRequest("v25.0", "1203893376148242",
            "1517033336324166", "test-system-user-token"));
    }

    @AfterAll
    static void stopMeta() {
        if (meta != null) meta.stop(0);
    }

    @Test
    void connectionAndTemplateSyncUseTheConfiguredMetaAccount() {
        var connection = whatsapp.connectionTest();
        assertTrue(connection.success());
        assertEquals("Shehan", connection.message().replace("Connected to Meta as ", "").replace(".", ""));
        assertEquals("GREEN", connection.qualityRating());

        var synchronizedTemplates = templates.synchronize();
        assertEquals(3, synchronizedTemplates.size());
        var english = synchronizedTemplates.stream().filter(value -> value.name().equals("kids_champ_telecast_en")).findFirst().orElseThrow();
        var sinhala = synchronizedTemplates.stream().filter(value -> value.name().equals("kids_champ_telecast_si")).findFirst().orElseThrow();
        var hello = synchronizedTemplates.stream().filter(value -> value.name().equals("hello_world")).findFirst().orElseThrow();
        assertEquals("APPROVED", english.status());
        assertFalse(english.disabled());
        assertEquals(List.of("1", "2", "3"), english.variables());
        assertTrue(sinhala.disabled(), "A visibly corrupted Sinhala body must not be offered for campaigns.");
        assertTrue(hello.disabled(), "Meta's hello_world template is unavailable from production phone numbers.");
        assertTrue(templates.readiness().ready());

        assertThrows(ApiException.class,
            () -> templates.requireApproved(english.id(), List.of("only one value")));
    }

    @Test
    void approvedTemplateTestBuildsTheExpectedMetaPayload() throws Exception {
        var english = templates.synchronize().stream()
            .filter(value -> value.name().equals("kids_champ_telecast_en")).findFirst().orElseThrow();
        var approved = templates.requireApproved(english.id(), List.of("Test Admin", "Connection Test", "August 14, 2026"));
        var result = whatsapp.testTemplate("0740532502", approved.name(), approved.languageCode(), approved.parameters());
        assertTrue(result.success());
        assertEquals("wamid.test-message", result.providerMessageId());

        JsonNode body = JSON.readTree(SENT_BODY.get());
        assertEquals("94740532502", body.path("to").asText());
        assertEquals("template", body.path("type").asText());
        assertEquals("kids_champ_telecast_en", body.path("template").path("name").asText());
        assertEquals("en_US", body.path("template").path("language").path("code").asText());
        assertEquals(3, body.path("template").path("components").path(0).path("parameters").size());
    }

    @Test
    void switchingWabaRemovesOnlyTheOldTemplateCache() {
        templates.synchronize();
        assertEquals(3, templateRepository.count());
        whatsapp.save(new KidsChampWhatsAppAdminService.ConfigRequest("v25.0", "999999999999",
            "888888888888", "replacement-token"));
        assertEquals(0, templateRepository.count());
        assertTrue(whatsapp.config().tokenConfigured());
    }

    private static synchronized void ensureMeta() {
        if (meta != null) return;
        try {
            meta = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            meta.createContext("/v25.0/1517033336324166/phone_numbers", exchange -> respond(exchange, 200,
                "{\"data\":[{\"id\":\"1203893376148242\",\"display_phone_number\":\"+94 71 436 7530\",\"verified_name\":\"Shehan\",\"quality_rating\":\"GREEN\"}]}"));
            meta.createContext("/v25.0/1517033336324166/message_templates", exchange -> respond(exchange, 200,
                "{\"data\":["
                    + "{\"id\":\"1\",\"name\":\"kids_champ_telecast_en\",\"language\":\"en_US\",\"category\":\"UTILITY\",\"status\":\"APPROVED\",\"components\":[{\"type\":\"BODY\",\"text\":\"Hello {{1}}, your Kids Champ artwork ({{2}}) is scheduled for telecast on {{3}}.\"}]},"
                    + "{\"id\":\"2\",\"name\":\"kids_champ_telecast_si\",\"language\":\"si_LK\",\"category\":\"MARKETING\",\"status\":\"APPROVED\",\"components\":[{\"type\":\"BODY\",\"text\":\"???????????? {{1}} ???????????? {{2}} ???????????? {{3}} ???????????? {{4}}\"}]},"
                    + "{\"id\":\"3\",\"name\":\"hello_world\",\"language\":\"en_US\",\"category\":\"UTILITY\",\"status\":\"APPROVED\",\"components\":[{\"type\":\"BODY\",\"text\":\"Welcome and congratulations!\"}]}"
                    + "]}"));
            meta.createContext("/v25.0/1203893376148242/messages", exchange -> {
                SENT_BODY.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                respond(exchange, 200, "{\"messages\":[{\"id\":\"wamid.test-message\"}]}");
            });
            meta.setExecutor(Executors.newCachedThreadPool());
            meta.start();
        } catch (IOException error) {
            throw new ExceptionInInitializerError(error);
        }
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] value = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, value.length);
        exchange.getResponseBody().write(value);
        exchange.close();
    }
}
