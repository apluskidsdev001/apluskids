package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "kids_champ_message_delivery_events")
class KidsChampMessageDeliveryEventEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "recipient_id", nullable = false) private KidsChampMessageRecipientEntity recipient;
    @Column(nullable = false, length = 24) private String status;
    @Column(name = "provider_status", length = 40) private String providerStatus;
    @Column(nullable = false) private int attempt;
    @Column(length = 600) private String details;
    @Column(name = "provider_timestamp") private Instant providerTimestamp;
    @Column(name = "occurred_at", nullable = false, insertable = false, updatable = false) private Instant occurredAt;

    static KidsChampMessageDeliveryEventEntity create(KidsChampMessageRecipientEntity recipient, String status, String providerStatus, String details, Instant providerTimestamp) {
        KidsChampMessageDeliveryEventEntity value = new KidsChampMessageDeliveryEventEntity();
        value.recipient = recipient; value.status = status; value.providerStatus = providerStatus;
        value.attempt = recipient.getAttempts(); value.details = details == null ? null : details.substring(0, Math.min(details.length(), 600));
        value.providerTimestamp = providerTimestamp; return value;
    }
    Long getId() { return id; } String getStatus() { return status; } String getProviderStatus() { return providerStatus; }
    int getAttempt() { return attempt; } String getDetails() { return details; }
    Instant getProviderTimestamp() { return providerTimestamp; } Instant getOccurredAt() { return occurredAt; }
}
