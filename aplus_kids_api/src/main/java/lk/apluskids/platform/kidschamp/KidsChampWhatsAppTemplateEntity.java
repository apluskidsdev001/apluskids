package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "kids_champ_whatsapp_templates", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "language_code"}))
class KidsChampWhatsAppTemplateEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, unique = true) private UUID publicId;
    @Column(name = "meta_template_id", length = 80) private String metaTemplateId;
    @Column(nullable = false, length = 120) private String name;
    @Column(name = "language_code", nullable = false, length = 20) private String languageCode;
    @Column(nullable = false, length = 40) private String category;
    @Column(nullable = false, length = 24) private String status;
    @Column(nullable = false, columnDefinition = "TEXT") private String body;
    @Column(columnDefinition = "TEXT") private String variables;
    @Column(nullable = false) private boolean disabled;
    @Column(name = "synced_at", nullable = false) private Instant syncedAt;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    @PrePersist void insert() { if (publicId == null) publicId = UUID.randomUUID(); if (updatedAt == null) updatedAt = Instant.now(); if (syncedAt == null) syncedAt = updatedAt; }

    void sync(String metaId, String name, String language, String category, String status, String body, java.util.List<String> variables) {
        metaTemplateId = metaId; this.name = name; languageCode = language; this.category = category;
        this.status = status; this.body = body == null ? "" : body;
        this.variables = variables == null ? null : String.join("\u001F", variables);
        syncedAt = Instant.now(); updatedAt = syncedAt;
    }
    void setDisabled(boolean value) { disabled = value; updatedAt = Instant.now(); }
    UUID getPublicId() { return publicId; } String getMetaTemplateId() { return metaTemplateId; }
    String getName() { return name; } String getLanguageCode() { return languageCode; }
    String getCategory() { return category; } String getStatus() { return status; }
    String getBody() { return body; } boolean isDisabled() { return disabled; }
    Instant getSyncedAt() { return syncedAt; }
    java.util.List<String> getVariables() { return variables == null || variables.isBlank() ? java.util.List.of() : java.util.List.of(variables.split("\u001F", -1)); }
}
