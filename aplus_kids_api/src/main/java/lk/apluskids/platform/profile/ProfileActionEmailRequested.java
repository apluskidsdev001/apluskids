package lk.apluskids.platform.profile;

public record ProfileActionEmailRequested(
    String email,
    String accountHolderName,
    String code,
    ProfileActionPurpose purpose
) {}
