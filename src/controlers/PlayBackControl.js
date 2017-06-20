/**
 * Created by vladi on 16-Jun-17.
 */
import EventEmitter from '../events/EventEmitter';
import {} from "./DigestControlEvents";
import {PictureDecodedEvent} from "../Decoder/DecoderEvents";
import {} from "../canvasplayer/CanvasEvents";
import {sec, assert} from '../common';
let sampleCount = 0;
let timer = 0;
export default class PlayBackControl extends EventEmitter {
    digester = null;
    canvasPlayer = null;
    controls = null;
    decoder = null;
    currentTime = 0;
    minBuffer = 2;
    pictureBuffer = [];
    _fpsFactor =0;
    constructor(canvasPlayer, digester, decoder, controls) {
        super();
        assert(canvasPlayer, "Error #2213");
        assert(digester, "Eror #2214");
        assert(decoder, "Error #2215");
        assert(controls, "Error #2216");

        this.canvasPlayer = canvasPlayer;
        this.digester = digester;
        this.decoder = decoder;
        this.controls = controls;
        this._connectEvents();
        this._setBasicInfo();
    }

    _updatePlaybackTime(frameSeconds) {
        this.currentTime += frameSeconds;
        this.controls.setVideoTime(this.currentTime);
    }

    _setBasicInfo() {
        const basicInfo = this.digester.getBasicInfo();
        this.controls.setVideoLength(basicInfo.videoDuration);
    }

    _connectEvents = () => {
        this.decoder.addEventListener(PictureDecodedEvent, this._onPictureReady)
    };

    _onPictureReady = (event) => {
        console.error("_onPictureReady", event);
        const {pictureBuffer, _displayFrame} = this;
        pictureBuffer.push({
            data: event.data,
            width: event.width,
            height: event.height
        });

        const compensation = this._fpsFactor ? 41 - ((new Date()).getTime() - this._fpsFactor) : 0;
        window.setTimeout(() => {
            _displayFrame();
        }, compensation > 0 ? compensation : 0);
        this._fpsFactor = (new Date()).getTime();
    };

    _displayFrame = () => {
        const {minBuffer, _decodeSample, pictureBuffer, canvasPlayer} = this;
        if (pictureBuffer.length < minBuffer) {
            window.setTimeout(_decodeSample, 0)
        }
        canvasPlayer.renderPicture(pictureBuffer.shift());
    };

    _decodeSample = () => {

        const {digester, decoder} = this;
        const sample = digester.shiftVideoSample();
        if (sample) {
            console.error("sample[", sampleCount, "] sent to decode");
            this._updatePlaybackTime(sample.duration);
            decoder.decode(sample);
            sampleCount++;
        } else {
            alert("no more samples! Average FPS : " + (sampleCount / (((new Date()).getTime() - timer) / 1000)));
        }
    };

    _initDecoder = ({svf}) => {
        const {decoder} = this;
        decoder.configure(svf.sps, svf.pps);
    };

    init() {
        const {digester, _initDecoder, _decodeSample} = this;
        digester.digestSamples();
        _initDecoder(digester.headers);
        _decodeSample();
        timer = (new Date()).getTime();

    }


}