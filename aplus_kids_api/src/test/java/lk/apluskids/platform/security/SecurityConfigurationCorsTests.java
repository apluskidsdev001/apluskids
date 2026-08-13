package lk.apluskids.platform.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

class SecurityConfigurationCorsTests {
    private final SecurityConfiguration security = new SecurityConfiguration();

    @Test
    void allowsConfiguredOriginAndSameServerPrivateNetworkOrigin() {
        CorsConfiguration configured = configurationFor("http://localhost:3000/", "http://localhost:3000", "localhost");
        CorsConfiguration lan = configurationFor("http://localhost:3000/", "http://192.168.1.25:3011", "192.168.1.25");

        assertEquals("http://localhost:3000", configured.checkOrigin("http://localhost:3000"));
        assertEquals("http://192.168.1.25:3011", lan.checkOrigin("http://192.168.1.25:3011"));
        assertTrue(Boolean.TRUE.equals(lan.getAllowCredentials()));
    }

    @Test
    void rejectsPublicAndDifferentLanHostOriginsEvenWhenThePortMatches() {
        CorsConfiguration publicOrigin = configurationFor("http://localhost:3000", "https://untrusted.example", "192.168.1.25");
        CorsConfiguration otherLanHost = configurationFor("http://localhost:3000", "http://192.168.1.99:3000", "192.168.1.25");
        CorsConfiguration invalidPrivateRange = configurationFor("http://localhost:3000", "http://172.15.1.20:3000", "172.15.1.20");

        assertNull(publicOrigin.checkOrigin("https://untrusted.example"));
        assertNull(otherLanHost.checkOrigin("http://192.168.1.99:3000"));
        assertNull(invalidPrivateRange.checkOrigin("http://172.15.1.20:3000"));
    }

    @Test
    void keepsTheExistingMethodsAndHeadersForAdminPatchRequests() {
        CorsConfiguration cors = configurationFor("http://localhost:3000", "http://localhost:3000", "localhost");

        assertEquals(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"), cors.getAllowedMethods());
        assertEquals(List.of("Authorization", "Content-Type", "X-CSRF-TOKEN", "X-Request-ID"), cors.getAllowedHeaders());
        assertEquals(List.of("X-Request-ID"), cors.getExposedHeaders());
        assertEquals(3600L, cors.getMaxAge());
    }

    @Test
    void allowsAnyFrontendPortOnlyWhenItRunsOnTheSamePrivateServerHost() {
        CorsConfiguration port3011 = configurationFor("http://localhost:3000", "http://10.20.30.40:3011", "10.20.30.40");
        CorsConfiguration port3012 = configurationFor("http://localhost:3000", "http://10.20.30.40:3012", "10.20.30.40");
        CorsConfiguration differentHost = configurationFor("http://localhost:3000", "http://10.20.30.41:3011", "10.20.30.40");

        assertEquals("http://10.20.30.40:3011", port3011.checkOrigin("http://10.20.30.40:3011"));
        assertEquals("http://10.20.30.40:3012", port3012.checkOrigin("http://10.20.30.40:3012"));
        assertNull(differentHost.checkOrigin("http://10.20.30.41:3011"));
    }

    @Test
    void treatsLocalhostAndLoopbackAddressesAsTheSameLocalMachine() {
        CorsConfiguration ipv4 = configurationFor("http://localhost:3000", "http://127.0.0.1:3011", "localhost");
        CorsConfiguration ipv6 = configurationFor("http://localhost:3000", "http://[::1]:3012", "localhost");

        assertEquals("http://127.0.0.1:3011", ipv4.checkOrigin("http://127.0.0.1:3011"));
        assertEquals("http://[::1]:3012", ipv6.checkOrigin("http://[::1]:3012"));
    }

    @Test
    void doesNotApplyApiCorsRulesToNonApiPaths() {
        CorsConfigurationSource source = security.corsConfigurationSource("http://localhost:3000");
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");

        assertNull(source.getCorsConfiguration(request));
    }

    private CorsConfiguration configurationFor(String configuredOrigin, String origin, String serverName) {
        CorsConfigurationSource source = security.corsConfigurationSource(configuredOrigin);
        MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/api/v1/admin/kids-champ/batches/example/edited");
        request.addHeader("Origin", origin);
        request.setServerName(serverName);
        CorsConfiguration configuration = source.getCorsConfiguration(request);
        if (configuration == null) {
            throw new AssertionError("CORS configuration was not registered for the API path");
        }
        return configuration;
    }
}
