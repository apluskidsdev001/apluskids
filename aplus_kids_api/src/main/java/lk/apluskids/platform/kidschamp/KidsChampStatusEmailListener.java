package lk.apluskids.platform.kidschamp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.event.*;

@Component
class KidsChampStatusEmailListener {
    private final JavaMailSender sender; private final String from;
    KidsChampStatusEmailListener(JavaMailSender sender,@Value("${aplus.mail.from:}") String from){this.sender=sender;this.from=from;}
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    @Async
    void send(KidsChampStatusEmailRequested event){
        if(from==null||from.isBlank()||event.email()==null||event.email().isBlank()) return;
        SimpleMailMessage mail=new SimpleMailMessage(); mail.setFrom(from);mail.setTo(event.email());mail.setSubject(event.subject());
        mail.setText("Hello,\n\n"+event.message()+"\n\nChild: "+event.childName()+"\nTracking code: "+event.trackingCode()+"\n\nA+ Kids TV");
        sender.send(mail);
    }
}
