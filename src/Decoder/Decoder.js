/**
 * Created by vladi on 12-Jun-17.
 */
import EventEmitter from '../events/EventEmitter';
import WorkerLoader from '../workerloader/WorkerLoader'
import {WorkerReady, WorkerError} from '../workerloader/WorkerLoaderEvents'

export default class Decoder extends EventEmitter {
    worker = null;
    decoder = null;
    configurations = {
        src: null,
        useWorker: true,
        useDocker: true
    };

    constructor(configurations = {}) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations,
        }
    }

    init() {
        const {useWorker, useDocker, src} = this.configurations;
        if (useWorker) {
            const workerLoader = new WorkerLoader(src);
            workerLoader.addEventListener(WorkerReady, this._onWorkerReady);
            workerLoader.addEventListener(WorkerError, this._onWorkerError);
        }
        if (useDocker) {

        }
    }

    _onWorkerReady = (e) => {
        console.log("_onWorkerReady", e);
    };
    _onWorkerError = (e) => {
        console.log("_onWorkerError", e);
    };
}