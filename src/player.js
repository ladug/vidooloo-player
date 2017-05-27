/**
 * Created by vladi on 21-Feb-17.
 */
import CanvasPlayer from "./canvasplayer/CanvasPlayer";
import DownloadManager from "./downloadmanager/DownloadManager";
import PlayerControls from "./playercontrols/PlayerControls";
import SvfStreamManager from "./downloadmanager/SvfStreamManager";
import DigestControl from "./controlers/DigestControl";
import {HeadersEvent} from "./controlers/DigestControlEvents";
import {} from "./controlers/DigestControlEvents";

import {PlayEvent, PauseEvent, StopEvent} from "./playercontrols/PlayerControlEvents";
import {ManagerReadyEvent} from "./downloadmanager/DownloadManagerEvents";
import {CanvasReady} from "./canvasplayer/CanvasEvents";
import {assert, sec} from "./common";

//const DEBUG_SVF_SRC = "http://kakamaika.com/~cdnkakamaika/digest/1494876554244.svf.digest";
const DEBUG_SVF_SRC = "http://kakamaika.com/~cdnkakamaika/digest/trolls-2016-720p.x264.baseline.mp4.svf.digest";

const getConfigurations = hostingTag => ({
    width: hostingTag.getAttribute('width') * 1 || 300,
    height: hostingTag.getAttribute('height') * 1 || 200,
    src: hostingTag.getAttribute('video') || "Default Url" //TODO: setup demo file
});

export default class VidoolooPlayer {
    configurations = {};
    container = document.createElement("div");
    canvasPlayer = null;
    svfStream = null;
    digester = null;
    readyState = {
        canvasPlayer: false,
        downloadManager: false
    };

    constructor(sourceTag) {
        assert(sourceTag, "No target DOMElement!");
        /* create container tag and place it above the target tag */
        sourceTag.parentNode.insertBefore(this.container, sourceTag);
        /* Read configurations from source DOMElement */
        this.configurations = getConfigurations(sourceTag);
        this.init()
    }

    init() {
        this.createPlayerComponent();
        this.createDownloadManager();
    }

    createPlayerComponent() {
        const {container, configurations: {width, height}} = this;
        container.style.cssText = ["width:", width, "px;height:", height, "px"].join('');
        this.canvasPlayer = new CanvasPlayer(container, width, height);
        this.canvasPlayer.addEventListener(CanvasReady, this.onCanvasReady);
        this.canvasPlayer.init();
    }

    createDownloadManager() {
        const {src} = this.configurations;
        this.downloadManager = new DownloadManager({
            src
        });
        this.downloadManager.addEventListener(ManagerReadyEvent, this.onDownloadManagerReady);
        this.downloadManager.init();
    }

    onCanvasReady = () => {
        this.controls = new PlayerControls();
        this.controls.attachTo(this.container);
        this.readyState.canvasPlayer = true;
    };

    _onDigestHeaders = (event) => {
        console.log("_onDigestHeaders", event)
    };
    onDownloadManagerReady = (event) => {
        console.log(event);
        this.readyState.downloadManager = true;
        this.svfStream = new SvfStreamManager({
            type: event.payload.type,
            version: event.payload.version,
            pvfUid: event.payload.uid,
            src: DEBUG_SVF_SRC
        });
        this.digester = new DigestControl(
            this.downloadManager,
            this.svfStream,
            {
                preloadTime: 5 * sec
            }
        );
        this.digester.addEventListener(HeadersEvent, this._onDigestHeaders);
        this.digester.start();
    };
}

/*place the player in the position of the script tag*/
const currentScript = document.currentScript;
window.vidoolooPlayer = new VidoolooPlayer(currentScript); //pass script tag to the player to use for configurations //TODO: create safe wrapper
currentScript.parentNode.removeChild(currentScript); //remove the tag, no reason to keep it around

