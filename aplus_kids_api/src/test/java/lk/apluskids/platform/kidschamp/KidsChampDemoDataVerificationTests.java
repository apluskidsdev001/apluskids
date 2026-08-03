package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class KidsChampDemoDataVerificationTests {
    @Autowired UserRepository users;
    @Autowired KidsChampGuestContactRepository guests;
    @Autowired KidsChampSubmissionRepository submissions;

    @Test void demoSeedCreatedRegisteredAndGuestOperationalRecords(){
        assertTrue(users.existsByEmailIgnoreCase("demo.parent1@apluskids.test"),"Demo registered family was not seeded.");
        assertTrue(guests.findByPhoneE164("+94771100001").isPresent(),"Demo guest contact was not seeded.");
        assertTrue(submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().anyMatch(item->item.getTrackingCode().startsWith("DEMO-")),"Demo submissions were not seeded.");
    }
}
