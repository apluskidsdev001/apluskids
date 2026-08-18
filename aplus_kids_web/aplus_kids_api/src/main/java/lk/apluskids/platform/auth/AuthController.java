package lk.apluskids.platform.auth;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import lk.apluskids.platform.auth.dto.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(
        AuthService authService,
        @Value("${aplus.auth.cookie-secure}") boolean cookieSecure,
        @Value("${aplus.auth.cookie-same-site}") String cookieSameSite
    ) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/login")
    LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse servletResponse) {
        AuthService.LoginResult result = authService.login(request);
        setRefreshCookie(servletResponse, result);
        return result.response();
    }

    @PostMapping("/refresh")
    LoginResponse refresh(
        @CookieValue(name = "aplus_refresh", required = false) String refreshToken,
        HttpServletResponse servletResponse
    ) {
        AuthService.LoginResult result = authService.refresh(refreshToken);
        setRefreshCookie(servletResponse, result);
        return result.response();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(
        @CookieValue(name = "aplus_refresh", required = false) String refreshToken,
        HttpServletResponse servletResponse
    ) {
        authService.logout(refreshToken);
        ResponseCookie cleared = ResponseCookie.from("aplus_refresh", "")
            .httpOnly(true).secure(cookieSecure).sameSite(cookieSameSite)
            .path("/api/v1/auth").maxAge(Duration.ZERO).build();
        servletResponse.addHeader(HttpHeaders.SET_COOKIE, cleared.toString());
    }

    @PostMapping("/forgot-password")
    Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return Map.of("message", "If that email is registered, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return Map.of("message", "Password reset successfully.");
    }

    @PostMapping("/register")
    ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/verify-email")
    Map<String, String> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return Map.of("message", "Email verified successfully.");
    }

    @PostMapping("/resend-verification")
    Map<String, String> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
        return Map.of("message", "If the account is awaiting verification, a new code has been sent.");
    }

    private void setRefreshCookie(HttpServletResponse response, AuthService.LoginResult result) {
        ResponseCookie refreshCookie = ResponseCookie.from("aplus_refresh", result.refreshToken())
            .httpOnly(true).secure(cookieSecure).sameSite(cookieSameSite)
            .path("/api/v1/auth").maxAge(result.refreshLifetime()).build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }
}
