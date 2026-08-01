package lk.apluskids.platform.kidschamp;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
class WhatsAppCloudDelivery {
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampWhatsAppAdminService whatsapp;

    WhatsAppCloudDelivery(
        KidsChampMessageRecipientRepository recipients,
        KidsChampWhatsAppAdminService whatsapp
    ) {
        this.recipients = recipients;
        this.whatsapp = whatsapp;
    }

    @Scheduled(fixedDelayString = "${aplus.whatsapp.delivery-delay-ms:2000}")
    @Transactional
    void deliverQueuedMessages() {
        KidsChampWhatsAppAdminService.ActiveConfig active=whatsapp.active();
        if (active.phoneNumberId().isBlank() || active.token().isBlank()) return;
        for (KidsChampMessageRecipientEntity recipient : recipients.findTop20ByStatusOrderByIdAsc("QUEUED")) {
            deliver(recipient,active);
        }
    }

    private void deliver(KidsChampMessageRecipientEntity recipient,KidsChampWhatsAppAdminService.ActiveConfig active) {
        recipient.sending();
        try {
            String messageId = whatsapp.send(active,recipient.getDestination(),recipient.getRenderedMessage());
            recipient.sent(messageId);
            recipient.getCampaign().complete();
        } catch (RestClientResponseException error) {
            recipient.failed("Meta API " + error.getStatusCode().value() + ": " + safeProviderMessage(error.getResponseBodyAsString()));
            recipient.getCampaign().fail();
        } catch (RuntimeException error) {
            recipient.failed(error.getMessage());
            recipient.getCampaign().fail();
        }
    }

    private static String normalize(String phone) {
        return phone == null ? "" : phone.replaceAll("[^0-9]", "");
    }

    private static String extractMessageId(Map<String, Object> response) {
        if (response == null) return null;
        Object messages = response.get("messages");
        if (messages instanceof List<?> list && !list.isEmpty() && list.getFirst() instanceof Map<?, ?> message) {
            Object id = message.get("id");
            return id == null ? null : id.toString();
        }
        return null;
    }

    private static String safeProviderMessage(String body) {
        if (body == null || body.isBlank()) return "Request rejected.";
        return body.substring(0, Math.min(body.length(), 500));
    }
}
