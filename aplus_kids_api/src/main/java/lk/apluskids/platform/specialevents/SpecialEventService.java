package lk.apluskids.platform.specialevents;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.*;
import lk.apluskids.platform.common.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SpecialEventService {
    private final SpecialEventRepository events;
    private final SpecialEventStorage storage;
    SpecialEventService(SpecialEventRepository events, SpecialEventStorage storage) { this.events = events; this.storage = storage; }

    @Transactional(readOnly = true) public List<EventView> publicEvents() { return events.findByActiveTrueOrderByDisplayOrderAscEventDateAsc().stream().map(this::view).toList(); }
    @Transactional(readOnly = true) public List<EventView> adminEvents() { return events.findAllByOrderByDisplayOrderAscEventDateAsc().stream().map(this::view).toList(); }
    @Transactional public EventView create(EventRequest request) { SpecialEventEntity event = new SpecialEventEntity(); apply(event, request); return view(events.save(event)); }
    @Transactional public EventView update(UUID id, EventRequest request) { SpecialEventEntity event = event(id); apply(event, request); return view(event); }
    @Transactional public EventView uploadCover(UUID id, MultipartFile file) { SpecialEventEntity event = event(id); SpecialEventStorage.Stored image = storage.store(file); String old = event.coverFilename(); event.cover(image.filename(), image.mediaType()); storage.delete(old); return view(event); }
    @Transactional public void delete(UUID id) { SpecialEventEntity event = event(id); String image = event.coverFilename(); events.delete(event); storage.delete(image); }
    @Transactional(readOnly = true) public Asset cover(UUID id) { SpecialEventEntity event = event(id); return new Asset(storage.get(event.coverFilename()), event.coverMediaType()); }

    private void apply(SpecialEventEntity event, EventRequest request) {
        String name = required(request.name(), 160, "EVENT_NAME_REQUIRED", "Enter an event name.");
        String place = required(request.place(), 160, "EVENT_PLACE_REQUIRED", "Enter the event location.");
        LocalDate date;
        try { date = request.date() == null ? null : LocalDate.parse(request.date()); } catch (RuntimeException error) { throw bad("EVENT_DATE_INVALID", "Choose a valid event date."); }
        if (date == null) throw bad("EVENT_DATE_REQUIRED", "Choose an event date.");
        String video = trim(request.youtubeUrl(), 2048);
        if (video != null && !validVideoUrl(video)) throw bad("EVENT_VIDEO_INVALID", "Use a valid YouTube or Vimeo link.");
        event.details(name, date, place, video, trim(request.description(), 3000), guests(request.guests()), trim(request.contact(), 120), request.active(), Math.max(0, request.displayOrder()));
    }
    private EventView view(SpecialEventEntity event) { return new EventView(event.publicId(), event.name(), event.eventDate().toString(), event.place(), event.videoUrl(), event.description(), guests(event.guestsJson()), event.contact(), event.coverFilename() == null ? null : "/api/v1/special-events/" + event.publicId() + "/cover", event.active(), event.displayOrder()); }
    private SpecialEventEntity event(UUID id) { return events.findByPublicId(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Special event not found.")); }
    private String guests(List<String> values) { return String.join("\u001F", values == null ? List.of() : values.stream().filter(Objects::nonNull).map(value -> value.trim()).filter(value -> !value.isBlank()).map(value -> value.substring(0, Math.min(100, value.length()))).toList()); }
    private List<String> guests(String value) { return value == null || value.isBlank() ? List.of() : Arrays.stream(value.split("\u001F")).filter(item -> !item.isBlank()).toList(); }
    private static boolean validVideoUrl(String value) { try { java.net.URI uri = java.net.URI.create(value); String host = Optional.ofNullable(uri.getHost()).orElse("").toLowerCase(Locale.ROOT); return uri.getScheme() != null && Set.of("http", "https").contains(uri.getScheme().toLowerCase(Locale.ROOT)) && (host.equals("youtu.be") || host.endsWith("youtube.com") || host.equals("vimeo.com") || host.endsWith("vimeo.com")); } catch (IllegalArgumentException error) { return false; } }
    private static String required(String value, int max, String code, String message) { String result = trim(value, max); if (result == null) throw bad(code, message); return result; }
    private static String trim(String value, int max) { if (value == null) return null; value = value.trim(); return value.isBlank() ? null : value.substring(0, Math.min(max, value.length())); }
    private static ApiException bad(String code, String message) { return new ApiException(HttpStatus.BAD_REQUEST, code, message); }
    public record EventRequest(String name, String date, String place, String youtubeUrl, String description, List<String> guests, String contact, boolean active, int displayOrder) { }
    public record EventView(UUID id, String name, String date, String place, String youtubeUrl, String description, List<String> guests, String contact, String coverUrl, boolean active, int displayOrder) { }
    public record Asset(Path path, String mediaType) { }
}
