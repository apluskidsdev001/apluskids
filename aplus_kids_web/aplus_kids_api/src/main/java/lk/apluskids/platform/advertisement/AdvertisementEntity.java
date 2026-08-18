package lk.apluskids.platform.advertisement;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="advertisements")
class AdvertisementEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id",nullable=false,unique=true,updatable=false) private UUID publicId;
    @Column(nullable=false,length=160) private String name;
    @Column(name="content_type",nullable=false,length=24) private String contentType;
    @Column(nullable=false,length=24) private String status;
    @Column(length=180) private String title;
    @Column(columnDefinition="TEXT") private String description;
    @Column(name="button_label",length=80) private String buttonLabel;
    @Column(name="alt_text",length=300) private String altText;
    @Column(name="destination_url",length=2048) private String destinationUrl;
    @Column(name="open_new_tab",nullable=false) private boolean openNewTab;
    @Column(name="fit_mode",nullable=false,length=16) private String fitMode;
    @Column(name="background_color",nullable=false,length=16) private String backgroundColor;
    @Column(name="desktop_filename") private String desktopFilename;
    @Column(name="desktop_original_name") private String desktopOriginalName;
    @Column(name="desktop_media_type",length=100) private String desktopMediaType;
    @Column(name="mobile_filename") private String mobileFilename;
    @Column(name="mobile_original_name") private String mobileOriginalName;
    @Column(name="mobile_media_type",length=100) private String mobileMediaType;
    @Column(name="external_source_url",length=2048) private String externalSourceUrl;
    @Column(name="starts_at") private Instant startsAt;
    @Column(name="ends_at") private Instant endsAt;
    @Column(nullable=false) private int priority;
    @Column(name="rotation_weight",nullable=false) private int rotationWeight;
    @Column(name="impression_count",nullable=false) private long impressionCount;
    @Column(name="click_count",nullable=false) private long clickCount;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by") private UserEntity createdBy;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="updated_by") private UserEntity updatedBy;
    @Column(name="archived_at") private Instant archivedAt;
    @Column(name="created_at",nullable=false,insertable=false,updatable=false) private Instant createdAt;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Version private long version;
    @PrePersist void insert(){Instant now=Instant.now();if(publicId==null)publicId=UUID.randomUUID();if(status==null)status="DRAFT";if(fitMode==null)fitMode="CONTAIN";if(backgroundColor==null)backgroundColor="#FFFFFF";if(rotationWeight<1)rotationWeight=1;if(createdAt==null)createdAt=now;updatedAt=now;}
    @PreUpdate void updateTime(){updatedAt=Instant.now();}
    Long id(){return id;} UUID publicId(){return publicId;} String name(){return name;} String contentType(){return contentType;} String status(){return status;} String title(){return title;} String description(){return description;} String buttonLabel(){return buttonLabel;} String altText(){return altText;} String destinationUrl(){return destinationUrl;} boolean openNewTab(){return openNewTab;} String fitMode(){return fitMode;} String backgroundColor(){return backgroundColor;} String desktopFilename(){return desktopFilename;} String desktopOriginalName(){return desktopOriginalName;} String desktopMediaType(){return desktopMediaType;} String mobileFilename(){return mobileFilename;} String mobileOriginalName(){return mobileOriginalName;} String mobileMediaType(){return mobileMediaType;} String externalSourceUrl(){return externalSourceUrl;} Instant startsAt(){return startsAt;} Instant endsAt(){return endsAt;} int priority(){return priority;} int rotationWeight(){return rotationWeight;} long impressionCount(){return impressionCount;} long clickCount(){return clickCount;} Instant archivedAt(){return archivedAt;} Instant createdAt(){return createdAt;} Instant updatedAt(){return updatedAt;}
    void metadata(String n,String ct,String t,String d,String b,String alt,String url,boolean newTab,String fit,String bg,Instant start,Instant end,int p,int weight,String external){name=n;contentType=ct;title=t;description=d;buttonLabel=b;altText=alt;destinationUrl=url;openNewTab=newTab;fitMode=fit;backgroundColor=bg;startsAt=start;endsAt=end;priority=p;rotationWeight=weight;externalSourceUrl=external;}
    void desktop(String stored,String original,String media){desktopFilename=stored;desktopOriginalName=original;desktopMediaType=media;}
    void mobile(String stored,String original,String media){mobileFilename=stored;mobileOriginalName=original;mobileMediaType=media;}
    void status(String value){status=value;if("ARCHIVED".equals(value))archivedAt=Instant.now();else archivedAt=null;} void createdBy(UserEntity v){createdBy=v;} void updatedBy(UserEntity v){updatedBy=v;}
}
