/**
 * Created by vladi on 12-Jun-17.
 */
import EventEmitter from '../events/EventEmitter';
import WorkerLoader from '../workerloader/WorkerLoader'
import {WorkerReady, WorkerError} from '../workerloader/WorkerLoaderEvents'

export default class Decoder extends EventEmitter {
    decodeQue = [];
    worker = null;
    decoder = null;
    isWorkerReady = false;
    isDecoderReady = false;
    configurations = {
        src: null,
        useWorker: true,
        useDocker: true
    };

    get isReady() {
        const {worker, isWorkerReady, decoder, isDecoderReady} = this;
        return (worker && isWorkerReady) || (decoder && isDecoderReady)
    }

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
            //TODO: add inline decoder to improve performance
        }
    }

    decode(sample) {
        this.decodeQue.push(sample);
        this._runDecode();
    }

    _runDecode() {
        if (this.isReady) {
            
        }
    }

    _onWorkerReady = (e) => {
        console.log("_onWorkerReady", e);
    };
    _onWorkerError = (e) => {
        console.log("_onWorkerError", e);
    };
}