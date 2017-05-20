/**
 * Created by vladi on 20-May-17.
 */
import {
    getUid,
    isValidEvent,
    listenerExists,
    addEventListener,
    removeEventListener,
    clearEventListeners,
    dispatchEvent
} from "./common";
import EventListener from "./EventListener";
export default class EventEmitter {
    _uid = null;
    _isDispatching = [];
    _destroyAfterDispatch = false;

    constructor() {
        this._uid = getUid();
    }

    addEventListener(event, handler) {
        if (isValidEvent(event) && typeof handler === 'function') {
            return new EventListener(
                addEventListener({
                    _active: true,
                    _emitterUid: this.uid,
                    _eventUid: event.uid,
                    _handler: handler
                })
            );
        }
        return null;
    }

    dispatchEvent(event) {
        if (isValidEvent(event)) {
            if (this._isDispatching.indexOf(event.uid)) {
                throw new Error("Event dispatch cause the same event to dispatch ( event-seption! )")
            }
            this._isDispatching.push(event.uid);
            dispatchEvent(this.uid, event);
            this._isDispatching.splice(this._isDispatching.indexOf(event.uid));
            !this._isDispatching.length && this._destroyAfterDispatch && this.destroy();
        }
        return this;
    }

    removeEventListener(mixed) {
        const listenerUid = (EventListener.isPrototypeOf(mixed) && mixed.uid)
            || (typeof mixed === "string" && mixed)
            || null;
        if (listenerUid && listenerExists(listenerUid)) {
            removeEventListener(listenerUid);
        }
        return this;
    }

    destroy() {
        if (this._isDispatching.length) {
            this._destroyAfterDispatch = true;
        } else {
            clearEventListeners(this.uid);
        }
    }

    get uid() {
        return this._uid;
    }
}