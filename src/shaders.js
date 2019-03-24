const VSHADER_SOURCE = `

    precision mediump float;

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
    uniform vec3 u_LightColor[4];
    uniform vec3 u_LightPosition[4];
    uniform vec3 u_AmbientLight;
    uniform sampler2D u_Sampler; 
    
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    varying vec2 v_TexCoords;
    
    void main() {
    
        vec4 col = u_UseTextures ? texture2D(u_Sampler, v_TexCoords) : v_Color; 
        vec3 normal = normalize(v_Normal);
        vec3 finalColor = u_AmbientLight * col.rgb; // Initialise final colour
        
        vec3 diffuse;
        float attenuation;
        
        for (int i = 0; i < 3; i++) {
        
            vec3 lightDirection = normalize(u_LightPosition[i] - v_Position);
            float nDotL = max(dot(lightDirection, normal), 0.0);
            diffuse = u_LightColor[i] * col.rgb * nDotL;
            
            float distanceToLight = length(u_LightPosition[i] - v_Position);
            
            attenuation = 1.0 / (1.0 + 0.035 * pow(distanceToLight, 2.0));
        
            finalColor += attenuation * diffuse;

        }
    
        gl_FragColor = vec4(finalColor, col.a);
        
    }
`;