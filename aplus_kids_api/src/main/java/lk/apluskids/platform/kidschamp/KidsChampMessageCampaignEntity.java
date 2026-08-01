package lk.apluskids.platform.kidschamp;
import jakarta.persistence.*;import java.time.*;import java.util.UUID;import lk.apluskids.platform.user.UserEntity;
@Entity @Table(name="kids_champ_message_campaigns") class KidsChampMessageCampaignEntity{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;@Column(name="public_id",nullable=false,unique=true) private UUID publicId;
 @Column(nullable=false,length=20) private String channel;@Column(name="message_template",nullable=false,length=1000) private String messageTemplate;
 @Column(nullable=false,length=24) private String status;@Column(name="recipient_count",nullable=false) private int recipientCount;
 @ManyToOne(fetch=FetchType.LAZY)@JoinColumn(name="created_by_user_id",nullable=false)private UserEntity createdBy;
 @Column(name="created_at",nullable=false,insertable=false,updatable=false)private Instant createdAt;@Column(name="queued_at")private Instant queuedAt;
 @PrePersist void insert(){if(publicId==null)publicId=UUID.randomUUID();if(status==null)status="QUEUED";if(queuedAt==null)queuedAt=Instant.now();}
 Long getId(){return id;}UUID getPublicId(){return publicId;}String getChannel(){return channel;}String getMessageTemplate(){return messageTemplate;}
 String getStatus(){return status;}int getRecipientCount(){return recipientCount;}Instant getCreatedAt(){return createdAt;}
 void create(String channel,String template,int count,UserEntity actor){this.channel=channel;messageTemplate=template;recipientCount=count;createdBy=actor;status="QUEUED";}
 void complete(){status="COMPLETED";}
 void fail(){status="FAILED";}
}
