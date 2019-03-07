import { mat4 } from "../lib/gl-matrix"
import { createProgram, loadTexture, getWebGLContent } from "../lib/utils";

let cubeRotation = 0.0;

const vsSource = `

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

const fsSource = `

    #ifdef GL_ES
    
        precision mediump float;
        
    #endif
    
    varying vec4 v_Color;
    
    void main() {
    
        gl_FragColor = v_Color;
        
    }
`;

function initBuffers(gl) {

  const positionBuffer = gl.createBuffer(); // Create a buffer for the square's position

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // Select the positionBuffer as the one to apply operations to.

    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

  // Pass the list of positions into WebGL as a Float32Array
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    const textureCoordinates = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer
  };

}

function drawScene(gl, programInfo, buffers, texture, deltaTime) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL);  // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear the canvas

    // Create a perspective matrix, used to simulate the distortion of perspective
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 1, 0]);

    {

        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );

        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    }

    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.textureCoord);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );

    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }


    cubeRotation += deltaTime;

}

function lighting(gl, u_LightColor, u_LightDirection) {

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

    const lightDirection = new Vector3([0.5, 3.0, 4.0]);

    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

}

function perspective(g1, canvas, uViewMatrix, uProjectionMatrix) {

    viewMatrix = mat4

    viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);

}

function main() {

  const canvas = document.getElementById('webgl');  // Canvas element
  const gl = getWebGLContent(canvas); // WebGL context

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  const shaderProgram = createProgram(gl, vsSource, fsSource);

  const programInfo = {
      program: shaderProgram,
      attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, 'a_Position'),
          colorPosition: gl.getAttribLocation(shaderProgram, 'a_Color'),
          normalPosition: gl.getAttribLocation(shaderProgram, 'a_Normal')
      },
      uniformLocations: {
          modelMatrix: gl.getUniformLocation(shaderProgram, 'u_ModelMatrix'),
          normalMatrix: gl.getUniformLocation(shaderProgram, 'u_NormalMatrix'),
          viewMatrix: gl.getUniformLocation(shaderProgram, 'u_ViewMatrix'),
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_ProjMatrix'),
          lightColor: gl.getUniformLocation(shaderProgram, 'u_LightColor'),
          lightDirection: gl.getUniformLocation(shaderProgram, 'u_LightDirection'),
          isLighting: gl.getUniformLocation(shaderProgram, 'u_isLighting')
      }

  };

  // Ah, then we draw using the program info, I'm guessing? Yes indeed
    // Argh! There's so much going on!

  const buffers = initBuffers(gl);
  const texture = loadTexture(gl, 'http://localhost:8000/texture.jpg');

  let then = 0;

  function render(now) {

      now *= 0.001;
      const deltaTime = now - then;
      then = now;

      drawScene(gl, programInfo, buffers, texture, deltaTime);

      requestAnimationFrame(render);

  }

  requestAnimationFrame(render);

}

main();