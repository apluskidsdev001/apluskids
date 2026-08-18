package lk.apluskids.platform.notification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name = "account_notifications")
public class AccountNotificationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    @Column(name = "notification_type", nullable = false, length = 50)
    private String type;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(nullable = false, length = 500)
    private String message;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "read_at")
    private Instant readAt;

    @PrePersist
    void beforeInsert() {
        if (publicId == null) publicId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getPublicId() { return publicId; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReadAt() { return readAt; }
    public void setUser(UserEntity value) { user = value; }
    public void setType(String value) { type = value; }
    public void setTitle(String value) { title = value; }
    public void setMessage(String value) { message = value; }
    public void setExpiresAt(Instant value) { expiresAt = value; }
    public void setReadAt(Instant value) { readAt = value; }
}
