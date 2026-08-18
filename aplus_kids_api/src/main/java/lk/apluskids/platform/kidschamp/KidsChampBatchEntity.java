package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_batches")
public class KidsChampBatchEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id", nullable=false, unique=true, updatable=false) private UUID publicId;
    @Column(name="batch_code", nullable=false, unique=true, length=32) private String batchCode;
    @Column(nullable=false, length=24) private String status;
    @Column(name="photo_count", nullable=false) private int photoCount;
    @Column(name="retention_days", nullable=false) private int retentionDays;
    @Column(name="warning_days", nullable=false) private int warningDays;
    @Column(name="archive_path", length=500) private String archivePath;
    @Column(name="first_downloaded_at") private Instant firstDownloadedAt;
    @Column(name="edited_at") private Instant editedAt;
    @Column(name="delete_after") private Instant deleteAfter;
    @Column(name="telecast_date") private LocalDate telecastDate;
    @Column(name="alternate_telecast_date") private LocalDate alternateTelecastDate;
    @Column(name="telecast_completed_at") private Instant telecastCompletedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by_user_id", nullable=false) private UserEntity createdBy;
    @Column(name="created_at", nullable=false, insertable=false, updatable=false) private Instant createdAt;
    @Column(name="deleted_at") private Instant deletedAt;
    @Column(name="purged_at") private Instant purgedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="deleted_by_user_id") private UserEntity deletedBy;
    @Version private long version;

    @PrePersist void insert(){ if(publicId==null) publicId=UUID.randomUUID(); if(status==null) status="READY"; }
    public UUID getPublicId(){return publicId;} public String getBatchCode(){return batchCode;}
    public Long getId(){return id;}
    public String getStatus(){return status;} public int getPhotoCount(){return photoCount;}
    public int getRetentionDays(){return retentionDays;} public int getWarningDays(){return warningDays;}
    public String getArchivePath(){return archivePath;} public Instant getFirstDownloadedAt(){return firstDownloadedAt;}
    public Instant getEditedAt(){return editedAt;}
    public Instant getDeleteAfter(){return deleteAfter;} public LocalDate getTelecastDate(){return telecastDate;}
    public LocalDate getAlternateTelecastDate(){return alternateTelecastDate;} public Instant getCreatedAt(){return createdAt;}
    public Instant getTelecastCompletedAt(){return telecastCompletedAt;}
    public Instant getDeletedAt(){return deletedAt;}
    public Instant getPurgedAt(){return purgedAt;}
    public void setBatchCode(String v){batchCode=v;} public void setPhotoCount(int v){photoCount=v;}
    public void setRetentionPolicy(int retentionDays,int warningDays){
        this.retentionDays=Math.max(1,retentionDays);
        this.warningDays=Math.min(Math.max(0,warningDays),this.retentionDays-1);
    }
    public void setArchivePath(String v){archivePath=v;} public void setCreatedBy(UserEntity v){createdBy=v;}
    public void startRetention(int retentionDays){
        if(deleteAfter==null)deleteAfter=Instant.now().plus(Duration.ofDays(Math.max(1,retentionDays)));
    }
    public void markDownloaded(int retentionDays){
        if(firstDownloadedAt==null){
            firstDownloadedAt=Instant.now();
            if(deleteAfter==null)deleteAfter=firstDownloadedAt.plus(Duration.ofDays(Math.max(1,retentionDays)));
            status="DOWNLOADED";
        }
    }
    public void setEdited(boolean edited){editedAt=edited?Instant.now():null;}
    public void schedule(LocalDate primary, LocalDate alternate){telecastDate=primary;alternateTelecastDate=alternate;}
    public void completeTelecast(){if(telecastDate==null)throw new IllegalStateException("Schedule the telecast before marking it complete.");telecastCompletedAt=Instant.now();}
    public void markDeleted(UserEntity actor){deletedAt=Instant.now();deletedBy=actor;archivePath=null;status="DELETED";}
    public void markPurged(){purgedAt=Instant.now();}
}
