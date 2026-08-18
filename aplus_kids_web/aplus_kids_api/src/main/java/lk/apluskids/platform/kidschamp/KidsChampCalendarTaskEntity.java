package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_calendar_tasks")
class KidsChampCalendarTaskEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="public_id",nullable=false,unique=true,updatable=false) private UUID publicId;
    @Column(name="task_date",nullable=false) private LocalDate taskDate;
    @Column(nullable=false,length=180) private String title;
    @Column(length=1000) private String details;
    @Column(name="completed_at") private Instant completedAt;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by_user_id",nullable=false) private UserEntity createdBy;
    @Column(name="created_at",nullable=false,insertable=false,updatable=false) private Instant createdAt;
    @Column(name="deleted_at") private Instant deletedAt;
    @PrePersist void insert(){if(publicId==null)publicId=UUID.randomUUID();}
    UUID getPublicId(){return publicId;} LocalDate getTaskDate(){return taskDate;} String getTitle(){return title;}
    String getDetails(){return details;} Instant getCompletedAt(){return completedAt;} Instant getCreatedAt(){return createdAt;}
    void create(LocalDate date,String title,String details,UserEntity actor){this.taskDate=date;this.title=title;this.details=details;this.createdBy=actor;}
    void setCompleted(boolean completed){completedAt=completed?Instant.now():null;} void reschedule(LocalDate date){this.taskDate=date;} void delete(){deletedAt=Instant.now();}
}
