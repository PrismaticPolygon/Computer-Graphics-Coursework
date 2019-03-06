/**
 * The following is based on cuon-utils.js (c) 2012 kanda and matsuda,
 * and webgl-utils.js (c) 2010 Google Inc.
 */

export const utils = (gl, type, source) => {

    // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader );

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        gl.deleteShader(shader);

        throw "An error occurred compiling a shader. \n\n" + gl.getShaderInfoLog(shader);

    }

    return shader;

};

export const createProgram = (gl, vsSource, fsSource) => {

    const vertexShader = utils(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = utils(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();

    if (!shaderProgram) {

        return null;

    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {

        throw "An error occurred creating a shader program. \n\n" + gl.getProgramInfoLog(shaderProgram);

    }

    return shaderProgram

};

export const loadTexture = (gl, url)  => {

    function isPowerOf2(value) {

        return (value & (value - 1)) === 0;

    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.crossOrigin = "";
    image.onload = function () {

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };

    image.src = url;

    return texture;

};

export const getWebGLContent = function(canvas) {

    const names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    let context = null;

    for (let ii = 0; ii < names.length; ++ii) {

        try {

            context = canvas.getContext(names[ii]);

        } catch(e) {}

        if (context) {

            break;

        }

    }

    return context;

};

export const initArrayBuffer = (gl, attribute, data, num, type) => {

    // Create a buffer object
    const buffer = gl.createBuffer();

    if (!buffer) {

        throw "Failed to create buffer"

    }

    // Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Assign the buffer object to the attribute variable
    const a_attribute = gl.getAttribLocation(gl.program, attribute);

    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;

};

