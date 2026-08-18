package lk.apluskids.platform.kidschamp;

import static org.junit.jupiter.api.Assertions.*;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.util.Arrays;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

class KidsChampZipRulesTests {
    @Test
    void activeQueueCanKeepOrReplaceItsPhotoCountWithoutAMaximumRule() {
        var settings = new KidsChampSettingsEntity();
        settings.startActiveZip(250);
        assertEquals(250, settings.getActiveZipTargetSize());

        settings.replaceActiveZipTarget(25_000);
        assertEquals(25_000, settings.getActiveZipTargetSize());
        assertNotNull(settings.getActiveZipStartedAt());
    }

    @Test
    void generationStartsRetentionAndDownloadDoesNotRestartIt() {
        var batch = new KidsChampBatchEntity();
        Instant before = Instant.now();
        batch.startRetention(14);
        Instant generatedExpiry = batch.getDeleteAfter();

        assertNotNull(generatedExpiry);
        assertTrue(generatedExpiry.isAfter(before.plusSeconds(13L * 24 * 60 * 60)));
        batch.markDownloaded(3);
        assertEquals(generatedExpiry, batch.getDeleteAfter());
        assertNotNull(batch.getFirstDownloadedAt());
    }

    @Test
    void archivePhotoNamesUseQueuePositionAndPng() {
        assertEquals("001_Kasun Perera_Kandy.png", KidsChampAdminService.zipPhotoName(1, "Kasun Perera", "Kandy"));
        assertEquals("620_Nethmi_Galle.png", KidsChampAdminService.zipPhotoName(620, "Nethmi", "Galle"));
    }

    @Test
    void jpegArtworkIsConvertedToPngBytes() throws Exception {
        var source=Files.createTempFile("kids-champ-source-",".jpg");
        try {
            var image=new BufferedImage(2,2,BufferedImage.TYPE_INT_RGB);
            assertTrue(ImageIO.write(image,"jpg",source.toFile()));
            var converted=new ByteArrayOutputStream();
            KidsChampAdminService.writePng(source,converted,"TEST-001");
            assertArrayEquals(new byte[]{(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a},Arrays.copyOf(converted.toByteArray(),8));
        } finally {
            Files.deleteIfExists(source);
        }
    }
}
