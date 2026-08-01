package lk.apluskids.platform.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Size(min = 2, max = 120) String accountHolderName,
    @NotBlank @Size(max = 30) String phone
) {}
