package lk.apluskids.platform.kidschamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "kids_champ_whatsapp_templates")
class KidsChampWhatsAppTemplateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true)
    private UUID publicId;

    @Column(name = "meta_template_id", length = 80)
    private String metaTemplateId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "language_code", nullable = false, length = 20)
    private String languageCode;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(columnDefinition = "text")
    private String variables;

    @Column(nullable = false)
    private boolean disabled;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void insert() {
        Instant now = Instant.now();
        if (publicId == null) publicId = UUID.randomUUID();
        if (syncedAt == null) syncedAt = now;
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (body == null) body = "";
    }

    void synchronize(String metaId, String templateName, String language, String templateCategory,
                     String templateStatus, String templateBody, List<String> templateVariables) {
        metaTemplateId = metaId;
        name = templateName;
        languageCode = language;
        category = templateCategory;
        status = templateStatus;
        body = templateBody == null ? "" : templateBody;
        variables = templateVariables == null ? "" : String.join(",", templateVariables);
        syncedAt = Instant.now();
        updatedAt = syncedAt;
    }

    void setDisabled(boolean value) {
        disabled = value;
        updatedAt = Instant.now();
    }

    Long getId() { return id; }
    UUID getPublicId() { return publicId; }
    String getMetaTemplateId() { return metaTemplateId; }
    String getName() { return name; }
    String getLanguageCode() { return languageCode; }
    String getCategory() { return category; }
    String getStatus() { return status; }
    String getBody() { return body; }
    boolean isDisabled() { return disabled; }
    Instant getSyncedAt() { return syncedAt; }
    List<String> getVariables() {
        return variables == null || variables.isBlank()
            ? List.of()
            : Arrays.stream(variables.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
