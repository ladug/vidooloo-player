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
    preload = {
        isPartialPvf: false,
        isPartialSvf: false,
        video: {
            preloadDuration: 0,
            loadedTime: 1,
            currentTime: 0,
        },
        audio: {
            preloadDuration: 0,
            loadedTime: 1,
            currentTime: 0,
        }
    };
    _basicInfo = {};
    headers = {
        pvf: null,
        svf: null
    };
    configurations = {
        preload: 5
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
        const videoSample = this.dataParser.getVideoSample();
        this.preload.video.currentTime += videoSample.duration;
        this._checkRunPreloaded();
        return videoSample;
    }

    shiftAudioSample() {
        const audioSample = this.dataParser.getAudioSample();
        this.preload.audio.currentTime += audioSample.duration;
        this._checkRunPreloaded();
        return audioSample;
    }

    digestSamples() {
        return this.dataParser.parse();
    }

    _onSamplesUpdate = (event) => {
        console.log("_onSamplesUpdate", event);
        const {videoSamplesDuration, audioSamplesDuration, isPartialSvf, isPartialPvf} = event;
        this.preload.video.loadedTime = videoSamplesDuration;
        this.preload.audio.loadedTime = audioSamplesDuration;
        this.preload.isPartialPvf = isPartialPvf;
        this.preload.isPartialSvf = isPartialSvf;
        this._checkRunPreloaded();
    };

    _checkRunPreloaded = () => {
        const {
                video: {loadedTime: videoSamplesDuration, preloadDuration: videoPreloadDuration, currentTime: videoCurrentTime},
                audio: {loadedTime: audioSamplesDuration, preloadDuration: audioPreloadDuration, currentTime: audioCurrentTime}
            } = this.preload,
            isVideoPreloaded = (videoSamplesDuration - videoCurrentTime) >= videoPreloadDuration,
            isAudioPreloaded = (audioSamplesDuration - audioCurrentTime) >= audioPreloadDuration;

        if (!isVideoPreloaded || !isAudioPreloaded) {
            this._loadNextChunk();
        }
    };

    _loadNextChunk() {
        const {isPartialPvf, isPartialSvf} = this.preload;
        isPartialPvf && this.pvfDownloadManager.readChunks();
        isPartialSvf && this.svfDownloadManager.readChunk();
    }

    _onParserHeaders = (event) => {
        const {duration: videoDuration, timeScale: videoTimeScale, videoWidth, videoHeight} = event.svfHeader.videoConfigurations,
            {duration: audioDuration, timeScale: audioTimeScale} = event.svfHeader.audioConfigurations,
            {preload} = this.configurations;
        this.headers = {
            pvf: event.pvfHeader,
            svf: event.svfHeader
        };
        this.preload.video = {
            preloadDuration: preload * videoTimeScale,
            timeScale: videoTimeScale,
            currentTime: 0,
        };
        this.preload.video = {
            preloadDuration: preload * audioTimeScale,
            timeScale: audioTimeScale,
            currentTime: 0,
        };

        this._basicInfo = {
            videoDuration: Math.floor(videoDuration / videoTimeScale) * sec,
            audioDuration: Math.floor(audioDuration / audioTimeScale) * sec,
            videoTimeScale,
            audioTimeScale,
            videoWidth,
            videoHeight
        };
        this.dispatchEvent(new DigestControlReady(this._basicInfo));
    };

    getBasicInfo() {
        return this._basicInfo;
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
        pvfDownloadManager.readChunks();
        svfDownloadManager.readChunk();
    }
}