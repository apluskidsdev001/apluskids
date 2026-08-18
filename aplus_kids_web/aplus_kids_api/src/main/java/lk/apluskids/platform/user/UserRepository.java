package lk.apluskids.platform.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    boolean existsByPhoneE164(String phoneE164);
    boolean existsByPhoneE164AndIdNot(String phoneE164, Long id);
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    Optional<UserEntity> findByPhoneE164(String phoneE164);
    Optional<UserEntity> findByPublicId(UUID publicId);
}
