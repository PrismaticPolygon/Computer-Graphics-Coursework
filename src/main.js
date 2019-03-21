// Anything that requires syncing CPU and GPU sides is very slow: avoid doing so in main rendering loop.
// Also include WebGL getter calls. Fewer, larger, draw operations will improve performance.
// Do as much as possible in the vertex shader.

let modelMatrix = new Matrix4(); // The model
let viewMatrix = new Matrix4();
let projMatrix = new Matrix4();
let normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals
let mvpMatrix = new Matrix4();  // Model view projection matrix

// Add multiple lights

let textures = {

    WOOD: {
        texture: null,
        src: white_wood
    },

    BRICK: {
        texture: null,
        src: brick
    }

};

//

// Far better to. How will I know which texture is bound to which without a key?
// Return the specific ID, associate each shape with a "thing", and then get the right texture.

let ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
let g_xAngle = 0.0;    // The rotation x angle (degrees)
let g_yAngle = 0.0;    // The rotation y angle (degrees)
let EYE_STEP = 0.2;
let g_eyeX = 12;
let g_eyeY = 12;
let g_eyeZ = 12;

// We have textures 0 through 7.

function main() {

    const canvas = document.getElementById('webgl'); // Retrieve <canvas> element
    const gl = getWebGLContext(canvas); // Get the webGL context

    for (let key in textures) {

        console.log("Loading", key);

        textures[key].texture = loadTexture(gl, textures[key].src);

    }

    // Then it SHOULD work on rotation, right?

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Set clear color
    gl.enable(gl.DEPTH_TEST); // Enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffer

    // Get the storage locations of uniform attributes
    let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    let u_MvpMatrix = gl.getUniformLocation(gl.program, "u_MvpMatrix");
    let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');

    // Lighting
    {

        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
        gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
        gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    }

    // Perspective
    {

        mvpMatrix.setPerspective(30, canvas.clientWidth / canvas.clientHeight, 1, 100);
        mvpMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, 0, 0, 0, 0, 1, 0);
        mvpMatrix.multiply(modelMatrix);

        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();

        // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    }

    let u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');
    let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    document.onkeydown = function(ev){ keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_MvpMatrix,
        u_UseTextures, u_Sampler); };

    draw(gl, u_ModelMatrix, u_NormalMatrix, u_MvpMatrix, u_UseTextures, u_Sampler);

}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_MvpMatrix, u_UseTextures, u_Sampler) {

    switch (ev.keyCode) {

    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis

        g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
        break;

    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis

        g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
        break;

    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis

        g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
        break;

    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis

        g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
        break;

    case 87:  // w key -> move the eye forward

        g_eyeZ += EYE_STEP;
        break;

    case 65:  // a key -> move the eye left

        g_eyeX -= EYE_STEP;
        break;

    case 83:  // s key -> move the eye backwards

        g_eyeZ -= EYE_STEP;
        break;

    case 68:  // d key -> move the eye left

        g_eyeX += EYE_STEP;
        break;

    case 16:  // shift key -> move the eye down

        g_eyeY -= EYE_STEP;
        break;

    case 32:  // space key -> move the eye up

        g_eyeY += EYE_STEP;
        break;

    default: return; // Skip drawing at no effective action

  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_MvpMatrix, u_UseTextures, u_Sampler);

}

function initObjectBuffers(gl, object) {

    if (!initArrayBuffer(gl, 'a_Position', object.vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', object.colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', object.normals, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoords', object.textureCoordinates, 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    let indexBuffer = gl.createBuffer();

    if (!indexBuffer) {

        console.log('Failed to create the buffer object');
        return false;

    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, object.indices, gl.STATIC_DRAW);

    return object.indices.length;

}


const WHITE = [1.0, 1.0, 1.0];
const RED = [1.0, 0.0, 0.0];

let objects = {

    structure: createCuboid(4, 6, 4, -2, -3, -2),

    frontDoorFrame: createCuboid(0.8, 2.55, 0.001, -1.8, -3, 2, WHITE, te.WOOD),
    frontDoor: createCuboid(0.7, 1.8, 0.005, -1.75, -2.75, 2, RED),
    frontDoorWindow: createCuboid(0.7, 0.4, 0.005, -1.75, -0.9, 2),
    frontDoorLintel: createCuboid(1, 0.2, 0.005, -1.9, -0.45, 2, WHITE),
    frontStep: createCuboid(0.7, 0.2, 0.3, -1.75, -3, 2),

    frontWindowTopLeft: createLeftTrapezoid(0.5, 0.2, 0.5, -0.6, -0.45, 2, WHITE),
    frontWindowTopCentre: createCuboid(1.2, 0.2, 0.5, -0.1, -0.45, 2, WHITE),
    frontWindowTopRight: createRightTrapezoid(0.5, 0.2, 0.5, 1.1, -0.45, 2, WHITE),

    frontWindowLeft: createLeftTrapezoid(0.4, 1.65, 0.4, -0.5, -2.1, 2),
    frontWindowCentre: createCuboid(1.2, 1.65, 0.4, -0.1, -2.1, 2),
    frontWindowRight: createRightTrapezoid(0.4, 1.65, 0.4, 1.1, -2.1, 2),

    frontWindowLeftWindowSill: createLeftTrapezoid(0.5, 0.2, 0.5, -0.6, -2.3, 2, WHITE),
    frontWindowCentreWindowSill: createCuboid(1.2, 0.2, 0.5, -0.1, -2.3, 2, WHITE),
    frontWindowRightWindowSill: createRightTrapezoid(0.5, 0.2, 0.5, 1.1, -2.3, 2, WHITE),

    frontWindowBottomLeft: createLeftTrapezoid(0.4, 0.7, 0.4, -0.5, -3, 2),
    frontWindowBottomCentre: createCuboid(1.2, 0.7, 0.4, -0.1, -3, 2),
    frontWindowBottomRight: createRightTrapezoid(0.4, 0.7, 0.4, 1.1, -3, 2),

    frontWindowTopSlopeCentre: createRightTrapezoid(0.95, 1.2, 0.5, 1, 1, 2),

    nathanielWindowFrame: createCuboid(1.2, 1.6, 0.005, -0.1, 1.1, 2, WHITE),
    nathanielWindowTop: createCuboid(1.2, 0.3, 0.1, -0.1, 2.65, 2.0001, WHITE),
    nathanielWindow: createCuboid(1.1, 1.4, 0.005, -0.05, 1.2, 2),
    nathanielWindowBottom: createCuboid(1.2, 0.3, 0.1, -0.1, 0.8, 2, WHITE),

    frontRoof: createRightTrapezoid(1, 4, 2, 0, 0, 0, WHITE),
    backRoof: createLeftTrapezoid(1, 4, 2, 0, 0, 0, WHITE)

};

//Pass in gl, u_ModelMatrix, u_NormalMatrix, n
// gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)
// gl.normalMatrix.setInverse

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_MvpMatrix, u_UseTextures, u_Sampler) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer
    gl.enable(gl.DEPTH_TEST);   // Enable depth testing
    gl.depthFunc(gl.LEQUAL);    // Near things obscure far things

    for (let key in objects) {

        let object = objects[key];
        let n = initObjectBuffers(gl, object);

        modelMatrix.setTranslate(0, 0, 0);
        modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
        modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
        modelMatrix.scale(0.9, 0.9, 0.9); // Scale

        if (key === "frontWindowTopSlopeCentre") {

            modelMatrix.rotate(90, 0, 0, 1);
            modelMatrix.translate(-1.2, -2.1, 0);

        }

        if (key === "frontRoof") {

            modelMatrix.translate(2, 3, 0);
            modelMatrix.rotate(90, 0, 0, 1);

        }

        if (key === "backRoof") {

            modelMatrix.translate(2, 4, 0);
            modelMatrix.rotate(180, 0, 1, 0);
            modelMatrix.rotate(-90, 0, 0, 1);

        }

        mvpMatrix.setPerspective(30, 1, 1, 100);

        // It's not lookAt. We want to move the camera itself.
        // And we're still getting weird tinges of color.

        mvpMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, 0, 0, 0, 0, 1, 0);
        mvpMatrix.multiply(modelMatrix);

        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();

        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);    //This line
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);    //
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D);

        gl.uniform1i(u_UseTextures, 1);

        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    }

}
