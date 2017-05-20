/**
 * Created by vladi on 19-May-17.
 */
import CanvasEvent from './CanvasEvent';

const createCanvas = () => {
    const canvas = document.createElement("canvas")
};

export default class CanvasPlayer {
    controls = null;
    canvas = null;

    constructor(container, width, height) {
        const canvas = this.createCanvas(width, height);
        container.appendChild(canvas);
        this.canvas = canvas;
    }

    init(){
        CanvasPlayer.addEventListener(event=>{

        })
    }
}