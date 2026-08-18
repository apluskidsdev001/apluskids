package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class KidsChampZipQueueIntegrationTests {
    @Autowired KidsChampAdminService admin;
    @Autowired KidsChampSubmissionRepository submissions;
    @Autowired KidsChampSettingsRepository settings;
    @Autowired UserRepository users;

    @Test
    void changingPhotoCountRequiresAChoiceAndCanKeepOrReplaceTheCurrentTarget() {
        var actor=users.findAll().stream().filter(user->user.getRoles().stream().anyMatch(role->
            "ROLE_ADMIN".equals(role.getName())||"ROLE_SUPER_ADMIN".equals(role.getName()))).findFirst().orElseThrow();
        var candidate=submissions.findAll().stream().filter(item->item.getStoredFilename()!=null).findFirst().orElseThrow();

        submissions.findAll().stream().filter(item->item.getBatch()==null&&item.getStoredFilename()!=null)
            .forEach(item->item.review(ReviewStatus.SUBMITTED,null,actor));
        candidate.setBatch(null);candidate.review(ReviewStatus.APPROVED,null,actor);

        var current=admin.settings();
        var entity=settings.findById((short)1).orElseThrow();
        entity.completeActiveZip();entity.startActiveZip(current.zipBatchSize());
        int changedCount=current.zipBatchSize()+7;

        ApiException decision=assertThrows(ApiException.class,()->admin.updateSettings(actor.getPublicId(),request(current,changedCount,null)));
        assertEquals("ZIP_QUEUE_COUNT_DECISION_REQUIRED",decision.getCode());

        admin.updateSettings(actor.getPublicId(),request(current,changedCount,KidsChampAdminService.ZipQueueCountPolicy.KEEP_CURRENT));
        assertEquals(current.zipBatchSize(),admin.zipProgress().activeTargetSize());
        assertEquals(changedCount,admin.zipProgress().nextTargetSize());

        int unrestrictedCount=25_000;
        admin.updateSettings(actor.getPublicId(),request(admin.settings(),unrestrictedCount,KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        assertEquals(unrestrictedCount,admin.zipProgress().activeTargetSize());
        assertEquals(unrestrictedCount,admin.settings().zipBatchSize());
    }

    private static KidsChampAdminService.SettingsRequest request(KidsChampAdminService.SettingsResponse value,int count,KidsChampAdminService.ZipQueueCountPolicy policy){
        return new KidsChampAdminService.SettingsRequest(
            value.categories(),value.maxFileSizeMb(),value.allowedFileTypes(),value.minimumAge(),value.maximumAge(),
            value.dailyTelecastLimit(),value.defaultTelecastTime(),count,value.zipExpiryDays(),value.zipWarningDays(),
            value.frequentParticipantThreshold(),value.requireWhatsAppConsent(),value.campaignLimit(),value.defaultMessage(),policy
        );
    }
}
