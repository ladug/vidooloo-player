/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import PvfReader from "../readers/PvfReader";
import SvfReader, {SvfHeader} from "../readers/SvfReader";
import {MissingHeaderEvent} from "./DataParserEvents";

export default class DataParser extends EventEmitter {
    pvfChunks = [];
    svfChunks = [];
    svfHeader = null;

    addSvfChunk(chunk, data) {

        this.svfChunks.push({
            chunk,
            data
        });

        if (!this.svfHeader) {
            const svfHeader = new SvfHeader(this.svfChunks);
            if (!svfHeader.isHeaderComplete()) {
                this.dispatchEvent(new MissingHeaderEvent());
            } else {
                this.svfHeader = svfHeader;
            }
        }

    }

    addPvfChunk(chunk, data) {
        this.pvfChunks.push({
            chunk,
            data
        });
    }
}