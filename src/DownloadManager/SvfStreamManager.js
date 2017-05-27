/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import Event from "../events/Event";
import Stream from "../stream/Stream";
import {StreamError, StreamSuccess} from "../stream/StreamEvents";
import {assert,kb} from "../common";

export default class SvfStreamManager extends EventEmitter {
    readStream = new Stream();
    configurations = {
        pvfUid : null,
        type: null,
        version:null,
        src : null,
        useWorkers: false,
        readOffset: 0,
        readSize: 32 * kb,
    };

    constructor(configurations) {
        super();
        console.log(configurations)
        this.configurations={
            ...this.configurations,
            ...configurations
        }
    }
    getChunk(){

    }
}