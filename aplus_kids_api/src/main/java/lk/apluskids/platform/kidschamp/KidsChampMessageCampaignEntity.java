package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "kids_champ_message_campaigns")
class KidsChampMessageCampaignEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, unique = true) private UUID publicId;
    @Column(nullable = false, length = 20) private String channel;
    @Column(name = "message_template", nullable = false, length = 1000) private String messageTemplate;
    @Column(length = 160) private String name;
    @Column(nullable = false, length = 40) private String source;
    @Column(name = "template_name", length = 120) private String templateName;
    @Column(name = "language_code", length = 20) private String languageCode;
    @Column(nullable = false, length = 24) private String status;
    @Column(name = "recipient_count", nullable = false) private int recipientCount;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by_user_id", nullable = false) private UserEntity createdBy;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false) private Instant createdAt;
    @Column(name = "queued_at") private Instant queuedAt;
    @Column(name = "completed_at") private Instant completedAt;

    @PrePersist void insert() { if (publicId == null) publicId = UUID.randomUUID(); if (status == null) status = "QUEUED"; if (queuedAt == null) queuedAt = Instant.now(); }

    void create(String channel, String template, int count, UserEntity actor, String name, String source, String templateName, String languageCode) {
        this.channel = channel; messageTemplate = template; recipientCount = count; createdBy = actor;
        this.name = name == null || name.isBlank() ? "WhatsApp campaign" : name.trim();
        this.source = source == null || source.isBlank() ? "MANUAL" : source.trim().toUpperCase();
        this.templateName = templateName; this.languageCode = languageCode; status = "QUEUED";
    }
    void status(String value) { status = value; completedAt = Set.of("COMPLETED", "FAILED", "CANCELLED").contains(value) ? Instant.now() : null; }

    Long getId() { return id; } UUID getPublicId() { return publicId; } String getChannel() { return channel; }
    String getMessageTemplate() { return messageTemplate; } String getName() { return name; } String getSource() { return source; }
    String getTemplateName() { return templateName; } String getLanguageCode() { return languageCode; }
    String getStatus() { return status; } int getRecipientCount() { return recipientCount; }
    Instant getCreatedAt() { return createdAt; } Instant getCompletedAt() { return completedAt; }
}
