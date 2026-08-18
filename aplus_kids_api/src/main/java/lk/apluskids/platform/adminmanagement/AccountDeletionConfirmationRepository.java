package lk.apluskids.platform.adminmanagement;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface AccountDeletionConfirmationRepository extends JpaRepository<AccountDeletionConfirmationEntity, Long> {
    Optional<AccountDeletionConfirmationEntity> findByPublicId(UUID publicId);
    Optional<AccountDeletionConfirmationEntity> findFirstByRequestedByIdOrderByIssuedAtDesc(Long userId);
}
