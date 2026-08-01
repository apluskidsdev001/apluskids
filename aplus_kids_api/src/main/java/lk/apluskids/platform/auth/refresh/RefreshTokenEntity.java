package lk.apluskids.platform.auth.refresh;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity {
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

    @Column(name = "token_family_id", nullable = false, updatable = false)
    private UUID tokenFamilyId;

    @Column(name = "remember_me", nullable = false)
    private boolean rememberMe;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revocation_reason", length = 80)
    private String revocationReason;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void beforeInsert() {
        if (publicId == null) publicId = UUID.randomUUID();
        if (tokenFamilyId == null) tokenFamilyId = UUID.randomUUID();
    }

    public void setUser(UserEntity value) { user = value; }
    public void setTokenHash(String value) { tokenHash = value; }
    public void setRememberMe(boolean value) { rememberMe = value; }
    public void setIssuedAt(Instant value) { issuedAt = value; }
    public void setExpiresAt(Instant value) { expiresAt = value; }
    public UserEntity getUser() { return user; }
    public boolean isRememberMe() { return rememberMe; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setLastUsedAt(Instant value) { lastUsedAt = value; }
    public void setRevokedAt(Instant value) { revokedAt = value; }
    public void setRevocationReason(String value) { revocationReason = value; }
}
