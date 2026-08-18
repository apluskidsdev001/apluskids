package lk.apluskids.platform.kidschamp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Runs optional ZIP work after the approval transaction has completed. */
@Component
class KidsChampZipProcessingListener {
    private static final Logger log=LoggerFactory.getLogger(KidsChampZipProcessingListener.class);
    private final KidsChampAdminService service;

    KidsChampZipProcessingListener(KidsChampAdminService service){this.service=service;}

    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    void process(KidsChampZipProcessingRequested event){
        processSafely(event.actorId());
    }

    @EventListener(ApplicationReadyEvent.class)
    void resumeAtStartup(){processSafely(null);}

    @Scheduled(fixedDelayString="${aplus.kids-champ.zip-recovery-delay-ms:60000}")
    void resumePeriodically(){processSafely(null);}

    private void processSafely(java.util.UUID actorId){
        try{
            if(actorId==null) service.processAutomaticZips();
            else service.processAutomaticZips(actorId);
        }catch(Exception exception){
            log.error("Automatic Kids Champ ZIP processing failed. actorId={}",actorId,exception);
        }
    }
}
