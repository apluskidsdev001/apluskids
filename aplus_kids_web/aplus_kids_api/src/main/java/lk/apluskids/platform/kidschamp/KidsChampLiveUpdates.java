package lk.apluskids.platform.kidschamp;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
class KidsChampLiveUpdates {
    private final CopyOnWriteArrayList<SseEmitter> publicClients=new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<SseEmitter> adminClients=new CopyOnWriteArrayList<>();

    SseEmitter connectPublic(){return connect(publicClients,false);}
    SseEmitter connectAdmin(){return connect(adminClients,true);}

    private SseEmitter connect(CopyOnWriteArrayList<SseEmitter> clients,boolean admin){
        SseEmitter emitter=new SseEmitter(0L);clients.add(emitter);
        emitter.onCompletion(()->clients.remove(emitter));emitter.onTimeout(()->clients.remove(emitter));
        emitter.onError(exception->clients.remove(emitter));
        Object connected=admin?new Update("CONNECTED","SYSTEM",new UUID(0,0),Instant.now()):new PublicUpdate("REFRESH",Instant.now());
        try{emitter.send(SseEmitter.event().name("connected").data(connected));}
        catch(IOException|RuntimeException exception){removeAndComplete(clients,emitter);}
        return emitter;
    }

    void publish(String action,String entityType,UUID entityId){
        Update update=new Update(action,entityType,entityId,Instant.now());
        send(adminClients,update);
        send(publicClients,new PublicUpdate("REFRESH",update.occurredAt()));
    }

    private void send(CopyOnWriteArrayList<SseEmitter> clients,Object update){
        for(SseEmitter emitter:clients)try{emitter.send(SseEmitter.event().name("update").data(update));}
        catch(IOException|RuntimeException exception){removeAndComplete(clients,emitter);}
    }

    private void removeAndComplete(CopyOnWriteArrayList<SseEmitter> clients,SseEmitter emitter){
        clients.remove(emitter);
        try{emitter.complete();}catch(RuntimeException ignored){}
    }

    record Update(String action,String entityType,UUID entityId,Instant occurredAt){}
    record PublicUpdate(String signal,Instant occurredAt){}
}
