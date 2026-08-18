package lk.apluskids.platform.adminmanagement;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import lk.apluskids.platform.auth.refresh.RefreshTokenRepository;
import lk.apluskids.platform.auth.verification.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.common.normalization.InputNormalizer;
import lk.apluskids.platform.kidschamp.KidsChampAdminService;
import lk.apluskids.platform.role.*;
import lk.apluskids.platform.user.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

class AdministratorManagementRulesTests {
    @Test
    void invitationCreatesNoAdministratorRoleBeforeEmailVerification() {
        Fixture fixture = new Fixture();
        UUID actorId = UUID.randomUUID();
        fixture.stubSuperAdmin(actorId);
        when(fixture.users.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(fixture.users.existsByPhoneE164(anyString())).thenReturn(false);
        when(fixture.passwords.encode(anyString())).thenReturn("pending-password-hash");
        when(fixture.tokens.generate()).thenReturn("unusable-random-password");
        when(fixture.tokens.generateNumericCode()).thenReturn("123456");
        when(fixture.tokens.hash(anyString())).thenReturn("verification-hash");
        when(fixture.verificationTokens.existsByTokenHash(anyString())).thenReturn(false);

        fixture.service.invite(actorId, new AdministratorManagementService.InviteAdministratorRequest(
            "New Admin", "ADMIN@example.com", "0771234567", AdministratorRole.ADMIN, "Operations coverage"
        ));

        ArgumentCaptor<UserEntity> user = ArgumentCaptor.forClass(UserEntity.class);
        verify(fixture.users).save(user.capture());
        assertEquals(AccountStatus.PENDING_VERIFICATION, user.getValue().getStatus());
        assertEquals("admin@example.com", user.getValue().getEmail());
        assertTrue(user.getValue().getRoles().isEmpty(), "Pending invite must not have an administrator role");
        ArgumentCaptor<AdministratorMembershipEntity> membership = ArgumentCaptor.forClass(AdministratorMembershipEntity.class);
        verify(fixture.memberships).save(membership.capture());
        assertEquals(AdministratorMembershipStatus.PENDING_VERIFICATION, membership.getValue().getStatus());
        verify(fixture.events).publishEvent(argThat((Object event) -> event instanceof AdminInvitationEmailRequested requested
            && requested.code().equals("123456") && requested.expiresInMinutes() == 10));
    }

    @Test
    void acceptingCodeActivatesRoleOnlyAfterPasswordSetup() throws Exception {
        Fixture fixture = new Fixture();
        UserEntity user = new UserEntity();
        setField(user, "id", 77L);
        setField(user, "publicId", UUID.randomUUID());
        user.setAccountHolderName("Verified Admin");
        user.setEmail("verified@example.com");
        user.setPhoneE164("+94771234567");
        user.setStatus(AccountStatus.PENDING_VERIFICATION);
        AdministratorMembershipEntity membership = new AdministratorMembershipEntity();
        membership.setUser(user);
        membership.setRole(AdministratorRole.ADMIN);
        membership.setStatus(AdministratorMembershipStatus.PENDING_VERIFICATION);
        EmailVerificationTokenEntity verification = new EmailVerificationTokenEntity();
        verification.setUser(user);
        verification.setIssuedAt(Instant.now());
        verification.setExpiresAt(Instant.now().plusSeconds(600));
        RoleEntity adminRole = mock(RoleEntity.class);
        when(fixture.memberships.findLockedByEmail("verified@example.com")).thenReturn(Optional.of(membership));
        when(fixture.tokens.hash(anyString())).thenReturn("code-hash");
        when(fixture.verificationTokens.findByTokenHash("code-hash")).thenReturn(Optional.of(verification));
        when(fixture.verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(77L)).thenReturn(List.of(verification));
        when(fixture.roles.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(fixture.passwords.encode("secure-pass")).thenReturn("encoded-password");

        fixture.service.accept(new AdministratorManagementService.AcceptAdministratorInvitationRequest(
            "verified@example.com", "123456", "secure-pass", "secure-pass"
        ));

        assertEquals(AccountStatus.ACTIVE, user.getStatus());
        assertNotNull(user.getEmailVerifiedAt());
        assertEquals("encoded-password", user.getPasswordHash());
        assertEquals(Set.of(adminRole), user.getRoles());
        assertEquals(AdministratorMembershipStatus.ACTIVE, membership.getStatus());
        assertNotNull(membership.getActivatedAt());
    }

    @Test
    void cancelledInvitationCanBeSafelyReopenedWithANewEmail() throws Exception {
        Fixture fixture = new Fixture();
        UUID actorId = UUID.randomUUID();
        fixture.stubSuperAdmin(actorId);
        UserEntity cancelledUser = new UserEntity();
        setField(cancelledUser, "id", 88L);
        setField(cancelledUser, "publicId", UUID.randomUUID());
        cancelledUser.setAccountHolderName("Old Invite");
        cancelledUser.setEmail("old@example.com");
        cancelledUser.setPhoneE164("+94740532502");
        cancelledUser.setStatus(AccountStatus.DELETED);
        AdministratorMembershipEntity cancelled = new AdministratorMembershipEntity();
        cancelled.setUser(cancelledUser);
        cancelled.setRole(AdministratorRole.SUPER_ADMIN);
        cancelled.setStatus(AdministratorMembershipStatus.CANCELLED);
        when(fixture.users.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(fixture.users.findByPhoneE164("+94740532502")).thenReturn(Optional.of(cancelledUser));
        when(fixture.memberships.findLockedByUserPublicId(cancelledUser.getPublicId())).thenReturn(Optional.of(cancelled));
        when(fixture.users.existsByEmailIgnoreCaseAndIdNot("new@example.com", 88L)).thenReturn(false);
        when(fixture.users.existsByPhoneE164AndIdNot("+94740532502", 88L)).thenReturn(false);
        when(fixture.passwords.encode(anyString())).thenReturn("new-pending-hash");
        when(fixture.tokens.generate()).thenReturn("unusable-new-password");
        when(fixture.tokens.generateNumericCode()).thenReturn("654321");
        when(fixture.tokens.hash(anyString())).thenReturn("new-code-hash");
        when(fixture.verificationTokens.existsByTokenHash(anyString())).thenReturn(false);
        when(fixture.verificationTokens.findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(88L)).thenReturn(List.of());

        var result = fixture.service.invite(actorId, new AdministratorManagementService.InviteAdministratorRequest(
            "New Invite", "new@example.com", "0740532502", AdministratorRole.ADMIN, "Replacement operator"
        ));

        assertEquals("new@example.com", cancelledUser.getEmail());
        assertEquals(AccountStatus.PENDING_VERIFICATION, cancelledUser.getStatus());
        assertNull(cancelledUser.getDeletedAt());
        assertTrue(cancelledUser.getRoles().isEmpty());
        assertEquals(AdministratorMembershipStatus.PENDING_VERIFICATION, cancelled.getStatus());
        assertEquals(AdministratorRole.ADMIN, cancelled.getRole());
        assertEquals("new@example.com", result.email());
        verify(fixture.events).publishEvent(argThat((Object event) -> event instanceof AdminInvitationEmailRequested requested
            && requested.code().equals("654321")));
    }

    @Test
    void finalActiveSuperAdminCannotBeDemoted() {
        Fixture fixture = new Fixture();
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        fixture.stubSuperAdmin(actorId);
        AdministratorMembershipEntity target = new AdministratorMembershipEntity();
        UserEntity targetUser = new UserEntity();
        targetUser.setStatus(AccountStatus.ACTIVE);
        target.setUser(targetUser);
        target.setRole(AdministratorRole.SUPER_ADMIN);
        target.setStatus(AdministratorMembershipStatus.ACTIVE);
        when(fixture.memberships.findLockedByUserPublicId(targetId)).thenReturn(Optional.of(target));
        when(fixture.memberships.countByRoleAndStatus(AdministratorRole.SUPER_ADMIN, AdministratorMembershipStatus.ACTIVE)).thenReturn(1L);

        ApiException error = assertThrows(ApiException.class, () -> fixture.service.changeRole(actorId, targetId,
            new AdministratorManagementService.ChangeAdministratorRoleRequest(AdministratorRole.ADMIN, "Team change")));
        assertEquals("LAST_SUPER_ADMIN", error.getCode());
    }

    @Test
    void superAdminRemovalRevokesRolesAndSessionsButRetainsAuditRecord() throws Exception {
        Fixture fixture = new Fixture();
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        fixture.stubSuperAdmin(actorId);
        UserEntity actor = new UserEntity();
        actor.setStatus(AccountStatus.ACTIVE);
        when(fixture.users.findByPublicId(actorId)).thenReturn(Optional.of(actor));
        UserEntity targetUser = new UserEntity();
        setField(targetUser, "id", 501L);
        targetUser.setStatus(AccountStatus.ACTIVE);
        targetUser.replaceRoles(Set.of(mock(RoleEntity.class)));
        AdministratorMembershipEntity target = new AdministratorMembershipEntity();
        target.setUser(targetUser);
        target.setRole(AdministratorRole.ADMIN);
        target.setStatus(AdministratorMembershipStatus.ACTIVE);
        when(fixture.memberships.findLockedByUserPublicId(targetId)).thenReturn(Optional.of(target));
        when(fixture.refreshTokens.findAllByUserId(501L)).thenReturn(List.of());

        var result = fixture.service.remove(actorId, targetId,
            new AdministratorManagementService.ReasonRequest("Administrator left the operations team"));

        assertEquals(AdministratorMembershipStatus.REMOVED, target.getStatus());
        assertEquals(AccountStatus.DELETED, targetUser.getStatus());
        assertNotNull(targetUser.getDeletedAt());
        assertTrue(targetUser.getRoles().isEmpty());
        assertNotNull(target.getRemovedAt());
        assertEquals("Administrator left the operations team", target.getRemovalReason());
        assertEquals(AdministratorMembershipStatus.REMOVED, result.status());
        verify(fixture.audit).auditAdministratorAction(eq(actorId), eq("ADMINISTRATOR_REMOVED"),
            eq("ADMINISTRATOR"), eq(targetId), contains("Administrator left the operations team"));
    }

    @Test
    void superAdminCannotRemoveSelfOrFinalActiveSuperAdmin() {
        Fixture fixture = new Fixture();
        UUID actorId = UUID.randomUUID();
        fixture.stubSuperAdmin(actorId);

        ApiException self = assertThrows(ApiException.class, () -> fixture.service.remove(actorId, actorId,
            new AdministratorManagementService.ReasonRequest("Invalid self removal")));
        assertEquals("SELF_REMOVAL", self.getCode());

        UUID targetId = UUID.randomUUID();
        AdministratorMembershipEntity target = new AdministratorMembershipEntity();
        UserEntity targetUser = new UserEntity();
        targetUser.setStatus(AccountStatus.ACTIVE);
        target.setUser(targetUser);
        target.setRole(AdministratorRole.SUPER_ADMIN);
        target.setStatus(AdministratorMembershipStatus.ACTIVE);
        when(fixture.memberships.findLockedByUserPublicId(targetId)).thenReturn(Optional.of(target));
        when(fixture.memberships.countByRoleAndStatus(AdministratorRole.SUPER_ADMIN, AdministratorMembershipStatus.ACTIVE)).thenReturn(1L);

        ApiException last = assertThrows(ApiException.class, () -> fixture.service.remove(actorId, targetId,
            new AdministratorManagementService.ReasonRequest("Invalid final Super Admin removal")));
        assertEquals("LAST_SUPER_ADMIN", last.getCode());
    }

    @Test
    void incorrectInvitationCodesAreTemporarilyLockedAfterFiveAttempts() throws Exception {
        Fixture fixture = new Fixture();
        UserEntity user = new UserEntity();
        setField(user, "id", 91L);
        setField(user, "publicId", UUID.randomUUID());
        user.setEmail("locked@example.com");
        user.setStatus(AccountStatus.PENDING_VERIFICATION);
        AdministratorMembershipEntity membership = new AdministratorMembershipEntity();
        membership.setUser(user);
        membership.setRole(AdministratorRole.ADMIN);
        membership.setStatus(AdministratorMembershipStatus.PENDING_VERIFICATION);
        when(fixture.memberships.findLockedByEmail("locked@example.com")).thenReturn(Optional.of(membership));
        when(fixture.tokens.hash(anyString())).thenReturn("missing-hash");
        when(fixture.verificationTokens.findByTokenHash("missing-hash")).thenReturn(Optional.empty());

        for (int attempt = 1; attempt <= 4; attempt++) {
            ApiException error = assertThrows(ApiException.class, () -> fixture.service.validateInvitationCode(
                new AdministratorManagementService.ValidateAdministratorInvitationRequest("locked@example.com", "000000")));
            assertEquals("INVALID_VERIFICATION_CODE", error.getCode());
        }
        ApiException locked = assertThrows(ApiException.class, () -> fixture.service.validateInvitationCode(
            new AdministratorManagementService.ValidateAdministratorInvitationRequest("locked@example.com", "000000")));
        assertEquals("VERIFICATION_TEMPORARILY_LOCKED", locked.getCode());
        assertEquals(5, membership.getVerificationFailedAttempts());
        assertTrue(membership.getVerificationLockedUntil().isAfter(Instant.now().plusSeconds(14 * 60)));
    }

    @Test
    void migrationBackfillsExistingAdminsAndConstrainsLifecycle() throws Exception {
        try (var input = getClass().getResourceAsStream("/db/migration/V37__create_administrator_memberships.sql")) {
            assertNotNull(input);
            String sql = new String(input.readAllBytes(), StandardCharsets.UTF_8).replaceAll("\\s+", " ").toLowerCase();
            assertTrue(sql.contains("insert into administrator_memberships"));
            assertTrue(sql.contains("role_super_admin"));
            assertTrue(sql.contains("pending_verification"));
            assertTrue(sql.contains("unique references users"));
        }
        try (var input = getClass().getResourceAsStream("/db/migration/V38__protect_administrator_invitation_verification.sql")) {
            assertNotNull(input);
            String sql = new String(input.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();
            assertTrue(sql.contains("verification_failed_attempts"));
            assertTrue(sql.contains("verification_locked_until"));
        }
        try (var input = getClass().getResourceAsStream("/db/migration/V39__add_removed_administrator_lifecycle.sql")) {
            assertNotNull(input);
            String sql = new String(input.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();
            assertTrue(sql.contains("removal_reason"));
            assertTrue(sql.contains("'removed'"));
            assertTrue(sql.contains("removed_by_user_id"));
        }
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static final class Fixture {
        final AdministratorMembershipRepository memberships = mock(AdministratorMembershipRepository.class);
        final UserRepository users = mock(UserRepository.class);
        final RoleRepository roles = mock(RoleRepository.class);
        final RefreshTokenRepository refreshTokens = mock(RefreshTokenRepository.class);
        final EmailVerificationTokenRepository verificationTokens = mock(EmailVerificationTokenRepository.class);
        final SecureTokenService tokens = mock(SecureTokenService.class);
        final PasswordEncoder passwords = mock(PasswordEncoder.class);
        final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        final KidsChampAdminService audit = mock(KidsChampAdminService.class);
        final AdministratorManagementService service = new AdministratorManagementService(
            memberships, users, roles, refreshTokens, verificationTokens, tokens, passwords,
            new InputNormalizer(), events, audit, Duration.ofMinutes(10)
        );

        void stubSuperAdmin(UUID id) {
            UserEntity actor = new UserEntity();
            actor.setStatus(AccountStatus.ACTIVE);
            AdministratorMembershipEntity membership = new AdministratorMembershipEntity();
            membership.setUser(actor);
            membership.setRole(AdministratorRole.SUPER_ADMIN);
            membership.setStatus(AdministratorMembershipStatus.ACTIVE);
            when(memberships.findByUserPublicId(id)).thenReturn(Optional.of(membership));
        }
    }
}
