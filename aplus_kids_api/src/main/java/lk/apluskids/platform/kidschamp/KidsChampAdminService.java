package lk.apluskids.platform.kidschamp;

import java.io.*;
import java.awt.image.BufferedImage;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.zip.*;
import javax.imageio.ImageIO;
import jakarta.persistence.EntityManager;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.notification.AccountNotificationService;
import lk.apluskids.platform.user.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KidsChampAdminService {
    private final KidsChampSubmissionRepository submissions; private final KidsChampBatchRepository batches;
    private final KidsChampGuestContactRepository guests; private final KidsChampGuestParticipantRepository guestParticipants;
    private final KidsChampAuditRepository audits; private final UserRepository users; private final KidsChampStorage storage;
    private final KidsChampSettingsRepository settings; private final KidsChampCalendarTaskRepository tasks;
    private final KidsChampMessageCampaignRepository campaigns;private final KidsChampMessageRecipientRepository messageRecipients;
    private final AccountNotificationService notifications; private final ApplicationEventPublisher events;
    private final KidsChampIgnoredGuestMatchRepository ignoredGuestMatches;
    private final KidsChampLiveUpdates liveUpdates;
    private final KidsChampWhatsAppPreferenceRepository whatsappPreferences;
    private final KidsChampWhatsAppTemplateRepository whatsappTemplates;
    private final KidsChampMessageDeliveryEventRepository deliveryEvents;
    private final KidsChampWhatsAppCampaignStatus whatsappCampaignStatus;
    private final EntityManager entityManager;
    KidsChampAdminService(KidsChampSubmissionRepository submissions,KidsChampBatchRepository batches,KidsChampGuestContactRepository guests,KidsChampGuestParticipantRepository guestParticipants,
        KidsChampAuditRepository audits,UserRepository users,KidsChampStorage storage,KidsChampSettingsRepository settings,
        KidsChampCalendarTaskRepository tasks,KidsChampMessageCampaignRepository campaigns,KidsChampMessageRecipientRepository messageRecipients,
        AccountNotificationService notifications,ApplicationEventPublisher events,KidsChampIgnoredGuestMatchRepository ignoredGuestMatches,KidsChampLiveUpdates liveUpdates,
        KidsChampWhatsAppPreferenceRepository whatsappPreferences,KidsChampWhatsAppTemplateRepository whatsappTemplates,
        KidsChampMessageDeliveryEventRepository deliveryEvents,KidsChampWhatsAppCampaignStatus whatsappCampaignStatus,
        EntityManager entityManager){
        this.submissions=submissions;this.batches=batches;this.guests=guests;this.guestParticipants=guestParticipants;this.audits=audits;this.users=users;this.storage=storage;
        this.settings=settings;this.tasks=tasks;this.campaigns=campaigns;this.messageRecipients=messageRecipients;this.notifications=notifications;this.events=events;
        this.ignoredGuestMatches=ignoredGuestMatches;
        this.liveUpdates=liveUpdates;
        this.whatsappPreferences=whatsappPreferences;this.whatsappTemplates=whatsappTemplates;this.deliveryEvents=deliveryEvents;this.whatsappCampaignStatus=whatsappCampaignStatus;
        this.entityManager=entityManager;
    }

    @Transactional(readOnly=true)
    public List<KidsChampAdminSubmissionResponse> submissions(){return submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().map(KidsChampAdminSubmissionResponse::from).toList();}
    @Transactional(readOnly=true) public SubmissionPageResponse submissionsPage(int page,int size,String search,String approval,String location,String category,Integer minAge,Integer maxAge,LocalDate dateFrom,LocalDate dateTo){
        if(page<0||size<1||size>200)throw bad("PAGE_INVALID","Page must be zero or greater and size must be between 1 and 200.");
        if(minAge!=null&&minAge<0||maxAge!=null&&maxAge<0||minAge!=null&&maxAge!=null&&minAge>maxAge)throw bad("FILTER_INVALID","Age filters must be valid and the minimum age cannot exceed the maximum age.");
        if(dateFrom!=null&&dateTo!=null&&dateFrom.isAfter(dateTo))throw bad("FILTER_INVALID","The start date cannot be after the end date.");
        org.springframework.data.jpa.domain.Specification<KidsChampSubmissionEntity> filter=(root,query,builder)->builder.isNull(root.get("deletedAt"));
        if(search!=null&&!search.isBlank()){String value="%"+search.trim().toLowerCase(Locale.ROOT)+"%";filter=filter.and((root,query,builder)->builder.or(builder.like(builder.lower(root.get("childName")),value),builder.like(builder.lower(root.get("trackingCode")),value)));}
        if(location!=null&&!location.isBlank()&&!"All".equalsIgnoreCase(location)){String value="%"+location.trim().toLowerCase(Locale.ROOT)+"%";filter=filter.and((root,query,builder)->builder.like(builder.lower(root.get("hometown")),value));}
        if(category!=null&&!category.isBlank()&&!"All".equalsIgnoreCase(category))filter=filter.and((root,query,builder)->builder.equal(root.get("category"),category.trim()));
        if(minAge!=null)filter=filter.and((root,query,builder)->builder.greaterThanOrEqualTo(root.get("ageAtSubmission"),minAge));
        if(maxAge!=null)filter=filter.and((root,query,builder)->builder.lessThanOrEqualTo(root.get("ageAtSubmission"),maxAge));
        if(dateFrom!=null){Instant from=dateFrom.atStartOfDay(ZoneId.of("Asia/Colombo")).toInstant();filter=filter.and((root,query,builder)->builder.greaterThanOrEqualTo(root.get("submittedAt"),from));}
        if(dateTo!=null){Instant until=dateTo.plusDays(1).atStartOfDay(ZoneId.of("Asia/Colombo")).toInstant();filter=filter.and((root,query,builder)->builder.lessThan(root.get("submittedAt"),until));}
        if("Approved".equalsIgnoreCase(approval))filter=filter.and((root,query,builder)->builder.equal(root.get("reviewStatus"),ReviewStatus.APPROVED));
        else if("Waiting".equalsIgnoreCase(approval))filter=filter.and((root,query,builder)->builder.or(builder.equal(root.get("reviewStatus"),ReviewStatus.SUBMITTED),builder.equal(root.get("reviewStatus"),ReviewStatus.UNDER_REVIEW)));
        else if("Not approved".equalsIgnoreCase(approval))filter=filter.and((root,query,builder)->builder.notEqual(root.get("reviewStatus"),ReviewStatus.APPROVED));
        var result=submissions.findAll(filter,org.springframework.data.domain.PageRequest.of(page,size,org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,"submittedAt")));
        return new SubmissionPageResponse(result.getContent().stream().map(KidsChampAdminSubmissionResponse::from).toList(),result.getNumber(),result.getSize(),result.getTotalElements(),result.getTotalPages());
    }

    @Transactional(readOnly=true)
    public List<GuestResponse> guests(){return guests.findAllByOrderByLastSubmittedAtDesc().stream().filter(g->g.getDeletedAt()==null).map(g->new GuestResponse(
        g.getPublicId(),g.getParentName(),g.getPhoneE164(),g.getEmail(),g.getCountryCode(),g.getProvince(),
        g.getHometown(),g.getSubmissionCount(),g.getFirstSubmittedAt(),g.getLastSubmittedAt())).toList();}

    @Transactional public GuestResponse updateGuest(UUID actorId,UUID id,String name,String email,String phone){
        KidsChampGuestContactEntity guest=guests.findByPublicId(id).orElseThrow(()->bad("GUEST_NOT_FOUND","Guest account was not found."));
        if(guest.getDeletedAt()!=null) throw bad("GUEST_DELETED","Restore this guest account before editing it.");
        String before=guest.getParentName()+" | "+guest.getEmail()+" | "+guest.getPhoneE164();
        if(name!=null&&!name.isBlank())guest.setParentName(name.trim());if(email!=null&&!email.isBlank())guest.setEmail(email.trim().toLowerCase(Locale.ROOT));if(phone!=null&&!phone.isBlank())guest.setPhoneE164(phone.trim());
        audit(user(actorId),"GUEST_ACCOUNT_UPDATED","GUEST",id,"Before: "+before+". After: "+guest.getParentName()+" | "+guest.getEmail()+" | "+guest.getPhoneE164());return guestResponse(guest);
    }
    @Transactional public GuestResponse deleteGuest(UUID actorId,UUID id,String reason){KidsChampGuestContactEntity guest=guests.findByPublicId(id).orElseThrow(()->bad("GUEST_NOT_FOUND","Guest account was not found."));guest.setDeletedAt(Instant.now());audit(user(actorId),"GUEST_ACCOUNT_SOFT_DELETED","GUEST",id,"Deleted "+guest.getParentName()+". Reason: "+(reason==null?"No reason provided.":reason));return guestResponse(guest);}
    @Transactional public GuestResponse restoreGuest(UUID actorId,UUID id){KidsChampGuestContactEntity guest=guests.findByPublicId(id).orElseThrow(()->bad("GUEST_NOT_FOUND","Guest account was not found."));guest.setDeletedAt(null);audit(user(actorId),"GUEST_ACCOUNT_RESTORED","GUEST",id,"Restored "+guest.getParentName());return guestResponse(guest);}
    private GuestResponse guestResponse(KidsChampGuestContactEntity g){return new GuestResponse(g.getPublicId(),g.getParentName(),g.getPhoneE164(),g.getEmail(),g.getCountryCode(),g.getProvince(),g.getHometown(),g.getSubmissionCount(),g.getFirstSubmittedAt(),g.getLastSubmittedAt());}

    @Transactional(readOnly=true)
    public List<DuplicateGuestResponse> duplicateGuests(){
        List<KidsChampGuestContactEntity> values=guests.findAllByOrderByLastSubmittedAtDesc().stream().filter(g->g.getClaimedAt()==null).toList();
        List<DuplicateGuestResponse> result=new ArrayList<>();
        for(int i=0;i<values.size();i++) for(int j=i+1;j<values.size();j++){
            var a=values.get(i);var b=values.get(j);UUID first=first(a.getPublicId(),b.getPublicId()),second=second(a.getPublicId(),b.getPublicId());
            if(ignoredGuestMatches.existsByFirstGuestIdAndSecondGuestId(first,second)) continue;
            List<String> reasons=new ArrayList<>();
            if(same(a.getPhoneE164(),b.getPhoneE164())) reasons.add("Same mobile number");
            else if(phoneTail(a.getPhoneE164()).equals(phoneTail(b.getPhoneE164()))) reasons.add("Same final 7 mobile digits");
            if(a.getEmail()!=null&&same(a.getEmail(),b.getEmail())) reasons.add("Same email address");
            if(same(a.getParentName(),b.getParentName())) reasons.add("Same parent or guardian name");
            if(same(a.getHometown(),b.getHometown())) reasons.add("Same hometown");
            if(same(a.getProvince(),b.getProvince())) reasons.add("Same province");
            Set<String> aChildren=submissions.findAllByGuestContactPublicIdOrderBySubmittedAtDesc(a.getPublicId()).stream().map(s->normalized(s.getChildName())).collect(java.util.stream.Collectors.toSet());
            Set<String> bChildren=submissions.findAllByGuestContactPublicIdOrderBySubmittedAtDesc(b.getPublicId()).stream().map(s->normalized(s.getChildName())).collect(java.util.stream.Collectors.toSet());
            if(aChildren.stream().anyMatch(bChildren::contains)) reasons.add("Same child name");
            boolean strong=reasons.stream().anyMatch(r->r.contains("mobile")||r.contains("email"))||
                reasons.size()>=2;
            if(strong) result.add(new DuplicateGuestResponse(a.getPublicId(),b.getPublicId(),a.getParentName(),b.getParentName(),a.getPhoneE164(),b.getPhoneE164(),a.getHometown(),b.getHometown(),a.getSubmissionCount(),b.getSubmissionCount(),reasons,"GUEST_GUEST"));
        }
        return result;
    }

    @Transactional(readOnly=true)
    public List<DuplicateGuestResponse> registeredGuestMatches(){
        List<KidsChampGuestContactEntity> guestValues=guests.findAllByOrderByLastSubmittedAtDesc().stream().filter(g->g.getClaimedAt()==null).toList();
        Map<UUID,KidsChampSubmissionEntity> registered=new LinkedHashMap<>();
        submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().filter(s->s.getChildProfile()!=null)
            .forEach(s->registered.putIfAbsent(s.getChildProfile().getPublicId(),s));
        List<DuplicateGuestResponse> result=new ArrayList<>();
        for(var guest:guestValues) for(var accountEntry:registered.values()){
            UUID childId=accountEntry.getChildProfile().getPublicId(),guestId=guest.getPublicId();
            UUID first=first(childId,guestId),second=second(childId,guestId);
            if(ignoredGuestMatches.existsByFirstGuestIdAndSecondGuestId(first,second)) continue;
            List<String> reasons=new ArrayList<>();
            if(same(guest.getPhoneE164(),accountEntry.getUser().getPhoneE164())) reasons.add("Same account mobile number");
            else if(phoneTail(guest.getPhoneE164()).equals(phoneTail(accountEntry.getUser().getPhoneE164()))) reasons.add("Same final 7 mobile digits");
            if(guest.getEmail()!=null&&same(guest.getEmail(),accountEntry.getUser().getEmail())) reasons.add("Same account email address");
            if(same(guest.getParentName(),accountEntry.getUser().getAccountHolderName())) reasons.add("Same parent or account-holder name");
            if(same(guest.getHometown(),accountEntry.getChildProfile().getHometown())) reasons.add("Same hometown");
            if(same(guest.getProvince(),accountEntry.getChildProfile().getProvince())) reasons.add("Same province");
            Set<String> guestChildren=submissions.findAllByGuestContactPublicIdOrderBySubmittedAtDesc(guestId).stream().map(s->normalized(s.getChildName())).collect(java.util.stream.Collectors.toSet());
            if(guestChildren.contains(normalized(accountEntry.getChildProfile().getFullName()))) reasons.add("Same child name");
            boolean strong=reasons.stream().anyMatch(r->r.contains("mobile")||r.contains("email"))||reasons.size()>=2;
            if(strong){
                int registeredCount=(int)submissions.findAllByUserPublicIdOrderBySubmittedAtDesc(accountEntry.getUser().getPublicId()).stream().filter(s->s.getChildProfile()!=null&&s.getChildProfile().getPublicId().equals(childId)).count();
                result.add(new DuplicateGuestResponse(childId,guestId,accountEntry.getChildProfile().getFullName(),guest.getParentName(),accountEntry.getUser().getPhoneE164(),guest.getPhoneE164(),accountEntry.getChildProfile().getHometown(),guest.getHometown(),registeredCount,guest.getSubmissionCount(),reasons,"REGISTERED_GUEST"));
            }
        }
        return result;
    }

    @Transactional
    public void mergeGuestIntoRegistered(UUID actorId,UUID childId,UUID guestId,String action){
        UserEntity actor=user(actorId);
        var registered=submissions.findFirstByChildProfilePublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(childId)
            .orElseThrow(()->bad("REGISTERED_PARTICIPANT_NOT_FOUND","The registered child profile was not found."));
        var guest=guests.findByPublicId(guestId).orElseThrow(()->bad("GUEST_NOT_FOUND","The guest record was not found."));
        var moved=submissions.findAllByGuestContactPublicIdOrderBySubmittedAtDesc(guestId);
        moved.forEach(item->item.claim(registered.getUser(),registered.getChildProfile()));guests.delete(guest);
        audit(actor,action,"CHILD_PROFILE",childId,"Guest "+guestId+" linked to registered child; submissions preserved: "+moved.size());
    }

    @Transactional
    public void mergeGuests(UUID actorId,UUID targetId,UUID sourceId){
        combineGuests(actorId,targetId,sourceId,"GUEST_RECORDS_MERGED");
    }

    @Transactional
    public void deleteDuplicateGuest(UUID actorId,UUID keepId,UUID duplicateId){
        combineGuests(actorId,keepId,duplicateId,"DUPLICATE_GUEST_DELETED");
    }

    private void combineGuests(UUID actorId,UUID targetId,UUID sourceId,String action){
        if(targetId.equals(sourceId)) throw bad("MERGE_TARGET_INVALID","Choose two different guest records.");
        UserEntity actor=user(actorId);
        var target=guests.findByPublicId(targetId).orElseThrow(()->bad("GUEST_NOT_FOUND","The destination guest record was not found."));
        var source=guests.findByPublicId(sourceId).orElseThrow(()->bad("GUEST_NOT_FOUND","The guest record to merge was not found."));
        if(target.getClaimedAt()!=null||source.getClaimedAt()!=null) throw bad("GUEST_ALREADY_CLAIMED","Claimed guest histories cannot be merged here.");
        var moved=submissions.findAllByGuestContactPublicIdOrderBySubmittedAtDesc(sourceId);
        moved.forEach(item->item.setGuestContact(target));target.absorb(source);guests.delete(source);
        audit(actor,action,"GUEST",targetId,"Removed duplicate identity "+sourceId+"; submissions preserved: "+moved.size());
    }

    @Transactional
    public void ignoreGuestMatch(UUID actorId,UUID firstId,UUID secondId){
        if(firstId.equals(secondId)) throw bad("MERGE_TARGET_INVALID","Choose two different guest records.");
        UUID first=first(firstId,secondId),second=second(firstId,secondId);
        if(!ignoredGuestMatches.existsByFirstGuestIdAndSecondGuestId(first,second)){
            var ignored=new KidsChampIgnoredGuestMatchEntity();ignored.setPair(first,second);ignored.setIgnoredBy(user(actorId));ignoredGuestMatches.save(ignored);
        }
        audit(user(actorId),"GUEST_MATCH_IGNORED","GUEST",first,"Ignored possible match with "+second);
    }

    @Transactional(readOnly=true)
    public List<ParticipantResponse> participants(){
        Map<String,List<KidsChampSubmissionEntity>> grouped=submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream()
            .collect(java.util.stream.Collectors.groupingBy(item->item.getUser()!=null
                ? "registered:"+item.getChildProfile().getPublicId()
                : "guest:"+guestParticipantId(item),LinkedHashMap::new,java.util.stream.Collectors.toList()));
        return grouped.values().stream().map(this::participantResponse).toList();
    }

    @Transactional
    public ParticipantResponse updateParticipant(UUID actorId,UUID participantId,String name,LocalDate dateOfBirth,String hometown,String phone){
        String updatedName=requiredParticipantText(name,"PARTICIPANT_NAME_REQUIRED","Enter the child's name.");
        String updatedHometown=requiredParticipantText(hometown,"PARTICIPANT_HOMETOWN_REQUIRED","Enter the hometown.");
        if(dateOfBirth==null||dateOfBirth.isAfter(LocalDate.now(ZoneId.of("Asia/Colombo")))) throw bad("PARTICIPANT_DATE_OF_BIRTH_INVALID","Enter a valid date of birth.");
        List<KidsChampSubmissionEntity> items=submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream()
            .filter(item->participantId.equals(participantId(item))).toList();
        if(items.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND,"PARTICIPANT_NOT_FOUND","Participant was not found.");
        KidsChampSubmissionEntity latest=items.getFirst();
        UserEntity actor=user(actorId);
        if(latest.getChildProfile()!=null){
            var child=latest.getChildProfile();
            child.setFullName(updatedName);child.setDateOfBirth(dateOfBirth);child.setHometown(updatedHometown);
            audit(actor,"PARTICIPANT_UPDATED","CHILD_PROFILE",participantId,"Updated child profile details from the Kids Champ participant workspace.");
        }else{
            KidsChampGuestParticipantEntity participant=guestParticipants.findByPublicId(participantId)
                .orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"PARTICIPANT_NOT_FOUND","Guest participant was not found."));
            String updatedPhone=validGuestPhone(phone);
            KidsChampGuestContactEntity contact=participant.getGuestContact();
            guests.findByPhoneE164(updatedPhone).filter(existing->!existing.getId().equals(contact.getId()))
                .ifPresent(existing->{throw new ApiException(HttpStatus.CONFLICT,"PHONE_EXISTS","That phone number is already used by another guest contact.");});
            participant.setChildName(updatedName);participant.setDateOfBirth(dateOfBirth);participant.setHometown(updatedHometown);contact.setPhoneE164(updatedPhone);
            audit(actor,"PARTICIPANT_UPDATED","GUEST_PARTICIPANT",participantId,"Updated guest child details from the Kids Champ participant workspace.");
        }
        return participantResponse(items);
    }

    private ParticipantResponse participantResponse(List<KidsChampSubmissionEntity> items){
        KidsChampSubmissionEntity latest=items.getFirst();
        long approved=items.stream().filter(i->i.getReviewStatus()==ReviewStatus.APPROVED).count();
        long telecasted=items.stream().filter(i->i.getTelecastStatus()==TelecastStatus.TELECASTED).count();
        Instant first=items.stream().map(KidsChampSubmissionEntity::getSubmittedAt).min(Comparator.naturalOrder()).orElse(latest.getSubmittedAt());
        UUID id=participantId(latest); boolean registered=latest.getChildProfile()!=null;
        String name; LocalDate dateOfBirth; String location; String phone;
        if(registered){var child=latest.getChildProfile();name=child.getFullName();dateOfBirth=child.getDateOfBirth();location=child.getHometown();phone=latest.getUser().getPhoneE164();}
        else {var guest=latest.getGuestParticipant();if(guest==null)throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"PARTICIPANT_DATA_INVALID","Guest participant data is incomplete.");name=guest.getChildName();dateOfBirth=guest.getDateOfBirth();location=guest.getHometown();phone=guest.getGuestContact().getPhoneE164();}
        boolean historicalConsent=items.stream().anyMatch(i->i.getWhatsappConsentAt()!=null);
        String consentStatus=whatsappPreferences.findById(id).map(KidsChampWhatsAppPreferenceEntity::getStatus).orElse(historicalConsent?"OPTED_IN":"UNKNOWN");
        return new ParticipantResponse(id,name,(int)ChronoUnit.YEARS.between(dateOfBirth,LocalDate.now(ZoneId.of("Asia/Colombo"))),dateOfBirth,registered?"Registered":"Guest",
            location,phone,!registered,items.size(),approved,telecasted,first,latest.getSubmittedAt(),"OPTED_IN".equals(consentStatus),consentStatus);
    }

    private UUID participantId(KidsChampSubmissionEntity item){return item.getChildProfile()!=null?item.getChildProfile().getPublicId():guestParticipantId(item);}
    private UUID guestParticipantId(KidsChampSubmissionEntity item){if(item.getGuestParticipant()==null)throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"PARTICIPANT_DATA_INVALID","Guest participant data is incomplete.");return item.getGuestParticipant().getPublicId();}
    private String requiredParticipantText(String value,String code,String message){if(value==null||value.trim().isBlank())throw bad(code,message);String cleaned=value.trim().replaceAll("\\s+"," ");if(cleaned.length()>120)throw bad("PARTICIPANT_VALUE_TOO_LONG","Names and hometowns must be 120 characters or fewer.");return cleaned;}
    private String validGuestPhone(String value){String input=value==null?"":value.trim();if(!input.matches("^[0-9+()\\-\\s]+$")||input.indexOf('+')>0)throw bad("PHONE_INVALID","Enter a phone number using 7 to 19 digits. Local or international format is accepted.");String digits=input.replaceAll("\\D","");if(digits.length()<7||digits.length()>19)throw bad("PHONE_INVALID","Enter a phone number using 7 to 19 digits. Local or international format is accepted.");return input.startsWith("+")?"+"+digits:digits;}

    @Transactional(readOnly=true)
    public OverviewResponse overview(){
        List<KidsChampSubmissionEntity> items=submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc();
        LocalDate today=LocalDate.now(ZoneId.of("Asia/Colombo"));
        long newToday=items.stream().filter(i->i.getSubmittedAt().atZone(ZoneId.of("Asia/Colombo")).toLocalDate().equals(today)).count();
        long pending=items.stream().filter(i->i.getReviewStatus()==ReviewStatus.SUBMITTED||i.getReviewStatus()==ReviewStatus.UNDER_REVIEW).count();
        long approved=items.stream().filter(i->i.getReviewStatus()==ReviewStatus.APPROVED).count();
        long selected=items.stream().filter(i->i.getTelecastStatus()==TelecastStatus.SELECTED||i.getTelecastStatus()==TelecastStatus.SCHEDULED).count();
        long telecasted=items.stream().filter(i->i.getTelecastStatus()==TelecastStatus.TELECASTED).count();
        return new OverviewResponse(items.size(),newToday,pending,approved,selected,telecasted,participants().size(),
            batches.findAllByOrderByCreatedAtDescIdDesc().stream().filter(b->b.getDeletedAt()==null).count());
    }

    @Transactional(readOnly=true)
    public SettingsResponse settings(){return settings.findById((short)1).map(SettingsResponse::from)
        .orElseThrow(()->new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"SETTINGS_MISSING","Kids Champ settings are unavailable."));}

    @Transactional
    public SettingsResponse updateSettings(UUID actorId,SettingsRequest value){
        if(value.categories()==null||value.categories().isEmpty()) throw bad("CATEGORIES_REQUIRED","Add at least one category.");
        if(value.minimumAge()<0||value.maximumAge()>17||value.minimumAge()>value.maximumAge()) throw bad("AGE_RANGE_INVALID","Use a valid age range from 0 to 17.");
        if(value.maxFileSizeMb()<1||value.maxFileSizeMb()>50||value.zipBatchSize()<1) throw bad("SETTINGS_INVALID","File size must be between 1 and 50 MB, and ZIP photo count must be at least 1.");
        if(value.zipExpiryDays()<1||value.zipWarningDays()<0||value.zipWarningDays()>=value.zipExpiryDays()) throw bad("ZIP_RETENTION_INVALID","Use an expiry of at least 1 day and a warning period shorter than the expiry.");
        UserEntity actor=user(actorId);KidsChampSettingsEntity entity=settings.findLockedById((short)1).orElseThrow();
        boolean batchSizeChanged=entity.getZipBatchSize()!=value.zipBatchSize();
        long queuedPhotos=eligibleZipPhotoCount();
        if(batchSizeChanged&&queuedPhotos>0&&value.zipQueueCountPolicy()==null)
            throw new ApiException(HttpStatus.CONFLICT,"ZIP_QUEUE_COUNT_DECISION_REQUIRED",
                queuedPhotos+" approved photo"+(queuedPhotos==1?" is":"s are")+" already waiting. Choose whether the current queue keeps "+entity.getZipBatchSize()+" photos or uses "+value.zipBatchSize()+" photos.");
        ensureActiveZipTarget(entity);
        if(batchSizeChanged&&queuedPhotos>0&&value.zipQueueCountPolicy()==ZipQueueCountPolicy.APPLY_NEW)
            entity.replaceActiveZipTarget(value.zipBatchSize());
        if(queuedPhotos==0)entity.completeActiveZip();
        entity.update(String.join(",",value.categories()),value.maxFileSizeMb(),value.allowedFileTypes(),value.minimumAge(),value.maximumAge(),
            value.dailyTelecastLimit(),value.defaultTelecastTime(),value.zipBatchSize(),value.zipExpiryDays(),value.zipWarningDays(),
            value.frequentParticipantThreshold(),value.requireWhatsAppConsent(),value.campaignLimit(),value.defaultMessage(),actor);
        audit(actor,"SETTINGS_UPDATED","SETTINGS",new UUID(0,1),batchSizeChanged&&queuedPhotos>0
            ? "ZIP photo count updated using "+value.zipQueueCountPolicy():"Kids Champ settings updated");
        if(queuedPhotos>0)createAutomaticZips(actor);
        return SettingsResponse.from(entity);
    }

    @Transactional(readOnly=true)
    public List<CalendarTaskResponse> calendarTasks(){return tasks.findAllByDeletedAtIsNullOrderByTaskDateAscCreatedAtAsc().stream().map(CalendarTaskResponse::from).toList();}
    @Transactional
    public CalendarTaskResponse createTask(UUID actorId,LocalDate date,String title,String details){
        if(date==null||title==null||title.isBlank()) throw bad("TASK_INVALID","Choose a date and enter a task title.");
        UserEntity actor=user(actorId);KidsChampCalendarTaskEntity task=new KidsChampCalendarTaskEntity();
        task.create(date,title.trim(),details==null||details.isBlank()?null:details.trim(),actor);tasks.save(task);
        audit(actor,"CALENDAR_TASK_CREATED","CALENDAR_TASK",task.getPublicId(),title.trim());return CalendarTaskResponse.from(task);
    }
    @Transactional
    public CalendarTaskResponse completeTask(UUID actorId,UUID id,boolean completed){
        UserEntity actor=user(actorId);KidsChampCalendarTaskEntity task=task(id);task.setCompleted(completed);
        audit(actor,"CALENDAR_TASK_UPDATED","CALENDAR_TASK",id,completed?"Completed":"Reopened");return CalendarTaskResponse.from(task);
    }
    @Transactional
    public CalendarTaskResponse rescheduleTask(UUID actorId,UUID id,LocalDate date){
        if(date==null)throw bad("TASK_DATE_REQUIRED","Choose a new date for this task.");
        UserEntity actor=user(actorId);KidsChampCalendarTaskEntity task=task(id);task.reschedule(date);
        audit(actor,"CALENDAR_TASK_RESCHEDULED","CALENDAR_TASK",id,"Moved to "+date);return CalendarTaskResponse.from(task);
    }
    @Transactional public void deleteTask(UUID actorId,UUID id){UserEntity actor=user(actorId);KidsChampCalendarTaskEntity task=task(id);task.delete();audit(actor,"CALENDAR_TASK_DELETED","CALENDAR_TASK",id,task.getTitle());}

    @Transactional(readOnly=true)
    public List<ActivityResponse> activity(){return audits.findTop500ByOrderByCreatedAtDesc().stream().map(a->new ActivityResponse(
        a.getAction(),a.getEntityType(),a.getEntityPublicId(),a.getDetails(),a.getActor()==null?"System":a.getActor().getAccountHolderName(),a.getCreatedAt())).toList();}

    /** Append-only audit entry for administrator-management actions. */
    @Transactional
    public void auditAdministratorAction(UUID actorId,String action,String entityType,UUID entityId,String details){
        audit(user(actorId),action,entityType,entityId,details);
    }

    @Transactional(readOnly=true)
    public List<GrowthResponse> growth(){
        ZoneId zone=ZoneId.of("Asia/Colombo");LocalDate today=LocalDate.now(zone);List<KidsChampSubmissionEntity> all=submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc();
        return java.util.stream.IntStream.rangeClosed(0,6).mapToObj(offset->{LocalDate date=today.minusDays(6-offset);
            List<KidsChampSubmissionEntity> day=all.stream().filter(i->i.getSubmittedAt().atZone(zone).toLocalDate().equals(date)).toList();
            long unique=day.stream().map(i->i.getUser()!=null?"u"+i.getChildProfile().getPublicId():"g"+i.getGuestContact().getPublicId()).distinct().count();
            return new GrowthResponse(date,day.size(),unique);
        }).toList();
    }

    @Transactional
    public CampaignResponse createCampaign(UUID actorId,String channel,String template,List<UUID> participantIds){
        return createCampaign(actorId,channel,template,participantIds,null,null,null,null,"MANUAL");
    }

    @Transactional
    public CampaignResponse createCampaign(UUID actorId,String channel,String template,List<UUID> participantIds,String templateName,String languageCode,List<String> templateParameters){
        return createCampaign(actorId,channel,template,participantIds,templateName,languageCode,templateParameters,null,"MANUAL");
    }

    @Transactional
    public CampaignResponse createCampaign(UUID actorId,String channel,String template,List<UUID> participantIds,String templateName,String languageCode,List<String> templateParameters,String campaignName,String source){
        if(!Set.of("WHATSAPP","EMAIL").contains(channel)) throw bad("CHANNEL_INVALID","Choose WhatsApp or email.");
        if(template==null||template.isBlank()) throw bad("MESSAGE_REQUIRED","Enter a message.");
        int limit=settings().campaignLimit();if(participantIds==null||participantIds.isEmpty()||participantIds.size()>limit) throw bad("RECIPIENT_LIMIT","Select between 1 and "+limit+" participants.");
        Map<UUID,ParticipantResponse> available=participants().stream().collect(java.util.stream.Collectors.toMap(ParticipantResponse::id,p->p));
        List<ParticipantResponse> selected=new LinkedHashSet<>(participantIds).stream().map(available::get).filter(Objects::nonNull).toList();
        if(selected.size()!=new HashSet<>(participantIds).size()) throw bad("PARTICIPANT_NOT_FOUND","One or more participants were not found.");
        for(ParticipantResponse participant:selected){
            if(channel.equals("WHATSAPP")&&settings().requireWhatsAppConsent()&&!"OPTED_IN".equals(participant.whatsappConsentStatus())) throw bad("WHATSAPP_CONSENT_REQUIRED",participant.name()+" is not opted in to WhatsApp updates.");
            String destination=channel.equals("WHATSAPP")?participant.phone():submissionContactEmail(participant.id());
            if(destination==null||destination.isBlank()) throw bad("DESTINATION_MISSING",participant.name()+" has no eligible "+channel.toLowerCase(Locale.ROOT)+" destination.");
        }
        if("WHATSAPP".equals(channel)&&templateName!=null&&!templateName.isBlank()){
            KidsChampWhatsAppTemplateEntity approved=whatsappTemplates.findByNameAndLanguageCode(templateName,languageCode).orElseThrow(()->bad("WHATSAPP_TEMPLATE_NOT_FOUND","Synchronize this WhatsApp template from Meta before using it."));
            if(approved.isDisabled()||!"APPROVED".equalsIgnoreCase(approved.getStatus()))throw bad("WHATSAPP_TEMPLATE_NOT_APPROVED","Choose an enabled WhatsApp template approved by Meta.");
            int expected=approved.getVariables().size(),actual=templateParameters==null?0:templateParameters.size();
            if(expected!=actual)throw bad("WHATSAPP_TEMPLATE_PARAMETERS","The selected template expects "+expected+" parameters but received "+actual+".");
        }
        UserEntity actor=user(actorId);KidsChampMessageCampaignEntity campaign=new KidsChampMessageCampaignEntity();
        campaign.create(channel,template.trim(),selected.size(),actor,campaignName,source,templateName,languageCode);campaigns.save(campaign);
        for(ParticipantResponse participant:selected){
            String destination=channel.equals("WHATSAPP")?participant.phone():submissionContactEmail(participant.id());
            String trackingCode=participantTrackingCode(participant.id());
            String rendered=personalizeCampaignValue(template,participant,trackingCode);
            List<String> personalizedParameters=templateParameters==null?null:templateParameters.stream().map(value->personalizeCampaignValue(value,participant,trackingCode)).toList();
            KidsChampMessageRecipientEntity recipient=new KidsChampMessageRecipientEntity();recipient.create(campaign,participant.id(),participant.name(),destination,rendered,templateName,languageCode,personalizedParameters);messageRecipients.save(recipient);
            whatsappCampaignStatus.event(recipient,"QUEUED","queued","Queued by "+actor.getAccountHolderName());
        }
        audit(actor,"MESSAGE_CAMPAIGN_QUEUED","CAMPAIGN",campaign.getPublicId(),channel+" recipients: "+selected.size());return campaignResponse(campaign);
    }
    private String personalizeCampaignValue(String value,ParticipantResponse participant,String trackingCode){
        return value.replace("{name}",participant.name()).replace("{reference}",participant.id().toString()).replace("{trackingCode}",trackingCode).replace("{homeTown}",participant.location());
    }
    @Transactional(readOnly=true) public List<CampaignResponse> campaigns(){return campaigns.findAllByOrderByCreatedAtDesc().stream().map(this::campaignResponse).toList();}
    @Transactional(readOnly=true) public List<MessageRecipientResponse> campaignRecipients(UUID campaignId){return messageRecipients.findAllByCampaignPublicIdOrderByIdAsc(campaignId).stream().map(MessageRecipientResponse::from).toList();}
    @Transactional(readOnly=true) public List<DeliveryEventResponse> recipientEvents(Long recipientId){if(!messageRecipients.existsById(recipientId))throw bad("RECIPIENT_NOT_FOUND","Message recipient not found.");return deliveryEvents.findAllByRecipientIdOrderByOccurredAtAscIdAsc(recipientId).stream().map(DeliveryEventResponse::from).toList();}
    @Transactional public void retryRecipients(UUID actorId,List<Long> ids){messageRecipientAction(actorId,ids,"retry");}
    @Transactional public void ignoreRecipients(UUID actorId,List<Long> ids){messageRecipientAction(actorId,ids,"ignore");}
    @Transactional public void deleteRecipients(UUID actorId,List<Long> ids){messageRecipientAction(actorId,ids,"delete");}
    private void messageRecipientAction(UUID actorId,List<Long> ids,String action){
        if(ids==null||ids.isEmpty()||ids.size()>500)throw bad("RECIPIENT_SELECTION_INVALID","Select between 1 and 500 failed messages.");
        UserEntity actor=user(actorId);Set<KidsChampMessageCampaignEntity> changed=new HashSet<>();
        for(Long id:new LinkedHashSet<>(ids)){
            KidsChampMessageRecipientEntity recipient=messageRecipients.findById(id).orElseThrow(()->bad("RECIPIENT_NOT_FOUND","Message recipient not found."));
            try {if("retry".equals(action))recipient.retry();else if("ignore".equals(action))recipient.skip();else recipient.delete();}
            catch(IllegalStateException error){throw bad("WHATSAPP_RECIPIENT_ACTION_INVALID",error.getMessage());}
            changed.add(recipient.getCampaign());whatsappCampaignStatus.event(recipient,recipient.getStatus(),action,actor.getAccountHolderName());
            audit(actor,"retry".equals(action)?"WHATSAPP_RETRY_QUEUED":"ignore".equals(action)?"WHATSAPP_RETRY_IGNORED":"WHATSAPP_RECIPIENT_DELETED","MESSAGE_RECIPIENT",recipient.getCampaign().getPublicId(),recipient.getParticipantName());
        }
        changed.forEach(whatsappCampaignStatus::recalculate);
    }

    @Transactional public WhatsAppPreferenceResponse updateWhatsAppPreference(UUID actorId,UUID participantId,String status,String reason){
        if(!Set.of("UNKNOWN","OPTED_IN","OPTED_OUT").contains(status))throw bad("WHATSAPP_PREFERENCE_INVALID","Choose unknown, opted in, or opted out.");
        if("OPTED_OUT".equals(status)&&(reason==null||reason.isBlank()))throw bad("WHATSAPP_OPT_OUT_REASON_REQUIRED","Record why this contact opted out.");
        if(participants().stream().noneMatch(value->value.id().equals(participantId)))throw bad("PARTICIPANT_NOT_FOUND","Participant was not found.");
        UserEntity actor=user(actorId);KidsChampWhatsAppPreferenceEntity value=whatsappPreferences.findById(participantId).orElseGet(()->new KidsChampWhatsAppPreferenceEntity(participantId));
        value.update(status,"ADMIN",reason==null?null:reason.trim(),actor);whatsappPreferences.save(value);
        audit(actor,"WHATSAPP_PREFERENCE_UPDATED","PARTICIPANT",participantId,status+(reason==null?"":" - "+reason.trim()));return WhatsAppPreferenceResponse.from(value);
    }

    @Transactional(readOnly=true) public WhatsAppPreferenceResponse whatsappPreference(UUID participantId){return whatsappPreferences.findById(participantId).map(WhatsAppPreferenceResponse::from).orElse(new WhatsAppPreferenceResponse(participantId,"UNKNOWN","SYSTEM",null,null,null,null));}
    private String submissionContactEmail(UUID participantId){return submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().filter(i->
        (i.getChildProfile()!=null&&i.getChildProfile().getPublicId().equals(participantId))||(i.getGuestParticipant()!=null&&i.getGuestParticipant().getPublicId().equals(participantId)))
        .map(KidsChampSubmissionEntity::getEmail).filter(Objects::nonNull).findFirst().orElse(null);}
    private String participantTrackingCode(UUID participantId){return submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().filter(i->
        (i.getChildProfile()!=null&&i.getChildProfile().getPublicId().equals(participantId))||(i.getGuestParticipant()!=null&&i.getGuestParticipant().getPublicId().equals(participantId)))
        .map(KidsChampSubmissionEntity::getTrackingCode).filter(Objects::nonNull).findFirst().orElse("");}

    @Transactional
    public KidsChampAdminSubmissionResponse review(UUID actorId,UUID id,ReviewStatus status,String reason){
        if(status!=ReviewStatus.UNDER_REVIEW&&status!=ReviewStatus.APPROVED&&status!=ReviewStatus.REJECTED)
            throw bad("STATUS_INVALID","Choose under review, approved, or rejected.");
        if(status==ReviewStatus.REJECTED&&(reason==null||reason.isBlank())) throw bad("REJECTION_REASON_REQUIRED","Add a rejection reason.");
        UserEntity actor=user(actorId); KidsChampSubmissionEntity item=submission(id);
        item.review(status,status==ReviewStatus.REJECTED?reason.trim():null,actor);
        audit(actor,"REVIEW_UPDATED","SUBMISSION",id,status.name());
        String message=status==ReviewStatus.REJECTED?"The submission was not approved. Reason: "+reason:
            status==ReviewStatus.APPROVED?"The submission was approved.":"The submission is now under review.";
        notify(item,"Kids Champ update",message);
        if(status==ReviewStatus.APPROVED) queueAutomaticZipProcessing(actor.getPublicId());
        return KidsChampAdminSubmissionResponse.from(item);
    }

    /** Approves each submission at most once and starts the automatic ZIP queue. */
    @Transactional
    public ApprovalResponse approve(UUID actorId,List<UUID> ids){
        if(ids==null||ids.isEmpty()||ids.size()>500) throw bad("SUBMISSION_SELECTION_INVALID","Select between 1 and 500 submissions.");
        Set<UUID> requested=new LinkedHashSet<>(ids);
        List<KidsChampSubmissionEntity> items=submissions.findAllByPublicIdInAndDeletedAtIsNull(requested);
        if(items.size()!=requested.size()) throw bad("SUBMISSION_NOT_FOUND","One or more selected submissions were not found.");

        UserEntity actor=user(actorId);
        int approved=0, alreadyApproved=0;
        for(KidsChampSubmissionEntity item:items){
            if(item.getReviewStatus()==ReviewStatus.APPROVED){
                alreadyApproved++;
                continue;
            }
            item.review(ReviewStatus.APPROVED,null,actor);
            notify(item,"Kids Champ update","The submission was approved.");
            approved++;
        }
        if(approved>0){
            UUID firstApproved=items.stream().filter(item->item.getReviewStatus()==ReviewStatus.APPROVED).findFirst().orElseThrow().getPublicId();
            audit(actor,"SUBMISSIONS_APPROVED","SUBMISSION",firstApproved,approved+" approved");
            queueAutomaticZipProcessing(actor.getPublicId());
        }
        return new ApprovalResponse(approved,alreadyApproved,null);
    }

    private void queueAutomaticZipProcessing(UUID actorId){
        events.publishEvent(new KidsChampZipProcessingRequested(actorId));
    }

    private void ensureActiveZipTarget(KidsChampSettingsEntity entity){
        if(entity.getActiveZipTargetSize()==null&&!submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNullOrderBySubmittedAtAscIdAsc(ReviewStatus.APPROVED,PageRequest.of(0,1)).isEmpty())
            entity.startActiveZip(entity.getZipBatchSize());
    }

    private ZipProcessingResult createAutomaticZips(UserEntity actor){
        List<String> unavailableTrackingCodes=new ArrayList<>();
        KidsChampSettingsEntity entity=settings.findLockedById((short)1).orElseThrow();
        ensureActiveZipTarget(entity);
        while(entity.getActiveZipTargetSize()!=null){
            int target=entity.getActiveZipTargetSize();
            List<KidsChampSubmissionEntity> ready=submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNullOrderBySubmittedAtAscIdAsc(ReviewStatus.APPROVED,PageRequest.of(0,target));
            if(ready.size()<target) return ZipProcessingResult.withUnavailable(unavailableTrackingCodes);
            List<KidsChampSubmissionEntity> available=new ArrayList<>();
            for(KidsChampSubmissionEntity item:ready){
                if(zipSourceIsAvailable(item)) available.add(item);
                else{
                    unavailableTrackingCodes.add(item.getTrackingCode());
                    item.markPhotoDeleted();
                    audit(actor,"PHOTO_STORAGE_MISSING","SUBMISSION",item.getPublicId(),"Photo unavailable in storage; excluded from automatic ZIP processing.");
                }
            }
            if(available.size()<target) continue;
            buildBatch(actor,available);entity.completeActiveZip();
            List<KidsChampSubmissionEntity> remaining=submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNullOrderBySubmittedAtAscIdAsc(ReviewStatus.APPROVED,PageRequest.of(0,1));
            if(!remaining.isEmpty()) entity.startActiveZip(entity.getZipBatchSize());
        }
        return ZipProcessingResult.withUnavailable(unavailableTrackingCodes);
    }

    private boolean zipSourceIsAvailable(KidsChampSubmissionEntity item){
        try{
            Path source=storage.photo(item.getStoredFilename());
            return ImageIO.read(source.toFile())!=null;
        }catch(ApiException|IOException exception){return false;}
    }

    @Transactional
    public KidsChampAdminSubmissionResponse update(UUID actorId,UUID id,String category,String note,UUID reviewerId,Boolean selectedForTv){
        UserEntity actor=user(actorId); KidsChampSubmissionEntity item=submission(id);
        if(category!=null){
            String value=category.trim();
            if(!Set.of("Drawing","Painting","Handcraft").contains(value)) throw bad("CATEGORY_INVALID","Choose Drawing, Painting, or Handcraft.");
            item.setCategory(value);
        }
        if(note!=null) item.setInternalNote(note.isBlank()?null:note.trim());
        if(reviewerId!=null) item.setAssignedReviewer(user(reviewerId));
        if(selectedForTv!=null){
            if(selectedForTv&&item.getReviewStatus()!=ReviewStatus.APPROVED) throw bad("APPROVAL_REQUIRED","Approve the submission before selecting it for television.");
            item.selectForTelecast(selectedForTv);
        }
        audit(actor,"SUBMISSION_UPDATED","SUBMISSION",id,"Operational fields updated");
        return KidsChampAdminSubmissionResponse.from(item);
    }

    @Transactional(readOnly=true)
    public Photo photo(UUID id){
        KidsChampSubmissionEntity item=submission(id);
        if(item.getStoredFilename()==null) throw new ApiException(HttpStatus.GONE,"PHOTO_DELETED","This photo is no longer available.");
        return new Photo(storage.photo(item.getStoredFilename()),item.getOriginalFilename(),item.getMediaType());
    }

    @Transactional
    public void deleteSubmission(UUID actorId,UUID id){
        UserEntity actor=user(actorId); KidsChampSubmissionEntity item=submission(id);
        boolean wasInBatch=item.getBatch()!=null;
        item.softDelete(actor); audit(actor,"SUBMISSION_DELETED","SUBMISSION",id,wasInBatch?"Soft deleted by administrator; existing ZIP archive history retained":"Soft deleted by administrator");
    }

    /** Permanently removes every Kids Champ submission and its dedicated artwork/ZIP storage. */
    @Transactional
    public PurgeResponse permanentlyDeleteAllSubmissions(UUID actorId){
        user(actorId);
        int submissionCount=(int)submissions.count();
        int batchCount=(int)batches.count();
        int auditCount=(int)audits.count();
        submissions.deleteAllInBatch();
        batches.deleteAllInBatch();
        audits.deleteAllInBatch();
        settings.findLockedById((short)1).ifPresent(KidsChampSettingsEntity::completeActiveZip);
        submissions.flush();
        batches.flush();
        storage.clearAll();
        liveUpdates.publish("KIDS_CHAMP_SUBMISSIONS_PURGED","SUBMISSION",new UUID(0,1));
        return new PurgeResponse(submissionCount,batchCount,auditCount);
    }

    /**
     * Removes only the Kids Champ data owned by the supplied family/guest accounts.
     * Any ZIP archive containing that data is invalidated so that a deleted child's
     * photo or contact details cannot remain inside an archive.
     */
    @Transactional
    public AccountDataPurgeResult permanentlyDeleteAccountData(
        UUID actorId, Collection<UUID> registeredAccountIds, Collection<UUID> childProfileIds, Collection<UUID> guestAccountIds
    ) {
        UserEntity actor=user(actorId);
        Set<UUID> registered=new LinkedHashSet<>(registeredAccountIds==null?List.of():registeredAccountIds);
        Set<UUID> guestsToDelete=new LinkedHashSet<>(guestAccountIds==null?List.of():guestAccountIds);
        Set<UUID> childProfiles=new LinkedHashSet<>(childProfileIds==null?List.of():childProfileIds);
        List<KidsChampSubmissionEntity> owned=new ArrayList<>();
        if(!registered.isEmpty()) owned.addAll(submissions.findAllByUserPublicIdIn(registered));
        if(!guestsToDelete.isEmpty()) owned.addAll(submissions.findAllByGuestContactPublicIdIn(guestsToDelete));
        owned=new ArrayList<>(new LinkedHashSet<>(owned));

        List<KidsChampGuestContactEntity> guestAccounts=guestsToDelete.isEmpty()?List.of():guests.findAllByPublicIdIn(guestsToDelete);
        if(guestAccounts.size()!=guestsToDelete.size()) throw bad("GUEST_NOT_FOUND","One or more selected guest accounts no longer exist.");
        List<KidsChampGuestParticipantEntity> guestChildren=guestsToDelete.isEmpty()?List.of():guestParticipants.findAllByGuestContactPublicIdIn(guestsToDelete);
        Set<UUID> participantReferences=new LinkedHashSet<>(childProfiles);
        participantReferences.addAll(guestsToDelete);
        guestChildren.forEach(value->participantReferences.add(value.getPublicId()));
        if(!participantReferences.isEmpty()) {
            messageRecipients.deleteAllByParticipantReferenceIn(participantReferences);
            whatsappPreferences.deleteAllById(participantReferences);
        }
        if(!guestsToDelete.isEmpty()) ignoredGuestMatches.deleteAllByGuestIdIn(guestsToDelete);
        if(!guestChildren.isEmpty()) {
            entityManager.createNativeQuery("DELETE FROM kids_champ_participant_merges WHERE source_guest_participant_id IN (:ids)")
                .setParameter("ids",guestChildren.stream().map(KidsChampGuestParticipantEntity::getId).toList()).executeUpdate();
        }

        Set<UUID> ownedReferences=new LinkedHashSet<>(participantReferences);
        owned.forEach(value->ownedReferences.add(value.getPublicId()));
        if(!ownedReferences.isEmpty()) audits.deleteAllByEntityPublicIdIn(ownedReferences);

        Set<KidsChampBatchEntity> affectedBatches=new LinkedHashSet<>();
        owned.forEach(value->{if(value.getBatch()!=null) affectedBatches.add(value.getBatch());});
        for(KidsChampBatchEntity batch:affectedBatches){
            storage.deletePath(batch.getArchivePath());
            batch.markDeleted(actor);
        }
        for(KidsChampSubmissionEntity submission:owned) storage.delete(submission.getStoredFilename());
        submissions.deleteAll(owned);
        submissions.flush();
        guestParticipants.deleteAll(guestChildren);
        guests.deleteAll(guestAccounts);
        return new AccountDataPurgeResult(owned.size(),childProfiles.size(),guestChildren.size(),affectedBatches.size());
    }

    @Transactional
    public void deletePhoto(UUID actorId,UUID id){
        UserEntity actor=user(actorId);KidsChampSubmissionEntity item=submission(id);
        storage.delete(item.getStoredFilename());item.markPhotoDeleted();audit(actor,"PHOTO_DELETED","SUBMISSION",id,"Manual administrator deletion");
    }

    @Transactional
    public KidsChampAdminSubmissionResponse preview(UUID actorId,UUID id,boolean previewed){
        UserEntity actor=user(actorId); KidsChampSubmissionEntity item=submission(id);
        item.setPreviewed(previewed);
        audit(actor,previewed ? "SUBMISSION_PREVIEWED" : "SUBMISSION_PREVIEW_CLEARED","SUBMISSION",id,null);
        return KidsChampAdminSubmissionResponse.from(item);
    }

    @Transactional
    public BatchResponse createBatch(UUID actorId,int limit,boolean includeRemainder){
        if(limit<1) throw bad("BATCH_LIMIT_INVALID","ZIP photo count must be at least 1.");
        List<KidsChampSubmissionEntity> items=submissions
            .findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNullOrderBySubmittedAtAscIdAsc(ReviewStatus.APPROVED,PageRequest.of(0,limit));
        if(items.isEmpty()) throw bad("NO_PHOTOS","There are no approved photos with available artwork waiting.");
        if(items.size()<limit&&!includeRemainder) throw bad("REMAINDER_CONFIRMATION_REQUIRED",
            items.size()+" photos remain. Choose “Include remaining photos” to create a smaller ZIP.");
        return buildBatch(user(actorId),items);
    }

    @Transactional
    public BatchResponse createSelectedBatch(UUID actorId,List<UUID> ids){
        return createSelectedBatch(actorId,ids,null);
    }

    @Transactional
    public BatchResponse createSelectedBatch(UUID actorId,List<UUID> ids,String reason){
        if(ids==null||ids.isEmpty()) throw bad("SUBMISSION_SELECTION_INVALID","Select at least one submission.");
        if(reason!=null&&reason.isBlank())throw bad("RECOVERY_REASON_REQUIRED","Add a reason for manual ZIP recovery.");
        List<KidsChampSubmissionEntity> items=submissions.findAllByPublicIdInAndDeletedAtIsNull(new LinkedHashSet<>(ids));
        if(items.size()!=new HashSet<>(ids).size()) throw bad("SUBMISSION_NOT_FOUND","One or more selected submissions were not found.");
        for(KidsChampSubmissionEntity item:items){
            if(item.getReviewStatus()!=ReviewStatus.APPROVED) throw bad("APPROVAL_REQUIRED",item.getTrackingCode()+" is not approved.");
            if(item.getBatch()!=null) throw bad("ALREADY_BATCHED",item.getTrackingCode()+" is already in a ZIP batch.");
            if(item.getStoredFilename()==null) throw bad("PHOTO_NOT_AVAILABLE",item.getTrackingCode()+" has no available photo.");
        }
        items.sort(Comparator.comparing(KidsChampSubmissionEntity::getSubmittedAt).thenComparing(KidsChampSubmissionEntity::getPublicId));
        UserEntity actor=user(actorId);BatchResponse response=buildBatch(actor,items);
        if(reason!=null)audit(actor,"MANUAL_ZIP_RECOVERY","BATCH",response.id(),reason.trim());
        return response;
    }

    private BatchResponse buildBatch(UserEntity actor,List<KidsChampSubmissionEntity> items){
        items=new ArrayList<>(items);
        items.sort(Comparator.comparing(KidsChampSubmissionEntity::getSubmittedAt).thenComparing(KidsChampSubmissionEntity::getPublicId));
        KidsChampSettingsEntity settingsSnapshot=settings.findById((short)1).orElseThrow();
        int retentionDays=settingsSnapshot.getZipExpiryDays();
        int warningDays=settingsSnapshot.getZipWarningDays();
        KidsChampBatchEntity batch=new KidsChampBatchEntity();
        batch.setBatchCode(newBatchCode());batch.setPhotoCount(items.size());batch.setCreatedBy(actor);
        batch.setRetentionPolicy(retentionDays,warningDays);batches.save(batch);
        Path archive=null;
        try{
            archive=storage.archive(batch.getBatchCode());
            writeArchive(archive,items);
        }catch(IOException exception){
            if(archive!=null) storage.deletePath(archive.toString());
            batches.delete(batch);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"ZIP_FAILED","The ZIP could not be created.");
        }catch(ApiException exception){
            if(archive!=null) storage.deletePath(archive.toString());
            batches.delete(batch);
            throw exception;
        }
        for(KidsChampSubmissionEntity item:items)item.setBatch(batch);
        batch.setArchivePath(archive.toString());batch.startRetention(retentionDays);
        audit(actor,"BATCH_CREATED","BATCH",batch.getPublicId(),"Photos: "+items.size()+"; expires after "+retentionDays+" days");
        return response(batch);
    }

    private void writeArchive(Path archive,List<KidsChampSubmissionEntity> items) throws IOException{
        try(ZipOutputStream zip=new ZipOutputStream(Files.newOutputStream(archive))){
            StringBuilder csv=new StringBuilder("tracking_code,child_name,date_of_birth,age,parent_name,email,mobile,country,province,hometown,title\n");
            int index=1;
            for(KidsChampSubmissionEntity item:items){
                Path source=storage.photo(item.getStoredFilename());
                zip.putNextEntry(new ZipEntry(zipPhotoName(index++,item.getChildName(),item.getHometown())));
                writePng(source,zip,item.getTrackingCode());
                zip.closeEntry();
                csv.append(csv(item.getTrackingCode())).append(',').append(csv(item.getChildName())).append(',')
                    .append(item.getDateOfBirth()).append(',').append(item.getAgeAtSubmission()).append(',')
                    .append(csv(item.getParentName())).append(',').append(csv(item.getEmail())).append(',')
                    .append(csv(item.getPhoneE164())).append(',').append(csv(item.getCountryCode())).append(',')
                    .append(csv(item.getProvince())).append(',').append(csv(item.getHometown())).append(',')
                    .append(csv(item.getWorkTitle())).append('\n');
            }
            zip.putNextEntry(new ZipEntry("submissions.csv"));
            zip.write(csv.toString().getBytes(StandardCharsets.UTF_8));zip.closeEntry();
        }
    }

    private boolean archiveUsesCurrentNames(Path archive,List<KidsChampSubmissionEntity> items){
        try(ZipFile zip=new ZipFile(archive.toFile())){
            if(zip.getEntry("submissions.csv")==null)return false;
            for(int index=0;index<items.size();index++){
                KidsChampSubmissionEntity item=items.get(index);
                if(zip.getEntry(zipPhotoName(index+1,item.getChildName(),item.getHometown()))==null)return false;
            }
            return true;
        }catch(IOException exception){return false;}
    }

    private void replaceArchive(Path archive,List<KidsChampSubmissionEntity> items) throws IOException{
        Path parent=archive.toAbsolutePath().normalize().getParent();
        Path temporary=Files.createTempFile(parent,"kids-champ-zip-",".tmp");
        try{
            writeArchive(temporary,items);
            try{Files.move(temporary,archive,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}
            catch(AtomicMoveNotSupportedException exception){Files.move(temporary,archive,StandardCopyOption.REPLACE_EXISTING);}
        }finally{Files.deleteIfExists(temporary);}
    }

    @Transactional(readOnly=true)
    public List<BatchResponse> batches(){
        int defaultExpiry=settings.findById((short)1).orElseThrow().getZipExpiryDays();
        return batches.findAllByOrderByCreatedAtDescIdDesc().stream().filter(batch->batch.getPurgedAt()==null).map(batch->response(batch,defaultExpiry)).toList();
    }

    @Transactional(readOnly=true)
    public ZipProgressResponse zipProgress(){
        KidsChampSettingsEntity entity=settings.findById((short)1).orElseThrow();
        long ready=eligibleZipPhotoCount();
        int target=entity.getActiveZipTargetSize()==null?entity.getZipBatchSize():entity.getActiveZipTargetSize();
        return new ZipProgressResponse(ready,target,entity.getZipBatchSize(),entity.getActiveZipStartedAt());
    }

    private long eligibleZipPhotoCount(){
        return submissions.countByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNull(ReviewStatus.APPROVED);
    }

    @Transactional
    public Download download(UUID actorId,UUID id){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=batch(id);
        if(batch.getDeletedAt()!=null||batch.getArchivePath()==null) throw new ApiException(HttpStatus.GONE,"BATCH_DELETED","This ZIP has been deleted.");
        Path file=Paths.get(batch.getArchivePath());
        if(!Files.isRegularFile(file)) throw new ApiException(HttpStatus.GONE,"BATCH_FILE_MISSING","This ZIP is no longer available.");
        List<KidsChampSubmissionEntity> items=submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(id);
        if(!archiveUsesCurrentNames(file,items))try{
            replaceArchive(file,items);
            audit(actor,"BATCH_ARCHIVE_RENAMED","BATCH",id,"Photo names updated to id_name_hometown");
        }catch(IOException exception){throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"ZIP_REBUILD_FAILED","The ZIP could not be prepared for download.");}
        boolean first=batch.getFirstDownloadedAt()==null;
        int retentionDays=settings.findById((short)1).orElseThrow().getZipExpiryDays();
        batch.markDownloaded(retentionDays);
        if(first) audit(actor,"BATCH_FIRST_DOWNLOAD","BATCH",id,"Deletes at "+batch.getDeleteAfter());
        return new Download(file,batch.getBatchCode()+".zip");
    }

    @Transactional
    public BatchResponse schedule(UUID actorId,UUID id,LocalDate date,LocalDate alternate){
        if(date==null) throw bad("TELECAST_DATE_REQUIRED","Choose a telecast date.");
        if(date.isBefore(LocalDate.now(ZoneId.of("Asia/Colombo"))))throw bad("TELECAST_DATE_PAST","Choose today or a future telecast date.");
        if(alternate!=null&&alternate.isBefore(date))throw bad("ALTERNATE_TELECAST_INVALID","The backup telecast date cannot be before the scheduled date.");
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=batch(id);int limit=settings.findById((short)1).orElseThrow().getDailyTelecastLimit();
        long scheduled=batches.findAllByOrderByCreatedAtDescIdDesc().stream().filter(value->value.getDeletedAt()==null&&!value.getPublicId().equals(id)&&date.equals(value.getTelecastDate())).count();
        if(scheduled>=limit)throw bad("TELECAST_DAILY_LIMIT","The daily telecast limit of "+limit+" scheduled ZIPs has been reached.");
        batch.schedule(date,alternate);
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(id)){
            item.scheduleTelecast();
            notify(item,"Kids Champ telecast scheduled","Telecast date: "+date+(alternate==null?"":" (alternative: "+alternate+")"));
        }
        audit(actor,"TELECAST_SCHEDULED","BATCH",id,date.toString());return response(batch);
    }

    @Transactional
    public BatchResponse completeTelecast(UUID actorId,UUID id){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=batch(id);batch.completeTelecast();
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(id))item.markTelecasted();
        audit(actor,"TELECAST_COMPLETED","BATCH",id,batch.getTelecastDate().toString());return response(batch);
    }

    @Transactional
    public BatchResponse setEdited(UUID actorId,UUID id,boolean edited){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=batch(id);
        if(batch.getFirstDownloadedAt()==null) throw bad("BATCH_DOWNLOAD_REQUIRED","Download this ZIP before marking it edited.");
        batch.setEdited(edited);
        audit(actor,edited?"BATCH_EDITED":"BATCH_EDIT_CLEARED","BATCH",id,null);
        return response(batch);
    }

    @Transactional
    public void deleteBatch(UUID actorId,UUID id){
        KidsChampBatchEntity batch=batch(id);
        if(batch.getFirstDownloadedAt()==null) throw bad("BATCH_DOWNLOAD_REQUIRED","Download this ZIP before deleting its archive.");
        deleteBatch(batch,user(actorId),"Manual administrator deletion");
    }

    @Transactional
    public void clearBatchBin(UUID actorId,List<UUID> ids){
        if(ids==null||ids.isEmpty()||ids.size()>500) throw bad("BATCH_SELECTION_INVALID","Select between 1 and 500 ZIP records to clear.");
        UserEntity actor=user(actorId);
        for(UUID id:new LinkedHashSet<>(ids)){
            KidsChampBatchEntity batch=batch(id);
            if(batch.getDeletedAt()==null) throw bad("BATCH_NOT_IN_BIN",batch.getBatchCode()+" must be moved to the ZIP Bin before it can be cleared.");
            if(batch.getPurgedAt()!=null) continue;
            batch.markPurged();audit(actor,"BATCH_BIN_CLEARED","BATCH",id,"Permanently cleared from the ZIP Bin");
        }
    }

    /** Resumes any eligible queue left over after an application restart. */
    @Transactional
    public void processAutomaticZips(UUID actorId){createAutomaticZips(user(actorId));}

    /** Processes a retained queue after startup even when no administrator action is occurring. */
    @Transactional
    public void processAutomaticZips(){
        UserEntity actor=users.findAll().stream()
            .filter(value->value.getRoles().stream().anyMatch(role->"ROLE_ADMIN".equals(role.getName())||"ROLE_SUPER_ADMIN".equals(role.getName())))
            .findFirst().orElse(null);
        if(actor!=null) createAutomaticZips(actor);
    }

    @Scheduled(cron="0 */15 * * * *",zone="Asia/Colombo") @Transactional
    public void deleteExpired(){for(KidsChampBatchEntity batch:batches.findAllByDeleteAfterBeforeAndDeletedAtIsNull(Instant.now())) deleteBatch(batch,null,"Automatic ZIP retention deletion");}

    private void deleteBatch(KidsChampBatchEntity batch,UserEntity actor,String reason){
        storage.deletePath(batch.getArchivePath());
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(batch.getPublicId())){
            storage.delete(item.getStoredFilename());item.markPhotoDeleted();
        }
        batch.markDeleted(actor);audit(actor,"BATCH_DELETED","BATCH",batch.getPublicId(),reason);
    }
    private void notify(KidsChampSubmissionEntity item,String title,String message){
        if(item.getUser()!=null) notifications.create(item.getUser(),"KIDS_CHAMP",title,message);
        events.publishEvent(new KidsChampStatusEmailRequested(item.getEmail(),item.getChildName(),item.getTrackingCode(),title,message));
    }
    private BatchResponse response(KidsChampBatchEntity b){
        int defaultExpiry=settings.findById((short)1).orElseThrow().getZipExpiryDays();
        return response(b,defaultExpiry);
    }
    private BatchResponse response(KidsChampBatchEntity b,int defaultExpiry){
        long days=b.getDeleteAfter()==null?defaultExpiry:Math.max(0,(long)Math.ceil(Duration.between(Instant.now(),b.getDeleteAfter()).toHours()/24.0));
        return new BatchResponse(b.getPublicId(),b.getBatchCode(),b.getStatus(),b.getPhotoCount(),b.getFirstDownloadedAt(),b.getEditedAt(),
            b.getDeleteAfter(),days,b.getTelecastDate(),b.getAlternateTelecastDate(),b.getTelecastCompletedAt(),b.getCreatedAt(),b.getDeletedAt(),
            submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(b.getPublicId()).stream().map(KidsChampSubmissionEntity::getPublicId).toList());
    }
    private UserEntity user(UUID id){return users.findByPublicId(id).orElseThrow(()->bad("ACCOUNT_NOT_FOUND","Account not found."));}
    private KidsChampSubmissionEntity submission(UUID id){return submissions.findByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"SUBMISSION_NOT_FOUND","Submission not found."));}
    private KidsChampBatchEntity batch(UUID id){return batches.findByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"BATCH_NOT_FOUND","ZIP batch not found."));}
    private KidsChampCalendarTaskEntity task(UUID id){return tasks.findByPublicIdAndDeletedAtIsNull(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"TASK_NOT_FOUND","Calendar task not found."));}
    private void audit(UserEntity actor,String action,String type,UUID id,String details){KidsChampAuditEntity a=new KidsChampAuditEntity();a.setActor(actor);a.setAction(action);a.setEntityType(type);a.setEntityPublicId(id);a.setDetails(details);audits.save(a);liveUpdates.publish(action,type,id);}
    private String newBatchCode(){String code;do{code="KCZIP-"+LocalDate.now().toString().replace("-","")+"-"+UUID.randomUUID().toString().substring(0,6).toUpperCase();}while(batches.existsByBatchCode(code));return code;}
    private String csv(String value){if(value==null)return "";return "\""+value.replace("\"","\"\"")+"\"";}
    static String zipPhotoName(int index,String childName,String hometown){
        return String.format("%03d_%s_%s.png",index,safeZipPart(childName),safeZipPart(hometown));
    }
    static void writePng(Path source,OutputStream target,String trackingCode) throws IOException{
        BufferedImage image=ImageIO.read(source.toFile());
        if(image==null)throw new IOException("Unsupported or unreadable image: "+trackingCode);
        if(!ImageIO.write(image,"png",target))throw new IOException("PNG conversion is unavailable.");
    }
    private static String safeZipPart(String value){
        String cleaned=value==null?"Unknown":value.trim().replaceAll("[^\\p{L}\\p{N} -]+"," ").replaceAll("\\s+"," ").replaceAll("-+","-");
        cleaned=cleaned.replaceAll("^[ -]+|[ -]+$","");
        return cleaned.isBlank()?"Unknown":cleaned.substring(0,Math.min(cleaned.length(),60));
    }
    private boolean same(String a,String b){return a!=null&&b!=null&&!a.isBlank()&&a.trim().equalsIgnoreCase(b.trim());}
    private String normalized(String value){return value==null?"":value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]","");}
    private String phoneTail(String value){String digits=value==null?"":value.replaceAll("\\D","");return digits.length()<7?UUID.randomUUID().toString():digits.substring(digits.length()-7);}
    private UUID first(UUID a,UUID b){return a.toString().compareTo(b.toString())<0?a:b;}
    private UUID second(UUID a,UUID b){return a.toString().compareTo(b.toString())<0?b:a;}
    private ApiException bad(String c,String m){return new ApiException(HttpStatus.BAD_REQUEST,c,m);}
    private CampaignResponse campaignResponse(KidsChampMessageCampaignEntity campaign){KidsChampWhatsAppCampaignStatus.Counts c=whatsappCampaignStatus.counts(campaign);return new CampaignResponse(campaign.getPublicId(),campaign.getChannel(),campaign.getStatus(),campaign.getRecipientCount(),campaign.getMessageTemplate(),campaign.getName(),campaign.getSource(),campaign.getTemplateName(),campaign.getLanguageCode(),c.queued(),c.sending(),c.accepted(),c.delivered(),c.read(),c.failed(),c.ignored(),campaign.getCreatedAt(),campaign.getCompletedAt());}
    public record BatchResponse(UUID id,String batchCode,String status,int photoCount,Instant firstDownloadedAt,Instant editedAt,Instant deleteAfter,long daysRemaining,LocalDate telecastDate,LocalDate alternateTelecastDate,Instant telecastCompletedAt,Instant createdAt,Instant deletedAt,List<UUID> submissionIds){}
    public record ZipProgressResponse(long readyPhotos,int activeTargetSize,int nextTargetSize,Instant activeStartedAt){}
    public record Download(Path path,String filename){}
    public record Photo(Path path,String filename,String mediaType){}
    public record GuestResponse(UUID id,String parentName,String mobile,String email,String countryCode,String province,
        String hometown,int submissionCount,Instant firstSubmittedAt,Instant lastSubmittedAt){}
    public record DuplicateGuestResponse(UUID firstId,UUID secondId,String firstName,String secondName,String firstPhone,String secondPhone,String firstHometown,String secondHometown,int firstSubmissions,int secondSubmissions,List<String> reasons,String matchType){}
    public record ParticipantResponse(UUID id,String name,int age,LocalDate dateOfBirth,String type,String location,String phone,boolean phoneEditable,long submissions,long approved,long telecasted,Instant joinedAt,Instant lastSubmissionAt,boolean whatsappConsented,String whatsappConsentStatus){}
    public record ApprovalResponse(int approvedCount,int alreadyApprovedCount,String zipWarning){}
    public record PurgeResponse(int deletedSubmissions,int deletedBatches,int deletedAuditEntries){}
    public record AccountDataPurgeResult(int deletedSubmissions,int deletedChildProfiles,int deletedGuestChildProfiles,int invalidatedZipArchives){}
    private record ZipProcessingResult(String warning){
        static ZipProcessingResult withUnavailable(List<String> trackingCodes){
            if(trackingCodes.isEmpty()) return new ZipProcessingResult(null);
            String codes=String.join(", ",trackingCodes.stream().limit(3).toList());
            String more=trackingCodes.size()>3?" and "+(trackingCodes.size()-3)+" more":"";
            return new ZipProcessingResult("ZIP processing needs attention for "+codes+more+". Those submissions remain approved; their artwork was removed from ZIP processing.");
        }
    }
    public record SubmissionPageResponse(List<KidsChampAdminSubmissionResponse> items,int page,int size,long totalItems,int totalPages){}
    public record OverviewResponse(long totalSubmissions,long newToday,long pendingReviews,long approved,long selectedForTv,long telecasted,long uniqueParticipants,long activeBatches){}
    public enum ZipQueueCountPolicy { KEEP_CURRENT, APPLY_NEW }
    public record SettingsRequest(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage,ZipQueueCountPolicy zipQueueCountPolicy){
        public SettingsRequest(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage){
            this(categories,maxFileSizeMb,allowedFileTypes,minimumAge,maximumAge,dailyTelecastLimit,defaultTelecastTime,zipBatchSize,zipExpiryDays,zipWarningDays,frequentParticipantThreshold,requireWhatsAppConsent,campaignLimit,defaultMessage,null);
        }
    }
    public record SettingsResponse(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage,Instant updatedAt){
        static SettingsResponse from(KidsChampSettingsEntity e){return new SettingsResponse(Arrays.stream(e.getCategories().split(",")).map(String::trim).filter(v->!v.isEmpty()).toList(),e.getMaxFileSizeMb(),e.getAllowedFileTypes(),e.getMinimumAge(),e.getMaximumAge(),e.getDailyTelecastLimit(),e.getDefaultTelecastTime(),e.getZipBatchSize(),e.getZipExpiryDays(),e.getZipWarningDays(),e.getFrequentParticipantThreshold(),e.isRequireWhatsAppConsent(),e.getCampaignLimit(),e.getDefaultMessage(),e.getUpdatedAt());}}
    public record CalendarTaskResponse(UUID id,LocalDate date,String title,String details,Instant completedAt,Instant createdAt){static CalendarTaskResponse from(KidsChampCalendarTaskEntity e){return new CalendarTaskResponse(e.getPublicId(),e.getTaskDate(),e.getTitle(),e.getDetails(),e.getCompletedAt(),e.getCreatedAt());}}
    public record ActivityResponse(String action,String entityType,UUID entityId,String details,String actor,Instant createdAt){}
    public record GrowthResponse(LocalDate date,long submissions,long participants){}
    public record CampaignResponse(UUID id,String channel,String status,int recipientCount,String messageTemplate,String name,String source,String templateName,String languageCode,long queuedCount,long sendingCount,long acceptedCount,long deliveredCount,long readCount,long failedCount,long ignoredCount,Instant createdAt,Instant completedAt){}
    public record MessageRecipientResponse(Long id,UUID participantId,String name,String destination,String status,int attempts,String failureReason,Instant sentAt,Instant lastAttemptAt,Instant nextAttemptAt,Instant deliveredAt,Instant readAt){static MessageRecipientResponse from(KidsChampMessageRecipientEntity e){return new MessageRecipientResponse(e.getId(),e.getParticipantReference(),e.getParticipantName(),e.getDestination(),e.getStatus(),e.getAttempts(),e.getFailureReason(),e.getSentAt(),e.getLastAttemptAt(),e.getNextAttemptAt(),e.getDeliveredAt(),e.getReadAt());}}
    public record DeliveryEventResponse(Long id,String status,String providerStatus,int attempt,String details,Instant providerTimestamp,Instant occurredAt){static DeliveryEventResponse from(KidsChampMessageDeliveryEventEntity e){return new DeliveryEventResponse(e.getId(),e.getStatus(),e.getProviderStatus(),e.getAttempt(),e.getDetails(),e.getProviderTimestamp(),e.getOccurredAt());}}
    public record WhatsAppPreferenceResponse(UUID participantId,String status,String source,String reason,Instant optedInAt,Instant optedOutAt,Instant updatedAt){static WhatsAppPreferenceResponse from(KidsChampWhatsAppPreferenceEntity e){return new WhatsAppPreferenceResponse(e.getParticipantReference(),e.getStatus(),e.getSource(),e.getReason(),e.getOptedInAt(),e.getOptedOutAt(),e.getUpdatedAt());}}
}
