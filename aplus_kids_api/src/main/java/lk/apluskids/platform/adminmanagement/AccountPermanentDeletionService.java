package lk.apluskids.platform.adminmanagement;

import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import lk.apluskids.platform.auth.verification.SecureTokenService;
import lk.apluskids.platform.child.ChildProfileEntity;
import lk.apluskids.platform.child.ChildProfileRepository;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.kidschamp.KidsChampAdminService;
import lk.apluskids.platform.profile.ProfileActionCodeRepository;
import lk.apluskids.platform.user.AccountStatus;
import lk.apluskids.platform.user.UserEntity;
import lk.apluskids.platform.user.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Super-Admin-only, code-confirmed permanent deletion for selected family and guest accounts. */
@Service
public class AccountPermanentDeletionService {
    private static final Duration CODE_LIFETIME = Duration.ofMinutes(10);
    private static final Duration RESEND_DELAY = Duration.ofMinutes(1);
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    private static final String CONFIRMATION_PHRASE = "PERMANENT DELETE";

    private final UserRepository users;
    private final ChildProfileRepository children;
    private final ProfileActionCodeRepository profileActionCodes;
    private final AccountDeletionConfirmationRepository confirmations;
    private final KidsChampAdminService kidsChamp;
    private final SecureTokenService tokens;
    private final ApplicationEventPublisher events;
    private final EntityManager entityManager;

    AccountPermanentDeletionService(
        UserRepository users, ChildProfileRepository children, ProfileActionCodeRepository profileActionCodes,
        AccountDeletionConfirmationRepository confirmations, KidsChampAdminService kidsChamp, SecureTokenService tokens,
        ApplicationEventPublisher events, EntityManager entityManager
    ) {
        this.users = users;
        this.children = children;
        this.profileActionCodes = profileActionCodes;
        this.confirmations = confirmations;
        this.kidsChamp = kidsChamp;
        this.tokens = tokens;
        this.events = events;
        this.entityManager = entityManager;
    }

    @Transactional
    public ConfirmationResponse request(UUID requesterId, List<DeletionTarget> requestedTargets) {
        UserEntity requester = requireVerifiedSuperAdmin(requesterId);
        Selection selection = resolveSelection(requestedTargets);
        Instant now = Instant.now();
        confirmations.findFirstByRequestedByIdOrderByIssuedAtDesc(requester.getId()).ifPresent(latest -> {
            if (latest.getIssuedAt().plus(RESEND_DELAY).isAfter(now)) {
                throw bad(HttpStatus.TOO_MANY_REQUESTS, "PERMANENT_DELETION_CODE_RESEND_TOO_SOON", "Please wait one minute before requesting another deletion code.");
            }
        });

        String serialized = selection.serialized();
        confirmations.findFirstByRequestedByIdOrderByIssuedAtDesc(requester.getId()).ifPresent(active -> {
            if (active.getConsumedAt() == null && active.getRevokedAt() == null) active.setRevokedAt(now);
        });
        AccountDeletionConfirmationEntity confirmation = new AccountDeletionConfirmationEntity();
        confirmation.setRequestedBy(requester);
        confirmation.setTargetReferences(serialized);
        confirmation.setTargetCount(selection.count());
        confirmation.setSelectionHash(tokens.hash(serialized));
        confirmation.setIssuedAt(now);
        confirmation.setExpiresAt(now.plus(CODE_LIFETIME));
        // The public ID is generated during persistence; reserve a unique hash so the non-null database constraint is satisfied first.
        confirmation.setCodeHash(tokens.hash("pending:" + UUID.randomUUID()));
        confirmation = confirmations.saveAndFlush(confirmation);
        String code = tokens.generateNumericCode();
        confirmation.setCodeHash(codeHash(requester, confirmation, code));
        events.publishEvent(new AccountDeletionCodeEmailRequested(requester.getEmail(), requester.getAccountHolderName(), code, CODE_LIFETIME.toMinutes()));
        return response(confirmation, requester.getEmail());
    }

    @Transactional
    public PermanentDeletionResponse confirm(UUID requesterId, ConfirmDeletionRequest request) {
        UserEntity requester = requireVerifiedSuperAdmin(requesterId);
        if (request == null || request.confirmationId() == null || request.code() == null || !CONFIRMATION_PHRASE.equals(request.confirmationPhrase())) {
            throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_CONFIRMATION_REQUIRED", "Type PERMANENT DELETE and enter the six-digit email code to continue.");
        }
        AccountDeletionConfirmationEntity confirmation = confirmations.findByPublicId(request.confirmationId())
            .orElseThrow(() -> bad(HttpStatus.NOT_FOUND, "PERMANENT_DELETION_CONFIRMATION_NOT_FOUND", "This deletion confirmation no longer exists. Request a new code."));
        if (!confirmation.getRequestedBy().getId().equals(requester.getId())) {
            throw bad(HttpStatus.FORBIDDEN, "PERMANENT_DELETION_CONFIRMATION_FORBIDDEN", "This deletion confirmation belongs to a different Super Admin.");
        }
        Instant now = Instant.now();
        if (confirmation.getConsumedAt() != null || confirmation.getRevokedAt() != null || !confirmation.getExpiresAt().isAfter(now)) {
            throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_CODE_INVALID", "The deletion code is incorrect, expired, or was replaced. Request a new code.");
        }
        if (confirmation.getLockedUntil() != null && confirmation.getLockedUntil().isAfter(now)) {
            throw bad(HttpStatus.TOO_MANY_REQUESTS, "PERMANENT_DELETION_CODE_LOCKED", "Too many incorrect codes were entered. Wait 15 minutes before requesting a new code.");
        }
        if (!tokens.hash(codeHashSource(requester, confirmation, request.code())).equals(confirmation.getCodeHash())) {
            int attempts = confirmation.getFailedAttempts() + 1;
            confirmation.setFailedAttempts(attempts);
            if (attempts >= 5) confirmation.setLockedUntil(now.plus(LOCK_DURATION));
            throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_CODE_INVALID", attempts >= 5
                ? "Too many incorrect codes were entered. This code is locked for 15 minutes."
                : "That deletion code is incorrect or expired. Check the email and try again.");
        }

        Selection selection = Selection.parse(confirmation.getTargetReferences());
        selection = resolveSelection(selection.targets());
        List<ChildProfileEntity> childProfiles = selection.registeredIds().stream()
            .flatMap(id -> children.findAllByUserPublicId(id).stream()).toList();
        var kidsChampResult = kidsChamp.permanentlyDeleteAccountData(
            requester.getPublicId(), selection.registeredIds(), childProfiles.stream().map(ChildProfileEntity::getPublicId).toList(), selection.guestIds()
        );
        List<UserEntity> registeredUsers = selection.registeredIds().stream().map(this::familyUser).toList();
        List<Long> registeredDatabaseIds = registeredUsers.stream().map(UserEntity::getId).toList();
        if (!registeredDatabaseIds.isEmpty()) {
            profileActionCodes.deleteAllByUserIdIn(registeredDatabaseIds);
            entityManager.createNativeQuery("DELETE FROM security_events WHERE user_id IN (:ids)").setParameter("ids", registeredDatabaseIds).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM audit_logs WHERE actor_user_id IN (:ids)").setParameter("ids", registeredDatabaseIds).executeUpdate();
        }
        children.deleteAll(childProfiles);
        users.deleteAll(registeredUsers);
        confirmation.setConsumedAt(now);
        confirmations.delete(confirmation);
        kidsChamp.auditAdministratorAction(requester.getPublicId(), "SELECTED_ACCOUNTS_PERMANENTLY_DELETED", "ACCOUNT_DELETION", new UUID(0L, 2L),
            "Permanently deleted " + selection.count() + " selected account(s); account identities and owned Kids Champ data were removed.");
        return new PermanentDeletionResponse(selection.count(), kidsChampResult.deletedSubmissions(), kidsChampResult.deletedChildProfiles(),
            kidsChampResult.deletedGuestChildProfiles(), kidsChampResult.invalidatedZipArchives());
    }

    private Selection resolveSelection(List<DeletionTarget> requestedTargets) {
        if (requestedTargets == null || requestedTargets.isEmpty() || requestedTargets.size() > 100) {
            throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_SELECTION_INVALID", "Select between 1 and 100 Kids or guest accounts to permanently delete.");
        }
        LinkedHashSet<DeletionTarget> distinct = new LinkedHashSet<>(requestedTargets);
        if (distinct.size() != requestedTargets.size()) throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_SELECTION_INVALID", "Each selected account may be included only once.");
        Set<UUID> registered = new TreeSet<>();
        Set<UUID> guests = new TreeSet<>();
        for (DeletionTarget target : distinct) {
            if (target == null || target.id() == null || target.accountType() == null) throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_SELECTION_INVALID", "Each selected account must include its type and reference.");
            if ("REGISTERED".equals(target.accountType())) registered.add(target.id());
            else if ("GUEST".equals(target.accountType())) guests.add(target.id());
            else throw bad(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_SELECTION_INVALID", "Only Kids and guest accounts can be permanently deleted here.");
        }
        registered.forEach(this::familyUser);
        Set<UUID> existingGuests = kidsChamp.guests().stream().map(KidsChampAdminService.GuestResponse::id).collect(java.util.stream.Collectors.toSet());
        if (!existingGuests.containsAll(guests)) throw bad(HttpStatus.NOT_FOUND, "GUEST_NOT_FOUND", "One or more selected guest accounts no longer exist. Refresh the list and try again.");
        return new Selection(registered, guests);
    }

    private UserEntity familyUser(UUID id) {
        UserEntity user = users.findByPublicId(id).orElseThrow(() -> bad(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "One or more selected accounts no longer exist. Refresh the list and try again."));
        if (user.getRoles().stream().anyMatch(role -> "ROLE_ADMIN".equals(role.getName()) || "ROLE_SUPER_ADMIN".equals(role.getName()))) {
            throw bad(HttpStatus.FORBIDDEN, "ADMIN_ACCOUNT_PERMANENT_DELETION_FORBIDDEN", "Administrator accounts cannot be permanently deleted from Kids accounts.");
        }
        return user;
    }

    private UserEntity requireVerifiedSuperAdmin(UUID requesterId) {
        UserEntity user = users.findByPublicId(requesterId).orElseThrow(() -> bad(HttpStatus.FORBIDDEN, "SUPER_ADMIN_REQUIRED", "A verified Super Admin account is required."));
        boolean superAdmin = user.getRoles().stream().anyMatch(role -> "ROLE_SUPER_ADMIN".equals(role.getName()));
        if (!superAdmin || user.getStatus() != AccountStatus.ACTIVE || user.getEmailVerifiedAt() == null) {
            throw bad(HttpStatus.FORBIDDEN, "SUPER_ADMIN_VERIFICATION_REQUIRED", "Use an active Super Admin account with a verified email address to permanently delete accounts.");
        }
        return user;
    }

    private ConfirmationResponse response(AccountDeletionConfirmationEntity confirmation, String email) {
        return new ConfirmationResponse(confirmation.getPublicId(), confirmation.getTargetCount(), maskEmail(email), confirmation.getExpiresAt());
    }
    private String codeHash(UserEntity user, AccountDeletionConfirmationEntity confirmation, String code) { return tokens.hash(codeHashSource(user, confirmation, code)); }
    private String codeHashSource(UserEntity user, AccountDeletionConfirmationEntity confirmation, String code) { return user.getPublicId() + ":ACCOUNT_PERMANENT_DELETION:" + confirmation.getPublicId() + ":" + code.trim(); }
    private String maskEmail(String email) { int at = email.indexOf('@'); if (at <= 1) return "•••" + (at >= 0 ? email.substring(at) : ""); return email.substring(0, 1) + "•••" + email.substring(at - 1); }
    private ApiException bad(HttpStatus status, String code, String message) { return new ApiException(status, code, message); }

    public record DeletionTarget(String accountType, UUID id) {}
    public record ConfirmDeletionRequest(UUID confirmationId, String code, String confirmationPhrase) {}
    public record ConfirmationResponse(UUID confirmationId, int targetCount, String emailMasked, Instant expiresAt) {}
    public record PermanentDeletionResponse(int deletedAccounts, int deletedSubmissions, int deletedChildProfiles, int deletedGuestChildProfiles, int invalidatedZipArchives) {}

    private record Selection(Set<UUID> registeredIds, Set<UUID> guestIds) {
        int count() { return registeredIds.size() + guestIds.size(); }
        List<DeletionTarget> targets() {
            List<DeletionTarget> targets = new ArrayList<>();
            registeredIds.forEach(id -> targets.add(new DeletionTarget("REGISTERED", id)));
            guestIds.forEach(id -> targets.add(new DeletionTarget("GUEST", id)));
            return targets;
        }
        String serialized() { return String.join("\n", targets().stream().map(target -> target.accountType() + ":" + target.id()).toList()); }
        static Selection parse(String value) {
            try {
                List<DeletionTarget> targets = Arrays.stream(value.split("\\R")).filter(item -> !item.isBlank()).map(item -> {
                    String[] parts = item.split(":", 2);
                    return new DeletionTarget(parts[0], UUID.fromString(parts[1]));
                }).toList();
                Set<UUID> registered = new TreeSet<>(), guests = new TreeSet<>();
                for (DeletionTarget target : targets) { if ("REGISTERED".equals(target.accountType())) registered.add(target.id()); else if ("GUEST".equals(target.accountType())) guests.add(target.id()); else throw new IllegalArgumentException(); }
                return new Selection(registered, guests);
            } catch (RuntimeException exception) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "PERMANENT_DELETION_CONFIRMATION_INVALID", "The deletion confirmation is invalid. Request a new code.");
            }
        }
    }
}
