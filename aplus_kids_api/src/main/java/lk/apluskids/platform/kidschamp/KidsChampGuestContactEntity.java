package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "kids_champ_guest_contacts")
public class KidsChampGuestContactEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;
    @Column(name = "phone_e164", nullable = false, unique = true, length = 20)
    private String phoneE164;
    @Column(length = 254) private String email;
    @Column(name = "parent_name", nullable = false, length = 120) private String parentName;
    @Column(name = "country_code", nullable = false, length = 2) private String countryCode;
    @Column(nullable = false, length = 120) private String province;
    @Column(nullable = false, length = 120) private String hometown;
    @Column(name = "submission_count", nullable = false) private int submissionCount;
    @Column(name = "first_submitted_at", nullable = false) private Instant firstSubmittedAt;
    @Column(name = "last_submitted_at", nullable = false) private Instant lastSubmittedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="claimed_by_user_id") private UserEntity claimedBy;
    @Column(name="claimed_at") private Instant claimedAt;
    @Column(name="deleted_at") private Instant deletedAt;

    @PrePersist void insert() {
        var now = Instant.now();
        if (publicId == null) publicId = UUID.randomUUID();
        if (firstSubmittedAt == null) firstSubmittedAt = now;
        if (lastSubmittedAt == null) lastSubmittedAt = now;
    }
    public Long getId() { return id; }
    public UUID getPublicId() { return publicId; }
    public String getPhoneE164() { return phoneE164; }
    public String getEmail() { return email; }
    public String getParentName() { return parentName; }
    public String getCountryCode() { return countryCode; }
    public String getProvince() { return province; }
    public String getHometown() { return hometown; }
    public int getSubmissionCount() { return submissionCount; }
    public Instant getFirstSubmittedAt() { return firstSubmittedAt; }
    public Instant getLastSubmittedAt() { return lastSubmittedAt; }
    public UserEntity getClaimedBy() { return claimedBy; }
    public Instant getClaimedAt() { return claimedAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public void recordSubmission() { submissionCount++; lastSubmittedAt = Instant.now(); }
    public void setPhoneE164(String value) { phoneE164 = value; }
    public void setEmail(String value) { email = value; }
    public void setParentName(String value) { parentName = value; }
    public void setCountryCode(String value) { countryCode = value; }
    public void setProvince(String value) { province = value; }
    public void setHometown(String value) { hometown = value; }
    public void claim(UserEntity user) { claimedBy=user; claimedAt=Instant.now(); }
    public void setDeletedAt(Instant value) { deletedAt=value; }
    public void absorb(KidsChampGuestContactEntity source) {
        submissionCount += source.submissionCount;
        if (source.firstSubmittedAt.isBefore(firstSubmittedAt)) firstSubmittedAt = source.firstSubmittedAt;
        if (source.lastSubmittedAt.isAfter(lastSubmittedAt)) lastSubmittedAt = source.lastSubmittedAt;
    }
}
