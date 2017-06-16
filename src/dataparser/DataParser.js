/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {PvfHeader} from "../readers/PvfReader";
import {SvfHeader} from "../readers/SvfReader";
import {HeadersReadyEvent} from "./DataParserEvents";
import BufferByteStream from "../ByteStream/BufferByteStream";

const SAMPLE_TYPE_FLAG = 0;
const SAMPLE_KEY_FLAG = 1;
const SAMPLE_EXTRA_FLAG = 2;
const SAMPLE_EXTRA_TWO_FLAG = 3;

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
    containsCompleteSample = (pvfChunkSize, svfChunkSize, dataChunkSize, pvfRemaining, svfRemaining) => {
        return (pvfChunkSize && svfChunkSize)
            && (svfChunkSize + dataChunkSize) <= svfRemaining
            && pvfChunkSize <= pvfRemaining;
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
    getSampleData = (pvfStream, svfStream) => {
        pvfStream.snap();
        svfStream.snap();
        const {pvfChunkSize, svfChunkSize, dataChunkSize, factor, ...rest} = getSampleHeaders(pvfStream, svfStream);
        if (!containsCompleteSample(pvfChunkSize, svfChunkSize, dataChunkSize, pvfStream.remaining, svfStream.remaining)) {
            pvfStream.reset();
            svfStream.reset();
            return null;
        }
        pvfStream.commit();
        svfStream.commit();
        return {
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
    headersReady = false;

    get sampleCount() {
        return this.samples.length;
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
        this.readSamples();
    }

    addPvfChunk(chunk) {
        this.pvfStream.addChunk(chunk);
        if (!this.pvfHeader) {
            this.pvfHeader = new PvfHeader(this.pvfStream);
        }
        this._checkDispatchHeaders();
        this.readSamples();
    }

    readSamples() {
        let sampleData;
        const {pvfStream, svfStream, samples} = this, extractedSamples = [];
        if (!pvfStream.length || !pvfStream.remaining || !svfStream.length || !svfStream.remaining) {
            return;
        }
        while (sampleData = getSampleData(pvfStream, svfStream)) {
            extractedSamples.push(sampleData);
        }
        console.log(extractedSamples);
    }
}