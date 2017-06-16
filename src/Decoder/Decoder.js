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
    isWorkerBusy = false;
    isDecoderReady = false;
    isDecoderBusy = false;
    decodingTimeout = 0;
    configurations = {
        src: null,
        useWebgl: true,
        reuseMemory: true,
        useWorker: true,
        useDocker: true
    };

    get isBusy() {
        const {isWorkerBusy, isWorkerReady, isDecoderBusy} = this;
        return ( isWorkerReady && !isWorkerBusy) || (isDecoderReady && !isDecoderBusy);
    }

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
        this.sampleQue.push(sample);
        this._runDecoderQue();
    }

    _decodeSample(sample) {
        console.log(sample)
        /*worker.postMessage({
         buf: parData.buffer,
         offset: parData.byteOffset,
         length: parData.length,
         info: parInfo
         }, [parData.buffer]);*/

    }
    _runDecoderQue = () => {
        window.clearTimeout(this.decodingTimeout);
        this.decodingTimeout = window.setTimeout(this._runDecode, 0);
    };
    _runDecode = () => {
        const {isReady, isBusy, sampleQue} = this;
        if (isReady && !isBusy && sampleQue.length) {
            this._decodeSample(sampleQue.shift());
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
        this.isDecoderReady = true;
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
            this.isWorkerBusy = false;
            this._runDecoderQue();
        }, 0)
    };

    _onWorkerError = (e) => {
        console.error("_onWorkerError", e);
    };
}