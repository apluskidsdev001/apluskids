package lk.apluskids.platform.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class DatabaseHealthControllerTests {
    @Test
    void reportsUpOnlyAfterTheDatabaseResponds() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(1);

        assertEquals("UP", new DatabaseHealthController(jdbc).health().status());
    }

    @Test
    void hidesDatabaseFailureDetailsBehindAServiceUnavailableResponse() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenThrow(new IllegalStateException("sensitive connection detail"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
            () -> new DatabaseHealthController(jdbc).health());
        assertEquals(503, error.getStatusCode().value());
        assertEquals("The database is temporarily unavailable.", error.getReason());
    }
}
