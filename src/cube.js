function createLeftTrapezoid(width, height, depth, x, y, z, color) {

    // Create a trapezoid
    //    v3----- v4
    //    |  \   /|
    //    |    \v5|
    //    |     | |
    //     v0---|-|v1
    //       \  |/
    //         \v2

    let v0 = [x, y, z];
    let v1 = [x + width, y, z];
    let v2 = [x + width, y, z + depth];
    let v3 = [x, y + height, z];
    let v4 = [x + width, y + height, z];
    let v5 = [x + width, y + height, z + depth];

    let v0Normal = [-1.0, -1.0, -1.0];
    let v1Normal = [1.0, -1.0, -1.0];
    let v2Normal = [1.0, -1.0, 1.0];

    let v3Normal = [-1.0, 1.0, -1.0];
    let v4Normal = [-1.0, 1.0, 1.0];
    let v5Normal = [1.0, 1.0, 1.0];


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

    // I don't know what these are! How do I define them? The direction that light bounces off each vertex?
    // Cause it's going to vary for each trapezoid corner. Let's eliminate unneeded entries and see what happens!

    // Now: these normals are going to be groovy.

    const normals = new Float32Array([    //
        ...v0Normal, ...v1Normal, ...v2Normal,        // down
        ...v0Normal, ...v3Normal, ...v4Normal, ...v1Normal, // back
        ...v1Normal, ...v2Normal, ...v5Normal, ...v4Normal, // right
        ...v2Normal, ...v0Normal, ...v3Normal, ...v5Normal, // left
        ...v3Normal, ...v4Normal, ...v5Normal,        // up
    ]);

    const textureCoordinates = vertices;

    // Defines where to draw triangles between.
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

function createRightTrapezoid(width, height, depth, x, y, z, color) {

    // Create a trapezoid
    //    v3----- v4
    //    |  \   /|
    //    |    \v5|
    //    |     | |
    //     v0---|-|v1
    //       \  |/
    //         \v2

    let v0 = [x, y, z];
    let v1 = [x + width, y, z];
    let v2 = [x, y, z + depth];
    let v3 = [x, y + height, z];
    let v4 = [x + width, y + height, z];
    let v5 = [x, y + height, z + depth];

    let v0Normal = [-1.0, -1.0, -1.0];
    let v1Normal = [1.0, -1.0, -1.0];
    let v2Normal = [1.0, -1.0, 1.0];

    let v3Normal = [-1.0, 1.0, -1.0];
    let v4Normal = [-1.0, 1.0, 1.0];
    let v5Normal = [1.0, 1.0, 1.0];

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

    const normals = new Float32Array([    //
        ...v0Normal, ...v1Normal, ...v2Normal,        // down
        ...v0Normal, ...v3Normal, ...v4Normal, ...v1Normal, // back
        ...v1Normal, ...v2Normal, ...v5Normal, ...v4Normal, // right
        ...v2Normal, ...v0Normal, ...v3Normal, ...v5Normal, // left
        ...v3Normal, ...v4Normal, ...v5Normal,        // up
    ]);

    const textureCoordinates = vertices;

    // Defines where to draw triangles between.
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

    // Does it depend on this size? Or the size of something else?

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

    let v0Normal = [-1.0, -1.0, -1.0];
    let v1Normal = [1.0, -1.0, -1.0];
    let v2Normal = [1.0, -1.0, 1.0];
    let v3Normal = [-1.0, -1.0, 1.0];
    let v4Normal = [-1.0, 1.0, -1.0];
    let v5Normal = [1.0, 1.0, -1.0];
    let v6Normal = [1.0, 1.0, 1.0];
    let v7Normal = [-1.0, 1.0, 1.0];

    const vertices = new Float32Array([   // Coordinates
        ...v0, ...v1, ...v2, ...v3, // down
        ...v0, ...v4, ...v5, ...v1, // back
        ...v1, ...v2, ...v6, ...v5, // right
        ...v2, ...v3, ...v7, ...v6, // front
        ...v3, ...v0, ...v4, ...v7, // left
        ...v4, ...v5, ...v6, ...v7  // top
    ]);

    color = color ? color : [Math.random(), Math.random(), Math.random()];

    // Do I make it wrap?
    // Vertices should be fine, though, right?


    const textureCoordinates = vertices;

    const colors = new Float32Array([    // Colors
        ...color, ...color, ...color, ...color,     // down
        ...color, ...color, ...color, ...color,     // back
        ...color, ...color, ...color, ...color,     // right
        ...color, ...color, ...color, ...color,     // front
        ...color, ...color, ...color, ...color,     // left
        ...color, ...color, ...color, ...color　    // top
    ]);

    // Normals are fucked, yo! At least I'll have to learn what they mean.

    const normals = new Float32Array([    // Normals
        ...v0Normal, ...v1Normal, ...v2Normal, ...v3Normal, // down
        ...v0Normal, ...v4Normal, ...v5Normal, ...v1Normal, // back
        ...v1Normal, ...v2Normal, ...v6Normal, ...v5Normal, // right
        ...v2Normal, ...v3Normal, ...v7Normal, ...v6Normal, // front
        ...v3Normal, ...v0Normal, ...v4Normal, ...v7Normal, // left
        ...v4Normal, ...v5Normal, ...v6Normal, ...v7Normal  // top
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