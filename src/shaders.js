const VSHADER_SOURCE = `

    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;
    
    attribute vec2 a_TexCoords;
    
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_ModelMatrix;
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

const FSHADER_SOURCE = `

    precision mediump float;
    
    uniform bool u_UseTextures;
    uniform vec3 u_LightColor;
    uniform vec3 u_LightPosition;
    uniform vec3 u_AmbientLight;
    uniform sampler2D u_Sampler; 
    
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    varying vec2 v_TexCoords;
    
    void main() {
    
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse;
        vec3 ambient;
    
        if (u_UseTextures) {
        
            vec4 TexColor = texture2D(u_Sampler, v_TexCoords);
            diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;
            ambient = u_AmbientLight * TexColor.rgb * nDotL * 1.2;
        
        } else {
       
            diffuse = u_LightColor * v_Color.rgb * nDotL;
            ambient = u_AmbientLight * v_Color.rgb;
        
        } 
    
        gl_FragColor = vec4(diffuse + ambient, v_Color.a);
        
    }
`;