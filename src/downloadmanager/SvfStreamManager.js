/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ChunkDownloadedEvent} from "./DownloadManagerEvents";
import {StreamError, StreamSuccess, StreamAbort} from "../stream/StreamEvents";
import {assert, kb} from "../common";

const SVF_URL = "ws://localhost:3101/"; //TODO:Itai - This should be passed to the constructor instead...
//TODO:Itai I use new x(); x.addEventListener(y);  x.init()  to avoid this nonsence
export default class SvfStreamManager extends EventEmitter {
    configurations = {
        pvfUid: null,
        type: null,
        version: null,
        src: null,
        useWorkers: false,
        readOffset: 0,
        readSize: 5 * kb,
    };

    constructor(configurations = {}) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
    }

    init() {
        this.readStream = new WebSocket(SVF_URL);
        this.readStream.onmessage = this._onMessage;
        this.readStream.onerror = this._onChunkError;
    }

    _onMessage = (event) => {
        //TODO:Itai Why file reader!? see this link https://stackoverflow.com/questions/24998779/pass-binary-data-with-websocket
        const fileReader = new FileReader();
        fileReader.addEventListener("load", () => this.dispatchEvent(new ChunkDownloadedEvent(fileReader.result)));
        fileReader.readAsArrayBuffer(event.data);
    };

    _onChunkError = (event) => {
        console.error("SVF-_onChunkError", event);
    };

    readChunk() {
        const {readStream, configurations} = this,
            {file, readSize} = configurations;

        const data = JSON.stringify({
            file: file, //TODO:Itai shouldnt the server already remeber the position and file, if not then please make it so
            portion: readSize,
        });

        //TODO:Itai -  should not be here, if its open then its initiated and only then should be available for chunk reading...
        if (readStream.readyState === WebSocket.OPEN) {
            readStream.send(data);
        } else {
            readStream.addEventListener("open", () => readStream.send(data));
        }
    }
}