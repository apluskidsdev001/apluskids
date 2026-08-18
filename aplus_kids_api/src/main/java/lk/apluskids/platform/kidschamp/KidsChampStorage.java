package lk.apluskids.platform.kidschamp;

import java.io.*;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import lk.apluskids.platform.common.error.ApiException;

@Component
class KidsChampStorage {
    private static final long MAX_BYTES = 8L * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png");
    private final Path root;

    KidsChampStorage(@Value("${aplus.kids-champ.storage-path:./data/kids-champ}") String path) {
        root = Paths.get(path).toAbsolutePath().normalize();
    }

    StoredPhoto store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw bad("PHOTO_REQUIRED", "Please choose one photo.");
        if (file.getSize() > MAX_BYTES) throw bad("PHOTO_TOO_LARGE", "The photo must be 8 MB or smaller.");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!TYPES.contains(type)) throw bad("PHOTO_TYPE_INVALID", "Use a JPEG or PNG photo.");
        String extension = type.equals("image/png") ? ".png" : ".jpg";
        String storedName = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(root);
            Path target = root.resolve(storedName).normalize();
            if (!target.getParent().equals(root)) throw new IOException("Invalid target");
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredPhoto(storedName, safeOriginalName(file.getOriginalFilename()), type, file.getSize());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PHOTO_STORAGE_FAILED", "The photo could not be saved.");
        }
    }

    void delete(String storedName) {
        if (storedName == null) return;
        try {
            Path target = root.resolve(storedName).normalize();
            if (target.getParent().equals(root)) Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PHOTO_DELETE_FAILED", "The photo could not be deleted.");
        }
    }

    Path photo(String storedName) {
        Path target = root.resolve(storedName).normalize();
        if (!target.getParent().equals(root) || !Files.isRegularFile(target))
            throw new ApiException(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND", "A source photo is no longer available.");
        return target;
    }

    Path archive(String batchCode) {
        try {
            Path archives = root.resolve("archives").normalize();
            Files.createDirectories(archives);
            return archives.resolve(batchCode + ".zip").normalize();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ARCHIVE_STORAGE_FAILED", "Archive storage is unavailable.");
        }
    }

    void deletePath(String path) {
        if (path == null) return;
        try {
            Path target = Paths.get(path).toAbsolutePath().normalize();
            if (target.startsWith(root)) Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ARCHIVE_DELETE_FAILED", "The archive could not be deleted.");
        }
    }

    /** Clears only this dedicated Kids Champ storage directory, while retaining it for future uploads. */
    void clearAll() {
        if (!Files.exists(root)) return;
        try (var paths = Files.walk(root)) {
            paths.sorted(java.util.Comparator.reverseOrder()).filter(path -> !path.equals(root)).forEach(path -> {
                try { Files.deleteIfExists(path); }
                catch (IOException exception) { throw new UncheckedIOException(exception); }
            });
        } catch (UncheckedIOException | IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "KIDS_CHAMP_STORAGE_CLEAR_FAILED", "Kids Champ files could not be permanently removed.");
        }
    }

    private String safeOriginalName(String value) {
        if (value == null || value.isBlank()) return "photo";
        String name = Paths.get(value).getFileName().toString().replaceAll("[\\p{Cntrl}]", "");
        return name.substring(0, Math.min(name.length(), 255));
    }
    private ApiException bad(String code, String message) { return new ApiException(HttpStatus.BAD_REQUEST, code, message); }
    record StoredPhoto(String storedName, String originalName, String mediaType, long size) {}
}
