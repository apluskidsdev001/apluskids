package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "kids_champ_whatsapp_preferences")
class KidsChampWhatsAppPreferenceEntity {
    @Id
    @Column(name = "participant_reference", nullable = false)
    private UUID participantReference;
    @Column(nullable = false, length = 16)
    private String status;
    @Column(nullable = false, length = 40)
    private String source;
    @Column(length = 300)
    private String reason;
    @Column(name = "opted_in_at")
    private Instant optedInAt;
    @Column(name = "opted_out_at")
    private Instant optedOutAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private UserEntity updatedBy;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected KidsChampWhatsAppPreferenceEntity() {}

    KidsChampWhatsAppPreferenceEntity(UUID participantReference) {
        this.participantReference = participantReference;
        this.status = "UNKNOWN";
        this.source = "SYSTEM";
        this.updatedAt = Instant.now();
    }

    void update(String value, String source, String reason, UserEntity actor) {
        Instant now = Instant.now();
        status = value;
        this.source = source;
        this.reason = reason;
        updatedBy = actor;
        updatedAt = now;
        if ("OPTED_IN".equals(value)) {
            optedInAt = now;
            optedOutAt = null;
        } else if ("OPTED_OUT".equals(value)) {
            optedOutAt = now;
        }
    }

    UUID getParticipantReference() { return participantReference; }
    String getStatus() { return status; }
    String getSource() { return source; }
    String getReason() { return reason; }
    Instant getOptedInAt() { return optedInAt; }
    Instant getOptedOutAt() { return optedOutAt; }
    Instant getUpdatedAt() { return updatedAt; }
}
