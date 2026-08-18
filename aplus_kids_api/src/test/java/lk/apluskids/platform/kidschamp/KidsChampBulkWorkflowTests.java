package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import java.util.zip.ZipFile;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.UserRepository;
import lk.apluskids.platform.child.ChildProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@SpringBootTest
@Transactional
class KidsChampBulkWorkflowTests {
    @Autowired KidsChampAdminService admin;
    @Autowired KidsChampGuestContactRepository guests;
    @Autowired KidsChampSubmissionRepository submissions;
    @Autowired UserRepository users;
    @Autowired KidsChampStorage storage;
    @Autowired KidsChampService kidsChamp;
    @Autowired ChildProfileRepository children;
    @Autowired KidsChampAdminController adminController;

    @Test
    void rejectsAuthenticatedNonAdminUsersFromAdminEndpoints() {
        var user = users.findAll().stream().findFirst().orElseThrow();
        var jwt = Jwt.withTokenValue("test-token")
            .header("alg", "none")
            .subject(user.getPublicId().toString())
            .claim("roles", List.of("ROLE_USER"))
            .build();

        ApiException denied = assertThrows(ApiException.class,
            () -> adminController.submissions(new JwtAuthenticationToken(jwt)));
        assertEquals("ADMIN_REQUIRED", denied.getCode());
    }

    @Test
    void authenticatedSubmissionUsesTheOwnedChildAndAccountDetails() {
        var child = children.findAll().stream().findFirst().orElseThrow();
        var user = child.getUser();
        var photo = new MockMultipartFile("photo", "drawing.png", "image/png", new byte[]{1, 2, 3, 4});

        var created = kidsChamp.submit(
            user.getPublicId(), child.getPublicId(), "Spoofed child", LocalDate.of(2000, 1, 1),
            "Spoofed parent", "spoofed@example.com", "+94770000999", "US",
            "Wrong province", "Wrong town", "Drawing", "My drawing", "Created at home",
            true, true, photo
        );

        var saved = submissions.findByTrackingCodeIgnoreCase(created.trackingCode()).orElseThrow();
        assertEquals(user.getPublicId(), saved.getUser().getPublicId());
        assertEquals(child.getPublicId(), saved.getChildProfile().getPublicId());
        assertEquals(child.getFullName(), saved.getChildName());
        assertEquals(user.getAccountHolderName(), saved.getParentName());
        assertEquals(user.getEmail(), saved.getEmail());
        assertEquals(child.getHometown(), saved.getHometown());
        assertNotNull(saved.getWhatsappConsentAt());
        storage.delete(saved.getStoredFilename());
    }

    @Test
    void verifiedAccountCanClaimMatchingGuestHistoryOnceForAnOwnedChild() {
        var child = children.findAll().stream()
            .filter(item -> item.getUser().getEmailVerifiedAt() != null)
            .findFirst().orElseThrow();
        var user = child.getUser();
        var phone = "+9471" + String.format("%07d", Math.abs(UUID.randomUUID().hashCode()) % 10_000_000);
        var photo = new MockMultipartFile("photo", "guest-drawing.png", "image/png", new byte[]{5, 6, 7});

        var guestSubmission = kidsChamp.submit(
            null, null, "Earlier guest child", LocalDate.now().minusYears(8),
            user.getAccountHolderName(), user.getEmail(), phone, "LK",
            "Western", "Colombo", "Drawing", "Earlier work", null,
            true, false, photo
        );
        var stored = submissions.findByTrackingCodeIgnoreCase(guestSubmission.trackingCode()).orElseThrow();
        var guestId = stored.getGuestContact().getPublicId();

        var tracked = kidsChamp.track("  " + guestSubmission.trackingCode().toLowerCase() + "  ");
        assertEquals(guestSubmission.id(), tracked.id());
        assertEquals(guestSubmission.trackingCode(), tracked.trackingCode());

        assertTrue(kidsChamp.claimable(user.getPublicId()).stream().anyMatch(item -> item.id().equals(guestId)));
        var claimed = kidsChamp.claim(user.getPublicId(), guestId, child.getPublicId());
        assertEquals(1, claimed.size());
        assertEquals(child.getPublicId(), claimed.getFirst().childId());
        assertTrue(kidsChamp.claimable(user.getPublicId()).stream().noneMatch(item -> item.id().equals(guestId)));
        ApiException repeated = assertThrows(ApiException.class,
            () -> kidsChamp.claim(user.getPublicId(), guestId, child.getPublicId()));
        assertEquals("GUEST_HISTORY_NOT_FOUND", repeated.getCode());
        storage.delete(stored.getStoredFilename());
    }

    @Test
    void rejectsInvalidPublicSubmissionFieldsBeforeCreatingARecord() {
        var photo = new MockMultipartFile("photo", "drawing.png", "image/png", new byte[]{8, 9});
        long before = submissions.count();

        ApiException consent = assertThrows(ApiException.class, () -> kidsChamp.submit(
            null, null, "Child", LocalDate.now().minusYears(7), "Parent", null, "+94771234567",
            "LK", "Western", "Colombo", "Drawing", null, null, false, false, photo));
        assertEquals("CONSENT_REQUIRED", consent.getCode());

        ApiException phone = assertThrows(ApiException.class, () -> kidsChamp.submit(
            null, null, "Child", LocalDate.now().minusYears(7), "Parent", null, "0771234567",
            "LK", "Western", "Colombo", "Drawing", null, null, true, false, photo));
        assertEquals("PHONE_INVALID", phone.getCode());

        ApiException category = assertThrows(ApiException.class, () -> kidsChamp.submit(
            null, null, "Child", LocalDate.now().minusYears(7), "Parent", null, "+94771234567",
            "LK", "Western", "Colombo", "Unknown", null, null, true, false, photo));
        assertEquals("CATEGORY_INVALID", category.getCode());
        assertEquals(before, submissions.count());
    }

    @Test
    void verifiesGuestDeduplicationBatchLimitRemainderZipAndRetention() throws Exception {
        var guest = guests.findByPhoneE164("+94770000001").orElseThrow();
        assertEquals(105, guest.getSubmissionCount());

        var actor = users.findAll().stream().findFirst().orElseThrow();
        var samples = submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream()
            .filter(item -> item.getChildName().startsWith("Bulk Sample Child "))
            .toList();
        assertEquals(105, samples.size());
        samples.forEach(item -> {
            item.setBatch(null);
            admin.review(actor.getPublicId(), item.getPublicId(), ReviewStatus.APPROVED, null);
        });

        var first = admin.createBatch(actor.getPublicId(), 100, false);
        assertEquals(100, first.photoCount());
        assertNotNull(first.deleteAfter(), "New ZIP retention must start when the archive is generated.");
        ApiException remainder = assertThrows(ApiException.class,
            () -> admin.createBatch(actor.getPublicId(), 100, false));
        assertEquals("REMAINDER_CONFIRMATION_REQUIRED", remainder.getCode());

        var second = admin.createBatch(actor.getPublicId(), 100, true);
        assertEquals(5, second.photoCount());
        ApiException downloadRequired = assertThrows(ApiException.class,
            () -> admin.deleteBatch(actor.getPublicId(), second.id()));
        assertEquals("BATCH_DOWNLOAD_REQUIRED", downloadRequired.getCode());

        var download = admin.download(actor.getPublicId(), first.id());
        try (ZipFile zip = new ZipFile(download.path().toFile())) {
            assertEquals(101, zip.size());
            assertNotNull(zip.getEntry("submissions.csv"));
        } finally {
            storage.deletePath(download.path().toString());
            storage.deletePath(storage.archive(second.batchCode()).toString());
        }

        var refreshed = admin.batches().stream().filter(batch -> batch.id().equals(first.id())).findFirst().orElseThrow();
        assertNotNull(refreshed.deleteAfter());
        assertEquals(first.deleteAfter(), refreshed.deleteAfter(), "Downloading must not restart ZIP retention.");
        assertEquals(admin.settings().zipExpiryDays(), refreshed.daysRemaining());
    }

    @Test
    void createsAnExactSelectionBatchAndPersistsOperationalUpdates() throws Exception {
        var actor = users.findAll().stream().findFirst().orElseThrow();
        var samples = submissions.findAllByDeletedAtIsNullOrderBySubmittedAtDesc().stream()
            .filter(item -> item.getChildName().startsWith("Bulk Sample Child "))
            .limit(2)
            .toList();
        assertEquals(2, samples.size());
        samples.forEach(item -> {
            item.setBatch(null);
            admin.review(actor.getPublicId(), item.getPublicId(), ReviewStatus.APPROVED, null);
            admin.update(actor.getPublicId(), item.getPublicId(), "Painting", "Ready for production", actor.getPublicId(), true);
        });
        var batch = admin.createSelectedBatch(actor.getPublicId(), samples.stream().map(KidsChampSubmissionEntity::getPublicId).toList());
        assertEquals(2, batch.photoCount());
        var download = admin.download(actor.getPublicId(), batch.id());
        try (ZipFile zip = new ZipFile(download.path().toFile())) {
            assertEquals(3, zip.size());
            assertNotNull(zip.getEntry("submissions.csv"));
            var orderedSamples = samples.stream().sorted(Comparator.comparing(KidsChampSubmissionEntity::getSubmittedAt)).toList();
            for(int index=0;index<orderedSamples.size();index++){
                var sample=orderedSamples.get(index);
                var entry=zip.getEntry(KidsChampAdminService.zipPhotoName(index+1,sample.getChildName(),sample.getHometown()));
                assertNotNull(entry);
                try(var image=zip.getInputStream(entry)){
                    assertArrayEquals(new byte[]{(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a},image.readNBytes(8));
                }
            }
        } finally {
            storage.deletePath(download.path().toString());
        }
        var telecastDate = LocalDate.now().plusDays(7);
        var alternateDate = telecastDate.plusDays(1);
        var scheduled = admin.schedule(actor.getPublicId(), batch.id(), telecastDate, alternateDate);
        assertEquals(telecastDate, scheduled.telecastDate());
        assertEquals(alternateDate, scheduled.alternateTelecastDate());
        samples.forEach(item -> {
            var refreshed = submissions.findByPublicId(item.getPublicId()).orElseThrow();
            assertEquals(TelecastStatus.SCHEDULED, refreshed.getTelecastStatus());
        });
        ApiException protectedSubmission = assertThrows(ApiException.class,
            () -> admin.deleteSubmission(actor.getPublicId(), samples.getFirst().getPublicId()));
        assertEquals("SUBMISSION_BATCHED", protectedSubmission.getCode());
    }

    @Test
    void persistsSharedSettingsCalendarTasksAndAuditActivity() {
        var actor = users.findAll().stream().findFirst().orElseThrow();
        var updated = admin.updateSettings(actor.getPublicId(), new KidsChampAdminService.SettingsRequest(
            List.of("Drawing", "Painting", "Handcraft"), 8, "JPG,JPEG,PNG", 4, 16, 12,
            LocalTime.of(15, 0), 100, 10, 2, 4, false, 250, "Hello {name}"
        ));
        assertEquals(16, updated.maximumAge());
        var task = admin.createTask(actor.getPublicId(), LocalDate.now(), "Production check", "Review approved entries");
        assertFalse(task.completedAt() != null);
        var completed = admin.completeTask(actor.getPublicId(), task.id(), true);
        assertNotNull(completed.completedAt());
        assertTrue(admin.activity().stream().anyMatch(item -> item.action().equals("CALENDAR_TASK_UPDATED")));
        var participant = admin.participants().stream().findFirst().orElseThrow();
        var campaign = admin.createCampaign(actor.getPublicId(), "WHATSAPP", "Hello {name}, ref {reference}", List.of(participant.id()));
        assertEquals("QUEUED", campaign.status());
        assertEquals(1, campaign.recipientCount());
        admin.deleteTask(actor.getPublicId(), task.id());
    }
}
