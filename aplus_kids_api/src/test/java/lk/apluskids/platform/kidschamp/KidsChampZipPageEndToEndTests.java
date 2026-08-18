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
import java.util.concurrent.atomic.AtomicInteger;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.transaction.AfterTransaction;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class KidsChampZipPageEndToEndTests {
    @Autowired KidsChampAdminService admin;
    @Autowired KidsChampService kidsChamp;
    @Autowired KidsChampSubmissionRepository submissions;
    @Autowired KidsChampBatchRepository batches;
    @Autowired KidsChampSettingsRepository settings;
    @Autowired KidsChampStorage storage;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;

    private final List<String> testPhotos = new ArrayList<>();
    private final Set<Path> testArchives = new HashSet<>();
    private final AtomicInteger phoneSequence = new AtomicInteger();
    private UserEntity actor;
    private int originalBatchSize;

    @BeforeEach
    void isolateQueueAndSelectAdmin() {
        actor = users.findAll().stream().filter(user -> user.getRoles().stream().anyMatch(role ->
            "ROLE_ADMIN".equals(role.getName()) || "ROLE_SUPER_ADMIN".equals(role.getName())))
            .findFirst().orElseThrow();
        originalBatchSize = admin.settings().zipBatchSize();

        submissions.findAll().stream()
            .filter(item -> item.getBatch() == null)
            .forEach(item -> item.review(ReviewStatus.SUBMITTED, null, actor));
        settings.findById((short) 1).orElseThrow().completeActiveZip();
        assertEquals(0, admin.zipProgress().readyPhotos());
    }

    @AfterEach
    void removeOnlyFilesCreatedByThisTest() {
        testPhotos.forEach(storage::delete);
        testArchives.forEach(path -> storage.deletePath(path.toString()));
    }

    @AfterTransaction
    void confirmsDatabaseRollbackAndSettingsRestoration() {
        assertEquals(originalBatchSize, admin.settings().zipBatchSize());
        assertTrue(submissions.findAll().stream().noneMatch(item -> item.getChildName().startsWith("Zip Test")));
    }

    @Test
    void exercisesTheCompleteZipPageWorkflowWithoutChangingExistingRecords() throws Exception {
        var originalSettings = admin.settings();
        long originalSubmissionCount = submissions.count();
        Set<UUID> originalBatchIds = batches.findAll().stream().map(KidsChampBatchEntity::getPublicId).collect(java.util.stream.Collectors.toSet());

        ApiException zero = assertThrows(ApiException.class,
            () -> admin.updateSettings(actor.getPublicId(), request(originalSettings, 0, KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW)));
        assertEquals("SETTINGS_INVALID", zero.getCode());

        admin.updateSettings(actor.getPublicId(), request(originalSettings, 3, KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        assertEquals(3, admin.settings().zipBatchSize());
        assertEquals(3, admin.zipProgress().activeTargetSize());

        var first = submit("Zip Test Child One", "Kandy");
        var second = submit("Zip Test Child O'Neil", "New/City");
        var third = submit("Zip Test Child Three", "Galle");
        approve(first);
        approve(second);
        assertEquals(2, admin.zipProgress().readyPhotos());
        assertTrue(newBatchIds(originalBatchIds).isEmpty(), "A ZIP must not be created below the active target.");

        ApiException decision = assertThrows(ApiException.class,
            () -> admin.updateSettings(actor.getPublicId(), request(admin.settings(), 2, null)));
        assertEquals("ZIP_QUEUE_COUNT_DECISION_REQUIRED", decision.getCode());
        assertFalse(decision.getMessage().toLowerCase().contains("exception"));

        admin.updateSettings(actor.getPublicId(), request(admin.settings(), 2, KidsChampAdminService.ZipQueueCountPolicy.KEEP_CURRENT));
        assertEquals(3, admin.zipProgress().activeTargetSize());
        assertEquals(2, admin.zipProgress().nextTargetSize());

        approve(third);
        var automaticThree = singleNewBatch(originalBatchIds, 3);
        originalBatchIds.add(automaticThree.id());
        assertEquals(0, admin.zipProgress().readyPhotos());
        assertEquals(2, admin.zipProgress().activeTargetSize());
        assertNotNull(automaticThree.deleteAfter(), "Retention must start when the ZIP is generated.");

        var fourth = submit("Zip Test Child Four", "Matara");
        var fifth = submit("Zip Test Child Five", "Badulla");
        approve(fourth);
        assertEquals(1, admin.zipProgress().readyPhotos());
        approve(fifth);
        var automaticTwo = singleNewBatch(originalBatchIds, 2);
        originalBatchIds.add(automaticTwo.id());

        var sixth = submit("Zip Test Child Six", "Jaffna");
        approve(sixth);
        assertEquals(1, admin.zipProgress().readyPhotos());
        admin.updateSettings(actor.getPublicId(), request(admin.settings(), 1, KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        var automaticOne = singleNewBatch(originalBatchIds, 1);
        originalBatchIds.add(automaticOne.id());
        assertEquals(0, admin.zipProgress().readyPhotos());

        admin.updateSettings(actor.getPublicId(), request(admin.settings(), 25_000, KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        assertEquals(25_000, admin.settings().zipBatchSize(), "The former 500-photo maximum must not apply.");

        List<UUID> orderBeforeDownload = admin.batches().stream().map(KidsChampAdminService.BatchResponse::id).toList();
        var generatedExpiry = automaticThree.deleteAfter();
        var download = admin.download(actor.getPublicId(), automaticThree.id());
        testArchives.add(download.path());
        assertTrue(Files.isRegularFile(download.path()));
        assertTrue(download.filename().endsWith(".zip"));
        assertArchive(automaticThree.id(), download.path(), 3);
        assertEquals(orderBeforeDownload, admin.batches().stream().map(KidsChampAdminService.BatchResponse::id).toList(),
            "Downloading must not reorder ZIP records.");
        var downloadedThree = batch(automaticThree.id());
        assertNotNull(downloadedThree.firstDownloadedAt());
        assertSameDatabaseInstant(generatedExpiry, downloadedThree.deleteAfter(), "Downloading must not restart retention.");

        var secondDownload = admin.download(actor.getPublicId(), automaticThree.id());
        testArchives.add(secondDownload.path());
        assertSameDatabaseInstant(generatedExpiry, batch(automaticThree.id()).deleteAfter(), "Repeated downloads must not restart retention.");

        assertEquals("BATCH_DOWNLOAD_REQUIRED", assertThrows(ApiException.class,
            () -> admin.setEdited(actor.getPublicId(), automaticTwo.id(), true)).getCode());
        assertNotNull(admin.setEdited(actor.getPublicId(), automaticThree.id(), true).editedAt());
        assertNull(admin.setEdited(actor.getPublicId(), automaticThree.id(), false).editedAt());

        LocalDate telecast = LocalDate.now().plusDays(5);
        assertEquals("TELECAST_DATE_PAST", assertThrows(ApiException.class,
            () -> admin.schedule(actor.getPublicId(), automaticThree.id(), LocalDate.now().minusDays(1), null)).getCode());
        assertEquals("ALTERNATE_TELECAST_INVALID", assertThrows(ApiException.class,
            () -> admin.schedule(actor.getPublicId(), automaticThree.id(), telecast, telecast.minusDays(1))).getCode());
        var scheduled = admin.schedule(actor.getPublicId(), automaticThree.id(), telecast, telecast.plusDays(1));
        assertEquals(telecast, scheduled.telecastDate());
        assertEquals(telecast.plusDays(1), scheduled.alternateTelecastDate());
        assertNotNull(admin.completeTelecast(actor.getPublicId(), automaticThree.id()).telecastCompletedAt());

        assertEquals("BATCH_DOWNLOAD_REQUIRED", assertThrows(ApiException.class,
            () -> admin.deleteBatch(actor.getPublicId(), automaticTwo.id())).getCode());
        var twoItems = submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(automaticTwo.id());
        List<String> preservedNames = twoItems.stream().map(KidsChampSubmissionEntity::getChildName).toList();
        List<String> preservedParents = twoItems.stream().map(KidsChampSubmissionEntity::getParentName).toList();
        var twoDownload = admin.download(actor.getPublicId(), automaticTwo.id());
        testArchives.add(twoDownload.path());
        Path twoArchive = twoDownload.path();
        admin.deleteBatch(actor.getPublicId(), automaticTwo.id());
        assertFalse(Files.exists(twoArchive));
        var deletedTwo = batch(automaticTwo.id());
        assertNotNull(deletedTwo.deletedAt());
        assertTrue(admin.batches().stream().anyMatch(item -> item.id().equals(automaticTwo.id()) && item.deletedAt() != null));
        var preservedTwoItems = submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(automaticTwo.id());
        assertEquals(preservedNames, preservedTwoItems.stream().map(KidsChampSubmissionEntity::getChildName).toList());
        assertEquals(preservedParents, preservedTwoItems.stream().map(KidsChampSubmissionEntity::getParentName).toList());
        assertTrue(preservedTwoItems.stream().allMatch(item -> item.getStoredFilename() == null && "MISSING".equals(item.getFileStatus())));
        admin.clearBatchBin(actor.getPublicId(), List.of(automaticTwo.id()));
        assertNotNull(batches.findByPublicId(automaticTwo.id()).orElseThrow().getPurgedAt());
        assertTrue(admin.batches().stream().noneMatch(item -> item.id().equals(automaticTwo.id())));

        admin.updateSettings(actor.getPublicId(), request(admin.settings(), 10, KidsChampAdminService.ZipQueueCountPolicy.APPLY_NEW));
        var seventh = submit("Zip Test Manual Seven", "Colombo");
        var eighth = submit("Zip Test Manual Eight", "Kurunegala");
        approve(seventh);
        approve(eighth);
        assertEquals("REMAINDER_CONFIRMATION_REQUIRED", assertThrows(ApiException.class,
            () -> admin.createBatch(actor.getPublicId(), 10, false)).getCode());
        var remainder = admin.createBatch(actor.getPublicId(), 10, true);
        assertEquals(2, remainder.photoCount());
        originalBatchIds.add(remainder.id());

        var ninth = submit("Zip Test Selected Nine", "Kegalle");
        var tenth = submit("Zip Test Unapproved Ten", "Kalutara");
        approve(ninth);
        assertEquals("APPROVAL_REQUIRED", assertThrows(ApiException.class,
            () -> admin.createSelectedBatch(actor.getPublicId(), List.of(ninth.id(), tenth.id()), "ZIP page regression test")).getCode());
        var selected = admin.createSelectedBatch(actor.getPublicId(), List.of(ninth.id()), "ZIP page regression test");
        assertEquals(1, selected.photoCount());
        originalBatchIds.add(selected.id());
        assertEquals("ALREADY_BATCHED", assertThrows(ApiException.class,
            () -> admin.createSelectedBatch(actor.getPublicId(), List.of(ninth.id()), "Duplicate attempt")).getCode());

        KidsChampBatchEntity expiringEntity = batches.findByPublicId(remainder.id()).orElseThrow();
        String expiringPath = expiringEntity.getArchivePath();
        testArchives.add(Path.of(expiringPath));
        entityManager.flush();
        jdbc.update("update kids_champ_batches set delete_after = now() - interval '1 minute' where public_id = ?", remainder.id());
        entityManager.clear();
        admin.deleteExpired();
        var expired = batch(remainder.id());
        assertNotNull(expired.deletedAt());
        assertFalse(Files.exists(Path.of(expiringPath)));
        var expiredItems = submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(remainder.id());
        assertTrue(expiredItems.stream().allMatch(item -> item.getStoredFilename() == null));
        assertTrue(expiredItems.stream().allMatch(item -> item.getChildName() != null && item.getParentName() != null));

        assertEquals(originalSubmissionCount + 10, submissions.count(), "The test transaction should contain exactly its ten dedicated submissions.");
        assertEquals(10, submissions.findAll().stream().filter(item -> item.getChildName().startsWith("Zip Test")).count());
    }

    @Test
    void manualZipSkipsApprovedRowsWithoutAvailableArtwork() throws Exception {
        var response = submit("Zip Test Missing Artwork", "Kandy");
        approve(response);
        KidsChampSubmissionEntity missingArtwork = submissions.findByPublicId(response.id()).orElseThrow();
        missingArtwork.setStoredFilename(null);
        entityManager.flush();

        ApiException error = assertThrows(ApiException.class,
            () -> admin.createBatch(actor.getPublicId(), 1, true));

        assertEquals("NO_PHOTOS", error.getCode());
        assertTrue(error.getMessage().contains("available artwork"));
    }

    private KidsChampResponse submit(String childName, String hometown) throws Exception {
        int phone = Math.floorMod(UUID.randomUUID().hashCode() + phoneSequence.incrementAndGet(), 10_000_000);
        var response = kidsChamp.submit(
            null, null, childName, LocalDate.now().minusYears(9), "ZIP Test Parent", null,
            "+9479" + String.format("%07d", phone), "LK", "Central", hometown,
            "Drawing", "ZIP regression artwork", "Generated only for an isolated ZIP-page test",
            true, false, new MockMultipartFile("photo", "zip-test.jpg", "image/jpeg", jpegBytes())
        );
        var saved = submissions.findByPublicId(response.id()).orElseThrow();
        testPhotos.add(saved.getStoredFilename());
        entityManager.flush();
        entityManager.clear();
        return response;
    }

    private void approve(KidsChampResponse response) {
        admin.review(actor.getPublicId(), response.id(), ReviewStatus.APPROVED, null);
    }

    private byte[] jpegBytes() throws Exception {
        var image = new BufferedImage(6, 4, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setColor(Color.ORANGE);
            graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
        } finally {
            graphics.dispose();
        }
        var output = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(image, "jpg", output));
        return output.toByteArray();
    }

    private void assertArchive(UUID batchId, Path archive, int photoCount) throws Exception {
        var items = submissions.findAllByBatchPublicIdOrderBySubmittedAtAscIdAsc(batchId);
        try (var zip = new ZipFile(archive.toFile())) {
            assertEquals(photoCount + 1, zip.size());
            assertNotNull(zip.getEntry("submissions.csv"));
            List<String> expectedNames = new ArrayList<>();
            for (int index = 0; index < items.size(); index++) {
                expectedNames.add(KidsChampAdminService.zipPhotoName(index + 1, items.get(index).getChildName(), items.get(index).getHometown()));
            }
            List<String> actualNames = zip.stream().map(java.util.zip.ZipEntry::getName)
                .filter(name -> !"submissions.csv".equals(name)).toList();
            assertEquals(expectedNames, actualNames, "ZIP entries must follow the deterministic oldest-first batch order.");
            for (int index = 0; index < items.size(); index++) {
                var item = items.get(index);
                String expectedName = KidsChampAdminService.zipPhotoName(index + 1, item.getChildName(), item.getHometown());
                var entry = zip.getEntry(expectedName);
                assertNotNull(entry, expectedName);
                try (var input = zip.getInputStream(entry)) {
                    assertArrayEquals(new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}, input.readNBytes(8));
                }
            }
            assertNotNull(zip.getEntry("002_Zip Test Child O Neil_New City.png"));
            try (var csv = zip.getInputStream(zip.getEntry("submissions.csv"))) {
                String content = new String(csv.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                assertTrue(content.contains("tracking_code,child_name"));
                items.forEach(item -> assertTrue(content.contains(item.getTrackingCode())));
            }
        }
    }

    private Set<UUID> newBatchIds(Set<UUID> previous) {
        return batches.findAll().stream().map(KidsChampBatchEntity::getPublicId)
            .filter(id -> !previous.contains(id)).collect(java.util.stream.Collectors.toSet());
    }

    private KidsChampAdminService.BatchResponse singleNewBatch(Set<UUID> previous, int expectedPhotos) {
        var ids = newBatchIds(previous);
        assertEquals(1, ids.size());
        var result = batch(ids.iterator().next());
        assertEquals(expectedPhotos, result.photoCount());
        return result;
    }

    private KidsChampAdminService.BatchResponse batch(UUID id) {
        return admin.batches().stream().filter(item -> item.id().equals(id)).findFirst().orElseThrow();
    }

    private void assertSameDatabaseInstant(java.time.Instant expected, java.time.Instant actual, String message) {
        assertTrue(Math.abs(Duration.between(expected, actual).toNanos()) < 1_000_000, message);
    }

    private static KidsChampAdminService.SettingsRequest request(
        KidsChampAdminService.SettingsResponse value,
        int count,
        KidsChampAdminService.ZipQueueCountPolicy policy
    ) {
        return new KidsChampAdminService.SettingsRequest(
            value.categories(), value.maxFileSizeMb(), value.allowedFileTypes(), value.minimumAge(), value.maximumAge(),
            value.dailyTelecastLimit(), value.defaultTelecastTime(), count, value.zipExpiryDays(), value.zipWarningDays(),
            value.frequentParticipantThreshold(), value.requireWhatsAppConsent(), value.campaignLimit(), value.defaultMessage(), policy
        );
    }
}
