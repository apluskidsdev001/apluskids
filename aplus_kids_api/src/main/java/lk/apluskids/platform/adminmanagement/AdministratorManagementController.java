package lk.apluskids.platform.adminmanagement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import lk.apluskids.platform.adminmanagement.AdministratorManagementService.*;
import org.springframework.http.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
public class AdministratorManagementController {
    private final AdministratorManagementService service;
    public AdministratorManagementController(AdministratorManagementService service) { this.service = service; }

    @GetMapping("/api/v1/admin/administrator-management/summary")
    AdministratorSummary summary(JwtAuthenticationToken auth) { return service.summary(subject(auth)); }

    @GetMapping("/api/v1/admin/administrator-management")
    List<AdministratorView> list(JwtAuthenticationToken auth, @RequestParam(required = false) String search,
        @RequestParam(required = false) AdministratorMembershipStatus status, @RequestParam(required = false) AdministratorRole role) {
        return service.list(subject(auth), search, status, role);
    }

    @PostMapping("/api/v1/admin/administrator-management/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    AdministratorView invite(JwtAuthenticationToken auth, @Valid @RequestBody InviteRequest request) {
        return service.invite(subject(auth), new InviteAdministratorRequest(request.name(), request.email(), request.phone(), request.role(), request.reason()));
    }

    @PatchMapping("/api/v1/admin/administrator-management/{id}")
    AdministratorView update(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody UpdateRequest request) {
        return service.update(subject(auth), id, new UpdateAdministratorRequest(request.name(), request.phone()));
    }

    @PatchMapping("/api/v1/admin/administrator-management/{id}/role")
    AdministratorView role(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody RoleRequest request) {
        return service.changeRole(subject(auth), id, new ChangeAdministratorRoleRequest(request.role(), request.reason()));
    }

    @PostMapping("/api/v1/admin/administrator-management/{id}/suspend")
    AdministratorView suspend(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody ActionRequest request) { return service.suspend(subject(auth), id, new ReasonRequest(request.reason())); }
    @PostMapping("/api/v1/admin/administrator-management/{id}/restore")
    AdministratorView restore(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody ActionRequest request) { return service.restore(subject(auth), id, new ReasonRequest(request.reason())); }
    @PostMapping("/api/v1/admin/administrator-management/{id}/cancel")
    AdministratorView cancel(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody ActionRequest request) { return service.cancel(subject(auth), id, new ReasonRequest(request.reason())); }
    @PostMapping("/api/v1/admin/administrator-management/{id}/remove")
    AdministratorView remove(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody ActionRequest request) { return service.remove(subject(auth), id, new ReasonRequest(request.reason())); }

    @PostMapping("/api/v1/admin/administrator-management/{id}/revoke-sessions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void revokeSessions(JwtAuthenticationToken auth, @PathVariable UUID id, @Valid @RequestBody ActionRequest request) { service.revokeAdministratorSessions(subject(auth), id, new ReasonRequest(request.reason())); }

    @PostMapping("/api/v1/admin-invitations/accept")
    Map<String, String> accept(@Valid @RequestBody AcceptInvitationRequest request) {
        service.accept(new AcceptAdministratorInvitationRequest(request.email(), request.code(), request.password(), request.confirmPassword()));
        return Map.of("message", "Email verified. Your administrator account is ready.");
    }
    @PostMapping("/api/v1/admin-invitations/validate")
    Map<String, String> validate(@Valid @RequestBody ValidateInvitationRequest request) { service.validateInvitationCode(new ValidateAdministratorInvitationRequest(request.email(), request.code())); return Map.of("message", "Verification code confirmed."); }
    @PostMapping("/api/v1/admin-invitations/resend")
    Map<String, String> resend(@Valid @RequestBody ResendInvitationRequest request) { service.resend(request.email()); return Map.of("message", "If the invitation is pending, a new code has been sent."); }

    private UUID subject(JwtAuthenticationToken auth) { return UUID.fromString(auth.getToken().getSubject()); }
    record InviteRequest(@NotBlank @Size(min=2,max=120) String name, @NotBlank @Email @Size(max=254) String email, @NotBlank @Size(max=30) String phone, @NotNull AdministratorRole role, @NotBlank @Size(max=600) String reason) {}
    record UpdateRequest(@NotBlank @Size(min=2,max=120) String name, @NotBlank @Size(max=30) String phone) {}
    record RoleRequest(@NotNull AdministratorRole role, @NotBlank @Size(max=600) String reason) {}
    record ActionRequest(@NotBlank @Size(max=600) String reason) {}
    record AcceptInvitationRequest(@NotBlank @Email String email, @NotBlank @Pattern(regexp="^\\d{6}$") String code, @NotBlank @Size(min=8,max=128) String password, @NotBlank String confirmPassword) {}
    record ValidateInvitationRequest(@NotBlank @Email String email, @NotBlank @Pattern(regexp="^\\d{6}$") String code) {}
    record ResendInvitationRequest(@NotBlank @Email String email) {}
}
