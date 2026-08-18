package lk.apluskids.platform.specialevents;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "special_events")
class SpecialEventEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false) private UUID publicId;
    @Column(nullable = false, length = 160) private String name;
    @Column(name = "event_date", nullable = false) private LocalDate eventDate;
    @Column(nullable = false, length = 160) private String place;
    @Column(name = "video_url", length = 2048) private String videoUrl;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "guests_json", nullable = false, columnDefinition = "TEXT") private String guestsJson = "[]";
    @Column(length = 120) private String contact;
    @Column(name = "cover_filename") private String coverFilename;
    @Column(name = "cover_media_type", length = 100) private String coverMediaType;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "display_order", nullable = false) private int displayOrder;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Version private long version;

    @PrePersist void created() { if (publicId == null) publicId = UUID.randomUUID(); Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    Long id() { return id; } UUID publicId() { return publicId; } String name() { return name; } LocalDate eventDate() { return eventDate; }
    String place() { return place; } String videoUrl() { return videoUrl; } String description() { return description; } String guestsJson() { return guestsJson; }
    String contact() { return contact; } String coverFilename() { return coverFilename; } String coverMediaType() { return coverMediaType; } boolean active() { return active; } int displayOrder() { return displayOrder; }
    void details(String nextName, LocalDate nextDate, String nextPlace, String nextVideoUrl, String nextDescription, String nextGuests, String nextContact, boolean nextActive, int nextOrder) { name = nextName; eventDate = nextDate; place = nextPlace; videoUrl = nextVideoUrl; description = nextDescription; guestsJson = nextGuests; contact = nextContact; active = nextActive; displayOrder = nextOrder; }
    void cover(String filename, String mediaType) { coverFilename = filename; coverMediaType = mediaType; }
}
