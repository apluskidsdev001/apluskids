package lk.apluskids.platform.profile;

import java.util.Locale;
import java.util.UUID;
import java.time.Instant;
import java.time.Duration;
import lk.apluskids.platform.auth.refresh.RefreshTokenRepository;
import lk.apluskids.platform.auth.verification.SecureTokenService;
import lk.apluskids.platform.child.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.common.normalization.InputNormalizer;
import lk.apluskids.platform.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.ApplicationEventPublisher;
import lk.apluskids.platform.notification.AccountNotificationService;

@Service
public class ProfileService {
    private final UserRepository users;
    private final ChildProfileRepository children;
    private final InputNormalizer normalizer;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokens;
    private final ProfileActionCodeRepository actionCodes;
    private final SecureTokenService secureTokens;
    private final ApplicationEventPublisher events;
    private final AccountNotificationService notifications;

    public ProfileService(
        UserRepository users,
        ChildProfileRepository children,
        InputNormalizer normalizer,
        PasswordEncoder passwordEncoder,
        RefreshTokenRepository refreshTokens,
        ProfileActionCodeRepository actionCodes,
        SecureTokenService secureTokens,
        ApplicationEventPublisher events,
        AccountNotificationService notifications
    ) {
        this.users = users;
        this.children = children;
        this.normalizer = normalizer;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokens = refreshTokens;
        this.actionCodes = actionCodes;
        this.secureTokens = secureTokens;
        this.events = events;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(UUID userId) {
        return response(requireUser(userId));
    }

    @Transactional
    public ProfileResponse update(UUID userId, UpdateProfileRequest request) {
        UserEntity user = requireUser(userId);
        String phone = normalizer.phone(request.phone());
        if (users.existsByPhoneE164AndIdNot(phone, user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED", "This phone number is already registered.");
        }
        user.setAccountHolderName(normalizer.name(request.accountHolderName()));
        user.setPhoneE164(phone);
        notifications.create(user, "PROFILE_UPDATED", "Account details updated", "Your parent account information was changed successfully.");
        return response(user);
    }

    @Transactional
    public ProfileResponse.ChildSummary addChild(UUID userId, ChildProfileRequest request) {
        UserEntity user = requireUser(userId);
        ChildProfileEntity child = new ChildProfileEntity();
        child.setUser(user);
        apply(child, request);
        children.save(child);
        notifications.create(user, "CHILD_ADDED", "Child profile added", child.getFullName() + " was added to your family account.");
        return childSummary(child);
    }

    @Transactional
    public ProfileResponse.ChildSummary updateChild(UUID userId, UUID childId, ChildProfileRequest request) {
        UserEntity user = requireUser(userId);
        ChildProfileEntity child = children.findByPublicIdAndUserPublicIdAndDeletedAtIsNull(childId, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CHILD_NOT_FOUND", "Child profile was not found."));
        apply(child, request);
        notifications.create(user, "CHILD_UPDATED", "Child profile updated", child.getFullName() + "'s information was updated.");
        return childSummary(child);
    }

    @Transactional
    public void requestActionCode(UUID userId, RequestProfileActionCode request) {
        UserEntity user = requireUser(userId);
        Instant now = Instant.now();
        actionCodes.findFirstByUserIdAndPurposeOrderByIssuedAtDesc(user.getId(), request.purpose()).ifPresent(latest -> {
            if (latest.getIssuedAt().plus(Duration.ofMinutes(1)).isAfter(now)) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "SECURITY_CODE_RESEND_TOO_SOON", "Please wait one minute before requesting another code.");
            }
        });
        actionCodes.findAllByUserIdAndPurposeAndConsumedAtIsNullAndRevokedAtIsNull(user.getId(), request.purpose())
            .forEach(token -> token.setRevokedAt(now));

        String code;
        String codeHash;
        do {
            code = secureTokens.generateNumericCode();
            codeHash = actionCodeHash(user, request.purpose(), code);
        } while (actionCodes.existsByCodeHash(codeHash));

        ProfileActionCodeEntity token = new ProfileActionCodeEntity();
        token.setUser(user);
        token.setPurpose(request.purpose());
        token.setCodeHash(codeHash);
        token.setIssuedAt(now);
        token.setExpiresAt(now.plus(Duration.ofMinutes(1)));
        actionCodes.save(token);
        events.publishEvent(new ProfileActionEmailRequested(user.getEmail(), user.getAccountHolderName(), code, request.purpose()));
    }

    @Transactional
    public void deleteChild(UUID userId, UUID childId, VerifyProfileActionRequest request) {
        UserEntity user = requireUser(userId);
        var currentChildren = children.findAllByUserPublicIdAndDeletedAtIsNull(userId);
        if (currentChildren.size() <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "LAST_CHILD_PROFILE", "Add another child before removing the only child profile, or delete the parent account.");
        }
        ChildProfileEntity child = children.findByPublicIdAndUserPublicIdAndDeletedAtIsNull(childId, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CHILD_NOT_FOUND", "Child profile was not found."));
        consumeActionCode(user, ProfileActionPurpose.DELETE_CHILD, request.code());
        String childName = child.getFullName();
        children.delete(child);
        notifications.create(user, "CHILD_REMOVED", "Child profile removed", childName + "'s profile was removed from your family account.");
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        UserEntity user = requireUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_PASSWORD", "The current password is incorrect.");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORDS_DO_NOT_MATCH", "New passwords do not match.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_UNCHANGED", "Choose a password you have not already used.");
        }
        consumeActionCode(user, ProfileActionPurpose.CHANGE_PASSWORD, request.code());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setCredentialsChangedAt(Instant.now());
        revokeSessions(user, "PASSWORD_CHANGED");
        notifications.create(user, "PASSWORD_CHANGED", "Password changed", "Your account password was changed successfully.");
    }

    @Transactional
    public void deleteAccount(UUID userId, DeleteAccountRequest request) {
        UserEntity user = requireUser(userId);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_PASSWORD", "The password is incorrect.");
        }

        Instant now = Instant.now();
        revokeSessions(user, "ACCOUNT_DELETED");
        children.deleteAll(children.findAllByUserPublicIdAndDeletedAtIsNull(userId));

        String deletedKey = user.getPublicId().toString();
        user.setAccountHolderName("Deleted account");
        user.setEmail("deleted+" + deletedKey + "@deleted.invalid");
        user.setPhoneE164("+999" + String.format("%015d", user.getId()));
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setStatus(AccountStatus.DELETED);
        user.setDeletedAt(now);
        user.setCredentialsChangedAt(now);
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
    }

    private void consumeActionCode(UserEntity user, ProfileActionPurpose purpose, String code) {
        ProfileActionCodeEntity token = actionCodes.findByCodeHash(actionCodeHash(user, purpose, code))
            .orElseThrow(this::invalidActionCode);
        Instant now = Instant.now();
        if (token.getConsumedAt() != null || token.getRevokedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw invalidActionCode();
        }
        token.setConsumedAt(now);
    }

    private String actionCodeHash(UserEntity user, ProfileActionPurpose purpose, String code) {
        return secureTokens.hash(user.getPublicId() + ":" + purpose + ":" + code);
    }

    private ApiException invalidActionCode() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SECURITY_CODE", "The verification code is incorrect or expired.");
    }

    private void revokeSessions(UserEntity user, String reason) {
        Instant now = Instant.now();
        refreshTokens.findAllByUserId(user.getId()).forEach(token -> {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(now);
                token.setRevocationReason(reason);
            }
        });
    }

    private UserEntity requireUser(UUID userId) {
        UserEntity user = users.findByPublicId(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Account was not found."));
        if (user.getStatus() == AccountStatus.DELETED || user.getDeletedAt() != null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Account was not found.");
        }
        return user;
    }

    private void apply(ChildProfileEntity child, ChildProfileRequest request) {
        child.setFullName(normalizer.name(request.fullName()));
        child.setDateOfBirth(request.dateOfBirth());
        child.setGender(request.gender());
        child.setCountryCode(request.countryCode().toUpperCase(Locale.ROOT));
        child.setProvince(normalizer.name(request.province()));
        child.setHometown(normalizer.name(request.hometown()));
        child.setAddress(request.address() == null || request.address().isBlank() ? null : normalizer.name(request.address()));
    }

    private ProfileResponse response(UserEntity user) {
        return new ProfileResponse(
            user.getPublicId(), user.getAccountHolderName(), user.getEmail(), user.getPhoneE164(),
            user.getEmailVerifiedAt() != null,
            children.findAllByUserPublicIdAndDeletedAtIsNull(user.getPublicId()).stream().map(this::childSummary).toList()
        );
    }

    private ProfileResponse.ChildSummary childSummary(ChildProfileEntity child) {
        return new ProfileResponse.ChildSummary(
            child.getPublicId(), child.getFullName(), child.getDateOfBirth(), child.getGender(),
            child.getCountryCode(), child.getProvince(), child.getHometown(), child.getAddress()
        );
    }
}
