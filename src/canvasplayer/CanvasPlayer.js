/**
 * Created by vladi on 19-May-17.
 */
import CanvasEvent from "./CanvasEvent"
import EventEmitter from "../events/EventEmitter";

const createCanvas = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.style.width = width;
    canvas.style.height = height;
    return canvas;
};

export default class CanvasPlayer extends EventEmitter {
    controls = null;
    canvas = null;

    constructor(container, width, height) {
        super();
        const canvas = createCanvas(width, height);
        container.appendChild(canvas);
        this.canvas = canvas;
        this.init();
    }

    init() {

    }
}