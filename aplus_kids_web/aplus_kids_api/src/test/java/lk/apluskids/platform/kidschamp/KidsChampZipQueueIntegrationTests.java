package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.persistence.EntityManager;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class KidsChampZipQueueIntegrationTests {
    @Autowired KidsChampAdminService admin;
    @Autowired KidsChampService kidsChamp;
    @Autowired KidsChampController controller;
    @Autowired KidsChampSubmissionRepository submissions;
    @Autowired KidsChampBatchRepository batches;
    @Autowired KidsChampSettingsRepository settings;
    @Autowired KidsChampStorage storage;
    @Autowired UserRepository users;
    @Autowired EntityManager entityManager;

    private final List<String> photos=new ArrayList<>();
    private final List<Path> archives=new ArrayList<>();

    @AfterEach
    void cleanFiles(){photos.forEach(storage::delete);archives.forEach(path->storage.deletePath(path.toString()));}

    @Test
    void changingPhotoCountRequiresAChoiceAndCanKeepOrReplaceTheCurrentTarget() throws Exception {
        var actor=users.findAll().stream().filter(user->user.getRoles().stream().anyMatch(role->
            "ROLE_ADMIN".equals(role.getName())||"ROLE_SUPER_ADMIN".equals(role.getName()))).findFirst().orElseThrow();
        submissions.findAll().stream().filter(item->item.getBatch()==null)
            .forEach(item->item.review(ReviewStatus.SUBMITTED,null,actor));
        settings.findById((short)1).orElseThrow().completeActiveZip();

        var original=admin.settings();
        var baseline=admin.updateSettings(actor.getPublicId(),request(original,10,KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        var submitted=kidsChamp.submit(null,null,"Queue Test Child",LocalDate.now().minusYears(9),"Queue Test Parent",null,
            "+9478"+String.format("%07d",Math.floorMod(UUID.randomUUID().hashCode(),10_000_000)),"LK","Central","Kandy",
            "Drawing","Queue test",null,true,false,new MockMultipartFile("photo","queue-test.jpg","image/jpeg",jpegBytes()));
        entityManager.flush();entityManager.clear();
        var candidate=submissions.findByPublicId(submitted.id()).orElseThrow();
        photos.add(candidate.getStoredFilename());
        candidate.review(ReviewStatus.APPROVED,null,actor);

        var entity=settings.findById((short)1).orElseThrow();
        entity.completeActiveZip();entity.startActiveZip(baseline.zipBatchSize());
        int changedCount=baseline.zipBatchSize()+7;

        ApiException decision=assertThrows(ApiException.class,()->admin.updateSettings(actor.getPublicId(),request(baseline,changedCount,null)));
        assertEquals("ZIP_QUEUE_COUNT_DECISION_REQUIRED",decision.getCode());

        admin.updateSettings(actor.getPublicId(),request(baseline,changedCount,KidsChampAdminService.ZipQueueCountPolicy.KEEP_CURRENT));
        assertEquals(baseline.zipBatchSize(),admin.zipProgress().activeTargetSize());
        assertEquals(changedCount,admin.zipProgress().nextTargetSize());
        ApiException secondDecision=assertThrows(ApiException.class,
            ()->admin.updateSettings(actor.getPublicId(),request(admin.settings(),changedCount+3,null)));
        assertTrue(secondDecision.getMessage().contains("current queue keeps "+baseline.zipBatchSize()+" photos"));

        int unrestrictedCount=25_000;
        admin.updateSettings(actor.getPublicId(),request(admin.settings(),unrestrictedCount,KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        assertEquals(unrestrictedCount,admin.zipProgress().activeTargetSize());
        assertEquals(unrestrictedCount,admin.settings().zipBatchSize());
    }

    @Test
    void manuallyEmptyingKeepCurrentQueueLetsTheNextApprovalUseTheNewPhotoCount() throws Exception {
        var actor=users.findAll().stream().filter(user->user.getRoles().stream().anyMatch(role->
            "ROLE_ADMIN".equals(role.getName())||"ROLE_SUPER_ADMIN".equals(role.getName()))).findFirst().orElseThrow();
        submissions.findAll().stream().filter(item->item.getBatch()==null)
            .forEach(item->item.review(ReviewStatus.SUBMITTED,null,actor));
        settings.findById((short)1).orElseThrow().completeActiveZip();

        var original=admin.settings();
        int oldCount=3;int newCount=2;
        var oldSettings=admin.updateSettings(actor.getPublicId(),request(original,oldCount,KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        var waiting=submit("Queue Old Target Child","Kandy");
        submissions.findByPublicId(waiting.id()).orElseThrow().review(ReviewStatus.APPROVED,null,actor);
        var entity=settings.findById((short)1).orElseThrow();
        entity.completeActiveZip();entity.startActiveZip(oldCount);

        admin.updateSettings(actor.getPublicId(),request(oldSettings,newCount,KidsChampAdminService.ZipQueueCountPolicy.KEEP_CURRENT));
        assertEquals(oldCount,admin.zipProgress().activeTargetSize());
        assertEquals(newCount,admin.zipProgress().nextTargetSize());
        var publicPolicy=controller.uploadPolicy();
        assertEquals(admin.settings().maxFileSizeMb(),publicPolicy.maxFileSizeMb());
        assertEquals(admin.settings().allowedFileTypes(),publicPolicy.allowedFileTypes());

        var recovered=admin.createSelectedBatches(actor.getPublicId(),List.of(waiting.id()),"Empty the old waiting queue");
        assertEquals(1,recovered.size());
        archives.add(Path.of(batches.findByPublicId(recovered.get(0).id()).orElseThrow().getArchivePath()));
        assertNull(settings.findById((short)1).orElseThrow().getActiveZipTargetSize(),"The completed old queue target must not leak into the next queue.");

        var next=submit("Queue New Target Child","Galle");
        admin.review(actor.getPublicId(),next.id(),ReviewStatus.APPROVED,null);
        var progress=admin.zipProgress();
        assertEquals(1,progress.readyPhotos());
        assertEquals(newCount,progress.activeTargetSize(),"The next approval must use the newly configured photo count.");
        assertEquals(newCount,progress.nextTargetSize());
    }

    private KidsChampResponse submit(String child,String city) throws Exception {
        var submitted=kidsChamp.submit(null,null,child,LocalDate.now().minusYears(9),"Queue Test Parent",null,
            "+9478"+String.format("%07d",Math.floorMod(UUID.randomUUID().hashCode(),10_000_000)),"LK","Central",city,
            "Drawing","Queue test",null,true,false,new MockMultipartFile("photo","queue-test.jpg","image/jpeg",jpegBytes()));
        photos.add(submissions.findByPublicId(submitted.id()).orElseThrow().getStoredFilename());
        entityManager.flush();entityManager.clear();
        return submitted;
    }

    private static byte[] jpegBytes() throws Exception {
        var image=new BufferedImage(4,4,BufferedImage.TYPE_INT_RGB);Graphics2D graphics=image.createGraphics();
        try{graphics.setColor(Color.BLUE);graphics.fillRect(0,0,image.getWidth(),image.getHeight());}finally{graphics.dispose();}
        var output=new ByteArrayOutputStream();assertTrue(ImageIO.write(image,"jpg",output));return output.toByteArray();
    }

    private static KidsChampAdminService.SettingsRequest request(KidsChampAdminService.SettingsResponse value,int count,KidsChampAdminService.ZipQueueCountPolicy policy){
        return new KidsChampAdminService.SettingsRequest(
            value.categories(),value.maxFileSizeMb(),value.allowedFileTypes(),value.minimumAge(),value.maximumAge(),
            value.dailyTelecastLimit(),value.defaultTelecastTime(),count,value.zipExpiryDays(),value.zipWarningDays(),
            value.frequentParticipantThreshold(),value.requireWhatsAppConsent(),value.campaignLimit(),value.defaultMessage(),policy
        );
    }
}
