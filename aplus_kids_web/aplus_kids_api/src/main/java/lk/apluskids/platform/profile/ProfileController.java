package lk.apluskids.platform.profile;

import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import lk.apluskids.platform.notification.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final ProfileService profiles;
    private final AccountNotificationService notifications;

    public ProfileController(ProfileService profiles, AccountNotificationService notifications) {
        this.profiles = profiles;
        this.notifications = notifications;
    }

    @GetMapping("/notifications")
    List<AccountNotificationResponse> notifications(JwtAuthenticationToken authentication) {
        return notifications.list(UUID.fromString(authentication.getToken().getSubject()));
    }

    @PatchMapping("/notifications/{notificationId}/read")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    void markNotificationRead(
        JwtAuthenticationToken authentication,
        @PathVariable UUID notificationId
    ) {
        notifications.markRead(UUID.fromString(authentication.getToken().getSubject()), notificationId);
    }

    @GetMapping
    ProfileResponse get(JwtAuthenticationToken authentication) {
        return profiles.get(UUID.fromString(authentication.getToken().getSubject()));
    }

    @PatchMapping
    ProfileResponse update(
        JwtAuthenticationToken authentication,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        return profiles.update(UUID.fromString(authentication.getToken().getSubject()), request);
    }

    @PostMapping("/children")
    ProfileResponse.ChildSummary addChild(
        JwtAuthenticationToken authentication,
        @Valid @RequestBody ChildProfileRequest request
    ) {
        return profiles.addChild(UUID.fromString(authentication.getToken().getSubject()), request);
    }

    @PatchMapping("/children/{childId}")
    ProfileResponse.ChildSummary updateChild(
        JwtAuthenticationToken authentication,
        @PathVariable UUID childId,
        @Valid @RequestBody ChildProfileRequest request
    ) {
        return profiles.updateChild(UUID.fromString(authentication.getToken().getSubject()), childId, request);
    }

    @PostMapping("/security-code")
    void requestSecurityCode(
        JwtAuthenticationToken authentication,
        @Valid @RequestBody RequestProfileActionCode request
    ) {
        profiles.requestActionCode(UUID.fromString(authentication.getToken().getSubject()), request);
    }

    @PatchMapping("/password")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    void changePassword(
        JwtAuthenticationToken authentication,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        profiles.changePassword(UUID.fromString(authentication.getToken().getSubject()), request);
    }

    @DeleteMapping("/children/{childId}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    void deleteChild(
        JwtAuthenticationToken authentication,
        @PathVariable UUID childId,
        @Valid @RequestBody VerifyProfileActionRequest request
    ) {
        profiles.deleteChild(UUID.fromString(authentication.getToken().getSubject()), childId, request);
    }

    @DeleteMapping
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    void deleteAccount(
        JwtAuthenticationToken authentication,
        @Valid @RequestBody DeleteAccountRequest request
    ) {
        profiles.deleteAccount(UUID.fromString(authentication.getToken().getSubject()), request);
    }
}
