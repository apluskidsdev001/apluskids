package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Entity
@Table(name = "kids_champ_message_recipients")
class KidsChampMessageRecipientEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "campaign_id", nullable = false) private KidsChampMessageCampaignEntity campaign;
    @Column(name = "participant_reference", nullable = false) private UUID participantReference;
    @Column(name = "participant_name", nullable = false, length = 120) private String participantName;
    @Column(nullable = false, length = 254) private String destination;
    @Column(name = "rendered_message", nullable = false, length = 1200) private String renderedMessage;
    @Column(name = "template_name", length = 120) private String templateName;
    @Column(name = "template_language_code", length = 20) private String templateLanguageCode;
    @Column(name = "template_parameters", columnDefinition = "TEXT") private String templateParameters;
    @Column(nullable = false, length = 24) private String status;
    @Column(nullable = false) private int attempts;
    @Column(name = "provider_message_id", length = 160) private String providerMessageId;
    @Column(name = "failure_reason", length = 600) private String failureReason;
    @Column(name = "sent_at") private Instant sentAt;
    @Column(name = "last_attempt_at") private Instant lastAttemptAt;
    @Column(name = "next_attempt_at", nullable = false) private Instant nextAttemptAt;
    @Column(name = "delivered_at") private Instant deliveredAt;
    @Column(name = "read_at") private Instant readAt;

    void create(KidsChampMessageCampaignEntity campaign, UUID reference, String name, String destination, String message,
                String templateName, String languageCode, List<String> parameters) {
        this.campaign = campaign; participantReference = reference; participantName = name; this.destination = destination;
        renderedMessage = message; this.templateName = templateName; templateLanguageCode = languageCode;
        templateParameters = parameters == null ? null : String.join("\u001F", parameters);
        status = "QUEUED"; nextAttemptAt = Instant.now();
    }

    void sending() { status = "SENDING"; attempts++; lastAttemptAt = Instant.now(); failureReason = null; }
    void sent(String messageId) { status = "SENT"; providerMessageId = messageId; sentAt = Instant.now(); failureReason = null; }
    boolean delivered(Instant providerTime) {
        if ("READ".equals(status)) return false;
        if (!Set.of("SENT", "DELIVERED").contains(status)) return false;
        if ("DELIVERED".equals(status)) return false;
        status = "DELIVERED"; deliveredAt = providerTime == null ? Instant.now() : providerTime; return true;
    }
    boolean read(Instant providerTime) {
        if ("READ".equals(status) || !Set.of("SENT", "DELIVERED").contains(status)) return false;
        status = "READ"; readAt = providerTime == null ? Instant.now() : providerTime;
        if (deliveredAt == null) deliveredAt = readAt; return true;
    }
    boolean failed(String reason) {
        String safe = reason == null ? "Provider rejected the message." : reason.substring(0, Math.min(reason.length(), 600));
        if ("FAILED".equals(status) && Objects.equals(failureReason, safe)) return false;
        status = "FAILED"; failureReason = safe; return true;
    }
    void retry() {
        if (!"FAILED".equals(status)) throw new IllegalStateException("Only failed messages can be retried.");
        if (attempts >= 3) throw new IllegalStateException("This message has reached the maximum of three delivery attempts.");
        status = "QUEUED"; failureReason = null;
        long delaySeconds = attempts <= 1 ? 30 : 120;
        nextAttemptAt = Instant.now().plus(delaySeconds, ChronoUnit.SECONDS);
    }
    void skip() { if (!"FAILED".equals(status)) throw new IllegalStateException("Only failed messages can be ignored."); status = "SKIPPED"; }
    void delete() { if (!"FAILED".equals(status)) throw new IllegalStateException("Only failed messages can be deleted."); status = "DELETED"; }
    boolean recoverIfStale(Instant cutoff) {
        if (!"SENDING".equals(status) || lastAttemptAt == null || !lastAttemptAt.isBefore(cutoff)) return false;
        status = attempts >= 3 ? "FAILED" : "QUEUED";
        failureReason = attempts >= 3 ? "Delivery interrupted and the maximum attempt count was reached." : "Delivery resumed after an application restart.";
        nextAttemptAt = Instant.now(); return true;
    }

    Long getId() { return id; } KidsChampMessageCampaignEntity getCampaign() { return campaign; }
    UUID getParticipantReference() { return participantReference; } String getDestination() { return destination; }
    String getRenderedMessage() { return renderedMessage; } String getTemplateName() { return templateName; }
    String getTemplateLanguageCode() { return templateLanguageCode; }
    List<String> getTemplateParameters() { return templateParameters == null || templateParameters.isBlank() ? List.of() : List.of(templateParameters.split("\u001F", -1)); }
    String getProviderMessageId() { return providerMessageId; } String getStatus() { return status; }
    int getAttempts() { return attempts; } String getFailureReason() { return failureReason; }
    String getParticipantName() { return participantName; } Instant getSentAt() { return sentAt; }
    Instant getLastAttemptAt() { return lastAttemptAt; } Instant getNextAttemptAt() { return nextAttemptAt; }
    Instant getDeliveredAt() { return deliveredAt; } Instant getReadAt() { return readAt; }
}
