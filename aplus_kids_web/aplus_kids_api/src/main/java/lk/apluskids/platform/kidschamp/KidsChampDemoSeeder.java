package lk.apluskids.platform.kidschamp;

import java.nio.file.*;
import java.time.*;
import java.util.*;
import lk.apluskids.platform.child.*;
import lk.apluskids.platform.role.*;
import lk.apluskids.platform.user.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Local-only demo records. Enable once with APLUS_KIDS_DEMO_SEED=true. */
@Component
@ConditionalOnProperty(name="aplus.kids-champ.demo-seed",havingValue="true")
class KidsChampDemoSeeder implements CommandLineRunner {
    private final UserRepository users; private final RoleRepository roles; private final ChildProfileRepository children;
    private final KidsChampSubmissionRepository submissions; private final KidsChampGuestContactRepository guests;private final KidsChampGuestParticipantRepository guestParticipants;
    private final KidsChampAdminService admin; private final PasswordEncoder passwords;
    KidsChampDemoSeeder(UserRepository users,RoleRepository roles,ChildProfileRepository children,KidsChampSubmissionRepository submissions,KidsChampGuestContactRepository guests,KidsChampGuestParticipantRepository guestParticipants,KidsChampAdminService admin,PasswordEncoder passwords){this.users=users;this.roles=roles;this.children=children;this.submissions=submissions;this.guests=guests;this.guestParticipants=guestParticipants;this.admin=admin;this.passwords=passwords;}
    @Override @Transactional public void run(String... args) {
        if(users.existsByEmailIgnoreCase("demo.parent1@apluskids.test")) return;
        RoleEntity userRole=roles.findByName("ROLE_USER").orElseThrow();
        UserEntity actor=users.findAll().stream().filter(u->u.getRoles().stream().anyMatch(r->"ROLE_ADMIN".equals(r.getName())||"ROLE_SUPER_ADMIN".equals(r.getName()))).findFirst().orElse(null);
        for(int index=1;index<=4;index++){
            UserEntity parent=new UserEntity();parent.setAccountHolderName("DEMO Parent "+index);parent.setEmail("demo.parent"+index+"@apluskids.test");parent.setPhoneE164("+94770000"+String.format("%03d",index));parent.setPasswordHash(passwords.encode("DemoPass123!"));parent.setStatus(AccountStatus.ACTIVE);parent.setEmailVerifiedAt(Instant.now());parent.replaceRoles(Set.of(userRole));users.save(parent);
            ChildProfileEntity child=new ChildProfileEntity();child.setUser(parent);child.setFullName("DEMO Child "+index);child.setDateOfBirth(LocalDate.now().minusYears(6+index));child.setGender(index%2==0?Gender.GIRL:Gender.BOY);child.setCountryCode("LK");child.setProvince("Western");child.setHometown(index%2==0?"Colombo":"Kandy");children.save(child);
            submission(parent,child,null,index, index==1?ReviewStatus.SUBMITTED:index==2?ReviewStatus.UNDER_REVIEW:ReviewStatus.APPROVED, actor);
        }
        for(int index=1;index<=3;index++){
            KidsChampGuestContactEntity guest=new KidsChampGuestContactEntity();guest.setParentName("DEMO Guest Parent "+index);guest.setEmail("demo.guest"+index+"@apluskids.test");guest.setPhoneE164("+94771100"+String.format("%03d",index));guest.setCountryCode("LK");guest.setProvince("Southern");guest.setHometown("Galle");guests.save(guest);
            submission(null,null,guest,10+index,index==3?ReviewStatus.REJECTED:ReviewStatus.APPROVED,actor);
        }
        if(actor!=null){admin.createTask(actor.getPublicId(),LocalDate.now(),"DEMO: review today\u2019s submissions","Created automatically for the Kids Champ test run.");admin.createTask(actor.getPublicId(),LocalDate.now().plusDays(1),"DEMO: prepare approved ZIP","Verify selected files before download.");}
    }
    private void submission(UserEntity user,ChildProfileEntity child,KidsChampGuestContactEntity guest,int number,ReviewStatus status,UserEntity actor){
        String childName=child!=null?child.getFullName():"DEMO Guest Child "+number;LocalDate dob=LocalDate.now().minusYears(8);
        KidsChampSubmissionEntity item=new KidsChampSubmissionEntity();item.setTrackingCode("DEMO-"+String.format("%05d",number));item.setUser(user);item.setChildProfile(child);item.setGuestContact(guest);item.setChildName(childName);item.setDateOfBirth(dob);item.setAgeAtSubmission(8);item.setParentName(user!=null?user.getAccountHolderName():guest.getParentName());item.setEmail(user!=null?user.getEmail():guest.getEmail());item.setPhoneE164(user!=null?user.getPhoneE164():guest.getPhoneE164());item.setCountryCode("LK");item.setProvince(child!=null?child.getProvince():guest.getProvince());item.setHometown(child!=null?child.getHometown():guest.getHometown());item.setCategory(number%2==0?"Painting":"Drawing");item.setWorkTitle("DEMO artwork "+number);item.setWorkDescription("Safe dummy record for administrator testing.");item.setOriginalFilename("demo-"+number+".png");item.setStoredFilename(null);item.setMediaType("image/png");item.setFileSize(1);item.setConsentAcceptedAt(Instant.now());
        if(guest!=null){KidsChampGuestParticipantEntity participant=new KidsChampGuestParticipantEntity();participant.setContact(guest);participant.setChildName(childName);participant.setDateOfBirth(dob);participant.setProvince(guest.getProvince());participant.setHometown(guest.getHometown());guestParticipants.save(participant);item.setGuestParticipant(participant);}
        if(status!=ReviewStatus.SUBMITTED)item.review(status,status==ReviewStatus.REJECTED?"DEMO rejection reason":null,actor);submissions.save(item);
    }
}
