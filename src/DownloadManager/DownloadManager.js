/**
 * Created by vladi on 26-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ManagerReadyEvent, ChunkDownloadedEvent} from "./DownloadManagerEvents";
import Stream from "../stream/Stream";
import {StreamSuccess, StreamError} from "../stream/StreamEvents";
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
        readSize: 128 * kb,
        streamConfigurations: {}
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
            this.streamThreads = (new Array(threads)).fill().map(() => new Stream(streamConfigurations));
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


}