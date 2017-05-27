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
    samples = [];

    addSvfChunk(chunk, data) {
        this.svfChunks.push({chunk, data});
        if (!this.svfHeader) {
            this._getSvfHeader();
        }
    }

    _getSvfHeader() {
        const svfHeader = new SvfHeader(this.svfChunks);
        if (!svfHeader.isHeaderComplete()) {
            return this.dispatchEvent(new MissingHeaderEvent());
        }

        const svfData = svfHeader.extractExtraBytes();
        this.svfChunks = [{
            chunk: svfData,
            data: {
                offset: svfHeader.size,
                size: svfData.length
            }
        }];
        this.svfHeader = svfHeader;

    }

    addPvfChunk(chunk, data) {
        this.pvfChunks.push({
            chunk,
            data
        });
    }
}