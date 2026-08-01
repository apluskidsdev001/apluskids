package lk.apluskids.platform.consent;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "consent_records")
public class ConsentRecordEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 48)
    private ConsentType consentType;

    @Column(name = "policy_version", nullable = false, length = 40)
    private String policyVersion;

    @Column(nullable = false)
    private boolean accepted;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(nullable = false, length = 40)
    private String source;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void beforeInsert() {
        if (publicId == null) publicId = UUID.randomUUID();
        if (recordedAt == null) recordedAt = Instant.now();
        if (source == null) source = "WEB_REGISTRATION";
    }

    public void setUser(UserEntity value) { user = value; }
    public void setConsentType(ConsentType value) { consentType = value; }
    public void setPolicyVersion(String value) { policyVersion = value; }
    public void setAccepted(boolean value) { accepted = value; }
}
