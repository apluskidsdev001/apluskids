package lk.apluskids.platform.kidschamp;

import java.time.Instant;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;

@Component
class WhatsAppCloudDelivery {
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampWhatsAppAdminService whatsapp;
    private final KidsChampWhatsAppDeliveryService delivery;

    WhatsAppCloudDelivery(
        KidsChampMessageRecipientRepository recipients,
        KidsChampWhatsAppAdminService whatsapp,
        KidsChampWhatsAppDeliveryService delivery
    ) {
        this.recipients = recipients;
        this.whatsapp = whatsapp;
        this.delivery = delivery;
    }

    @Scheduled(fixedDelayString = "${aplus.whatsapp.delivery-delay-ms:2000}")
    @Transactional
    void deliverQueuedMessages() {
        KidsChampWhatsAppAdminService.ActiveConfig active=whatsapp.active();
        if (active.phoneNumberId().isBlank() || active.token().isBlank()) return;
        recipients.findDueForUpdate(Instant.now(),PageRequest.of(0,1)).stream().findFirst()
            .ifPresent(recipient->deliver(recipient,active));
    }

    private void deliver(KidsChampMessageRecipientEntity recipient,KidsChampWhatsAppAdminService.ActiveConfig active) {
        delivery.sending(recipient);
        try {
            String messageId = recipient.getTemplateName()==null||recipient.getTemplateName().isBlank()
                ? whatsapp.send(active,recipient.getDestination(),recipient.getRenderedMessage())
                : whatsapp.sendTemplate(active,recipient.getDestination(),recipient.getTemplateName(),recipient.getTemplateLanguageCode(),recipient.getTemplateParameters());
            delivery.accepted(recipient,messageId);
        } catch (RestClientResponseException error) {
            delivery.failed(recipient,friendlyProviderMessage(error.getStatusCode().value(),error.getResponseBodyAsString()),"rejected",null);
        } catch (RuntimeException error) {
            delivery.failed(recipient,friendlyRuntimeMessage(error),"error",null);
        }
    }

    private static String friendlyProviderMessage(int status,String body) {
        String lower=body==null?"":body.toLowerCase();
        if(lower.contains("expected number of params")||lower.contains("template")&&lower.contains("params"))return "WhatsApp template parameters do not match the approved template.";
        if(lower.contains("token")||status==401||status==403)return "WhatsApp access token is invalid, expired, or not permitted.";
        if(lower.contains("recipient")||lower.contains("phone number"))return "The recipient phone number could not receive this WhatsApp message.";
        if(status==429)return "WhatsApp rate limit reached. The message can be retried later.";
        return "WhatsApp rejected the message (HTTP "+status+").";
    }

    private static String friendlyRuntimeMessage(RuntimeException error) {
        String message=error.getMessage();
        if(message==null||message.isBlank())return "The message could not be sent due to an unexpected delivery error.";
        return message.substring(0,Math.min(message.length(),300));
    }
}
