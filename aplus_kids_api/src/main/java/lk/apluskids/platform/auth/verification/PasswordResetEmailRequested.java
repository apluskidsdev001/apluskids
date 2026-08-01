package lk.apluskids.platform.auth.verification;

public record PasswordResetEmailRequested(String email, String accountHolderName, String rawToken) {}
