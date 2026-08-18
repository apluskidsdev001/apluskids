package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "kids_champ_whatsapp_config")
class KidsChampWhatsAppConfigEntity {
    @Id private Short id;
    @Column(name="graph_api_version",nullable=false,length=20) private String graphApiVersion;
    @Column(name="phone_number_id",nullable=false,length=40) private String phoneNumberId;
    @Column(name="business_account_id",nullable=false,length=40) private String businessAccountId;
    @Column(name="access_token_encrypted",nullable=false,columnDefinition="text") private String accessTokenEncrypted;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Column(name="last_test_status",length=24) private String lastTestStatus;
    @Column(name="last_test_message",length=600) private String lastTestMessage;
    @Column(name="last_tested_at") private Instant lastTestedAt;

    Short getId(){return id;} String getGraphApiVersion(){return graphApiVersion;} String getPhoneNumberId(){return phoneNumberId;}
    String getBusinessAccountId(){return businessAccountId;} String getAccessTokenEncrypted(){return accessTokenEncrypted;}
    String getLastTestStatus(){return lastTestStatus;} String getLastTestMessage(){return lastTestMessage;} Instant getLastTestedAt(){return lastTestedAt;}
    void save(String version,String phoneId,String accountId,String encrypted){
        boolean accountChanged=id!=null&&(!java.util.Objects.equals(phoneNumberId,phoneId)||!java.util.Objects.equals(businessAccountId,accountId)||!java.util.Objects.equals(graphApiVersion,version));
        id=1;graphApiVersion=version;phoneNumberId=phoneId;businessAccountId=accountId;accessTokenEncrypted=encrypted;updatedAt=Instant.now();
        if(accountChanged){lastTestStatus=null;lastTestMessage=null;lastTestedAt=null;}
    }
    void testResult(boolean success,String message){lastTestStatus=success?"SUCCESS":"FAILED";lastTestMessage=message;lastTestedAt=Instant.now();}
}
