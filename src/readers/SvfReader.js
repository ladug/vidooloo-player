/**
 * Created by vladi on 27-May-17.
 */
import {assert, readByteString, mergeBuffers} from "../common";
import ByteStream from "../ByteStream/ByteStream";
export default class SvfReader {
    constructor() {

    }
};
//TODO: export SVF header reading into a separate NPM
const readHeaderMap = (stream, version, subversion) => {
        assert(version === "svf0", "Version [" + version + "] is not supported!");
        assert(subversion === 1, "Sub-Version [" + subversion + "] is not supported!");
        let result = {};
        while (stream.hasData) {
            const offset = stream.read32(),
                sample = stream.read24(),
                time = stream.read32();
            result[offset] = {
                sample,
                time
            }
        }
        return result;
    },
    readVideoConfig = (stream, version, subversion) => {
        assert(version === "svf0", "Version [" + version + "] is not supported!");
        assert(subversion === 1, "Sub-Version [" + subversion + "] is not supported!");
        return {
            duration: stream.read32(),          // File.writeUint32(svfFile, video.duration);
            timeScale: stream.read24(),         // File.writeUint24(svfFile, video.timeScale);
            videoWidth: stream.read16(),        // File.writeUint16(svfFile, video.width);
            videoHeight: stream.read16(),       // File.writeUint16(svfFile, video.height);
            sps: stream.read(stream.read16()),  // File.writeUint16(svfFile, avc.spsSize); -> File.writeData(svfFile, avc.sps);
            pps: stream.read(stream.read16()),  // File.writeUint16(svfFile, avc.ppsSize); -> File.writeData(svfFile, avc.pps);
        }
    },
    readAudioConfig = (stream, version, subversion) => {
        assert(version === "svf0", "Version [" + version + "] is not supported!");
        assert(subversion === 1, "Sub-Version [" + subversion + "] is not supported!");
        return {
            duration: stream.read32(),         // File.writeUint32(svfFile, audio.duration);
            timeScale: stream.read24(),          // File.writeUint24(svfFile, audio.timeScale);
            channels: stream.read8(),            // File.writeUint8(svfFile, mp4a.channels);
            compressionId: stream.read8(),     // File.writeUint8(svfFile, mp4a.compressionId);
            packetSize: stream.read8(),        // File.writeUint8(svfFile, mp4a.packetSize);
            sampleSize: stream.read8(),          // File.writeUint8(svfFile, mp4a.sampleSize);
            sampleRate: stream.read24(),       // File.writeUint24(svfFile, mp4a.sampleRate);
            adcd: stream.read(stream.read16()) // File.writeUint16(svfFile, mp4a.adcdSize); -> File.writeData(svfFile, mp4a.adcd);
        }
    };

export class SvfHeader {
    _basicInfo = null;
    _dataSize = null;
    _size = null;
    _headerStream = null;
    _extraBytes = null;

    _headerComplete = false;
    _videoMap = {};
    _audioMap = {};
    _videoConfigurations = {};
    _audioConfigurations = {};

    constructor(chunkArray) {
        this._dataSize = chunkArray.reduce((total, chunk) => (total + chunk.data.size), 0);
        if (!this._basicInfo) {
            this._readBasicInfo(chunkArray[0].chunk)
        }
        if (this.isHeaderComplete()) {
            const buffer = mergeBuffers(chunkArray.map(({chunk}) => chunk));
            this._headerStream = new ByteStream(buffer, 12);
            this._readSvfHeader();
            this._dataSize = this._headerStream.offset;

            this._headerComplete = true;
            this._extraBytes = this._headerStream.getRemaining();
            //cleanup
            this._headerStream.destroy();
            this._headerStream = null;
        }
    }

    _readBasicInfo(headerBytes) {
        this._basicInfo = {
            _type: readByteString(headerBytes),
            _version: readByteString(headerBytes, 4),
            _subVersion: headerBytes[8],
            _headersSize: ( headerBytes[9] << 16 | headerBytes[10] << 8 | headerBytes[11] )
        };
        this._size = this._basicInfo._headersSize + 12 + 512; //adding 512 config overhead
    }

    _readSvfHeader() {
        const {_headerStream: stream, _basicInfo: {_version, _subVersion}} = this;
        this._videoMap = readHeaderMap(
            new ByteStream(stream.read(stream.read16())),
            _version,
            _subVersion
        );
        this._audioMap = readHeaderMap(
            new ByteStream(stream.read(stream.read16())),
            _version,
            _subVersion
        );
        this._videoConfigurations = readVideoConfig(stream, _version, _subVersion);
        this._audioConfigurations = readAudioConfig(stream, _version, _subVersion);
    }

    isHeaderComplete() {
        return this._headerComplete || (this._dataSize >= this._size);
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
