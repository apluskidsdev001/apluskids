package lk.apluskids.platform.adminmanagement;

import java.time.*;
import java.util.*;
import lk.apluskids.platform.auth.refresh.*;
import lk.apluskids.platform.auth.verification.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.common.normalization.InputNormalizer;
import lk.apluskids.platform.kidschamp.KidsChampAdminService;
import lk.apluskids.platform.role.*;
import lk.apluskids.platform.user.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdministratorManagementService {
    private final AdministratorMembershipRepository memberships;
    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final EmailVerificationTokenRepository verificationTokens;
    private final SecureTokenService secureTokens;
    private final PasswordEncoder passwordEncoder;
    private final InputNormalizer normalizer;
    private final ApplicationEventPublisher events;
    private final KidsChampAdminService audit;
    private final Duration invitationDuration;

    public AdministratorManagementService(
        AdministratorMembershipRepository memberships, UserRepository users, RoleRepository roles,
        RefreshTokenRepository refreshTokens, EmailVerificationTokenRepository verificationTokens,
        SecureTokenService secureTokens, PasswordEncoder passwordEncoder, InputNormalizer normalizer,
        ApplicationEventPublisher events, KidsChampAdminService audit,
        @Value("${aplus.auth.admin-invitation-verification-duration:PT10M}") Duration invitationDuration
    ) {
        this.memberships = memberships;
        this.users = users;
        this.roles = roles;
        this.refreshTokens = refreshTokens;
        this.verificationTokens = verificationTokens;
        this.secureTokens = secureTokens;
        this.passwordEncoder = passwordEncoder;
        this.normalizer = normalizer;
        this.events = events;
        this.audit = audit;
        this.invitationDuration = invitationDuration;
    }

    @Transactional(readOnly = true)
    public AdministratorSummary summary(UUID actorId) {
        requireSuperAdmin(actorId);
        List<AdministratorMembershipEntity> all = memberships.findAll();
        return new AdministratorSummary(
            all.size(), count(all, AdministratorMembershipStatus.ACTIVE),
            count(all, AdministratorMembershipStatus.PENDING_VERIFICATION),
            count(all, AdministratorMembershipStatus.SUSPENDED),
            count(all, AdministratorMembershipStatus.REMOVED),
            all.stream().filter(item -> item.getStatus() == AdministratorMembershipStatus.ACTIVE && item.getRole() == AdministratorRole.SUPER_ADMIN).count()
        );
    }

    @Transactional(readOnly = true)
    public List<AdministratorView> list(UUID actorId, String search, AdministratorMembershipStatus status, AdministratorRole role) {
        requireSuperAdmin(actorId);
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return memberships.findAllByOrderByInvitedAtDesc().stream()
            .filter(item -> status == null || item.getStatus() == status)
            .filter(item -> role == null || item.getRole() == role)
            .filter(item -> query.isBlank() || item.getUser().getAccountHolderName().toLowerCase(Locale.ROOT).contains(query)
                || item.getUser().getEmail().toLowerCase(Locale.ROOT).contains(query)
                || item.getUser().getPhoneE164().contains(query))
            .map(this::view).toList();
    }

    @Transactional
    public AdministratorView invite(UUID actorId, InviteAdministratorRequest request) {
        UserEntity actor = requireSuperAdmin(actorId);
        String name = normalizer.name(request.name());
        String email = normalizer.email(request.email());
        String phone = normalizer.phone(request.phone());
        String reason = requiredReason(request.reason());
        if (name == null || name.length() < 2 || name.length() > 120) bad("ADMIN_NAME_INVALID", "Enter the administrator's full name.");
        UserEntity emailOwner = users.findByEmailIgnoreCase(email).orElse(null);
        UserEntity phoneOwner = users.findByPhoneE164(phone).orElse(null);
        if (emailOwner != null && phoneOwner != null && !emailOwner.getId().equals(phoneOwner.getId())) {
            conflict("ADMIN_CONTACT_EXISTS", "The email address and phone number belong to different existing accounts.");
        }
        UserEntity existingOwner = emailOwner != null ? emailOwner : phoneOwner;
        if (existingOwner != null) {
            AdministratorMembershipEntity cancelled = memberships.findLockedByUserPublicId(existingOwner.getPublicId()).orElse(null);
            if (cancelled != null && cancelled.getStatus() == AdministratorMembershipStatus.CANCELLED
                && existingOwner.getStatus() == AccountStatus.DELETED) {
                if (users.existsByEmailIgnoreCaseAndIdNot(email, existingOwner.getId())) conflict("ADMIN_EMAIL_EXISTS", "An account already uses this email address.");
                if (users.existsByPhoneE164AndIdNot(phone, existingOwner.getId())) conflict("ADMIN_PHONE_EXISTS", "An account already uses this phone number.");
                return reopenCancelledInvitation(actorId, actor, cancelled, name, email, phone, request.role(), reason);
            }
            if (emailOwner != null) conflict("ADMIN_EMAIL_EXISTS", "An account already uses this email address.");
            conflict("ADMIN_PHONE_EXISTS", "An account already uses this phone number.");
        }

        UserEntity user = new UserEntity();
        user.setAccountHolderName(name);
        user.setEmail(email);
        user.setPhoneE164(phone);
        user.setPasswordHash(passwordEncoder.encode(secureTokens.generate()));
        user.setStatus(AccountStatus.PENDING_VERIFICATION);
        user.replaceRoles(Set.of());
        users.save(user);

        AdministratorMembershipEntity membership = new AdministratorMembershipEntity();
        membership.setUser(user);
        membership.setRole(request.role());
        membership.setStatus(AdministratorMembershipStatus.PENDING_VERIFICATION);
        membership.setInvitedBy(actor);
        membership.setInviteReason(reason);
        memberships.save(membership);
        issueCode(user);
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_INVITED", "ADMINISTRATOR", user.getPublicId(),
            "Invited " + name + " as " + friendlyRole(request.role()) + ". Reason: " + reason);
        return view(membership);
    }

    private AdministratorView reopenCancelledInvitation(UUID actorId, UserEntity actor,
        AdministratorMembershipEntity membership, String name, String email, String phone,
        AdministratorRole role, String reason) {
        Instant now = Instant.now();
        UserEntity user = membership.getUser();
        user.setAccountHolderName(name);
        user.setEmail(email);
        user.setPhoneE164(phone);
        user.setPasswordHash(passwordEncoder.encode(secureTokens.generate()));
        user.setStatus(AccountStatus.PENDING_VERIFICATION);
        user.setEmailVerifiedAt(null);
        user.setDeletedAt(null);
        user.replaceRoles(Set.of());
        membership.setRole(role);
        membership.setStatus(AdministratorMembershipStatus.PENDING_VERIFICATION);
        membership.setInvitedBy(actor);
        membership.setInviteReason(reason);
        membership.setInvitedAt(now);
        membership.setActivatedAt(null);
        membership.setCancelledAt(null);
        membership.setCancelledBy(null);
        clearFailedVerification(membership);
        verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(user.getId())
            .forEach(token -> token.setRevokedAt(now));
        issueCode(user);
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_REINVITED", "ADMINISTRATOR", user.getPublicId(),
            "Reopened a cancelled invitation for " + name + " as " + friendlyRole(role) + ". Reason: " + reason);
        return view(membership);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void accept(AcceptAdministratorInvitationRequest request) {
        if (!Objects.equals(request.password(), request.confirmPassword())) bad("PASSWORDS_DO_NOT_MATCH", "Passwords do not match.");
        if (request.password() == null || request.password().length() < 8 || request.password().length() > 128) {
            bad("PASSWORD_INVALID", "Use a password containing 8 to 128 characters.");
        }
        String email = normalizer.email(request.email());
        AdministratorMembershipEntity membership = memberships.findLockedByEmail(email).orElseThrow(this::invalidCode);
        if (membership.getStatus() != AdministratorMembershipStatus.PENDING_VERIFICATION) {
            conflict("INVITATION_NOT_PENDING", "This administrator invitation is no longer awaiting verification.");
        }
        UserEntity user = membership.getUser();
        Instant now = Instant.now();
        ensureVerificationAvailable(membership, now);
        EmailVerificationTokenEntity token = verificationTokens.findByTokenHash(codeHash(user, request.code())).orElse(null);
        if (!validToken(token, user, now)) recordFailedVerification(membership, now);
        clearFailedVerification(membership);

        token.setConsumedAt(now);
        verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(user.getId()).stream()
            .filter(other -> other != token).forEach(other -> other.setRevokedAt(now));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerifiedAt(now);
        user.setCredentialsChangedAt(now);
        user.setStatus(AccountStatus.ACTIVE);
        user.replaceRoles(Set.of(roleEntity(membership.getRole())));
        membership.setStatus(AdministratorMembershipStatus.ACTIVE);
        membership.setActivatedAt(now);
        UUID actorId = membership.getInvitedBy() == null ? user.getPublicId() : membership.getInvitedBy().getPublicId();
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_INVITATION_ACCEPTED", "ADMINISTRATOR", user.getPublicId(),
            user.getAccountHolderName() + " verified the invited email and activated " + friendlyRole(membership.getRole()) + " access.");
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void validateInvitationCode(ValidateAdministratorInvitationRequest request) {
        String email = normalizer.email(request.email());
        AdministratorMembershipEntity membership = memberships.findLockedByEmail(email).orElseThrow(this::invalidCode);
        if (membership.getStatus() != AdministratorMembershipStatus.PENDING_VERIFICATION) {
            conflict("INVITATION_NOT_PENDING", "This administrator invitation is no longer awaiting verification.");
        }
        Instant now = Instant.now();
        ensureVerificationAvailable(membership, now);
        UserEntity user = membership.getUser();
        EmailVerificationTokenEntity token = verificationTokens.findByTokenHash(codeHash(user, request.code())).orElse(null);
        if (!validToken(token, user, now)) recordFailedVerification(membership, now);
        clearFailedVerification(membership);
    }

    @Transactional
    public void resend(String rawEmail) {
        String email = normalizer.email(rawEmail);
        AdministratorMembershipEntity membership = memberships.findLockedByEmail(email).orElse(null);
        if (membership == null || membership.getStatus() != AdministratorMembershipStatus.PENDING_VERIFICATION) return;
        UserEntity user = membership.getUser();
        Instant now = Instant.now();
        verificationTokens.findFirstByUserIdOrderByIssuedAtDesc(user.getId()).ifPresent(latest -> {
            if (latest.getIssuedAt().plus(Duration.ofMinutes(1)).isAfter(now)) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "VERIFICATION_RESEND_TOO_SOON", "Please wait one minute before requesting another code.");
            }
        });
        verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(user.getId()).forEach(token -> token.setRevokedAt(now));
        clearFailedVerification(membership);
        issueCode(user);
    }

    @Transactional
    public AdministratorView update(UUID actorId, UUID targetId, UpdateAdministratorRequest request) {
        requireSuperAdmin(actorId);
        AdministratorMembershipEntity membership = locked(targetId);
        if (membership.getStatus() == AdministratorMembershipStatus.CANCELLED || membership.getStatus() == AdministratorMembershipStatus.REMOVED) {
            conflict("ADMIN_NOT_EDITABLE", "A cancelled or removed administrator cannot be edited.");
        }
        UserEntity user = membership.getUser();
        String name = normalizer.name(request.name());
        String phone = normalizer.phone(request.phone());
        if (name == null || name.length() < 2 || name.length() > 120) bad("ADMIN_NAME_INVALID", "Enter the administrator's full name.");
        if (!phone.equals(user.getPhoneE164()) && users.existsByPhoneE164AndIdNot(phone, user.getId())) conflict("ADMIN_PHONE_EXISTS", "An account already uses this phone number.");
        user.setAccountHolderName(name);
        user.setPhoneE164(phone);
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_DETAILS_UPDATED", "ADMINISTRATOR", targetId,
            "Updated administrator name and phone number. Email changes require a new verified invitation.");
        return view(membership);
    }

    @Transactional
    public AdministratorView changeRole(UUID actorId, UUID targetId, ChangeAdministratorRoleRequest request) {
        requireSuperAdmin(actorId);
        if (actorId.equals(targetId) && request.role() == AdministratorRole.ADMIN) bad("SELF_DEMOTION", "You cannot demote your own Super Admin account.");
        AdministratorMembershipEntity membership = locked(targetId);
        protectFinalSuperAdmin(membership, request.role() == AdministratorRole.ADMIN);
        membership.setRole(request.role());
        if (membership.getStatus() == AdministratorMembershipStatus.ACTIVE) {
            membership.getUser().replaceRoles(Set.of(roleEntity(request.role())));
            revokeSessions(membership.getUser(), "ADMIN_ROLE_CHANGED");
        }
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_ROLE_CHANGED", "ADMINISTRATOR", targetId,
            "Changed access to " + friendlyRole(request.role()) + ". Reason: " + requiredReason(request.reason()));
        return view(membership);
    }

    @Transactional
    public AdministratorView suspend(UUID actorId, UUID targetId, ReasonRequest request) {
        requireSuperAdmin(actorId);
        if (actorId.equals(targetId)) bad("SELF_SUSPENSION", "You cannot suspend your own administrator account.");
        AdministratorMembershipEntity membership = locked(targetId);
        protectFinalSuperAdmin(membership, true);
        if (membership.getStatus() != AdministratorMembershipStatus.ACTIVE) conflict("ADMIN_NOT_ACTIVE", "Only an active administrator can be suspended.");
        UserEntity actor = users.findByPublicId(actorId).orElseThrow();
        membership.setStatus(AdministratorMembershipStatus.SUSPENDED);
        membership.setSuspendedAt(Instant.now());
        membership.setSuspendedBy(actor);
        membership.setSuspensionReason(requiredReason(request.reason()));
        membership.getUser().setStatus(AccountStatus.SUSPENDED);
        membership.getUser().replaceRoles(Set.of());
        revokeSessions(membership.getUser(), "ADMIN_SUSPENDED");
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_SUSPENDED", "ADMINISTRATOR", targetId,
            "Suspended administrator access. Reason: " + membership.getSuspensionReason());
        return view(membership);
    }

    @Transactional
    public AdministratorView restore(UUID actorId, UUID targetId, ReasonRequest request) {
        requireSuperAdmin(actorId);
        AdministratorMembershipEntity membership = locked(targetId);
        if (membership.getStatus() != AdministratorMembershipStatus.SUSPENDED) conflict("ADMIN_NOT_SUSPENDED", "Only a suspended administrator can be restored.");
        membership.setStatus(AdministratorMembershipStatus.ACTIVE);
        membership.setSuspendedAt(null);
        membership.setSuspensionReason(null);
        membership.getUser().setStatus(AccountStatus.ACTIVE);
        membership.getUser().replaceRoles(Set.of(roleEntity(membership.getRole())));
        membership.getUser().setCredentialsChangedAt(Instant.now());
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_RESTORED", "ADMINISTRATOR", targetId,
            "Restored " + friendlyRole(membership.getRole()) + " access. Reason: " + requiredReason(request.reason()));
        return view(membership);
    }

    @Transactional
    public AdministratorView cancel(UUID actorId, UUID targetId, ReasonRequest request) {
        requireSuperAdmin(actorId);
        AdministratorMembershipEntity membership = locked(targetId);
        if (membership.getStatus() != AdministratorMembershipStatus.PENDING_VERIFICATION) conflict("INVITATION_NOT_PENDING", "Only a pending invitation can be cancelled.");
        String reason = requiredReason(request.reason());
        Instant now = Instant.now();
        membership.setStatus(AdministratorMembershipStatus.CANCELLED);
        membership.setCancelledAt(now);
        membership.setCancelledBy(users.findByPublicId(actorId).orElseThrow());
        membership.getUser().setStatus(AccountStatus.DELETED);
        membership.getUser().setDeletedAt(now);
        verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(membership.getUser().getId()).forEach(token -> token.setRevokedAt(now));
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_INVITATION_CANCELLED", "ADMINISTRATOR", targetId,
            "Cancelled pending administrator invitation. Reason: " + reason);
        return view(membership);
    }

    @Transactional
    public AdministratorView remove(UUID actorId, UUID targetId, ReasonRequest request) {
        requireSuperAdmin(actorId);
        if (actorId.equals(targetId)) bad("SELF_REMOVAL", "You cannot remove your own administrator account.");
        AdministratorMembershipEntity membership = locked(targetId);
        if (membership.getStatus() != AdministratorMembershipStatus.ACTIVE
            && membership.getStatus() != AdministratorMembershipStatus.SUSPENDED) {
            conflict("ADMIN_NOT_REMOVABLE", "Only an active or suspended administrator can be removed.");
        }
        protectFinalSuperAdmin(membership, true);
        String reason = requiredReason(request.reason());
        Instant now = Instant.now();
        membership.setStatus(AdministratorMembershipStatus.REMOVED);
        membership.setRemovedAt(now);
        membership.setRemovedBy(users.findByPublicId(actorId).orElseThrow());
        membership.setRemovalReason(reason);
        UserEntity user = membership.getUser();
        user.setStatus(AccountStatus.DELETED);
        user.setDeletedAt(now);
        user.replaceRoles(Set.of());
        revokeSessions(user, "ADMINISTRATOR_REMOVED");
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_REMOVED", "ADMINISTRATOR", targetId,
            "Removed administrator access and revoked all sessions. Reason: " + reason);
        return view(membership);
    }

    @Transactional
    public void revokeAdministratorSessions(UUID actorId, UUID targetId, ReasonRequest request) {
        requireSuperAdmin(actorId);
        AdministratorMembershipEntity membership = locked(targetId);
        revokeSessions(membership.getUser(), "ADMIN_REVOKED_ALL_SESSIONS");
        audit.auditAdministratorAction(actorId, "ADMINISTRATOR_SESSIONS_REVOKED", "ADMINISTRATOR", targetId,
            "Revoked all administrator sessions. Reason: " + requiredReason(request.reason()));
    }

    @Transactional(readOnly = true)
    public UserEntity requireAdministrator(UUID actorId) {
        AdministratorMembershipEntity membership = memberships.findByUserPublicId(actorId)
            .orElseThrow(() -> forbidden("Administrator access is required."));
        if (membership.getStatus() != AdministratorMembershipStatus.ACTIVE || membership.getUser().getStatus() != AccountStatus.ACTIVE) {
            throw forbidden("This administrator account is not active.");
        }
        return membership.getUser();
    }

    @Transactional(readOnly = true)
    public UserEntity requireSuperAdmin(UUID actorId) {
        UserEntity user = requireAdministrator(actorId);
        AdministratorMembershipEntity membership = memberships.findByUserPublicId(actorId).orElseThrow();
        if (membership.getRole() != AdministratorRole.SUPER_ADMIN) throw forbidden("Super Admin access is required.");
        return user;
    }

    private AdministratorMembershipEntity locked(UUID targetId) {
        return memberships.findLockedByUserPublicId(targetId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ADMINISTRATOR_NOT_FOUND", "Administrator was not found."));
    }
    private void issueCode(UserEntity user) {
        String code; String hash;
        do { code = secureTokens.generateNumericCode(); hash = codeHash(user, code); }
        while (verificationTokens.existsByTokenHash(hash));
        Instant now = Instant.now();
        EmailVerificationTokenEntity token = new EmailVerificationTokenEntity();
        token.setUser(user); token.setTokenHash(hash); token.setIssuedAt(now); token.setExpiresAt(now.plus(invitationDuration));
        verificationTokens.save(token);
        events.publishEvent(new AdminInvitationEmailRequested(user.getEmail(), user.getAccountHolderName(), code, Math.max(1, invitationDuration.toMinutes())));
    }
    private String codeHash(UserEntity user, String code) { return secureTokens.hash(user.getPublicId() + ":" + code); }
    private boolean validToken(EmailVerificationTokenEntity token, UserEntity user, Instant now) {
        return token != null && token.getConsumedAt() == null && token.getRevokedAt() == null
            && token.getExpiresAt().isAfter(now) && token.getUser().getId().equals(user.getId());
    }
    private void ensureVerificationAvailable(AdministratorMembershipEntity membership, Instant now) {
        Instant lockedUntil = membership.getVerificationLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(now)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "VERIFICATION_TEMPORARILY_LOCKED",
                "Too many incorrect codes. Wait 15 minutes or request a new code.");
        }
        if (lockedUntil != null) clearFailedVerification(membership);
    }
    private void recordFailedVerification(AdministratorMembershipEntity membership, Instant now) {
        int attempts = membership.getVerificationFailedAttempts() + 1;
        membership.setVerificationFailedAttempts(Math.min(attempts, 5));
        if (attempts >= 5) {
            membership.setVerificationLockedUntil(now.plus(Duration.ofMinutes(15)));
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "VERIFICATION_TEMPORARILY_LOCKED",
                "Too many incorrect codes. Wait 15 minutes or request a new code.");
        }
        throw invalidCode();
    }
    private void clearFailedVerification(AdministratorMembershipEntity membership) {
        membership.setVerificationFailedAttempts(0);
        membership.setVerificationLockedUntil(null);
    }
    private RoleEntity roleEntity(AdministratorRole role) {
        return roles.findByName(role == AdministratorRole.SUPER_ADMIN ? "ROLE_SUPER_ADMIN" : "ROLE_ADMIN")
            .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ADMIN_ROLE_UNAVAILABLE", "Administrator access could not be configured."));
    }
    private void revokeSessions(UserEntity user, String reason) {
        Instant now = Instant.now();
        refreshTokens.findAllByUserId(user.getId()).stream().filter(token -> token.getRevokedAt() == null).forEach(token -> { token.setRevokedAt(now); token.setRevocationReason(reason); });
        user.setCredentialsChangedAt(now);
    }
    private void protectFinalSuperAdmin(AdministratorMembershipEntity membership, boolean losesSuperAccess) {
        if (losesSuperAccess && membership.getRole() == AdministratorRole.SUPER_ADMIN
            && membership.getStatus() == AdministratorMembershipStatus.ACTIVE
            && memberships.countByRoleAndStatus(AdministratorRole.SUPER_ADMIN, AdministratorMembershipStatus.ACTIVE) <= 1) {
            conflict("LAST_SUPER_ADMIN", "Keep at least one active Super Admin.");
        }
    }
    private AdministratorView view(AdministratorMembershipEntity membership) {
        UserEntity user = membership.getUser();
        return new AdministratorView(user.getPublicId(), user.getAccountHolderName(), user.getEmail(), user.getPhoneE164(),
            membership.getRole(), membership.getStatus(), user.getEmailVerifiedAt(), membership.getInvitedAt(), membership.getActivatedAt(),
            user.getLastLoginAt(), membership.getInvitedBy() == null ? "System" : membership.getInvitedBy().getAccountHolderName(),
            membership.getInviteReason(), membership.getSuspensionReason(), membership.getRemovedAt(), membership.getRemovalReason());
    }
    private long count(List<AdministratorMembershipEntity> all, AdministratorMembershipStatus status) { return all.stream().filter(item -> item.getStatus() == status).count(); }
    private String friendlyRole(AdministratorRole role) { return role == AdministratorRole.SUPER_ADMIN ? "Super Admin" : "Admin"; }
    private String requiredReason(String value) { if (value == null || value.isBlank()) bad("REASON_REQUIRED", "Enter a reason for this administrator action."); return value.trim(); }
    private ApiException invalidCode() { return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VERIFICATION_CODE", "The verification code is incorrect or expired."); }
    private ApiException forbidden(String message) { return new ApiException(HttpStatus.FORBIDDEN, "SUPER_ADMIN_REQUIRED", message); }
    private void bad(String code, String message) { throw new ApiException(HttpStatus.BAD_REQUEST, code, message); }
    private void conflict(String code, String message) { throw new ApiException(HttpStatus.CONFLICT, code, message); }

    public record AdministratorSummary(long total, long active, long pendingVerification, long suspended, long removed, long superAdmins) {}
    public record AdministratorView(UUID id, String name, String email, String phone, AdministratorRole role,
        AdministratorMembershipStatus status, Instant emailVerifiedAt, Instant invitedAt, Instant activatedAt,
        Instant lastLoginAt, String invitedBy, String inviteReason, String suspensionReason, Instant removedAt, String removalReason) {}
    public record InviteAdministratorRequest(String name, String email, String phone, AdministratorRole role, String reason) {}
    public record AcceptAdministratorInvitationRequest(String email, String code, String password, String confirmPassword) {}
    public record ValidateAdministratorInvitationRequest(String email, String code) {}
    public record UpdateAdministratorRequest(String name, String phone) {}
    public record ChangeAdministratorRoleRequest(AdministratorRole role, String reason) {}
    public record ReasonRequest(String reason) {}
}
