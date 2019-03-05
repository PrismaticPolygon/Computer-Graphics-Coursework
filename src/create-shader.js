export const createShader = (gl, type, source) => {
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
