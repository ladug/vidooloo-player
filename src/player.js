/**
 * Created by vladi on 21-Feb-17.
 */
import CanvasPlayer from "./canvasplayer/CanvasPlayer";
import DownloadManager from "./DownloadManager/DownloadManager";
import PlayerControls from "./playercontrols/PlayerControls";
import SvfStreamManager from "./DownloadManager/SvfStreamManager";

import {PlayEvent, PauseEvent, StopEvent} from "./playercontrols/PlayerControlEvents";
import {ManagerReadyEvent} from "./DownloadManager/DownloadManagerEvents";
import {CanvasReady} from "./canvasplayer/CanvasEvents";
import {assert} from "./common";

const DEBUG_SVF_SRC = "http://kakamaika.com/~cdnkakamaika/digest/1494876554244.svf.digest";

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

    onDownloadManagerReady = (event) => {
        console.log(event);
        this.readyState.downloadManager = true;
        this.svfStream = new SvfStreamManager({
            type: event.payload.type,
            version: event.payload.version,
            pvfUid: event.payload.uid,
            src: DEBUG_SVF_SRC
        });
    };
}

/*place the player in the position of the script tag*/
const currentScript = document.currentScript;
window.vidoolooPlayer = new VidoolooPlayer(currentScript); //pass script tag to the player to use for configurations //TODO: create safe wrapper
currentScript.parentNode.removeChild(currentScript); //remove the tag, no reason to keep it around

