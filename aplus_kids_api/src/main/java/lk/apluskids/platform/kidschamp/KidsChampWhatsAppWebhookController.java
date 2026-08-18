package lk.apluskids.platform.kidschamp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Meta Cloud API delivery callback. Configure the verification token and app secret before registering this URL in Meta. */
@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
class KidsChampWhatsAppWebhookController {
    private final KidsChampMessageRecipientRepository recipients;
    private final KidsChampWhatsAppCampaignStatus campaignStatus;
    private final ObjectMapper mapper=new ObjectMapper();
    private final String verifyToken, appSecret;

    KidsChampWhatsAppWebhookController(KidsChampMessageRecipientRepository recipients, KidsChampWhatsAppCampaignStatus campaignStatus,
        @Value("${aplus.whatsapp.webhook-verify-token:}") String verifyToken,
        @Value("${aplus.whatsapp.app-secret:}") String appSecret){this.recipients=recipients;this.campaignStatus=campaignStatus;this.verifyToken=verifyToken;this.appSecret=appSecret;}

    @GetMapping
    ResponseEntity<String> verify(@RequestParam(name="hub.mode",required=false) String mode,@RequestParam(name="hub.verify_token",required=false) String token,@RequestParam(name="hub.challenge",required=false) String challenge){
        return !verifyToken.isBlank()&&"subscribe".equals(mode)&&MessageDigest.isEqual(verifyToken.getBytes(StandardCharsets.UTF_8),String.valueOf(token).getBytes(StandardCharsets.UTF_8))
            ? ResponseEntity.ok(challenge==null?"":challenge):ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping
    @Transactional
    ResponseEntity<Void> receive(@RequestHeader(name="X-Hub-Signature-256",required=false) String signature,@RequestBody String body){
        if(appSecret.isBlank()||!validSignature(signature,body))return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {for(JsonNode entry:mapper.readTree(body).path("entry"))for(JsonNode change:entry.path("changes"))for(JsonNode status:change.path("value").path("statuses"))update(status);}catch(Exception ignored){return ResponseEntity.badRequest().build();}
        return ResponseEntity.ok().build();
    }

    private void update(JsonNode status){
        String id=status.path("id").asText();String value=status.path("status").asText();if(id.isBlank()||value.isBlank())return;
        Instant providerTime=status.path("timestamp").canConvertToLong()?Instant.ofEpochSecond(status.path("timestamp").asLong()):null;
        recipients.findByProviderMessageId(id).ifPresent(recipient->{
            boolean changed=false;String reason=null;
            if("delivered".equals(value))changed=recipient.delivered(providerTime);
            else if("read".equals(value))changed=recipient.read(providerTime);
            else if("failed".equals(value)){reason=status.path("errors").path(0).path("title").asText("WhatsApp delivery failed.");changed=recipient.failed(reason);}
            if(changed){campaignStatus.event(recipient,recipient.getStatus(),value,reason,providerTime);campaignStatus.recalculate(recipient.getCampaign());}
        });
    }

    private boolean validSignature(String header,String body){
        if(header==null||!header.startsWith("sha256="))return false;
        try {Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));String expected="sha256="+java.util.HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),header.getBytes(StandardCharsets.UTF_8));}catch(Exception error){return false;}
    }
}
