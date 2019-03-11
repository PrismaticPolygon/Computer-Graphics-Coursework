function createLeftTrapezoid(width, height, depth, x, y, z, color) {

    // Create a trapezoid
    //    v3----- v4
    //    |  \   /|
    //    |    \v5|
    //    |     | |
    //     v0---|-|v1
    //       \  |/
    //         \v2

    let theta = Math.tan(depth / width);
    let v0 = [x, y, z];
    let v1 = [x + width, y, z];
    let v2 = [x + width, y, z + depth];
    let v3 = [x, y + height, z];
    let v4 = [x + width, y + height, z];
    let v5 = [x + width, y + height, z + depth];

    const vertices = new Float32Array([   // Coordinates
        ...v0, ...v1, ...v2,        // down
        ...v0, ...v3, ...v4, ...v1, // back
        ...v1, ...v2, ...v5, ...v4, // right
        ...v2, ...v0, ...v3, ...v5, // left
        ...v3, ...v4, ...v5,        // up
    ]);

    color = color ? color : [Math.random(), Math.random(), Math.random()];

    const colors = new Float32Array([    // Colors
        ...color, ...color, ...color,
        ...color, ...color, ...color, ...color,
        ...color, ...color, ...color, ...color,
        ...color, ...color, ...color, ...color,
        ...color, ...color, ...color,
    ]);

    let n_x = Math.sin(theta), n_z = Math.cos(theta);

    const normals = new Float32Array([
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,                  // down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0, // back
        n_x, 0.0, n_z,   n_x, 0.0, n_z,   n_x, 0.0, n_z,   n_x, 0.0, n_z, // right
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0, // left
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0, // up
    ]);

    const textureCoordinates = vertices;

    const indices = new Uint8Array([
        0, 1, 2,               // down
        3, 4, 5,   3, 5, 6,    // back
        7, 8, 9,   7, 9,10,    // right
        11,12,13,  11,13,14,   // left
        15,16,17               // up
    ]);

    return {
        vertices: vertices,
        colors: colors,
        normals: normals,
        indices: indices,
        textureCoordinates: textureCoordinates
    }

}

// Fix trapezoid normals too!

function createRightTrapezoid(width, height, depth, x, y, z, color) {

    // Create a trapezoid
    //    v3----- v4
    //    |  \   /|
    //    |    \v5|
    //    |     | |
    //     v0---|-|v1
    //       \  |/
    //         \v2

    let theta = Math.tan(depth / width);

    let v0 = [x, y, z];
    let v1 = [x + width, y, z];
    let v2 = [x, y, z + depth];
    let v3 = [x, y + height, z];
    let v4 = [x + width, y + height, z];
    let v5 = [x, y + height, z + depth];

    const vertices = new Float32Array([   // Coordinates
        ...v0, ...v1, ...v2,        // down
        ...v0, ...v3, ...v4, ...v1, // back
        ...v1, ...v2, ...v5, ...v4, // right
        ...v2, ...v0, ...v3, ...v5, // left
        ...v3, ...v4, ...v5,        // up
    ]);

    color = color ? color : [Math.random(), Math.random(), Math.random()];

    const colors = new Float32Array([    // Colors
        ...color, ...color, ...color,
        ...color, ...color, ...color, ...color,
        ...color, ...color, ...color, ...color,
        ...color, ...color, ...color, ...color,
        ...color, ...color, ...color,
    ]);

    let n_x = -1.0 *  Math.sin(theta), n_z = Math.cos(theta);

    const normals = new Float32Array([
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,                  // down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0, // back
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0, // right
        n_x, 0.0, n_z,   n_x, 0.0, n_z,   n_x, 0.0, n_z,   n_x, 0.0, n_z, // left
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0, // up
    ]);

    const textureCoordinates = vertices;

    const indices = new Uint8Array([
        0, 1, 2,               // down
        3, 4, 5,   3, 5, 6,    // back
        7, 8, 9,   7, 9,10,    // right
        11,12,13,  11,13,14,   // left
        15,16,17               // up
    ]);

    return {
        vertices: vertices,
        colors: colors,
        normals: normals,
        indices: indices,
        textureCoordinates: textureCoordinates
    }

}

function createCuboid(width, height, depth, x, y, z, color) {

    // Create a cube
    //    v4----- v5
    //   /|      /|
    //  v7------v6|
    //  | |     | |
    //  | |v0---|-|v1
    //  |/      |/
    //  v3------v2

    let v0 = [x, y, z];
    let v1 = [x + width, y, z];
    let v2 = [x + width, y, z + depth];
    let v3 = [x, y, z + depth];
    let v4 = [x, y + height, z];
    let v5 = [x + width, y + height, z];
    let v6 = [x + width, y + height, z + depth];
    let v7 = [x, y + height, z + depth];

    const vertices = new Float32Array([   // Coordinates
        ...v0, ...v1, ...v2, ...v3, // down
        ...v0, ...v4, ...v5, ...v1, // back
        ...v1, ...v2, ...v6, ...v5, // right
        ...v2, ...v3, ...v7, ...v6, // front
        ...v3, ...v0, ...v4, ...v7, // left
        ...v4, ...v5, ...v6, ...v7  // top
    ]);

    color = color ? color : [Math.random(), Math.random(), Math.random()];

    const textureCoordinates = vertices;

    const colors = new Float32Array([    // Colors
        ...color, ...color, ...color, ...color,     // down
        ...color, ...color, ...color, ...color,     // back
        ...color, ...color, ...color, ...color,     // right
        ...color, ...color, ...color, ...color,     // front
        ...color, ...color, ...color, ...color,     // left
        ...color, ...color, ...color, ...color　    // top
    ]);

    const normals = new Float32Array([
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0, // down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0, // back
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0, // right
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0, // front
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0, // left
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0, // up
    ]);

    const indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    return {
        vertices: vertices,
        colors: colors,
        normals: normals,
        textureCoordinates: textureCoordinates,
        indices: indices
    }

}