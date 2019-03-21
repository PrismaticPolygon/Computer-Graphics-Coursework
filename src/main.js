let modelMatrix = new Matrix4(); // Model matrix
let viewMatrix = new Matrix4(); // View matrix
let projMatrix = new Matrix4(); // Projection matrix
let normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals


let INIT_TEXTURE_COUNT = 0;

let g_atX = 0;    // The x co-ordinate of the eye
let g_atY = 1;    // The y co-ordinate of the eye
let g_atZ = 4;    // The z co-ordinate of the eye

let g_atDelta = 0.05;    // The movement delta of the eye
let g_lookAtDelta = 0.05;  // The rotation delta of the angle the eye is looking at (degrees)
let yaw = 180;    // (+left, -right)
let pitch = 90;  // (0 up, 180 down)

//TODO: figure out it we can remove yaw and pith

let prev = new Date().getTime();
let canvas;
let gl;
let u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_ProjMatrix, u_UseTextures, u_Sampler;


let matrixStack = [];

function pushMatrix(m) {

    matrixStack.push(new Matrix4(m));

}

function popMatrix() {

    return matrixStack.pop();

}

function main() {

    canvas = document.getElementById('webgl'); // Retrieve <canvas> element
    gl = getWebGLContext(canvas); // Get the webGL context

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.clearColor(0.49, 0.75, 0.93, 1); // Set background to sky blue
    gl.enable(gl.DEPTH_TEST); // Enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffer

    // Enable alpha blend for windows
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Get the storage locations of uniform attributes
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

    let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

    // Perspective and lighting
    {

        projMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 20);
        gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
        gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
        gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    }

    u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    initTextures(gl, u_Sampler);

    window.addEventListener("keydown", (ev) => {

        keys.push(ev.key);

    });

    window.addEventListener("keyup", (ev) => {

        keys.splice(keys.indexOf(ev.key));

    });

    tick();

}

let keys = [];

function handleKeys() {

    for (let key of keys) {

        switch (key) {

            case "ArrowDown": // Down arrow key -> look down

                pitch = Math.min(pitch + g_lookAtDelta, 179.9);

                break;

            case "ArrowUp": // Up arrow key -> look up

                pitch = Math.max(pitch - g_lookAtDelta, 0.1);

                break;

            case "ArrowRight": // Right arrow key -> look right

                yaw = (yaw - g_lookAtDelta) % 360;

                break;

            case "ArrowLeft": // Left arrow key -> look left

                yaw = (yaw + g_lookAtDelta) % 360;

                break;

            case "w":  // w key -> move the eye forwards

                g_atX += g_atDelta * Math.sin(yaw * Math.PI / 180);
                g_atZ += g_atDelta * Math.cos(yaw * Math.PI / 180);

                break;

            case "d":  // a key -> move the eye left

                g_atX += g_atDelta * Math.cos(yaw * Math.PI / 180);
                g_atZ -= g_atDelta * Math.sin(yaw * Math.PI / 180);

                break;

            case "s":  // s key -> move the eye backwards

                g_atX -= g_atDelta * Math.sin((yaw) * Math.PI / 180);
                g_atZ -= g_atDelta * Math.cos((yaw) * Math.PI / 180);

                break;

            case "a":  // d key -> move the eye left

                g_atX -= g_atDelta * Math.cos(yaw * Math.PI / 180);
                g_atZ += g_atDelta * Math.sin(yaw * Math.PI / 180);

                break;

            case "Shift":  // shift key -> move the eye up

                g_atY += g_atDelta;

                break;

            case "Control":  // ctrl key -> move the eye down

                g_atY -= g_atDelta;

                break;
        }

    }

}


function keydown(ev) {

    switch (ev.keyCode) {

        case 40: // Up arrow key -> look up

            pitch = Math.min(pitch + g_lookAtDelta, 179.9);

            break;

        case 38: // Down arrow key -> look down

            pitch = Math.max(pitch - g_lookAtDelta, 0.1);

            break;

        case 39: // Right arrow key -> look right

            yaw = (yaw - g_lookAtDelta) % 360;

            break;

        case 37: // Left arrow key -> look left

            yaw = (yaw + g_lookAtDelta) % 360;

            break;

        case 87:  // w key -> move the eye forwards

            g_atX += g_atDelta * Math.sin(yaw * Math.PI / 180);
            g_atZ += g_atDelta * Math.cos(yaw * Math.PI / 180);

            break;

        case 65:  // a key -> move the eye left

            g_atX += g_atDelta * Math.cos(yaw * Math.PI / 180);
            g_atZ -= g_atDelta * Math.sin(yaw * Math.PI / 180);

            break;

        case 83:  // s key -> move the eye backwards

            g_atX -= g_atDelta * Math.sin((yaw) * Math.PI / 180);
            g_atZ -= g_atDelta * Math.cos((yaw) * Math.PI / 180);

            break;

        case 68:  // d key -> move the eye left

            g_atX -= g_atDelta * Math.cos(yaw * Math.PI / 180);
            g_atZ += g_atDelta * Math.sin(yaw * Math.PI / 180);

            break;

        case 16:  // shift key -> move the eye up

            g_atY += g_atDelta;

            break;

        case 17:  // ctrl key -> move the eye down

            g_atY -= g_atDelta;

            break;

    }

    // It updates it anyway! That's the problem. Even if it hasn't changed.
    // We would have to update it internally. I'll switch over to an upgraded version now.

    // Okay! That is more like it.

    g_lookAtX += Math.sin(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The x co-ordinate the eye is looking at
    g_lookAtY += Math.cos(pitch * Math.PI / 180);  // The y co-ordinate the eye is looking at
    g_lookAtZ += Math.cos(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The z co-ordinate the eye is looking at

    console.log(g_atX, g_atY, g_atZ, g_lookAtX, g_lookAtY, g_lookAtZ);

}

function draw() {

    if (INIT_TEXTURE_COUNT < 2) {   // Don't do anything until textures have been loaded

        return;

    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let g_lookAtX = g_atX + Math.sin(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The x co-ordinate the eye is looking at
    let g_lookAtY = g_atY + Math.cos(pitch * Math.PI / 180);  // The y co-ordinate the eye is looking at
    let g_lookAtZ = g_atZ + Math.cos(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The z co-ordinate the eye is looking at

    viewMatrix.setLookAt(g_atX, g_atY, g_atZ, g_lookAtX, g_lookAtY, g_lookAtZ, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    draw_front_door(0, 0, 0);

}

function draw_cube(n, texture) {

    // Texture must be an integer i such that gl.TEXTUREi is used

    if (texture != null){

        gl.uniform1i(u_Sampler, texture);
        gl.uniform1i(u_UseTextures, 1);

    }

    pushMatrix(modelMatrix);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements); // Pass the model matrix to the uniform variable

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Draw the cube

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    modelMatrix = popMatrix();

    // Turn off texture if used

    if (texture != null){

        gl.uniform1i(u_UseTextures, 0);

    }

}

function draw_plane(n) {

    pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Draw the plane
    gl.drawArrays(gl.TRIANGLES, 0, n);

    modelMatrix = popMatrix();

}

function draw_front_door(x, y, z) {

    let frame_width = 0.03;
    let width = 0.7;
    let height = 1.8;
    let window_height = 0.4;

    // Forms a door with door frame - x, y, z at centre of door
    // Total size - width + 0.12 * height + 0.06 * 0.1
    // Rotates around a hinge like a real door by angle open_by

    pushMatrix(modelMatrix);

    modelMatrix.translate(x, y, z);

    // Draw frame
    let n = initCubeVertexBuffers(gl, 0.4, 0.4, 0.4);

    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    for (let i = 0; i <= 1; i++) {

        let sign = Math.pow(-1, i);

        // Left/right
        pushMatrix(modelMatrix);

        modelMatrix.translate(sign * (width / 2 + frame_width), (frame_width + window_height) / 2, 0);
        modelMatrix.scale(2 * frame_width, height + 3 * frame_width + window_height, 0.1);

        draw_cube(n, 1);

        modelMatrix = popMatrix();

    }

    //bottom

    pushMatrix(modelMatrix);
    modelMatrix.translate(0, -height / 2 -frame_width / 2, 0);
    modelMatrix.scale(width, 2 * frame_width, 0.1);
    draw_cube(n, 1);
    modelMatrix = popMatrix();

    //middle

    pushMatrix(modelMatrix);
    modelMatrix.translate(0, height / 2 + frame_width, 0);
    modelMatrix.scale(width, 2 * frame_width, 0.1);
    draw_cube(n, 1);
    modelMatrix = popMatrix();


    // top
    pushMatrix(modelMatrix);
    modelMatrix.translate(0, height / 2 + + window_height + frame_width, 0);
    modelMatrix.scale(width, 2 * frame_width, 0.1);
    draw_cube(n, 1);
    modelMatrix = popMatrix();


    // Draw door
    n = initCubeVertexBuffers(gl, 182/255, 155/255, 76/255);

    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Door just vanishes, yo!
    // Make door flush with inside frame. Use double translate for easy hinge design
    modelMatrix.translate(width / 2, 0, 0.05);
    modelMatrix.rotate(0, 0, 1, 0); // 0 is shut, 100 fully open - looks better than a square 90
    modelMatrix.translate(-width / 2, 0, -frame_width);
    modelMatrix.scale(width, height, 2 * frame_width);
    draw_cube(n); // Door texture

    modelMatrix = popMatrix();

    //window

    pushMatrix(modelMatrix);
    n = initPlaneVertexBuffers(gl, 1, 1, 1, 0.25);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;
    }

    modelMatrix.translate(0, y + height / 2 + frame_width + window_height / 2, 0.05);
    modelMatrix.scale(width, window_height, 1);
    draw_plane(n);

    modelMatrix = popMatrix();

}

function tick() {

    let cur = new Date().getTime();
    prev = (cur - prev);
    prev = cur;

    handleKeys();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw();

    requestAnimationFrame(tick);

}

function createTexture(gl, name, id){

    let texture = gl.createTexture(); // Create texture

    if(!texture) {

        console.log("Failed to create texture object");
        return false;

    }

    let image = new Image(); // Create the image object

    if (!image) {

        console.log('Failed to create the image object');
        return false;
    }

    image.onload = function(){

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
        gl.activeTexture(id); // Assign to right texture

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.clear(gl.COLOR_BUFFER_BIT); // Clear colour buffer

        INIT_TEXTURE_COUNT++; // Won't render until all textures loaded

    };

    image.src = name;

}

function initTextures(gl, u_Sampler) {

    if (!u_Sampler) {

        console.log('Failed to get the storage location of u_Sampler');
        return false;

    }

    // Setup texture mappings
    createTexture(gl, '../textures/bricks.jpg', gl.TEXTURE0);
    createTexture(gl, '../textures/white_wood.jpg', gl.TEXTURE1);

    return true;

}