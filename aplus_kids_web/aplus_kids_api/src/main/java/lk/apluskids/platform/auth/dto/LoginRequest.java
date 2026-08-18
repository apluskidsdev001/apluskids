package lk.apluskids.platform.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank @Size(max = 254) String login,
    @NotBlank @Size(max = 128) String password,
    boolean rememberMe
) {}
