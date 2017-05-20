/**
 * Created by vladi on 20-May-17.
 */
import Event from "../events/Event";

export class WorkerLoaded extends Event {
    constructor() {
        super();
    }
}

export class WorkerError extends Event {
    constructor() {
        super();
    }
}

export class WorkerReady extends Event {
    constructor() {
        super();
    }
}