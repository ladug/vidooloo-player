/**
 * Created by vladi on 20-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import {WorkerError, WorkerLoaded, WorkerReady} from "./WorkerLoaderEvents";


export default class WorkerLoader extends EventEmitter {
    constructor(workerUrl) {
        super();
        this.addEventListener(WorkerLoaded, this.onWorkerLoaded);
        this.downloadBuffer(workerUrl);
    }

    onWorkerLoaded = (event) => {
        try {
            const worker = new Worker(URL.createObjectURL(event.response));
            this.dispatchEvent(new WorkerReady({
                worker: worker
            }))
        } catch (e) {
            this.dispatchEvent(
                new WorkerError({
                    response: null,
                    status: http.status,
                    type: type
                })
            )
        }
        this.destroy(); //Component work is done, unlink all events
    };

    downloadBuffer(workerUrl) {
        const http = new XMLHttpRequest();
        http.open("GET", workerUrl, true);
        http.withCredentials = true;
        http.responseType = "blob";
        http.timeout = 10000;
        http.onload = ({type}) => {
            this.dispatchEvent(
                new WorkerLoaded({
                    response: http.response,
                    status: http.status,
                    type: type
                }));

            http.response = http.onload = http.ontimeout = http.onerror = undefined; //unlink the http
        };
        http.onload = http.ontimeout = http.onerror = ({type}) => {
            this.dispatchEvent(
                new WorkerError({
                    response: null,
                    status: http.status,
                    type: type
                })
            );
            http.onload = http.ontimeout = http.onerror = undefined;//unlink the http
            this.destroy(); //Component work is done, unlink all events
        };
        http.send();
    }
}