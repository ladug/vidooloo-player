/**
 * Created by vladi on 08-Aug-17.
 */
import EventEmitter from '../events/EventEmitter';
import BitStream from "../bitstream/BitStream";
import FilterBank from "./helpers/FilterBank";
import FILStream from "./streams/FILStream";
import DSEStream from "./streams/DSEStream";
import ICStream from "./streams/ICStream";
import CPEStream from "./streams/CPEStream";
import CCEStream from "./streams/CCEStream";

const SCE_ELEMENT = 0,
    CPE_ELEMENT = 1,
    CCE_ELEMENT = 2,
    LFE_ELEMENT = 3,
    DSE_ELEMENT = 4,
    PCE_ELEMENT = 5,
    FIL_ELEMENT = 6,
    END_ELEMENT = 7;

const decodeElement = (eType, bitStream, config) => {
    const eId = bitStream.read(4);
    switch (eType) {
        case SCE_ELEMENT:
        case LFE_ELEMENT:
            let ics = new ICStream(config);
            ics.id = eId;
            ics.decode(bitStream, config, false);
            return {
                type: eType,
                stream: ics
            };
            break;
        case CPE_ELEMENT:
            let cpe = new CPEStream(config);
            cpe.id = eId;
            cpe.decode(bitStream, config);
            return {
                type: eType,
                stream: cpe
            };
            break;
        case CCE_ELEMENT:
            let cce = new CCEStream(config);
            cce.decode(bitStream, config);
            return {
                type: eType,
                stream: cce
            };
            break;
        case DSE_ELEMENT:
            return {
                type: eType,
                stream: new DSEStream(bitStream)
            };
            break;
        case FIL_ELEMENT:
            return {
                type: eType,
                stream: new FILStream(bitStream, eId)
            };
            break;
        case PCE_ELEMENT:
            throw new Error("PCE_ELEMENT Not Supported!");
            break;
    }
},
// Intensity stereo
processIS=(element, left, right) =>{
    var ics = element.right,
        info = ics.info,
        offsets = info.swbOffsets,
        windowGroups = info.groupCount,
        maxSFB = info.maxSFB,
        bandTypes = ics.bandTypes,
        sectEnd = ics.sectEnd,
        scaleFactors = ics.scaleFactors;

    var idx = 0, groupOff = 0;
    for (var g = 0; g < windowGroups; g++) {
        for (var i = 0; i < maxSFB;) {
            var end = sectEnd[idx];

            if (bandTypes[idx] === ICStream.INTENSITY_BT || bandTypes[idx] === ICStream.INTENSITY_BT2) {
                for (; i < end; i++, idx++) {
                    var c = bandTypes[idx] === ICStream.INTENSITY_BT ? 1 : -1;
                    if (element.maskPresent)
                        c *= element.ms_used[idx] ? -1 : 1;

                    var scale = c * scaleFactors[idx];
                    for (var w = 0; w < info.groupLength[g]; w++) {
                        var off = groupOff + w * 128 + offsets[i],
                            len = offsets[i + 1] - offsets[i];

                        for (var j = 0; j < len; j++) {
                            right[off + j] = left[off + j] * scale;
                        }
                    }
                }
            } else {
                idx += end - i;
                i = end;
            }
        }

        groupOff += info.groupLength[g] * 128;
    }
},

// Mid-side stereo
processMS=(element, left, right) =>{
    var ics = element.left,
        info = ics.info,
        offsets = info.swbOffsets,
        windowGroups = info.groupCount,
        maxSFB = info.maxSFB,
        sfbCBl = ics.bandTypes,
        sfbCBr = element.right.bandTypes;

    var groupOff = 0, idx = 0;
    for (var g = 0; g < windowGroups; g++) {
        for (var i = 0; i < maxSFB; i++, idx++) {
            if (element.ms_used[idx] && sfbCBl[idx] < ICStream.NOISE_BT && sfbCBr[idx] < ICStream.NOISE_BT) {
                for (var w = 0; w < info.groupLength[g]; w++) {
                    var off = groupOff + w * 128 + offsets[i];
                    for (var j = 0; j < offsets[i + 1] - offsets[i]; j++) {
                        var t = left[off + j] - right[off + j];
                        left[off + j] += right[off + j];
                        right[off + j] = t;
                    }
                }
            }
        }
        groupOff += info.groupLength[g] * 128;
    }
};

export default class AudioDecoder extends EventEmitter {
    _configuration = {
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
        channels: 2,
        floatingPoint: true
    };

    decode(sample) {
        const sampleStream = new BitStream(sample.sampleData);
        if (sampleStream.peek(12) === 0xfff) {
            this._readHeader(sampleStream);
        }
        const {channels, sampleRate} = this.configurations,
            elements = [],
            config = {
                chanConfig: channels,
                frameLength: 1024,
                profile: 2,
                sampleIndex: 3, //do i need this?
                sampleRate: sampleRate
            };
        while (sampleStream.hasData) {
            const eType = sampleStream.read(3);
            if (eType === END_ELEMENT) {
                console.log("END_ELEMENT reached");
                break;
            }
            elements.push(decodeElement(eType, sampleStream, config));
        }
        sampleStream.align();
    }

    _process(elements) {
        const {channels, frameLength} = this._configurations,
            data = new Array(channels).fill().map(() => new Float32Array(frameLength));

        /* {
         type: eType,
         stream: new DSEStream(bitStream)
         };*/

        debugger
        let channel = 0;
        for (let i = 0; i < elements.length && channel < channels; i++) {
            let e = elements[i];
            if (e instanceof ICStream) { // SCE or LFE element
                channel += this.processSingle(e, channel);
            } else if (e instanceof CPEStream) {
                this.processPair(e, channel);
                channel += 2;
            } else if (e instanceof CCEStream) {
                channel++;
            } else {
                throw new Error("Unknown element found.")
            }
        }


        let output = new Float32Array(frameLength * channels),
            j = 0;

        for (let k = 0; k < frameLength; k++) {
            for (let i = 0; i < channels; i++) {
                output[j++] = data[i][k] / 32768;
            }
        }

        return output;
    }

    processSingle(element, channel) {
        var profile = this.config.profile,
            info = element.info,
            data = element.data;

        if (profile === AOT_AAC_MAIN)
            throw new Error("Main prediction unimplemented");

        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");

        this.applyChannelCoupling(element, CCEElement.BEFORE_TNS, data, null);

        if (element.tnsPresent)
            element.tns.process(element, data, false);

        this.applyChannelCoupling(element, CCEElement.AFTER_TNS, data, null);

        // filterbank
        this.filter_bank.process(info, data, this.data[channel], channel);

        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");

        this.applyChannelCoupling(element, CCEElement.AFTER_IMDCT, this.data[channel], null);

        if (element.gainPresent)
            throw new Error("Gain control not implemented");

        if (this.sbrPresent)
            throw new Error("SBR not implemented");

        return 1;
    };

    processPair(element, channel) {
        var profile = this.config.profile,
            left = element.left,
            right = element.right,
            l_info = left.info,
            r_info = right.info,
            l_data = left.data,
            r_data = right.data;

        // Mid-side stereo
        if (element.commonWindow && element.maskPresent)
            this.processMS(element, l_data, r_data);

        if (profile === AOT_AAC_MAIN)
            throw new Error("Main prediction unimplemented");

        // Intensity stereo
        this.processIS(element, l_data, r_data);

        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");

        this.applyChannelCoupling(element, CCEElement.BEFORE_TNS, l_data, r_data);

        if (left.tnsPresent)
            left.tns.process(left, l_data, false);

        if (right.tnsPresent)
            right.tns.process(right, r_data, false);

        this.applyChannelCoupling(element, CCEElement.AFTER_TNS, l_data, r_data);

        // filterbank
        this.filter_bank.process(l_info, l_data, this.data[channel], channel);
        this.filter_bank.process(r_info, r_data, this.data[channel + 1], channel + 1);

        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");

        this.applyChannelCoupling(element, CCEElement.AFTER_IMDCT, this.data[channel], this.data[channel + 1]);

        if (left.gainPresent)
            throw new Error("Gain control not implemented");

        if (right.gainPresent)
            throw new Error("Gain control not implemented");

        if (this.sbrPresent)
            throw new Error("SBR not implemented");
    };



    applyChannelCoupling(element, couplingPoint, data1, data2) {
        var cces = this.cces,
            isChannelPair = element instanceof CPEElement,
            applyCoupling = couplingPoint === CCEElement.AFTER_IMDCT ? 'applyIndependentCoupling' : 'applyDependentCoupling';

        for (var i = 0; i < cces.length; i++) {
            var cce = cces[i],
                index = 0;

            if (cce.couplingPoint === couplingPoint) {
                for (var c = 0; c < cce.coupledCount; c++) {
                    var chSelect = cce.chSelect[c];
                    if (cce.channelPair[c] === isChannelPair && cce.idSelect[c] === element.id) {
                        if (chSelect !== 1) {
                            cce[applyCoupling](index, data1);
                            if (chSelect) index++;
                        }

                        if (chSelect !== 2)
                            cce[applyCoupling](index++, data2);

                    } else {
                        index += 1 + (chSelect === 3 ? 1 : 0);
                    }
                }
            }
        }
    };

    configure(audioConfigurations) {
        this._configurations = {
            adcd: audioConfigurations.adcd,
            sampleRate: audioConfigurations.sampleRate,
            channels: audioConfigurations.channels,
            bitsPerChannel: audioConfigurations.sampleSize,
            compressionId: audioConfigurations.compressionId,
            timeScale: audioConfigurations.timeScale,
            duration: audioConfigurations.duration,
            packetSize: audioConfigurations.packetSize
        };
        this.filter_bank = new FilterBank(null, audioConfigurations.channels)
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

