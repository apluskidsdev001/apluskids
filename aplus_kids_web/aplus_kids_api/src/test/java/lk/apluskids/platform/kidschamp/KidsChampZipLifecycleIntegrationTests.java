package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.persistence.EntityManager;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipFile;
import javax.imageio.ImageIO;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.UserEntity;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class KidsChampZipLifecycleIntegrationTests {
    @Autowired KidsChampAdminService admin;
    @Autowired KidsChampService kidsChamp;
    @Autowired KidsChampSubmissionRepository submissions;
    @Autowired KidsChampBatchRepository batches;
    @Autowired KidsChampSettingsRepository settings;
    @Autowired KidsChampStorage storage;
    @Autowired UserRepository users;
    @Autowired EntityManager entityManager;

    private final List<String> photos=new ArrayList<>();
    private final List<Path> archives=new ArrayList<>();
    private UserEntity actor;

    @BeforeEach
    void isolateWaitingQueue(){
        actor=users.findAll().stream().filter(user->user.getRoles().stream().anyMatch(role->
            "ROLE_ADMIN".equals(role.getName())||"ROLE_SUPER_ADMIN".equals(role.getName()))).findFirst().orElseThrow();
        submissions.findAll().stream().filter(item->item.getBatch()==null).forEach(item->item.review(ReviewStatus.SUBMITTED,null,actor));
        settings.findById((short)1).orElseThrow().completeActiveZip();
    }

    @AfterEach
    void cleanFiles(){photos.forEach(storage::delete);archives.forEach(path->storage.deletePath(path.toString()));}

    @Test
    void automaticZipConvertsNamesSnapshotsRetentionAndPersistsEditedStatus() throws Exception {
        var original=admin.settings();
        admin.updateSettings(actor.getPublicId(),request(original,1,7,KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));

        byte[] jpeg=jpegBytes();
        var submitted=submit("Zip Test O'Neil","New/City",jpeg);
        var source=submissions.findByPublicId(submitted.id()).orElseThrow();
        Path sourcePath=storage.photo(source.getStoredFilename());
        byte[] originalBytes=Files.readAllBytes(sourcePath);

        var reviewed=admin.review(actor.getPublicId(),submitted.id(),ReviewStatus.APPROVED,null);
        assertEquals(ReviewStatus.APPROVED,reviewed.reviewStatus());
        var batch=batches.findByPublicId(admin.createBatch(actor.getPublicId(),1,false).id()).orElseThrow();
        archives.add(Path.of(batch.getArchivePath()));
        assertEquals(7,batch.getRetentionDays());
        assertNotNull(admin.batches().stream().filter(value->value.id().equals(batch.getPublicId())).findFirst().orElseThrow().createdAt());
        assertEquals(Math.min(original.zipWarningDays(),6),batch.getWarningDays());
        assertNotNull(batch.getDeleteAfter());
        assertTrue(Math.abs(Duration.between(java.time.Instant.now().plus(Duration.ofDays(7)),batch.getDeleteAfter()).toMinutes())<2);
        assertArrayEquals(originalBytes,Files.readAllBytes(sourcePath),"ZIP generation must not rewrite the original artwork.");

        try(var zip=new ZipFile(batch.getArchivePath())){
            var entry=zip.getEntry("001_Zip Test O Neil_New City.png");
            assertNotNull(entry);
            try(var input=zip.getInputStream(entry)){
                assertArrayEquals(new byte[]{(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a},input.readNBytes(8));
            }
            assertNotNull(zip.getEntry("submissions.csv"));
        }

        Files.delete(Path.of(batch.getArchivePath()));
        var recoveredDownload=admin.download(actor.getPublicId(),batch.getPublicId());archives.add(recoveredDownload.path());
        assertTrue(Files.isRegularFile(Path.of(batch.getArchivePath())));
        try(var recovered=new ZipFile(recoveredDownload.path().toFile())){assertNotNull(recovered.getEntry("001_Zip Test O Neil_New City.png"));}
        assertNull(batches.findByPublicId(batch.getPublicId()).orElseThrow().getFirstDownloadedAt(),"Preparing a stream is not a completed download.");
        admin.completeDownload(recoveredDownload);
        assertNotNull(batches.findByPublicId(batch.getPublicId()).orElseThrow().getFirstDownloadedAt());

        var expiry=batch.getDeleteAfter();
        var safeDownload=admin.download(actor.getPublicId(),batch.getPublicId());
        archives.add(safeDownload.path());
        assertNotEquals(Path.of(batch.getArchivePath()),safeDownload.path());
        assertTrue(Files.isRegularFile(safeDownload.path()));
        admin.completeDownload(safeDownload);
        assertSameInstant(expiry,batches.findByPublicId(batch.getPublicId()).orElseThrow().getDeleteAfter());
        assertNotNull(admin.setEdited(actor.getPublicId(),batch.getPublicId(),true).editedAt());
        assertNull(admin.setEdited(actor.getPublicId(),batch.getPublicId(),false).editedAt());
        assertEquals(batch.getWarningDays(),admin.batches().stream().filter(value->value.id().equals(batch.getPublicId())).findFirst().orElseThrow().warningDays());

        UUID submissionId=source.getPublicId();
        admin.deleteBatch(actor.getPublicId(),batch.getPublicId());
        var deleted=batches.findByPublicId(batch.getPublicId()).orElseThrow();
        assertNotNull(deleted.getDeletedAt());
        assertTrue(deleted.isCleanupPending());
        storage.deletePath(batch.getArchivePath());
        assertTrue(Files.isRegularFile(safeDownload.path()),"Retention cleanup must not remove an in-flight download snapshot.");
        try(var snapshotZip=new ZipFile(safeDownload.path().toFile())){assertNotNull(snapshotZip.getEntry("submissions.csv"));}
        var preserved=submissions.findByPublicId(submissionId).orElseThrow();
        assertEquals(batch.getPublicId(),preserved.getBatch().getPublicId());
        assertEquals("Zip Test O'Neil",preserved.getChildName());
        assertNotNull(preserved.getStoredFilename(),"The source remains until the post-commit cleanup worker runs.");
    }

    @Test
    void manualZipSkipsDatabaseRowsWhoseArtworkFileIsMissing() throws Exception {
        var current=admin.settings();
        admin.updateSettings(actor.getPublicId(),request(current,10,current.zipExpiryDays(),KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        var submitted=submit("Zip Test Missing","Kandy",jpegBytes());
        var item=submissions.findByPublicId(submitted.id()).orElseThrow();
        item.review(ReviewStatus.APPROVED,null,actor);
        storage.delete(item.getStoredFilename());

        ApiException error=assertThrows(ApiException.class,()->admin.createBatch(actor.getPublicId(),10,true));
        assertEquals("NO_PHOTOS",error.getCode());
        assertTrue(error.getMessage().contains("available artwork"));
    }

    @Test
    void missingArtworkIsRemovedFromSelectionWithoutDuplicatingEarlierPhotos() throws Exception {
        var missing=submit("Zip Test Missing First","Kandy",jpegBytes());
        var first=submit("Zip Test First","Galle",jpegBytes());
        var second=submit("Zip Test Second","Matara",jpegBytes());
        for(var value:List.of(missing,first,second))
            submissions.findByPublicId(value.id()).orElseThrow().review(ReviewStatus.APPROVED,null,actor);
        storage.delete(submissions.findByPublicId(missing.id()).orElseThrow().getStoredFilename());

        var batch=admin.createBatch(actor.getPublicId(),2,false);
        var entity=batches.findByPublicId(batch.id()).orElseThrow();
        archives.add(Path.of(entity.getArchivePath()));
        assertEquals(2,batch.photoCount());
        assertEquals(Set.of(first.id(),second.id()),new HashSet<>(batch.submissionIds()));
        try(var zip=new ZipFile(entity.getArchivePath())){
            assertNotNull(zip.getEntry("001_Zip Test First_Galle.png"));
            assertNotNull(zip.getEntry("002_Zip Test Second_Matara.png"));
            assertEquals(3,zip.size());
        }
    }

    @Test
    void corruptArtworkCannotBlockLaterReadablePhotos() throws Exception {
        var corrupt=submit("Zip Test Corrupt","Kandy",jpegBytes());
        var valid=submit("Zip Test Valid","Kurunegala",jpegBytes());
        var corruptEntity=submissions.findByPublicId(corrupt.id()).orElseThrow();
        byte[] completePng=pngBytes();
        Files.write(storage.photo(corruptEntity.getStoredFilename()),Arrays.copyOf(completePng,33));
        assertTrue(storage.hasPhoto(corruptEntity.getStoredFilename()));
        assertFalse(storage.hasReadablePhoto(corruptEntity.getStoredFilename()),"A PNG with valid dimensions but truncated pixel data must be rejected.");
        corruptEntity.review(ReviewStatus.APPROVED,null,actor);
        submissions.findByPublicId(valid.id()).orElseThrow().review(ReviewStatus.APPROVED,null,actor);

        var batch=admin.createBatch(actor.getPublicId(),1,false);
        var entity=batches.findByPublicId(batch.id()).orElseThrow();archives.add(Path.of(entity.getArchivePath()));
        assertEquals(List.of(valid.id()),batch.submissionIds());
        assertNull(submissions.findByPublicId(corrupt.id()).orElseThrow().getStoredFilename());
        try(var zip=new ZipFile(entity.getArchivePath())){assertNotNull(zip.getEntry("001_Zip Test Valid_Kurunegala.png"));}
    }

    @Test
    void selectedRecoverySplitsByConfiguredPhotoCountAndKeepsTheRemainder() throws Exception {
        var current=admin.settings();
        admin.updateSettings(actor.getPublicId(),request(current,2,current.zipExpiryDays(),KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        List<UUID> selected=new ArrayList<>();
        for(int index=1;index<=5;index++){
            var submitted=submit("Zip Split Child "+index,"City "+index,jpegBytes());
            submissions.findByPublicId(submitted.id()).orElseThrow().review(ReviewStatus.APPROVED,null,actor);
            selected.add(submitted.id());
        }
        settings.findById((short)1).orElseThrow().startActiveZip(250);

        ApiException reasonRequired=assertThrows(ApiException.class,()->admin.createSelectedBatches(actor.getPublicId(),selected,null));
        assertEquals("RECOVERY_REASON_REQUIRED",reasonRequired.getCode());
        ApiException singularTooLarge=assertThrows(ApiException.class,
            ()->admin.createSelectedBatch(actor.getPublicId(),selected,"Legacy single ZIP request"));
        assertEquals("BATCH_SELECTION_TOO_LARGE",singularTooLarge.getCode());
        var created=admin.createSelectedBatches(actor.getPublicId(),selected,"Recover selected artwork");
        assertEquals(List.of(2,2,1),created.stream().map(KidsChampAdminService.BatchResponse::photoCount).toList());
        assertEquals(new HashSet<>(selected),created.stream().flatMap(batch->batch.submissionIds().stream()).collect(java.util.stream.Collectors.toSet()));
        assertNull(settings.findById((short)1).orElseThrow().getActiveZipTargetSize(),"Manually emptying the queue must clear the stale target.");
        assertEquals(2,admin.zipProgress().activeTargetSize(),"The next queue must use the configured photo count.");
        for(var value:created){
            var batch=batches.findByPublicId(value.id()).orElseThrow();archives.add(Path.of(batch.getArchivePath()));
            try(var zip=new ZipFile(batch.getArchivePath())){
                assertEquals(value.photoCount()+1,zip.size());
                assertTrue(zip.stream().anyMatch(entry->entry.getName().startsWith("001_")));
            }
        }
    }

    @Test
    void deletionCommitsMetadataBeforeAnyFilesystemCleanupRuns() throws Exception {
        var current=admin.settings();
        admin.updateSettings(actor.getPublicId(),request(current,1,current.zipExpiryDays(),KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        var submitted=submit("Zip Test Cleanup","Jaffna",jpegBytes());
        var reviewed=admin.review(actor.getPublicId(),submitted.id(),ReviewStatus.APPROVED,null);
        assertEquals(ReviewStatus.APPROVED,reviewed.reviewStatus());
        var batch=batches.findByPublicId(admin.createBatch(actor.getPublicId(),1,false).id()).orElseThrow();
        archives.add(Path.of(batch.getArchivePath()));
        var safeDownload=admin.download(actor.getPublicId(),batch.getPublicId());archives.add(safeDownload.path());admin.completeDownload(safeDownload);
        var item=submissions.findByPublicId(submitted.id()).orElseThrow();
        Path source=storage.photo(item.getStoredFilename());
        Files.delete(source);Files.createDirectory(source);Path blocker=source.resolve("blocker.txt");Files.writeString(blocker,"test");
        try{
            assertDoesNotThrow(()->admin.deleteBatch(actor.getPublicId(),batch.getPublicId()));
            var pending=batches.findByPublicId(batch.getPublicId()).orElseThrow();
            assertNotNull(pending.getDeletedAt());
            assertTrue(pending.isCleanupPending());
            assertEquals(0,pending.getCleanupFailureCount(),"The database deletion marker commits before file cleanup runs.");
            var retained=submissions.findByPublicId(submitted.id()).orElseThrow();
            assertNotNull(retained.getStoredFilename(),"A failed path must be retained for cleanup retry.");
            ApiException cannotPurge=assertThrows(ApiException.class,
                ()->admin.clearBatchBin(actor.getPublicId(),List.of(batch.getPublicId())));
            assertEquals("BATCH_CLEANUP_PENDING",cannotPurge.getCode());
        }finally{
            Files.deleteIfExists(blocker);Files.deleteIfExists(source);
        }
    }

    private KidsChampResponse submit(String child,String city,byte[] image){
        var response=kidsChamp.submit(null,null,child,LocalDate.now().minusYears(9),"ZIP Test Parent",null,
            "+9479"+String.format("%07d",Math.floorMod(UUID.randomUUID().hashCode(),10_000_000)),"LK","Central",city,
            "Drawing","ZIP test","Isolated regression record",true,false,
            new MockMultipartFile("photo","zip-test.jpg","image/jpeg",image));
        photos.add(submissions.findByPublicId(response.id()).orElseThrow().getStoredFilename());
        entityManager.flush();entityManager.clear();
        return response;
    }

    private static byte[] jpegBytes() throws Exception {
        var image=new BufferedImage(6,4,BufferedImage.TYPE_INT_RGB);Graphics2D graphics=image.createGraphics();
        try{graphics.setColor(Color.ORANGE);graphics.fillRect(0,0,image.getWidth(),image.getHeight());}finally{graphics.dispose();}
        var output=new ByteArrayOutputStream();assertTrue(ImageIO.write(image,"jpg",output));return output.toByteArray();
    }

    private static byte[] pngBytes() throws Exception {
        var image=new BufferedImage(6,4,BufferedImage.TYPE_INT_RGB);Graphics2D graphics=image.createGraphics();
        try{graphics.setColor(Color.BLUE);graphics.fillRect(0,0,image.getWidth(),image.getHeight());}finally{graphics.dispose();}
        var output=new ByteArrayOutputStream();assertTrue(ImageIO.write(image,"png",output));return output.toByteArray();
    }

    private static KidsChampAdminService.SettingsRequest request(KidsChampAdminService.SettingsResponse value,int count,int expiry,KidsChampAdminService.ZipQueueCountPolicy policy){
        return new KidsChampAdminService.SettingsRequest(value.categories(),value.maxFileSizeMb(),value.allowedFileTypes(),value.minimumAge(),value.maximumAge(),
            value.dailyTelecastLimit(),value.defaultTelecastTime(),count,expiry,Math.min(value.zipWarningDays(),expiry-1),
            value.frequentParticipantThreshold(),value.requireWhatsAppConsent(),value.campaignLimit(),value.defaultMessage(),policy);
    }

    private static void assertSameInstant(java.time.Instant expected,java.time.Instant actual){
        assertTrue(Math.abs(Duration.between(expected,actual).toNanos())<1_000_000);
    }
}
