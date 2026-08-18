package lk.apluskids.platform.adminmanagement;

public record AdminInvitationEmailRequested(String email, String name, String code, long expiresInMinutes) {}
