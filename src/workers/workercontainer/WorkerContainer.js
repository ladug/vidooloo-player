/**
 * Created by vladi on 25-May-17.
 */
import EventEmitter from "../../events/EventEmitter";
import Event from "../../events/Event";

class MessageEvent extends Event {

}

export default class WorkerContainer {
    worker = null;

    constructor(worker) {
        this.worker = worker;
    }

    send(type, payload) {
        this.worker.postMessage({
            type: type || null,
            payload: payload
        });
    }
}
