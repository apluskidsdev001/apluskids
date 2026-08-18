package lk.apluskids.platform.advertisement;

import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface AdvertisementRepository extends JpaRepository<AdvertisementEntity,Long>{
    Optional<AdvertisementEntity> findByPublicId(UUID id);
    List<AdvertisementEntity> findAllByOrderByCreatedAtDesc();
    @Query("select distinct a from AdvertisementEntity a join AdvertisementPlacementEntity p on p.advertisement=a where p.slotKey=:slot and a.status='ACTIVE' and a.archivedAt is null and (a.startsAt is null or a.startsAt<=:now) and (a.endsAt is null or a.endsAt>:now) order by a.priority desc,a.createdAt desc")
    List<AdvertisementEntity> active(@Param("slot")String slot,@Param("now")Instant now);
    @Modifying @Query("update AdvertisementEntity a set a.impressionCount=a.impressionCount+1 where a.publicId=:id") int impression(@Param("id")UUID id);
    @Modifying @Query("update AdvertisementEntity a set a.clickCount=a.clickCount+1 where a.publicId=:id") int click(@Param("id")UUID id);
    @Modifying(clearAutomatically=true,flushAutomatically=true) @Query(value="delete from advertisements where public_id=:id",nativeQuery=true) int deletePermanent(@Param("id")UUID id);
}
interface AdvertisementPlacementRepository extends JpaRepository<AdvertisementPlacementEntity,Long>{
    List<AdvertisementPlacementEntity> findAllByAdvertisement(AdvertisementEntity value);
    void deleteAllByAdvertisement(AdvertisementEntity value);
}
interface AdvertisementAuditRepository extends JpaRepository<AdvertisementAuditEntity,Long>{List<AdvertisementAuditEntity> findTop300ByOrderByCreatedAtDesc();}
