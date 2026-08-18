package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_settings")
class KidsChampSettingsEntity {
    @Id private Short id;
    @Column(nullable=false) private String categories;
    @Column(name="max_file_size_mb",nullable=false) private int maxFileSizeMb;
    @Column(name="allowed_file_types",nullable=false) private String allowedFileTypes;
    @Column(name="minimum_age",nullable=false) private int minimumAge;
    @Column(name="maximum_age",nullable=false) private int maximumAge;
    @Column(name="daily_telecast_limit",nullable=false) private int dailyTelecastLimit;
    @Column(name="default_telecast_time",nullable=false) private LocalTime defaultTelecastTime;
    @Column(name="zip_batch_size",nullable=false) private int zipBatchSize;
    @Column(name="zip_expiry_days",nullable=false) private int zipExpiryDays;
    @Column(name="zip_warning_days",nullable=false) private int zipWarningDays;
    @Column(name="active_zip_target_size") private Integer activeZipTargetSize;
    @Column(name="active_zip_started_at") private Instant activeZipStartedAt;
    @Column(name="frequent_participant_threshold",nullable=false) private int frequentParticipantThreshold;
    @Column(name="require_whatsapp_consent",nullable=false) private boolean requireWhatsAppConsent;
    @Column(name="campaign_limit",nullable=false) private int campaignLimit;
    @Column(name="default_message",nullable=false,length=1000) private String defaultMessage;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="updated_by_user_id") private UserEntity updatedBy;

    public String getCategories(){return categories;} public int getMaxFileSizeMb(){return maxFileSizeMb;}
    public String getAllowedFileTypes(){return allowedFileTypes;} public int getMinimumAge(){return minimumAge;}
    public int getMaximumAge(){return maximumAge;} public int getDailyTelecastLimit(){return dailyTelecastLimit;}
    public LocalTime getDefaultTelecastTime(){return defaultTelecastTime;} public int getZipBatchSize(){return zipBatchSize;}
    public int getZipExpiryDays(){return zipExpiryDays;} public int getZipWarningDays(){return zipWarningDays;}
    public Integer getActiveZipTargetSize(){return activeZipTargetSize;} public Instant getActiveZipStartedAt(){return activeZipStartedAt;}
    public void startActiveZip(int target){if(activeZipTargetSize==null){activeZipTargetSize=target;activeZipStartedAt=Instant.now();}}
    public void replaceActiveZipTarget(int target){activeZipTargetSize=target;if(activeZipStartedAt==null)activeZipStartedAt=Instant.now();}
    public void completeActiveZip(){activeZipTargetSize=null;activeZipStartedAt=null;}
    public int getFrequentParticipantThreshold(){return frequentParticipantThreshold;}
    public boolean isRequireWhatsAppConsent(){return requireWhatsAppConsent;} public int getCampaignLimit(){return campaignLimit;}
    public String getDefaultMessage(){return defaultMessage;} public Instant getUpdatedAt(){return updatedAt;}
    public void update(String categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,
        int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,
        int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage,UserEntity actor){
        this.categories=categories;this.maxFileSizeMb=maxFileSizeMb;this.allowedFileTypes=allowedFileTypes;
        this.minimumAge=minimumAge;this.maximumAge=maximumAge;this.dailyTelecastLimit=dailyTelecastLimit;
        this.defaultTelecastTime=defaultTelecastTime;this.zipBatchSize=zipBatchSize;this.zipExpiryDays=zipExpiryDays;
        this.zipWarningDays=zipWarningDays;this.frequentParticipantThreshold=frequentParticipantThreshold;
        this.requireWhatsAppConsent=requireWhatsAppConsent;this.campaignLimit=campaignLimit;this.defaultMessage=defaultMessage;
        this.updatedBy=actor;this.updatedAt=Instant.now();
    }
}
