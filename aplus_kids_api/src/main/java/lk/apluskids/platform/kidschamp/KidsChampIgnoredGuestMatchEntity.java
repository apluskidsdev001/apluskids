package lk.apluskids.platform.kidschamp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lk.apluskids.platform.user.UserEntity;

@Entity
@Table(name="kids_champ_ignored_guest_matches", uniqueConstraints=@UniqueConstraint(columnNames={"first_guest_id","second_guest_id"}))
class KidsChampIgnoredGuestMatchEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="first_guest_id",nullable=false) private UUID firstGuestId;
    @Column(name="second_guest_id",nullable=false) private UUID secondGuestId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="ignored_by_user_id") private UserEntity ignoredBy;
    @Column(name="ignored_at",nullable=false,insertable=false,updatable=false) private Instant ignoredAt;
    void setPair(UUID a,UUID b){if(a.toString().compareTo(b.toString())<0){firstGuestId=a;secondGuestId=b;}else{firstGuestId=b;secondGuestId=a;}}
    void setIgnoredBy(UserEntity value){ignoredBy=value;}
}

