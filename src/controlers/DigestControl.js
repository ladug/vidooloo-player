/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import DataParser from "../dataparser/DataParser";
import {sec} from "../common";
import {ChunkDownloadedEvent} from "../downloadmanager/DownloadManagerEvents";
import {HeadersReadyEvent, ExtractedSamplesEvent} from "../dataparser/DataParserEvents";
import {DigestControlReady} from "./DigestControlEvents";


export default class DigestControl extends EventEmitter {
    dataParser = new DataParser();
    pvfDownloadManager = null;
    svfDownloadManager = null;
    videoPreloadDuration = 0;
    audioPreloadDuration = 0;
    headers = {
        pvf: null,
        svf: null
    };
    configurations = {
        preload: 5 * sec
    };

    constructor(pvfDownloadManager, svfDownloadManager, configurations = {}) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
        this.dataParser.addEventListener(HeadersReadyEvent, this._onParserHeaders);
        this.dataParser.addEventListener(ExtractedSamplesEvent, this._onSamplesUpdate);
        this.pvfDownloadManager = pvfDownloadManager;
        this.pvfDownloadManager.addEventListener(ChunkDownloadedEvent, this._onPvfChunk);
        this.svfDownloadManager = svfDownloadManager;
        this.svfDownloadManager.addEventListener(ChunkDownloadedEvent, this._onSvfChunk);
    }

    shiftVideoSample() {
        return this.dataParser.getVideoSample();
    }

    shiftAudioSample() {
        return this.dataParser.getAudioSample();
    }

    digestSamples() {
        return this.dataParser.parse();
    }

    _onSamplesUpdate = (event) => {
        console.log("_onSamplesUpdate", event);
    };

    _onParserHeaders = (event) => {
        this.headers = {
            pvf: event.pvfHeader,
            svf: event.svfHeader
        };
        this.dispatchEvent(new DigestControlReady());
    };

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