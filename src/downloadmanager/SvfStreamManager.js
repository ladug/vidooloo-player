/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ChunkDownloadedEvent} from "./DownloadManagerEvents";
import Stream from "../stream/Stream";
import {StreamError, StreamSuccess, StreamAbort} from "../stream/StreamEvents";
import {assert, kb} from "../common";

export default class SvfStreamManager extends EventEmitter {
    readStream = new Stream({
        responseType: "arraybuffer"
    });
    configurations = {
        pvfUid: null,
        type: null,
        version: null,
        src: null,
        useWorkers: false,
        readOffset: 0,
        readSize: 32 * kb,
    };

    constructor(configurations) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
        this.readStream.addEventListener(StreamSuccess, this._onChunkSuccess);
        this.readStream.addEventListener(StreamError, this._onChunkError);
        this.readStream.addEventListener(StreamAbort, this._onChunkAbort);
    }

    _onChunkSuccess = (event) => {
        this.configurations.readOffset = event.payload.chunkData.offset + event.payload.chunkData.size;
        this.dispatchEvent(new ChunkDownloadedEvent(event));
    };
    _onChunkError = (event) => {
        console.error("SVF-_onChunkError", event);
    };
    _onChunkAbort = (event) => {
        console.error("SVF-_onChunkAbort", event);
    };

    readChunk() {
        const {readStream} = this,
            {readOffset, readSize, src} = this.configurations;
        readStream.chunkData = {
            offset: readOffset,
            size: readSize
        };
        readStream.setHeaders({
            "range": ["bytes=", readOffset, "-", (readOffset + readSize - 1)].join('')
        });
        readStream.get(src);
    }
}