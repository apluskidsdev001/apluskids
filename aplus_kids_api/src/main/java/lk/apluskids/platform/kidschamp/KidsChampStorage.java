package lk.apluskids.platform.kidschamp;

import java.io.*;
import java.nio.file.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import lk.apluskids.platform.common.error.ApiException;

@Component
class KidsChampStorage {
    static final String ALLOWED_FILE_TYPES = "JPG, JPEG, PNG";
    private static final long ABSOLUTE_MAX_BYTES = 50L * 1024 * 1024;
    private static final long MAX_PIXELS = 16_000_000L;
    private static final Semaphore IMAGE_DECODERS = new Semaphore(2,true);
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png");
    private final Path root;

    KidsChampStorage(@Value("${aplus.kids-champ.storage-path:./data/kids-champ}") String path) {
        root = Paths.get(path).toAbsolutePath().normalize();
    }

    static boolean supportsAllowedFileTypes(String value) {
        if (value == null || value.isBlank()) return false;
        Set<String> requested = java.util.Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(type -> !type.isEmpty())
            .map(type -> type.toUpperCase(java.util.Locale.ROOT))
            .collect(java.util.stream.Collectors.toSet());
        return requested.equals(Set.of("JPG", "JPEG", "PNG"));
    }

    StoredPhoto store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw bad("PHOTO_REQUIRED", "Please choose one photo.");
        if (file.getSize() > ABSOLUTE_MAX_BYTES) throw bad("PHOTO_TOO_LARGE", "The photo must be 50 MB or smaller.");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!TYPES.contains(type)) throw bad("PHOTO_TYPE_INVALID", "Use a JPEG or PNG photo.");
        String extension = type.equals("image/png") ? ".png" : ".jpg";
        String storedName = UUID.randomUUID() + extension;
        Path target=null;
        try {
            Files.createDirectories(root);
            target = root.resolve(storedName).normalize();
            if (!target.getParent().equals(root)) throw new IOException("Invalid target");
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            boolean valid;
            try{valid=hasSafeDimensions(target);}
            catch(ApiException exception){throw exception;}
            catch(IOException|RuntimeException exception){valid=false;}
            if(!valid)throw bad("PHOTO_INVALID","The selected file is not a valid, safe JPEG or PNG image.");
            return new StoredPhoto(storedName, safeOriginalName(file.getOriginalFilename()), type, file.getSize());
        } catch (ApiException exception) {
            if(target!=null)try{Files.deleteIfExists(target);}catch(IOException ignored){}
            throw exception;
        } catch (IOException exception) {
            if(target!=null)try{Files.deleteIfExists(target);}catch(IOException ignored){}
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

    boolean hasPhoto(String storedName) {
        if (storedName == null || storedName.isBlank()) return false;
        Path target = root.resolve(storedName).normalize();
        return target.getParent() != null && target.getParent().equals(root) && Files.isRegularFile(target);
    }

    boolean hasReadablePhoto(String storedName) {
        if (!hasPhoto(storedName)) return false;
        try { return hasSafeDimensions(root.resolve(storedName).normalize()); }
        catch(ApiException exception){throw exception;}
        catch (IOException | RuntimeException exception) { return false; }
    }

    private boolean hasSafeDimensions(Path path) throws IOException {
        return withImageDecoder(()->{
            try(ImageInputStream input=ImageIO.createImageInputStream(path.toFile())){
                if(input==null)return false;
                var readers=ImageIO.getImageReaders(input);if(!readers.hasNext())return false;
                ImageReader reader=readers.next();
                try{
                    reader.setInput(input,true,true);int width=reader.getWidth(0),height=reader.getHeight(0);
                    if(width<=0||height<=0||(long)width*height>MAX_PIXELS)return false;
                    var image=reader.read(0);
                    return image!=null&&image.getWidth()==width&&image.getHeight()==height;
                }finally{reader.dispose();}
            }
        });
    }

    static void writePng(Path source,OutputStream target,String trackingCode) throws IOException{
        withImageDecoder(()->{
            BufferedImage image=ImageIO.read(source.toFile());
            if(image==null)throw new IOException("Unreadable image for "+trackingCode);
            if((long)image.getWidth()*image.getHeight()>MAX_PIXELS)throw new IOException("Image dimensions are too large for "+trackingCode);
            if(!ImageIO.write(image,"png",target))throw new IOException("PNG conversion is unavailable.");
            return true;
        });
    }

    private static <T> T withImageDecoder(IoOperation<T> operation) throws IOException{
        boolean acquired=false;
        try{
            acquired=IMAGE_DECODERS.tryAcquire(5,TimeUnit.SECONDS);
            if(!acquired)throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"PHOTO_PROCESSING_BUSY","Photo processing is busy. Please try again shortly.");
            return operation.run();
        }catch(InterruptedException exception){
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"PHOTO_PROCESSING_BUSY","Photo processing is busy. Please try again shortly.");
        }finally{if(acquired)IMAGE_DECODERS.release();}
    }

    @FunctionalInterface private interface IoOperation<T>{T run() throws IOException;}

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

    Path downloadSnapshot(Path archive,String batchCode){
        Path source=archive.toAbsolutePath().normalize();
        if(!source.startsWith(root)||!Files.isRegularFile(source))
            throw new ApiException(HttpStatus.GONE,"BATCH_FILE_MISSING","This ZIP is no longer available.");
        Path snapshots=root.resolve("downloads").normalize();
        Path target=null;
        try{
            Files.createDirectories(snapshots);
            target=Files.createTempFile(snapshots,batchCode+"-",".zip");
            Files.copy(source,target,StandardCopyOption.REPLACE_EXISTING);
            return target;
        }catch(IOException|RuntimeException exception){
            if(target!=null)try{Files.deleteIfExists(target);}catch(IOException ignored){}
            if(exception instanceof ApiException apiException)throw apiException;
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,"BATCH_DOWNLOAD_FAILED","The ZIP could not be prepared for download. Please try again.");
        }
    }

    void cleanupStaleDownloadSnapshots(Duration maximumAge){
        Path snapshots=root.resolve("downloads").normalize();
        if(!Files.isDirectory(snapshots))return;
        Instant cutoff=Instant.now().minus(maximumAge);
        try(var paths=Files.list(snapshots)){
            paths.filter(Files::isRegularFile).forEach(path->{
                try{if(Files.getLastModifiedTime(path).toInstant().isBefore(cutoff))Files.deleteIfExists(path);}
                catch(IOException|RuntimeException ignored){}
            });
        }catch(IOException|RuntimeException ignored){}
    }

    boolean deleteBestEffort(String storedName) {
        if (storedName == null || storedName.isBlank()) return true;
        try {
            Path target = root.resolve(storedName).normalize();
            if (target.getParent() == null || !target.getParent().equals(root)) return false;
            Files.deleteIfExists(target);
            return !Files.exists(target);
        } catch (IOException | RuntimeException exception) {
            return false;
        }
    }

    boolean deletePathBestEffort(String path) {
        if (path == null || path.isBlank()) return true;
        try {
            Path target = Paths.get(path).toAbsolutePath().normalize();
            if (!target.startsWith(root)) return false;
            Files.deleteIfExists(target);
            return !Files.exists(target);
        } catch (IOException | RuntimeException exception) {
            return false;
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
