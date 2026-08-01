package lk.apluskids.platform.auth.verification;

public record VerificationEmailRequested(String email, String accountHolderName, String code) {
}
