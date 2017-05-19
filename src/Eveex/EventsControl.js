/**
 * Created by vladi on 27-Jan-17.
 */
let listenerRegistry = {};
let dispatchRegistry = {};
let uid = 0;

export class BasicEvent {
}
export class EventException {
    constructor(message) {
        this.message = message;
        this.name = "EventException";
    }
}
export const
    __testGetCurrentUid = () => typeof __JEST_TEST__ != 'undefined' && uid,
    __testGetCurrentListenerRegistry = () => typeof __JEST_TEST__ != 'undefined' && listenerRegistry,
    __testGetCurrentDispatchRegistry = () => typeof __JEST_TEST__ != 'undefined' && dispatchRegistry,
    getUid = () => ++uid,
    listenerExists = (listenerUid) => !!listenerRegistry[listenerUid],
    dispatchRegistryExists = (eventUid) => !!dispatchRegistry[eventUid],
    isListenerSuspended = (listenerUid) => !listenerRegistry[listenerUid] || !listenerRegistry[listenerUid]._active,
    setActiveState = (listenerUid, newState) => (listenerRegistry[listenerUid]._active = newState),
    removeListener = listenerUid => delete listenerRegistry[listenerUid],
    getListenerType = listenerUid => listenerExists(listenerUid) && listenerRegistry[listenerUid]._eventUid,
    filterRemovedListeners = listenerList => listenerList.filter(listenerUid => listenerExists(listenerUid)),
    isEventStateUpdated = (eventState, data) => {
        const dataKeys = Object.keys(data);
        return dataKeys && dataKeys.some(
                key => (!eventState[key] || eventState[key] !== data[key])
            );
    },
    updateDispatcherRegistryByType = (eventUid) => {
        if (!dispatchRegistryExists(eventUid)) return;
        dispatchRegistry[eventUid] = dispatchRegistry[eventUid].filter(
            listenerUid => listenerExists(listenerUid)
        );
        if (!dispatchRegistry[eventUid].length) {
            delete dispatchRegistry[eventUid];
        }
    },
    addEventListener = (eventInfo) => {
        if (!eventInfo || !eventInfo._eventUid || !eventInfo._handler) {
            return null;
        }
        const eventUid = eventInfo._eventUid,
            listenerUid = getUid();
        listenerRegistry[listenerUid] = eventInfo;
        dispatchRegistry[eventUid] = dispatchRegistry[eventUid] || [];
        dispatchRegistry[eventUid].push(listenerUid);
        return listenerUid;
    },
    canFireEventHandler = (listenerInfo, stateUpdated) => {
        return listenerInfo._active && (stateUpdated || !listenerInfo._onStateUpdate);
    },
    dispatchEvent = (event, stateUpdated = false) => {
        if (!BasicEvent.isPrototypeOf(event.constructor) || !dispatchRegistryExists(event.uid)) {
            return;
        }

        dispatchRegistry[event.uid].forEach(listenerUid => {
            const listenerInfo = listenerRegistry[listenerUid];
            listenerInfo && canFireEventHandler(listenerInfo, stateUpdated) && listenerInfo._handler(event);
        });
    },
    removeEventListenersByType = (eventUid, listenersList) => {
        if (dispatchRegistryExists(eventUid) && listenersList && listenersList.length) {
            listenersList.forEach(listenerUid => getListenerType(listenerUid) == eventUid && removeListener(listenerUid));
            updateDispatcherRegistryByType(eventUid);
        }
    },
    removeEventListenerById = (listenerUid) => {
        if (!listenerExists(listenerUid)) {
            return false;
        }
        const eventUid = getListenerType(listenerUid);
        removeListener(listenerUid);
        updateDispatcherRegistryByType(eventUid);
        return true;
    },
    suspendEventListenerById = (listenerUid) => {
        listenerExists(listenerUid) && setActiveState(listenerUid, false);
    },
    restoreEventListenerById = (listenerUid) => {
        listenerExists(listenerUid) && setActiveState(listenerUid, true);
    },
    systemSuspendEventListenerById = (listenerUid) => {
        listenerExists(listenerUid) && listenerRegistry[listenerUid]._active === true && setActiveState(listenerUid, null);
        return true;
    },
    systemRestoreEventListenerById = (listenerUid) => {
        listenerExists(listenerUid) && listenerRegistry[listenerUid]._active === null && setActiveState(listenerUid, true);
        return true;
    };

