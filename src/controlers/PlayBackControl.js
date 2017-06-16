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
    decoder = null;
    currentTime = 0;

    constructor(canvasPlayer, digester, decoder) {
        super();
        assert(canvasPlayer, "Error #2213");
        assert(digester, "Eror #2214");
        assert(decoder, "Error #2215");
        this.canvasPlayer = canvasPlayer;
        this.digester = digester;
        this.decoder = decoder;
        this._connectEvents();
    }

    _connectEvents() {
        this.decoder.addEventListener(PictureDecodedEvent, this._onPictureReady)
    }

    _onPictureReady(event) {
        console.log("_onPictureReady", event, this.decoder);
    }

    _decodeSample = () => {
        const {digester, decoder} = this;
        const sample = digester.shiftVideoSample();
        console.warn(sample);
        if (sample) {

            decoder.decode(sample);
        }
    };

    _initDecoder = ({svf}) => {
        const {decoder} = this;
        decoder.decode(svf.sps);
        decoder.decode(svf.pps);
    };

    start() {
        const {digester, _initDecoder, _decodeSample} = this;
        digester.digestSamples();
        _initDecoder(digester.headers);
        _decodeSample();
    }


}