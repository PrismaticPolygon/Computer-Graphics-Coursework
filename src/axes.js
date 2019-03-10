function createAxes() {

    const vertices = new Float32Array([
        -20.0,  0.0,   0.0,
        20.0,  0.0,   0.0,
        0.0,  20.0,   0.0,
        0.0, -20.0,   0.0,
        0.0,   0.0, -20.0,
        0.0,   0.0,  20.0
    ]);

    const colors = new Float32Array([
        1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
    ]);

    return  {
        vertices: vertices,
        colors: colors
    }

}


function initAxesVertexBuffers(gl) {

    var verticesColors = new Float32Array([
        // Vertex coordinates and color (for axes)
        -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b)
        20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
        0.0,  20.0,   0.0,  1.0,  1.0,  1.0,
        0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
        0.0,   0.0, -20.0,  1.0,  1.0,  1.0,
        0.0,   0.0,  20.0,  1.0,  1.0,  1.0
    ]);
    var n = 6;

    // This is a lot more complicated because it stores the colors separately.

    // Create a buffer object
    var vertexColorBuffer = gl.createBuffer();
    if (!vertexColorBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    //Get the storage location of a_Position, assign and enable buffer
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    // Get the storage location of a_Position, assign buffer and enable
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}