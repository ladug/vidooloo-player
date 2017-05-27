/**
 * Created by vladi on 26-May-17.
 */

export const assert = (condition, message) => {
        if (!condition) {
            throw new Error(message);
        }
    },
    readByteString = (bytes, offset = 0, length = 4) => {
        return (new Array(length)).fill(offset).map((offset, index) => String.fromCharCode(bytes[offset + index])).join('');
    },
    mergeBuffers = (buffers) => {
        const bufferSize = buffers.reduce((total, buffer) => (total + buffer.length), 0),
            resBuffer = new Uint8Array(bufferSize);
        let offset = 0;
        buffers.forEach((chunk) => {
            resBuffer.set(chunk, offset);
            offset += chunk.length;
        });
        return resBuffer;
    },
    sec = 1000,
    min = 60000,
    hour = 3600000,
    kb = 1024,
    mb = 1048576;
