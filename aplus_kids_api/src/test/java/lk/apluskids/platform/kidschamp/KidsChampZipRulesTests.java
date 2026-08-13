package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;
import javax.imageio.ImageIO;
import jakarta.persistence.LockModeType;
import jakarta.persistence.Version;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.data.jpa.repository.Lock;

class KidsChampZipRulesTests {
    @Test
    void activeQueueCanReplaceItsPhotoCountWithoutAMaximumRule() {
        var settings=new KidsChampSettingsEntity();
        settings.startActiveZip(250);
        settings.replaceActiveZipTarget(25_000);
        assertEquals(25_000,settings.getActiveZipTargetSize());
        assertNotNull(settings.getActiveZipStartedAt());
    }

    @Test
    void generationSnapshotsRetentionAndDownloadDoesNotRestartIt() {
        var batch=new KidsChampBatchEntity();
        Instant before=Instant.now();
        batch.startRetention(14,2);
        Instant generatedExpiry=batch.getDeleteAfter();
        assertEquals(14,batch.getRetentionDays());
        assertEquals(2,batch.getWarningDays());
        assertTrue(generatedExpiry.isAfter(before.plusSeconds(13L*24*60*60)));
        batch.markDownloaded();
        assertEquals(generatedExpiry,batch.getDeleteAfter());
        assertNotNull(batch.getFirstDownloadedAt());
    }

    @Test
    void retentionMigrationNeverOverwritesAnExistingExpiry() throws Exception {
        try(var input=getClass().getResourceAsStream("/db/migration/V29__snapshot_zip_retention_and_queue_eligibility.sql")){
            assertNotNull(input);
            String sql=new String(input.readAllBytes(),StandardCharsets.UTF_8).replaceAll("\\s+"," ").toLowerCase();
            assertTrue(sql.contains("where deleted_at is null and delete_after is null"));
        }
    }

    @Test
    void legacyExpiryRealignmentUsesTheSnapshotWithoutExtendingEarlierDeadlines() throws Exception {
        try(var input=getClass().getResourceAsStream("/db/migration/V33__realign_active_zip_expiry_to_snapshot.sql")){
            assertNotNull(input);
            String sql=new String(input.readAllBytes(),StandardCharsets.UTF_8).replaceAll("\\s+"," ").toLowerCase();
            assertTrue(sql.contains("else least( delete_after, created_at + make_interval(days => retention_days) )"));
            assertTrue(sql.contains("where deleted_at is null"));
        }
    }

    @Test
    void batchMutationsAndExpiryUseDatabaseLocksAndOptimisticVersioning() throws Exception {
        var byId=KidsChampBatchRepository.class.getDeclaredMethod("findLockedByPublicId",UUID.class);
        var expired=KidsChampBatchRepository.class.getDeclaredMethod("findExpiredForUpdate",Instant.class);
        var submission=KidsChampSubmissionRepository.class.getDeclaredMethod("findLockedByPublicId",UUID.class);
        var members=KidsChampSubmissionRepository.class.getDeclaredMethod("findAllByBatchPublicIdForUpdate",UUID.class);
        assertEquals(LockModeType.PESSIMISTIC_WRITE,byId.getAnnotation(Lock.class).value());
        assertEquals(LockModeType.PESSIMISTIC_WRITE,expired.getAnnotation(Lock.class).value());
        assertEquals(LockModeType.PESSIMISTIC_WRITE,submission.getAnnotation(Lock.class).value());
        assertEquals(LockModeType.PESSIMISTIC_WRITE,members.getAnnotation(Lock.class).value());
        assertNotNull(KidsChampBatchEntity.class.getDeclaredField("version").getAnnotation(Version.class));
        assertNotNull(KidsChampSubmissionEntity.class.getDeclaredField("version").getAnnotation(Version.class));
        try(var input=getClass().getResourceAsStream("/db/migration/V30__protect_zip_batch_mutations.sql")){
            assertNotNull(input);
            assertTrue(new String(input.readAllBytes(),StandardCharsets.UTF_8).toLowerCase().contains("add column version bigint not null"));
        }
    }

    @Test
    void archivePhotoNamesUseQueuePositionAndPng() {
        assertEquals("001_Kasun Perera_Kandy.png",KidsChampAdminService.zipPhotoName(1,"Kasun Perera","Kandy"));
        assertEquals("620_Nethmi_Galle.png",KidsChampAdminService.zipPhotoName(620,"Nethmi","Galle"));
        assertEquals("002_O Neil_New City.png",KidsChampAdminService.zipPhotoName(2,"O'Neil","New/City"));
    }

    @Test
    void spreadsheetFormulaPrefixesAreNeutralizedInTheManifest() {
        assertEquals("\"'=SUM(1,1)\"",KidsChampAdminService.csv("=SUM(1,1)"));
        assertEquals("\"'  @IMPORTXML(x)\"",KidsChampAdminService.csv("  @IMPORTXML(x)"));
        assertEquals("\"Kasun\"",KidsChampAdminService.csv("Kasun"));
        assertEquals("\"He said \"\"hello\"\"\"",KidsChampAdminService.csv("He said \"hello\""));
    }

    @Test
    void pendingPhotoCleanupIsNeverReportedAsAvailable() {
        var submission=new KidsChampSubmissionEntity();
        submission.setStoredFilename("retry-me.png");
        assertTrue(submission.isPhotoAvailable());
        submission.markPhotoDeletionPending();
        assertFalse(submission.isPhotoAvailable());
    }

    @Test
    void jpegArtworkIsConvertedToPngBytes() throws Exception {
        var source=java.nio.file.Files.createTempFile("kids-champ-source-",".jpg");
        try{
            var image=new BufferedImage(2,2,BufferedImage.TYPE_INT_RGB);
            assertTrue(ImageIO.write(image,"jpg",source.toFile()));
            var converted=new ByteArrayOutputStream();
            KidsChampAdminService.writePng(source,converted,"TEST-001");
            assertArrayEquals(new byte[]{(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a},Arrays.copyOf(converted.toByteArray(),8));
        }finally{java.nio.file.Files.deleteIfExists(source);}
    }

    @Test
    void storageRejectsCorruptImageBytesBeforeTheyCanPersist() throws Exception {
        var root=java.nio.file.Files.createTempDirectory("kids-champ-storage-");
        try{
            var storage=new KidsChampStorage(root.toString());
            var corrupt=new MockMultipartFile("photo","fake.png","image/png",new byte[]{1,2,3,4});
            var error=assertThrows(lk.apluskids.platform.common.error.ApiException.class,()->storage.store(corrupt));
            assertEquals("PHOTO_INVALID",error.getCode());
            try(var files=java.nio.file.Files.list(root)){assertEquals(0,files.count());}
        }finally{java.nio.file.Files.deleteIfExists(root);}
    }

    @Test
    void uploadPolicyMatchesTheFileTypesThatStorageActuallySupports() throws Exception {
        assertTrue(KidsChampStorage.supportsAllowedFileTypes("PNG, jpeg, JPG"));
        assertFalse(KidsChampStorage.supportsAllowedFileTypes("JPG, JPEG, PNG, WEBP"));
        assertFalse(KidsChampStorage.supportsAllowedFileTypes("WEBP"));
        assertEquals("JPG, JPEG, PNG", KidsChampStorage.ALLOWED_FILE_TYPES);
        try(var input=getClass().getResourceAsStream("/db/migration/V34__normalize_kids_champ_upload_file_types.sql")){
            assertNotNull(input);
            String sql=new String(input.readAllBytes(),StandardCharsets.UTF_8);
            assertTrue(sql.contains("allowed_file_types = 'JPG, JPEG, PNG'"));
            assertTrue(sql.contains("CHECK (allowed_file_types = 'JPG, JPEG, PNG')"));
        }
    }

    @Test
    void publicLiveUpdatePayloadCannotExposeAdminEntityDetails(){
        var components=KidsChampLiveUpdates.PublicUpdate.class.getRecordComponents();
        assertEquals(java.util.List.of("signal","occurredAt"),
            java.util.Arrays.stream(components).map(java.lang.reflect.RecordComponent::getName).toList());
    }

    @Test
    void staleAdminEventClientCannotTurnAnEditedToggleIntoAnError(){
        var updates=new KidsChampLiveUpdates();
        var stale=updates.connectAdmin();
        stale.complete();
        assertDoesNotThrow(()->updates.publish("BATCH_EDITED_STATUS_UPDATED","BATCH",UUID.randomUUID()));
    }
}
