/**
 * Created by vladi on 27-May-17.
 */
import {assert, readByteString, mergeBuffers, mb} from "../common";

export default class SvfReader {
    constructor() {

    }
};

export class SvfHeader {
    _type = null;
    _version = null;
    _subVersion = null;
    _headerSize = null;
    _haveBytes = 0;

    constructor(chunkArray) {
        const headerBytes = chunkArray[0].chunk;

        this._type = readByteString(headerBytes);
        this._version = readByteString(headerBytes, 4);
        this._subVersion = headerBytes[8];
        this._headerSize = headerBytes[9] << 16 | headerBytes[10] << 8 | headerBytes[11];
        this._haveBytes = chunkArray.reduce((total, chunk) => (total + chunk.data.size), 0);

        if (this.isHeaderComplete()) {
            let start = (new Date()).getTime();
            const buffer = mergeBuffers(chunkArray.map(({chunk}) => chunk));
            console.log("Operation took ", (new Date()).getTime() - start, "ms")
        }
    }

    isHeaderComplete() {
        return this._headerSize <= this._haveBytes;
    }
}
