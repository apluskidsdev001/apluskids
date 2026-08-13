package lk.apluskids.platform.common;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/health")
public class DatabaseHealthController {
    private final JdbcTemplate jdbc;

    DatabaseHealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    HealthResponse health() {
        try {
            Integer result = jdbc.queryForObject("SELECT 1", Integer.class);
            if (result == null || result != 1) throw new IllegalStateException("Unexpected database response");
            return new HealthResponse("UP");
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The database is temporarily unavailable.");
        }
    }

    record HealthResponse(String status) {}
}
