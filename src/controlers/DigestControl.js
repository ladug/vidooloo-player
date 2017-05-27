/**
 * Created by vladi on 27-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {HeadersEvent} from "./DigestControlEvents";
import {assert} from "../common";


export default class DigestControl extends EventEmitter {
    pvfDownloadManager = null;
    svfDownloadManager = null;
    configurations = {};

    constructor(pvfDownloadManager, svfDownloadManager, configurations) {
        super();
        this.pvfDownloadManager = pvfDownloadManager;
        this.svfDownloadManager = svfDownloadManager;
        this.configurations = {
            ...this.configurations,
            ...configurations
        }
    }

    start() {

    }
}