package lk.apluskids.platform.auth;

import java.time.*;
import java.util.Locale;
import java.util.Set;
import lk.apluskids.platform.auth.dto.*;
import lk.apluskids.platform.auth.verification.*;
import lk.apluskids.platform.auth.refresh.*;
import lk.apluskids.platform.child.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.common.normalization.InputNormalizer;
import lk.apluskids.platform.consent.*;
import lk.apluskids.platform.role.*;
import lk.apluskids.platform.user.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import lk.apluskids.platform.security.JwtTokenService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final ChildProfileRepository children;
    private final ConsentRecordRepository consents;
    private final EmailVerificationTokenRepository verificationTokens;
    private final PasswordEncoder passwordEncoder;
    private final InputNormalizer normalizer;
    private final SecureTokenService tokens;
    private final ApplicationEventPublisher events;
    private final Duration verificationDuration;
    private final Duration refreshDuration;
    private final Duration rememberMeDuration;
    private final RefreshTokenRepository refreshTokens;
    private final JwtTokenService jwtTokens;
    private final PasswordResetTokenRepository passwordResetTokens;
    private final Duration passwordResetDuration;

    public AuthService(
        UserRepository users,
        RoleRepository roles,
        ChildProfileRepository children,
        ConsentRecordRepository consents,
        EmailVerificationTokenRepository verificationTokens,
        PasswordEncoder passwordEncoder,
        InputNormalizer normalizer,
        SecureTokenService tokens,
        ApplicationEventPublisher events,
        RefreshTokenRepository refreshTokens,
        JwtTokenService jwtTokens,
        PasswordResetTokenRepository passwordResetTokens,
        @Value("${aplus.auth.email-verification-duration}") Duration verificationDuration,
        @Value("${aplus.auth.refresh-token-duration}") Duration refreshDuration,
        @Value("${aplus.auth.remember-me-duration}") Duration rememberMeDuration,
        @Value("${aplus.auth.password-reset-duration}") Duration passwordResetDuration
    ) {
        this.users = users;
        this.roles = roles;
        this.children = children;
        this.consents = consents;
        this.verificationTokens = verificationTokens;
        this.passwordEncoder = passwordEncoder;
        this.normalizer = normalizer;
        this.tokens = tokens;
        this.events = events;
        this.verificationDuration = verificationDuration;
        this.refreshTokens = refreshTokens;
        this.jwtTokens = jwtTokens;
        this.refreshDuration = refreshDuration;
        this.rememberMeDuration = rememberMeDuration;
        this.passwordResetTokens = passwordResetTokens;
        this.passwordResetDuration = passwordResetDuration;
    }

    @Transactional(noRollbackFor = ApiException.class)
    public LoginResult login(LoginRequest request) {
        String identifier = request.login().trim();
        UserEntity user = identifier.contains("@")
            ? users.findByEmailIgnoreCase(normalizer.email(identifier)).orElse(null)
            : users.findByPhoneE164(normalizer.phone(identifier)).orElse(null);
        Instant now = Instant.now();

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            if (user != null) {
                int failedCount = user.getFailedLoginCount() + 1;
                user.setFailedLoginCount(failedCount);
                if (failedCount >= 5) user.setLockedUntil(now.plus(Duration.ofMinutes(15)));
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Incorrect email, phone number, or password.");
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "ACCOUNT_TEMPORARILY_LOCKED", "Too many failed attempts. Try again later.");
        }
        if (user.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Please verify your email before logging in.");
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_UNAVAILABLE", "This account is not available.");
        }

        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);

        JwtTokenService.AccessToken accessToken = jwtTokens.create(user);
        String rawRefreshToken = tokens.generate();
        Duration refreshLifetime = request.rememberMe() ? rememberMeDuration : refreshDuration;
        RefreshTokenEntity refreshToken = new RefreshTokenEntity();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokens.hash(rawRefreshToken));
        refreshToken.setRememberMe(request.rememberMe());
        refreshToken.setIssuedAt(now);
        refreshToken.setExpiresAt(now.plus(refreshLifetime));
        refreshTokens.save(refreshToken);

        Set<String> roleNames = user.getRoles().stream().map(RoleEntity::getName).collect(java.util.stream.Collectors.toSet());
        LoginResponse response = new LoginResponse(
            accessToken.value(),
            "Bearer",
            accessToken.expiresIn(),
            new LoginResponse.UserSummary(user.getPublicId(), user.getAccountHolderName(), user.getEmail(), roleNames)
        );
        return new LoginResult(response, rawRefreshToken, refreshLifetime);
    }

    @Transactional
    public LoginResult refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REQUIRED", "Your session has expired. Please log in again.");
        }
        RefreshTokenEntity current = refreshTokens.findByTokenHash(tokens.hash(rawToken))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Your session has expired. Please log in again."));
        Instant now = Instant.now();
        if (current.getRevokedAt() != null || !current.getExpiresAt().isAfter(now)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Your session has expired. Please log in again.");
        }
        UserEntity user = current.getUser();
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_UNAVAILABLE", "This account is not available.");
        }

        current.setLastUsedAt(now);
        current.setRevokedAt(now);
        current.setRevocationReason("ROTATED");

        JwtTokenService.AccessToken accessToken = jwtTokens.create(user);
        String nextRawToken = tokens.generate();
        Duration lifetime = current.isRememberMe() ? rememberMeDuration : refreshDuration;
        RefreshTokenEntity next = new RefreshTokenEntity();
        next.setUser(user);
        next.setTokenHash(tokens.hash(nextRawToken));
        next.setRememberMe(current.isRememberMe());
        next.setIssuedAt(now);
        next.setExpiresAt(now.plus(lifetime));
        refreshTokens.save(next);

        Set<String> roleNames = user.getRoles().stream().map(RoleEntity::getName).collect(java.util.stream.Collectors.toSet());
        LoginResponse response = new LoginResponse(
            accessToken.value(), "Bearer", accessToken.expiresIn(),
            new LoginResponse.UserSummary(user.getPublicId(), user.getAccountHolderName(), user.getEmail(), roleNames)
        );
        return new LoginResult(response, nextRawToken, lifetime);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokens.findByTokenHash(tokens.hash(rawToken)).ifPresent(token -> {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(Instant.now());
                token.setRevocationReason("LOGOUT");
            }
        });
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        users.findByEmailIgnoreCase(normalizer.email(request.email())).ifPresent(user -> {
            String rawToken = tokens.generate();
            Instant now = Instant.now();
            PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity();
            resetToken.setUser(user);
            resetToken.setTokenHash(tokens.hash(rawToken));
            resetToken.setIssuedAt(now);
            resetToken.setExpiresAt(now.plus(passwordResetDuration));
            passwordResetTokens.save(resetToken);
            events.publishEvent(new PasswordResetEmailRequested(user.getEmail(), user.getAccountHolderName(), rawToken));
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORDS_DO_NOT_MATCH", "Passwords do not match.");
        }
        PasswordResetTokenEntity resetToken = passwordResetTokens.findByTokenHash(tokens.hash(request.token()))
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "This password reset link is invalid or expired."));
        Instant now = Instant.now();
        if (resetToken.getConsumedAt() != null || resetToken.getRevokedAt() != null || !resetToken.getExpiresAt().isAfter(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "This password reset link is invalid or expired.");
        }
        UserEntity user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCredentialsChangedAt(now);
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        resetToken.setConsumedAt(now);
        refreshTokens.findAllByUserId(user.getId()).forEach(token -> {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(now);
                token.setRevocationReason("PASSWORD_RESET");
            }
        });
    }

    public record LoginResult(LoginResponse response, String refreshToken, Duration refreshLifetime) {}

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORDS_DO_NOT_MATCH", "Passwords do not match.");
        }

        String email = normalizer.email(request.email());
        String phone = normalizer.phone(request.phone());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "This email address is already registered.");
        }
        if (users.existsByPhoneE164(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "PHONE_ALREADY_REGISTERED", "This phone number is already registered.");
        }

        RoleEntity userRole = roles.findByName("ROLE_USER").orElseThrow(() ->
            new IllegalStateException("ROLE_USER has not been seeded")
        );

        UserEntity user = new UserEntity();
        user.setAccountHolderName(normalizer.name(request.accountHolderName()));
        user.setEmail(email);
        user.setPhoneE164(phone);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(AccountStatus.PENDING_VERIFICATION);
        user.getRoles().add(userRole);
        users.save(user);

        var createdChildren = request.children().stream().map(childRequest -> {
            ChildProfileEntity child = new ChildProfileEntity();
            child.setUser(user);
            child.setFullName(normalizer.name(childRequest.fullName()));
            child.setDateOfBirth(childRequest.dateOfBirth());
            child.setGender(childRequest.gender());
            child.setCountryCode(childRequest.countryCode().toUpperCase(Locale.ROOT));
            child.setProvince(normalizer.name(childRequest.province()));
            child.setHometown(normalizer.name(childRequest.hometown()));
            child.setAddress(blankToNull(childRequest.address()));
            children.save(child);
            return child;
        }).toList();

        saveConsent(user, ConsentType.PARENT_GUARDIAN_ATTESTATION, "registration-v1");
        saveConsent(user, ConsentType.TERMS_OF_USE, request.consent().termsVersion());
        saveConsent(user, ConsentType.PRIVACY_POLICY, request.consent().privacyVersion());

        issueVerificationCode(user);

        return new RegisterResponse(
            new RegisterResponse.UserSummary(
                user.getPublicId(), user.getAccountHolderName(), user.getEmail(), user.getPhoneE164(),
                user.getStatus(), Set.of("ROLE_USER")
            ),
            createdChildren.stream()
                .map(child -> new RegisterResponse.ChildSummary(child.getPublicId(), child.getFullName()))
                .toList(),
            true
        );
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        UserEntity requestedUser = users.findByEmailIgnoreCase(normalizer.email(request.email()))
            .orElseThrow(() -> invalidVerificationCode());
        EmailVerificationTokenEntity token = verificationTokens
            .findByTokenHash(verificationCodeHash(requestedUser, request.code()))
            .orElseThrow(() -> invalidVerificationCode());
        Instant now = Instant.now();
        if (token.getConsumedAt() != null || token.getRevokedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw invalidVerificationCode();
        }
        UserEntity user = token.getUser();
        if (user.getStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new ApiException(HttpStatus.CONFLICT, "ACCOUNT_NOT_PENDING_VERIFICATION", "This account cannot be verified.");
        }
        token.setConsumedAt(now);
        user.setEmailVerifiedAt(now);
        user.setStatus(AccountStatus.ACTIVE);
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        UserEntity user = users.findByEmailIgnoreCase(normalizer.email(request.email())).orElse(null);
        if (user == null || user.getStatus() != AccountStatus.PENDING_VERIFICATION) return;

        Instant now = Instant.now();
        verificationTokens.findFirstByUserIdOrderByIssuedAtDesc(user.getId()).ifPresent(latest -> {
            if (latest.getIssuedAt().plus(Duration.ofMinutes(1)).isAfter(now)) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "VERIFICATION_RESEND_TOO_SOON", "Please wait one minute before requesting another code.");
            }
        });
        verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(user.getId())
            .forEach(token -> token.setRevokedAt(now));
        issueVerificationCode(user);
    }

    private void issueVerificationCode(UserEntity user) {
        String code;
        String codeHash;
        do {
            code = tokens.generateNumericCode();
            codeHash = verificationCodeHash(user, code);
        } while (verificationTokens.existsByTokenHash(codeHash));

        Instant now = Instant.now();
        EmailVerificationTokenEntity verification = new EmailVerificationTokenEntity();
        verification.setUser(user);
        verification.setTokenHash(codeHash);
        verification.setIssuedAt(now);
        verification.setExpiresAt(now.plus(verificationDuration));
        verificationTokens.save(verification);
        events.publishEvent(new VerificationEmailRequested(user.getEmail(), user.getAccountHolderName(), code));
    }

    private String verificationCodeHash(UserEntity user, String code) {
        return tokens.hash(user.getPublicId() + ":" + code);
    }

    private ApiException invalidVerificationCode() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_VERIFICATION_CODE", "The verification code is incorrect or expired.");
    }

    private void saveConsent(UserEntity user, ConsentType type, String version) {
        ConsentRecordEntity record = new ConsentRecordEntity();
        record.setUser(user);
        record.setConsentType(type);
        record.setPolicyVersion(version);
        record.setAccepted(true);
        consents.save(record);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return normalizer.name(value);
    }
}
