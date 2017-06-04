/**
 * Created by vladi on 31-May-17.
 */
import {assert, last, lastIndex, mergeBuffers} from "../common";

const getCrossChunkData = (chunks, firstChunkOffset, lastChunkDataSize) => {
        if (lastChunkDataSize <= 0 || chunks.length < 2) {
            return null;
        }
        chunks[0] = chunks[0].slice(firstChunkOffset);
        chunks[lastIndex(chunks)] = last(chunks).slice(0, lastChunkDataSize);
        return mergeBuffers(chunks);
    },
    getSplitData = (firstChunk, firstChunkOffset, secondChunk, missingBytes) => {
        //super fast for under 50 bytes operations, otherwise best to use mergeBuffers or alike
        const result = [];
        for (let i = 0; i < missingBytes; i++) {
            result.push(firstChunk[firstChunkOffset + i]);
        }
        for (let i = 0; i < missingBytes; i++) {
            result.push(secondChunk[i])
        }
        return new Uint8Array(result);
    },
    read4 = (bytes, offset = 0) => {
        const byte = bytes[offset] >> 4; //shift 4 right to get the first 4 bits
        return [
            byte >> 3, //shift 3 right to get the first bit
            byte & 4 >> 2, // (1111 & 0100 -> 0100), (1010 & 0100 -> 0000), then shift 2 to the right to get the bit
            byte & 2 >> 1, // same only compare to 0010, then shift right once to expose the bit
            byte & 1 //compare to 0001 if matches then 1 else 0
        ]
    },
    read8 = (bytes, offset = 0) => {
        return bytes[offset];
    },
    read16 = (bytes, offset = 0) => {
        return bytes[offset] << 8 | bytes[offset + 1];
    },
    read20 = (bytes, offset = 0) => {
        return (bytes[0] & 15) << 16 | bytes[offset + 1] << 8 | bytes[offset + 2]; //un mark the first 4 bits then read 24
    },
    read24 = (bytes, offset = 0) => {
        return bytes[offset] << 16 | bytes[offset + 1] << 8 | bytes[offset + 2];
    },
    read32 = (bytes, offset = 0) => {
        return bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3];
    },
    readChar4 = (bytes, offset = 0) => {
        return bytes.slice(offset, offset + 4).map(byte => String.fromCharCode(byte)).join('');
    };

export default class BufferByteStream {
    chunks = [];
    chunksData = [];
    chunkIndex = 0;
    chunkOffset = 0;
    offset = 0;
    size = 0;

    configurations = {
        cacheReadToBlobs: false,
        cacheOffset: 0,
        cacheChunkSize: 0
    };

    constructor(chunks, configurations = {}) {
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
        chunks.forEach(
            chunk => this.addChunk(chunk)
        );
    }

    get remaining() {
        return this.size - this.offset;
    }

    get length() {
        return this.size;
    }

    get hasData() {
        return this.offset < this.length;
    }

    get currentChunkData() {
        return this.chunksData[this.chunkIndex];
    }

    get currentChunk() {
        return this.chunks[this.chunkIndex] || new Uint8Array(0);
    }

    get nextChunk() {
        return this.chunks[this.chunkIndex + 1] || new Uint8Array(0);
    }

    _updateChunkIndex(chunksRead) {
        this.chunkIndex += chunksRead;
        this.chunkOffset = 0;
    }

    _updateOffset(readSize, chunkReadSize) {
        this.offset += readSize;
        this.chunkOffset += chunkReadSize;
        return this.chunkOffset;
    }

    _read(readSize, operator) {
        const {chunkOffset, currentChunk, currentChunkData: {size}} = this,
            missingBytes = (chunkOffset + readSize) - size;
        if (missingBytes > 0) {
            this._updateChunkIndex(1);
            this._updateOffset(readSize, missingBytes);
            return operator(
                getSplitData(currentChunk, chunkOffset, this.nextChunk, missingBytes)
            );
        }
        this._updateOffset(readSize);
        return operator(currentChunk, chunkOffset);
    }

    reset() {
        this.offset =
            this.chunkIndex =
                this.chunkOffset = 0;
    }

    addChunk(uint8Chunk) {
        const {chunks, chunksData, size} = this,
            chunkSize = uint8Chunk.byteLength;
        assert(chunkSize >= 4, "Minimum chunk is 4 bytes!");
        chunksData.push({
            start: size,
            end: size + chunkSize,
            size: chunkSize,
            chunkIndex: chunks.length
        });
        chunks.push(uint8Chunk);
        this.size += chunkSize;
    }

    read(readSize) {
        const {chunkOffset, currentChunk, offset, currentChunkData: {size}} = this,
            currentChunkRemaining = size - chunkOffset;
        if (readSize > currentChunkRemaining) {
            const {chunks, chunksData, chunkIndex} = this,
                readOffset = offset + readSize,
                readChunksData = chunksData.slice(chunkIndex).filter(({end}) => end <= readOffset),
                lastChunkDataSize = readOffset - last(readChunksData).start;
            this._updateChunkIndex(lastIndex(readChunksData)); // minus the current chunk
            this._updateOffset(readSize, lastChunkDataSize);
            return getCrossChunkData(
                readChunksData.map(({chunkIndex}) => chunks[chunkIndex]),
                chunkOffset,
                lastChunkDataSize
            );
        } else {
            this._updateOffset(readSize);
            return currentChunk.slice(chunkOffset, this.chunkOffset);
        }
    }

    readChar4() {
        return this._read(4, readChar4);
    }

    read4() {
        const {chunkOffset, currentChunk} = this;
        return read4(currentChunk, chunkOffset)
    }

    read8() {
        const {chunkOffset, currentChunk, currentChunkData: {size}} = this;
        if (chunkOffset === size) {
            this._updateChunkIndex(1);
            this._updateOffset(1);
            return read8(this.nextChunk);
        } else {
            this._updateOffset(1);
            return read8(currentChunk, chunkOffset);
        }
    }

    read16() {
        return this._read(2, read16);
    }

    read20() {
        return this._read(3, read20);
    }

    read24() {
        return this._read(3, read24);
    }

    read32() {
        return this._read(4, read32);
    }
}