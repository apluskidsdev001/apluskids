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
    List<KidsChampGuestContactEntity> findAllByPublicIdIn(Collection<UUID> ids);
}

interface KidsChampGuestParticipantRepository extends JpaRepository<KidsChampGuestParticipantEntity, Long> {
    Optional<KidsChampGuestParticipantEntity> findByPublicId(UUID publicId);
    Optional<KidsChampGuestParticipantEntity> findByGuestContactAndNormalizedChildNameAndDateOfBirth(
        KidsChampGuestContactEntity guestContact, String normalizedChildName, java.time.LocalDate dateOfBirth
    );
    List<KidsChampGuestParticipantEntity> findAllByGuestContactPublicIdIn(Collection<UUID> guestIds);
}

interface KidsChampSubmissionRepository extends JpaRepository<KidsChampSubmissionEntity, Long>, JpaSpecificationExecutor<KidsChampSubmissionEntity> {
    Optional<KidsChampSubmissionEntity> findByPublicId(UUID id);
    Optional<KidsChampSubmissionEntity> findByTrackingCodeIgnoreCase(String trackingCode);
    List<KidsChampSubmissionEntity> findAllByUserPublicIdOrderBySubmittedAtDesc(UUID userId);
    List<KidsChampSubmissionEntity> findAllByDeletedAtIsNullOrderBySubmittedAtDesc();
    Page<KidsChampSubmissionEntity> findByDeletedAtIsNull(Pageable pageable);
    boolean existsByTrackingCodeIgnoreCase(String trackingCode);
    List<KidsChampSubmissionEntity> findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAscIdAsc(
        ReviewStatus status, Pageable pageable
    );
    List<KidsChampSubmissionEntity> findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNullOrderBySubmittedAtAscIdAsc(
        ReviewStatus status, Pageable pageable
    );
    long countByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNull(ReviewStatus status);
    List<KidsChampSubmissionEntity> findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(UUID batchId);
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(UUID guestId);
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdOrderBySubmittedAtDesc(UUID guestId);
    List<KidsChampSubmissionEntity> findAllByUserPublicIdIn(Collection<UUID> userIds);
    List<KidsChampSubmissionEntity> findAllByGuestContactPublicIdIn(Collection<UUID> guestIds);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<KidsChampSubmissionEntity> findAllByPublicIdInAndDeletedAtIsNull(Collection<UUID> ids);
    Optional<KidsChampSubmissionEntity> findFirstByChildProfilePublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(UUID childId);
}

interface KidsChampBatchRepository extends JpaRepository<KidsChampBatchEntity, Long> {
    Optional<KidsChampBatchEntity> findByPublicId(UUID id);
    List<KidsChampBatchEntity> findAllByOrderByCreatedAtDescIdDesc();
    List<KidsChampBatchEntity> findAllByDeleteAfterBeforeAndDeletedAtIsNull(Instant now);
    boolean existsByBatchCode(String code);
}

interface KidsChampAuditRepository extends JpaRepository<KidsChampAuditEntity, Long> {
    List<KidsChampAuditEntity> findTop500ByOrderByCreatedAtDesc();
    void deleteAllByEntityPublicIdIn(Collection<UUID> entityIds);
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
interface KidsChampMessageRecipientRepository extends JpaRepository<KidsChampMessageRecipientEntity,Long>{
    @Lock(LockModeType.PESSIMISTIC_WRITE) List<KidsChampMessageRecipientEntity> findTop20ByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc(String status,java.time.Instant now);
    List<KidsChampMessageRecipientEntity> findAllByStatusAndLastAttemptAtBefore(String status,java.time.Instant cutoff);
    List<KidsChampMessageRecipientEntity> findAllByCampaignPublicIdOrderByIdAsc(UUID campaignId);
    Optional<KidsChampMessageRecipientEntity> findByProviderMessageId(String providerMessageId);
    void deleteAllByParticipantReferenceIn(Collection<UUID> participantIds);
}
interface KidsChampWhatsAppConfigRepository extends JpaRepository<KidsChampWhatsAppConfigEntity,Short>{}
interface KidsChampIgnoredGuestMatchRepository extends JpaRepository<KidsChampIgnoredGuestMatchEntity,Long>{
    boolean existsByFirstGuestIdAndSecondGuestId(UUID firstGuestId,UUID secondGuestId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from KidsChampIgnoredGuestMatchEntity value where value.firstGuestId in :guestIds or value.secondGuestId in :guestIds")
    void deleteAllByGuestIdIn(@org.springframework.data.repository.query.Param("guestIds") Collection<UUID> guestIds);
}
