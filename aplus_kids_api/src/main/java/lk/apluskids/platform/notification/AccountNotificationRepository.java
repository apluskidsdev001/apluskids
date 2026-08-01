package lk.apluskids.platform.notification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountNotificationRepository extends JpaRepository<AccountNotificationEntity, Long> {
    List<AccountNotificationEntity> findAllByUserPublicIdAndExpiresAtAfterOrderByCreatedAtDesc(UUID userId, Instant now);
    Optional<AccountNotificationEntity> findByPublicIdAndUserPublicId(UUID notificationId, UUID userId);
    long deleteByExpiresAtBefore(Instant now);
}
