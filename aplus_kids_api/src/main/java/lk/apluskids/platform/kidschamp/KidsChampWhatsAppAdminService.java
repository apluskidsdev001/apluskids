package lk.apluskids.platform.kidschamp;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
class KidsChampWhatsAppAdminService {
    private final KidsChampWhatsAppConfigRepository repository;
    private final byte[] encryptionKey;
    private final String fallbackVersion, fallbackPhoneId, fallbackAccountId, fallbackToken;

    KidsChampWhatsAppAdminService(KidsChampWhatsAppConfigRepository repository,
        @Value("${aplus.auth.jwt-secret}") String encryptionSecret,
        @Value("${aplus.whatsapp.graph-api-version:v23.0}") String version,
        @Value("${aplus.whatsapp.phone-number-id:}") String phoneId,
        @Value("${aplus.whatsapp.business-account-id:}") String accountId,
        @Value("${aplus.whatsapp.access-token:}") String token) {
        this.repository=repository;fallbackVersion=version;fallbackPhoneId=phoneId;fallbackAccountId=accountId;fallbackToken=token;
        try { encryptionKey=MessageDigest.getInstance("SHA-256").digest(encryptionSecret.getBytes(StandardCharsets.UTF_8)); }
        catch(NoSuchAlgorithmException error){throw new IllegalStateException(error);}
    }

    @Transactional(readOnly=true) ConfigResponse config(){
        return repository.findById((short)1).map(item->new ConfigResponse(item.getGraphApiVersion(),item.getPhoneNumberId(),item.getBusinessAccountId(),true,mask(decrypt(item.getAccessTokenEncrypted())),item.getLastTestStatus(),item.getLastTestMessage(),item.getLastTestedAt()))
            .orElse(new ConfigResponse(fallbackVersion,fallbackPhoneId,fallbackAccountId,!fallbackToken.isBlank(),mask(fallbackToken),null,null,null));
    }

    @Transactional ConfigResponse save(ConfigRequest request){
        String version=required(request.graphApiVersion(),"Graph API version");String phone=digits(request.phoneNumberId());String account=digits(request.businessAccountId());
        KidsChampWhatsAppConfigEntity entity=repository.findById((short)1).orElseGet(KidsChampWhatsAppConfigEntity::new);
        String token=request.accessToken()==null||request.accessToken().isBlank()?(entity.getId()==null?fallbackToken:decrypt(entity.getAccessTokenEncrypted())):request.accessToken().trim();
        if(token.isBlank())throw new IllegalArgumentException("WhatsApp access token is required.");
        entity.save(version,phone,account,encrypt(token));repository.save(entity);return config();
    }

    @Transactional TestResponse test(String rawPhone){
        KidsChampWhatsAppConfigEntity entity=repository.findById((short)1).orElseGet(()->{KidsChampWhatsAppConfigEntity created=new KidsChampWhatsAppConfigEntity();created.save(fallbackVersion,fallbackPhoneId,fallbackAccountId,encrypt(fallbackToken));return repository.save(created);});
        ActiveConfig active=new ActiveConfig(entity.getGraphApiVersion(),entity.getPhoneNumberId(),decrypt(entity.getAccessTokenEncrypted()));String phone=normalizeSriLanka(rawPhone);
        try {String id=send(active,phone,"A+ Kids WhatsApp system test message.");entity.testResult(true,"Accepted by Meta. Message ID: "+id);return new TestResponse(true,"Meta accepted the test message.",id,Instant.now());}
        catch(RuntimeException error){entity.testResult(false,safe(error.getMessage()));return new TestResponse(false,safe(error.getMessage()),null,Instant.now());}
    }

    @Transactional ConnectionTestResponse connectionTest(){
        ActiveConfig active=active();
        if(active.phoneNumberId().isBlank()||active.token().isBlank()) return new ConnectionTestResponse(false,"WhatsApp configuration is incomplete.",List.of("Enter the Phone Number ID and a permanent access token.","Confirm the token has whatsapp_business_messaging permission."),Instant.now());
        try {
            @SuppressWarnings("unchecked") Map<String,Object> response=RestClient.builder().baseUrl("https://graph.facebook.com/"+active.version()).build().get().uri("/{id}?fields=id,display_phone_number,verified_name",active.phoneNumberId())
                .header("Authorization","Bearer "+active.token()).retrieve().body(Map.class);
            String name=response==null?"":Objects.toString(response.get("verified_name"),"");
            return new ConnectionTestResponse(true,name.isBlank()?"Meta connection is working.":"Connected to Meta as "+name+".",List.of(),Instant.now());
        } catch(RuntimeException error) {
            String message=safe(error.getMessage());
            return new ConnectionTestResponse(false,message,List.of("Check that the Phone Number ID belongs to this WhatsApp Business Account.","Generate a new permanent system-user token with whatsapp_business_messaging and whatsapp_business_management permissions.","Confirm the app is live and the token has not expired."),Instant.now());
        }
    }

    @Transactional(readOnly=true) ActiveConfig active(){
        return repository.findById((short)1).map(item->new ActiveConfig(item.getGraphApiVersion(),item.getPhoneNumberId(),decrypt(item.getAccessTokenEncrypted())))
            .orElse(new ActiveConfig(fallbackVersion,fallbackPhoneId,fallbackToken));
    }

    String send(ActiveConfig active,String destination,String message){
        if(active.phoneNumberId().isBlank()||active.token().isBlank())throw new IllegalStateException("WhatsApp configuration is incomplete.");
        @SuppressWarnings("unchecked") Map<String,Object> response=RestClient.builder().baseUrl("https://graph.facebook.com/"+active.version()).build().post().uri("/{id}/messages",active.phoneNumberId())
            .header("Authorization","Bearer "+active.token()).contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("messaging_product","whatsapp","recipient_type","individual","to",digits(destination),"type","text","text",Map.of("preview_url",false,"body",message))).retrieve().body(Map.class);
        Object messages=response==null?null:response.get("messages");if(messages instanceof List<?> list&&!list.isEmpty()&&list.getFirst() instanceof Map<?,?> value&&value.get("id")!=null)return value.get("id").toString();
        throw new IllegalStateException("Meta did not return a message ID.");
    }

    String sendTemplate(ActiveConfig active,String destination,String name,String languageCode,List<String> parameters){
        if(active.phoneNumberId().isBlank()||active.token().isBlank())throw new IllegalStateException("WhatsApp configuration is incomplete.");
        List<Map<String,String>> values=parameters.stream().map(value->Map.of("type","text","text",value)).toList();
        Map<String,Object> template=new LinkedHashMap<>();template.put("name",name);template.put("language",Map.of("code",languageCode));
        if(!values.isEmpty())template.put("components",List.of(Map.of("type","body","parameters",values)));
        @SuppressWarnings("unchecked") Map<String,Object> response=RestClient.builder().baseUrl("https://graph.facebook.com/"+active.version()).build().post().uri("/{id}/messages",active.phoneNumberId())
            .header("Authorization","Bearer "+active.token()).contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("messaging_product","whatsapp","to",digits(destination),"type","template","template",template)).retrieve().body(Map.class);
        Object messages=response==null?null:response.get("messages");if(messages instanceof List<?> list&&!list.isEmpty()&&list.getFirst() instanceof Map<?,?> value&&value.get("id")!=null)return value.get("id").toString();
        throw new IllegalStateException("Meta did not return a message ID.");
    }

    String sendTestTemplate(ActiveConfig active,String destination){
        if(active.phoneNumberId().isBlank()||active.token().isBlank())throw new IllegalStateException("WhatsApp configuration is incomplete.");
        @SuppressWarnings("unchecked") Map<String,Object> response=RestClient.builder().baseUrl("https://graph.facebook.com/"+active.version()).build().post().uri("/{id}/messages",active.phoneNumberId())
            .header("Authorization","Bearer "+active.token()).contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("messaging_product","whatsapp","to",digits(destination),"type","template","template",Map.of("name","hello_world","language",Map.of("code","en_US")))).retrieve().body(Map.class);
        Object messages=response==null?null:response.get("messages");if(messages instanceof List<?> list&&!list.isEmpty()&&list.getFirst() instanceof Map<?,?> value&&value.get("id")!=null)return value.get("id").toString();
        throw new IllegalStateException("Meta did not return a message ID.");
    }

    private String encrypt(String value){try{byte[] iv=new byte[12];SecureRandom.getInstanceStrong().nextBytes(iv);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(encryptionKey,"AES"),new GCMParameterSpec(128,iv));return Base64.getEncoder().encodeToString(iv)+"."+Base64.getEncoder().encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException("Token encryption failed.",e);}}
    private String decrypt(String value){try{String[] parts=value.split("\\.",2);byte[] iv=Base64.getDecoder().decode(parts[0]);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(encryptionKey,"AES"),new GCMParameterSpec(128,iv));return new String(cipher.doFinal(Base64.getDecoder().decode(parts[1])),StandardCharsets.UTF_8);}catch(Exception e){throw new IllegalStateException("Saved token could not be decrypted.",e);}}
    private static String required(String value,String label){if(value==null||value.isBlank())throw new IllegalArgumentException(label+" is required.");return value.trim();}
    private static String digits(String value){return value==null?"":value.replaceAll("[^0-9]","");}
    private static String normalizeSriLanka(String value){String phone=digits(value);return phone.startsWith("0")?"94"+phone.substring(1):phone;}
    private static String mask(String value){return value==null||value.isBlank()?"":value.substring(0,Math.min(6,value.length()))+"••••••••";}
    private static String safe(String value){if(value==null||value.isBlank())return "WhatsApp request failed.";return value.substring(0,Math.min(value.length(),600));}
    record ActiveConfig(String version,String phoneNumberId,String token){}
    record ConfigRequest(String graphApiVersion,String phoneNumberId,String businessAccountId,String accessToken){}
    record ConfigResponse(String graphApiVersion,String phoneNumberId,String businessAccountId,boolean tokenConfigured,String maskedToken,String lastTestStatus,String lastTestMessage,Instant lastTestedAt){}
    record TestResponse(boolean success,String message,String providerMessageId,Instant testedAt){}
    record ConnectionTestResponse(boolean success,String message,List<String> solutions,Instant testedAt){}
}
