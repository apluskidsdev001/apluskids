package lk.apluskids.platform.kidschamp;

import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class KidsChampWhatsAppDeliveryService {
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampMessageDeliveryEventRepository events;

    KidsChampWhatsAppDeliveryService(KidsChampMessageRecipientRepository recipients,
                                     KidsChampMessageDeliveryEventRepository events) {
        this.recipients = recipients;
        this.events = events;
    }

    void sending(KidsChampMessageRecipientEntity recipient) {
        recipient.sending();
        record(recipient, "SENDING", null, "Delivery attempt started.", null);
        refreshCampaign(recipient);
    }

    void accepted(KidsChampMessageRecipientEntity recipient, String providerMessageId) {
        recipient.sent(providerMessageId);
        record(recipient, "SENT", "accepted", "Meta accepted the message.", null);
        refreshCampaign(recipient);
    }

    void failed(KidsChampMessageRecipientEntity recipient, String reason, String providerStatus,
                Instant providerTimestamp) {
        if ("DELIVERED".equals(recipient.getStatus()) || "READ".equals(recipient.getStatus())) return;
        recipient.failed(reason);
        record(recipient, "FAILED", providerStatus, reason, providerTimestamp);
        refreshCampaign(recipient);
    }

    void providerStatus(String providerMessageId, String status, String details, Instant providerTimestamp) {
        recipients.findByProviderMessageId(providerMessageId).ifPresent(recipient -> {
            String before = recipient.getStatus();
            if ("sent".equals(status)) {
                if (!"SENT".equals(before) && !"DELIVERED".equals(before) && !"READ".equals(before)) return;
            } else if ("delivered".equals(status)) {
                recipient.delivered(providerTimestamp);
            } else if ("read".equals(status)) {
                recipient.read(providerTimestamp);
            } else if ("failed".equals(status)) {
                failed(recipient, details, status, providerTimestamp);
                return;
            } else return;
            String after = recipient.getStatus();
            if (!before.equals(after) || "sent".equals(status)) {
                record(recipient, after, status, details, providerTimestamp);
                refreshCampaign(recipient);
            }
        });
    }

    @Transactional(readOnly = true)
    List<DeliveryEventResponse> events(Long recipientId) {
        if (!recipients.existsById(recipientId)) return List.of();
        return events.findAllByRecipientIdOrderByOccurredAtAscIdAsc(recipientId).stream()
            .map(DeliveryEventResponse::from).toList();
    }

    void recordAction(KidsChampMessageRecipientEntity recipient, String status, String details) {
        record(recipient, status, null, details, null);
        refreshCampaign(recipient);
    }

    void refreshCampaign(KidsChampMessageRecipientEntity recipient) {
        List<KidsChampMessageRecipientEntity> values = recipients
            .findAllByCampaignPublicIdOrderByIdAsc(recipient.getCampaign().getPublicId());
        boolean sending = values.stream().anyMatch(value -> "SENDING".equals(value.getStatus()));
        boolean queued = values.stream().anyMatch(value -> "QUEUED".equals(value.getStatus()));
        boolean success = values.stream().anyMatch(value -> List.of("SENT", "DELIVERED", "READ").contains(value.getStatus()));
        boolean failed = values.stream().anyMatch(value -> "FAILED".equals(value.getStatus()));
        String status = sending ? "SENDING" : queued ? "QUEUED" : failed && success ? "PARTIAL"
            : failed ? "FAILED" : "COMPLETED";
        recipient.getCampaign().status(status);
    }

    private void record(KidsChampMessageRecipientEntity recipient, String status, String providerStatus,
                        String details, Instant providerTimestamp) {
        KidsChampMessageDeliveryEventEntity event = new KidsChampMessageDeliveryEventEntity();
        event.record(recipient, status, providerStatus, details, providerTimestamp);
        events.save(event);
    }

    record DeliveryEventResponse(Long id, String status, String providerStatus, int attempt,
                                 String details, Instant providerTimestamp, Instant occurredAt) {
        static DeliveryEventResponse from(KidsChampMessageDeliveryEventEntity entity) {
            return new DeliveryEventResponse(entity.getId(), entity.getStatus(), entity.getProviderStatus(),
                entity.getAttempt(), entity.getDetails(), entity.getProviderTimestamp(), entity.getOccurredAt());
        }
    }
}
