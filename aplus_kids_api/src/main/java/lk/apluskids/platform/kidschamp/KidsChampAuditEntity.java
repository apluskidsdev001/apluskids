package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_audit_log")
class KidsChampAuditEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="actor_user_id") private UserEntity actor;
    @Column(nullable=false,length=80) private String action;
    @Column(name="entity_type",nullable=false,length=40) private String entityType;
    @Column(name="entity_public_id",nullable=false) private UUID entityPublicId;
    @Column(columnDefinition="TEXT") private String details;
    @Column(name="created_at",nullable=false,insertable=false,updatable=false) private Instant createdAt;
    void setActor(UserEntity v){actor=v;} void setAction(String v){action=v;} void setEntityType(String v){entityType=v;}
    void setEntityPublicId(UUID v){entityPublicId=v;} void setDetails(String v){details=v;}
    UserEntity getActor(){return actor;} String getAction(){return action;} String getEntityType(){return entityType;}
    UUID getEntityPublicId(){return entityPublicId;} String getDetails(){return details;} Instant getCreatedAt(){return createdAt;}
}
