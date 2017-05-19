/**
 * Created by vladi on 21-Feb-17.
 */
export default class VidoolooPlayer {
    constructor() {
        console.log("a test is happening");
        console.log("a test is happening");
        throw new Error(); // check source maps
        console.log("a test is happening");
        console.log("a test is happening");
        console.log("a test is happening");
        console.log("a test is happening");

    }
}
/*place the player in the position of the script tag*/
const currentScript = document.currentScript;
new VidoolooPlayer(currentScript); //pass script tag to the player to use for configurations
currentScript.parentNode.removeChild(currentScript);
//need to take over <script> positioning
