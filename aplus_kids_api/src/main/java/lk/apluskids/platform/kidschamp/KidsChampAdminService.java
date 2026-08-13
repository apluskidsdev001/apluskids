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
import org.springframework.core.task.TaskExecutor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

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
    private final TransactionTemplate cleanupTransactions;
    private final TransactionTemplate automaticBatchTransactions;
    private final TaskExecutor taskExecutor;
    KidsChampAdminService(KidsChampSubmissionRepository submissions,KidsChampBatchRepository batches,KidsChampGuestContactRepository guests,
        KidsChampAuditRepository audits,UserRepository users,KidsChampStorage storage,KidsChampSettingsRepository settings,
        KidsChampCalendarTaskRepository tasks,KidsChampMessageCampaignRepository campaigns,KidsChampMessageRecipientRepository messageRecipients,
        AccountNotificationService notifications,ApplicationEventPublisher events,KidsChampIgnoredGuestMatchRepository ignoredGuestMatches,
        KidsChampLiveUpdates liveUpdates,PlatformTransactionManager transactionManager,
        @Qualifier("applicationTaskExecutor") TaskExecutor taskExecutor){
        this.submissions=submissions;this.batches=batches;this.guests=guests;this.audits=audits;this.users=users;this.storage=storage;
        this.settings=settings;this.tasks=tasks;this.campaigns=campaigns;this.messageRecipients=messageRecipients;this.notifications=notifications;this.events=events;
        this.ignoredGuestMatches=ignoredGuestMatches;
        this.liveUpdates=liveUpdates;
        this.cleanupTransactions=new TransactionTemplate(transactionManager);
        this.cleanupTransactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.automaticBatchTransactions=new TransactionTemplate(transactionManager);
        this.automaticBatchTransactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.taskExecutor=taskExecutor;
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
        lockedSettings();
        UserEntity actor=user(actorId);
        var registered=submissions.findFirstByChildProfilePublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(childId)
            .orElseThrow(()->bad("REGISTERED_PARTICIPANT_NOT_FOUND","The registered child profile was not found."));
        var guest=guests.findByPublicId(guestId).orElseThrow(()->bad("GUEST_NOT_FOUND","The guest record was not found."));
        var moved=submissions.findAllByGuestContactPublicIdForUpdate(guestId);
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
        lockedSettings();
        UserEntity actor=user(actorId);
        var target=guests.findByPublicId(targetId).orElseThrow(()->bad("GUEST_NOT_FOUND","The destination guest record was not found."));
        var source=guests.findByPublicId(sourceId).orElseThrow(()->bad("GUEST_NOT_FOUND","The guest record to merge was not found."));
        if(target.getClaimedAt()!=null||source.getClaimedAt()!=null) throw bad("GUEST_ALREADY_CLAIMED","Claimed guest histories cannot be merged here.");
        var moved=submissions.findAllByGuestContactPublicIdForUpdate(sourceId);
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
        if(!KidsChampStorage.supportsAllowedFileTypes(value.allowedFileTypes())) throw bad("FILE_TYPES_UNSUPPORTED","Kids Champ currently supports JPG, JPEG, and PNG photos.");
        if(value.zipExpiryDays()<1||value.zipWarningDays()<0||value.zipWarningDays()>=value.zipExpiryDays()) throw bad("ZIP_RETENTION_INVALID","Use an expiry of at least 1 day and a warning period shorter than the expiry.");
        UserEntity actor=user(actorId);KidsChampSettingsEntity entity=settings.findLockedById((short)1)
            .orElseThrow(()->new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"SETTINGS_MISSING","Kids Champ settings are unavailable."));
        boolean batchSizeChanged=entity.getZipBatchSize()!=value.zipBatchSize();
        long queuedPhotos=eligibleZipPhotoCount();
        ensureActiveZipTarget(entity);
        if(batchSizeChanged&&queuedPhotos>0&&value.zipQueueCountPolicy()==null)
            throw new ApiException(HttpStatus.CONFLICT,"ZIP_QUEUE_COUNT_DECISION_REQUIRED",
                queuedPhotos+" approved photo"+(queuedPhotos==1?" is":"s are")+" already waiting. Choose whether the current queue keeps "+entity.getActiveZipTargetSize()+" photos or uses "+value.zipBatchSize()+" photos.");
        if(batchSizeChanged&&queuedPhotos>0&&value.zipQueueCountPolicy()==ZipQueueCountPolicy.APPLY_NEW)
            entity.replaceActiveZipTarget(value.zipBatchSize());
        if(queuedPhotos==0)entity.completeActiveZip();
        entity.update(String.join(",",value.categories()),value.maxFileSizeMb(),KidsChampStorage.ALLOWED_FILE_TYPES,value.minimumAge(),value.maximumAge(),
            value.dailyTelecastLimit(),value.defaultTelecastTime(),value.zipBatchSize(),value.zipExpiryDays(),value.zipWarningDays(),
            value.frequentParticipantThreshold(),value.requireWhatsAppConsent(),value.campaignLimit(),value.defaultMessage(),actor);
        audit(actor,"SETTINGS_UPDATED","SETTINGS",new UUID(0,1),batchSizeChanged&&queuedPhotos>0
            ? "ZIP photo count updated using "+value.zipQueueCountPolicy():"Kids Champ settings updated");
        if(queuedPhotos>0)scheduleAutomaticZips(actor.getPublicId());
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
        return createCampaign(actorId,channel,template,participantIds,null,null,null);
    }

    @Transactional
    public CampaignResponse createCampaign(UUID actorId,String channel,String template,List<UUID> participantIds,String templateName,String languageCode,List<String> templateParameters){
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
            KidsChampMessageRecipientEntity recipient=new KidsChampMessageRecipientEntity();recipient.create(campaign,participant.id(),participant.name(),destination,rendered,templateName,languageCode,templateParameters);messageRecipients.save(recipient);
        }
        audit(actor,"MESSAGE_CAMPAIGN_QUEUED","CAMPAIGN",campaign.getPublicId(),channel+" recipients: "+selected.size());return CampaignResponse.from(campaign);
    }
    @Transactional(readOnly=true) public List<CampaignResponse> campaigns(){return campaigns.findAllByOrderByCreatedAtDesc().stream().map(CampaignResponse::from).toList();}
    @Transactional(readOnly=true) public List<MessageRecipientResponse> campaignRecipients(UUID campaignId){return messageRecipients.findAllByCampaignPublicIdOrderByIdAsc(campaignId).stream().map(MessageRecipientResponse::from).toList();}
    @Transactional public void retryRecipients(UUID actorId,List<Long> ids){messageRecipientAction(actorId,ids,true);}
    @Transactional public void ignoreRecipients(UUID actorId,List<Long> ids){messageRecipientAction(actorId,ids,false);}
    @Transactional public void deleteRecipients(UUID actorId,List<Long> ids){if(ids==null||ids.isEmpty()||ids.size()>500)throw bad("RECIPIENT_SELECTION_INVALID","Select between 1 and 500 failed messages.");UserEntity actor=user(actorId);for(Long id:ids){KidsChampMessageRecipientEntity recipient=messageRecipients.findById(id).orElseThrow(()->bad("RECIPIENT_NOT_FOUND","Message recipient not found."));recipient.delete();audit(actor,"WHATSAPP_RECIPIENT_DELETED","MESSAGE_RECIPIENT",recipient.getCampaign().getPublicId(),recipient.getParticipantName());}}
    private void messageRecipientAction(UUID actorId,List<Long> ids,boolean retry){if(ids==null||ids.isEmpty()||ids.size()>500)throw bad("RECIPIENT_SELECTION_INVALID","Select between 1 and 500 failed messages.");UserEntity actor=user(actorId);for(Long id:ids){KidsChampMessageRecipientEntity recipient=messageRecipients.findById(id).orElseThrow(()->bad("RECIPIENT_NOT_FOUND","Message recipient not found."));if(retry)recipient.retry();else recipient.skip();audit(actor,retry?"WHATSAPP_RETRY_QUEUED":"WHATSAPP_RETRY_IGNORED","MESSAGE_RECIPIENT",recipient.getCampaign().getPublicId(),recipient.getParticipantName());}}
    private String submissionContactEmail(UUID participantId){return submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream().filter(i->
        (i.getChildProfile()!=null&&i.getChildProfile().getPublicId().equals(participantId))||(i.getGuestContact()!=null&&i.getGuestContact().getPublicId().equals(participantId)))
        .map(KidsChampSubmissionEntity::getEmail).filter(Objects::nonNull).findFirst().orElse(null);}

    @Transactional
    public KidsChampAdminSubmissionResponse review(UUID actorId,UUID id,ReviewStatus status,String reason){
        if(status!=ReviewStatus.UNDER_REVIEW&&status!=ReviewStatus.APPROVED&&status!=ReviewStatus.REJECTED)
            throw bad("STATUS_INVALID","Choose under review, approved, or rejected.");
        if(status==ReviewStatus.REJECTED&&(reason==null||reason.isBlank())) throw bad("REJECTION_REASON_REQUIRED","Add a rejection reason.");
        UserEntity actor=user(actorId);lockedSettings();KidsChampSubmissionEntity item=lockedSubmission(id);
        item.review(status,status==ReviewStatus.REJECTED?reason.trim():null,actor);
        audit(actor,"REVIEW_UPDATED","SUBMISSION",id,status.name());
        String message=status==ReviewStatus.REJECTED?"The submission was not approved. Reason: "+reason:
            status==ReviewStatus.APPROVED?"The submission was approved.":"The submission is now under review.";
        notify(item,"Kids Champ update",message);
        if(status==ReviewStatus.APPROVED)scheduleAutomaticZips(actor.getPublicId());
        return KidsChampAdminSubmissionResponse.from(item);
    }

    /** Approves each submission at most once and starts the automatic ZIP queue. */
    @Transactional
    public ApprovalResponse approve(UUID actorId,List<UUID> ids){
        if(ids==null||ids.isEmpty()||ids.size()>500) throw bad("SUBMISSION_SELECTION_INVALID","Select between 1 and 500 submissions.");
        lockedSettings();
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
            scheduleAutomaticZips(actor.getPublicId());
        }
        return new ApprovalResponse(approved,alreadyApproved);
    }

    private void ensureActiveZipTarget(KidsChampSettingsEntity entity){
        if(entity.getActiveZipTargetSize()==null&&!eligibleZipPhotos(1).isEmpty())
            entity.startActiveZip(entity.getZipBatchSize());
    }

    @Transactional
    public KidsChampAdminSubmissionResponse update(UUID actorId,UUID id,String category,String note,UUID reviewerId,Boolean selectedForTv){
        lockedSettings();UserEntity actor=user(actorId); KidsChampSubmissionEntity item=lockedSubmission(id);
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
        if(item.getStoredFilename()==null||item.getPhotoDeletedAt()!=null) throw new ApiException(HttpStatus.GONE,"PHOTO_DELETED","This photo is no longer available.");
        return new Photo(storage.photo(item.getStoredFilename()),item.getOriginalFilename(),item.getMediaType());
    }

    @Transactional
    public void deleteSubmission(UUID actorId,UUID id){
        lockedSettings();UserEntity actor=user(actorId); KidsChampSubmissionEntity item=lockedSubmission(id);
        if(item.getBatch()!=null) throw bad("SUBMISSION_BATCHED","A submission included in a ZIP batch cannot be deleted.");
        item.softDelete(actor); audit(actor,"SUBMISSION_DELETED","SUBMISSION",id,"Soft deleted by administrator");
    }

    @Transactional
    public void deletePhoto(UUID actorId,UUID id){
        lockedSettings();
        UserEntity actor=user(actorId);KidsChampSubmissionEntity item=lockedSubmission(id);
        if(item.getBatch()!=null)throw bad("SUBMISSION_BATCHED","Artwork included in a ZIP batch is managed by the ZIP retention process.");
        if(item.getStoredFilename()==null)return;
        if(item.getPhotoDeletedAt()==null){
            item.markPhotoDeletionPending();
            audit(actor,"PHOTO_DELETE_QUEUED","SUBMISSION",id,"Manual administrator deletion; cleanup queued");
        }
        afterCommit(()->retryPhotoCleanup(id,actorId,"Manual administrator deletion"));
    }

    @Transactional
    public KidsChampAdminSubmissionResponse preview(UUID actorId,UUID id,boolean previewed){
        lockedSettings();UserEntity actor=user(actorId); KidsChampSubmissionEntity item=lockedSubmission(id);
        item.setPreviewed(previewed);
        audit(actor,previewed ? "SUBMISSION_PREVIEWED" : "SUBMISSION_PREVIEW_CLEARED","SUBMISSION",id,null);
        return KidsChampAdminSubmissionResponse.from(item);
    }

    @Transactional
    public BatchResponse createBatch(UUID actorId,int limit,boolean includeRemainder){
        if(limit<1) throw bad("BATCH_LIMIT_INVALID","ZIP photo count must be at least 1.");
        KidsChampSettingsEntity zipSettings=lockedSettings();
        List<KidsChampSubmissionEntity> items=eligibleZipPhotos(limit);
        if(items.isEmpty()) throw bad("NO_PHOTOS","There are no approved photos with available artwork waiting.");
        if(items.size()<limit&&!includeRemainder) throw bad("REMAINDER_CONFIRMATION_REQUIRED",
            items.size()+" photos remain. Select Include remaining photos to create a smaller ZIP.");
        BatchResponse response=buildBatch(user(actorId),items,zipSettings.getZipExpiryDays(),zipSettings.getZipWarningDays());
        zipSettings.completeActiveZip();
        if(!eligibleZipPhotos(1).isEmpty())zipSettings.startActiveZip(zipSettings.getZipBatchSize());
        return response;
    }

    @Transactional
    public BatchResponse createSelectedBatch(UUID actorId,List<UUID> ids){
        return createSelectedBatchInternal(actorId,ids,null);
    }

    private void scheduleAutomaticZips(UUID actorId){
        afterCommit(()->{try{taskExecutor.execute(()->processAutomaticQueue(actorId));}catch(RuntimeException ignored){}});
    }

    private void processAutomaticQueue(UUID actorId){
        for(int batchesCreated=0;batchesCreated<500;batchesCreated++){
            try{
                Boolean created=automaticBatchTransactions.execute(status->createOneAutomaticZip(actorId));
                if(!Boolean.TRUE.equals(created))return;
            }catch(RuntimeException exception){return;}
        }
    }

    private boolean createOneAutomaticZip(UUID actorId){
        KidsChampSettingsEntity entity=lockedSettings();ensureActiveZipTarget(entity);
        if(entity.getActiveZipTargetSize()==null)return false;
        int target=entity.getActiveZipTargetSize();List<KidsChampSubmissionEntity> ready=eligibleZipPhotos(target);
        if(ready.size()<target)return false;
        buildBatch(user(actorId),ready,entity.getZipExpiryDays(),entity.getZipWarningDays());entity.completeActiveZip();
        if(!eligibleZipPhotos(1).isEmpty())entity.startActiveZip(entity.getZipBatchSize());
        return true;
    }

    @Transactional
    public BatchResponse createSelectedBatch(UUID actorId,List<UUID> ids,String reason){
        if(reason==null||reason.isBlank())throw bad("RECOVERY_REASON_REQUIRED","Add a reason for manual ZIP recovery.");
        return createSelectedBatchInternal(actorId,ids,reason.trim());
    }

    @Transactional
    public List<BatchResponse> createSelectedBatches(UUID actorId,List<UUID> ids,String reason){
        if(reason==null||reason.isBlank())throw bad("RECOVERY_REASON_REQUIRED","Add a reason for manual ZIP recovery.");
        if(ids==null||ids.isEmpty())throw bad("SUBMISSION_SELECTION_INVALID","Select at least one submission.");
        KidsChampSettingsEntity zipSettings=lockedSettings();
        List<KidsChampSubmissionEntity> items=validatedSelectedSubmissions(ids);
        UserEntity actor=user(actorId);List<BatchResponse> result=new ArrayList<>();int size=zipSettings.getZipBatchSize();
        for(int start=0;start<items.size();start+=size){
            BatchResponse batch=buildBatch(actor,items.subList(start,Math.min(start+size,items.size())),zipSettings.getZipExpiryDays(),zipSettings.getZipWarningDays());
            audit(actor,"MANUAL_ZIP_RECOVERY","BATCH",batch.id(),reason.trim()+"; split "+(result.size()+1));
            result.add(batch);
        }
        if(eligibleZipPhotos(1).isEmpty())zipSettings.completeActiveZip();
        return result;
    }

    private BatchResponse createSelectedBatchInternal(UUID actorId,List<UUID> ids,String reason){
        if(ids==null||ids.isEmpty()) throw bad("SUBMISSION_SELECTION_INVALID","Select at least one submission.");
        KidsChampSettingsEntity zipSettings=lockedSettings();
        int selectedCount=new LinkedHashSet<>(ids).size();
        if(selectedCount>zipSettings.getZipBatchSize())throw bad("BATCH_SELECTION_TOO_LARGE",
            "Select no more than "+zipSettings.getZipBatchSize()+" photos for one ZIP, or use split ZIP recovery.");
        List<KidsChampSubmissionEntity> items=validatedSelectedSubmissions(ids);
        UserEntity actor=user(actorId);BatchResponse response=buildBatch(actor,items,zipSettings.getZipExpiryDays(),zipSettings.getZipWarningDays());
        if(eligibleZipPhotos(1).isEmpty())zipSettings.completeActiveZip();
        if(reason!=null)audit(actor,"MANUAL_ZIP_RECOVERY","BATCH",response.id(),reason);
        return response;
    }

    private List<KidsChampSubmissionEntity> validatedSelectedSubmissions(List<UUID> ids){
        Set<UUID> requested=new LinkedHashSet<>(ids);
        List<KidsChampSubmissionEntity> items=selectedSubmissions(requested);
        if(items.size()!=requested.size()) throw bad("SUBMISSION_NOT_FOUND","One or more selected submissions were not found.");
        for(KidsChampSubmissionEntity item:items){
            if(item.getReviewStatus()!=ReviewStatus.APPROVED) throw bad("APPROVAL_REQUIRED",item.getTrackingCode()+" is not approved.");
            if(item.getBatch()!=null) throw bad("ALREADY_BATCHED",item.getTrackingCode()+" is already in a ZIP batch.");
            if(item.getStoredFilename()==null||!storage.hasReadablePhoto(item.getStoredFilename())) throw bad("PHOTO_NOT_AVAILABLE",item.getTrackingCode()+" has no available photo.");
        }
        items.sort(Comparator.comparing(KidsChampSubmissionEntity::getSubmittedAt).thenComparing(KidsChampSubmissionEntity::getId));
        return items;
    }

    private List<KidsChampSubmissionEntity> selectedSubmissions(Set<UUID> ids){
        List<UUID> values=new ArrayList<>(ids);List<KidsChampSubmissionEntity> result=new ArrayList<>(values.size());
        for(int start=0;start<values.size();start+=500)
            result.addAll(submissions.findAllByPublicIdInAndDeletedAtIsNull(values.subList(start,Math.min(start+500,values.size()))));
        return result;
    }

    private BatchResponse buildBatch(UserEntity actor,List<KidsChampSubmissionEntity> items,int retentionDays,int warningDays){
        items=new ArrayList<>(items);
        items.sort(Comparator.comparing(KidsChampSubmissionEntity::getSubmittedAt).thenComparing(KidsChampSubmissionEntity::getId));
        KidsChampBatchEntity batch=new KidsChampBatchEntity();
        batch.setBatchCode(newBatchCode());batch.setPhotoCount(items.size());batch.setCreatedBy(actor);batch.startRetention(retentionDays,warningDays);batches.save(batch);
        Path archive=storage.archive(batch.getBatchCode());
        try{writeArchive(archive,items);}
        catch(ApiException exception){storage.deletePath(archive.toString());throw exception;}
        catch(IOException exception){storage.deletePath(archive.toString());throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"ZIP_FAILED","The ZIP could not be created. Check that the selected artwork files are valid images and try again.");}
        if(TransactionSynchronizationManager.isActualTransactionActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
            @Override public void afterCompletion(int status){if(status!=TransactionSynchronization.STATUS_COMMITTED)storage.deletePathBestEffort(archive.toString());}
        });
        for(KidsChampSubmissionEntity item:items)item.setBatch(batch);
        batch.setArchivePath(archive.toString());audit(actor,"BATCH_CREATED","BATCH",batch.getPublicId(),"Photos: "+items.size()+"; retention: "+retentionDays+" days");
        return response(batch);
    }

    private void writeArchive(Path archive,List<KidsChampSubmissionEntity> items) throws IOException{
        try(ZipOutputStream zip=new ZipOutputStream(Files.newOutputStream(archive))){
            StringBuilder csv=new StringBuilder("tracking_code,child_name,date_of_birth,age,parent_name,email,mobile,country,province,hometown,title\n");
            int index=1;
            for(KidsChampSubmissionEntity item:items){
                Path source=storage.photo(item.getStoredFilename());
                zip.putNextEntry(new ZipEntry(zipPhotoName(index++,item.getChildName(),item.getHometown())));
                writePng(source,zip,item.getTrackingCode());zip.closeEntry();
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
            for(int index=0;index<items.size();index++)
                if(zip.getEntry(zipPhotoName(index+1,items.get(index).getChildName(),items.get(index).getHometown()))==null)return false;
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
    public List<BatchResponse> batches(){return batches.findAllByOrderByCreatedAtDescIdDesc().stream().filter(batch->batch.getPurgedAt()==null).map(this::response).toList();}

    @Transactional(readOnly=true)
    public ZipProgressResponse zipProgress(){
        KidsChampSettingsEntity entity=settings.findById((short)1).orElseThrow();
        long ready=eligibleZipPhotoCount();
        int target=entity.getActiveZipTargetSize()==null?entity.getZipBatchSize():entity.getActiveZipTargetSize();
        return new ZipProgressResponse(ready,target,entity.getZipBatchSize(),entity.getActiveZipStartedAt());
    }

    private KidsChampSettingsEntity lockedSettings(){return settings.findLockedById((short)1)
        .orElseThrow(()->new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"SETTINGS_MISSING","Kids Champ settings are unavailable."));}

    private List<KidsChampSubmissionEntity> eligibleZipPhotos(int maximum){
        if(maximum<1)return List.of();
        while(true){
            var values=submissions.findLockedByReviewStatusAndBatchIsNullAndDeletedAtIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNull(
                ReviewStatus.APPROVED,PageRequest.of(0,maximum,org.springframework.data.domain.Sort.by("submittedAt").ascending().and(org.springframework.data.domain.Sort.by("id").ascending())));
            if(values.isEmpty())return List.of();
            List<KidsChampSubmissionEntity> result=new ArrayList<>(values.getNumberOfElements());
            boolean missing=false;
            for(KidsChampSubmissionEntity item:values.getContent()){
                if(storage.hasReadablePhoto(item.getStoredFilename()))result.add(item);
                else{
                    String storedName=item.getStoredFilename();
                    if(!storage.hasPhoto(storedName)){
                        item.markPhotoDeleted();
                        audit(null,"PHOTO_MISSING_SKIPPED","SUBMISSION",item.getPublicId(),"Artwork file was missing and was excluded from the ZIP queue.");
                    }else if(storage.deleteBestEffort(storedName)){
                        item.markPhotoDeleted();
                        audit(null,"PHOTO_INVALID_REMOVED","SUBMISSION",item.getPublicId(),"Unreadable artwork was removed and excluded from the ZIP queue.");
                    }else{
                        item.markPhotoDeletionPending();
                        audit(null,"PHOTO_INVALID_CLEANUP_PENDING","SUBMISSION",item.getPublicId(),"Unreadable artwork was excluded from the ZIP queue and queued for cleanup retry.");
                    }
                    missing=true;
                }
            }
            if(!missing)return result;
            submissions.flush();
        }
    }

    private long eligibleZipPhotoCount(){
        long result=0;int page=0;
        while(true){
            var values=submissions.findByReviewStatusAndBatchIsNullAndDeletedAtIsNullAndPhotoDeletedAtIsNullAndStoredFilenameIsNotNull(
                ReviewStatus.APPROVED,PageRequest.of(page++,500,org.springframework.data.domain.Sort.by("submittedAt").ascending().and(org.springframework.data.domain.Sort.by("id").ascending())));
            result+=values.getContent().stream().filter(item->storage.hasReadablePhoto(item.getStoredFilename())).count();
            if(!values.hasNext())return result;
        }
    }

    @Transactional
    public Download download(UUID actorId,UUID id){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=activeLockedBatch(id);
        if(batch.getArchivePath()==null) throw new ApiException(HttpStatus.GONE,"BATCH_DELETED","This ZIP has been deleted.");
        Path file=Paths.get(batch.getArchivePath());
        List<KidsChampSubmissionEntity> items=submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(id);
        boolean missing=!Files.isRegularFile(file);
        if(missing||!archiveUsesCurrentNames(file,items))try{
            replaceArchive(file,items);audit(actor,missing?"BATCH_ARCHIVE_RECOVERED":"BATCH_ARCHIVE_RENAMED","BATCH",id,
                missing?"Missing archive rebuilt from retained source artwork":"Photo names updated to ID_Name_City.png");
        }catch(ApiException exception){throw new ApiException(HttpStatus.GONE,"BATCH_SOURCE_PHOTO_MISSING","One or more source photos are no longer available, so this ZIP cannot be rebuilt.");}
        catch(IOException exception){throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"ZIP_REBUILD_FAILED","The ZIP could not be prepared for download. Please try again.");}
        Path snapshot=storage.downloadSnapshot(file,batch.getBatchCode());
        if(TransactionSynchronizationManager.isActualTransactionActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
            @Override public void afterCompletion(int status){if(status!=TransactionSynchronization.STATUS_COMMITTED)storage.deletePathBestEffort(snapshot.toString());}
        });
        return new Download(snapshot,batch.getBatchCode()+".zip",batch.getPublicId(),actor.getPublicId());
    }

    public void completeDownload(Download download){
        if(download==null)return;
        if(TransactionSynchronizationManager.isActualTransactionActive())completeDownloadInTransaction(download);
        else cleanupTransactions.executeWithoutResult(status->completeDownloadInTransaction(download));
    }

    private void completeDownloadInTransaction(Download download){
        KidsChampBatchEntity batch=activeLockedBatch(download.batchId());
        boolean first=batch.getFirstDownloadedAt()==null;batch.markDownloaded();
        if(first)audit(user(download.actorId()),"BATCH_FIRST_DOWNLOAD","BATCH",batch.getPublicId(),"Deletes at "+batch.getDeleteAfter());
    }

    @Transactional
    public BatchResponse schedule(UUID actorId,UUID id,LocalDate date,LocalDate alternate){
        if(date==null) throw bad("TELECAST_DATE_REQUIRED","Choose a telecast date.");
        if(date.isBefore(LocalDate.now(ZoneId.of("Asia/Colombo"))))throw bad("TELECAST_DATE_PAST","Choose today or a future telecast date.");
        if(alternate!=null&&alternate.isBefore(date))throw bad("ALTERNATE_TELECAST_INVALID","The backup telecast date cannot be before the scheduled date.");
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=activeLockedBatch(id);int limit=settings.findById((short)1).orElseThrow().getDailyTelecastLimit();
        long scheduled=batches.findAllByOrderByCreatedAtDescIdDesc().stream().filter(value->value.getDeletedAt()==null&&!value.getPublicId().equals(id)&&date.equals(value.getTelecastDate())).count();
        if(scheduled>=limit)throw bad("TELECAST_DAILY_LIMIT","The daily telecast limit of "+limit+" scheduled ZIPs has been reached.");
        batch.schedule(date,alternate);
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdForUpdate(id)){
            item.scheduleTelecast();
            notify(item,"Kids Champ telecast scheduled","Telecast date: "+date+(alternate==null?"":" (alternative: "+alternate+")"));
        }
        audit(actor,"TELECAST_SCHEDULED","BATCH",id,date.toString());return response(batch);
    }

    @Transactional
    public BatchResponse completeTelecast(UUID actorId,UUID id){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=activeLockedBatch(id);batch.completeTelecast();
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdForUpdate(id))item.markTelecasted();
        audit(actor,"TELECAST_COMPLETED","BATCH",id,batch.getTelecastDate().toString());return response(batch);
    }

    @Transactional
    public BatchResponse setEdited(UUID actorId,UUID id,boolean edited){
        UserEntity actor=user(actorId);KidsChampBatchEntity batch=activeLockedBatch(id);
        if(batch.getFirstDownloadedAt()==null) throw bad("BATCH_DOWNLOAD_REQUIRED","Download this ZIP before marking it edited.");
        batch.setEdited(edited);
        audit(actor,edited?"BATCH_EDITED":"BATCH_EDIT_CLEARED","BATCH",id,null);
        return response(batch);
    }

    @Transactional
    public void deleteBatch(UUID actorId,UUID id){
        KidsChampBatchEntity batch=lockedBatch(id);
        if(batch.getDeletedAt()!=null&&!batch.isCleanupPending())return;
        if(batch.getDeletedAt()==null&&batch.getFirstDownloadedAt()==null) throw bad("BATCH_DOWNLOAD_REQUIRED","Download this ZIP before deleting its archive.");
        deleteBatch(batch,user(actorId),"Manual administrator deletion");
    }

    @Transactional
    public void clearBatchBin(UUID actorId,List<UUID> ids){
        if(ids==null||ids.isEmpty()||ids.size()>500) throw bad("BATCH_SELECTION_INVALID","Select between 1 and 500 ZIP records to clear.");
        UserEntity actor=user(actorId);
        for(UUID id:new LinkedHashSet<>(ids)){
            KidsChampBatchEntity batch=lockedBatch(id);
            if(batch.getDeletedAt()==null) throw bad("BATCH_NOT_IN_BIN",batch.getBatchCode()+" must be moved to the ZIP Bin before it can be cleared.");
            if(batch.isCleanupPending()) throw new ApiException(HttpStatus.CONFLICT,"BATCH_CLEANUP_PENDING",batch.getBatchCode()+" still has files waiting for automatic cleanup. Try again shortly.");
            if(batch.getPurgedAt()==null){batch.markPurged();audit(actor,"BATCH_BIN_CLEARED","BATCH",id,"Permanently cleared from the ZIP Bin");}
        }
    }

    /** Safely resumes the automatic queue after an interrupted generation attempt. */
    @Transactional
    public void processAutomaticZips(UUID actorId){user(actorId);scheduleAutomaticZips(actorId);}

    @Scheduled(cron="0 * * * * *",zone="Asia/Colombo")
    public void resumeAutomaticZipQueue(){
        UUID actorId=users.findAll().stream().filter(value->value.getRoles().stream().anyMatch(role->
            "ROLE_SUPER_ADMIN".equals(role.getName())||"ROLE_ADMIN".equals(role.getName())))
            .map(UserEntity::getPublicId).findFirst().orElse(null);
        if(actorId!=null)try{taskExecutor.execute(()->processAutomaticQueue(actorId));}catch(RuntimeException ignored){}
    }

    @Scheduled(cron="0 */15 * * * *",zone="Asia/Colombo") @Transactional
    public void deleteExpired(){
        for(KidsChampBatchEntity batch:batches.findExpiredForUpdate(Instant.now())) requestBatchCleanup(batch,null,"Automatic ZIP retention deletion");
        for(KidsChampSubmissionEntity item:submissions.findPendingPhotoCleanupForUpdate()){
            UUID id=item.getPublicId();afterCommit(()->retryPhotoCleanup(id,null,"Automatic artwork cleanup retry"));
        }
        afterCommit(()->storage.cleanupStaleDownloadSnapshots(Duration.ofDays(1)));
    }

    void releaseDownload(Download download){if(download!=null)storage.deletePathBestEffort(download.path().toString());}

    private void deleteBatch(KidsChampBatchEntity batch,UserEntity actor,String reason){
        if(batch.getDeletedAt()==null){requestBatchCleanup(batch,actor,reason);return;}
        if(!batch.isCleanupPending())return;
        UUID actorId=actor==null?null:actor.getPublicId();afterCommit(()->retryBatchCleanup(batch.getPublicId(),actorId,reason));
    }

    private void requestBatchCleanup(KidsChampBatchEntity batch,UserEntity actor,String reason){
        if(batch.getDeletedAt()==null){batch.requestCleanup(actor);audit(actor,"BATCH_DELETED","BATCH",batch.getPublicId(),reason+"; cleanup queued");}
        else if(!batch.isCleanupPending())return;
        UUID actorId=actor==null?null:actor.getPublicId();afterCommit(()->retryBatchCleanup(batch.getPublicId(),actorId,reason));
    }

    public void retryBatchCleanup(UUID batchId,UUID actorId,String reason){
        cleanupTransactions.executeWithoutResult(status->{
            KidsChampBatchEntity batch=lockedBatch(batchId);if(!batch.isCleanupPending())return;
            UserEntity actor=actorId==null?null:user(actorId);performBatchCleanup(batch,actor,reason,true);
        });
    }

    private void performBatchCleanup(KidsChampBatchEntity batch,UserEntity actor,String reason,boolean retry){
        int cleanupFailures=0;
        if(storage.deletePathBestEffort(batch.getArchivePath()))batch.setArchivePath(null);else cleanupFailures++;
        for(KidsChampSubmissionEntity item:submissions.findAllByBatchPublicIdForUpdate(batch.getPublicId())){
            if(item.getStoredFilename()==null)continue;
            if(storage.deleteBestEffort(item.getStoredFilename()))item.markPhotoDeleted();
            else{cleanupFailures++;item.markPhotoDeletionPending();}
        }
        batch.recordCleanupResult(cleanupFailures);audit(actor,"BATCH_CLEANUP_RETRIED","BATCH",batch.getPublicId(),
            reason+"; file cleanup failures: "+cleanupFailures);
    }

    public void retryPhotoCleanup(UUID submissionId,UUID actorId,String reason){
        cleanupTransactions.executeWithoutResult(status->{
            KidsChampSubmissionEntity item=lockedSubmission(submissionId);
            if(item.getBatch()!=null||item.getPhotoDeletedAt()==null||item.getStoredFilename()==null)return;
            performPhotoCleanup(item,actorId==null?null:user(actorId),reason);
        });
    }

    private void performPhotoCleanup(KidsChampSubmissionEntity item,UserEntity actor,String reason){
        if(item.getStoredFilename()==null||item.getPhotoDeletedAt()==null)return;
        if(storage.deleteBestEffort(item.getStoredFilename())){
            item.markPhotoDeleted();
            audit(actor,"PHOTO_DELETED","SUBMISSION",item.getPublicId(),reason);
        }else audit(actor,"PHOTO_CLEANUP_RETRY_FAILED","SUBMISSION",item.getPublicId(),reason+"; cleanup will retry automatically");
    }
    private void notify(KidsChampSubmissionEntity item,String title,String message){
        if(item.getUser()!=null) notifications.create(item.getUser(),"KIDS_CHAMP",title,message);
        events.publishEvent(new KidsChampStatusEmailRequested(item.getEmail(),item.getChildName(),item.getTrackingCode(),title,message));
    }
    private BatchResponse response(KidsChampBatchEntity b){
        long days=b.getDeleteAfter()==null?b.getRetentionDays():Math.max(0,(long)Math.ceil(Duration.between(Instant.now(),b.getDeleteAfter()).toHours()/24.0));
        return new BatchResponse(b.getPublicId(),b.getBatchCode(),b.getStatus(),b.getPhotoCount(),b.getFirstDownloadedAt(),b.getEditedAt(),
            b.getDeleteAfter(),days,b.getTelecastDate(),b.getAlternateTelecastDate(),b.getTelecastCompletedAt(),b.getCreatedAt(),b.getDeletedAt(),
            submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(b.getPublicId()).stream().map(KidsChampSubmissionEntity::getPublicId).toList(),
            b.isCleanupPending(),b.getCleanupFailureCount(),b.getLastCleanupAttemptAt(),b.getWarningDays(),days<=b.getWarningDays());
    }
    private UserEntity user(UUID id){return users.findByPublicId(id).orElseThrow(()->bad("ACCOUNT_NOT_FOUND","Account not found."));}
    private KidsChampSubmissionEntity submission(UUID id){return submissions.findByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"SUBMISSION_NOT_FOUND","Submission not found."));}
    private KidsChampSubmissionEntity lockedSubmission(UUID id){return submissions.findLockedByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"SUBMISSION_NOT_FOUND","Submission not found."));}
    private KidsChampBatchEntity lockedBatch(UUID id){return batches.findLockedByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"BATCH_NOT_FOUND","ZIP batch not found."));}
    private KidsChampBatchEntity activeLockedBatch(UUID id){
        KidsChampBatchEntity batch=lockedBatch(id);
        if(batch.getDeletedAt()!=null)throw new ApiException(HttpStatus.GONE,"BATCH_DELETED","This ZIP is in the ZIP Bin and cannot be changed.");
        return batch;
    }
    private KidsChampCalendarTaskEntity task(UUID id){return tasks.findByPublicIdAndDeletedAtIsNull(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"TASK_NOT_FOUND","Calendar task not found."));}
    private void audit(UserEntity actor,String action,String type,UUID id,String details){
        KidsChampAuditEntity a=new KidsChampAuditEntity();a.setActor(actor);a.setAction(action);a.setEntityType(type);a.setEntityPublicId(id);a.setDetails(details);audits.save(a);
        Runnable publish=()->liveUpdates.publish(action,type,id);
        afterCommit(publish);
    }
    private void afterCommit(Runnable action){
        Runnable safe=()->{try{action.run();}catch(RuntimeException ignored){}};
        if(TransactionSynchronizationManager.isActualTransactionActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){safe.run();}});
        else safe.run();
    }
    private String newBatchCode(){String code;do{code="KCZIP-"+LocalDate.now().toString().replace("-","")+"-"+UUID.randomUUID().toString().substring(0,6).toUpperCase();}while(batches.existsByBatchCode(code));return code;}
    static String csv(String value){
        if(value==null)return "";
        String safe=value,leading=value.stripLeading();
        if(!leading.isEmpty()&&"=+-@".indexOf(leading.charAt(0))>=0)safe="'"+value;
        return "\""+safe.replace("\"","\"\"")+"\"";
    }
    static String zipPhotoName(int index,String childName,String hometown){return String.format("%03d_%s_%s.png",index,safeZipPart(childName),safeZipPart(hometown));}
    static void writePng(Path source,OutputStream target,String trackingCode) throws IOException{
        KidsChampStorage.writePng(source,target,trackingCode);
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
    public record BatchResponse(UUID id,String batchCode,String status,int photoCount,Instant firstDownloadedAt,Instant editedAt,Instant deleteAfter,long daysRemaining,LocalDate telecastDate,LocalDate alternateTelecastDate,Instant telecastCompletedAt,Instant createdAt,Instant deletedAt,List<UUID> submissionIds,boolean cleanupPending,int cleanupFailureCount,Instant lastCleanupAttemptAt,int warningDays,boolean expiringSoon){}
    public record ZipProgressResponse(long readyPhotos,int activeTargetSize,int nextTargetSize,Instant activeStartedAt){}
    public record Download(Path path,String filename,UUID batchId,UUID actorId){}
    public record Photo(Path path,String filename,String mediaType){}
    public record GuestResponse(UUID id,String parentName,String mobile,String email,String countryCode,String province,
        String hometown,int submissionCount,Instant firstSubmittedAt,Instant lastSubmittedAt){}
    public record DuplicateGuestResponse(UUID firstId,UUID secondId,String firstName,String secondName,String firstPhone,String secondPhone,String firstHometown,String secondHometown,int firstSubmissions,int secondSubmissions,List<String> reasons,String matchType){}
    public record ParticipantResponse(UUID id,String name,int age,String type,String location,String phone,long submissions,long approved,long telecasted,Instant joinedAt,Instant lastSubmissionAt,boolean whatsappConsented){}
    public record ApprovalResponse(int approvedCount,int alreadyApprovedCount){}
    public record SubmissionPageResponse(List<KidsChampAdminSubmissionResponse> items,int page,int size,long totalItems,int totalPages){}
    public record OverviewResponse(long totalSubmissions,long newToday,long pendingReviews,long approved,long selectedForTv,long telecasted,long uniqueParticipants,long activeBatches){}
    public enum ZipQueueCountPolicy { KEEP_CURRENT, APPLY_NEW }
    public record SettingsRequest(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage,ZipQueueCountPolicy zipQueueCountPolicy){
        public SettingsRequest(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage){this(categories,maxFileSizeMb,allowedFileTypes,minimumAge,maximumAge,dailyTelecastLimit,defaultTelecastTime,zipBatchSize,zipExpiryDays,zipWarningDays,frequentParticipantThreshold,requireWhatsAppConsent,campaignLimit,defaultMessage,null);}
    }
    public record SettingsResponse(List<String> categories,int maxFileSizeMb,String allowedFileTypes,int minimumAge,int maximumAge,int dailyTelecastLimit,LocalTime defaultTelecastTime,int zipBatchSize,int zipExpiryDays,int zipWarningDays,int frequentParticipantThreshold,boolean requireWhatsAppConsent,int campaignLimit,String defaultMessage,Instant updatedAt){
        static SettingsResponse from(KidsChampSettingsEntity e){return new SettingsResponse(Arrays.stream(e.getCategories().split(",")).map(String::trim).filter(v->!v.isEmpty()).toList(),e.getMaxFileSizeMb(),KidsChampStorage.ALLOWED_FILE_TYPES,e.getMinimumAge(),e.getMaximumAge(),e.getDailyTelecastLimit(),e.getDefaultTelecastTime(),e.getZipBatchSize(),e.getZipExpiryDays(),e.getZipWarningDays(),e.getFrequentParticipantThreshold(),e.isRequireWhatsAppConsent(),e.getCampaignLimit(),e.getDefaultMessage(),e.getUpdatedAt());}}
    public record CalendarTaskResponse(UUID id,LocalDate date,String title,String details,Instant completedAt,Instant createdAt){static CalendarTaskResponse from(KidsChampCalendarTaskEntity e){return new CalendarTaskResponse(e.getPublicId(),e.getTaskDate(),e.getTitle(),e.getDetails(),e.getCompletedAt(),e.getCreatedAt());}}
    public record ActivityResponse(String action,String entityType,UUID entityId,String details,String actor,Instant createdAt){}
    public record GrowthResponse(LocalDate date,long submissions,long participants){}
    public record CampaignResponse(UUID id,String channel,String status,int recipientCount,String messageTemplate,Instant createdAt){static CampaignResponse from(KidsChampMessageCampaignEntity e){return new CampaignResponse(e.getPublicId(),e.getChannel(),e.getStatus(),e.getRecipientCount(),e.getMessageTemplate(),e.getCreatedAt());}}
    public record MessageRecipientResponse(Long id,String name,String destination,String status,int attempts,String failureReason,Instant sentAt){static MessageRecipientResponse from(KidsChampMessageRecipientEntity e){return new MessageRecipientResponse(e.getId(),e.getParticipantName(),e.getDestination(),e.getStatus(),e.getAttempts(),e.getFailureReason(),e.getSentAt());}}
}
