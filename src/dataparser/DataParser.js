/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import PvfReader from "../readers/PvfReader";
import SvfReader from "../readers/SvfReader";
export default class DataParser extends EventEmitter {
    svfBytes = null;
    pvfBytes = null;

    addSvfChunk(chunk) {

    }

    addPvfChunk(chunk) {

    }
}