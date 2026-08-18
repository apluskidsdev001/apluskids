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
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "kids_champ_message_recipients")
class KidsChampMessageRecipientEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private KidsChampMessageCampaignEntity campaign;

    @Column(name = "participant_reference", nullable = false)
    private UUID participantReference;

    @Column(name = "participant_name", nullable = false, length = 120)
    private String participantName;

    @Column(nullable = false, length = 254)
    private String destination;

    @Column(name = "rendered_message", nullable = false, length = 1200)
    private String renderedMessage;

    @Column(name = "template_name", length = 120)
    private String templateName;

    @Column(name = "template_language_code", length = 20)
    private String templateLanguageCode;

    @Column(name = "template_parameters", columnDefinition = "text")
    private String templateParameters;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "provider_message_id", length = 160)
    private String providerMessageId;

    @Column(name = "failure_reason", length = 600)
    private String failureReason;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "read_at")
    private Instant readAt;

    @PrePersist
    void insert() {
        if (nextAttemptAt == null) nextAttemptAt = Instant.now();
        if (status == null) status = "QUEUED";
    }

    void create(KidsChampMessageCampaignEntity value, UUID reference, String name, String phone,
                String message, String metaTemplateName, String languageCode, List<String> parameters) {
        campaign = value;
        participantReference = reference;
        participantName = name;
        destination = phone;
        renderedMessage = message;
        templateName = metaTemplateName;
        templateLanguageCode = languageCode;
        templateParameters = parameters == null ? null : String.join("\u001F", parameters);
        status = "QUEUED";
        nextAttemptAt = Instant.now();
    }

    void sending() {
        status = "SENDING";
        attempts++;
        lastAttemptAt = Instant.now();
        failureReason = null;
    }

    void sent(String messageId) {
        status = "SENT";
        providerMessageId = messageId;
        sentAt = Instant.now();
        failureReason = null;
    }

    void delivered(Instant providerTime) {
        if ("SENT".equals(status) || "DELIVERED".equals(status)) status = "DELIVERED";
        if (deliveredAt == null) deliveredAt = providerTime == null ? Instant.now() : providerTime;
    }

    void read(Instant providerTime) {
        if ("SENT".equals(status) || "DELIVERED".equals(status) || "READ".equals(status)) status = "READ";
        if (deliveredAt == null) deliveredAt = providerTime == null ? Instant.now() : providerTime;
        if (readAt == null) readAt = providerTime == null ? Instant.now() : providerTime;
    }

    void failed(String reason) {
        status = "FAILED";
        failureReason = trim(reason == null ? "The messaging provider rejected this message." : reason, 600);
    }

    void retry() {
        if (!"FAILED".equals(status)) throw new IllegalStateException("Only failed messages can be retried.");
        if (attempts >= 3) throw new IllegalStateException("This message has reached the maximum of three delivery attempts.");
        status = "QUEUED";
        failureReason = null;
        nextAttemptAt = Instant.now();
    }

    void skip() {
        if (!"FAILED".equals(status)) throw new IllegalStateException("Only failed messages can be ignored.");
        status = "SKIPPED";
    }

    void delete() {
        if (!"FAILED".equals(status)) throw new IllegalStateException("Only failed messages can be deleted.");
        status = "DELETED";
    }

    private static String trim(String value, int maximum) {
        return value.substring(0, Math.min(value.length(), maximum));
    }

    Long getId() { return id; }
    KidsChampMessageCampaignEntity getCampaign() { return campaign; }
    UUID getParticipantReference() { return participantReference; }
    String getParticipantName() { return participantName; }
    String getDestination() { return destination; }
    String getRenderedMessage() { return renderedMessage; }
    String getTemplateName() { return templateName; }
    String getTemplateLanguageCode() { return templateLanguageCode; }
    List<String> getTemplateParameters() {
        return templateParameters == null || templateParameters.isBlank()
            ? List.of() : List.of(templateParameters.split("\u001F", -1));
    }
    String getProviderMessageId() { return providerMessageId; }
    String getStatus() { return status; }
    int getAttempts() { return attempts; }
    String getFailureReason() { return failureReason; }
    Instant getSentAt() { return sentAt; }
    Instant getLastAttemptAt() { return lastAttemptAt; }
    Instant getNextAttemptAt() { return nextAttemptAt; }
    Instant getDeliveredAt() { return deliveredAt; }
    Instant getReadAt() { return readAt; }
}
