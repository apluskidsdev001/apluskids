package lk.apluskids.platform.profile;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileActionCodeRepository extends JpaRepository<ProfileActionCodeEntity, Long> {
    Optional<ProfileActionCodeEntity> findFirstByUserIdAndPurposeOrderByIssuedAtDesc(Long userId, ProfileActionPurpose purpose);
    Optional<ProfileActionCodeEntity> findByCodeHash(String codeHash);
    List<ProfileActionCodeEntity> findAllByUserIdAndPurposeAndConsumedAtIsNullAndRevokedAtIsNull(Long userId, ProfileActionPurpose purpose);
    boolean existsByCodeHash(String codeHash);
}
