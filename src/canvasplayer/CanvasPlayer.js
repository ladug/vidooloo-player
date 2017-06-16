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
    useWebGl = true;
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
        this.context = this._getCanvasContext();
        this.dispatchEvent(new CanvasReady())
    }

    _getCanvasContext() {
        const {useWebGl, canvas} = this;
        if (useWebGl) {
            const context = this.canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            this.useWebGl = !!context;
            return context;
        }
        return canvas.getContext('2d');
    }

    renderSample({data, width, height, info}) {
        const {useWebgl, context} = this;
        if (useWebgl) {
            this._renderTexture(data, width, height, info)
        } else {
            const image = context.createImageData(width, height);
            image.data.set(data);
            context.put(image);
        }
    }

    _renderTexture(data, width, height, info) {
        const {context} = this;
        const gl = context;


        var texturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

        var texturePosRef = gl.getAttribLocation(program, 'texturePos');
        gl.enableVertexAttribArray(texturePosRef);
        gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);

        this.texturePosBuffer = texturePosBuffer;

        var uTexturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

        var uTexturePosRef = gl.getAttribLocation(program, 'uTexturePos');
        gl.enableVertexAttribArray(uTexturePosRef);
        gl.vertexAttribPointer(uTexturePosRef, 2, gl.FLOAT, false, 0, 0);

        this.uTexturePosBuffer = uTexturePosBuffer;


        var vTexturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

        var vTexturePosRef = gl.getAttribLocation(program, 'vTexturePos');
        gl.enableVertexAttribArray(vTexturePosRef);
        gl.vertexAttribPointer(vTexturePosRef, 2, gl.FLOAT, false, 0, 0);

        this.vTexturePosBuffer = vTexturePosBuffer;


        var texturePosBuffer = this.texturePosBuffer;
        var uTexturePosBuffer = this.uTexturePosBuffer;
        var vTexturePosBuffer = this.vTexturePosBuffer;

        var yTextureRef = this.yTextureRef;
        var uTextureRef = this.uTextureRef;
        var vTextureRef = this.vTextureRef;

        var yData = par.yData;
        var uData = par.uData;
        var vData = par.vData;

        var width = this.width;
        var height = this.height;

        var yDataPerRow = par.yDataPerRow || width;
        var yRowCnt = par.yRowCnt || height;

        var uDataPerRow = par.uDataPerRow || (width / 2);
        var uRowCnt = par.uRowCnt || (height / 2);

        var vDataPerRow = par.vDataPerRow || uDataPerRow;
        var vRowCnt = par.vRowCnt || uRowCnt;

        gl.viewport(0, 0, width, height);

        var tTop = 0;
        var tLeft = 0;
        var tBottom = height / yRowCnt;
        var tRight = width / yDataPerRow;
        var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);

        if (this.customYUV444) {
            tBottom = height / uRowCnt;
            tRight = width / uDataPerRow;
        } else {
            tBottom = (height / 2) / uRowCnt;
            tRight = (width / 2) / uDataPerRow;
        }
        ;
        var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW);


        if (this.customYUV444) {
            tBottom = height / vRowCnt;
            tRight = width / vDataPerRow;
        } else {
            tBottom = (height / 2) / vRowCnt;
            tRight = (width / 2) / vDataPerRow;
        }

        var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW);


        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
}