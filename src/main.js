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
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

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
    let u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

    lighting(gl);
    perspective(gl, canvas);

    document.onkeydown = function(ev){ keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting); };

    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);

}

// But clearly, each thing is it's own `thing`.
// So J has drawBuilding and drawGround methods, passing in the same matrices: u_ModelMatrix, and u_NormalMatrix.
// All that changes is the initBoxVertexBuffers, I imagine.

function lighting(gl) {

    let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

    // Set the light direction (in the world coordinate)
    let lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();     // Normalize

    gl.uniform3fv(u_LightDirection, lightDirection.elements);

}

function perspective(gl, canvas) {

    let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

    viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);

    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

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
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}


function initVertexBuffers(gl, object) {

  // Write the vertex property to buffers (coordinates, colors and normals)
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

// Kieran has handily abstracted his, and essentially made his own library.

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

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);    // Number of vertices to draw, I do believe.
    // Each object should do this anyway, and I should have a single buffer, right?

  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, true); // Will apply lighting

  // Set the vertex coordinates and color (for the cube)
  const cube = createCube(1.0, 0);

  var n = initVertexBuffers(gl, cube);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
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
