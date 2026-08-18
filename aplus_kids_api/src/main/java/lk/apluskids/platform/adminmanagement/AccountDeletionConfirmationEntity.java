package lk.apluskids.platform.adminmanagement;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "account_deletion_confirmations")
class AccountDeletionConfirmationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false) private UUID publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requested_by_user_id", nullable = false) private UserEntity requestedBy;
    @Column(name = "target_references", nullable = false, columnDefinition = "TEXT") private String targetReferences;
    @Column(name = "target_count", nullable = false) private int targetCount;
    @Column(name = "selection_hash", nullable = false, length = 64) private String selectionHash;
    @Column(name = "code_hash", nullable = false, unique = true, length = 64) private String codeHash;
    @Column(name = "issued_at", nullable = false) private Instant issuedAt;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "failed_attempts", nullable = false) private int failedAttempts;
    @Column(name = "locked_until") private Instant lockedUntil;
    @Column(name = "consumed_at") private Instant consumedAt;
    @Column(name = "revoked_at") private Instant revokedAt;

    @PrePersist void prepare() { if (publicId == null) publicId = UUID.randomUUID(); }
    Long getId() { return id; }
    UUID getPublicId() { return publicId; }
    UserEntity getRequestedBy() { return requestedBy; }
    String getTargetReferences() { return targetReferences; }
    int getTargetCount() { return targetCount; }
    String getCodeHash() { return codeHash; }
    Instant getIssuedAt() { return issuedAt; }
    Instant getExpiresAt() { return expiresAt; }
    int getFailedAttempts() { return failedAttempts; }
    Instant getLockedUntil() { return lockedUntil; }
    Instant getConsumedAt() { return consumedAt; }
    Instant getRevokedAt() { return revokedAt; }
    void setRequestedBy(UserEntity value) { requestedBy = value; }
    void setTargetReferences(String value) { targetReferences = value; }
    void setTargetCount(int value) { targetCount = value; }
    void setSelectionHash(String value) { selectionHash = value; }
    void setCodeHash(String value) { codeHash = value; }
    void setIssuedAt(Instant value) { issuedAt = value; }
    void setExpiresAt(Instant value) { expiresAt = value; }
    void setFailedAttempts(int value) { failedAttempts = value; }
    void setLockedUntil(Instant value) { lockedUntil = value; }
    void setConsumedAt(Instant value) { consumedAt = value; }
    void setRevokedAt(Instant value) { revokedAt = value; }
}
