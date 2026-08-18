package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_participant_merges")
public class KidsChampParticipantMergeEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id",nullable=false,unique=true,updatable=false) private UUID publicId;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="source_guest_participant_id",nullable=false) private KidsChampGuestParticipantEntity source;
    @Column(name="target_reference",nullable=false) private UUID targetReference;
    @Column(name="target_type",nullable=false,length=24) private String targetType;
    @Column(nullable=false,length=600) private String reason;
    @Column(name="matching_reasons") private String matchingReasons;
    @Column(name="moved_submission_count",nullable=false) private int movedSubmissionCount;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="merged_by_user_id") private UserEntity mergedBy;
    @Column(name="merged_at",nullable=false,updatable=false) private Instant mergedAt;
    @Column(name="undone_at") private Instant undoneAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="undone_by_user_id") private UserEntity undoneBy;
    @Column(name="undo_reason",length=600) private String undoReason;
    @Version private long version;
    @PrePersist void insert(){if(publicId==null)publicId=UUID.randomUUID();}
    public Long getId(){return id;} public UUID getPublicId(){return publicId;} public KidsChampGuestParticipantEntity getSource(){return source;}
    public UUID getTargetReference(){return targetReference;} public String getTargetType(){return targetType;} public String getReason(){return reason;}
    public String getMatchingReasons(){return matchingReasons;} public int getMovedSubmissionCount(){return movedSubmissionCount;} public UserEntity getMergedBy(){return mergedBy;}
    public Instant getMergedAt(){return mergedAt;} public Instant getUndoneAt(){return undoneAt;} public UserEntity getUndoneBy(){return undoneBy;} public String getUndoReason(){return undoReason;}
    public void create(KidsChampGuestParticipantEntity source,UUID target,String type,String reason,List<String> matches,int moved,UserEntity actor){
        this.source=source;targetReference=target;targetType=type;this.reason=reason;matchingReasons=String.join("\n",matches==null?List.of():matches);movedSubmissionCount=moved;mergedBy=actor;mergedAt=Instant.now();
    }
    public void undo(UserEntity actor,String reason){undoneAt=Instant.now();undoneBy=actor;undoReason=reason;}
}
