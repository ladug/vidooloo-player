/**
 * Created by vladi on 27-May-17.
 */
import Event from "../events/Event";
import {assert} from "../common";

export class HeadersEvent extends Event {
    _headers = null;

    constructor(headers) {
        super();
        this._headers = {...headers};
    }

    get headers() {
        return this._headers;
    }
}