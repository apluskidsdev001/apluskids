package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_whatsapp_preferences")
class KidsChampWhatsAppPreferenceEntity {
    @Id @Column(name="participant_reference",updatable=false,nullable=false) private UUID participantReference;
    @Column(nullable=false,length=16) private String status;
    @Column(nullable=false,length=40) private String source;
    @Column(length=300) private String reason;
    @Column(name="opted_in_at") private Instant optedInAt;
    @Column(name="opted_out_at") private Instant optedOutAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="updated_by_user_id") private UserEntity updatedBy;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    UUID getParticipantReference(){return participantReference;} String getStatus(){return status;}
    void update(UUID participantId,String next,String reason,UserEntity actor){
        participantReference=participantId;status=next;source="ADMIN";this.reason=reason;updatedBy=actor;updatedAt=Instant.now();
        if("OPTED_IN".equals(next)){optedInAt=updatedAt;optedOutAt=null;}else if("OPTED_OUT".equals(next)){optedOutAt=updatedAt;}else{optedInAt=null;optedOutAt=null;}
    }
}
