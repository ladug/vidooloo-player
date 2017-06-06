/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {PvfHeader} from "../readers/PvfReader";
import {SvfHeader} from "../readers/SvfReader";
import {} from "./DataParserEvents";
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
            size,
            duration,
            dataChunkSize,
            pvfChunkSize,
            svfChunkSize,
            [SAMPLE_TYPE_FLAG]: flags[SAMPLE_TYPE_FLAG],
            [SAMPLE_KEY_FLAG]: flags[SAMPLE_KEY_FLAG]
        }
    };

export default class DataParser extends EventEmitter {
    pvfStream = new BufferByteStream();
    svfStream = new BufferByteStream();
    svfHeader = null;
    pvfHeader = null;
    samples = [];

    get sampleCount() {
        return this.samples.length;
    }

    addSvfChunk(chunk) {
        this.svfStream.addChunk(chunk);
        if (!this.svfHeader) {
            this.svfHeader = new SvfHeader(this.svfStream);
        }
        this.readSamples();
    }

    addPvfChunk(chunk) {
        this.pvfStream.addChunk(chunk);
        if (!this.pvfHeader) {
            this.pvfHeader = new PvfHeader(this.pvfStream);
        }
        this.readSamples();
    }

    readSamples() {
        const {pvfStream, svfStream, samples} = this;
        if (!pvfStream.length || !pvfStream.remaining || !svfStream.length || !svfStream.remaining) {
            return;
        }
        console.log(getSampleHeaders(pvfStream, svfStream));


    }


}