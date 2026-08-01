package lk.apluskids.platform.auth.dto;

import java.util.Set;
import java.util.UUID;
import java.util.List;
import lk.apluskids.platform.user.AccountStatus;

public record RegisterResponse(
    UserSummary user,
    List<ChildSummary> children,
    boolean verificationRequired
) {
    public record UserSummary(
        UUID publicId,
        String accountHolderName,
        String email,
        String phone,
        AccountStatus status,
        Set<String> roles
    ) {}

    public record ChildSummary(UUID publicId, String fullName) {}
}
