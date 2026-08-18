package lk.apluskids.platform.notification;

import lk.apluskids.platform.adminmanagement.AdminInvitationEmailRequested;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;

@Component
public class AdminInvitationEmailListener {
    private final JavaMailSender mailSender;
    private final String from;
    public AdminInvitationEmailListener(JavaMailSender mailSender, @Value("${aplus.mail.from:}") String from) { this.mailSender = mailSender; this.from = from; }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void send(AdminInvitationEmailRequested event) {
        if (from == null || from.isBlank()) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from); message.setTo(event.email()); message.setSubject("You are invited to administer A Plus Kids");
        message.setText("""
            Hello %s,

            A Super Admin invited you to the A Plus Kids administration team.

            Verification code: %s

            This code expires in %d minutes.

            Enter this code on the A Plus Kids administrator invitation screen to verify your email and set your password.
            For your security, do not forward this code or share it with anyone you do not trust.
            If you did not expect this invitation, ignore this email.
            """.formatted(event.name(), event.code(), event.expiresInMinutes()));
        mailSender.send(message);
    }
}
