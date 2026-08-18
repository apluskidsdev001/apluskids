package lk.apluskids.platform.kidschamp;

import java.time.*;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;

@Component
class WhatsAppCloudDelivery {
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampWhatsAppAdminService whatsapp;
    private final KidsChampWhatsAppCampaignStatus campaignStatus;
    private Instant nextDeliveryAt = Instant.EPOCH;

    WhatsAppCloudDelivery(KidsChampMessageRecipientRepository recipients, KidsChampWhatsAppAdminService whatsapp,
                          KidsChampWhatsAppCampaignStatus campaignStatus) {
        this.recipients = recipients; this.whatsapp = whatsapp; this.campaignStatus = campaignStatus;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    void deliverQueuedMessages() {
        KidsChampWhatsAppAdminService.ActiveConfig active = whatsapp.active();
        if (active.phoneNumberId().isBlank() || active.token().isBlank() || Instant.now().isBefore(nextDeliveryAt)) return;
        recipients.findTop20ByStatusAndNextAttemptAtLessThanEqualOrderByIdAsc("QUEUED", Instant.now()).stream().findFirst().ifPresent(recipient -> deliver(recipient, active));
        nextDeliveryAt = Instant.now().plusSeconds(ThreadLocalRandom.current().nextLong(1, 11));
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    void recoverInterruptedMessages() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(5));
        recipients.findAllByStatusAndLastAttemptAtBefore("SENDING", cutoff).forEach(recipient -> {
            if (recipient.recoverIfStale(cutoff)) {
                campaignStatus.event(recipient, recipient.getStatus(), "recovered", recipient.getFailureReason());
                campaignStatus.recalculate(recipient.getCampaign());
            }
        });
    }

    private void deliver(KidsChampMessageRecipientEntity recipient, KidsChampWhatsAppAdminService.ActiveConfig active) {
        recipient.sending(); campaignStatus.event(recipient, "SENDING", "sending", null);
        try {
            String messageId = recipient.getTemplateName() == null || recipient.getTemplateName().isBlank()
                ? whatsapp.send(active, recipient.getDestination(), recipient.getRenderedMessage())
                : whatsapp.sendTemplate(active, recipient.getDestination(), recipient.getTemplateName(), recipient.getTemplateLanguageCode(), recipient.getTemplateParameters());
            recipient.sent(messageId); campaignStatus.event(recipient, "SENT", "accepted", "Accepted by Meta: " + messageId);
        } catch (RestClientResponseException error) {
            recipient.failed(friendlyProviderMessage(error.getStatusCode().value(), error.getResponseBodyAsString()));
            campaignStatus.event(recipient, "FAILED", "failed", recipient.getFailureReason());
        } catch (RuntimeException error) {
            recipient.failed(friendlyRuntimeMessage(error)); campaignStatus.event(recipient, "FAILED", "failed", recipient.getFailureReason());
        }
        campaignStatus.recalculate(recipient.getCampaign());
    }

    private static String friendlyProviderMessage(int status, String body) {
        String lower = body == null ? "" : body.toLowerCase();
        if (lower.contains("expected number of params") || lower.contains("template") && lower.contains("params")) return "WhatsApp template parameters do not match the approved template.";
        if (lower.contains("token") || status == 401 || status == 403) return "WhatsApp access token is invalid, expired, or not permitted.";
        if (lower.contains("recipient") || lower.contains("phone number")) return "The recipient phone number could not receive this WhatsApp message.";
        if (status == 429) return "WhatsApp rate limit reached. The message can be retried later.";
        return "WhatsApp rejected the message (HTTP " + status + ").";
    }
    private static String friendlyRuntimeMessage(RuntimeException error) {
        String message = error.getMessage();
        return message == null || message.isBlank() ? "The message could not be sent due to an unexpected delivery error." : message.substring(0, Math.min(message.length(), 300));
    }
}
