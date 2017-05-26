/**
 * Created by vladi on 26-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {ManagerReadyEvent, ChunkDownloadedEvent} from "./DownloadManagerEvents";
import Stream from "../stream/Stream";
import {assert, kb} from "../common";


export default class DownloadManager extends EventEmitter {
    streamThreads = [];
    configurations = {
        src: null, //TODO: default demo url
        threads: 2,
        useWorkers: false,
        readOffset: 0,
        headerSize: 48, //pvf header size
        readSize: 128 * kb
    };


    constructor(configurations, streamConfigurations) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations,
            streamConfigurations
        };
    }

    init() {
        const {threads, useWorkers, streamConfigurations} = this.configurations;
        assert(threads, "[DownloadManager] Illegal stream thread count!");
        if (useWorkers) {
            //TODO
        } else {
            this.streamThreads = (new Array(threads)).fill().map(() => new Stream(streamConfigurations));
            this.dispatchEvent(new ManagerReadyEvent());
        }
    }

}