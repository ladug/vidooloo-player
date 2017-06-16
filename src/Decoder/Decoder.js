/**
 * Created by vladi on 12-Jun-17.
 */
import EventEmitter from '../events/EventEmitter';
import WorkerLoader from '../workerloader/WorkerLoader'
import {WorkerReady, WorkerError} from '../workerloader/WorkerLoaderEvents'
import {PictureDecodedEvent} from './DecoderEvents';

export default class Decoder extends EventEmitter {
    sampleQue = [];
    worker = null;
    decoder = null;
    isWorkerReady = false;
    isDecoderReady = false;
    decodingTimeout = 0;
    configurations = {
        src: null,
        useWebgl: true,
        reuseMemory: true,
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

    _runDecoderQue = () => {
        window.clearTimeout(this.decodingTimeout);
        this.decodingTimeout = window.setTimeout(this._runDecode, 0);
    };

    decode(sample) {
        this.sampleQue.push(sample);
        this._runDecoderQue();
    }

    _runDecode = () => {
        const {isReady, sampleQue, _runDecoderQue} = this;
        if (isReady && sampleQue.length) {
            const sample = sampleQue.shift();


            _runDecoderQue();
        }
    };

    _onWorkerReady = (e) => {
        this.worker = e.worker;
        this._initWorker();
    };

    _initWorker = () => {
        const {worker, _onWorkerMessage} = this, {useWebgl, reuseMemory} = this.configurations;
        worker.addEventListener('message', _onWorkerMessage);
        worker.postMessage({
            type: "Broadway.js - Worker init", options: {
                rgb: useWebgl,
                reuseMemory: reuseMemory
            }
        });
    };

    _onWorkerMessage = ({data}) => {
        if (data.consoleLog) {
            console.log(data.consoleLog);
            return;
        }
        window.setTimeout(() => {
            this.dispatchEvent(new PictureDecodedEvent({
                data: new Uint8Array(data.buf),
                width: data.width,
                height: data.height,
                info: data.infos
            }));
        }, 0)
    };

    _onWorkerError = (e) => {
        console.error("_onWorkerError", e);
    };
}