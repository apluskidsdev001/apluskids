package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class KidsChampWhatsAppMessagingTests {
    private KidsChampMessageRecipientRepository recipients;
    private KidsChampWhatsAppCampaignStatus statuses;
    private KidsChampMessageCampaignEntity campaign;

    @BeforeEach
    void setup() {
        recipients = mock(KidsChampMessageRecipientRepository.class);
        statuses = new KidsChampWhatsAppCampaignStatus(recipients, mock(KidsChampMessageDeliveryEventRepository.class));
        campaign = new KidsChampMessageCampaignEntity();
    }

    @Test
    void deliveredAndFailedRecipientsProducePartialCampaign() {
        var delivered = recipient("Delivered");
        delivered.sending(); delivered.sent("wamid.delivered"); delivered.delivered(Instant.now());
        var failed = recipient("Failed");
        failed.sending(); failed.failed("Invalid recipient");
        when(recipients.findAllByCampaignPublicIdOrderByIdAsc(isNull())).thenReturn(List.of(delivered, failed));

        assertEquals("PARTIAL", statuses.recalculate(campaign));
        assertEquals("PARTIAL", campaign.getStatus());
    }

    @Test
    void deliveredAndReadRecipientsCompleteCampaign() {
        var delivered = recipient("Delivered");
        delivered.sending(); delivered.sent("wamid.delivered"); delivered.delivered(Instant.now());
        var read = recipient("Read");
        read.sending(); read.sent("wamid.read"); read.read(Instant.now());
        when(recipients.findAllByCampaignPublicIdOrderByIdAsc(isNull())).thenReturn(List.of(delivered, read));

        assertEquals("COMPLETED", statuses.recalculate(campaign));
        var counts = statuses.counts(campaign);
        assertEquals(1, counts.delivered());
        assertEquals(1, counts.read());
        assertEquals(0, counts.failed());
    }

    @Test
    void webhookTransitionsAreIdempotent() {
        var value = recipient("Recipient");
        value.sending(); value.sent("wamid.1");
        Instant deliveredAt = Instant.now();
        assertTrue(value.delivered(deliveredAt));
        assertFalse(value.delivered(deliveredAt));
        assertTrue(value.read(deliveredAt.plusSeconds(2)));
        assertFalse(value.read(deliveredAt.plusSeconds(2)));
    }

    @Test
    void failedRecipientCanRetryOnlyThreeAttempts() {
        var value = recipient("Recipient");
        value.sending(); value.failed("first"); value.retry();
        assertEquals("QUEUED", value.getStatus());
        assertNotNull(value.getNextAttemptAt());
        value.sending(); value.failed("second"); value.retry();
        value.sending(); value.failed("third");
        IllegalStateException error = assertThrows(IllegalStateException.class, value::retry);
        assertTrue(error.getMessage().contains("maximum"));
    }

    private KidsChampMessageRecipientEntity recipient(String name) {
        var value = new KidsChampMessageRecipientEntity();
        value.create(campaign, UUID.randomUUID(), name, "+94770000000", "Hello", null, null, null);
        return value;
    }
}
