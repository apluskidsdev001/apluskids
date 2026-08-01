package lk.apluskids.platform.kidschamp;

import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;
import lk.apluskids.platform.child.*;
import lk.apluskids.platform.common.error.ApiException;
import lk.apluskids.platform.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class KidsChampService {
    private static final Pattern PHONE = Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final String CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private final SecureRandom random = new SecureRandom();
    private final KidsChampSubmissionRepository submissions;
    private final KidsChampGuestContactRepository guests;
    private final ChildProfileRepository children;
    private final UserRepository users;
    private final KidsChampStorage storage;
    private final KidsChampAuditRepository audits;

    public KidsChampService(KidsChampSubmissionRepository submissions, KidsChampGuestContactRepository guests,
                            ChildProfileRepository children, UserRepository users, KidsChampStorage storage,KidsChampAuditRepository audits) {
        this.submissions=submissions; this.guests=guests; this.children=children; this.users=users; this.storage=storage;this.audits=audits;
    }

    @Transactional
    public KidsChampResponse submit(UUID userId, UUID childId, String childName, LocalDate dob,
                                    String parentName, String email, String phone, String country,
                                    String province, String hometown, String category, String title, String description,
                                    boolean consent, boolean whatsappConsent, MultipartFile photo) {
        if (!consent) throw bad("CONSENT_REQUIRED", "Parent or guardian consent is required.");
        String normalizedCategory = blankToNull(category);
        if (normalizedCategory == null || !Set.of("Drawing", "Painting", "Handcraft").contains(normalizedCategory))
            throw bad("CATEGORY_INVALID", "Choose Drawing, Painting, or Handcraft.");
        if (userId == null) {
            require(childName, "child name"); require(parentName, "parent name"); require(country, "country");
            require(province, "province"); require(hometown, "hometown");
            if (dob == null) throw bad("DOB_REQUIRED", "Please enter the child's date of birth.");
            String candidatePhone = phone == null ? "" : phone.replaceAll("[\\s()-]", "");
            if (!PHONE.matcher(candidatePhone).matches()) throw bad("PHONE_INVALID", "Enter a valid international mobile number.");
        } else if (childId == null) {
            throw bad("CHILD_REQUIRED", "Please select a child profile.");
        }
        var stored = storage.store(photo);
        try {
            KidsChampSubmissionEntity item = new KidsChampSubmissionEntity();
            LocalDate resolvedDob;
            if (userId != null) {
                if (childId == null) throw bad("CHILD_REQUIRED", "Please select a child profile.");
                var child = children.findByPublicIdAndUserPublicIdAndDeletedAtIsNull(childId, userId)
                    .orElseThrow(() -> bad("CHILD_NOT_FOUND", "The selected child profile was not found."));
                var user = users.findByPublicId(userId).orElseThrow(() -> bad("ACCOUNT_NOT_FOUND", "Account not found."));
                item.setUser(user); item.setChildProfile(child);
                item.setChildName(child.getFullName()); resolvedDob=child.getDateOfBirth();
                item.setParentName(user.getAccountHolderName()); item.setEmail(user.getEmail());
                item.setPhoneE164(user.getPhoneE164()); item.setCountryCode(child.getCountryCode());
                item.setProvince(child.getProvince()); item.setHometown(child.getHometown());
            } else {
                require(childName, "child name"); require(parentName, "parent name"); require(country, "country");
                require(province, "province"); require(hometown, "hometown");
                if (dob == null) throw bad("DOB_REQUIRED", "Please enter the child's date of birth.");
                String normalizedPhone = phone == null ? "" : phone.replaceAll("[\\s()-]", "");
                if (!PHONE.matcher(normalizedPhone).matches()) throw bad("PHONE_INVALID", "Enter a valid international mobile number.");
                String normalizedEmail = email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
                var guest = guests.findByPhoneE164(normalizedPhone).orElseGet(KidsChampGuestContactEntity::new);
                guest.setPhoneE164(normalizedPhone); guest.setEmail(normalizedEmail); guest.setParentName(parentName.trim());
                guest.setCountryCode(country.trim().toUpperCase(Locale.ROOT)); guest.setProvince(province.trim());
                guest.setHometown(hometown.trim()); guest.recordSubmission(); guests.save(guest);
                item.setGuestContact(guest); item.setChildName(childName.trim()); resolvedDob=dob;
                item.setParentName(parentName.trim()); item.setEmail(normalizedEmail); item.setPhoneE164(normalizedPhone);
                item.setCountryCode(country.trim().toUpperCase(Locale.ROOT)); item.setProvince(province.trim());
                item.setHometown(hometown.trim());
            }
            int age = Period.between(resolvedDob, LocalDate.now()).getYears();
            if (resolvedDob.isAfter(LocalDate.now()) || age < 0 || age >= 18)
                throw bad("CHILD_AGE_INVALID", "Kids Champ is available to children under 18.");
            item.setDateOfBirth(resolvedDob); item.setAgeAtSubmission(age);
            item.setCategory(normalizedCategory);
            item.setWorkTitle(blankToNull(title)); item.setWorkDescription(blankToNull(description));
            item.setTrackingCode(newTrackingCode()); item.setOriginalFilename(stored.originalName());
            item.setStoredFilename(stored.storedName()); item.setMediaType(stored.mediaType());
            item.setFileSize(stored.size()); item.setConsentAcceptedAt(Instant.now());
            if(whatsappConsent)item.setWhatsappConsentAt(Instant.now());
            return KidsChampResponse.from(submissions.save(item));
        } catch (RuntimeException exception) {
            storage.delete(stored.storedName());
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public KidsChampResponse track(String code) {
        return KidsChampResponse.from(submissions.findByTrackingCodeIgnoreCase(normalizeCode(code))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TRACKING_NOT_FOUND", "Tracking code not found.")));
    }

    @Transactional(readOnly = true)
    public List<KidsChampResponse> profile(UUID userId) {
        return submissions.findAllByUserPublicIdOrderBySubmittedAtDesc(userId).stream().map(KidsChampResponse::from).toList();
    }

    @Transactional(readOnly=true)
    public List<ClaimableGuestResponse> claimable(UUID userId){
        UserEntity user=users.findByPublicId(userId).orElseThrow(()->bad("ACCOUNT_NOT_FOUND","Account not found."));
        return guests.findAllByOrderByLastSubmittedAtDesc().stream().filter(g->g.getClaimedAt()==null&&ownsContact(user,g))
            .map(g->new ClaimableGuestResponse(g.getPublicId(),g.getParentName(),maskPhone(g.getPhoneE164()),g.getSubmissionCount(),g.getFirstSubmittedAt(),g.getLastSubmittedAt())).toList();
    }

    @Transactional
    public List<KidsChampResponse> claim(UUID userId,UUID guestId,UUID childId){
        UserEntity user=users.findByPublicId(userId).orElseThrow(()->bad("ACCOUNT_NOT_FOUND","Account not found."));
        var child=children.findByPublicIdAndUserPublicIdAndDeletedAtIsNull(childId,userId).orElseThrow(()->bad("CHILD_NOT_FOUND","The selected child profile was not found."));
        KidsChampGuestContactEntity guest=guests.findByPublicIdAndClaimedAtIsNull(guestId).orElseThrow(()->bad("GUEST_HISTORY_NOT_FOUND","Guest history was not found or was already claimed."));
        if(!ownsContact(user,guest)) throw new ApiException(HttpStatus.FORBIDDEN,"CLAIM_NOT_VERIFIED","The account's verified phone or email does not match this guest history.");
        List<KidsChampSubmissionEntity> items=submissions.findAllByGuestContactPublicIdAndDeletedAtIsNullOrderBySubmittedAtDesc(guestId);
        items.forEach(item->item.claim(user,child));guest.claim(user);
        KidsChampAuditEntity audit=new KidsChampAuditEntity();audit.setActor(user);audit.setAction("GUEST_HISTORY_CLAIMED");audit.setEntityType("GUEST_CONTACT");audit.setEntityPublicId(guestId);audit.setDetails("Submissions: "+items.size());audits.save(audit);
        return items.stream().map(KidsChampResponse::from).toList();
    }

    private boolean ownsContact(UserEntity user,KidsChampGuestContactEntity guest){
        boolean email=user.getEmailVerifiedAt()!=null&&guest.getEmail()!=null&&user.getEmail().equalsIgnoreCase(guest.getEmail());
        boolean phone=user.getPhoneVerifiedAt()!=null&&user.getPhoneE164().equals(guest.getPhoneE164());return email||phone;
    }
    private String maskPhone(String phone){return phone.length()<6?"***":phone.substring(0,3)+"***"+phone.substring(phone.length()-3);}

    private String newTrackingCode() {
        for (int attempt=0; attempt<10; attempt++) {
            StringBuilder value = new StringBuilder("KC-").append(Year.now().getValue()).append("-");
            for (int i=0; i<10; i++) value.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            if (!submissions.existsByTrackingCodeIgnoreCase(value.toString())) return value.toString();
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "TRACKING_CODE_FAILED", "A tracking code could not be created.");
    }
    private String normalizeCode(String v) { return v == null ? "" : v.trim().toUpperCase(Locale.ROOT); }
    private void require(String value, String label) { if (value == null || value.isBlank()) throw bad("FIELD_REQUIRED", "Please enter the " + label + "."); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private ApiException bad(String code, String message) { return new ApiException(HttpStatus.BAD_REQUEST, code, message); }
    public record ClaimableGuestResponse(UUID id,String parentName,String maskedPhone,int submissionCount,Instant firstSubmittedAt,Instant lastSubmittedAt){}
}
