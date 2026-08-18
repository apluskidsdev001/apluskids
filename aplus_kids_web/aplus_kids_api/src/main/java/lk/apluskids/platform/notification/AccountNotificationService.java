package lk.apluskids.platform.notification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.UserEntity;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountNotificationService {
    private final AccountNotificationRepository notifications;

    public AccountNotificationService(AccountNotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void create(UserEntity user, String type, String title, String message) {
        AccountNotificationEntity notification = new AccountNotificationEntity();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        notifications.save(notification);
    }

    @Transactional(readOnly = true)
    public List<AccountNotificationResponse> list(UUID userId) {
        return notifications.findAllByUserPublicIdAndExpiresAtAfterOrderByCreatedAtDesc(userId, Instant.now())
            .stream().map(this::response).toList();
    }

    @Transactional
    public void markRead(UUID userId, UUID notificationId) {
        AccountNotificationEntity notification = notifications.findByPublicIdAndUserPublicId(notificationId, userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Notification was not found."));
        if (notification.getReadAt() == null) notification.setReadAt(Instant.now());
    }

    @Scheduled(cron = "0 15 3 * * *", zone = "Asia/Colombo")
    @Transactional
    public void deleteExpired() {
        notifications.deleteByExpiresAtBefore(Instant.now());
    }

    private AccountNotificationResponse response(AccountNotificationEntity value) {
        return new AccountNotificationResponse(
            value.getPublicId(), value.getType(), value.getTitle(), value.getMessage(),
            value.getCreatedAt(), value.getReadAt() != null
        );
    }
}
