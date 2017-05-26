/**
 * Created by vladi on 26-May-17.
 */
import Event from "../events/Event";
export class ChunkDownloadedEvent extends Event {
    chunk = null;

    constructor(chunk) {
        super();
        this.chunk = chunk || null;
    }
}

export class ManagerReadyEvent extends Event {
}