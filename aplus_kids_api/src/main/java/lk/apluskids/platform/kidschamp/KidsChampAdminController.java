package lk.apluskids.platform.kidschamp;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/admin/kids-champ")
public class KidsChampAdminController {
    private final KidsChampAdminService service;
    private final KidsChampLiveUpdates liveUpdates;
    private final KidsChampWhatsAppAdminService whatsapp;
    KidsChampAdminController(KidsChampAdminService service,KidsChampLiveUpdates liveUpdates,KidsChampWhatsAppAdminService whatsapp){this.service=service;this.liveUpdates=liveUpdates;this.whatsapp=whatsapp;}
    @GetMapping(path="/events",produces=MediaType.TEXT_EVENT_STREAM_VALUE) SseEmitter events(JwtAuthenticationToken a){admin(a);return liveUpdates.connect();}
    @GetMapping("/submissions") List<KidsChampAdminSubmissionResponse> submissions(JwtAuthenticationToken a){admin(a);return service.submissions();}
    @GetMapping("/submissions/page") KidsChampAdminService.SubmissionPageResponse submissionsPage(JwtAuthenticationToken a,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size,@RequestParam(required=false) String search,@RequestParam(required=false) String approval,@RequestParam(required=false) String location,@RequestParam(required=false) String category,@RequestParam(required=false) Integer minAge,@RequestParam(required=false) Integer maxAge,@RequestParam(required=false) LocalDate dateFrom,@RequestParam(required=false) LocalDate dateTo){admin(a);return service.submissionsPage(page,size,search,approval,location,category,minAge,maxAge,dateFrom,dateTo);}
    @GetMapping("/guests") List<KidsChampAdminService.GuestResponse> guests(JwtAuthenticationToken a){admin(a);return service.guests();}
    @GetMapping("/guests/duplicates") List<KidsChampAdminService.DuplicateGuestResponse> duplicateGuests(JwtAuthenticationToken a){admin(a);return service.duplicateGuests();}
    @GetMapping("/guests/registered-matches") List<KidsChampAdminService.DuplicateGuestResponse> registeredGuestMatches(JwtAuthenticationToken a){admin(a);return service.registeredGuestMatches();}
    @PostMapping("/guests/merge") @ResponseStatus(HttpStatus.NO_CONTENT) void mergeGuests(JwtAuthenticationToken a,@RequestBody MergeGuestsRequest r){admin(a);service.mergeGuests(subject(a),r.targetId(),r.sourceId());}
    @PostMapping("/guests/merge-registered") @ResponseStatus(HttpStatus.NO_CONTENT) void mergeRegisteredGuest(JwtAuthenticationToken a,@RequestBody MergeRegisteredGuestRequest r){admin(a);service.mergeGuestIntoRegistered(subject(a),r.childId(),r.guestId(),"GUEST_MERGED_INTO_REGISTERED");}
    @PostMapping("/guests/delete-registered-duplicate") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteRegisteredDuplicate(JwtAuthenticationToken a,@RequestBody MergeRegisteredGuestRequest r){admin(a);service.mergeGuestIntoRegistered(subject(a),r.childId(),r.guestId(),"REGISTERED_GUEST_DUPLICATE_DELETED");}
    @PostMapping("/guests/delete-duplicate") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteDuplicateGuest(JwtAuthenticationToken a,@RequestBody DeleteDuplicateGuestRequest r){admin(a);service.deleteDuplicateGuest(subject(a),r.keepId(),r.duplicateId());}
    @PostMapping("/guests/ignore-match") @ResponseStatus(HttpStatus.NO_CONTENT) void ignoreGuestMatch(JwtAuthenticationToken a,@RequestBody IgnoreGuestMatchRequest r){admin(a);service.ignoreGuestMatch(subject(a),r.firstId(),r.secondId());}
    @GetMapping("/participants") List<KidsChampAdminService.ParticipantResponse> participants(JwtAuthenticationToken a){admin(a);return service.participants();}
    @GetMapping("/overview") KidsChampAdminService.OverviewResponse overview(JwtAuthenticationToken a){admin(a);return service.overview();}
    @GetMapping("/growth") List<KidsChampAdminService.GrowthResponse> growth(JwtAuthenticationToken a){admin(a);return service.growth();}
    @GetMapping("/activity") List<KidsChampAdminService.ActivityResponse> activity(JwtAuthenticationToken a){admin(a);return service.activity();}
    @GetMapping("/settings") KidsChampAdminService.SettingsResponse settings(JwtAuthenticationToken a){admin(a);return service.settings();}
    @PutMapping("/settings") KidsChampAdminService.SettingsResponse updateSettings(JwtAuthenticationToken a,@RequestBody KidsChampAdminService.SettingsRequest r){admin(a);return service.updateSettings(subject(a),r);}
    @GetMapping("/calendar/tasks") List<KidsChampAdminService.CalendarTaskResponse> tasks(JwtAuthenticationToken a){admin(a);return service.calendarTasks();}
    @PostMapping("/calendar/tasks") @ResponseStatus(HttpStatus.CREATED) KidsChampAdminService.CalendarTaskResponse createTask(JwtAuthenticationToken a,@RequestBody TaskRequest r){admin(a);return service.createTask(subject(a),r.date(),r.title(),r.details());}
    @PatchMapping("/calendar/tasks/{id}") KidsChampAdminService.CalendarTaskResponse completeTask(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody TaskStatusRequest r){admin(a);return service.completeTask(subject(a),id,r.completed());}
    @PostMapping("/calendar/tasks/{id}/reschedule") KidsChampAdminService.CalendarTaskResponse rescheduleTask(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody TaskRescheduleRequest r){admin(a);return service.rescheduleTask(subject(a),id,r.date());}
    @DeleteMapping("/calendar/tasks/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteTask(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);service.deleteTask(subject(a),id);}
    @GetMapping("/campaigns") List<KidsChampAdminService.CampaignResponse> campaigns(JwtAuthenticationToken a){admin(a);return service.campaigns();}
    @PostMapping("/campaigns") @ResponseStatus(HttpStatus.CREATED) KidsChampAdminService.CampaignResponse createCampaign(JwtAuthenticationToken a,@RequestBody CampaignRequest r){admin(a);return service.createCampaign(subject(a),r.channel(),r.messageTemplate(),r.participantIds(),r.templateName(),r.languageCode(),r.templateParameters());}
    @GetMapping("/campaigns/{id}/recipients") List<KidsChampAdminService.MessageRecipientResponse> campaignRecipients(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);return service.campaignRecipients(id);}
    @PostMapping("/campaign-recipients/retry") @ResponseStatus(HttpStatus.NO_CONTENT) void retryRecipients(JwtAuthenticationToken a,@RequestBody RecipientActionRequest r){admin(a);service.retryRecipients(subject(a),r.recipientIds());}
    @PostMapping("/campaign-recipients/ignore") @ResponseStatus(HttpStatus.NO_CONTENT) void ignoreRecipients(JwtAuthenticationToken a,@RequestBody RecipientActionRequest r){admin(a);service.ignoreRecipients(subject(a),r.recipientIds());}
    @PostMapping("/campaign-recipients/delete") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteRecipients(JwtAuthenticationToken a,@RequestBody RecipientActionRequest r){admin(a);service.deleteRecipients(subject(a),r.recipientIds());}
    @GetMapping("/whatsapp/config") KidsChampWhatsAppAdminService.ConfigResponse whatsappConfig(JwtAuthenticationToken a){admin(a);return whatsapp.config();}
    @PutMapping("/whatsapp/config") KidsChampWhatsAppAdminService.ConfigResponse saveWhatsappConfig(JwtAuthenticationToken a,@RequestBody KidsChampWhatsAppAdminService.ConfigRequest r){admin(a);return whatsapp.save(r);}
    @PostMapping("/whatsapp/test") KidsChampWhatsAppAdminService.TestResponse testWhatsapp(JwtAuthenticationToken a,@RequestBody WhatsAppTestRequest r){admin(a);return whatsapp.test(r.phone());}
    @PatchMapping("/submissions/{id}/review") KidsChampAdminSubmissionResponse review(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody ReviewRequest r){admin(a);return service.review(subject(a),id,r.status(),r.reason());}
    @PostMapping("/submissions/approve") KidsChampAdminService.ApprovalResponse approve(JwtAuthenticationToken a,@RequestBody ApproveSubmissionsRequest r){admin(a);return service.approve(subject(a),r.submissionIds());}
    @PatchMapping("/submissions/{id}") KidsChampAdminSubmissionResponse update(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody UpdateRequest r){admin(a);return service.update(subject(a),id,r.category(),r.internalNote(),r.reviewerId(),r.selectedForTv());}
    @GetMapping("/submissions/{id}/photo") ResponseEntity<Resource> photo(JwtAuthenticationToken a,@PathVariable UUID id) throws IOException{
        admin(a);var value=service.photo(id);return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.inline().filename(value.filename()).build().toString())
            .contentType(MediaType.parseMediaType(value.mediaType())).contentLength(java.nio.file.Files.size(value.path()))
            .body(new FileSystemResource(value.path()));
    }
    @DeleteMapping("/submissions/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteSubmission(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);service.deleteSubmission(subject(a),id);}
    @DeleteMapping("/submissions/{id}/photo") @ResponseStatus(HttpStatus.NO_CONTENT) void deletePhoto(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);service.deletePhoto(subject(a),id);}
    @PatchMapping("/submissions/{id}/preview") KidsChampAdminSubmissionResponse preview(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody PreviewRequest r){admin(a);return service.preview(subject(a),id,r.previewed());}
    @PostMapping("/batches") @ResponseStatus(HttpStatus.CREATED) KidsChampAdminService.BatchResponse batch(JwtAuthenticationToken a,@RequestBody BatchRequest r){admin(a);return service.createBatch(subject(a),r.limit(),r.includeRemainder());}
    @PostMapping("/batches/selected") @ResponseStatus(HttpStatus.CREATED) KidsChampAdminService.BatchResponse selectedBatch(JwtAuthenticationToken a,@RequestBody SelectedBatchRequest r){admin(a);return service.createSelectedBatch(subject(a),r.submissionIds(),r.reason());}
    @GetMapping("/batches") List<KidsChampAdminService.BatchResponse> batches(JwtAuthenticationToken a){admin(a);return service.batches();}
    @GetMapping("/batches/progress") KidsChampAdminService.ZipProgressResponse zipProgress(JwtAuthenticationToken a){admin(a);return service.zipProgress();}
    @GetMapping("/batches/{id}/download") ResponseEntity<Resource> download(JwtAuthenticationToken a,@PathVariable UUID id) throws IOException{
        admin(a);var value=service.download(subject(a),id);return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(value.filename()).build().toString())
            .contentType(MediaType.APPLICATION_OCTET_STREAM).contentLength(java.nio.file.Files.size(value.path()))
            .body(new FileSystemResource(value.path()));
    }
    @PatchMapping("/batches/{id}/schedule") KidsChampAdminService.BatchResponse schedule(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody ScheduleRequest r){admin(a);return service.schedule(subject(a),id,r.telecastDate(),r.alternateTelecastDate());}
    @PostMapping("/batches/{id}/telecast-complete") KidsChampAdminService.BatchResponse completeTelecast(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);return service.completeTelecast(subject(a),id);}
    @PatchMapping("/batches/{id}/edited") KidsChampAdminService.BatchResponse edited(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody EditedRequest r){admin(a);return service.setEdited(subject(a),id,r.edited());}
    @DeleteMapping("/batches/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteBatch(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);service.deleteBatch(subject(a),id);}
    private UUID subject(JwtAuthenticationToken a){return UUID.fromString(a.getToken().getSubject());}
    private void admin(JwtAuthenticationToken a){
        List<String> roles=a.getToken().getClaimAsStringList("roles");
        if(roles==null||roles.stream().noneMatch(r->r.equals("ROLE_ADMIN")||r.equals("ROLE_SUPER_ADMIN")))
            throw new lk.apluskids.platform.common.error.ApiException(HttpStatus.FORBIDDEN,"ADMIN_REQUIRED","Administrator access is required.");
    }
    record ReviewRequest(ReviewStatus status,String reason){} record BatchRequest(int limit,boolean includeRemainder){}
    record UpdateRequest(String category,String internalNote,UUID reviewerId,Boolean selectedForTv){}
    record SelectedBatchRequest(List<UUID> submissionIds,String reason){}
    record ApproveSubmissionsRequest(List<UUID> submissionIds){}
    record ScheduleRequest(LocalDate telecastDate,LocalDate alternateTelecastDate){}
    record EditedRequest(boolean edited){}
    record TaskRequest(LocalDate date,String title,String details){} record TaskStatusRequest(boolean completed){} record TaskRescheduleRequest(LocalDate date){}
    record PreviewRequest(boolean previewed){}
    record MergeGuestsRequest(UUID targetId,UUID sourceId){}
    record MergeRegisteredGuestRequest(UUID childId,UUID guestId){}
    record DeleteDuplicateGuestRequest(UUID keepId,UUID duplicateId){}
    record IgnoreGuestMatchRequest(UUID firstId,UUID secondId){}
    record CampaignRequest(String channel,String messageTemplate,List<UUID> participantIds,String templateName,String languageCode,List<String> templateParameters){}
    record RecipientActionRequest(List<Long> recipientIds){}
    record WhatsAppTestRequest(String phone){}
}
