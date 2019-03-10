const VSHADER_SOURCE = `

    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;
    
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjMatrix;
    
    uniform vec3 u_LightColor;
    uniform vec3 u_LightDirection;
    
    varying vec4 v_Color;
    
    uniform bool u_isLighting;
    
    void main() {
    
        gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        
        if (u_isLighting) {
        
            vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
            float nDotL = max(dot(normal, u_LightDirection), 0.0);
            
            vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
            v_Color = vec4(diffuse, a_Color.a);
            
        } else {
        
            v_Color = a_Color;
        }
        
    }
    
`;

// Gotta define those buffers somewhere!

// const attribs = {
//     a_Position: {buffer: buffers.position, numComponents: 3},
//     a_Color: {buffer: buffers.color, numComponents: 3},
//     a_Normal: {buffer: buffers.normal, numComponents: 3},
// };

// At init time, create all shaders, all programs, and look up locations.
// Create buffers and upload vertex data
// Create textures and upload texture data

// This dude advocates a BufferInfo object, but why would I have different bufferInfos?

// May as well make our house, right?
// Steps should be easy, right?
// And using this as basis, I should be able to make reality whatever I want.

const FSHADER_SOURCE = `

    #ifdef GL_ES
    
        precision mediump float;
        
    #endif
    
    varying vec4 v_Color;
    
    void main() {
    
        gl_FragColor = v_Color;
        
    }
`;

var modelMatrix = new Matrix4(); // The model matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

// Given a program, this generates stuff.
// This stupid-ass nigga has his shaders in index.html. This is too low-level, there's TOO much flexibility.
// For now: I'm just trying to draw multiple objects, yo!

function main() {

    const canvas = document.getElementById('webgl'); // Retrieve <canvas> element
    const gl = getWebGLContext(canvas); // Get the webGL context

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color
    gl.enable(gl.DEPTH_TEST); // Enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffer

    // Get the storage locations of uniform attributes
    let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    lighting(gl);
    perspective(gl, canvas);

    document.onkeydown = function(ev){ keydown(ev, gl, u_ModelMatrix, u_NormalMatrix); };

    draw(gl, u_ModelMatrix, u_NormalMatrix);

}

// But clearly, each thing is it's own `thing`.
// So J has drawBuilding and drawGround methods, passing in the same matrices: u_ModelMatrix, and u_NormalMatrix.
// All that changes is the initBoxVertexBuffers, I imagine.

// The eye point doesn't 'move'. Instead, the objects comprising the world move instead.
// Aha! The model matrix defines translation, rotation, and scaling operations.
// Does it follow that I need one for each object? Yes.

// Multiplying the view matrix by the model matrix is inefficient in the shader. The operation can be performed once
// and passed in, as it is the same for every vertex. And so we get the ModelViewMatrix!

function lighting(gl) {

    let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    let u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

    let lightDirection = new Vector3([0.5, 3.0, 4.0]);   // Set the light direction (in the world coordinate)
    lightDirection.normalize();     // Normalize

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    gl.uniform1i(u_isLighting, 1); // Will apply lighting

}

function perspective(gl, canvas) {

    let viewMatrix = new Matrix4(), projMatrix = new Matrix4();

    let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

    viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);    //eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);

    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

}

// Sophie's approach makes a LOT more sense. For now, at least. Let's go to a new branch

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix) {

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

    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix);
}

// It's a semantically incorrect division. And is it for each? Does each object have it's own matrices?
// Or do I just keep populating them? NO. They do have the same, because all are effected in the SAME WAY by camera
// and perspective changes. This may change with a more complicated implementation, though. #

// I'm getting to the point where I can have a list of objects to draw!
// Let's add a second cube and see what happens!

// This dude's drawScene is absolutely beautiful.

function initObjectVertexBuffers(gl, object) {

    if (!initArrayBuffer(gl, 'a_Position', object.vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', object.colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', object.normals, 3, gl.FLOAT)) return -1;

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

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    let structure = createCuboid(4, 2, 2, 1, 2, 1);

    // Okay. Now: I'm here again. I need to fill up this buffer.
    // Or am I back at my previous approach? If I keep ending up there, it must be correct...

    // let vertices = new Float32Array([   // Coordinates of Main Building
    //     1.0, 2.0, 1.0,  -1.0, 2.0, 1.0,  -1.0,-2.0, 1.0,   1.0,-2.0, 1.0, // v0-v1-v2-v3 front
    //     1.0, 2.0, 1.0,   1.0,-2.0, 1.0,   1.0,-2.0,-1.0,   1.0, 2.0,-1.0, // v0-v3-v4-v5 right
    //     1.0, 2.0, 1.0,   1.0, 2.0,-1.0,  -1.0, 2.0,-1.0,  -1.0, 2.0, 1.0, // v0-v5-v6-v1 up
    //     -1.0, 2.0, 1.0,  -1.0, 2.0,-1.0,  -1.0,-2.0,-1.0,  -1.0,-2.0, 1.0, // v1-v6-v7-v2 left
    //     -1.0,-2.0,-1.0,   1.0,-2.0,-1.0,   1.0,-2.0, 1.0,  -1.0,-2.0, 1.0, // v7-v4-v3-v2 down
    //     1.0,-2.0,-1.0,  -1.0,-2.0,-1.0,  -1.0, 2.0,-1.0,   1.0, 2.0,-1.0,  // v4-v7-v6-v5 back
    //
    //
    //     // Coordinates of Bottom Window
    //     0.5, 0.45, 1.0,  -0.5, 0.45, 1.0,  -0.5,-0.4, 1.0,   0.5,-0.4, 1.0, // v0-v1-v2-v3 front
    //     0.5, 0.45, 1.0,   0.5,-0.4, 1.0,   0.5,-0.4, 1.05,   0.5, 0.45, 1.05, // v0-v3-v4-v5 right
    //     0.5, 0.45, 1.0,   0.5, 0.45, 1.05,  -0.5, 0.45, 1.05,  -0.5, 0.45, 1.0, // v0-v5-v6-v1 up
    //     -0.5, 0.45, 1.0,  -0.5, 0.45, 1.05,  -0.5,-0.4, 1.05,  -0.5,-0.4, 1.0, // v1-v6-v7-v2 left
    //     -0.5,-0.4, 1.05,   0.5,-0.4, 1.05,   0.5,-0.4, 1.0,  -0.5,-0.4, 1.0, // v7-v4-v3-v2 down
    //     0.5,-0.4, 1.05,  -0.5,-0.4, 1.05,  -0.5, 0.45, 1.05,   0.5, 0.45, 1.05,  // v4-v7-v6-v5 back
    //
    //     // Coordinates of Top Window
    //     0.5, 1.65, 1.0,  -0.5, 1.65, 1.0,  -0.5, 0.8, 1.0,   0.5, 0.8, 1.0, // v0-v1-v2-v3 front
    //     0.5, 1.65, 1.0,   0.5, 0.8, 1.0,   0.5, 0.8, 1.05,   0.5, 1.65, 1.05, // v0-v3-v4-v5 right
    //     0.5, 1.65, 1.0,   0.5, 1.65, 1.05,  -0.5, 1.65, 1.05,  -0.5, 1.65, 1.0, // v0-v5-v6-v1 up
    //     -0.5, 1.65, 1.0,  -0.5, 1.65, 1.05,  -0.5, 0.8, 1.05,  -0.5, 0.8, 1.0, // v1-v6-v7-v2 left
    //     -0.5, 0.8, 1.05,   0.5, 0.8, 1.05,   0.5, 0.8, 1.0,  -0.5, 0.8, 1.0, // v7-v4-v3-v2 down
    //     0.5, 0.8, 1.05,  -0.5, 0.8, 1.05,  -0.5, 1.65, 1.05,   0.5, 1.65, 1.05,  // v4-v7-v6-v5 back
    //
    //     // But yeah: this will become intolerable. Far better to build a primitive library. Argh!
    //
    //     // Coordinates of Door
    //     -0.5,-0.80, 1.0,  -0.95, -0.80, 1.0,  -0.95,-2.0, 1.1,   -0.5,-2.0, 1.1, // v0-v1-v2-v3 front
    //     -0.5,-0.80, 1.0,   -0.5,-2.0, 1.0,   -0.5,-2.0, 1.05,   -0.5,-0.80, 1.05, // v0-v3-v4-v5 right
    //     -0.5,-0.80, 1.0,   -0.5,-0.80, 1.05,  -0.95,-0.80, 1.05,  -0.95, -0.80, 1.0, // v0-v5-v6-v1 up
    //     -0.95, -0.80, 1.0,  -0.95,-0.80, 1.05, -0.95,-2.0, 1.05,  -0.95,-2.0, 1.0, // v1-v6-v7-v2 left
    //     -0.95,-2.0, 1.05,   -0.5,-2.0, 1.05,   -0.5,-2.0, 1.0,  -0.95,-2.0, 1.0, // v7-v4-v3-v2 down
    //     -0.5,-2.0, 1.05,  -0.95,-2.0, 1.05,  -0.95,-0.80, 1.05,   -0.5,-0.80, 1.05  // v4-v7-v6-v5 back
    //
    // ]);
    //
    //
    // let colors = new Float32Array([    // Colors of Main Building
    //     0.65, 0.65, 0.65,   0.65, 0.65, 0.65,   0.65, 0.65, 0.65,  0.65, 0.65, 0.65,     // v0-v1-v2-v3 front
    //     0.65, 0.65, 0.65,   0.65, 0.65, 0.65,   0.65, 0.65, 0.65,  0.65, 0.65, 0.65,     // v0-v3-v4-v5 right
    //     0.65, 0.65, 0.65,   0.65, 0.65, 0.65,   0.65, 0.65, 0.65,  0.65, 0.65, 0.65,     // v0-v5-v6-v1 up
    //     0.65, 0.65, 0.65,   0.65, 0.65, 0.65,   0.65, 0.65, 0.65,  0.65, 0.65, 0.65,     // v1-v6-v7-v2 left
    //     0.65, 0.65, 0.65,   0.65, 0.65, 0.65,   0.65, 0.65, 0.65,  0.65, 0.65, 0.65,     // v7-v4-v3-v2 down
    //     0.65, 0.65, 0.65,   0.65, 0.65, 0.65,   0.65, 0.65, 0.65,  0.65, 0.65, 0.65,　    // v4-v7-v6-v5 back
    //
    //     //Bottom Window
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v0-v1-v2-v3 front
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v0-v3-v4-v5 right
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v0-v5-v6-v1 up
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v1-v6-v7-v2 left
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v7-v4-v3-v2 down
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,　    // v4-v7-v6-v5 back
    //
    //     //Top Window
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v0-v1-v2-v3 front
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v0-v3-v4-v5 right
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v0-v5-v6-v1 up
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v1-v6-v7-v2 left
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,     // v7-v4-v3-v2 down
    //     0.9, 0.97, 1.0,   0.9, 0.97, 1.0,   0.9, 0.97, 1.0,  0.9, 0.97, 1.0,　    // v4-v7-v6-v5 back
    //
    //     //Door
    //     0.7, 0.35, 0.0,   0.7, 0.35, 0.0,   0.7, 0.35, 0.0,  0.7, 0.35, 0.0,     // v0-v1-v2-v3 front
    //     0.7, 0.35, 0.0,   0.7, 0.35, 0.0,   0.7, 0.35, 0.0,  0.7, 0.35, 0.0,     // v0-v3-v4-v5 right
    //     0.7, 0.35, 0.0,   0.7, 0.35, 0.0,   0.7, 0.35, 0.0,  0.7, 0.35, 0.0,     // v0-v5-v6-v1 up
    //     0.7, 0.35, 0.0,   0.7, 0.35, 0.0,   0.7, 0.35, 0.0,  0.7, 0.35, 0.0,     // v1-v6-v7-v2 left
    //     0.7, 0.35, 0.0,   0.7, 0.35, 0.0,   0.7, 0.35, 0.0,  0.7, 0.35, 0.0,     // v7-v4-v3-v2 down
    //     0.7, 0.35, 0.0,   0.7, 0.35, 0.0,   0.7, 0.35, 0.0,  0.7, 0.35, 0.0　    // v4-v7-v6-v5 back
    // ]);
    //
    //
    // let normals = new Float32Array([    // Normal
    //     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    //     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    //     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    //     -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    //     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    //     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   // v4-v7-v6-v5 back
    //
    //     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    //     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    //     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    //     -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    //     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    //     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   // v4-v7-v6-v5 back
    //
    //     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    //     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    //     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    //     -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    //     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    //     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   // v4-v7-v6-v5 back
    //
    //     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    //     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    //     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    //     -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    //     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    //     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    // ]);
    //
    //
    // // Indices of the vertices
    // let indices = new Uint8Array([
    //     0, 1, 2,   0, 2, 3,    // front
    //     4, 5, 6,   4, 6, 7,    // right
    //     8, 9,10,   8,10,11,    // up
    //     12,13,14,  12,14,15,    // left
    //     16,17,18,  16,18,19,    // down
    //     20,21,22,  20,22,23,    // back
    //
    //     24, 25, 26,   24, 26, 27,    // front
    //     28, 29, 30,   28, 30, 31,    // right
    //     32, 33, 34,   32, 34, 35,    // up
    //     36, 37, 38,   36, 38, 39,    // left
    //     40, 41, 42,   40, 42, 43,    // down
    //     44, 45, 46,   44, 46, 47,    // back
    //
    //     48, 49, 50,   48, 50, 51,    // front
    //     52, 53, 54,   52, 54, 55,    // right
    //     56, 57, 58,   56, 58, 59,    // up
    //     60, 61, 62,   60, 62, 63,    // left
    //     64, 65, 66,   64, 66, 67,    // down
    //     68, 69, 70,   68, 70, 71,    // back
    //
    //     72, 73, 74,   72, 74, 75,    // front
    //     76, 77, 78,   76, 78, 79,    // right
    //     80, 81, 82,   80, 82, 83,    // up
    //     84, 85, 86,   84, 86, 87,    // left
    //     88, 89, 90,   88, 90, 91,    // down
    //     92, 93, 94,   92, 94, 95,    // back
    //
    // ]);


    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', structure.vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', structure.colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', structure.normals, 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    let indexBuffer = gl.createBuffer();

    if (!indexBuffer) {

        console.log('Failed to create the buffer object');
        return false;

    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, structure.indices, gl.STATIC_DRAW);

    return structure.indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;

}

// There will be a lot of repetition.
// It'll really be collections of objects... but not that much. Charlie is right: this is going to take a while.

let objects = {
    structure: createCuboid(4, 2, 2, 1, 2, 1),
    frontDoor: createCuboid(1.2, 0.6, 0.005, -0.3, -0.7, 1.005),
    frontStep: createCuboid(0.2, 0.6, 0.2, -0.3, -1.8, 1.205)
};

// Front window will be hard... Draw triangle, I guess.

//
// let structure = createCuboid(4, 2, 2, 1, 2, 1);
// let door = createCuboid(1.2, 0.6, 0.005, -0.3, -0.7, 1.005);

function draw(gl, u_ModelMatrix, u_NormalMatrix) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer

    // If these are all the same object, can I do the same stuff to them?

    for (let key in objects) {

        let object = objects[key];
        let n = initObjectVertexBuffers(gl, object);

        modelMatrix.setTranslate(0, 0, 0);
        modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
        modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
        modelMatrix.scale(1.5, 1.5, 1.5); // Scale

        // Pass the model matrix to the uniform variable
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        // Calculate the normal transformation matrix and pass it to u_NormalMatrix
        g_normalMatrix.setInverseOf(modelMatrix);
        g_normalMatrix.transpose();

        gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

        // Draw the cube
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    }

    //
    //
    // {
    //
    //     let n = initObjectVertexBuffers(gl, structure);
    //
    //     modelMatrix.setTranslate(0, 0, 0);
    //     modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    //     modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    //     modelMatrix.scale(1.5, 1.5, 1.5); // Scale
    //
    //     // Pass the model matrix to the uniform variable
    //     gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //
    //     // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    //     g_normalMatrix.setInverseOf(modelMatrix);
    //     g_normalMatrix.transpose();
    //
    //     gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    //
    //     // Draw the cube
    //     gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    //
    // }
    //
    // {
    //
    //     let n = initObjectVertexBuffers(gl, door);
    //
    //     modelMatrix.setTranslate(0, 0, 0);
    //     modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    //     modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
    //     modelMatrix.scale(1.5, 1.5, 1.5); // Scale
    //
    //     // Pass the model matrix to the uniform variable
    //     gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //
    //     // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    //     g_normalMatrix.setInverseOf(modelMatrix);
    //     g_normalMatrix.transpose();
    //
    //     gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    //
    //     // Draw the cube
    //     gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    //
    // }


}
