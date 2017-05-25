/**
 * Created by vladi on 22-May-17.
 */
import EventEmitter from "../../events/EventEmitter";
import {StreamProgress, StreamError, StreamSuccess, StreamAbort} from "./StreamEvents";

export default class Stream extends EventEmitter {
    _http = null;
    _loading = false;
    _destroyed = false;
    _configurations = {};

    constructor(configurations) {
        super();
        this._http = new XMLHttpRequest();
        this._configurations = {
            ...this._configurations,
            ...configurations
        };
        this._connectXHttp();
    }

    _connectXHttp() {
        this._http = Object.assign(this._http, this._configurations);
        this._http.onload = this._onLoad;
        this._http.ontimeout = this._onError;
        this._http.onerror = this._onError;
        this._http.onProgress = this._onProgress;
    }

    _onLoad = () => {
        this._loading = false;
        this.dispatchEvent(new StreamSuccess({
            response: this._http.response,
            status: this._http.status,
            type: "success"
        }));
    };
    _onError = ({type}) => {
        this._loading = false;
        this.dispatchEvent(new StreamError({
            response: null,
            status: this._http.status,
            type: "success"
        }));
    };
    _onProgress = (event) => {
        this.dispatchEvent(new StreamProgress({
            response: null,
            status: this._http.status,
            type: "success"
        }));
    };

    set(configurations) {
        delete configurations.onload;
        delete configurations.ontimeout;
        delete configurations.onerror;
        delete configurations.onProgress;
        this._http = Object.assign(this._http, configurations);
    }

    abort() {
        if (this._loading && !this._destroyed) {
            this._http.abort();
            this._loading = false;
            this.dispatchEvent(new StreamAbort());
        }
    }

    get(url) {
        if (!this._loading && !this._destroyed) {
            this._loading = true;
            this._http.open("GET", url, true);
            this._http.send();
        }
    }

    post(url) {
        if (!this._loading && !this._destroyed) {
            this._loading = true;
            this._http.open("POST", url, true);
            this._http.send();
        }
    }

    get isLoading() {
        return this._loading;
    }

    get isDestroyed() {
        return this._destroyed;
    }

    destroy() { //cleanup
        this._http.response = null;
        this._http.onload = null;
        this._http.ontimeout = null;
        this._http.onerror = null;
        this._http.onProgress = null;
        this._http = null;
        this._configurations = {};
        this._destroyed = true;
        super.destroy.apply(this);
    }
}