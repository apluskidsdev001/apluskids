package lk.apluskids.platform.specialevents;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpecialEventRepository extends JpaRepository<SpecialEventEntity, Long> {
    Optional<SpecialEventEntity> findByPublicId(UUID publicId);
    List<SpecialEventEntity> findAllByOrderByDisplayOrderAscEventDateAsc();
    List<SpecialEventEntity> findByActiveTrueOrderByDisplayOrderAscEventDateAsc();
}
