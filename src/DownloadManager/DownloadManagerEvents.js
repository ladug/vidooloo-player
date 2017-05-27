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
    _payload = null;

    constructor(payload) {
        super();
        this._payload = payload;
    }

    get payload() {
        return this._payload;
    }
}