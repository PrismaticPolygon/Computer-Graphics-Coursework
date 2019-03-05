import { createShader } from './create-shader';

export const createProgram = (gl, vsSource, fsSource) => {

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {

        throw "An error occurred creating a shader program. \n\n" + + gl.getProgramInfoLog(shaderProgram);

    }

    return shaderProgram

};
