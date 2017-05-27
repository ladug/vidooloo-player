/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ChunkDownloadedEvent} from "../DownloadManager/DownloadManagerEvents";
import {} from "../DownloadManager/SvfStreamManagerEvents";
import {HeadersEvent} from "./DigestControlEvents";
import {assert} from "../common";


export default class DigestControl extends EventEmitter {
    pvfDownloadManager = null;
    svfDownloadManager = null;
    configurations = {};

    constructor(pvfDownloadManager, svfDownloadManager, configurations) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };

        this.pvfDownloadManager = pvfDownloadManager;
        this.pvfDownloadManager.addEventListener(ChunkDownloadedEvent, _onPvfChunk);
        this.svfDownloadManager = svfDownloadManager;
        this.svfDownloadManager.addEventListener(ChunkDownloadedEvent, _onSvfChunk);
    }

    _onPvfChunk = (event) => {
        console.log("_onPvfChunk", event);
    };

    _onSvfChunk = (event) => {
        console.log("_onSvfChunk", event);
    };

    start() {
        const {pvfDownloadManager, svfDownloadManager} = this;
        pvfDownloadManager.readChunks(1);
        svfDownloadManager.readChunk();
    }
}