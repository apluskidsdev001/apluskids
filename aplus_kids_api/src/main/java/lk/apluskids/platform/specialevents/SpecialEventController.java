package lk.apluskids.platform.specialevents;

import java.io.IOException;
import java.util.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.specialevents.SpecialEventService.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class SpecialEventController {
    private final SpecialEventService service;
    SpecialEventController(SpecialEventService service) { this.service = service; }
    @GetMapping("/api/v1/special-events") List<EventView> publicEvents() { return service.publicEvents(); }
    @GetMapping("/api/v1/special-events/{id}/cover") ResponseEntity<FileSystemResource> cover(@PathVariable UUID id) throws IOException { Asset asset = service.cover(id); FileSystemResource body = new FileSystemResource(asset.path()); return ResponseEntity.ok().contentType(MediaType.parseMediaType(asset.mediaType())).contentLength(body.contentLength()).cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic()).body(body); }
    @GetMapping("/api/v1/admin/special-events") List<EventView> list(JwtAuthenticationToken auth) { admin(auth); return service.adminEvents(); }
    @PostMapping("/api/v1/admin/special-events") @ResponseStatus(HttpStatus.CREATED) EventView create(JwtAuthenticationToken auth, @RequestBody EventRequest request) { admin(auth); return service.create(request); }
    @PutMapping("/api/v1/admin/special-events/{id}") EventView update(JwtAuthenticationToken auth, @PathVariable UUID id, @RequestBody EventRequest request) { admin(auth); return service.update(id, request); }
    @PostMapping(value = "/api/v1/admin/special-events/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) EventView upload(JwtAuthenticationToken auth, @PathVariable UUID id, @RequestPart("file") MultipartFile file) { admin(auth); return service.uploadCover(id, file); }
    @DeleteMapping("/api/v1/admin/special-events/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(JwtAuthenticationToken auth, @PathVariable UUID id) { admin(auth); service.delete(id); }
    private void admin(JwtAuthenticationToken auth) { List<String> roles = auth.getToken().getClaimAsStringList("roles"); if (roles == null || roles.stream().noneMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_SUPER_ADMIN"))) throw new ApiException(HttpStatus.FORBIDDEN, "ADMIN_REQUIRED", "Administrator access is required."); }
}
