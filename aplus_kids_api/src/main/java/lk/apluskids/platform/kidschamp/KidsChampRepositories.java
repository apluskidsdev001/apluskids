package lk.apluskids.platform.kidschamp;

import java.util.*;
import java.time.Instant;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

interface KidsChampGuestContactRepository extends JpaRepository<KidsChampGuestContactEntity, Long> {
    Optional<KidsChampGuestContactEntity> findByPhoneE164(String phoneE164);
    List<KidsChampGuestContactEntity> findAllByOrderByLastSubmittedAtDesc();
    Optional<KidsChampGuestContactEntity> findByPublicIdAndClaimedAtIsNull(UUID id);
    Optional<KidsChampGuestContactEntity> findByPublicId(UUID id);
}

interface KidsChampSubmissionRepository extends JpaRepository<KidsChampSubmissionEntity, Long>, JpaSpecificationExecutor<KidsChampSubmissionEntity> {
    Optional<KidsChampSubmissionEntity> findByPublicId(UUID id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from KidsChampSubmissionEntity s where s.publicId=:id")
    Optional<KidsChampSubmissionEntity> findLockedByPublicId(@org.springframework.data.repository.query.Param("id") UUID id);
    Optional<KidsChampSubmissionEntity> findByTrackingCodeIgnoreCase(String trackingCode);
    List<KidsChampSubmissionEntity> findAllByUserPublicIdOrderBySubmittedAtDesc(UUID userId);
    List<KidsChampSubmissionEntity> findAllByDeletedAtIsNullOrderBySubmittedAtDesc();
    Page<KidsChampSubmissionEntity> findByDeletedAtIsNull(Pageable pageable);
    boolean existsByTrackingCodeIgnoreCase(String trackingCode);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Page<KidsChampSubmissionEntity> findLockedByReviewStatusAndBatchIsNullAndDeletedAtIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNull(
        ReviewStatus status, Pageable pageable
    );
    Page<KidsChampSubmissionEntity> findByReviewStatusAndBatchIsNullAndDeletedAtIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNull(
        ReviewStatus status, Pageable pageable
    );
    List<KidsChampSubmissionEntity> findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(UUID batchId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from KidsChampSubmissionEntity s where s.batch.publicId=:batchId order by s.submittedAt asc, s.id asc")
    List<KidsChampSubmissionEntity> findAllByBatchPublicIdForUpdate(@org.springframework.data.repository.query.Param("batchId") UUID batchId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from KidsChampSubmissionEntity s where s.batch is null and s.photoDeletedAt is not null and s.storedFilename is not null order by s.id")
    List<KidsChampSubmissionEntity> findPendingPhotoCleanupForUpdate();
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(UUID guestId);
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdOrderBySubmittedAtDesc(UUID guestId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from KidsChampSubmissionEntity s where s.publicId in :ids and s.deletedAt is null order by s.id")
    List<KidsChampSubmissionEntity> findAllByPublicIdInAndDeletedAtIsNull(@org.springframework.data.repository.query.Param("ids") Collection<UUID> ids);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from KidsChampSubmissionEntity s where s.guestContact.publicId=:guestId order by s.id")
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdForUpdate(@org.springframework.data.repository.query.Param("guestId") UUID guestId);
    Optional<KidsChampSubmissionEntity> findFirstByChildProfilePublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(UUID childId);
}

interface KidsChampBatchRepository extends JpaRepository<KidsChampBatchEntity, Long> {
    Optional<KidsChampBatchEntity> findByPublicId(UUID id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select b from KidsChampBatchEntity b where b.publicId=:id")
    Optional<KidsChampBatchEntity> findLockedByPublicId(@org.springframework.data.repository.query.Param("id") UUID id);
    List<KidsChampBatchEntity> findAllByOrderByCreatedAtDescIdDesc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select b from KidsChampBatchEntity b where (b.deleteAfter<:now and b.deletedAt is null) or b.cleanupPending=true order by b.id")
    List<KidsChampBatchEntity> findExpiredForUpdate(@org.springframework.data.repository.query.Param("now") Instant now);
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
interface KidsChampMessageRecipientRepository extends JpaRepository<KidsChampMessageRecipientEntity,Long>{@Lock(LockModeType.PESSIMISTIC_WRITE) List<KidsChampMessageRecipientEntity> findTop20ByStatusOrderByIdAsc(String status);List<KidsChampMessageRecipientEntity> findAllByCampaignPublicIdOrderByIdAsc(UUID campaignId);Optional<KidsChampMessageRecipientEntity> findByProviderMessageId(String providerMessageId);}
interface KidsChampWhatsAppConfigRepository extends JpaRepository<KidsChampWhatsAppConfigEntity,Short>{}
interface KidsChampIgnoredGuestMatchRepository extends JpaRepository<KidsChampIgnoredGuestMatchEntity,Long>{
    boolean existsByFirstGuestIdAndSecondGuestId(UUID firstGuestId,UUID secondGuestId);
}
