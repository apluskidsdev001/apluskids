package lk.apluskids.platform.kidschamp;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.zip.*;
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
    private final KidsChampGuestContactRepository guests;
    private final KidsChampAuditRepository audits; private final UserRepository users; private final KidsChampStorage storage;
    private final KidsChampSettingsRepository settings; private final KidsChampCalendarTaskRepository tasks;
    private final KidsChampMessageCampaignRepository campaigns;private final KidsChampMessageRecipientRepository messageRecipients;
    private final AccountNotificationService notifications; private final ApplicationEventPublisher events;
    private final KidsChampIgnoredGuestMatchRepository ignoredGuestMatches;
    private final KidsChampLiveUpdates liveUpdates;
    KidsChampAdminService(KidsChampSubmissionRepository submissions,KidsChampBatchRepository batches,KidsChampGuestContactRepository guests,
        KidsChampAuditRepository audits,UserRepository users,KidsChampStorage storage,KidsChampSettingsRepository settings,
        KidsChampCalendarTaskRepository tasks,KidsChampMessageCampaignRepository campaigns,KidsChampMessageRecipientRepository messageRecipients,
        AccountNotificationService notifications,ApplicationEventPublisher events,KidsChampIgnoredGuestMatchRepository ignoredGuestMatches,KidsChampLiveUpdates liveUpdates){
        this.submissions=submissions;this.batches=batches;this.guests=guests;this.audits=audits;this.users=users;this.storage=storage;
        this.settings=settings;this.tasks=tasks;this.campaigns=campaigns;this.messageRecipients=messageRecipients;this.notifications=notifications;this.events=events;
        this.ignoredGuestMatches=ignoredGuestMatches;
        this.liveUpdates=liveUpdates;
    }

    @Transactional(readOnly=true)
    public List<KidsChampAdminSubmissionResponse> submissions(){return submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().map(KidsChampAdminSubmissionResponse::from).toList();}

    @Transactional(readOnly=true)
    public List<GuestResponse> guests(){return guests.findAllByOrderByLastSubmittedAtDesc().stream().map(g->new GuestResponse(
        g.getPublicId(),g.getParentName(),g.getPhoneE164(),g.getEmail(),g.getCountryCode(),g.getProvince(),
        g.getHometown(),g.getSubmissionCount(),g.getFirstSubmittedAt(),g.getLastSubmittedAt())).toList();}

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
                : "guest:"+item.getGuestContact().getPublicId(),LinkedHashMap::new,java.util.stream.Collectors.toList()));
        return grouped.values().stream().map(items->{
            KidsChampSubmissionEntity latest=items.getFirst();
            long approved=items.stream().filter(i->i.getReviewStatus()==ReviewStatus.APPROVED).count();
            long telecasted=items.stream().filter(i->i.getTelecastStatus()==TelecastStatus.TELECASTED).count();
            Instant first=items.stream().map(KidsChampSubmissionEntity::getSubmittedAt).min(Comparator.naturalOrder()).orElse(latest.getSubmittedAt());
            UUID id=latest.getUser()!=null?latest.getChildProfile().getPublicId():latest.getGuestContact().getPublicId();
            boolean whatsapp=items.stream().anyMatch(i->i.getWhatsappConsentAt()!=null);
            return new ParticipantResponse(id,latest.getChildName(),latest.getAgeAtSubmission(),latest.getUser()!=null?"Registered":"Guest",
                latest.getHometown(),latest.getPhoneE164(),items.size(),approved,telecasted,first,latest.getSubmittedAt(),whatsapp);
        }).toList();
    }

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
            batches.findAllByOrderByCreatedAtDesc().stream().filter(b->b.getDeletedAt()==null).count());
    }

    @Transactional(readOnly=true)
    public SettingsResponse settings(){return settings.findById((short)1).map(SettingsResponse::from)
        .orElseThrow(()->new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"SETTINGS_MISSING","Kids Champ settings are unavailable."));}

    @Transactional
    public SettingsResponse updateSettings(UUID actorId,SettingsRequest value){
        if(value.categories()==null||value.categories().isEmpty()) throw bad("CATEGORIES_REQUIRED","Add at least one category.");
        if(value.minimumAge()<0||value.maximumAge()>17||value.minimumAge()>value.maximumAge()) throw bad("AGE_RANGE_INVALID","Use a valid age range from 0 to 17.");
        if(value.maxFileSizeMb()<1||value.maxFileSizeMb()>50||value.zipBatchSize()<1||value.zipBatchSize()>500) throw bad("SETTINGS_INVALID","File and ZIP limits are outside the allowed range.");
        UserEntity actor=user(actorId);KidsChampSettingsEntity entity=settings.findById((short)1).orElseThrow();
        ensureActiveZipTarget(entity);
        entity.update(String.join(",",value.categories()),value.maxFileSizeMb(),value.allowedFileTypes(),value.minimumAge(),value.maximumAge(),
            value.dailyTelecastLimit(),value.defaultTelecastTime(),value.zipBatchSize(),value.zipExpiryDays(),value.zipWarningDays(),
            value.frequentParticipantThreshold(),value.requireWhatsAppConsent(),value.campaignLimit(),value.defaultMessage(),actor);
        audit(actor,"SETTINGS_UPDATED","SETTINGS",new UUID(0,1),"Kids Champ settings updated");return SettingsResponse.from(entity);
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
    @Transactional public void deleteTask(UUID actorId,UUID id){UserEntity actor=user(actorId);KidsChampCalendarTaskEntity task=task(id);task.delete();audit(actor,"CALENDAR_TASK_DELETED","CALENDAR_TASK",id,task.getTitle());}

    @Transactional(readOnly=true)
    public List<ActivityResponse> activity(){return audits.findTop500ByOrderByCreatedAtDesc().stream().map(a->new ActivityResponse(
        a.getAction(),a.getEntityType(),a.getEntityPublicId(),a.getDetails(),a.getActor()==null?"System":a.getActor().getAccountHolderName(),a.getCreatedAt())).toList();}

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
        if(!Set.of("WHATSAPP","EMAIL").contains(channel)) throw bad("CHANNEL_INVALID","Choose WhatsApp or email.");
        if(template==null||template.isBlank()) throw bad("MESSAGE_REQUIRED","Enter a message.");
        int limit=settings().campaignLimit();if(participantIds==null||participantIds.isEmpty()||participantIds.size()>limit) throw bad("RECIPIENT_LIMIT","Select between 1 and "+limit+" participants.");
        Map<UUID,ParticipantResponse> available=participants().stream().collect(java.util.stream.Collectors.toMap(ParticipantResponse::id,p->p));
        List<ParticipantResponse> selected=new LinkedHashSet<>(participantIds).stream().map(available::get).filter(Objects::nonNull).toList();
        if(selected.size()!=new HashSet<>(participantIds).size()) throw bad("PARTICIPANT_NOT_FOUND","One or more participants were not found.");
        UserEntity actor=user(actorId);KidsChampMessageCampaignEntity campaign=new KidsChampMessageCampaignEntity();campaign.create(channel,template.trim(),selected.size(),actor);campaigns.save(campaign);
        for(ParticipantResponse participant:selected){
            if(channel.equals("WHATSAPP")&&settings().requireWhatsAppConsent()&&!participant.whatsappConsented()) throw bad("WHATSAPP_CONSENT_REQUIRED",participant.name()+" has not consented to WhatsApp updates.");
            String destination=channel.equals("WHATSAPP")?participant.phone():submissionContactEmail(participant.id());
            if(destination==null||destination.isBlank()) throw bad("DESTINATION_MISSING",participant.name()+" has no eligible "+channel.toLowerCase(Locale.ROOT)+" destination.");
            String rendered=template.replace("{name}",participant.name()).replace("{reference}",participant.id().toString());
            KidsChampMessageRecipientEntity recipient=new KidsChampMessageRecipientEntity();recipient.create(campaign,participant.id(),participant.name(),destination,rendered);messageRecipients.save(recipient);
        }
        audit(actor,"MESSAGE_CAMPAIGN_QUEUED","CAMPAIGN",campaign.getPublicId(),channel+" recipients: "+selected.size());return CampaignResponse.from(campaign);
    }
    @Transactional(readOnly=true) public List<CampaignResponse> campaigns(){return campaigns.findAllByOrderByCreatedAtDesc().stream().map(CampaignResponse::from).toList();}
    private String submissionContactEmail(UUID participantId){return submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().filter(i->
        (i.getChildProfile()!=null&&i.getChildProfile().getPublicId().equals(participantId))||(i.getGuestContact()!=null&&i.getGuestContact().getPublicId().equals(participantId)))
        .map(KidsChampSubmissionEntity::getEmail).filter(Objects::nonNull).findFirst().orElse(null);}

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
        if(status==ReviewStatus.APPROVED) createAutomaticZips(actor);
        return KidsChampAdminSubmissionResponse.from(item);
    }

    private void ensureActiveZipTarget(KidsChampSettingsEntity entity){
        if(entity.getActiveZipTargetSize()==null&&!submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAsc(ReviewStatus.APPROVED,PageRequest.of(0,1)).isEmpty())
            entity.startActiveZip(entity.getZipBatchSize());
    }

    private void createAutomaticZips(UserEntity actor){
        KidsChampSettingsEntity entity=settings.findLockedById((short)1).orElseThrow();
        ensureActiveZipTarget(entity);
        while(entity.getActiveZipTargetSize()!=null){
            int target=entity.getActiveZipTargetSize();
            List<KidsChampSubmissionEntity> ready=submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAsc(ReviewStatus.APPROVED,PageRequest.of(0,target));
            if(ready.size()<target) return;
            buildBatch(actor,ready);entity.completeActiveZip();
            List<KidsChampSubmissionEntity> remaining=submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAsc(ReviewStatus.APPROVED,PageRequest.of(0,1));
            if(!remaining.isEmpty()) entity.startActiveZip(entity.getZipBatchSize());
        }
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
        if(item.getBatch()!=null) throw bad("SUBMISSION_BATCHED","A submission included in a ZIP batch cannot be deleted.");
        item.softDelete(actor); audit(actor,"SUBMISSION_DELETED","SUBMISSION",id,"Soft deleted by administrator");
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
        if(limit<1||limit>500) throw bad("BATCH_LIMIT_INVALID","Batch limit must be between 1 and 500.");
        List<KidsChampSubmissionEntity> items=submissions
            .findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAsc(ReviewStatus.APPROVED,PageRequest.of(0,limit));
        if(items.isEmpty()) throw bad("NO_PHOTOS","There are no approved photos waiting.");
        if(items.size()<limit&&!includeRemainder) throw bad("REMAINDER_CONFIRMATION_REQUIRED",
            items.size()+" photos remain. Choose “Include remaining photos” to create a smaller ZIP.");
        return buildBatch(user(actorId),items);
    }

    @Transactional
    public BatchResponse createSelectedBatch(UUID actorId,List<UUID> ids){
        if(ids==null||ids.isEmpty()||ids.size()>500) throw bad("SUBMISSION_SELECTION_INVALID","Select between 1 and 500 submissions.");
        List<KidsChampSubmissionEntity> items=submissions.findAllByPublicIdInAndDeletedAtIsNull(new LinkedHashSet<>(ids));
        if(items.size()!=new HashSet<>(ids).size()) throw bad("SUBMISSION_NOT_FOUND","One or more selected submissions were not found.");
        for(KidsChampSubmissionEntity item:items){
            if(item.getReviewStatus()!=ReviewStatus.APPROVED) throw bad("APPROVAL_REQUIRED",item.getTrackingCode()+" is not approved.");
            if(item.getBatch()!=null) throw bad("ALREADY_BATCHED",item.getTrackingCode()+" is already in a ZIP batch.");
            if(item.getStoredFilename()==null) throw bad("PHOTO_NOT_AVAILABLE",item.getTrackingCode()+" has no available photo.");
        }
        items.sort(Comparator.comparing(KidsChampSubmissionEntity::getSubmittedAt));
        return buildBatch(user(actorId),items);
    }

    private BatchResponse buildBatch(UserEntity actor,List<KidsChampSubmissionEntity> items){
        KidsChampBatchEntity batch=new KidsChampBatchEntity();
        batch.setBatchCode(newBatchCode());batch.setPhotoCount(items.size());batch.setCreatedBy(actor);batches.save(batch);
        Path archive=storage.archive(batch.getBatchCode());
        try(ZipOutputStream zip=new ZipOutputStream(Files.newOutputStream(archive))){
            StringBuilder csv=new StringBuilder("tracking_code,child_name,date_of_birth,age,parent_name,email,mobile,country,province,hometown,title\n");
            int index=1;
            for(KidsChampSubmissionEntity item:items){
                String ext=item.getMediaType().equals("image/png")?".png":".jpg";
                String photoName=String.format("%03d_%s_%s_Age-%d_%s%s",index++,safeZipPart(item.getChildName()),
                    safeZipPart(item.getHometown()),item.getAgeAtSubmission(),safeZipPart(item.getTrackingCode()),ext);
                zip.putNextEntry(new ZipEntry(photoName));
                Files.copy(storage.photo(item.getStoredFilename()),zip);zip.closeEntry();
                csv.append(csv(item.getTrackingCode())).append(',').append(csv(item.getChildName())).append(',')
                    .append(item.getDateOfBirth()).append(',').append(item.getAgeAtSubmission()).append(',')
                    .append(csv(item.getParentName())).append(',').append(csv(item.getEmail())).append(',')
                    .append(csv(item.getPhoneE164())).append(',').append(csv(item.getCountryCode())).append(',')
                    .append(csv(item.getProvince())).append(',').append(csv(item.getHometown())).append(',')
                    .append(csv(item.getWorkTitle())).append('\n');
                item.setBatch(batch);
            }
            zip.putNextEntry(new ZipEntry("submissions.csv"));
            zip.write(csv.toString().getBytes(StandardCharsets.UTF_8));zip.closeEntry();
        }catch(IOException exception){storage.deletePath(archive.toString());throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"ZIP_FAILED","The ZIP could not be created.");}
        batch.setArchivePath(archive.toString());audit(actor,"BATCH_CREATED","BATCH",batch.getPublicId(),"Photos: "+items.size());
        return response(batch);
    }

    @Transactional(readOnly=true)
    public List<BatchResponse> batches(){return batches.findAllByOrderByCreatedAtDesc().stream().map(this::response).toList();}

    @Transactional(readOnly=true)
    public ZipProgressResponse zipProgress(){
        KidsChampSettingsEntity entity=settings.findById((short)1).orElseThrow();
        int ready=submissions.findAllByReviewStatusAndBatchIsNullAndPhotoDeletedAtIsNullOrderBySubmittedAtAsc(ReviewStatus.APPROVED,PageRequest.of(0,500)).size();
        int target=entity.getActiveZipTargetSize()==null?entity.getZipBatchSize():entity.getActiveZipTargetSize();
        return new ZipProgressResponse(ready,target,entity.getZipBatchSize(),entity.getActiveZipStartedAt());
    }

    @Transactional
    public Download download(UUID actorId,UUID id){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=batch(id);
        if(batch.getDeletedAt()!=null||batch.getArchivePath()==null) throw new ApiException(HttpStatus.GONE,"BATCH_DELETED","This ZIP has been deleted.");
        Path file=Paths.get(batch.getArchivePath());
        if(!Files.isRegularFile(file)) throw new ApiException(HttpStatus.GONE,"BATCH_FILE_MISSING","This ZIP is no longer available.");
        boolean first=batch.getFirstDownloadedAt()==null;batch.markDownloaded();
        if(first) audit(actor,"BATCH_FIRST_DOWNLOAD","BATCH",id,"Deletes at "+batch.getDeleteAfter());
        return new Download(file,batch.getBatchCode()+".zip");
    }

    @Transactional
    public BatchResponse schedule(UUID actorId,UUID id,LocalDate date,LocalDate alternate){
        if(date==null) throw bad("TELECAST_DATE_REQUIRED","Choose a telecast date.");
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=batch(id);batch.schedule(date,alternate);
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdOrderBySubmittedAtAsc(id)){
            item.scheduleTelecast();
            notify(item,"Kids Champ telecast scheduled","Telecast date: "+date+(alternate==null?"":" (alternative: "+alternate+")"));
        }
        audit(actor,"TELECAST_SCHEDULED","BATCH",id,date.toString());return response(batch);
    }

    @Transactional
    public void deleteBatch(UUID actorId,UUID id){
        KidsChampBatchEntity batch=batch(id);
        if(batch.getFirstDownloadedAt()==null) throw bad("BATCH_DOWNLOAD_REQUIRED","Download this ZIP before deleting its archive.");
        deleteBatch(batch,user(actorId),"Manual administrator deletion");
    }

    @Scheduled(cron="0 30 3 * * *",zone="Asia/Colombo") @Transactional
    public void deleteExpired(){for(KidsChampBatchEntity batch:batches.findAllByDeleteAfterBeforeAndDeletedAtIsNull(Instant.now())) deleteBatch(batch,null,"Automatic 10-day retention deletion");}

    private void deleteBatch(KidsChampBatchEntity batch,UserEntity actor,String reason){
        storage.deletePath(batch.getArchivePath());
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdOrderBySubmittedAtAsc(batch.getPublicId())){
            storage.delete(item.getStoredFilename());item.markPhotoDeleted();
        }
        batch.markDeleted(actor);audit(actor,"BATCH_DELETED","BATCH",batch.getPublicId(),reason);
    }
    private void notify(KidsChampSubmissionEntity item,String title,String message){
        if(item.getUser()!=null) notifications.create(item.getUser(),"KIDS_CHAMP",title,message);
        events.publishEvent(new KidsChampStatusEmailRequested(item.getEmail(),item.getChildName(),item.getTrackingCode(),title,message));
    }
    private BatchResponse response(KidsChampBatchEntity b){
        long days=b.getDeleteAfter()==null?10:Math.max(0,(long)Math.ceil(Duration.between(Instant.now(),b.getDeleteAfter()).toHours()/24.0));
        return new BatchResponse(b.getPublicId(),b.getBatchCode(),b.getStatus(),b.getPhotoCount(),b.getFirstDownloadedAt(),
            b.getDeleteAfter(),days,b.getTelecastDate(),b.getAlternateTelecastDate(),b.getCreatedAt(),b.getDeletedAt(),
            submissions.findAllByBatchPublicIdOrderBySubmittedAtAsc(b.getPublicId()).stream().map(KidsChampSubmissionEntity::getPublicId).toList());
    }
    private UserEntity user(UUID id){return users.findByPublicId(id).orElseThrow(()->bad("ACCOUNT_NOT_FOUND","Account not found."));}
    private KidsChampSubmissionEntity submission(UUID id){return submissions.findByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"SUBMISSION_NOT_FOUND","Submission not found."));}
    private KidsChampBatchEntity batch(UUID id){return batches.findByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"BATCH_NOT_FOUND","ZIP batch not found."));}
    private KidsChampCalendarTaskEntity task(UUID id){return tasks.findByPublicIdAndDeletedAtIsNull(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"TASK_NOT_FOUND","Calendar task not found."));}
    private void audit(UserEntity actor,String action,String type,UUID id,String details){KidsChampAuditEntity a=new KidsChampAuditEntity();a.setActor(actor);a.setAction(action);a.setEntityType(type);a.setEntityPublicId(id);a.setDetails(details);audits.save(a);liveUpdates.publish(action,type,id);}
    private String newBatchCode(){String code;do{code="KCZIP-"+LocalDate.now().toString().replace("-","")+"-"+UUID.randomUUID().toString().substring(0,6).toUpperCase();}while(batches.existsByBatchCode(code));return code;}
    private String csv(String value){if(value==null)return "";return "\""+value.replace("\"","\"\"")+"\"";}
    private String safeZipPart(String value){
        String cleaned=value==null?"Unknown":value.trim().replaceAll("[^\\p{L}\\p{N}._-]+","-").replaceAll("-+","-");
        cleaned=cleaned.replaceAll("^[.-]+|[.-]+$","");
        return cleaned.isBlank()?"Unknown":cleaned.substring(0,Math.min(cleaned.length(),60));
    }
    private boolean same(String a,String b){return a!=null&&b!=null&&!a.isBlank()&&a.trim().equalsIgnoreCase(b.trim());}
    private String normalized(String value){return value==null?"":value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]","");}
    private String phoneTail(String value){String digits=value==null?"":value.replaceAll("\\D","");return digits.length()<7?UUID.randomUUID().toString():digits.substring(digits.length()-7);}
    private UUID first(UUID a,UUID b){return a.toString().compareTo(b.toString())<0?a:b;}
    private UUID second(UUID a,UUID b){return a.toString().compareTo(b.toString())<0?b:a;}
    private ApiException bad(String c,String m){return new ApiException(HttpStatus.BAD_REQUEST,c,m);}
    public record BatchResponse(UUID id,String batchCode,String status,int photoCount,Instant firstDownloadedAt,Instant deleteAfter,long daysRemaining,LocalDate telecastDate,LocalDate alternateTelecastDate,Instant createdAt,Instant deletedAt,List<UUID> submissionIds){}
    public record ZipProgressResponse(int readyPhotos,int activeTargetSize,int nextTargetSize,Instant activeStartedAt){}
    public record Download(Path path,String filename){}
    public record Photo(Path path,String filename,String mediaType){}
    public record GuestResponse(UUID id,String parentName,String mobile,String email,String countryCode,String province,
        String hometown,int submissionCount,Instant firstSubmittedAt,Instant lastSubmittedAt){}
    public record DuplicateGuestResponse(UUID firstId,UUID secondId,String firstName,String secondName,String firstPhone,String secondPhone,String firstHometown,String secondHometown,int firstSubmissions,int secondSubmissions,List<String> reasons,String matchType){}
    public record ParticipantResponse(UUID id,String name,int age,String type,String location,String phone,long submissions,long approved,long telecasted,Instant joinedAt,Instant lastSubmissionAt,boolean whatsappConsented){}
    public record OverviewResponse(long totalSubmissions,long newToday,long pendingReviews,long approved,long selectedForTv,long telecasted,long uniqueParticipants,long activeBatches){}
    public record SettingsRequest(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage){}
    public record SettingsResponse(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage,Instant updatedAt){
        static SettingsResponse from(KidsChampSettingsEntity e){return new SettingsResponse(Arrays.stream(e.getCategories().split(",")).map(String::trim).filter(v->!v.isEmpty()).toList(),e.getMaxFileSizeMb(),e.getAllowedFileTypes(),e.getMinimumAge(),e.getMaximumAge(),e.getDailyTelecastLimit(),e.getDefaultTelecastTime(),e.getZipBatchSize(),e.getZipExpiryDays(),e.getZipWarningDays(),e.getFrequentParticipantThreshold(),e.isRequireWhatsAppConsent(),e.getCampaignLimit(),e.getDefaultMessage(),e.getUpdatedAt());}}
    public record CalendarTaskResponse(UUID id,LocalDate date,String title,String details,Instant completedAt,Instant createdAt){static CalendarTaskResponse from(KidsChampCalendarTaskEntity e){return new CalendarTaskResponse(e.getPublicId(),e.getTaskDate(),e.getTitle(),e.getDetails(),e.getCompletedAt(),e.getCreatedAt());}}
    public record ActivityResponse(String action,String entityType,UUID entityId,String details,String actor,Instant createdAt){}
    public record GrowthResponse(LocalDate date,long submissions,long participants){}
    public record CampaignResponse(UUID id,String channel,String status,int recipientCount,String messageTemplate,Instant createdAt){static CampaignResponse from(KidsChampMessageCampaignEntity e){return new CampaignResponse(e.getPublicId(),e.getChannel(),e.getStatus(),e.getRecipientCount(),e.getMessageTemplate(),e.getCreatedAt());}}
}
