/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import PvfReader from "../readers/PvfReader";
import SvfReader, {SvfHeader} from "../readers/SvfReader";
import {} from "./DataParserEvents";
import BufferByteStream from "../ByteStream/BufferByteStream";

export default class DataParser extends EventEmitter {
    pvfStream = new BufferByteStream();
    svfStream = new BufferByteStream();
    svfHeader = null;
    samples = [];

    addSvfChunk(chunk) {
        this.svfStream.addChunk(chunk);
        if (!this.svfHeader) {
            this.svfHeader = new SvfHeader(this.svfStream);
        }
    }

    addPvfChunk(chunk) {
        this.pvfStream.addChunk(chunk);
    }

}