package lk.apluskids.platform.auth.verification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "email_verification_tokens")
public class EmailVerificationTokenEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void beforeInsert() { if (publicId == null) publicId = UUID.randomUUID(); }

    public UserEntity getUser() { return user; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getIssuedAt() { return issuedAt; }
    public Instant getConsumedAt() { return consumedAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setUser(UserEntity value) { user = value; }
    public void setTokenHash(String value) { tokenHash = value; }
    public void setIssuedAt(Instant value) { issuedAt = value; }
    public void setExpiresAt(Instant value) { expiresAt = value; }
    public void setConsumedAt(Instant value) { consumedAt = value; }
    public void setRevokedAt(Instant value) { revokedAt = value; }
}
