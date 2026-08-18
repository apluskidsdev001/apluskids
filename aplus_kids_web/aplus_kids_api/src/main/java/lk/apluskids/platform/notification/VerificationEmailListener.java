package lk.apluskids.platform.notification;

import lk.apluskids.platform.auth.verification.VerificationEmailRequested;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;

@Component
public class VerificationEmailListener {
    private final JavaMailSender mailSender;
    private final String from;

    public VerificationEmailListener(
        JavaMailSender mailSender,
        @Value("${aplus.mail.from:}") String from
    ) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void send(VerificationEmailRequested event) {
        if (from == null || from.isBlank()) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(event.email());
        message.setSubject(event.code() + " is your A Plus Kids verification code");
        message.setText("""
            Hello %s,

            Your A Plus Kids verification code is:

            %s

            This code expires in 1 minute. If you did not create this account, you can ignore this email.
            """.formatted(event.accountHolderName(), event.code()));
        mailSender.send(message);
    }
}
