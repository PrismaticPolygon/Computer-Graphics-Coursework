// Anything that requires syncing CPU and GPU sides is very slow: avoid doing so in main rendering loop.
// Also include WebGL getter calls. Fewer, larger, draw operations will improve performance.
// Do as much as possible in the vertex shader.

let modelMatrix = new Matrix4(); // Model matrix
let viewMatrix = new Matrix4(); // View matrix
let projMatrix = new Matrix4(); // Projection matrix
let normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals


let INIT_TEXTURE_COUNT = 0;

let g_atX = 1;    // The x co-ordinate of the eye
let g_atY = 1;    // The y co-ordinate of the eye
let g_atZ = 1;    // The z co-ordinate of the eye
let g_atDelta = 0.2;    // The movement delta of the eye

let g_lookAtX = 0;  // The x co-ordinate the eye is looking at
let g_lookAtY = 0;  // The y co-ordinate the eye is looking at
let g_lookAtZ = 0;  // The z co-ordinate the eye is looking at
let g_lookAtDelta = 5;  // The increments of rotation angle (degrees)

let yaw = 0;    // (+left, -right)
let pitch = 0;  // (0 up, 180 down)

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

    tick(); //Start rendering

    //
    document.onkeydown = function(ev) { keydown(ev) }
    //
    // draw(gl, u_ModelMatrix, u_NormalMatrix, u_MvpMatrix, u_UseTextures, u_Sampler);

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

    g_lookAtX = g_atX + Math.sin(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The x co-ordinate the eye is looking at
    g_lookAtY = g_atY + Math.cos(pitch * Math.PI / 180);  // The y co-ordinate the eye is looking at
    g_lookAtZ = g_atZ + Math.cos(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The z co-ordinate the eye is looking at

    // console.log(g_atX, g_atY, g_atZ, g_lookAtX, g_lookAtY, g_lookAtZ);

}


function draw() {

    if (INIT_TEXTURE_COUNT < 2) {   // Don't do anything until textures have been loaded

        return;

    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    viewMatrix.setLookAt(g_atX, g_atY, g_atZ, g_lookAtX, g_lookAtY, g_lookAtZ, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    draw_table(1, 1, 1);

}


function draw_box(n, texture) {

    // console.log("Draw box called");
    //
    // Texture must be an integer i such that gl.TEXTUREi is used

    if (texture != null){

        gl.uniform1i(u_Sampler, texture);

        gl.uniform1i(u_UseTextures, 1);

    }



    pushMatrix(modelMatrix);



    // Pass the model matrix to the uniform variable

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);



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

function draw_table(x, y, z) {

    // console.log("Draw table called");

    // Form table - x, y, z gives floor point under centre of table.

    // Total size - 0.6*0.74*0.6

    pushMatrix(modelMatrix);

    modelMatrix.translate(x,y,z); // Translate to floor below centre of table.

    // Model the table legs and supports

    var n = initCubeVertexBuffers(gl, 44/255, 53/255, 57/255);

    if (n < 0) {

        console.log('Failed to set the vertex information');

        return;

    }

    for (var i=0; i<360; i+=90) {

        pushMatrix(modelMatrix); // push general translation

        modelMatrix.rotate(i, 0, 1, 0);

        // Leg

        pushMatrix(modelMatrix);

        modelMatrix.translate(0.29, 0.35, 0.29);

        modelMatrix.scale(0.02, 0.7, 0.02);

        draw_box(n);

        modelMatrix=popMatrix();

        // Support

        pushMatrix(modelMatrix);

        modelMatrix.translate(0.29, 0.69, 0);

        modelMatrix.scale(0.02, 0.02, 0.56);

        draw_box(n);

        modelMatrix = popMatrix();



        modelMatrix = popMatrix(); // back to general translation

    }



    // Model the table top

    n = initCubeVertexBuffers(gl, 207/255, 218/255, 209/255);

    if (n < 0) {

        console.log('Failed to set the vertex information');

        return;

    }



    modelMatrix.translate(0, 0.72, 0);

    modelMatrix.scale(0.6, 0.04, 0.6);

    draw_box(n);

    modelMatrix = popMatrix(); // Undo general transform.

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

function tick() {

    let cur = new Date().getTime();
    prev = (cur - prev);
    prev = cur;

    // keydown();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw();

    requestAnimationFrame(tick);


}

function createTexture(gl, name, id){

    var texture = gl.createTexture(); // Create texture

    if(!texture){
        console.log("Failed to create texture object");
        return false;
    }

    var image = new Image(); // Create the image object

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
