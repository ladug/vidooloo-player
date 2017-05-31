/**
 * Created by vladi on 31-May-17.
 */
import {assert, mergeBuffers} from "../common";

const getSplitData = (firstChunk, firstChunkOffset, secondChunk, missingBytes) => {
        //super fast for under 50 bytes operations, otherwise best to use mergeBuffers or alike
        const result = [];
        for (let i = 0; i < missingBytes; i++) {
            result.push(firstChunk[firstChunkOffset++]);
        }
        for (let i = 0; i < missingBytes; i++) {
            result.push(secondChunk[i])
        }
        return result;
    }, read4 = (bytes, offset) => {
        const byte = bytes[offset] >> 4; //shift 4 right to get the first 4 bits
        return [
            byte >> 3, //shift 3 right to get the first bit
            byte & 4 >> 2, // (1111 & 0100 -> 0100), (1010 & 0100 -> 0000), then shift 2 to the right to get the bit
            byte & 2 >> 1, // same only compare to 0010, then shift right once to expose the bit
            byte & 1 //compare to 0001 if matches then 1 else 0
        ]

    }, read8 = (bytes, offset = 0) => {
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
    };


export default class BufferByteStream {
    chunks = [];
    chunksData = [];
    activeChunk = 0;
    chunkOffset = 0;
    offset = 0;
    size = 0;


    constructor(chunks) {
        chunks.forEach(chunk => this.addChunk(chunk));
    }

    get length() {
        return this.size;
    }

    get hasData() {
        return this.offset < this.length;
    }

    get currentChunkData() {
        return this.chunksData[this.activeChunk];
    }

    get currentChunk() {
        return this.chunks[this.activeChunk];
    }

    get nextChunkData() {
        return this.chunksData[this.activeChunk + 1];
    }

    get nextChunk() {
        return this.chunks[this.activeChunk + 1];
    }

    _updateActiveChunk(chunksRead) {
        this.activeChunk += chunksRead;
        this.chunkOffset = 0;
    }

    _updateOffset(readSize) {
        this.offset += readSize;
        this.chunkOffset += readSize;
        return this.chunkOffset;
    }

    _read(readSize, operator) {
        const {chunkOffset, currentChunk, currentChunkData: {size}} = this,
            missingBytes = (chunkOffset + readSize) - size;
        if (missingBytes > 0) {
            this._updateActiveChunk(1);
            this._updateOffset(missingBytes);
            return operator(
                getSplitData(currentChunk, chunkOffset, this.nextChunk, missingBytes)
            );
        }
        this._updateOffset(readSize);
        return operator(currentChunk, chunkOffset);
    }

    addChunk(uint8Chunk) {
        const {chunks, chunksData, size} = this,
            chunkSize = uint8Chunk.byteLength;
        assert(chunkSize >= 4, "Minimum chunk is 4 bytes!");
        chunks.push(uint8Chunk);
        chunksData.push({
            start: size,
            end: size + chunkSize,
            size: chunkSize
        });
        this.size += chunkSize;
    }

    read4() {
        const {chunkOffset, currentChunk} = this;
        return read4(currentChunk, chunkOffset)
    }

    read8() {
        const {chunkOffset, currentChunk, currentChunkData: {size}} = this;
        if (chunkOffset === size) {
            this._updateActiveChunk(1);
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


/**
 * Created by vladi on 28-May-17.
 */

/*
 export default class ByteStream {
 bytes = new Uint8Array(0);
 offset = 0;

 constructor(uint8Array, offset) {
 this.bytes = uint8Array;
 this.offset = offset || 0;
 }

 get length() {
 return this.bytes.length;
 }

 get hasData() {
 return this.offset < this.length;
 }

 updateOffset(readSize) {
 this.offset += readSize;
 }

 read4() {
 const {offset, bytes} = this,
 byte = bytes[offset] >> 4; //shift 4 right to get the first 4 bits
 return [
 byte >> 3, //shift 3 right to get the first bit
 byte & 4 >> 2, // (1111 & 0100 -> 0100), (1010 & 0100 -> 0000), then shift 2 to the right to get the bit
 byte & 2 >> 1, // same only compare to 0010, then shift right once to expose the bit
 byte & 1 //compare to 0001 if matches then 1 else 0
 ]
 }

 read8() {
 const {offset, bytes} = this;
 this.updateOffset(1);
 return bytes[offset];
 }

 read16() {
 const {offset, bytes} = this;
 this.updateOffset(2);
 return bytes[offset] << 8 | bytes[offset + 1];
 }

 read20() {
 const {offset, bytes} = this;
 this.updateOffset(3);
 return (bytes[0] & 15) << 16 | bytes[offset + 1] << 8 | bytes[offset + 2]; //un mark the first 4 bits then read 24
 }

 read24() {
 const {offset, bytes} = this;
 this.updateOffset(3);
 return bytes[offset] << 16 | bytes[offset + 1] << 8 | bytes[offset + 2];
 }

 read32() {
 const {offset, bytes} = this;
 this.updateOffset(4);
 return bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3];
 }

 read(size) {
 const {offset, bytes} = this;
 this.updateOffset(size);
 return bytes.subarray(offset, offset + size);
 }

 getRemaining() {
 return this.bytes.subarray(this.offset, this.length);
 }

 destroy() {
 this.bytes = new Uint8Array(0);
 this.offset = 0;
 }
 }*/
