package lk.apluskids.platform.adminmanagement;

import java.util.*;
import java.time.Instant;
import lk.apluskids.platform.child.ChildProfileRepository;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.kidschamp.KidsChampAdminService;
import lk.apluskids.platform.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Central account controls. The controller deliberately keeps secrets out of this domain. */
@RestController
@RequestMapping("/api/v1/admin/account-management")
public class AccountManagementAdminController {
    private final UserRepository users;
    private final ChildProfileRepository children;
    private final KidsChampAdminService audit;
    private final AdministratorMembershipRepository administratorMemberships;

    AccountManagementAdminController(UserRepository users, ChildProfileRepository children, KidsChampAdminService audit,
                                     AdministratorMembershipRepository administratorMemberships) {
        this.users=users; this.children=children; this.audit=audit; this.administratorMemberships=administratorMemberships;
    }

    @GetMapping("/overview") OverviewResponse overview(JwtAuthenticationToken auth) {
        admin(auth);
        List<UserEntity> familyUsers=users.findAll().stream().filter(user -> !isAdministratorRecord(user)).toList();
        long guestAccounts=audit.guests().size();
        return new OverviewResponse(familyUsers.size()+guestAccounts, administratorMemberships.count(),
            familyUsers.stream().filter(u->u.getStatus()==AccountStatus.ACTIVE).count()+guestAccounts, children.count());
    }

    @GetMapping("/accounts") List<AccountResponse> accounts(JwtAuthenticationToken auth, @RequestParam(required=false) String search, @RequestParam(required=false) AccountStatus status) {
        admin(auth); String query=search==null?"":search.trim().toLowerCase(Locale.ROOT);
        Map<Long,Long> childCount=new HashMap<>(); children.findAll().forEach(child->childCount.merge(child.getUser().getId(),1L,Long::sum));
        List<AccountResponse> registered=users.findAll().stream().filter(user->!isAdministratorRecord(user)).filter(user->status==null||user.getStatus()==status)
            .filter(user->query.isBlank()||user.getAccountHolderName().toLowerCase(Locale.ROOT).contains(query)||user.getEmail().toLowerCase(Locale.ROOT).contains(query)||user.getPhoneE164().contains(query))
            .map(user->account(user,childCount.getOrDefault(user.getId(),0L))).toList();
        if(status!=null&&status!=AccountStatus.ACTIVE) return registered;
        List<AccountResponse> guests=audit.guests().stream().filter(guest->query.isBlank()||guest.parentName().toLowerCase(Locale.ROOT).contains(query)||(guest.email()!=null&&guest.email().toLowerCase(Locale.ROOT).contains(query))||guest.mobile().contains(query))
            .map(guest->new AccountResponse(guest.id(),"GUEST",guest.parentName(),guest.email(),guest.mobile(),"GUEST",guest.submissionCount(),guest.firstSubmittedAt(),guest.lastSubmittedAt())).toList();
        return java.util.stream.Stream.concat(registered.stream(),guests.stream()).sorted(Comparator.comparing(AccountResponse::createdAt,Comparator.nullsLast(Comparator.reverseOrder()))).toList();
    }

    @PatchMapping("/accounts/{id}") @Transactional AccountResponse updateAccount(JwtAuthenticationToken auth,@PathVariable UUID id,@RequestBody UpdateAccountRequest request) {
        admin(auth); UserEntity target=user(id); if(isAdmin(target)) throw forbidden("Use the administrator controls for administrator accounts.");
        String before=target.getAccountHolderName()+" | "+target.getEmail()+" | "+target.getPhoneE164()+" | "+target.getStatus();
        if(request.accountHolderName()!=null&&!request.accountHolderName().isBlank()) target.setAccountHolderName(request.accountHolderName().trim());
        if(request.email()!=null&&!request.email().isBlank()&&!request.email().equalsIgnoreCase(target.getEmail())) { if(users.existsByEmailIgnoreCase(request.email().trim())) throw new ApiException(HttpStatus.CONFLICT,"EMAIL_EXISTS","This email address is already in use."); target.setEmail(request.email().trim().toLowerCase(Locale.ROOT)); }
        if(request.phoneE164()!=null&&!request.phoneE164().isBlank()&&!request.phoneE164().equals(target.getPhoneE164())) { if(users.existsByPhoneE164AndIdNot(request.phoneE164().trim(),target.getId())) throw new ApiException(HttpStatus.CONFLICT,"PHONE_EXISTS","This phone number is already in use."); target.setPhoneE164(request.phoneE164().trim()); }
        if(request.status()!=null) target.setStatus(request.status()); users.save(target);
        audit.auditAdministratorAction(subject(auth),"KIDS_ACCOUNT_UPDATED","KIDS_ACCOUNT",id,"Updated account. Before: "+before+". After: "+target.getAccountHolderName()+" | "+target.getEmail()+" | "+target.getPhoneE164()+" | "+target.getStatus());
        return account(target,children.findAllByUserPublicIdAndDeletedAtIsNull(id).stream().count());
    }

    @DeleteMapping("/accounts/{id}") @Transactional AccountResponse deleteAccount(JwtAuthenticationToken auth,@PathVariable UUID id,@RequestBody(required=false) DeleteAccountRequest request) {
        admin(auth); UserEntity target=user(id); if(isAdmin(target)) throw forbidden("Use the administrator controls for administrator accounts.");
        if(target.getStatus()==AccountStatus.DELETED) return account(target,children.findAllByUserPublicIdAndDeletedAtIsNull(id).stream().count());
        target.setStatus(AccountStatus.DELETED); target.setDeletedAt(Instant.now()); users.save(target);
        String reason=request==null||request.reason()==null||request.reason().isBlank()?"No reason provided.":request.reason().trim();
        audit.auditAdministratorAction(subject(auth),"KIDS_ACCOUNT_SOFT_DELETED","KIDS_ACCOUNT",id,"Deleted "+target.getAccountHolderName()+". Reason: "+reason);
        return account(target,children.findAllByUserPublicIdAndDeletedAtIsNull(id).stream().count());
    }

    @PostMapping("/accounts/{id}/restore") @Transactional AccountResponse restoreAccount(JwtAuthenticationToken auth,@PathVariable UUID id) {
        admin(auth); UserEntity target=user(id); if(isAdmin(target)) throw forbidden("Use the administrator controls for administrator accounts.");
        target.setStatus(AccountStatus.ACTIVE); target.setDeletedAt(null); users.save(target);
        audit.auditAdministratorAction(subject(auth),"KIDS_ACCOUNT_RESTORED","KIDS_ACCOUNT",id,"Restored "+target.getAccountHolderName()+" to active access.");
        return account(target,children.findAllByUserPublicIdAndDeletedAtIsNull(id).stream().count());
    }
    @PatchMapping("/accounts/guests/{id}") AccountResponse updateGuest(JwtAuthenticationToken auth,@PathVariable UUID id,@RequestBody UpdateGuestRequest request){admin(auth);var guest=audit.updateGuest(subject(auth),id,request.parentName(),request.email(),request.phoneE164());return new AccountResponse(guest.id(),"GUEST",guest.parentName(),guest.email(),guest.mobile(),"GUEST",guest.submissionCount(),guest.firstSubmittedAt(),guest.lastSubmittedAt());}
    @DeleteMapping("/accounts/guests/{id}") AccountResponse deleteGuest(JwtAuthenticationToken auth,@PathVariable UUID id,@RequestBody(required=false) DeleteAccountRequest request){admin(auth);var guest=audit.deleteGuest(subject(auth),id,request==null?null:request.reason());return new AccountResponse(guest.id(),"GUEST",guest.parentName(),guest.email(),guest.mobile(),"DELETED_GUEST",guest.submissionCount(),guest.firstSubmittedAt(),guest.lastSubmittedAt());}
    @PostMapping("/accounts/guests/{id}/restore") AccountResponse restoreGuest(JwtAuthenticationToken auth,@PathVariable UUID id){admin(auth);var guest=audit.restoreGuest(subject(auth),id);return new AccountResponse(guest.id(),"GUEST",guest.parentName(),guest.email(),guest.mobile(),"GUEST",guest.submissionCount(),guest.firstSubmittedAt(),guest.lastSubmittedAt());}

    private AccountResponse account(UserEntity user,long childCount) { return new AccountResponse(user.getPublicId(),"REGISTERED",user.getAccountHolderName(),user.getEmail(),user.getPhoneE164(),user.getStatus().name(),childCount,user.getCreatedAt(),user.getLastLoginAt()); }
    private UserEntity user(UUID id) { return users.findByPublicId(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"USER_NOT_FOUND","Account was not found.")); }
    private boolean isAdmin(UserEntity user) { return user.getRoles().stream().anyMatch(r->"ROLE_ADMIN".equals(r.getName())||"ROLE_SUPER_ADMIN".equals(r.getName())); }
    private boolean isAdministratorRecord(UserEntity user) { return isAdmin(user) || administratorMemberships.existsByUserId(user.getId()); }
    private UUID subject(JwtAuthenticationToken auth) { return UUID.fromString(auth.getToken().getSubject()); }
    private void admin(JwtAuthenticationToken auth) { List<String> values=auth.getToken().getClaimAsStringList("roles"); if(values==null||values.stream().noneMatch(v->"ROLE_ADMIN".equals(v)||"ROLE_SUPER_ADMIN".equals(v))) throw forbidden("Administrator access is required."); }
    private ApiException forbidden(String message) { return new ApiException(HttpStatus.FORBIDDEN,"SUPER_ADMIN_REQUIRED",message); }

    record OverviewResponse(long totalAccounts,long administrators,long activeAccounts,long childProfiles) {}
    record AccountResponse(UUID id,String accountType,String name,String email,String phone,String status,long children,java.time.Instant createdAt,java.time.Instant lastLoginAt) {}
    record UpdateAccountRequest(String accountHolderName,String email,String phoneE164,AccountStatus status) {}
    record UpdateGuestRequest(String parentName,String email,String phoneE164) {}
    record DeleteAccountRequest(String reason) {}
}
