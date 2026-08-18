package lk.apluskids.platform.kidschamp;

import java.time.*;
import java.util.UUID;

public record KidsChampResponse(
    UUID id,
    UUID childId,
    String trackingCode,
    String childName,
    LocalDate dateOfBirth,
    int ageAtSubmission,
    String workTitle,
    ReviewStatus reviewStatus,
    String rejectionReason,
    TelecastStatus telecastStatus,
    LocalDate telecastDate,
    LocalDate alternateTelecastDate,
    Instant submittedAt,
    boolean photoAvailable
) {
    static KidsChampResponse from(KidsChampSubmissionEntity item) {
        KidsChampBatchEntity batch = item.getBatch();
        return new KidsChampResponse(
            item.getPublicId(), item.getChildProfile() == null ? null : item.getChildProfile().getPublicId(),
            item.getTrackingCode(), item.getChildName(),
            item.getDateOfBirth(), item.getAgeAtSubmission(), item.getWorkTitle(),
            item.getReviewStatus(), item.getRejectionReason(), item.getTelecastStatus(),
            batch == null ? null : batch.getTelecastDate(),
            batch == null ? null : batch.getAlternateTelecastDate(),
            item.getSubmittedAt(), item.isPhotoAvailable()
        );
    }
}
