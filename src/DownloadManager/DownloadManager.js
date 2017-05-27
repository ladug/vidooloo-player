/**
 * Created by vladi on 26-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ManagerReadyEvent, ChunkDownloadedEvent} from "./DownloadManagerEvents";
import Stream from "../stream/Stream";
import {StreamSuccess, StreamError,StreamProgress,StreamAbort} from "../stream/StreamEvents";
import {PvfHeader} from "../pvfreader/PvfReader";
import {assert, kb} from "../common";

export default class DownloadManager extends EventEmitter {
    streamThreads = [];
    configurations = {
        src: null, //TODO: default demo url
        threads: 1,
        useWorkers: false,
        readOffset: 0,
        headerSize: 56,
        readSize: 128 * kb, //per thread?
        streamConfigurations: {
            responseType: "arraybuffer",
        }
    };
    headerStream = new Stream();

    constructor(configurations, streamConfigurations) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations,
            streamConfigurations
        };
    }

    init() {
        const {threads, useWorkers, streamConfigurations} = this.configurations;
        assert(threads && threads > 0, "[DownloadManager] Illegal stream thread count!");
        if (useWorkers) {
            assert(false, "Not yet supported!")//TODO
        } else {
            this.streamThreads = (new Array(threads)).fill().map((a, index) => {
                const stream = new Stream(streamConfigurations);
                stream.addEventListener(StreamSuccess, this._chunkSuccess.bind(this, index));
                stream.addEventListener(StreamError, this._chunkError.bind(this, index));
                stream.addEventListener(StreamAbort, this._chunkAborted.bind(this, index));
                stream.addEventListener(StreamProgress, this._chunkProgress.bind(this, index));
                return stream;
            });
        }
        this._probeFile();
    }

    _updateReadOffset = (add) => {
        this.configurations.readOffset += add || 0;
    };
    _readHeader = (event) => {
        const {headerSize} = this.configurations;
        this._updateReadOffset(headerSize);
        this.dispatchEvent(new ManagerReadyEvent(
            new PvfHeader(
                new Uint8Array(event.payload.response)
            )
        ));
        this.headerStream.destroy();
        this.headerStream = null;
    };
    _headerError = () => {
        assert(false, "Could not read file!");
        this.headerStream.destroy();
        this.headerStream = null;
    };

    _probeFile() {
        const {src, headerSize} = this.configurations,
            {headerStream} = this;
        headerStream.set({
            responseType: "arraybuffer"
        });
        headerStream.setHeaders({
            "range": "bytes=0-" + (headerSize - 1)
        });
        headerStream.addEventListener(StreamSuccess, this._readHeader);
        headerStream.addEventListener(StreamError, this._headerError);
        headerStream.get(src);
    };

    _chunkProgress(streamIndex,event) {

    }
    _chunkAborted(streamIndex,event) {

    }

    _chunkError(streamIndex,event) {

    }

    _chunkSuccess(streamIndex,event) {

    };

    getChunk() {
        const {streamThreads} = this,
            {readOffset, readSize, src} = this.configurations;
        streamThreads.forEach(stream => {

        })
    }

}