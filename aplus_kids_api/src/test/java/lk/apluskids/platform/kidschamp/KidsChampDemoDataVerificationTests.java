package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class KidsChampDemoDataVerificationTests {
    @Autowired UserRepository users;
    @Autowired KidsChampGuestContactRepository guests;
    @Autowired KidsChampSubmissionRepository submissions;

    @Test void demoSeedCreatedRegisteredAndGuestOperationalRecords(){
        boolean registered=users.existsByEmailIgnoreCase("demo.parent1@apluskids.test");
        boolean guest=guests.findByPhoneE164("+94771100001").isPresent();
        boolean submission=submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream()
            .anyMatch(item->item.getTrackingCode().startsWith("DEMO-"));
        Assumptions.assumeTrue(registered||guest||submission,
            "The optional Kids Champ demo seed is disabled for this test run.");
        assertTrue(registered,"Demo registered family was not seeded.");
        assertTrue(guest,"Demo guest contact was not seeded.");
        assertTrue(submission,"Demo submissions were not seeded.");
    }
}
