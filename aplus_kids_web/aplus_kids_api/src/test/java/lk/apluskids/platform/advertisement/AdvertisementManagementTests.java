package lk.apluskids.platform.advertisement;

import static org.junit.jupiter.api.Assertions.*;
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
class AdvertisementManagementTests {
    @Autowired AdvertisementService service;
    @Autowired UserRepository users;
    private UserEntity actor;

    @BeforeEach void actor(){actor=new UserEntity();actor.setAccountHolderName("Advertisement Test Admin");actor.setEmail("advert-"+System.nanoTime()+"@example.test");actor.setPhoneE164("+9477"+String.valueOf(System.nanoTime()).substring(5,12));actor.setPasswordHash("test-password-hash");actor.setStatus(AccountStatus.ACTIVE);actor=users.saveAndFlush(actor);}

    @Test void publishedCardIsDeliveredOnlyToItsAssignedSlot(){
        var request=new AdvertisementService.AdvertisementRequest("Back to school","CARD","Ready for school","Explore the collection","Shop now","School promotion","/market",false,"CONTAIN","#FFFFFF",null,Instant.now().minusSeconds(60),Instant.now().plusSeconds(3600),10,1,List.of("HOME_AFTER_HERO"));
        var created=service.create(actor.getPublicId(),request);assertNotNull(created.id());assertEquals("DRAFT",created.status());assertNotNull(created.createdAt());
        var published=service.status(actor.getPublicId(),created.id(),"ACTIVE");assertEquals("ACTIVE",published.lifecycle());assertTrue(service.active("HOME_AFTER_HERO").stream().anyMatch(ad->ad.id().equals(created.id())));assertTrue(service.active("WATCH_BEFORE_CATEGORIES").stream().noneMatch(ad->ad.id().equals(created.id())));
    }

    @Test void unsafeDestinationAndUnapprovedEmbedAreRejected(){
        var unsafe=new AdvertisementService.AdvertisementRequest("Unsafe","CARD","Title",null,null,null,"javascript:alert(1)",false,"CONTAIN","#FFFFFF",null,null,null,0,1,List.of("HOME_AFTER_HERO"));
        assertEquals("AD_URL_INVALID",assertThrows(ApiException.class,()->service.create(actor.getPublicId(),unsafe)).getCode());
        var embed=new AdvertisementService.AdvertisementRequest("Embed","EMBED",null,null,null,null,null,false,"CONTAIN","#FFFFFF","https://untrusted.example/embed",null,null,0,1,List.of("HOME_AFTER_HERO"));
        assertEquals("AD_EMBED_INVALID",assertThrows(ApiException.class,()->service.create(actor.getPublicId(),embed)).getCode());
    }

    @Test void commonWebsiteAddressIsNormalizedToHttps(){
        var request=new AdvertisementService.AdvertisementRequest("Website","CARD","Visit us",null,null,null,"example.com/offers",true,"CONTAIN","#FFFFFF",null,null,null,0,1,List.of("HOME_AFTER_HERO"));
        var created=service.create(actor.getPublicId(),request);
        assertEquals("https://example.com/offers",created.destinationUrl());
    }

    @Test void futureCampaignIsScheduledAndExpiredCampaignIsNotDelivered(){
        var future=new AdvertisementService.AdvertisementRequest("Future","CARD","Future promotion",null,null,null,null,false,"COVER","#112233",null,Instant.now().plusSeconds(3600),Instant.now().plusSeconds(7200),0,1,List.of("KIDS_ZONE_AFTER_HERO"));
        var created=service.create(actor.getPublicId(),future);assertEquals("SCHEDULED",service.status(actor.getPublicId(),created.id(),"ACTIVE").lifecycle());assertTrue(service.active("KIDS_ZONE_AFTER_HERO").stream().noneMatch(ad->ad.id().equals(created.id())));
    }

    @Test void dailyAnalyticsCanMonitorOneAdvertisement(){
        var request=new AdvertisementService.AdvertisementRequest("Measured","CARD","Measured promotion",null,null,null,"/market",false,"CONTAIN","#FFFFFF",null,null,null,0,1,List.of("HOME_AFTER_HERO"));
        var created=service.create(actor.getPublicId(),request);service.status(actor.getPublicId(),created.id(),"ACTIVE");service.impression(created.id());service.click(created.id());
        var report=service.analytics(created.id(),30);assertEquals(30,report.days());assertEquals(1,report.series().size());assertEquals(1,report.series().getFirst().lifetimeImpressions());assertEquals(1,report.series().getFirst().lifetimeClicks());
        var today=report.series().getFirst().points().getLast();assertEquals(1,today.impressions());assertEquals(1,today.clicks());
        var oneDay=service.analytics(created.id(),LocalDate.now(ZoneId.of("Asia/Colombo")),LocalDate.now(ZoneId.of("Asia/Colombo")));assertEquals(1,oneDay.days());assertEquals(1,oneDay.series().getFirst().points().size());
        assertEquals("AD_ANALYTICS_RANGE_TOO_LARGE",assertThrows(ApiException.class,()->service.analytics(created.id(),LocalDate.now().minusDays(730),LocalDate.now())).getCode());
    }

    @Test void activeAdvertisementMustBeStoppedBeforePermanentDeletion(){
        var request=new AdvertisementService.AdvertisementRequest("Delete me","CARD","Temporary promotion",null,null,null,null,false,"CONTAIN","#FFFFFF",null,null,null,0,1,List.of("HOME_AFTER_HERO"));
        var created=service.create(actor.getPublicId(),request);service.status(actor.getPublicId(),created.id(),"ACTIVE");assertEquals("AD_DELETE_ACTIVE",assertThrows(ApiException.class,()->service.delete(actor.getPublicId(),created.id())).getCode());
        service.status(actor.getPublicId(),created.id(),"PAUSED");service.delete(actor.getPublicId(),created.id());assertTrue(service.list().stream().noneMatch(ad->ad.id().equals(created.id())));assertTrue(service.history().stream().anyMatch(item->item.advertisementId().equals(created.id())&&item.action().equals("ADVERTISEMENT_DELETED")));
    }
}
