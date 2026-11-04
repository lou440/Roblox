/* The existing authored WebGL shaders, moved out of game.js. */
(function(root){root.DemoShaders=function(derivatives,highp=true){
    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec2 aUV;
      uniform mat4 uViewProjection;
      uniform vec3 uScale;
      uniform mat4 uModel;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec2 vUV;
      void main() {
        vUV = aUV;
        vec3 q = aPosition * uScale;
        vWorld = (uModel * vec4(q, 1.0)).xyz;
        vNormal = normalize(mat3(uModel) * aNormal);
        gl_Position = uViewProjection * vec4(vWorld, 1.0);
      }`;
    const fragmentSource = (derivatives ? '#extension GL_OES_standard_derivatives : enable\n' : '') + `
      precision ${highp ? 'highp' : 'mediump'} float;
      uniform vec4 uColor;
      uniform float uFloor;
      uniform float uAvatarOpacity;
      uniform vec3 uCamera;
      uniform sampler2D uFace;
      uniform sampler2D uStud;
      uniform float uUseFace;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec2 vUV;
      ${window.Atmosphere.glsl}
      void main() {
        vec3 n = normalize(vNormal);
        vec4 face = texture2D(uFace,vUV);
        vec3 color = mix(uColor.rgb,face.rgb,face.a*uUseFace);
        if (uFloor > 0.5 && n.y > 0.5) {
          float footprint = ${derivatives ? 'max(fwidth(vWorld.x), fwidth(vWorld.z))' : '0.10'};
          float detail = 1.0 - smoothstep(0.12, 1.05, footprint);
          // The grayscale tile is decoded from the owner's 1145 studs.dds.
          // One world unit per tile and browser lighting are adapter choices.
          vec3 studs = texture2D(uStud, vWorld.xz).rgb * 2.0;
          color *= mix(vec3(1.0), studs, detail);
        }
        color=atmosphere(color,n,vWorld,uCamera);
        float alpha=uColor.a*uAvatarOpacity;if(alpha<.002)discard;gl_FragColor=vec4(color,alpha);
      }`;

 return {vertexSource,fragmentSource};
};})(globalThis);
