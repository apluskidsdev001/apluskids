package lk.apluskids.platform.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyProfileActionRequest(
    @NotBlank @Pattern(regexp = "^\\d{6}$") String code
) {}
