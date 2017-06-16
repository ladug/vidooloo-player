/**
 * Created by vladi on 27-May-17.
 */
import Event from "../events/Event";

export class HeadersReadyEvent extends Event {
    _pvfHeader = null;
    _svfHeader = null;

    constructor(pvfHeader, svfHeader) {
        super();
        this._pvfHeader = pvfHeader || null;
        this._svfHeader = svfHeader || null;
    }

    get pvfHeader() {
        return this._pvfHeader;
    }

    get svfHeader() {
        return this._pvfHeader;
    }
}

export class ExtractedSamplesEvent extends Event {
}
