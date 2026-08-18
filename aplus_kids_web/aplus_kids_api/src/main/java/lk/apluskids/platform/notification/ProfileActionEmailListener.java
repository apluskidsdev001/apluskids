package lk.apluskids.platform.notification;

import lk.apluskids.platform.profile.ProfileActionEmailRequested;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;

@Component
public class ProfileActionEmailListener {
    private final JavaMailSender mailSender;
    private final String from;

    public ProfileActionEmailListener(JavaMailSender mailSender, @Value("${aplus.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void send(ProfileActionEmailRequested event) {
        if (from == null || from.isBlank()) return;
        String action = event.purpose().name().equals("CHANGE_PASSWORD") ? "change your password" : "remove a child profile";
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(event.email());
        message.setSubject(event.code() + " is your A Plus Kids security code");
        message.setText("""
            Hello %s,

            Use this verification code to %s:

            %s

            This code expires in 1 minute. If you did not request this change, do not share the code.
            """.formatted(event.accountHolderName(), action, event.code()));
        mailSender.send(message);
    }
}
