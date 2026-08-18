package lk.apluskids.platform.specialevents;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import lk.apluskids.platform.common.error.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
class SpecialEventStorage {
    private static final long MAX_SIZE = 20L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of("image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp");
    private final Path root;
    SpecialEventStorage(@Value("${aplus.special-events.storage-path:./data/special-events}") String value) { root = Paths.get(value).toAbsolutePath().normalize(); }
    Stored store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw bad("EVENT_IMAGE_REQUIRED", "Choose an event cover image.");
        String type = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        if (!EXTENSIONS.containsKey(type)) throw bad("EVENT_IMAGE_TYPE_INVALID", "Use a JPG, PNG or WebP event cover image.");
        if (file.getSize() > MAX_SIZE) throw bad("EVENT_IMAGE_TOO_LARGE", "Event cover images must be 20 MB or smaller.");
        Path target = null;
        try {
            Files.createDirectories(root);
            target = root.resolve(UUID.randomUUID() + EXTENSIONS.get(type)).normalize();
            if (!root.equals(target.getParent())) throw new IOException("Invalid event image path");
            try (InputStream input = file.getInputStream()) { Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING); }
            return new Stored(target.getFileName().toString(), type);
        } catch (IOException error) { deletePath(target); throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EVENT_IMAGE_STORAGE_FAILED", "The event cover image could not be saved."); }
    }
    Path get(String filename) {
        if (filename == null || filename.isBlank()) throw new ApiException(HttpStatus.NOT_FOUND, "EVENT_IMAGE_NOT_FOUND", "Event cover image is unavailable.");
        Path value = root.resolve(filename).normalize();
        if (!root.equals(value.getParent()) || !Files.isRegularFile(value)) throw new ApiException(HttpStatus.NOT_FOUND, "EVENT_IMAGE_NOT_FOUND", "Event cover image is unavailable.");
        return value;
    }
    void delete(String filename) { if (filename != null) deletePath(root.resolve(filename).normalize()); }
    private void deletePath(Path path) { if (path == null || !root.equals(path.getParent())) return; try { Files.deleteIfExists(path); } catch (IOException ignored) { } }
    private static ApiException bad(String code, String message) { return new ApiException(HttpStatus.BAD_REQUEST, code, message); }
    record Stored(String filename, String mediaType) { }
}
