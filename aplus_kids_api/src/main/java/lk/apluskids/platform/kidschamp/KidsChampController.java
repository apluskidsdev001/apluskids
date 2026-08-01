package lk.apluskids.platform.kidschamp;

import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/kids-champ")
public class KidsChampController {
    private final KidsChampService service;
    private final KidsChampLiveUpdates liveUpdates;
    public KidsChampController(KidsChampService service,KidsChampLiveUpdates liveUpdates) { this.service=service;this.liveUpdates=liveUpdates; }

    @GetMapping(path="/events",produces="text/event-stream") SseEmitter events(){return liveUpdates.connect();}

    @PostMapping(path="/submissions", consumes="multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    KidsChampResponse submit(
        JwtAuthenticationToken authentication,
        @RequestParam(defaultValue="false") boolean manualDetails,
        @RequestParam(required=false) UUID childId,
        @RequestParam(required=false) String childName,
        @RequestParam(required=false) LocalDate dateOfBirth,
        @RequestParam(required=false) String parentName,
        @RequestParam(required=false) String email,
        @RequestParam(required=false) String phone,
        @RequestParam(required=false) String countryCode,
        @RequestParam(required=false) String province,
        @RequestParam(required=false) String hometown,
        @RequestParam(required=false) String workTitle,
        @RequestParam(required=false) String workDescription,
        @RequestParam String category,
        @RequestParam boolean consent,
        @RequestParam(defaultValue="false") boolean whatsappConsent,
        @RequestPart MultipartFile photo
    ) {
        UUID userId = authentication == null || manualDetails ? null : UUID.fromString(authentication.getToken().getSubject());
        return service.submit(userId, childId, childName, dateOfBirth, parentName, email, phone,
            countryCode, province, hometown, category, workTitle, workDescription, consent, whatsappConsent, photo);
    }

    @GetMapping("/track/{trackingCode}")
    KidsChampResponse track(@PathVariable String trackingCode) { return service.track(trackingCode); }

    @GetMapping("/my-submissions")
    List<KidsChampResponse> mine(JwtAuthenticationToken authentication) {
        return service.profile(UUID.fromString(authentication.getToken().getSubject()));
    }
    @GetMapping("/claimable-history") List<KidsChampService.ClaimableGuestResponse> claimable(JwtAuthenticationToken authentication){return service.claimable(UUID.fromString(authentication.getToken().getSubject()));}
    @PostMapping("/claim-history") List<KidsChampResponse> claim(JwtAuthenticationToken authentication,@RequestBody ClaimRequest request){return service.claim(UUID.fromString(authentication.getToken().getSubject()),request.guestId(),request.childId());}
    record ClaimRequest(UUID guestId,UUID childId){}
}
