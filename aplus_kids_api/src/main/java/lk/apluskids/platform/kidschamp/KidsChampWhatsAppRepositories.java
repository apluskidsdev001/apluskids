package lk.apluskids.platform.kidschamp;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface KidsChampWhatsAppPreferenceRepository extends JpaRepository<KidsChampWhatsAppPreferenceEntity, UUID> {}
interface KidsChampWhatsAppTemplateRepository extends JpaRepository<KidsChampWhatsAppTemplateEntity, Long> {
    List<KidsChampWhatsAppTemplateEntity> findAllByOrderByNameAscLanguageCodeAsc();
    Optional<KidsChampWhatsAppTemplateEntity> findByNameAndLanguageCode(String name, String languageCode);
    Optional<KidsChampWhatsAppTemplateEntity> findByPublicId(UUID publicId);
}
interface KidsChampMessageDeliveryEventRepository extends JpaRepository<KidsChampMessageDeliveryEventEntity, Long> {
    List<KidsChampMessageDeliveryEventEntity> findAllByRecipientIdOrderByOccurredAtAscIdAsc(Long recipientId);
}
