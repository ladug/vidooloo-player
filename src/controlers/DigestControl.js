/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import DataParser from "../dataparser/DataParser";
import {ChunkDownloadedEvent} from "../downloadmanager/DownloadManagerEvents";
import {} from "../dataparser/DataParserEvents";
import {HeadersEvent} from "./DigestControlEvents";
import {assert} from "../common";


export default class DigestControl extends EventEmitter {
    pvfDownloadManager = null;
    svfDownloadManager = null;
    configurations = {};
    dataParser = new DataParser();

    constructor(pvfDownloadManager, svfDownloadManager, configurations = {}) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
        this.pvfDownloadManager = pvfDownloadManager;
        this.pvfDownloadManager.addEventListener(ChunkDownloadedEvent, this._onPvfChunk);
        this.svfDownloadManager = svfDownloadManager;
        this.svfDownloadManager.addEventListener(ChunkDownloadedEvent, this._onSvfChunk);
    }

    _onPvfChunk = (event) => {
        console.log("_onPvfChunk", event);
        this.dataParser.addPvfChunk(new Uint8Array(event.chunk));
    };

    _onSvfChunk = (event) => {
        console.log("_onSvfChunk", event);
        this.dataParser.addSvfChunk(new Uint8Array(event.chunk));
    };

    init() {
        const {pvfDownloadManager, svfDownloadManager} = this;
        pvfDownloadManager.readChunks(1);
        svfDownloadManager.readChunk();
    }
}