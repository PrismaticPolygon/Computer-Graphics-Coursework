// 20 marks for textures
// 20 marks for lighting and cameras
// 20 marks for my own 3D models
// 20 marks for one building, a landscape around it, and some meaningful objects enriching the surroundings.
// 20 marks for constructing movable models. Nice!

// Oh: draw them as planes to save vertices! Doesn't that make sense?
// Of course, if I'm not moving, it's not laggy. Remember: GPU / CPU comms is the bottleneck.

// Cause I only have to update the view matrix if I actually move, right?

// So the priority now must be on animation.

let modelMatrix = new Matrix4(); // Model matrix
let viewMatrix = new Matrix4(); // View matrix
let projMatrix = new Matrix4(); // Projection matrix
let normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

const LIGHT_POSITIONS = [
    -2.5, 4.2, 4, // Left streetlight
    2.5, 4.2, 4,  // Right streetlight
    4, 4.2, -6,  // Back streetlight
    0, 20, 0   // Sun
];

// Maybe the sun shouldn't attenuate.

const LIGHT_COLORS = [
    255/255, 241/255, 224/255,
    255/255, 241/255, 224/255,
    255/255, 241/255, 224/255,
    253/255, 184/255, 19/255
];

let light_colors = [...LIGHT_COLORS];

let INIT_TEXTURE_COUNT = 0;
let USE_TEXTURES = false;
let USE_STREETLIGHTS = true;

let g_atX = 0;    // The x co-ordinate of the eye
let g_atY = 3;    // The y co-ordinate of the eye
let g_atZ = -15;    // The z co-ordinate of the eye

let g_atDelta = 0.005;    // The movement delta of the eye
let g_lookAtDelta = 0.05;  // The rotation delta of the angle the eye is looking at (degrees)
let yaw = 0;    // (+left, -right)
let pitch = 90;  // (0 up, 180 down)

// My windows are continously re-rendering. What method are they using?

let canvas, hud;
let gl;
let u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_ProjMatrix, u_UseTextures, u_Sampler, u_LightColor, u_LightPosition, u_AmbientLight;
let keys = [];

let matrixStack = [];

// I'll add a blind to Nathaniel's room, that seems to be a weirdly popular thing to do.
// No, I'll eat first.

function pushMatrix(m) {

    matrixStack.push(new Matrix4(m));

}

function popMatrix() {

    return matrixStack.pop();

}

function main() {

    canvas = document.getElementById('webgl'); // Retrieve <canvas> element
    hud = document.getElementById('hud'); // Retrieve HUD <canvas> element
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
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    // Set up the projection matrix
    projMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 20);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    // Set up lighting
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    gl.uniform3fv(u_LightColor,LIGHT_COLORS);
    gl.uniform3fv(u_LightPosition, LIGHT_POSITIONS);

    // Initialise textures
    initTextures(gl, u_Sampler);

    // Add key handlers
    window.addEventListener("keydown", (ev) => {

        handleDiscreteKeys(ev.key);

        keys.push(ev.key)

    });

    window.addEventListener("keyup", (ev) => keys.splice(keys.indexOf(ev.key)));

    // Start rendering loops
    tick();

}

function handleDiscreteKeys(key) {

    switch (key) {

        case "1":

            USE_TEXTURES = !USE_TEXTURES;

            console.log("USE_TEXTURES: " + USE_TEXTURES);

            break;

        case "2":

            USE_STREETLIGHTS = !USE_STREETLIGHTS;

            console.log("USE_STREETLIGHTS: " + USE_STREETLIGHTS);

            if (USE_STREETLIGHTS) {

                light_colors = [...LIGHT_COLORS];

            } else {

                for (let i = 0; i < 9; i++) {

                    light_colors[i] = 0;

                }

            }

            gl.uniform3fv(u_LightColor, light_colors);

            break;

    }

}

function handleContinuousKeys() {

    // I could then remove the key. Kinda messy, though.

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

            case "a":  // a key -> move the eye left

                g_atX += g_atDelta * Math.cos(yaw * Math.PI / 180);
                g_atZ -= g_atDelta * Math.sin(yaw * Math.PI / 180);

                break;

            case "s":  // s key -> move the eye backwards

                g_atX -= g_atDelta * Math.sin((yaw) * Math.PI / 180);
                g_atZ -= g_atDelta * Math.cos((yaw) * Math.PI / 180);

                break;

            case "d":  // d key -> move the eye left

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

function draw() {

    if (INIT_TEXTURE_COUNT < 4) {   // Don't do anything until textures have been loaded

        return;

    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let g_lookAtX = g_atX + Math.sin(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The x co-ordinate the eye is looking at
    let g_lookAtY = g_atY + Math.cos(pitch * Math.PI / 180);  // The y co-ordinate the eye is looking at
    let g_lookAtZ = g_atZ + Math.cos(yaw * Math.PI / 180) * Math.sin(pitch * Math.PI / 180);  // The z co-ordinate the eye is looking at

    viewMatrix.setLookAt(g_atX, g_atY, g_atZ, g_lookAtX, g_lookAtY, g_lookAtZ, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    draw_floor();
    draw_front_door(-2, 0, 2);
    draw_front_window(-0.2, 0, 2);
    draw_nathaniel_window(0.2, 3.45, 2);
    draw_structure(-2.5, 0, 2, 5.5, 4, 5);

    draw_structure(-2.5, 0, -2, 2, 3, 2);
    draw_nathaniel_window(0.6, 3.45, -2.1);
    draw_nathaniel_window(-1.8, 3.45, -2.1);
    draw_nathaniel_window(0.6, 0.75, -2.1);


    draw_car();

    draw_streetlights();

    // Yeah, I might actually add a streetlight back here for some lighting.

}

let car_x = 0, car_y = 0, car_z = 5;

function draw_car() {

    let car_length = 2.5;
    let car_height = 0.75;
    let car_width = 1;

    let cockpit_height = 0.5;
    let cockpit_length = 1;

    let n = initCubeVertexBuffers(gl, 0.4, 0.4, 0.4);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    car_x += 2 * delta;

    if (car_x > 12) {

        car_x = -8;

    }

    pushMatrix(modelMatrix);

    modelMatrix.translate(car_x, car_y, car_z);

    pushMatrix(modelMatrix);

    modelMatrix.translate(0, car_height / 2, 0);
    modelMatrix.scale(car_length, car_height, car_width);

    draw_cube(n, 0);

    modelMatrix = popMatrix();

    pushMatrix(modelMatrix);

    modelMatrix.translate(0, car_height + cockpit_height / 2, 0);
    modelMatrix.scale(cockpit_length, cockpit_height, car_width);

    draw_cube(n, 0);

    modelMatrix = popMatrix();
    modelMatrix = popMatrix();

}

function draw_streetlights() {

    let column_height = 4;
    let column_size = 0.1;
    let lamp_size= 0.2;
    let lamp_height = 0.4;
    let n = initCubeVertexBuffers(gl, 0.4, 0.4, 0.4);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    // bases
    {

        pushMatrix(modelMatrix);

        modelMatrix.translate(-2.5, 0, 4);

        modelMatrix.translate(column_size / 2, column_height / 2, column_size / 2);
        modelMatrix.scale(column_size, column_height, column_size);

        draw_cube(n);

        modelMatrix = popMatrix();

        pushMatrix(modelMatrix);

        modelMatrix.translate(2.5, 0, 4);

        modelMatrix.translate(column_size / 2, column_height / 2, column_size / 2);
        modelMatrix.scale(column_size, column_height, column_size);

        draw_cube(n);

        modelMatrix = popMatrix();

        pushMatrix(modelMatrix);

        modelMatrix.translate(4, 0, -6);

        modelMatrix.translate(column_size / 2, column_height / 2, column_size / 2);
        modelMatrix.scale(column_size, column_height, column_size);

        draw_cube(n);

        modelMatrix = popMatrix();

    }

    // I don't update it globally, alas.

    n = initCubeVertexBuffers(gl, ...light_colors.slice(0, 3), 0.6);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    // Ooh, and then change their color to dark! Wait...

    //right
    {

        pushMatrix(modelMatrix);

        modelMatrix.translate(2.5, 0, 4);

        modelMatrix.translate(column_size / 2, column_height + lamp_height / 2, column_size / 2);
        modelMatrix.scale(lamp_size, lamp_height, lamp_size);

        draw_cube(n);

        modelMatrix = popMatrix();

        pushMatrix(modelMatrix);

        modelMatrix.translate(-2.5, 0, 4);

        modelMatrix.translate(column_size / 2, column_height + lamp_height / 2, column_size / 2);
        modelMatrix.scale(lamp_size, lamp_height, lamp_size);

        draw_cube(n);

        modelMatrix = popMatrix();

        pushMatrix(modelMatrix);

        modelMatrix.translate(4, 0, -6);

        modelMatrix.translate(column_size / 2, column_height + lamp_height / 2, column_size / 2);
        modelMatrix.scale(lamp_size, lamp_height, lamp_size);

        draw_cube(n);

        modelMatrix = popMatrix();


    }

}

function draw_structure(x, y, z, height, depth, width) {

    let roof_length = depth / 2;
    let roof_height = 1;
    let roof_slope = Math.sqrt(Math.pow(roof_height, 2) + Math.pow(roof_length, 2));
    let n = initCubeVertexBuffers(gl, 1, 1, 1, 1);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    pushMatrix(modelMatrix);

    modelMatrix.translate(x + width / 2, y + height / 2, z - depth / 2);
    modelMatrix.scale(width, height, depth);

    draw_cube(n, 0);

    // Let's move the sun!

    modelMatrix = popMatrix();

    // pushMatrix(modelMatrix);
    // modelMatrix.translate(x + width / 2, y + height, z - depth / 2);
    // modelMatrix.scale(width, height, depth);
    //
    // draw_cube(n, 2);
    //
    // modelMatrix = popMatrix();

    // It will ruin my windows, for sure.
    // It'd be a matter of adjusting my vertex buffers. But first things first! Roof, then I'll make some streetlights,
    // and make them light sources.

}

function draw_floor() {

    let height = 0.0001;
    let n = initPlaneVertexBuffers(gl, 0.4, 0.4, 0.4, 0.7);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;
    }

    pushMatrix(modelMatrix);

    modelMatrix.setRotate(-90, 1, 0, 0);
    modelMatrix.translate(0, 0, -height);
    modelMatrix.scale(8, 12, height);

    draw_plane(n);

    modelMatrix = popMatrix();

}

function draw_window(x, y, z, width, height, alpha) {

    // Forms a window frame with transparent pane (alpha) - centre of pane at x, y, z
    // Total size - width+0.09 * height+0.09 * 0.1

    pushMatrix(modelMatrix);
    modelMatrix.translate(x,y,z);

    // Draw frame
    let n = initCubeVertexBuffers(gl, 0, 0, 0);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    for (let i=0; i<=1; i++){

        let sign = Math.pow(-1,i);
        // Top/bottom
        pushMatrix(modelMatrix);
        modelMatrix.translate(0,sign*height/2,0);
        modelMatrix.rotate(90,0,0,1);
        modelMatrix.scale(0.045,width+0.045,0.1);
        draw_cube(n, 1);
        modelMatrix = popMatrix();

        // Left/right
        pushMatrix(modelMatrix);
        modelMatrix.translate(sign*width/2,0,0);
        modelMatrix.scale(0.045,height+0.045,0.1);
        draw_cube(n, 1);
        modelMatrix = popMatrix();
    }

    // Draw glass - transparent
    n = initPlaneVertexBuffers(gl, 1, 1, 1, alpha);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    modelMatrix.scale(width, height, 1);
    draw_plane(n);

    modelMatrix = popMatrix();

}

function draw_nathaniel_window(x, y, z) {

    let width = 1.2;
    let lintel_height = 0.2;
    let height = 1.4;
    let depth = 0.1;
    let n = initCubeVertexBuffers(gl, 0.4, 0.4, 0.4);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    pushMatrix(modelMatrix);

    modelMatrix.translate(x, y, z);

    //bottom lintel

    pushMatrix(modelMatrix);

    modelMatrix.translate(width / 2, lintel_height / 2, depth / 2);
    modelMatrix.scale(width, lintel_height, 0.4);

    draw_cube(n, 4);

    modelMatrix = popMatrix();

    //top lintel

    pushMatrix(modelMatrix);

    modelMatrix.translate(width / 2, 1.5 * lintel_height + height, depth / 2);
    modelMatrix.scale(width, lintel_height, 0.4);

    draw_cube(n, 4);

    modelMatrix = popMatrix();

    //window
    draw_window(width / 2, lintel_height + height / 2, depth / 2, width, height, 0.25);

    modelMatrix = popMatrix();

}

function draw_front_window(x, y, z) {

    let middle_width = 1.2;
    let middle_height = 1.2;
    let top_height = 0.5;
    let slope_height = 1.2;
    let depth = 0.4;
    let side_size = Math.sqrt(Math.pow(depth, 2) + Math.pow(depth, 2));
    // let slope_length = Math.sqrt(Math.pow(1.6, 2) + Math.pow(side_size, 2));
    // let slope_angle = Math.atan(1.6 / 0.4);
    let bottom_height = 0.7;
    let n = initCubeVertexBuffers(gl, 0.4, 0.4, 0.4);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    pushMatrix(modelMatrix);

    modelMatrix.translate(x, y, z);

    // bottom
    {
        //bottom centre
        modelMatrix.translate(depth + middle_width / 2, bottom_height / 2, depth / 2);
        modelMatrix.scale(middle_width, bottom_height, 0.4);

        draw_cube(n, 0);

        modelMatrix = popMatrix();

        // bottom left
        pushMatrix(modelMatrix);

        modelMatrix.translate(depth / 2, bottom_height / 2, 2);
        modelMatrix.rotate(45, 0, 1, 0);
        modelMatrix.scale(side_size, bottom_height, side_size);

        draw_cube(n, 0);

        modelMatrix = popMatrix();

        //bottom right
        pushMatrix(modelMatrix);

        modelMatrix.translate(0.5 * depth + middle_width, bottom_height / 2, 2);
        modelMatrix.rotate(-45, 0, 1, 0);
        modelMatrix.scale(side_size, bottom_height, side_size);

        draw_cube(n, 0);

        modelMatrix = popMatrix();

    }

    //top
    {

        pushMatrix(modelMatrix);

        modelMatrix.translate(depth / 2 + middle_width / 2, bottom_height + middle_height + top_height / 2, 2 + depth / 2);
        modelMatrix.scale(middle_width, top_height, 0.4);

        draw_cube(n, 0);

        modelMatrix = popMatrix();

        // top left
        pushMatrix(modelMatrix);

        modelMatrix.translate(depth / 2, bottom_height + middle_height + top_height / 2, 2);
        modelMatrix.rotate(45, 0, 1, 0);
        modelMatrix.scale(side_size, top_height, side_size);

        draw_cube(n, 0);

        modelMatrix = popMatrix();

        //top right
        pushMatrix(modelMatrix);

        modelMatrix.translate(0.5 * depth + middle_width, bottom_height + middle_height + top_height / 2, 2);
        modelMatrix.rotate(-45, 0, 1, 0);
        modelMatrix.scale(side_size, top_height, side_size);

        draw_cube(n, 0);

        modelMatrix = popMatrix();

    }

    //roof
    {

        pushMatrix(modelMatrix);

        modelMatrix.translate(depth / 2 + middle_width / 2, bottom_height + middle_height + top_height + (slope_height - depth) / 2 + 0.03, 1.92);
        modelMatrix.rotate(-22, 1, 0, 0);
        modelMatrix.scale(middle_width, slope_height, side_size);

        draw_cube(n, 2);

        modelMatrix = popMatrix();

    }

    //window
    {
        //window centre
        draw_window(depth / 2 + middle_width / 2, middle_height / 2 + bottom_height, 2 + depth - 0.05, middle_width, middle_height, 0.4);

        pushMatrix(modelMatrix);

        // Window left
        n = initCubeVertexBuffers(gl, 0, 0, 0);
        if (n < 0) {
            console.log('Failed to set the vertex information');
            return;
        }

        modelMatrix.translate(0, middle_height / 2 + bottom_height, 2 + depth / 2 - 0.05);
        modelMatrix.rotate(-45, 0, 1, 0);

        for (let i = 0; i <= 1; i++){

            let sign = Math.pow(-1, i);
            // Top/bottom
            pushMatrix(modelMatrix);
            modelMatrix.translate(0,sign * middle_height/2,0);
            modelMatrix.rotate(90,0,0,1);
            modelMatrix.scale(0.045,side_size+0.045,0.1);
            draw_cube(n, 1);
            modelMatrix = popMatrix();

            // Left/right
            pushMatrix(modelMatrix);
            modelMatrix.translate(sign*side_size/2,0,0);
            modelMatrix.scale(0.045,middle_height+0.045,0.1);
            draw_cube(n, 1);
            modelMatrix = popMatrix();
        }

        // Draw glass - transparent
        n = initPlaneVertexBuffers(gl, 1, 1, 1, 0.4);
        if (n < 0) {
            console.log('Failed to set the vertex information');
            return;
        }

        modelMatrix.scale(side_size, middle_height, 1);
        draw_plane(n);

        modelMatrix = popMatrix();

        pushMatrix(modelMatrix);

        // Window right
        n = initCubeVertexBuffers(gl, 0, 0, 0);
        if (n < 0) {
            console.log('Failed to set the vertex information');
            return;
        }

        modelMatrix.translate(depth + middle_width, middle_height / 2 + bottom_height, 2 + depth / 2 - 0.05);
        modelMatrix.rotate(45, 0, 1, 0);

        for (let i = 0; i <= 1; i++){

            let sign = Math.pow(-1, i);
            // Top/bottom
            pushMatrix(modelMatrix);
            modelMatrix.translate(0,sign * middle_height/2,0);
            modelMatrix.rotate(90,0,0,1);
            modelMatrix.scale(0.045,side_size+0.045,0.1);
            draw_cube(n, 1);
            modelMatrix = popMatrix();

            // Left/right
            pushMatrix(modelMatrix);
            modelMatrix.translate(sign*side_size/2,0,0);
            modelMatrix.scale(0.045,middle_height+0.045,0.1);
            draw_cube(n, 1);
            modelMatrix = popMatrix();
        }

        // Draw glass - transparent
        n = initPlaneVertexBuffers(gl, 1, 1, 1, 0.4);
        if (n < 0) {
            console.log('Failed to set the vertex information');
            return;
        }

        modelMatrix.scale(side_size, middle_height, 1);
        draw_plane(n);

        modelMatrix = popMatrix();
    }

}

function draw_front_door(x, y, z) {

    // Forms a door with door frame - x, y, z at centre of door
    // Rotates around a hinge like a real door by angle open_by

    let frame_width = 0.03;
    let door_depth = 0.1;
    let width = 0.67;
    let height = 1.8;
    let window_height = 0.4;
    let lintel_width = 1.2;
    let step_height = 0.2;
    let step_depth = 0.3;

    pushMatrix(modelMatrix);

    modelMatrix.translate(x, y, z);

    let n = initCubeVertexBuffers(gl, 0.4, 0.4, 0.4);

    if (n < 0) {

        console.log('Failed to set the vertex information');
        return;

    }

    // step
    pushMatrix(modelMatrix);

    modelMatrix.translate(frame_width + width / 2, step_height / 2, step_depth / 2);
    modelMatrix.scale(width, step_height, step_depth);

    draw_cube(n, 4);

    modelMatrix = popMatrix();

    //bottom frame
    pushMatrix(modelMatrix);

    modelMatrix.translate(frame_width + width / 2, step_height + frame_width / 2, door_depth / 2);
    modelMatrix.scale(width, frame_width, door_depth);

    draw_cube(n, 1);

    modelMatrix = popMatrix();

    //middle frame
    pushMatrix(modelMatrix);

    modelMatrix.translate(frame_width + width / 2, step_height + 1.5 * frame_width + height, door_depth / 2);
    modelMatrix.scale(width, frame_width, door_depth);

    draw_cube(n, 1);

    modelMatrix = popMatrix();

    //top frame
    pushMatrix(modelMatrix);

    modelMatrix.translate(frame_width + width / 2, step_height + 2.5 * frame_width + height + window_height, door_depth / 2);
    modelMatrix.scale(width, frame_width, door_depth);

    draw_cube(n, 1);

    modelMatrix = popMatrix();

    // lintel
    pushMatrix(modelMatrix);

    modelMatrix.translate(frame_width + width / 2, step_height + 3 * frame_width + height + window_height + step_height / 2, door_depth / 2);
    modelMatrix.scale(lintel_width, step_height, door_depth);

    draw_cube(n, 4);

    modelMatrix = popMatrix();

    // sides
    for (let i = 0; i <= 1; i++) {

        // Left/right
        pushMatrix(modelMatrix);

        modelMatrix.translate(frame_width + (i * (width)), step_height + (height + 3 * frame_width + window_height) / 2, door_depth / 2);
        modelMatrix.scale(frame_width, height + 3 * frame_width + window_height, door_depth);

        draw_cube(n, 1);

        modelMatrix = popMatrix();

    }

    // Draw door
    n = initCubeVertexBuffers(gl, 182/255, 155/255, 76/255);

    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Make door flush with inside frame. Use double translate for easy hinge design
    // modelMatrix.translate(width / 2, 0, 0.05);
    // modelMatrix.rotate(0, 0, 1, 0); // 0 is shut, 100 fully open - looks better than a square 90
    modelMatrix.translate(frame_width + width / 2, step_height + frame_width + height / 2, door_depth / 2);
    modelMatrix.scale(width, height, 2 * frame_width);

    draw_cube(n, 3); // Door texture

    modelMatrix = popMatrix();

    //window
    // pushMatrix(modelMatrix);
    //
    // n = initPlaneVertexBuffers(gl, 1, 1, 1, 0.25);
    //
    // if (n < 0) {
    //
    //     console.log('Failed to set the vertex information');
    //     return;
    //
    // }
    //
    // // I'll be doing little better than guessing. I'll leave this for now, until I can figure out what the problem is.
    //
    // modelMatrix.translate(-2 * width, y + height / 2 + frame_width + window_height / 2, 2);
    // modelMatrix.scale(width, window_height, 1);
    // draw_plane(n);
    //
    // modelMatrix = popMatrix();

}

let then = 0;
let delta = 0;

// And we use delta frame-indep

function tick(now) {

    now *= 0.001;
    delta = now - then;
    then = now;

    handleContinuousKeys();
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw();
    draw_HUD();

    requestAnimationFrame(tick)

}

function createTexture(gl, name, id){

    function isPowerOf2(value) {

        return (value & (value - 1)) === 0;

    }

    let texture = gl.createTexture(); // Create texture

    if (!texture) {

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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {

            gl.generateMipmap(gl.TEXTURE_2D);

        } else {

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        }

        gl.clear(gl.COLOR_BUFFER_BIT); // Clear colour buffer

        INIT_TEXTURE_COUNT++; // Won't render until all textures loaded

    };

    image.src = name;

}

function initTextures() {

    // Setup texture mappings
    createTexture(gl, '../textures/bricks.jpg', gl.TEXTURE0);
    createTexture(gl, '../textures/white_wood.jpg', gl.TEXTURE1);
    createTexture(gl, '../textures/slate.jpg', gl.TEXTURE2);
    createTexture(gl, '../textures/door.png', gl.TEXTURE3);
    createTexture(gl, '../textures/concrete.jpg', gl.TEXTURE4);

    return true;

}

function draw_HUD() {

    let ctx = hud.getContext("2d");

    ctx.clearRect(0, 0, 500, 500); // Clear HUD <canvas> element

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Set white text
    ctx.fillText("x = " + g_atX.toFixed(2) + ", " + "y = " + g_atY.toFixed(2) + ", " + "z = " + g_atZ.toFixed(2), 5, 15);
    ctx.fillText('yaw = ' + yaw.toFixed(2) + ", " + "pitch = " + pitch.toFixed(2), 5, 30);
    ctx.fillText('Toggle textures = 1', 5, 45);
    ctx.fillText('Toggle streetlights = 2', 5, 60);

}

function draw_cube(n, texture) {

    // Texture must be an integer i such that gl.TEXTUREi is used

    if (texture != null && USE_TEXTURES) {

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

    if (texture != null) {

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
