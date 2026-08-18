package lk.apluskids.platform.kidschamp;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/admin/kids-champ")
public class KidsChampAdminController {
    private final KidsChampAdminService service;
    private final KidsChampLiveUpdates liveUpdates;
    private final KidsChampWhatsAppAdminService whatsapp;
    private final KidsChampWhatsAppTemplateService whatsappTemplates;
    private final KidsChampWhatsAppDeliveryService whatsappDelivery;
    KidsChampAdminController(KidsChampAdminService service,KidsChampLiveUpdates liveUpdates,KidsChampWhatsAppAdminService whatsapp,KidsChampWhatsAppTemplateService whatsappTemplates,KidsChampWhatsAppDeliveryService whatsappDelivery){this.service=service;this.liveUpdates=liveUpdates;this.whatsapp=whatsapp;this.whatsappTemplates=whatsappTemplates;this.whatsappDelivery=whatsappDelivery;}
    @GetMapping(path="/events",produces=MediaType.TEXT_EVENT_STREAM_VALUE) SseEmitter events(JwtAuthenticationToken a){admin(a);return liveUpdates.connectAdmin();}
    @GetMapping("/submissions") List<KidsChampAdminSubmissionResponse> submissions(JwtAuthenticationToken a){admin(a);return service.submissions();}
    @GetMapping("/submissions/page") KidsChampAdminService.SubmissionPageResponse submissionsPage(JwtAuthenticationToken a,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size,@RequestParam(required=false) String search,@RequestParam(required=false) String approval,@RequestParam(required=false) String location,@RequestParam(required=false) String category,@RequestParam(required=false) Integer minAge,@RequestParam(required=false) Integer maxAge,@RequestParam(required=false) LocalDate dateFrom,@RequestParam(required=false) LocalDate dateTo){admin(a);return service.submissionsPage(page,size,search,approval,location,category,minAge,maxAge,dateFrom,dateTo);}
    @GetMapping("/guests") List<KidsChampAdminService.GuestResponse> guests(JwtAuthenticationToken a){admin(a);return service.guests();}
    @GetMapping("/guests/duplicates") List<KidsChampAdminService.DuplicateGuestResponse> duplicateGuests(JwtAuthenticationToken a){admin(a);return service.duplicateGuests();}
    @GetMapping("/guests/registered-matches") List<KidsChampAdminService.DuplicateGuestResponse> registeredGuestMatches(JwtAuthenticationToken a){admin(a);return service.registeredGuestMatches();}
    @GetMapping("/guests/duplicate-matches") List<KidsChampAdminService.DuplicateGuestResponse> duplicateMatches(JwtAuthenticationToken a){admin(a);return service.duplicateMatches();}
    @PostMapping("/guests/merge") KidsChampAdminService.ParticipantMergeResponse mergeGuests(JwtAuthenticationToken a,@RequestBody MergeGuestsRequest r){admin(a);return service.mergeGuests(subject(a),r.targetId(),r.sourceId(),r.reason(),r.matchingReasons());}
    @PostMapping("/guests/merge-registered") KidsChampAdminService.ParticipantMergeResponse mergeRegisteredGuest(JwtAuthenticationToken a,@RequestBody MergeRegisteredGuestRequest r){admin(a);return service.mergeGuestIntoRegistered(subject(a),r.childId(),r.guestId(),"GUEST_MERGED_INTO_REGISTERED",r.reason(),r.matchingReasons());}
    @PostMapping("/guests/delete-registered-duplicate") KidsChampAdminService.ParticipantMergeResponse deleteRegisteredDuplicate(JwtAuthenticationToken a,@RequestBody MergeRegisteredGuestRequest r){admin(a);return service.mergeGuestIntoRegistered(subject(a),r.childId(),r.guestId(),"REGISTERED_GUEST_DUPLICATE_MERGED",r.reason(),r.matchingReasons());}
    @PostMapping("/guests/delete-duplicate") KidsChampAdminService.ParticipantMergeResponse deleteDuplicateGuest(JwtAuthenticationToken a,@RequestBody DeleteDuplicateGuestRequest r){admin(a);return service.deleteDuplicateGuest(subject(a),r.keepId(),r.duplicateId(),r.reason(),r.matchingReasons());}
    @PostMapping("/guests/ignore-match") @ResponseStatus(HttpStatus.NO_CONTENT) void ignoreGuestMatch(JwtAuthenticationToken a,@RequestBody IgnoreGuestMatchRequest r){admin(a);service.ignoreGuestMatch(subject(a),r.firstId(),r.secondId());}
    @GetMapping("/participants") List<KidsChampAdminService.ParticipantResponse> participants(JwtAuthenticationToken a){admin(a);return service.participants();}
    @PatchMapping("/participants/{id}") KidsChampAdminService.ParticipantResponse updateParticipant(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody ParticipantUpdateRequest r){admin(a);return service.updateParticipant(subject(a),id,r.name(),r.dateOfBirth(),r.hometown(),r.phone());}
    @GetMapping("/participant-merges") List<KidsChampAdminService.ParticipantMergeResponse> participantMergeHistory(JwtAuthenticationToken a){admin(a);return service.participantMergeHistory();}
    @PostMapping("/participant-merges/{id}/undo") KidsChampAdminService.ParticipantMergeResponse undoParticipantMerge(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody UndoMergeRequest r){admin(a);return service.undoParticipantMerge(subject(a),id,r.reason());}
    @PatchMapping("/whatsapp/preferences/{id}") KidsChampAdminService.WhatsAppPreferenceResponse updateWhatsAppPreference(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody WhatsAppPreferenceRequest r){admin(a);return service.updateWhatsAppPreference(subject(a),id,r.status(),r.reason());}
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
    @PostMapping("/campaigns") @ResponseStatus(HttpStatus.CREATED) KidsChampAdminService.CampaignResponse createCampaign(JwtAuthenticationToken a,@RequestBody CampaignRequest r){admin(a);if("WHATSAPP".equalsIgnoreCase(r.channel())){whatsapp.requireActive();var template=whatsappTemplates.requireApproved(r.templateId(),r.templateParameters());return service.createCampaign(subject(a),"WHATSAPP",template.body(),r.participantIds(),template.name(),template.languageCode(),template.parameters(),r.name(),r.source());}return service.createCampaign(subject(a),r.channel(),r.messageTemplate(),r.participantIds(),r.templateName(),r.languageCode(),r.templateParameters(),r.name(),r.source());}
    @GetMapping("/campaigns/{id}/recipients") List<KidsChampAdminService.MessageRecipientResponse> campaignRecipients(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);return service.campaignRecipients(id);}
    @PostMapping("/campaign-recipients/retry") @ResponseStatus(HttpStatus.NO_CONTENT) void retryRecipients(JwtAuthenticationToken a,@RequestBody RecipientActionRequest r){admin(a);service.retryRecipients(subject(a),r.recipientIds());}
    @PostMapping("/campaign-recipients/ignore") @ResponseStatus(HttpStatus.NO_CONTENT) void ignoreRecipients(JwtAuthenticationToken a,@RequestBody RecipientActionRequest r){admin(a);service.ignoreRecipients(subject(a),r.recipientIds());}
    @PostMapping("/campaign-recipients/delete") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteRecipients(JwtAuthenticationToken a,@RequestBody RecipientActionRequest r){admin(a);service.deleteRecipients(subject(a),r.recipientIds());}
    @GetMapping("/campaign-recipients/{id}/events") List<KidsChampWhatsAppDeliveryService.DeliveryEventResponse> recipientEvents(JwtAuthenticationToken a,@PathVariable Long id){admin(a);return whatsappDelivery.events(id);}
    @GetMapping("/whatsapp/config") KidsChampWhatsAppAdminService.ConfigResponse whatsappConfig(JwtAuthenticationToken a){superAdmin(a);return whatsapp.config();}
    @PutMapping("/whatsapp/config") KidsChampWhatsAppAdminService.ConfigResponse saveWhatsappConfig(JwtAuthenticationToken a,@RequestBody KidsChampWhatsAppAdminService.ConfigRequest r){superAdmin(a);var saved=whatsapp.save(r);service.auditAdministratorAction(subject(a),"WHATSAPP_CREDENTIALS_UPDATED","WHATSAPP_CONFIG",UUID.nameUUIDFromBytes("kids-champ-whatsapp".getBytes()),"WhatsApp Cloud API credentials were updated.");return saved;}
    @PostMapping("/whatsapp/connection-test") KidsChampWhatsAppAdminService.ConnectionTestResponse testWhatsappConnection(JwtAuthenticationToken a){superAdmin(a);var result=whatsapp.connectionTest();service.auditAdministratorAction(subject(a),"WHATSAPP_CONNECTION_TESTED","WHATSAPP_CONFIG",UUID.nameUUIDFromBytes("kids-champ-whatsapp".getBytes()),result.message());return result;}
    @GetMapping("/whatsapp/readiness") KidsChampWhatsAppTemplateService.ReadinessResponse whatsappReadiness(JwtAuthenticationToken a){admin(a);return whatsappTemplates.readiness();}
    @GetMapping("/whatsapp/templates") List<KidsChampWhatsAppTemplateService.TemplateResponse> whatsappTemplates(JwtAuthenticationToken a){admin(a);return whatsappTemplates.list();}
    @PostMapping("/whatsapp/templates/sync") List<KidsChampWhatsAppTemplateService.TemplateResponse> syncWhatsappTemplates(JwtAuthenticationToken a){superAdmin(a);var values=whatsappTemplates.synchronize();service.auditAdministratorAction(subject(a),"WHATSAPP_TEMPLATES_SYNCHRONIZED","WHATSAPP_TEMPLATE",UUID.nameUUIDFromBytes("kids-champ-whatsapp-templates".getBytes()),values.size()+" templates synchronized from Meta.");return values;}
    @PatchMapping("/whatsapp/templates/{id}") KidsChampWhatsAppTemplateService.TemplateResponse updateWhatsappTemplate(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody TemplateToggleRequest r){superAdmin(a);var value=whatsappTemplates.setDisabled(id,r.disabled());service.auditAdministratorAction(subject(a),r.disabled()?"WHATSAPP_TEMPLATE_DISABLED":"WHATSAPP_TEMPLATE_ENABLED","WHATSAPP_TEMPLATE",id,value.name());return value;}
    @PostMapping("/whatsapp/test") KidsChampWhatsAppAdminService.TestResponse testWhatsapp(JwtAuthenticationToken a,@RequestBody WhatsAppTestRequest r){superAdmin(a);var template=whatsappTemplates.requireApproved(r.templateId(),r.templateParameters());var result=whatsapp.testTemplate(r.phone(),template.name(),template.languageCode(),template.parameters());service.auditAdministratorAction(subject(a),"WHATSAPP_TEST_MESSAGE_SENT","WHATSAPP_CONFIG",UUID.nameUUIDFromBytes("kids-champ-whatsapp".getBytes()),result.message());return result;}
    @GetMapping("/admin-history") List<KidsChampAdminService.ActivityResponse> adminHistory(JwtAuthenticationToken a){superAdmin(a);return service.activity();}
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
    @PostMapping("/batches/selected/split") @ResponseStatus(HttpStatus.CREATED) List<KidsChampAdminService.BatchResponse> splitSelectedBatches(JwtAuthenticationToken a,@RequestBody SelectedBatchRequest r){admin(a);return service.createSelectedBatches(subject(a),r.submissionIds(),r.reason());}
    @PostMapping("/batches/process-automatic") @ResponseStatus(HttpStatus.NO_CONTENT) void processAutomaticBatches(JwtAuthenticationToken a){admin(a);service.processAutomaticZips(subject(a));}
    @GetMapping("/batches") List<KidsChampAdminService.BatchResponse> batches(JwtAuthenticationToken a){admin(a);return service.batches();}
    @GetMapping("/batches/progress") KidsChampAdminService.ZipProgressResponse zipProgress(JwtAuthenticationToken a){admin(a);return service.zipProgress();}
    @GetMapping("/batches/{id}/download") ResponseEntity<StreamingResponseBody> download(JwtAuthenticationToken a,@PathVariable UUID id) throws IOException{
        admin(a);var value=service.download(subject(a),id);
        try{
            long size=java.nio.file.Files.size(value.path());
            StreamingResponseBody body=output->{
                try(var input=java.nio.file.Files.newInputStream(value.path())){input.transferTo(output);output.flush();service.completeDownload(value);}
                finally{service.releaseDownload(value);}
            };
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(value.filename()).build().toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM).contentLength(size).body(body);
        }catch(IOException|RuntimeException exception){service.releaseDownload(value);throw exception;}
    }
    @PatchMapping("/batches/{id}/schedule") KidsChampAdminService.BatchResponse schedule(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody ScheduleRequest r){admin(a);return service.schedule(subject(a),id,r.telecastDate(),r.alternateTelecastDate());}
    @PostMapping("/batches/{id}/telecast-complete") KidsChampAdminService.BatchResponse completeTelecast(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);return service.completeTelecast(subject(a),id);}
    @PatchMapping("/batches/{id}/edited") KidsChampAdminService.BatchResponse edited(JwtAuthenticationToken a,@PathVariable UUID id,@RequestBody EditedRequest r){admin(a);return service.setEdited(subject(a),id,r.edited());}
    @DeleteMapping("/batches/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void deleteBatch(JwtAuthenticationToken a,@PathVariable UUID id){admin(a);service.deleteBatch(subject(a),id);}
    @DeleteMapping("/batches/bin") @ResponseStatus(HttpStatus.NO_CONTENT) void clearBatchBin(JwtAuthenticationToken a,@RequestBody BatchIdsRequest r){admin(a);service.clearBatchBin(subject(a),r.batchIds());}
    private UUID subject(JwtAuthenticationToken a){return UUID.fromString(a.getToken().getSubject());}
    private void admin(JwtAuthenticationToken a){
        List<String> roles=a.getToken().getClaimAsStringList("roles");
        if(roles==null||roles.stream().noneMatch(r->r.equals("ROLE_ADMIN")||r.equals("ROLE_SUPER_ADMIN")))
            throw new lk.apluskids.platform.common.error.ApiException(HttpStatus.FORBIDDEN,"ADMIN_REQUIRED","Administrator access is required.");
    }
    private void superAdmin(JwtAuthenticationToken a){
        List<String> roles=a.getToken().getClaimAsStringList("roles");
        if(roles==null||roles.stream().noneMatch("ROLE_SUPER_ADMIN"::equals))
            throw new lk.apluskids.platform.common.error.ApiException(HttpStatus.FORBIDDEN,"SUPER_ADMIN_REQUIRED","Super Admin access is required for administrator accounts, credentials, and history.");
    }
    record ReviewRequest(ReviewStatus status,String reason){} record BatchRequest(int limit,boolean includeRemainder){}
    record UpdateRequest(String category,String internalNote,UUID reviewerId,Boolean selectedForTv){}
    record SelectedBatchRequest(List<UUID> submissionIds,String reason){}
    record ApproveSubmissionsRequest(List<UUID> submissionIds){}
    record ScheduleRequest(LocalDate telecastDate,LocalDate alternateTelecastDate){}
    record EditedRequest(boolean edited){}
    record BatchIdsRequest(List<UUID> batchIds){}
    record TaskRequest(LocalDate date,String title,String details){} record TaskStatusRequest(boolean completed){} record TaskRescheduleRequest(LocalDate date){}
    record PreviewRequest(boolean previewed){}
    record MergeGuestsRequest(UUID targetId,UUID sourceId,String reason,List<String> matchingReasons){}
    record MergeRegisteredGuestRequest(UUID childId,UUID guestId,String reason,List<String> matchingReasons){}
    record DeleteDuplicateGuestRequest(UUID keepId,UUID duplicateId,String reason,List<String> matchingReasons){}
    record IgnoreGuestMatchRequest(UUID firstId,UUID secondId){}
    record ParticipantUpdateRequest(String name,LocalDate dateOfBirth,String hometown,String phone){}
    record UndoMergeRequest(String reason){}
    record WhatsAppPreferenceRequest(String status,String reason){}
    record CampaignRequest(String channel,String messageTemplate,List<UUID> participantIds,UUID templateId,String templateName,String languageCode,List<String> templateParameters,String name,String source){}
    record RecipientActionRequest(List<Long> recipientIds){}
    record WhatsAppTestRequest(String phone,UUID templateId,List<String> templateParameters){}
    record TemplateToggleRequest(boolean disabled){}
}
