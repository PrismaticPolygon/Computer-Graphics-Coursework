function initPlaneVertexBuffers(gl, r, g, b, a=1) {
    // A single square in the x-y plane. Used to reduce vertices where possible

    if (!r) r = Math.random();
    if (!g) g = Math.random();
    if (!b) b = Math.random();

    // Coordinates, colors, normals and indices; line 1 - triangle 1, line 2 - triangle 2
    let vertices = new Float32Array([
        0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0,
        -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0
    ]);

    let colors = new Float32Array([
        r, g, b, a, r, g, b, a, r, g, b, a,
        r, g, b, a, r, g, b, a, r, g, b, a
    ]);

    let normal = new Float32Array([
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0
    ]);

    let indices = new Uint8Array([
        0, 1, 2,
        0, 2, 3
    ]);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 4, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normal, 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    let indexBuffer = gl.createBuffer();

    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initCubeVertexBuffers(gl, r, g, b, a=1) {

    if (r === undefined) r = Math.random();
    if (g === undefined) g = Math.random();
    if (b === undefined) b = Math.random();

    let vertices = new Float32Array([   // Coordinates

        0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front

        0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right

        0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up

        -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left

        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down

        0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5  // v4-v7-v6-v5 back

    ]);

    let colors = new Float32Array([    // Colors

        r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,     // v0-v1-v2-v3 front

        r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,     // v0-v3-v4-v5 right

        r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,     // v0-v5-v6-v1 up

        r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,     // v1-v6-v7-v2 left

        r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a,     // v7-v4-v3-v2 down

        r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a     // v4-v7-v6-v5 back

    ]);

    let normals = new Float32Array([    // Normal

        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front

        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right

        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up

        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left

        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down

        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back

    ]);

    // Texture Coordinates - front mirrors back

    let texCoords = new Float32Array([

        1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
        0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
        1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
        1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
        1.0, 0.0,    0.0, 0.0,   0.0, 1.0,   1.0, 1.0   // v4-v7-v6-v5 back

    ]);

    // Indices of the vertices
    let indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 4, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    let indexBuffer = gl.createBuffer();

    if (!indexBuffer) {

        console.log('Failed to create the buffer object');

        return false;

    }


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;

}