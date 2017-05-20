/**
 * Created by vladi on 21-Feb-17.
 */
import CanvasPlayer from "./canvasplayer/CanvasPlayer";

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const getConfigurations = hostingTag => ({
    width: hostingTag.getAttribute('width') * 1 || 300,
    height: hostingTag.getAttribute('height') * 1 || 200,
    src: hostingTag.getAttribute('video') || "Default Url" //TODO: setup demo file
});

export default class VidoolooPlayer {
    configurations = {};
    container = null;

    constructor(sourceTag) {
        assert(sourceTag, "No target DOMElement!");
        /* create container tag and place it above the target tag */
        this.container = document.createElement("div");
        sourceTag.insertBefore(this.container, sourceTag);
        /* Read configurations from source DOMElement */
        this.configurations = getConfigurations(sourceTag);
    }

    createPlayerComponent() {
        const {container, configurations:{width, height}}=this;
        new CanvasPlayer(container, width, height);
    }
}
/*place the player in the position of the script tag*/
const currentScript = document.currentScript;
window.vidoolooPlayer = new VidoolooPlayer(null, currentScript); //pass script tag to the player to use for configurations
currentScript.parentNode.removeChild(currentScript); //remove the tag, no reason to keep it around
