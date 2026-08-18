package lk.apluskids.platform.notification;

import lk.apluskids.platform.auth.verification.PasswordResetEmailRequested;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class PasswordResetEmailListener {
    private final JavaMailSender mailSender;
    private final String from;
    private final String frontendOrigin;

    public PasswordResetEmailListener(
        JavaMailSender mailSender,
        @Value("${aplus.mail.from:}") String from,
        @Value("${aplus.frontend-origin}") String frontendOrigin
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.frontendOrigin = frontendOrigin;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void send(PasswordResetEmailRequested event) {
        if (from == null || from.isBlank()) return;
        String link = UriComponentsBuilder.fromUriString(frontendOrigin)
            .path("/reset-password/")
            .queryParam("token", event.rawToken()).build().toUriString();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(event.email());
        message.setSubject("Reset your A Plus Kids password");
        message.setText("""
            Hello %s,

            Reset your password using this link:
            %s

            This link expires in 30 minutes. If you did not request it, you can ignore this email.
            """.formatted(event.accountHolderName(), link));
        mailSender.send(message);
    }
}
