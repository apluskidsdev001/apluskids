package lk.apluskids.platform.profile;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "profile_action_codes")
public class ProfileActionCodeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ProfileActionPurpose purpose;
    @Column(name = "code_hash", nullable = false, unique = true, length = 64)
    private String codeHash;
    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "consumed_at")
    private Instant consumedAt;
    @Column(name = "revoked_at")
    private Instant revokedAt;

    @PrePersist
    void beforeInsert() { if (publicId == null) publicId = UUID.randomUUID(); }

    public Long getId() { return id; }
    public Instant getIssuedAt() { return issuedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getConsumedAt() { return consumedAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setUser(UserEntity value) { user = value; }
    public void setPurpose(ProfileActionPurpose value) { purpose = value; }
    public void setCodeHash(String value) { codeHash = value; }
    public void setIssuedAt(Instant value) { issuedAt = value; }
    public void setExpiresAt(Instant value) { expiresAt = value; }
    public void setConsumedAt(Instant value) { consumedAt = value; }
    public void setRevokedAt(Instant value) { revokedAt = value; }
}
