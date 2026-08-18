package lk.apluskids.platform.kidschamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "kids_champ_message_delivery_events")
class KidsChampMessageDeliveryEventEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private KidsChampMessageRecipientEntity recipient;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "provider_status", length = 40)
    private String providerStatus;

    @Column(nullable = false)
    private int attempt;

    @Column(length = 600)
    private String details;

    @Column(name = "provider_timestamp")
    private Instant providerTimestamp;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @PrePersist
    void insert() {
        if (occurredAt == null) occurredAt = Instant.now();
    }

    void record(KidsChampMessageRecipientEntity value, String eventStatus, String externalStatus,
                String eventDetails, Instant externalTimestamp) {
        recipient = value;
        status = eventStatus;
        providerStatus = externalStatus;
        attempt = value.getAttempts();
        details = trim(eventDetails, 600);
        providerTimestamp = externalTimestamp;
        occurredAt = Instant.now();
    }

    private static String trim(String value, int maximum) {
        if (value == null || value.isBlank()) return null;
        return value.substring(0, Math.min(value.length(), maximum));
    }

    Long getId() { return id; }
    String getStatus() { return status; }
    String getProviderStatus() { return providerStatus; }
    int getAttempt() { return attempt; }
    String getDetails() { return details; }
    Instant getProviderTimestamp() { return providerTimestamp; }
    Instant getOccurredAt() { return occurredAt; }
}
