package lk.apluskids.platform.kidschamp;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;

@Component
class WhatsAppCloudDelivery {
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampWhatsAppAdminService whatsapp;
    private Instant nextDeliveryAt=Instant.EPOCH;

    WhatsAppCloudDelivery(
        KidsChampMessageRecipientRepository recipients,
        KidsChampWhatsAppAdminService whatsapp
    ) {
        this.recipients = recipients;
        this.whatsapp = whatsapp;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    void deliverQueuedMessages() {
        KidsChampWhatsAppAdminService.ActiveConfig active=whatsapp.active();
        if (active.phoneNumberId().isBlank() || active.token().isBlank()) return;
        if(Instant.now().isBefore(nextDeliveryAt)) return;
        recipients.findTop20ByStatusOrderByIdAsc("QUEUED").stream().findFirst().ifPresent(recipient->deliver(recipient,active));
        nextDeliveryAt=Instant.now().plusSeconds(ThreadLocalRandom.current().nextLong(1,11));
    }

    private void deliver(KidsChampMessageRecipientEntity recipient,KidsChampWhatsAppAdminService.ActiveConfig active) {
        recipient.sending();
        try {
            String messageId = recipient.getTemplateName()==null||recipient.getTemplateName().isBlank()
                ? whatsapp.send(active,recipient.getDestination(),recipient.getRenderedMessage())
                : whatsapp.sendTemplate(active,recipient.getDestination(),recipient.getTemplateName(),recipient.getTemplateLanguageCode(),recipient.getTemplateParameters());
            recipient.sent(messageId);
            refreshCampaignStatus(recipient);
        } catch (RestClientResponseException error) {
            recipient.failed(friendlyProviderMessage(error.getStatusCode().value(),error.getResponseBodyAsString()));
            refreshCampaignStatus(recipient);
        } catch (RuntimeException error) {
            recipient.failed(friendlyRuntimeMessage(error));
            refreshCampaignStatus(recipient);
        }
    }

    private void refreshCampaignStatus(KidsChampMessageRecipientEntity recipient) {
        var values=recipients.findAllByCampaignPublicIdOrderByIdAsc(recipient.getCampaign().getPublicId());
        boolean queued=values.stream().anyMatch(value->"QUEUED".equals(value.getStatus())||"SENDING".equals(value.getStatus()));
        boolean sent=values.stream().anyMatch(value->"SENT".equals(value.getStatus()));
        boolean failed=values.stream().anyMatch(value->"FAILED".equals(value.getStatus()));
        recipient.getCampaign().status(queued?"QUEUED":sent&&failed?"PARTIAL":sent?"COMPLETED":"FAILED");
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
