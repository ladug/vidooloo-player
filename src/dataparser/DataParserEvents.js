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
    _videoSamplesDuration = 0;
    _audioSamplesDuration = 0;

    constructor(payload = {}) {
        super();
        this._videoSamplesDuration = payload.videoSamplesDuration || 0;
        this._audioSamplesDuration = payload.audioSamplesDuration || 0;
    }

    get videoSamplesDuration() {
        return this._videoSamplesDuration;
    }

    get audioSamplesDuration() {
        return this._audioSamplesDuration;
    }
}
