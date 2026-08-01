package lk.apluskids.platform.kidschamp;
import jakarta.persistence.*;import java.time.Instant;import java.util.UUID;
@Entity @Table(name="kids_champ_message_recipients") class KidsChampMessageRecipientEntity{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY)private Long id;@ManyToOne(fetch=FetchType.LAZY)@JoinColumn(name="campaign_id",nullable=false)private KidsChampMessageCampaignEntity campaign;
 @Column(name="participant_reference",nullable=false)private UUID participantReference;@Column(name="participant_name",nullable=false,length=120)private String participantName;
 @Column(nullable=false,length=254)private String destination;@Column(name="rendered_message",nullable=false,length=1200)private String renderedMessage;
 @Column(nullable=false,length=24)private String status;@Column(nullable=false)private int attempts;@Column(name="provider_message_id",length=160)private String providerMessageId;
 @Column(name="failure_reason",length=600)private String failureReason;@Column(name="sent_at")private Instant sentAt;
 void create(KidsChampMessageCampaignEntity c,UUID ref,String name,String destination,String message){campaign=c;participantReference=ref;participantName=name;this.destination=destination;renderedMessage=message;status="QUEUED";}
 Long getId(){return id;}KidsChampMessageCampaignEntity getCampaign(){return campaign;}String getDestination(){return destination;}String getRenderedMessage(){return renderedMessage;}
 void sending(){status="SENDING";attempts++;failureReason=null;}
 void sent(String messageId){status="SENT";providerMessageId=messageId;sentAt=Instant.now();failureReason=null;}
 void failed(String reason){status="FAILED";failureReason=reason==null?"Provider rejected the message.":reason.substring(0,Math.min(reason.length(),600));}
}
