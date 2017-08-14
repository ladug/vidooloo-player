/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ChunkDownloadedEvent} from "./DownloadManagerEvents";
import {StreamError, StreamSuccess, StreamAbort} from "../stream/StreamEvents";
import {assert, kb} from "../common";

const SVF_URL = "ws://localhost:3101/";

export default class SvfStreamManager extends EventEmitter {
    readStream = new WebSocket(SVF_URL);
    configurations = {
        pvfUid: null,
        type: null,
        version: null,
        src: null,
        useWorkers: false,
        readOffset: 0,
        readSize: 5 * kb,
    };

    constructor(configurations = {}) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
        this.readStream.onmessage = this._onMessage;
        this.readStream.onerror = this._onChunkError;

    }

    _onMessage = (event) => {
        let fileReader = new FileReader()
        fileReader.onload = () => this.dispatchEvent(new ChunkDownloadedEvent(fileReader.result));
        fileReader.readAsArrayBuffer(event.data);
    };

    _onChunkError = (event) => {
        console.error("SVF-_onChunkError", event);
    };

    readChunk() {
        const {readStream, configurations} = this,
            {file, readSize} = configurations;

        const data = JSON.stringify({
            file: file,
            portion: readSize,
        });

        if (readStream.readyState === WebSocket.OPEN) {
            readStream.send(data);
        } else {
            readStream.onopen = () => this.readStream.send(data);
        }
    }
}