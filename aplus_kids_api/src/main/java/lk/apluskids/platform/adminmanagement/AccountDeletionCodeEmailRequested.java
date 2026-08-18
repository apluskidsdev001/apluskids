package lk.apluskids.platform.adminmanagement;

public record AccountDeletionCodeEmailRequested(String email, String name, String code, long expiresInMinutes) {}
