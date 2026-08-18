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
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "kids_champ_message_campaigns")
class KidsChampMessageCampaignEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true)
    private UUID publicId;

    @Column(nullable = false, length = 20)
    private String channel;

    @Column(name = "message_template", nullable = false, length = 1000)
    private String messageTemplate;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "recipient_count", nullable = false)
    private int recipientCount;

    @Column(length = 160)
    private String name;

    @Column(nullable = false, length = 40)
    private String source;

    @Column(name = "template_name", length = 120)
    private String templateName;

    @Column(name = "language_code", length = 20)
    private String languageCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserEntity createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "queued_at")
    private Instant queuedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    void insert() {
        Instant now = Instant.now();
        if (publicId == null) publicId = UUID.randomUUID();
        if (status == null) status = "QUEUED";
        if (source == null || source.isBlank()) source = "MANUAL";
        if (queuedAt == null) queuedAt = now;
        if (createdAt == null) createdAt = now;
    }

    void create(String campaignChannel, String templateBody, int count, UserEntity actor,
                String campaignName, String campaignSource, String metaTemplateName,
                String templateLanguage) {
        channel = campaignChannel;
        messageTemplate = templateBody;
        recipientCount = count;
        createdBy = actor;
        status = "QUEUED";
        name = campaignName == null || campaignName.isBlank() ? "WhatsApp campaign" : trim(campaignName, 160);
        source = campaignSource == null || campaignSource.isBlank() ? "MANUAL" : trim(campaignSource, 40);
        templateName = metaTemplateName;
        languageCode = templateLanguage;
    }

    void status(String value) {
        status = value;
        completedAt = switch (value) {
            case "COMPLETED", "PARTIAL", "FAILED", "CANCELLED" -> completedAt == null ? Instant.now() : completedAt;
            default -> null;
        };
    }

    private static String trim(String value, int maximum) {
        String clean = value.trim();
        return clean.substring(0, Math.min(clean.length(), maximum));
    }

    Long getId() { return id; }
    UUID getPublicId() { return publicId; }
    String getChannel() { return channel; }
    String getMessageTemplate() { return messageTemplate; }
    String getStatus() { return status; }
    int getRecipientCount() { return recipientCount; }
    String getName() { return name; }
    String getSource() { return source; }
    String getTemplateName() { return templateName; }
    String getLanguageCode() { return languageCode; }
    Instant getCreatedAt() { return createdAt; }
    Instant getCompletedAt() { return completedAt; }
}
