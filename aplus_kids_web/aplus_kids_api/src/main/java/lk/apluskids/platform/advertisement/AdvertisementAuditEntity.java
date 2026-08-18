package lk.apluskids.platform.advertisement;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="advertisement_audit_history")
class AdvertisementAuditEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="advertisement_id") private AdvertisementEntity advertisement;
    @Column(name="advertisement_public_id",nullable=false) private UUID advertisementPublicId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="actor_user_id") private UserEntity actor;
    @Column(nullable=false,length=80) private String action;
    @Column(columnDefinition="TEXT") private String details;
    @Column(name="created_at",nullable=false,insertable=false,updatable=false) private Instant createdAt;
    void values(AdvertisementEntity ad,UserEntity user,String value,String text){advertisement=ad;advertisementPublicId=ad.publicId();actor=user;action=value;details=text;}
    UUID advertisementPublicId(){return advertisementPublicId;} String action(){return action;} String details(){return details;} Instant createdAt(){return createdAt;} String actorName(){return actor==null?"System":actor.getAccountHolderName();}
}
