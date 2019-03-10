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

function drawScene(time) {

    time = time * 0.0001 + 5;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Tell WebGL how to convert from clip space to pixels
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the canvas and the depth buffer.

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let projectionMatrix = new Matrix4();

    projectionMatrix.setPerspective(30, aspect, 1, 100);

    let cameraMatrix = new Matrix4();
    cameraMatrix.lookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);

    let viewMatrix = cameraMatrix.invert();
    let viewProjectionMatrix = projectionMatrix.multiply(viewMatrix);

    // He's abstracted it so cleverly I can't even see the interactions with webGL.

    // It's all just slightly different enough that I'm not QUITE sure.



    // Then I just call draw with a bunch of objects, right?

    // He has a bunch of utils, however. I'll steal them

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

function initVertexBuffers(gl, object) {

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', object.vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', object.colors, 3, gl.FLOAT)) return -1;

  if (object.normals) {

      if (!initArrayBuffer(gl, 'a_Normal', object.normals, 3, gl.FLOAT)) return -1;

  }

  // Cause no normals, I guess.

  // Write the indices to the buffer object
  let indexBuffer = gl.createBuffer();

  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, object.indices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); //Unbind the buffer

  return object.indices.length;
}

function draw(gl, u_ModelMatrix, u_NormalMatrix) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer

    {

        const axes = createAxes();

        let n = initVertexBuffers(gl, axes);

        if (n > 0) {

            modelMatrix.setTranslate(0, 0, 0);
            gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
            gl.drawArrays(gl.LINES, 0, n);

        } else {

            console.log("Error creating axes object");

        }

    }

    {

        const cube = createCube(1.0, 0);
        let n = initVertexBuffers(gl, cube);

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


  // The axes are rotating as welL!
    // SO. For each we're going to load up our buffers, then draw the object.
    // Then, we're going to apply the relate transformations.

  // Naturally, it does. Shouldn't be a hard fix though... Though I suspect that initVertexBuffers will get confused.
    // for now, let's iterate.

    // And obviously this matrix doesn't translate it. Though, then again, it shouldn't have.

  //
    // We're running into buffer issues. Perhaps initVertexBuffer overwrites the current buffer?
    // Nigga has a single vertex array for his triangles which, to be fair, makes sense.

    // But wait... Freddie had too different objects, the axes and the square. Let's attempt to split THOSE into different files.
    // And this is called everytime that we have a key-down event, right?
    // I could, and probably should, just do what J has done, and in this loop
    // call various draw methods, passing in the relevant parameters.


}
