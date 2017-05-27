/**
 * Created by vladi on 27-May-17.
 */
import {assert, readByteString, mergeBuffers} from "../common";

export default class SvfReader {
    constructor() {

    }
};

export class SvfHeader {
    _basicInfo = null;
    _dataSize = null;
    _size = null;
    _headerBytes = null;
    _extraBytes = null;

    constructor(chunkArray) {
        this._dataSize = chunkArray.reduce((total, chunk) => (total + chunk.data.size), 0);
        if (!this._basicInfo) {
            this._readBasicInfo(chunkArray[0].chunk)
        }
        if (this.isHeaderComplete()) {
            const buffer = mergeBuffers(chunkArray.map(({chunk}) => chunk));
            this._headerBytes = buffer.subarray(12, this._size);
            this._extraBytes = buffer.subarray(this._size, this._dataSize);
            this._dataSize = this._size;
        }
    }

    isHeaderComplete() {
        return this._dataSize >= this._size;
    }

    _readBasicInfo(headerBytes) {
        this._basicInfo = {
            _type: readByteString(headerBytes),
            _version: readByteString(headerBytes, 4),
            _subVersion: headerBytes[8],
            _headersSize: ( headerBytes[9] << 16 | headerBytes[10] << 8 | headerBytes[11])
        };
        this._size = this._basicInfo._headersSize + 12; //headers + file type and versions
    }

    get size() {
        return this._size;
    }

    extractExtraBytes() {
        const {_extraBytes} = this;
        this._extraBytes = null;
        return _extraBytes;
    }
}
