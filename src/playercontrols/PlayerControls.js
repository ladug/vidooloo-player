/**
 * Created by vladi on 26-May-17.
 */
import EventEmitter from "../events/EventEmitter";
import PlayerStatusBar from "./PlayerStatusBar";
import {PlayEvent, PauseEvent, StopEvent} from "./PlayerControlEvents";


export default class PlayerControls extends EventEmitter {
    configurations = {};
    container = document.createElement("div");
    statusBar = new PlayerStatusBar();

    constructor(configurations={}) {
        super();
        this.configurations = {
            ...this.configurations,
            ...configurations
        };
        this._createControls();
    }

    _onPlayClick = () => {
        console.log("[PlayerControls]->_onPlayClick");
        this.dispatchEvent(new PlayEvent())
    };
    _onPauseClick = () => {
        console.log("[PlayerControls]->_onPauseClick");
        this.dispatchEvent(new PauseEvent())
    };
    _onStopClick = () => {
        console.log("[PlayerControls]->_onStopClick");
        this.dispatchEvent(new StopEvent())
    };
    _createControls = () => {
        const {container, statusBar, _onPlayClick, _onPauseClick, _onStopClick} = this;

        statusBar.attachTo(container);

        let playButton = document.createElement("input");
        playButton.value = "Play";
        playButton.type = "button";
        playButton.addEventListener("click", _onPlayClick);
        container.appendChild(playButton);

        let pauseButton = document.createElement("input");
        pauseButton.value = "Pause";
        pauseButton.type = "button";
        pauseButton.addEventListener("click", _onPauseClick);
        container.appendChild(pauseButton);

        let stopButton = document.createElement("input");
        stopButton.value = "Play";
        stopButton.type = "button";
        stopButton.addEventListener("click", _onStopClick);
        container.appendChild(stopButton);

    };

    setPlayProgress(pre) {
        this.statusBar.setPlayProgress(pre)
    }

    setPvfProgress(pre) {
        this.statusBar.setMainPreloaded(pre)
    }

    setSvfProgress(pre) {
        this.statusBar.setSecondaryPreloaded(pre)
    }

    attachTo(container) {
        container.appendChild(this.container);
    }
}