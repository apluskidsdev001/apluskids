package lk.apluskids.platform.auth.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
import lk.apluskids.platform.child.Gender;

public record RegisterRequest(
    @NotBlank @Size(min = 2, max = 120) String accountHolderName,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(max = 30) String phone,
    @NotBlank @Size(min = 8, max = 128) String password,
    @NotBlank String confirmPassword,
    @NotEmpty @Size(max = 10) List<@Valid ChildRequest> children,
    @NotNull @Valid ConsentRequest consent
) {
    public record ChildRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotNull @PastOrPresent LocalDate dateOfBirth,
        @NotNull Gender gender,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String countryCode,
        @NotBlank @Size(max = 120) String province,
        @NotBlank @Size(max = 120) String hometown,
        @Size(max = 300) String address
    ) {}

    public record ConsentRequest(
        @AssertTrue boolean parentGuardianConfirmed,
        @AssertTrue boolean termsAccepted,
        @NotBlank @Size(max = 40) String termsVersion,
        @AssertTrue boolean privacyAccepted,
        @NotBlank @Size(max = 40) String privacyVersion
    ) {}
}
