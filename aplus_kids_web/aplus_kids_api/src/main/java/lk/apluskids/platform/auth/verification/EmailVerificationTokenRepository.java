package lk.apluskids.platform.auth.verification;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity, Long> {
    Optional<EmailVerificationTokenEntity> findByTokenHash(String tokenHash);
    Optional<EmailVerificationTokenEntity> findFirstByUserIdOrderByIssuedAtDesc(Long userId);
    List<EmailVerificationTokenEntity> findAllByUserIdAndConsumedAtIsNullAndRevokedAtIsNull(Long userId);
    boolean existsByTokenHash(String tokenHash);
}
