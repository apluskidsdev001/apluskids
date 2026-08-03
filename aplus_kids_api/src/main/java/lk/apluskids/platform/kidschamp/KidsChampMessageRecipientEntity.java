package lk.apluskids.platform.kidschamp;
import jakarta.persistence.*;import java.time.Instant;import java.util.UUID;
@Entity @Table(name="kids_champ_message_recipients") class KidsChampMessageRecipientEntity{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY)private Long id;@ManyToOne(fetch=FetchType.LAZY)@JoinColumn(name="campaign_id",nullable=false)private KidsChampMessageCampaignEntity campaign;
 @Column(name="participant_reference",nullable=false)private UUID participantReference;@Column(name="participant_name",nullable=false,length=120)private String participantName;
 @Column(nullable=false,length=254)private String destination;@Column(name="rendered_message",nullable=false,length=1200)private String renderedMessage;
 @Column(name="template_name",length=120)private String templateName;@Column(name="template_language_code",length=20)private String templateLanguageCode;@Column(name="template_parameters",columnDefinition="TEXT")private String templateParameters;
 @Column(nullable=false,length=24)private String status;@Column(nullable=false)private int attempts;@Column(name="provider_message_id",length=160)private String providerMessageId;
 @Column(name="failure_reason",length=600)private String failureReason;@Column(name="sent_at")private Instant sentAt;
 void create(KidsChampMessageCampaignEntity c,UUID ref,String name,String destination,String message,String templateName,String templateLanguageCode,java.util.List<String> templateParameters){campaign=c;participantReference=ref;participantName=name;this.destination=destination;renderedMessage=message;this.templateName=templateName;this.templateLanguageCode=templateLanguageCode;this.templateParameters=templateParameters==null?null:String.join("\u001F",templateParameters);status="QUEUED";}
 Long getId(){return id;}KidsChampMessageCampaignEntity getCampaign(){return campaign;}String getDestination(){return destination;}String getRenderedMessage(){return renderedMessage;}String getTemplateName(){return templateName;}String getTemplateLanguageCode(){return templateLanguageCode;}java.util.List<String> getTemplateParameters(){return templateParameters==null||templateParameters.isBlank()?java.util.List.of():java.util.List.of(templateParameters.split("\u001F",-1));}String getProviderMessageId(){return providerMessageId;}String getStatus(){return status;}int getAttempts(){return attempts;}String getFailureReason(){return failureReason;}String getParticipantName(){return participantName;}Instant getSentAt(){return sentAt;}
 void sending(){status="SENDING";attempts++;failureReason=null;}
 void sent(String messageId){status="SENT";providerMessageId=messageId;sentAt=Instant.now();failureReason=null;}
 void delivered(){if("SENT".equals(status)||"DELIVERED".equals(status))status="DELIVERED";}
 void read(){if("SENT".equals(status)||"DELIVERED".equals(status)||"READ".equals(status))status="READ";}
 void failed(String reason){status="FAILED";failureReason=reason==null?"Provider rejected the message.":reason.substring(0,Math.min(reason.length(),600));}
 void retry(){if(!"FAILED".equals(status))throw new IllegalStateException("Only failed messages can be retried.");if(attempts>=3)throw new IllegalStateException("This message has reached the maximum of three delivery attempts.");status="QUEUED";failureReason=null;}
 void skip(){if(!"FAILED".equals(status))throw new IllegalStateException("Only failed messages can be ignored.");status="SKIPPED";}
 void delete(){if(!"FAILED".equals(status))throw new IllegalStateException("Only failed messages can be deleted.");status="DELETED";}
}
