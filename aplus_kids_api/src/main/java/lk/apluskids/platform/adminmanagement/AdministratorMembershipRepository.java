package lk.apluskids.platform.adminmanagement;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface AdministratorMembershipRepository extends JpaRepository<AdministratorMembershipEntity, Long> {
    Optional<AdministratorMembershipEntity> findByUserPublicId(UUID publicId);
    boolean existsByUserId(Long userId);
    List<AdministratorMembershipEntity> findAllByOrderByInvitedAtDesc();
    long countByRoleAndStatus(AdministratorRole role, AdministratorMembershipStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select membership from AdministratorMembershipEntity membership join fetch membership.user where membership.user.publicId = :publicId")
    Optional<AdministratorMembershipEntity> findLockedByUserPublicId(@Param("publicId") UUID publicId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select membership from AdministratorMembershipEntity membership join fetch membership.user where lower(membership.user.email) = lower(:email)")
    Optional<AdministratorMembershipEntity> findLockedByEmail(@Param("email") String email);
}
