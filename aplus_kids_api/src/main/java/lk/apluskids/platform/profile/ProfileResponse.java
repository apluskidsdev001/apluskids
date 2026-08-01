package lk.apluskids.platform.profile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lk.apluskids.platform.child.Gender;

public record ProfileResponse(
    UUID publicId,
    String accountHolderName,
    String email,
    String phone,
    boolean emailVerified,
    List<ChildSummary> children
) {
    public record ChildSummary(
        UUID publicId,
        String fullName,
        LocalDate dateOfBirth,
        Gender gender,
        String countryCode,
        String province,
        String hometown,
        String address
    ) {}
}
