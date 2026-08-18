package lk.apluskids.platform.notification;

import java.time.Instant;
import java.util.UUID;

public record AccountNotificationResponse(
    UUID publicId,
    String type,
    String title,
    String message,
    Instant createdAt,
    boolean read
) {}
