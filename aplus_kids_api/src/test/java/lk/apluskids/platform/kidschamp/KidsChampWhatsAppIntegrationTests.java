package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class KidsChampWhatsAppIntegrationTests {
    @Autowired KidsChampAdminService admin;
    @Autowired UserRepository users;

    @Test
    void explicitOptOutOverridesHistoricalSubmissionConsent() {
        var actor = users.findAll().stream().findFirst().orElseThrow();
        var participant = admin.participants().stream().findFirst().orElseThrow();
        var preference = admin.updateWhatsAppPreference(actor.getPublicId(), participant.id(), "OPTED_OUT", "Guardian requested no further messages");
        assertEquals("OPTED_OUT", preference.status());
        assertEquals("OPTED_OUT", admin.participants().stream().filter(value -> value.id().equals(participant.id())).findFirst().orElseThrow().whatsappConsentStatus());

        ApiException denied = assertThrows(ApiException.class, () -> admin.createCampaign(actor.getPublicId(), "WHATSAPP", "Hello {name}", List.of(participant.id())));
        assertEquals("WHATSAPP_CONSENT_REQUIRED", denied.getCode());
    }

    @Test
    void createsOneCampaignAndQueuedTimelineForTheWholeAudience() {
        var actor = users.findAll().stream().findFirst().orElseThrow();
        var audience = admin.participants().stream().limit(2).toList();
        assertEquals(2, audience.size());
        audience.forEach(value -> admin.updateWhatsAppPreference(actor.getPublicId(), value.id(), "OPTED_IN", null));

        var campaign = admin.createCampaign(actor.getPublicId(), "WHATSAPP", "Hello {name}, reference {reference}", audience.stream().map(KidsChampAdminService.ParticipantResponse::id).toList(), null, null, null, "Integration campaign", "TEST");
        assertEquals(2, campaign.recipientCount());
        assertEquals("QUEUED", campaign.status());
        var recipients = admin.campaignRecipients(campaign.id());
        assertEquals(2, recipients.size());
        recipients.forEach(recipient -> {
            assertEquals("QUEUED", recipient.status());
            var timeline = admin.recipientEvents(recipient.id());
            assertEquals(1, timeline.size());
            assertEquals("QUEUED", timeline.getFirst().status());
        });
    }
}
