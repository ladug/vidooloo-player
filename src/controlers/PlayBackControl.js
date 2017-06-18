/**
 * Created by vladi on 16-Jun-17.
 */
import EventEmitter from '../events/EventEmitter';
import {} from "./DigestControlEvents";
import {PictureDecodedEvent} from "../Decoder/DecoderEvents";
import {} from "../canvasplayer/CanvasEvents";
import {sec, assert} from '../common';


export default class PlayBackControl extends EventEmitter {
    digester = null;
    canvasPlayer = null;
    controls = null;
    decoder = null;
    currentTime = 0;
    minBuffer = 2;
    pictureBuffer = [];

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

    _setBasicInfo() {
        const basicInfo = this.digester.getBasicInfo();
        this.controls.setVideoLength(basicInfo.videoDuration);
    }

    _connectEvents = () => {
        this.decoder.addEventListener(PictureDecodedEvent, this._onPictureReady)
    };

    _onPictureReady = (event) => {
        console.error("_onPictureReady", event);
        const {pictureBuffer, minBuffer, _decodeSample, canvasPlayer} = this;
        pictureBuffer.push({
            data: event.data,
            width: event.width,
            height: event.height
        });
        if (pictureBuffer.length < minBuffer) {
            window.setTimeout(_decodeSample, 0)
        }
        //canvasPlayer.renderPicture(pictureBuffer.shift());
    };

    _decodeSample = () => {
        const {digester, decoder} = this;
        const sample = digester.shiftVideoSample();
        console.log(sample);
        if (sample) {
            decoder.decode(sample);
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
    }


}