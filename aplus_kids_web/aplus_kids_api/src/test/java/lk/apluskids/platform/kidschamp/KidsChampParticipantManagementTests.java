package lk.apluskids.platform.kidschamp;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import javax.imageio.ImageIO;
import lk.apluskids.platform.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class KidsChampParticipantManagementTests {
    @Autowired private KidsChampService publicService;
    @Autowired private KidsChampAdminService adminService;
    @Autowired private KidsChampSubmissionRepository submissions;
    @Autowired private KidsChampGuestParticipantRepository participants;
    @Autowired private UserRepository users;
    @Autowired private KidsChampStorage storage;

    @Test
    void siblingsUsingOneGuardianPhoneRemainSeparateParticipants(){
        String suffix=UUID.randomUUID().toString().substring(0,8);
        String phone="+9471"+String.format("%07d",Math.abs(suffix.hashCode())%10_000_000);
        var first=submit("Sibling One "+suffix,LocalDate.now().minusYears(7),phone,"Colombo");
        var second=submit("Sibling Two "+suffix,LocalDate.now().minusYears(10),phone,"Kandy");
        try{
            var firstStored=submissions.findByTrackingCodeIgnoreCase(first.trackingCode()).orElseThrow();
            var secondStored=submissions.findByTrackingCodeIgnoreCase(second.trackingCode()).orElseThrow();
            assertEquals(firstStored.getGuestContact().getPublicId(),secondStored.getGuestContact().getPublicId());
            assertNotEquals(firstStored.getGuestParticipant().getPublicId(),secondStored.getGuestParticipant().getPublicId());
            var visible=adminService.participants();
            assertTrue(visible.stream().anyMatch(item->item.id().equals(firstStored.getGuestParticipant().getPublicId())));
            assertTrue(visible.stream().anyMatch(item->item.id().equals(secondStored.getGuestParticipant().getPublicId())));
            assertTrue(adminService.duplicateMatches().stream().noneMatch(match->Set.of(match.firstId(),match.secondId()).equals(Set.of(firstStored.getGuestParticipant().getPublicId(),secondStored.getGuestParticipant().getPublicId()))));
        }finally{deletePhoto(first.trackingCode());deletePhoto(second.trackingCode());}
    }

    @Test
    void mergeEditHistoryAndUndoArePersistentAndDirectional(){
        String suffix=UUID.randomUUID().toString().substring(0,8);
        LocalDate dob=LocalDate.now().minusYears(9);
        var targetResponse=submit("Merge Child "+suffix,dob,"+9472"+digits(suffix,1),"Galle");
        var sourceResponse=submit("Merge Child "+suffix,dob,"+9472"+digits(suffix,2),"Galle");
        try{
            var target=submissions.findByTrackingCodeIgnoreCase(targetResponse.trackingCode()).orElseThrow().getGuestParticipant();
            var source=submissions.findByTrackingCodeIgnoreCase(sourceResponse.trackingCode()).orElseThrow().getGuestParticipant();
            UUID actor=users.findAll().getFirst().getPublicId();
            var merge=adminService.mergeGuests(actor,target.getPublicId(),source.getPublicId(),"Confirmed same child after checking guardian records",List.of("Same child name","Same date of birth"));
            assertEquals(source.getPublicId(),merge.sourceId());
            assertEquals(target.getPublicId(),merge.targetId());
            assertEquals(1,merge.movedSubmissions());
            assertTrue(adminService.participants().stream().noneMatch(item->item.id().equals(source.getPublicId())));
            assertEquals(2,adminService.participants().stream().filter(item->item.id().equals(target.getPublicId())).findFirst().orElseThrow().submissions());
            assertTrue(adminService.participantMergeHistory().stream().anyMatch(item->item.id().equals(merge.id())&&item.undoneAt()==null));

            var updated=adminService.updateParticipant(actor,target.getPublicId(),"Corrected Child "+suffix,dob.minusDays(1),"Matara",target.getContact().getPhoneE164());
            assertEquals("Corrected Child "+suffix,updated.name());
            assertEquals("Matara",participants.findByPublicId(target.getPublicId()).orElseThrow().getHometown());
            assertEquals("OPTED_OUT",adminService.updateWhatsAppPreference(actor,target.getPublicId(),"OPTED_OUT","Guardian requested no messages").status());
            assertTrue(adminService.participants().stream().filter(item->item.id().equals(target.getPublicId())).noneMatch(KidsChampAdminService.ParticipantResponse::whatsappConsented));

            var undone=adminService.undoParticipantMerge(actor,merge.id(),"The guardian confirmed these are separate children");
            assertNotNull(undone.undoneAt());
            assertTrue(adminService.participants().stream().anyMatch(item->item.id().equals(source.getPublicId())&&item.submissions()==1));
            assertEquals(1,adminService.participants().stream().filter(item->item.id().equals(target.getPublicId())).findFirst().orElseThrow().submissions());
        }finally{deletePhoto(targetResponse.trackingCode());deletePhoto(sourceResponse.trackingCode());}
    }

    private KidsChampResponse submit(String childName,LocalDate dob,String phone,String hometown){
        return publicService.submit(null,null,childName,dob,"Test Guardian","participant-"+UUID.randomUUID()+"@example.com",phone,"LK","Western",hometown,"Drawing","Test work",null,true,false,validPhoto());
    }
    private String digits(String seed,int salt){return String.format("%07d",Math.abs(Objects.hash(seed,salt))%10_000_000);}
    private void deletePhoto(String trackingCode){submissions.findByTrackingCodeIgnoreCase(trackingCode).map(KidsChampSubmissionEntity::getStoredFilename).filter(Objects::nonNull).ifPresent(storage::deleteBestEffort);}
    private MockMultipartFile validPhoto(){
        try{
            var image=new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB);var output=new ByteArrayOutputStream();
            if(!ImageIO.write(image,"png",output))throw new IllegalStateException("PNG writer unavailable");
            return new MockMultipartFile("photo","participant.png","image/png",output.toByteArray());
        }catch(Exception exception){throw new IllegalStateException(exception);}
    }
}
