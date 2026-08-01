package lk.apluskids.platform.kidschamp;

import java.util.*;
import java.time.Instant;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

interface KidsChampGuestContactRepository extends JpaRepository<KidsChampGuestContactEntity, Long> {
    Optional<KidsChampGuestContactEntity> findByPhoneE164(String phoneE164);
    List<KidsChampGuestContactEntity> findAllByOrderByLastSubmittedAtDesc();
    Optional<KidsChampGuestContactEntity> findByPublicIdAndClaimedAtIsNull(UUID id);
    Optional<KidsChampGuestContactEntity> findByPublicId(UUID id);
}

interface KidsChampSubmissionRepository extends JpaRepository<KidsChampSubmissionEntity, Long> {
    Optional<KidsChampSubmissionEntity> findByPublicId(UUID id);
    Optional<KidsChampSubmissionEntity> findByTrackingCodeIgnoreCase(String trackingCode);
    List<KidsChampSubmissionEntity> findAllByUserPublicIdOrderBySubmittedAtDesc(UUID userId);
    List<KidsChampSubmissionEntity> findAllByDeletedAtIsNullOrderBySubmittedAtDesc();
    boolean existsByTrackingCodeIgnoreCase(String trackingCode);
    List<KidsChampSubmissionEntity> findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAsc(
        ReviewStatus status, Pageable pageable
    );
    List<KidsChampSubmissionEntity> findAllByBatchPublicIdOrderBySubmittedAtAsc(UUID batchId);
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(UUID guestId);
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdOrderBySubmittedAtDesc(UUID guestId);
    List<KidsChampSubmissionEntity> findAllByPublicIdInAndDeletedAtIsNull(Collection<UUID> ids);
    Optional<KidsChampSubmissionEntity> findFirstByChildProfilePublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(UUID childId);
}

interface KidsChampBatchRepository extends JpaRepository<KidsChampBatchEntity, Long> {
    Optional<KidsChampBatchEntity> findByPublicId(UUID id);
    List<KidsChampBatchEntity> findAllByOrderByCreatedAtDesc();
    List<KidsChampBatchEntity> findAllByDeleteAfterBeforeAndDeletedAtIsNull(Instant now);
    boolean existsByBatchCode(String code);
}

interface KidsChampAuditRepository extends JpaRepository<KidsChampAuditEntity, Long> {
    List<KidsChampAuditEntity> findTop500ByOrderByCreatedAtDesc();
}

interface KidsChampSettingsRepository extends JpaRepository<KidsChampSettingsEntity, Short> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from KidsChampSettingsEntity s where s.id=:id")
    Optional<KidsChampSettingsEntity> findLockedById(@org.springframework.data.repository.query.Param("id") Short id);
}

interface KidsChampCalendarTaskRepository extends JpaRepository<KidsChampCalendarTaskEntity, Long> {
    Optional<KidsChampCalendarTaskEntity> findByPublicIdAndDeletedAtIsNull(UUID id);
    List<KidsChampCalendarTaskEntity> findAllByDeletedAtIsNullOrderByTaskDateAscCreatedAtAsc();
}
interface KidsChampMessageCampaignRepository extends JpaRepository<KidsChampMessageCampaignEntity,Long>{List<KidsChampMessageCampaignEntity> findAllByOrderByCreatedAtDesc();}
interface KidsChampMessageRecipientRepository extends JpaRepository<KidsChampMessageRecipientEntity,Long>{List<KidsChampMessageRecipientEntity> findTop20ByStatusOrderByIdAsc(String status);}
interface KidsChampWhatsAppConfigRepository extends JpaRepository<KidsChampWhatsAppConfigEntity,Short>{}
interface KidsChampIgnoredGuestMatchRepository extends JpaRepository<KidsChampIgnoredGuestMatchEntity,Long>{
    boolean existsByFirstGuestIdAndSecondGuestId(UUID firstGuestId,UUID secondGuestId);
}
