package lk.apluskids.platform.kidschamp;

import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class KidsChampWhatsAppCampaignStatus {
    private static final Set<String> SUCCESS = Set.of("SENT", "DELIVERED", "READ");
    private static final Set<String> IGNORED = Set.of("SKIPPED", "DELETED");
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampMessageDeliveryEventRepository events;

    KidsChampWhatsAppCampaignStatus(KidsChampMessageRecipientRepository recipients, KidsChampMessageDeliveryEventRepository events) {
        this.recipients = recipients; this.events = events;
    }

    @Transactional
    String recalculate(KidsChampMessageCampaignEntity campaign) {
        List<KidsChampMessageRecipientEntity> values = recipients.findAllByCampaignPublicIdOrderByIdAsc(campaign.getPublicId());
        boolean queued = values.stream().anyMatch(value -> "QUEUED".equals(value.getStatus()));
        boolean sending = values.stream().anyMatch(value -> "SENDING".equals(value.getStatus()));
        boolean success = values.stream().anyMatch(value -> SUCCESS.contains(value.getStatus()));
        boolean failed = values.stream().anyMatch(value -> "FAILED".equals(value.getStatus()));
        boolean ignored = values.stream().anyMatch(value -> IGNORED.contains(value.getStatus()));
        String next = sending ? "SENDING" : queued ? "QUEUED" : failed && (success || ignored) ? "PARTIAL" : failed ? "FAILED" : success ? "COMPLETED" : "CANCELLED";
        campaign.status(next); return next;
    }

    void event(KidsChampMessageRecipientEntity recipient, String status, String providerStatus, String details) {
        event(recipient, status, providerStatus, details, null);
    }

    void event(KidsChampMessageRecipientEntity recipient, String status, String providerStatus, String details, Instant providerTimestamp) {
        events.save(KidsChampMessageDeliveryEventEntity.create(recipient, status, providerStatus, details, providerTimestamp));
    }

    Counts counts(KidsChampMessageCampaignEntity campaign) {
        List<KidsChampMessageRecipientEntity> values = recipients.findAllByCampaignPublicIdOrderByIdAsc(campaign.getPublicId());
        return new Counts(
            count(values, "QUEUED"), count(values, "SENDING"), count(values, "SENT"),
            count(values, "DELIVERED"), count(values, "READ"), count(values, "FAILED"),
            values.stream().filter(value -> IGNORED.contains(value.getStatus())).count()
        );
    }

    private static long count(List<KidsChampMessageRecipientEntity> values, String status) { return values.stream().filter(value -> status.equals(value.getStatus())).count(); }
    record Counts(long queued, long sending, long accepted, long delivered, long read, long failed, long ignored) {}
}
