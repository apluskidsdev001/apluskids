package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;
import lk.apluskids.platform.child.ChildProfileEntity;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "kids_champ_submissions")
public class KidsChampSubmissionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false) private UUID publicId;
    @Column(name = "tracking_code", nullable = false, unique = true, updatable = false, length = 32) private String trackingCode;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") private UserEntity user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "child_profile_id") private ChildProfileEntity childProfile;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "guest_contact_id") private KidsChampGuestContactEntity guestContact;
    @Column(name = "child_name", nullable = false, length = 120) private String childName;
    @Column(name = "date_of_birth", nullable = false) private LocalDate dateOfBirth;
    @Column(name = "age_at_submission", nullable = false) private int ageAtSubmission;
    @Column(name = "parent_name", nullable = false, length = 120) private String parentName;
    @Column(length = 254) private String email;
    @Column(name = "phone_e164", nullable = false, length = 20) private String phoneE164;
    @Column(name = "country_code", nullable = false, length = 2) private String countryCode;
    @Column(nullable = false, length = 120) private String province;
    @Column(nullable = false, length = 120) private String hometown;
    @Column(name = "work_title", length = 160) private String workTitle;
    @Column(name = "work_description", length = 1000) private String workDescription;
    @Column(nullable = false, length = 40) private String category;
    @Column(name = "file_status", nullable = false, length = 24) private String fileStatus;
    @Enumerated(EnumType.STRING) @Column(name = "review_status", nullable = false, length = 24) private ReviewStatus reviewStatus;
    @Column(name = "rejection_reason", length = 600) private String rejectionReason;
    @Enumerated(EnumType.STRING) @Column(name = "telecast_status", nullable = false, length = 24) private TelecastStatus telecastStatus;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "batch_id") private KidsChampBatchEntity batch;
    @Column(name = "original_filename", nullable = false, length = 255) private String originalFilename;
    @Column(name = "stored_filename", length = 255) private String storedFilename;
    @Column(name = "media_type", nullable = false, length = 80) private String mediaType;
    @Column(name = "file_size", nullable = false) private long fileSize;
    @Column(name = "consent_accepted_at", nullable = false) private Instant consentAcceptedAt;
    @Column(name = "whatsapp_consent_at") private Instant whatsappConsentAt;
    @Column(name = "submitted_at", nullable = false, insertable = false, updatable = false) private Instant submittedAt;
    @Column(name = "reviewed_at") private Instant reviewedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by_user_id") private UserEntity reviewedBy;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assigned_reviewer_user_id") private UserEntity assignedReviewer;
    @Column(name = "internal_note", length = 1000) private String internalNote;
    @Column(name = "photo_deleted_at") private Instant photoDeletedAt;
    @Column(name = "previewed_at") private Instant previewedAt;
    @Column(name = "deleted_at") private Instant deletedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "deleted_by_user_id") private UserEntity deletedBy;
    @Version private long version;

    @PrePersist void insert() {
        if (publicId == null) publicId = UUID.randomUUID();
        if (reviewStatus == null) reviewStatus = ReviewStatus.SUBMITTED;
        if (telecastStatus == null) telecastStatus = TelecastStatus.NOT_SELECTED;
        if (category == null) category = "Drawing";
        if (fileStatus == null) fileStatus = "READY";
    }
    public UUID getPublicId() { return publicId; }
    public Long getId() { return id; }
    public String getTrackingCode() { return trackingCode; }
    public UserEntity getUser() { return user; }
    public ChildProfileEntity getChildProfile() { return childProfile; }
    public KidsChampGuestContactEntity getGuestContact() { return guestContact; }
    public String getChildName() { return childName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public int getAgeAtSubmission() { return ageAtSubmission; }
    public String getWorkTitle() { return workTitle; }
    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public String getRejectionReason() { return rejectionReason; }
    public TelecastStatus getTelecastStatus() { return telecastStatus; }
    public Instant getSubmittedAt() { return submittedAt; }
    public KidsChampBatchEntity getBatch() { return batch; }
    public String getEmail() { return email; }
    public String getParentName() { return parentName; }
    public String getPhoneE164() { return phoneE164; }
    public String getCountryCode() { return countryCode; }
    public String getProvince() { return province; }
    public String getHometown() { return hometown; }
    public String getOriginalFilename() { return originalFilename; }
    public String getMediaType() { return mediaType; }
    public long getFileSize() { return fileSize; }
    public String getWorkDescription() { return workDescription; }
    public UserEntity getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public Instant getWhatsappConsentAt() { return whatsappConsentAt; }
    public String getCategory() { return category; }
    public String getFileStatus() { return fileStatus; }
    public UserEntity getAssignedReviewer() { return assignedReviewer; }
    public String getInternalNote() { return internalNote; }
    public Instant getDeletedAt() { return deletedAt; }
    public Instant getPhotoDeletedAt() { return photoDeletedAt; }
    public Instant getPreviewedAt() { return previewedAt; }
    public void setTrackingCode(String v) { trackingCode=v; }
    public void setUser(UserEntity v) { user=v; }
    public void setChildProfile(ChildProfileEntity v) { childProfile=v; }
    public void setGuestContact(KidsChampGuestContactEntity v) { guestContact=v; }
    public void setChildName(String v) { childName=v; }
    public void setDateOfBirth(LocalDate v) { dateOfBirth=v; }
    public void setAgeAtSubmission(int v) { ageAtSubmission=v; }
    public void setParentName(String v) { parentName=v; }
    public void setEmail(String v) { email=v; }
    public void setPhoneE164(String v) { phoneE164=v; }
    public void setCountryCode(String v) { countryCode=v; }
    public void setProvince(String v) { province=v; }
    public void setHometown(String v) { hometown=v; }
    public void setWorkTitle(String v) { workTitle=v; }
    public void setWorkDescription(String v) { workDescription=v; }
    public void setCategory(String v) { category=v; }
    public void setAssignedReviewer(UserEntity v) { assignedReviewer=v; }
    public void setInternalNote(String v) { internalNote=v; }
    public void setOriginalFilename(String v) { originalFilename=v; }
    public void setStoredFilename(String v) { storedFilename=v; }
    public String getStoredFilename() { return storedFilename; }
    public boolean isPhotoAvailable() { return storedFilename != null && photoDeletedAt == null; }
    public void setMediaType(String v) { mediaType=v; }
    public void setFileSize(long v) { fileSize=v; }
    public void setBatch(KidsChampBatchEntity v) { batch=v; telecastStatus = TelecastStatus.SELECTED; }
    public void scheduleTelecast() { telecastStatus = TelecastStatus.SCHEDULED; }
    public void markTelecasted() { telecastStatus = TelecastStatus.TELECASTED; }
    public void selectForTelecast(boolean selected) { telecastStatus = selected ? TelecastStatus.SELECTED : TelecastStatus.NOT_SELECTED; }
    public void setConsentAcceptedAt(Instant v) { consentAcceptedAt=v; }
    public void setWhatsappConsentAt(Instant v) { whatsappConsentAt=v; }
    public void review(ReviewStatus status, String reason, UserEntity admin) {
        reviewStatus=status; rejectionReason=reason; reviewedBy=admin; reviewedAt=Instant.now();
    }
    public void markPhotoDeleted() { storedFilename=null; photoDeletedAt=Instant.now(); fileStatus="MISSING"; }
    public void markPhotoDeletionPending() { photoDeletedAt=Instant.now(); fileStatus="MISSING"; }
    public void setPreviewed(boolean previewed) { previewedAt=previewed ? Instant.now() : null; }
    public void softDelete(UserEntity actor) { deletedAt=Instant.now(); deletedBy=actor; }
    public void claim(UserEntity account, ChildProfileEntity child) { user=account; childProfile=child; guestContact=null; }
}
