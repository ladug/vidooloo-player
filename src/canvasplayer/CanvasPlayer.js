/**
 * Created by vladi on 19-May-17.
 */
import {CanvasReady} from "./CanvasEvents"
import EventEmitter from "../events/EventEmitter";

const createCanvas = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = ["width:", width, "px;height:", height, "px;background-color:#000"].join('');
    return canvas;
};

export default class CanvasPlayer extends EventEmitter {
    canvas = null;
    context = null;
    container = null;
    options = {};

    constructor(container, width, height) {
        super();
        this.container = container;
        this.options = {
            width,
            height
        };
    }

    init() {
        const {container, options: {width, height}} = this,
            canvas = createCanvas(width, height);
        container.appendChild(canvas);
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.dispatchEvent(new CanvasReady())
    }

}