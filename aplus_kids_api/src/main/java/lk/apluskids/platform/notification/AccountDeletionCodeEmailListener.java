package lk.apluskids.platform.notification;

import lk.apluskids.platform.adminmanagement.AccountDeletionCodeEmailRequested;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class AccountDeletionCodeEmailListener {
    private final JavaMailSender mailSender;
    private final String from;

    public AccountDeletionCodeEmailListener(JavaMailSender mailSender, @Value("${aplus.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void send(AccountDeletionCodeEmailRequested event) {
        if (from == null || from.isBlank()) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(event.email());
        message.setSubject(event.code() + " confirms permanent account deletion");
        message.setText("""
            Hello %s,

            A request was made to permanently delete selected A Plus Kids family or guest accounts.

            Verification code: %s

            This code expires in %d minutes. Do not share it. If you did not request this deletion, sign out and contact another Super Admin immediately.
            """.formatted(event.name(), event.code(), event.expiresInMinutes()));
        mailSender.send(message);
    }
}
