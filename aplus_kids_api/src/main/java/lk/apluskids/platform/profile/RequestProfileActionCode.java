package lk.apluskids.platform.profile;

import jakarta.validation.constraints.NotNull;

public record RequestProfileActionCode(@NotNull ProfileActionPurpose purpose) {}
