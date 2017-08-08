/**
 * Created by vladi on 08-Aug-17.
 */
import EventEmitter from '../events/EventEmitter';
import BitStream from "../bitstream/BitStream";

const SCE_ELEMENT = 0,
    CPE_ELEMENT = 1,
    CCE_ELEMENT = 2,
    LFE_ELEMENT = 3,
    DSE_ELEMENT = 4,
    PCE_ELEMENT = 5,
    FIL_ELEMENT = 6,
    END_ELEMENT = 7;

export default class AudioDecoder extends EventEmitter {
    _configuratins = {
        floatingPoint: true,
        CHANNEL_CONFIG_NONE: 0,
        CHANNEL_CONFIG_MONO: 1,
        CHANNEL_CONFIG_STEREO: 2,
        CHANNEL_CONFIG_STEREO_PLUS_CENTER: 3,
        CHANNEL_CONFIG_STEREO_PLUS_CENTER_PLUS_REAR_MONO: 4,
        CHANNEL_CONFIG_FIVE: 5,
        CHANNEL_CONFIG_FIVE_PLUS_ONE: 6,
        CHANNEL_CONFIG_SEVEN_PLUS_ONE: 8,

        profiles: {
            AOT_AAC_MAIN: 1, // no
            AOT_AAC_LC: 2,   // yes
            AOT_AAC_LTP: 4,  // no
            AOT_ESCAPE: 31
        }
    };

    _header = {};
    _samples = [];
    _configurations = {
        sampleRate: 0,
        bitsPerChannel: 16,
        channelsPerFrame: 2,
        floatingPoint: true
    };

    decode(sample) {
        const sampleStream = new BitStream(sample.sampleData);
        if (sampleStream.peek(12) === 0xfff) {
            this._readHeader(sampleStream);
        }

        debugger;

    }



    configure(audioConfigurations) {
        this._configurations = {
            adcd: audioConfigurations.adcd,
            sampleRate: audioConfigurations.sampleRate,
            channelsPerFrame: audioConfigurations.channels,
            bitsPerChannel: audioConfigurations.sampleSize,
            compressionId: audioConfigurations.compressionId,
            timeScale: audioConfigurations.timeScale,
            duration: audioConfigurations.duration,
            packetSize: audioConfigurations.packetSize
        }
    }

    _readHeader(bitStream) { // ADTS header specs --> https://wiki.multimedia.cx/index.php/ADTS
        if (bitStream.read(12) !== 0xfff) {
            throw new Error('Invalid ADTS header.');
        }
        const version = bitStream.read(1),              //MPEG Version: 0 for MPEG-4, 1 for MPEG-2
            layer = bitStream.read(2),                  //Layer: always 0
            isProtected = !bitStream.read(1);           //protection absent, Warning, set to 1 if there is no CRC and 0 if there is CRC
        this._header = {
            version,
            layer,
            isProtected,
            profile: bitStream.read(2) + 1,             //profile, the MPEG-4 Audio Object Type minus 1
            frequency: bitStream.read(4),               //MPEG-4 Sampling Frequency Index (15 is forbidden)
            private: bitStream.read(1),                 //private bit, guaranteed never to be used by MPEG, set to 0 when encoding, ignore when decoding
            chanConfig: bitStream.read(3),              //MPEG-4 Channel Configuration (in the case of 0, the channel configuration is sent via an inband PCE)
            originality: bitStream.read(1),             //originality, set to 0 when encoding, ignore when decoding
            home: bitStream.read(1),                    //home, set to 0 when encoding, ignore when decoding
            copyrightBit: bitStream.read(1),            //copyrighted id bit, the next bit of a centrally registered copyright identifier, set to 0 when encoding, ignore when decoding
            copyrightStartBit: bitStream.read(1),       //copyright id start, signals that this frame's copyright id bit is the first bit of the copyright id, set to 0 when encoding, ignore when decoding
            frameLength: bitStream.read(13),            //frame length, this value must include 7 or 9 bytes of header length: FrameLength = (ProtectionAbsent == 1 ? 7 : 9) + size(AACFrame)
            fullness: bitStream.read(11),               //Buffer fullness
            numFrames: bitStream.read(2) + 1,           //Number of AAC frames (RDBs) in ADTS frame minus 1, for maximum compatibility always use 1 AAC frame per ADTS frame
            CRC: isProtected ? bitStream.read(16) : 0   //CRC if protection absent is 0
        }
    }


    get configurations() {
        return {...this._configurations};
    }

    get samples() {
        return [].concat(this._samples);
    }
}

