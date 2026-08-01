package lk.apluskids.platform.profile;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import lk.apluskids.platform.child.Gender;

public record ChildProfileRequest(
    @NotBlank @Size(min = 2, max = 120) String fullName,
    @NotNull @PastOrPresent LocalDate dateOfBirth,
    @NotNull Gender gender,
    @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String countryCode,
    @NotBlank @Size(max = 120) String province,
    @NotBlank @Size(max = 120) String hometown,
    @Size(max = 300) String address
) {}
