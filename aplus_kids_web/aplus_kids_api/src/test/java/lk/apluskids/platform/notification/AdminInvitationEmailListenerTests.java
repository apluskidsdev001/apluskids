package lk.apluskids.platform.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import lk.apluskids.platform.adminmanagement.AdminInvitationEmailRequested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

class AdminInvitationEmailListenerTests {
    @Test
    void sendsCodeOnlyInvitationWithoutAWebLink() {
        JavaMailSender sender = mock(JavaMailSender.class);
        AdminInvitationEmailListener listener = new AdminInvitationEmailListener(sender, "admin@apluskids.lk");

        listener.send(new AdminInvitationEmailRequested("new.admin@example.com", "New Admin", "021035", 10));

        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(message.capture());
        String text = message.getValue().getText();
        assertNotNull(text);
        assertTrue(text.contains("021035"));
        assertTrue(text.contains("10 minutes"));
        assertFalse(text.contains("http://"));
        assertFalse(text.contains("https://"));
        assertFalse(text.contains("www."));
    }
}
