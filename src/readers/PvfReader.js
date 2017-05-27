/**
 * Created by vladi on 27-May-17.
 */
import {assert,readByteString} from "../common";

export default class PvfReader {
    constructor() {

    }
};



export class PvfHeader {
    _type = null;
    _version = null;
    _uid = null;

    constructor(headerBytes, expected = 56) {
        assert(headerBytes.length === expected, "Wrong header size!");
        this._type = readByteString(headerBytes);
        this._version = readByteString(headerBytes, 4);
        this._uid = readByteString(headerBytes, 8, 48);
    }

    get type() {
        return this._type;
    }

    get version() {
        return this._version;
    }

    get uid() {
        return this._uid;
    }
}