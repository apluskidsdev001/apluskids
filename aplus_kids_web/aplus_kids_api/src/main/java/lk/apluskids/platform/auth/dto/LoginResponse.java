package lk.apluskids.platform.auth.dto;

import java.util.Set;
import java.util.UUID;

public record LoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UserSummary user
) {
    public record UserSummary(
        UUID publicId,
        String accountHolderName,
        String email,
        Set<String> roles
    ) {}
}
