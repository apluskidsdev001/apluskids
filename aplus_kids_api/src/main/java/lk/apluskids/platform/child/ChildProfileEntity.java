package lk.apluskids.platform.child;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "child_profiles")
public class ChildProfileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Gender gender;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false, length = 120)
    private String province;

    @Column(nullable = false, length = 120)
    private String hometown;

    @Column(length = 300)
    private String address;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    @PrePersist
    void beforeInsert() {
        if (publicId == null) publicId = UUID.randomUUID();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void beforeUpdate() { updatedAt = Instant.now(); }

    public UUID getPublicId() { return publicId; }
    public UserEntity getUser() { return user; }
    public String getFullName() { return fullName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public Gender getGender() { return gender; }
    public String getCountryCode() { return countryCode; }
    public String getProvince() { return province; }
    public String getHometown() { return hometown; }
    public String getAddress() { return address; }
    public void setUser(UserEntity value) { user = value; }
    public void setFullName(String value) { fullName = value; }
    public void setDateOfBirth(LocalDate value) { dateOfBirth = value; }
    public void setGender(Gender value) { gender = value; }
    public void setCountryCode(String value) { countryCode = value; }
    public void setProvince(String value) { province = value; }
    public void setHometown(String value) { hometown = value; }
    public void setAddress(String value) { address = value; }
}
