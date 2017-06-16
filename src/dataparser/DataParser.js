/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {PvfHeader} from "../readers/PvfReader";
import {SvfHeader} from "../readers/SvfReader";
import {HeadersReadyEvent, ExtractedSamplesEvent} from "./DataParserEvents";
import BufferByteStream from "../ByteStream/BufferByteStream";

const SAMPLE_TYPE_FLAG = 0,
    SAMPLE_KEY_FLAG = 1,
    SAMPLE_EXTRA_FLAG = 2,
    SAMPLE_EXTRA_TWO_FLAG = 3,
    SAMPLE_TYPE_VIDEO = 1;

const getSvfChunkSize = (size, skipFactor) => (size - (size % skipFactor)) / skipFactor,
    getPvfSampleHeader = (pvfStream) => ({
        flags: pvfStream.read4(),
        size: pvfStream.read20(),
        duration: pvfStream.read16(),
    }),
    getSvfSampleHeader = (svfStream) => ({
        size: svfStream.read24(),
        factor: svfStream.read8()
    }),
    getSampleHeaders = (pvfStream, svfStream) => {
        const {size: dataChunkSize, factor} = getSvfSampleHeader(svfStream),
            {flags, size, duration} = getPvfSampleHeader(pvfStream),
            svfChunkSize = getSvfChunkSize(size, factor),
            pvfChunkSize = size - svfChunkSize;
        return {
            factor,
            duration,
            dataChunkSize,
            pvfChunkSize,
            svfChunkSize,
            flags
        }
    },
    extractSampleData = (pvfChunk, svfChunk, skipFactor) => {
        const sampleSize = pvfChunk.length + svfChunk.length,
            sampleData = new Uint8Array(sampleSize),
            pvfChunkSize = skipFactor - 1;

        svfChunk.forEach((svfByte, index) => {
            const offset = index * skipFactor,
                pvfOffset = index * pvfChunkSize;
            sampleData[offset + pvfChunkSize] = svfByte;
            sampleData.set(pvfChunk.slice(pvfOffset, pvfOffset + pvfChunkSize), offset);
        });
        return sampleData;
    },
    containsCompletePvfSample = (pvfChunkSize, pvfRemaining) => {
        return pvfChunkSize && (pvfChunkSize <= pvfRemaining);
    },
    containsCompleteSvfSample = (svfChunkSize, svfRemaining, dataChunkSize) => {
        return svfChunkSize && ((svfChunkSize + dataChunkSize) <= svfRemaining);
    },
    getSampleData = (pvfStream, svfStream) => {
        pvfStream.snap();
        svfStream.snap();
        const {pvfChunkSize, svfChunkSize, dataChunkSize, factor, ...rest} = getSampleHeaders(pvfStream, svfStream),
            isPvfComplete = containsCompletePvfSample(pvfChunkSize, pvfStream.remaining),
            isSvfComplete = containsCompleteSvfSample(svfChunkSize, svfStream.remaining, dataChunkSize);

        if (!isPvfComplete || !isSvfComplete) {
            pvfStream.reset();
            svfStream.reset();
            return {
                partial: true,
                isPvfComplete,
                isSvfComplete
            };
        }
        pvfStream.commit();
        svfStream.commit();
        return {
            partial: false,
            ...rest,
            sampleData: extractSampleData(pvfStream.read(pvfChunkSize), svfStream.read(svfChunkSize), factor),
            data: svfStream.read(dataChunkSize)
        }
    };

export default class DataParser extends EventEmitter {
    pvfStream = new BufferByteStream();
    svfStream = new BufferByteStream();
    svfHeader = null;
    pvfHeader = null;
    videoSamples = [];
    videoSamplesDuration = 0;
    audioSamples = [];
    audioSamplesDuration = 0;
    headersReady = false;
    sampleTimer = 0;
    canRead = false;

    parse = () => {
        this.canRead = true;
        this._readSamples();
    };

    get videoSamplesLength() {
        return this.videoSamples.length;
    }

    get videoDuration() {
        return this.videoSamplesDuration;
    }

    get audioSamplesLength() {
        return this.audioSamples.length;
    }

    get audioDuration() {
        return this.audioSamplesDuration;
    }

    getVideoSample() {
        return this.videoSamplesLength ? this.videoSamples.shift() : null;
    }

    getAudioSample() {
        return this.audioSamplesLength ? this.audioSamples.shift() : null;
    }

    _checkDispatchHeaders() {
        const {headersReady, svfHeader, pvfHeader} = this;
        if (!headersReady && svfHeader && pvfHeader) {
            this.dispatchEvent(new HeadersReadyEvent(pvfHeader, svfHeader));
            this.headersReady = true;
        }
    }

    addSvfChunk(chunk) {
        this.svfStream.addChunk(chunk);
        if (!this.svfHeader) {
            this.svfHeader = new SvfHeader(this.svfStream);
        }
        this._checkDispatchHeaders();
        this._readSamples();
    }

    addPvfChunk(chunk) {
        this.pvfStream.addChunk(chunk);
        if (!this.pvfHeader) {
            this.pvfHeader = new PvfHeader(this.pvfStream);
        }
        this._checkDispatchHeaders();
        this._readSamples();
    }

    _readSamples() {
        const {canRead, pvfStream, svfStream, _softReadSamples} = this;
        if (canRead && pvfStream.length && pvfStream.remaining && svfStream.length && svfStream.remaining) {
            _softReadSamples();
        }
    }

    _softReadSamples = () => {
        window.clearTimeout(this.sampleTimer);
        const {pvfStream, svfStream, videoSamples, audioSamples, _softReadSamples} = this,
            sampleData = getSampleData(pvfStream, svfStream);
        if (!sampleData.partial) {
            if (sampleData.flags[SAMPLE_TYPE_FLAG] === SAMPLE_TYPE_VIDEO) {
                this.videoSamplesDuration += sampleData.duration;
                videoSamples.push(sampleData);
            } else {
                this.audioSamplesDuration += sampleData.duration;
                audioSamples.push(sampleData);
            }
            this.sampleTimer = window.setTimeout(_softReadSamples, 0);
        } else {
            this.dispatchEvent(new ExtractedSamplesEvent({
                videoSamplesDuration: this.videoSamplesDuration,
                audioSamplesDuration: this.audioSamplesDuration,
                partialPvf: !sampleData.isPvfComplete,
                partialSvf: !sampleData.isSvfComplete
            }));
        }
    }
}