package lk.apluskids.platform.child;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChildProfileRepository extends JpaRepository<ChildProfileEntity, Long> {
    List<ChildProfileEntity> findAllByUserPublicIdAndDeletedAtIsNull(UUID userPublicId);
    List<ChildProfileEntity> findAllByUserPublicId(UUID userPublicId);
    Optional<ChildProfileEntity> findByPublicIdAndUserPublicIdAndDeletedAtIsNull(UUID childId, UUID userId);
}
