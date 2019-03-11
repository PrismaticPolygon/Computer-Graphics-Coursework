const VSHADER_SOURCE = `

    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;
    
    attribute vec2 a_TexCoords;
    
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjMatrix;
    
    varying vec4 v_Color;
    
    varying vec3 v_Normal;
    varying vec3 v_Position;
    
    varying vec2 v_TexCoords;
    
    void main() {
    
        gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
       
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_Color = a_Color;
        v_TexCoords = a_TexCoords;
        
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
// Lots of crap here.

const FSHADER_SOURCE = `

    #ifdef GL_ES
    
        precision mediump float;
        
    #endif
    
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    varying vec2 v_TexCoords;
    
    uniform bool u_UseTextures;
    uniform vec3 u_LightColor;
    uniform vec3 u_LightPosition;
    uniform vec3 u_AmbientLight;
    uniform sampler2D u_Sampler; 
    
    void main() {
    
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse;
    
        if (u_UseTextures) {
        
            vec4 TexColor = texture2D(u_Sampler, v_TexCoords);
            diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;
        
        } else {
       
            diffuse = u_LightColor * v_Color.rgb * nDotL;
        
        } 
    
        vec3 ambient = u_AmbientLight * v_Color.rgb;
        gl_FragColor = vec4(diffuse + ambient, v_Color.a);
        
    }
`;

// It's texture or nothing now, unless I come up with two different shaders.

var modelMatrix = new Matrix4(); // The model matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

// Given a program, this generates stuff.
// This stupid-ass nigga has his shaders in index.html. This is too low-level, there's TOO much flexibility.
// For now: I'm just trying to draw multiple objects, yo!

let texture;

function main() {

    const canvas = document.getElementById('webgl'); // Retrieve <canvas> element
    const gl = getWebGLContext(canvas); // Get the webGL context

    texture = loadTexture(gl, brick);

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Set clear color
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
    // let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');

    let lightDirection = new Vector3([0.5, 3.0, 4.0]);   // Set the light direction (in the world coordinate)
    lightDirection.normalize();     // Normalize

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    // gl.uniform3fv(u_LightDirection, lightDirection.elements);

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

// It'll be off-centre when I translate it!
// So Blender could output the model. So, what's then the hard part? I don't have the time to
// invest looking into that.
const WHITE = [1.0, 1.0, 1.0];
const RED = [1.0, 0.0, 0.0];


let objects = {

    structure: createCuboid(4, 6, 4, -2, -3, -2),

    frontDoorFrame: createCuboid(0.8, 2.55, 0.001, -1.8, -3, 2, WHITE),
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

    nathanielWindowFrame: createCuboid(1.2, 1.6, 0.005, -0.1, 1.1, 2, WHITE),
    nathanielWindowTop: createCuboid(1.2, 0.3, 0.1, -0.1, 2.65, 2, WHITE),
    nathanielWindow: createCuboid(1.1, 1.4, 0.005, -0.05, 1.2, 2),
    nathanielWindowBottom: createCuboid(1.2, 0.3, 0.1, -0.1, 0.8, 2, WHITE),

};

function draw(gl, u_ModelMatrix, u_NormalMatrix) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer
    gl.enable(gl.DEPTH_TEST);   // Enable depth testing
    gl.depthFunc(gl.LEQUAL);    // Near things obscure far things

    for (let key in objects) {

        let object = objects[key];
        let n = initObjectVertexBuffers(gl, object);

        modelMatrix.setTranslate(0, 0, 0);
        modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
        modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
        modelMatrix.scale(0.9, 0.9, 0.9); // Scale

        // Pass the model matrix to the uniform variable
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        // Calculate the normal transformation matrix and pass it to u_NormalMatrix
        g_normalMatrix.setInverseOf(modelMatrix);
        g_normalMatrix.transpose();

        gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        let uSampler = gl.getUniformLocation(gl.program, 'u_Sampler');

        gl.uniform1i(uSampler, 0);

        // Draw the cube
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    }

}
