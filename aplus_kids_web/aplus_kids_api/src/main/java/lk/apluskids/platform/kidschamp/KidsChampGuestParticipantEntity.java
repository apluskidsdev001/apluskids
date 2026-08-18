package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_guest_participants")
public class KidsChampGuestParticipantEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id",nullable=false,unique=true,updatable=false) private UUID publicId;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="guest_contact_id",nullable=false) private KidsChampGuestContactEntity contact;
    @Column(name="child_name",nullable=false,length=120) private String childName;
    @Column(name="normalized_child_name",nullable=false,length=120) private String normalizedChildName;
    @Column(name="date_of_birth",nullable=false) private LocalDate dateOfBirth;
    @Column(nullable=false,length=120) private String province;
    @Column(nullable=false,length=120) private String hometown;
    @Column(name="merged_into_reference") private UUID mergedIntoReference;
    @Column(name="merged_into_type",length=24) private String mergedIntoType;
    @Column(name="merged_at") private Instant mergedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="merged_by_user_id") private UserEntity mergedBy;
    @Column(name="merge_reason",length=600) private String mergeReason;
    @Column(name="created_at",nullable=false,insertable=false,updatable=false) private Instant createdAt;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Version private long version;

    @PrePersist void insert(){if(publicId==null)publicId=UUID.randomUUID();updatedAt=Instant.now();}
    @PreUpdate void update(){updatedAt=Instant.now();}
    public Long getId(){return id;} public UUID getPublicId(){return publicId;} public KidsChampGuestContactEntity getContact(){return contact;}
    public String getChildName(){return childName;} public String getNormalizedChildName(){return normalizedChildName;} public LocalDate getDateOfBirth(){return dateOfBirth;}
    public String getProvince(){return province;} public String getHometown(){return hometown;} public UUID getMergedIntoReference(){return mergedIntoReference;}
    public String getMergedIntoType(){return mergedIntoType;} public Instant getMergedAt(){return mergedAt;} public String getMergeReason(){return mergeReason;}
    public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
    public void setContact(KidsChampGuestContactEntity value){contact=value;} public void setChildName(String value){childName=value;normalizedChildName=normalize(value);}
    public void setDateOfBirth(LocalDate value){dateOfBirth=value;} public void setProvince(String value){province=value;} public void setHometown(String value){hometown=value;}
    public void markMerged(UUID target,String type,UserEntity actor,String reason){mergedIntoReference=target;mergedIntoType=type;mergedAt=Instant.now();mergedBy=actor;mergeReason=reason;}
    public void undoMerge(){mergedIntoReference=null;mergedIntoType=null;mergedAt=null;mergedBy=null;mergeReason=null;}
    static String normalize(String value){return value==null?"":value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+"," ");}
}
