package lk.apluskids.platform.kidschamp;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class KidsChampParticipantPerformanceTests {
    @Autowired private KidsChampAdminService admin;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @Test
    void participantListDoesNotUseOneQueryPerParticipant() {
        long queries = countQueries(admin::participants);
        assertTrue(queries <= 10, "Participant loading used " + queries + " queries; expected a bounded aggregate load.");
    }

    @Test
    void combinedDuplicateCheckDoesNotUseOneQueryPerCandidatePair() {
        long queries = countQueries(admin::duplicateMatches);
        assertTrue(queries <= 20, "Duplicate analysis used " + queries + " queries; expected batched candidate data.");
    }

    private long countQueries(Runnable operation) {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        boolean previouslyEnabled = statistics.isStatisticsEnabled();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            operation.run();
            return statistics.getQueryExecutionCount();
        } finally {
            statistics.setStatisticsEnabled(previouslyEnabled);
        }
    }
}
