package lk.apluskids.platform.adminmanagement;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "administrator_memberships")
public class AdministratorMembershipEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserEntity user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private AdministratorRole role;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private AdministratorMembershipStatus status;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "invited_by_user_id")
    private UserEntity invitedBy;
    @Column(name = "invite_reason", length = 600)
    private String inviteReason;
    @Column(name = "invited_at", nullable = false)
    private Instant invitedAt;
    @Column(name = "activated_at") private Instant activatedAt;
    @Column(name = "suspended_at") private Instant suspendedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "suspended_by_user_id")
    private UserEntity suspendedBy;
    @Column(name = "suspension_reason", length = 600)
    private String suspensionReason;
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "cancelled_by_user_id")
    private UserEntity cancelledBy;
    @Column(name = "removed_at") private Instant removedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "removed_by_user_id")
    private UserEntity removedBy;
    @Column(name = "removal_reason", length = 600)
    private String removalReason;
    @Column(name = "verification_failed_attempts", nullable = false)
    private int verificationFailedAttempts;
    @Column(name = "verification_locked_until")
    private Instant verificationLockedUntil;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Version private long version;

    @PrePersist void beforeInsert() {
        Instant now = Instant.now();
        if (publicId == null) publicId = UUID.randomUUID();
        if (invitedAt == null) invitedAt = now;
        updatedAt = now;
    }
    @PreUpdate void beforeUpdate() { updatedAt = Instant.now(); }

    public UUID getPublicId() { return publicId; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity value) { user = value; }
    public AdministratorRole getRole() { return role; }
    public void setRole(AdministratorRole value) { role = value; }
    public AdministratorMembershipStatus getStatus() { return status; }
    public void setStatus(AdministratorMembershipStatus value) { status = value; }
    public UserEntity getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UserEntity value) { invitedBy = value; }
    public String getInviteReason() { return inviteReason; }
    public void setInviteReason(String value) { inviteReason = value; }
    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant value) { invitedAt = value; }
    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant value) { activatedAt = value; }
    public Instant getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(Instant value) { suspendedAt = value; }
    public void setSuspendedBy(UserEntity value) { suspendedBy = value; }
    public String getSuspensionReason() { return suspensionReason; }
    public void setSuspensionReason(String value) { suspensionReason = value; }
    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant value) { cancelledAt = value; }
    public void setCancelledBy(UserEntity value) { cancelledBy = value; }
    public Instant getRemovedAt() { return removedAt; }
    public void setRemovedAt(Instant value) { removedAt = value; }
    public void setRemovedBy(UserEntity value) { removedBy = value; }
    public String getRemovalReason() { return removalReason; }
    public void setRemovalReason(String value) { removalReason = value; }
    public int getVerificationFailedAttempts() { return verificationFailedAttempts; }
    public void setVerificationFailedAttempts(int value) { verificationFailedAttempts = value; }
    public Instant getVerificationLockedUntil() { return verificationLockedUntil; }
    public void setVerificationLockedUntil(Instant value) { verificationLockedUntil = value; }
}
