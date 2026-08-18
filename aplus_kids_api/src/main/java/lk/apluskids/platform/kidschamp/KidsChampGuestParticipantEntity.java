package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name="kids_champ_guest_participants")
class KidsChampGuestParticipantEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id", nullable=false, unique=true, updatable=false) private UUID publicId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="guest_contact_id", nullable=false) private KidsChampGuestContactEntity guestContact;
    @Column(name="child_name", nullable=false, length=120) private String childName;
    @Column(name="normalized_child_name", nullable=false, length=120) private String normalizedChildName;
    @Column(name="date_of_birth", nullable=false) private LocalDate dateOfBirth;
    @Column(nullable=false, length=120) private String province;
    @Column(nullable=false, length=120) private String hometown;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;
    @Version private long version;

    @PrePersist void insert(){var now=Instant.now();if(publicId==null)publicId=UUID.randomUUID();if(normalizedChildName==null)normalizedChildName=normalizeName(childName);if(createdAt==null)createdAt=now;updatedAt=now;}
    @PreUpdate void update(){updatedAt=Instant.now();}
    static String normalizeName(String value){return value.trim().replaceAll("\\s+"," ").toLowerCase(Locale.ROOT);}
    void setGuestContact(KidsChampGuestContactEntity value){guestContact=value;}
    void setChildName(String value){childName=value;normalizedChildName=normalizeName(value);}
    void setDateOfBirth(LocalDate value){dateOfBirth=value;}
    void setProvince(String value){province=value;}
    void setHometown(String value){hometown=value;}
    UUID getPublicId(){return publicId;}
    Long getId(){return id;}
    KidsChampGuestContactEntity getGuestContact(){return guestContact;}
    String getChildName(){return childName;}
    LocalDate getDateOfBirth(){return dateOfBirth;}
    String getHometown(){return hometown;}
}
