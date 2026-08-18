package lk.apluskids.platform.advertisement;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import lk.apluskids.platform.advertisement.AdvertisementService.*;
import lk.apluskids.platform.common.error.ApiException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AdvertisementController {
    private final AdvertisementService service;
    AdvertisementController(AdvertisementService service){this.service=service;}

    @GetMapping("/api/v1/advertisements/slots/{slot}") List<PublicAdvertisement> active(@PathVariable String slot){return service.active(slot);}
    @PostMapping("/api/v1/advertisements/{id}/impression") @ResponseStatus(HttpStatus.NO_CONTENT) void impression(@PathVariable UUID id){service.impression(id);}
    @GetMapping("/api/v1/advertisements/{id}/redirect") ResponseEntity<Void> redirect(@PathVariable UUID id){return ResponseEntity.status(HttpStatus.FOUND).location(service.click(id)).header(HttpHeaders.CACHE_CONTROL,"no-store").build();}
    @GetMapping("/api/v1/advertisements/{id}/assets/{variant}") ResponseEntity<FileSystemResource> asset(@PathVariable UUID id,@PathVariable String variant)throws IOException{var value=service.asset(id,variant);var body=new FileSystemResource(value.path());return ResponseEntity.ok().contentType(MediaType.parseMediaType(value.mediaType())).contentLength(body.contentLength()).cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic()).body(body);}

    @GetMapping("/api/v1/admin/advertisements") List<AdvertisementView> list(JwtAuthenticationToken auth){admin(auth);return service.list();}
    @GetMapping("/api/v1/admin/advertisements/history") List<AuditView> history(JwtAuthenticationToken auth){admin(auth);return service.history();}
    @GetMapping("/api/v1/admin/advertisements/analytics") AnalyticsResponse analytics(JwtAuthenticationToken auth,@RequestParam(required=false)UUID id,@RequestParam(defaultValue="30")int days,@RequestParam(required=false)LocalDate from,@RequestParam(required=false)LocalDate to){admin(auth);return from==null&&to==null?service.analytics(id,days):service.analytics(id,from,to);}
    @PostMapping("/api/v1/admin/advertisements") @ResponseStatus(HttpStatus.CREATED) AdvertisementView create(JwtAuthenticationToken auth,@RequestBody AdvertisementRequest request){admin(auth);return service.create(subject(auth),request);}
    @PutMapping("/api/v1/admin/advertisements/{id}") AdvertisementView update(JwtAuthenticationToken auth,@PathVariable UUID id,@RequestBody AdvertisementRequest request){admin(auth);return service.update(subject(auth),id,request);}
    @PostMapping(value="/api/v1/admin/advertisements/{id}/assets/{variant}",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) AdvertisementView upload(JwtAuthenticationToken auth,@PathVariable UUID id,@PathVariable String variant,@RequestPart("file")MultipartFile file){admin(auth);return service.upload(subject(auth),id,variant,file);}
    @PostMapping("/api/v1/admin/advertisements/{id}/status") AdvertisementView status(JwtAuthenticationToken auth,@PathVariable UUID id,@RequestBody StatusRequest request){if(Set.of("ACTIVE","ARCHIVED").contains(Optional.ofNullable(request.status()).orElse("").toUpperCase(Locale.ROOT)))superAdmin(auth);else admin(auth);return service.status(subject(auth),id,request.status());}
    @DeleteMapping("/api/v1/admin/advertisements/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(JwtAuthenticationToken auth,@PathVariable UUID id){superAdmin(auth);service.delete(subject(auth),id);}
    private UUID subject(JwtAuthenticationToken auth){return UUID.fromString(auth.getToken().getSubject());}
    private void admin(JwtAuthenticationToken auth){List<String> roles=auth.getToken().getClaimAsStringList("roles");if(roles==null||roles.stream().noneMatch(role->role.equals("ROLE_ADMIN")||role.equals("ROLE_SUPER_ADMIN")))throw new ApiException(HttpStatus.FORBIDDEN,"ADMIN_REQUIRED","Administrator access is required.");}
    private void superAdmin(JwtAuthenticationToken auth){List<String> roles=auth.getToken().getClaimAsStringList("roles");if(roles==null||roles.stream().noneMatch("ROLE_SUPER_ADMIN"::equals))throw new ApiException(HttpStatus.FORBIDDEN,"SUPER_ADMIN_REQUIRED","Super Admin approval is required to publish, archive or delete advertisements.");}
    record StatusRequest(String status){}
}
