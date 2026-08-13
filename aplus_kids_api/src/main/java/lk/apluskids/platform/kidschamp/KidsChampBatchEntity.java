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
    @Column(name="archive_path", length=500) private String archivePath;
    @Column(name="first_downloaded_at") private Instant firstDownloadedAt;
    @Column(name="edited_at") private Instant editedAt;
    @Column(name="retention_days",nullable=false) private int retentionDays;
    @Column(name="warning_days",nullable=false) private int warningDays;
    @Column(name="delete_after") private Instant deleteAfter;
    @Column(name="telecast_date") private LocalDate telecastDate;
    @Column(name="alternate_telecast_date") private LocalDate alternateTelecastDate;
    @Column(name="telecast_completed_at") private Instant telecastCompletedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by_user_id", nullable=false) private UserEntity createdBy;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt;
    @Column(name="deleted_at") private Instant deletedAt;
    @Column(name="purged_at") private Instant purgedAt;
    @Column(name="cleanup_pending",nullable=false) private boolean cleanupPending;
    @Column(name="cleanup_failure_count",nullable=false) private int cleanupFailureCount;
    @Column(name="last_cleanup_attempt_at") private Instant lastCleanupAttemptAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="deleted_by_user_id") private UserEntity deletedBy;
    @Version private long version;

    @PrePersist void insert(){ if(publicId==null) publicId=UUID.randomUUID(); if(status==null) status="READY"; if(retentionDays<1)retentionDays=1;if(createdAt==null)createdAt=Instant.now(); }
    public UUID getPublicId(){return publicId;} public String getBatchCode(){return batchCode;}
    public String getStatus(){return status;} public int getPhotoCount(){return photoCount;}
    public String getArchivePath(){return archivePath;} public Instant getFirstDownloadedAt(){return firstDownloadedAt;}
    public Instant getEditedAt(){return editedAt;}
    public int getRetentionDays(){return retentionDays;} public int getWarningDays(){return warningDays;} public Instant getDeleteAfter(){return deleteAfter;} public LocalDate getTelecastDate(){return telecastDate;}
    public LocalDate getAlternateTelecastDate(){return alternateTelecastDate;} public Instant getCreatedAt(){return createdAt;}
    public Instant getTelecastCompletedAt(){return telecastCompletedAt;}
    public Instant getDeletedAt(){return deletedAt;} public Instant getPurgedAt(){return purgedAt;}
    public boolean isCleanupPending(){return cleanupPending;} public int getCleanupFailureCount(){return cleanupFailureCount;}
    public Instant getLastCleanupAttemptAt(){return lastCleanupAttemptAt;}
    public void setBatchCode(String v){batchCode=v;} public void setPhotoCount(int v){photoCount=v;}
    public void setArchivePath(String v){archivePath=v;} public void setCreatedBy(UserEntity v){createdBy=v;}
    public void startRetention(int days,int warning){retentionDays=Math.max(1,days);warningDays=Math.max(0,Math.min(warning,retentionDays-1));deleteAfter=Instant.now().plus(Duration.ofDays(retentionDays));}
    public void markDownloaded(){if(firstDownloadedAt==null){firstDownloadedAt=Instant.now();status="DOWNLOADED";}}
    public void setEdited(boolean edited){editedAt=edited?Instant.now():null;}
    public void schedule(LocalDate primary, LocalDate alternate){telecastDate=primary;alternateTelecastDate=alternate;}
    public void completeTelecast(){if(telecastDate==null)throw new IllegalStateException("Schedule the telecast before marking it complete.");telecastCompletedAt=Instant.now();}
    public void markDeleted(UserEntity actor){if(deletedAt==null){deletedAt=Instant.now();deletedBy=actor;}status="DELETED";}
    public void requestCleanup(UserEntity actor){markDeleted(actor);cleanupPending=true;cleanupFailureCount=0;}
    public void recordCleanupResult(int failures){cleanupPending=failures>0;cleanupFailureCount=failures;lastCleanupAttemptAt=Instant.now();}
    public void restore(String path){deletedAt=null;deletedBy=null;archivePath=path;deleteAfter=Instant.now().plus(Duration.ofDays(Math.max(1,retentionDays)));cleanupPending=false;cleanupFailureCount=0;status=firstDownloadedAt==null?"READY":"DOWNLOADED";}
    public void markPurged(){purgedAt=Instant.now();}
}
