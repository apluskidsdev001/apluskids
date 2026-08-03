package lk.apluskids.platform.kidschamp;

import java.time.*;
import java.util.UUID;

public record KidsChampAdminSubmissionResponse(
    UUID id,
    UUID participantId,
    String trackingCode,
    String childName,
    LocalDate dateOfBirth,
    int ageAtSubmission,
    String parentName,
    String email,
    String phone,
    String countryCode,
    String province,
    String hometown,
    String category,
    String workTitle,
    String workDescription,
    ReviewStatus reviewStatus,
    String rejectionReason,
    TelecastStatus telecastStatus,
    LocalDate telecastDate,
    LocalDate alternateTelecastDate,
    String participantType,
    String reviewer,
    String internalNote,
    Instant reviewedAt,
    Instant submittedAt,
    boolean previewed,
    boolean photoAvailable,
    UUID batchId,
    String originalFilename,
    String mediaType,
    long fileSize
) {
    static KidsChampAdminSubmissionResponse from(KidsChampSubmissionEntity item) {
        KidsChampBatchEntity batch = item.getBatch();
        return new KidsChampAdminSubmissionResponse(
            item.getPublicId(), item.getChildProfile() != null ? item.getChildProfile().getPublicId() : item.getGuestContact().getPublicId(),
            item.getTrackingCode(), item.getChildName(), item.getDateOfBirth(),
            item.getAgeAtSubmission(), item.getParentName(), item.getEmail(), item.getPhoneE164(),
            item.getCountryCode(), item.getProvince(), item.getHometown(), item.getCategory(), item.getWorkTitle(),
            item.getWorkDescription(), item.getReviewStatus(), item.getRejectionReason(),
            item.getTelecastStatus(), batch == null ? null : batch.getTelecastDate(),
            batch == null ? null : batch.getAlternateTelecastDate(),
            item.getUser() == null ? "Guest" : "Registered",
            item.getAssignedReviewer() == null ? "Unassigned" : item.getAssignedReviewer().getAccountHolderName(),
            item.getInternalNote(),
            item.getReviewedAt(), item.getSubmittedAt(), item.getPreviewedAt() != null, item.getStoredFilename() != null,
            batch == null ? null : batch.getPublicId(),
            item.getOriginalFilename(), item.getMediaType(), item.getFileSize()
        );
    }
}
