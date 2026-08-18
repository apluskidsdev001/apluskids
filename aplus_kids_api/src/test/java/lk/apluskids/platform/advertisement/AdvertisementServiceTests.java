package lk.apluskids.platform.advertisement;

import static org.junit.jupiter.api.Assertions.*;
import java.net.URI;
import java.time.*;
import java.util.List;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AdvertisementServiceTests {
    @Autowired AdvertisementService advertisements;
    @Autowired UserRepository users;
    private UserEntity actor;

    @BeforeEach void createActor(){
        actor=new UserEntity(); actor.setAccountHolderName("Advertisement test admin"); actor.setEmail("ad-test-"+System.nanoTime()+"@example.test");
        actor.setPhoneE164("+9477"+String.valueOf(System.nanoTime()).substring(5,12)); actor.setPasswordHash("test-hash"); actor.setStatus(AccountStatus.ACTIVE); actor=users.saveAndFlush(actor);
    }
    private AdvertisementService.AdvertisementRequest request(String name,Instant start,Instant end){return new AdvertisementService.AdvertisementRequest(name,"CARD","Promotion",null,null,null,"/market",true,"COVER","#FFFFFF",null,start,end,5,1,List.of("HOME_AFTER_HERO"));}

    @Test void publishesToAssignedSlotAndRecordsViewAndClick(){
        var ad=advertisements.create(actor.getPublicId(),request("School offer",Instant.now().minusSeconds(60),Instant.now().plusSeconds(3600)));
        advertisements.status(actor.getPublicId(),ad.id(),"ACTIVE");
        assertTrue(advertisements.active("HOME_AFTER_HERO").stream().anyMatch(item->item.id().equals(ad.id())));
        assertTrue(advertisements.active("WATCH_BEFORE_CATEGORIES").stream().noneMatch(item->item.id().equals(ad.id())));
        advertisements.impression(ad.id()); assertEquals(URI.create("/market"),advertisements.click(ad.id()));
        var saved=advertisements.list().stream().filter(item->item.id().equals(ad.id())).findFirst().orElseThrow();
        assertEquals(1,saved.impressions()); assertEquals(1,saved.clicks());
    }
    @Test void scheduledAdvertisementIsNotShownBeforeItsStart(){
        var ad=advertisements.create(actor.getPublicId(),request("Future",Instant.now().plusSeconds(3600),Instant.now().plusSeconds(7200)));
        assertEquals("SCHEDULED",advertisements.status(actor.getPublicId(),ad.id(),"ACTIVE").lifecycle());
        assertTrue(advertisements.active("HOME_AFTER_HERO").stream().noneMatch(item->item.id().equals(ad.id())));
    }
    @Test void mediaAdvertisementCannotPublishWithoutMedia(){
        var ad=advertisements.create(actor.getPublicId(),new AdvertisementService.AdvertisementRequest("Artwork","IMAGE",null,null,null,null,null,true,"COVER","#FFFFFF",null,null,null,0,1,List.of("HOME_AFTER_HERO")));
        assertEquals("AD_MEDIA_REQUIRED",assertThrows(ApiException.class,()->advertisements.status(actor.getPublicId(),ad.id(),"ACTIVE")).getCode());
    }
}
