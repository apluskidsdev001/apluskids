package lk.apluskids.platform.kidschamp;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
class KidsChampLiveUpdates {
    private final CopyOnWriteArrayList<SseEmitter> clients=new CopyOnWriteArrayList<>();

    SseEmitter connect(){
        SseEmitter emitter=new SseEmitter(0L);clients.add(emitter);
        emitter.onCompletion(()->clients.remove(emitter));emitter.onTimeout(()->clients.remove(emitter));
        try{emitter.send(SseEmitter.event().name("connected").data(new Update("CONNECTED","SYSTEM",new UUID(0,0),Instant.now())));}catch(IOException exception){clients.remove(emitter);}
        return emitter;
    }

    void publish(String action,String entityType,UUID entityId){
        Update update=new Update(action,entityType,entityId,Instant.now());
        for(SseEmitter emitter:clients) try{emitter.send(SseEmitter.event().name("update").data(update));}catch(IOException exception){clients.remove(emitter);emitter.complete();}
    }

    record Update(String action,String entityType,UUID entityId,Instant occurredAt){}
}
