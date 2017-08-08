/**
 * Created by vladi on 08-Aug-17.
 */
import EventEmitter from '../events/EventEmitter';
import ByteStream from "../ByteStream/ByteStream";

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

        SCE_ELEMENT: 0,
        CPE_ELEMENT: 1,
        CCE_ELEMENT: 2,
        LFE_ELEMENT: 3,
        DSE_ELEMENT: 4,
        PCE_ELEMENT: 5,
        FIL_ELEMENT: 6,
        END_ELEMENT: 7,

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

        const sampleStream = new ByteStream(sample.sampleData);
        debugger;
        /*let elementType;
         while ((elementType = stream.read(3)) !== END_ELEMENT) {
         var id = stream.read(4);

         switch (elementType) {
         // single channel and low frequency elements
         case SCE_ELEMENT:
         case LFE_ELEMENT:
         var ics = new ICStream(this.config);
         ics.id = id;
         elements.push(ics);
         ics.decode(stream, config, false);
         break;

         // channel pair element
         case CPE_ELEMENT:
         var cpe = new CPEElement(this.config);
         cpe.id = id;
         elements.push(cpe);
         cpe.decode(stream, config);
         break;

         // channel coupling element
         case CCE_ELEMENT:
         var cce = new CCEElement(this.config);
         this.cces.push(cce);
         cce.decode(stream, config);
         break;

         // data-stream element
         case DSE_ELEMENT:
         var align = stream.read(1),
         count = stream.read(8);

         if (count === 255)
         count += stream.read(8);

         if (align)
         stream.align();

         // skip for now...
         stream.advance(count * 8);
         break;

         // program configuration element
         case PCE_ELEMENT:
         throw new Error("TODO: PCE_ELEMENT")
         break;

         // filler element
         case FIL_ELEMENT:
         if (id === 15)
         id += stream.read(8) - 1;

         // skip for now...
         stream.advance(id * 8);
         break;

         default:
         throw new Error('Unknown element')
         }
         }*/
    }

    configure(audioConfigurations) {
        /*
         adcd:Uint8Array(42) [3, 128, 128, 128, 37, 0, 2, 0, 4, 128, 128, 128, 23, 64, 21, 0, 0, 0, 0, 1, 252, 13, 0, 1, 252, 13, 5, 128, 128, 128, 5, 17, 144, 86, 229, 0, 6, 128, 128, 128, 1, 2]
         channels:2
         compressionId:0
         duration:6591488
         packetSize:0
         sampleRate:48000
         sampleSize:16
         timeScale:48000
         */
        this._configurations = {
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

