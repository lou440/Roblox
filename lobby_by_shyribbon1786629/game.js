/* Browser approximation. */
(async () => {
  try { await window.MapSelection?.ready; } catch { return; }
  // The graphics watchdog starts once map data is in, so downloads are not counted as a graphics stall.
  window.JoiningScreen?.graphicsStart?.();
  const swordMap=!!window.MapSelection?.isImported,spawn=window.MapSelection?.spawn||{x:0,y:0,z:0,yaw:0};
  'use strict';
  const canvas = document.getElementById('game');
  const errorBox = document.getElementById('error');
  const overhead=document.getElementById('rbx-dummy-overhead'), overheadHealth=document.getElementById('rbx-dummy-health'), overheadFill=document.getElementById('rbx-dummy-health-fill'),chatBubble=document.getElementById('rbx-local-chat-bubble');
  const showError = (message) => { errorBox.hidden = false; errorBox.textContent = message; };
  // Phones skip MSAA: its per-frame resolve is a large GPU cost on iOS and the touch canvas is already low-res.
  const webglOptions = {alpha: true, antialias: true, depth: true};
  const createGl = options => { for (const type of ['webgl', 'experimental-webgl']) { const context = canvas.getContext(type, options); if (context) return context; } return null; };
  // Some GPUs and drivers refuse the multisampled buffer; retry once without it before giving up.
  const gl = createGl(webglOptions) || createGl({...webglOptions, antialias: false});
  // Track the bound program here: getParameter(CURRENT_PROGRAM) is a synchronous GPU sync point on iOS, and the effect renderers call it every frame.
  if (gl) {
    const realUseProgram = gl.useProgram.bind(gl), realGetParameter = gl.getParameter.bind(gl);
    let boundProgram = null;
    gl.useProgram = p => { boundProgram = p; realUseProgram(p); };
    gl.getParameter = pname => pname === gl.CURRENT_PROGRAM ? boundProgram : realGetParameter(pname);
  }
  // A lost WebGL context cannot be rebuilt here; reload instead of leaving a dead black canvas.
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); location.reload(); });
  if (!gl) { window.JoiningScreen?.fail('This browser could not start WebGL. Enable hardware acceleration and refresh.');showError('This browser could not start WebGL. Enable hardware acceleration, or open this file in a recent Chrome, Edge, or Firefox.'); return; }
  try {
    const Block=window.WasmBlockGeometry, BlockFaceQuery=window.WasmBlockFaceQuery, PartView=window.WasmBasePartMemoryView;
    const SpawnState=window.WasmSpawnLocationState, AssetFS=window.WasmAssetFS;
    const Chain=window.WasmPrimitiveChain, Material=window.WasmMaterialProperties;
    const DetachedUpdate=window.WasmDetachedBlockUpdate;
    const MainQueue=window.WasmMainEventQueue, Keyboard=window.WasmKeyboardCode, KeyboardInput=window.WasmKeyboardInput;
    const InputVector=window.WasmInputEventVector, InputDispatch=window.WasmInputDispatch, KeyboardModifiers=window.WasmKeyboardModifierState;
    const WorldSteps=window.WasmWorldStepAccumulator, InputObjectTail=window.WasmInputObjectUpdateTail;
    const TargetHead=window.TargetHeadMesh, R6Parts=window.ArchivedR6Parts;
    const LinkedHead=window.LinkedR6HeadMesh, R6Face=window.ArchivedR6Face;
    const R6Animation=window.ArchivedR6Animation, R6AnimationData=window.ArchivedR6AnimationData;
    const StudTexture=window.RobloxStudTexture, CursorData=window.RobloxSwordCursors, ClassicCamera=window.RobloxClassicCameraAdapter;
    const RunningHeight=window.RunningHeightAdapter, SwordMesh=window.LinkedSwordMesh, SwordData=window.LinkedSwordData, R6Death=window.R6Death;
    const AirClips=window.ArchivedR6AirAnimationData, ActionClips=window.ArchivedR6ActionAnimationData;
    const SwordScript=window.LinkedSwordScript, SwordAudio=window.LinkedSwordAudio, SwordHit=window.LinkedSwordHit, DemoTarget=window.DemoTarget, Obstacles=window.DemoObstacles, Tools=window.ClassicToolsSim, TrowelData=window.ClassicTrowelData, RocketData=window.ClassicRocketData;
    if(!Block || !BlockFaceQuery || !PartView || !SpawnState || !AssetFS || !Chain || !Material || !DetachedUpdate || !MainQueue || !Keyboard || !KeyboardInput || !InputVector || !InputDispatch || !KeyboardModifiers || !WorldSteps || !InputObjectTail || !TargetHead || !R6Parts || !LinkedHead || !R6Face || !R6Animation || !R6AnimationData || !RunningHeight || !SwordMesh || !SwordData || !AirClips || !ActionClips || !SwordScript || !SwordAudio || !SwordHit || !DemoTarget || !Obstacles || !StudTexture || !CursorData || !ClassicCamera || !Tools || !TrowelData || !RocketData || !R6Death) throw new Error('A local research module did not load.');
    Object.assign(R6AnimationData.clips,AirClips,ActionClips,{carpetsit:window.RainbowCarpetSit,climb:window.R6ClimbData});
    const scenePath='/offline/baseplate.json';
    const authoredScene={baseplate:{size:[512,0.5,512],center:[0,-0.25,0],material:256}};
    const sceneBytes=new TextEncoder().encode(JSON.stringify(authoredScene));
    const assetFS=new AssetFS();
    if(assetFS.registerAsset(scenePath,sceneBytes.length)!==0 || assetFS.addFile(scenePath,sceneBytes)!==0)
    throw new Error('Could not stage the local demo scene.');
    const inline=assetFS.snapshot().inline[0];
    const scene=JSON.parse(new TextDecoder().decode(Uint8Array.from(inline.data)));
    const partBuffer=new ArrayBuffer(8192), partBytes=new DataView(partBuffer);
    const partAddress=64, primitiveAddress=512, geometryAddress=2048, customRecordAddress=4096;
    partBytes.setUint32(partAddress+260,primitiveAddress,true);
    partBytes.setUint32(primitiveAddress+396,geometryAddress,true);
    partBytes.setUint32(geometryAddress,8074444,true);
    partBytes.setUint8(primitiveAddress+338,56); // primitive constructor's initial flag byte
    partBytes.setUint8(primitiveAddress+339,2);  // primitive constructor's Block kind
    partBytes.setUint32(primitiveAddress+416,customRecordAddress,true); // demo's empty custom-property record
    partBytes.setUint16(primitiveAddress+430,scene.baseplate.material,true);
    const plate=new PartView(partBuffer,partAddress);
    const sizeHooks=Block.detachedSizeHooks(partBuffer,{
    call114418(p){
      const pointer=partBytes.getUint32(p+40,true), child=pointer?(pointer-8)>>>0:0;
      if(child)throw new Error('This demo cannot update a linked primitive.');
    },
    call114374(p){
      DetachedUpdate.apply(partBuffer,p,{
        lockHandle:0, mutex:value=>value,
        alloc(){throw new Error('This demo does not allocate connected node state.');},
        free(){throw new Error('This demo does not own connected node state.');}
      });
    }
    });
    plate.setPrimitiveSizeDetached(scene.baseplate.size,0,sizeHooks);
    const plateSize=plate.size;
    const runningHeight=RunningHeight.create(R6Parts.parts);
    const standingRootOffset=runningHeight.target(0,0);
    const demoPlateTop=scene.baseplate.center[1]+plateSize[1]/2;
    const runningFloorTarget=runningHeight.target(demoPlateTop,0);
    const shapeSize=[0,1,2].map(i=>partBytes.getFloat32(geometryAddress+4*i+4,true));
    const plateHalfBounds=Block.rotatedHalfExtents(shapeSize,[1,0,0,0,1,0,0,0,1]);
    const spawnProperties=new SpawnState();
    const defaults=spawnProperties.snapshot();

    const derivatives = !!gl.getExtension('OES_standard_derivatives');
    // Some phones and older GPUs have no highp fragment precision; fall back to mediump instead of failing to compile.
    const highpFragment = !!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision;
    const {vertexSource,fragmentSource}=window.DemoShaders(derivatives, highpFragment);
    function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    return shader;
    }
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader linking failed');
    gl.useProgram(program);
    const loc = {};
    for (const n of ['uViewProjection', 'uScale', 'uModel', 'uColor', 'uFloor', 'uCamera', 'uFace', 'uStud', 'uUseFace', 'uAvatarOpacity']) loc[n] = gl.getUniformLocation(program, n);
    const pos = gl.getAttribLocation(program, 'aPosition'), normal = gl.getAttribLocation(program, 'aNormal'), uv = gl.getAttribLocation(program, 'aUV');
    gl.enableVertexAttribArray(pos); gl.enableVertexAttribArray(normal);
    const vertices = [];
    function face(n, a, b, c, d) {
    for (const point of [a,b,c,a,c,d]) vertices.push(...point, ...n);
    }
    for(let side=0;side<Block.faceCount;side++){
    const corners=Block.faceVertices([1,1,1],side), n=Block.facePlane([1,1,1],side).slice(0,3);
    face(n,...corners);
    }
    const cube = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cube); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    // Classic default R6 boxes: 0.06-stud chamfer, visual geometry only.
    // Separate world-space geometries keep the same bevel on 1- and 2-stud parts.
    const noobBevelCache=new Map();
    function noobBevelGeometry(size){
      const key=size.join(',');if(noobBevelCache.has(key))return noobBevelCache.get(key);
      const h=size.map(v=>v/2),rad=Math.min(.06,...h),v=[];
      const tri=(a,b,c,n)=>{const u=b.map((x,i)=>x-a[i]),w=c.map((x,i)=>x-a[i]),cross=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];if(cross.reduce((z,x,i)=>z+x*n[i],0)<0)[b,c]=[c,b];for(const p of [a,b,c])v.push(...p,...n)};
      const quad=(a,b,c,d,n)=>{tri(a,b,c,n);tri(a,c,d,n)};
      for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const j=(axis+1)%3,k=(axis+2)%3,n=[0,0,0];n[axis]=sign;const q=[];for(const [sj,sk] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const p=[0,0,0];p[axis]=sign*h[axis];p[j]=sj*(h[j]-rad);p[k]=sk*(h[k]-rad);q.push(p)}quad(...q,n)}
      for(let axis=0;axis<3;axis++){const j=(axis+1)%3,k=(axis+2)%3;for(const sj of [-1,1])for(const sk of [-1,1]){const n=[0,0,0];n[j]=sj/Math.SQRT2;n[k]=sk/Math.SQRT2;const q=[];for(const [sa,t] of [[-1,0],[1,0],[1,1],[-1,1]]){const p=[0,0,0];p[axis]=sa*(h[axis]-rad);p[j]=sj*(h[j]-(t?rad:0));p[k]=sk*(h[k]-(t?0:rad));q.push(p)}quad(...q,n)}}
      for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const sign=[sx,sy,sz],n=sign.map(x=>x/Math.sqrt(3)),pts=[];for(let axis=0;axis<3;axis++)pts.push(sign.map((x,i)=>x*(h[i]-(i===axis?0:rad))));tri(...pts,n)}
      const handle=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,handle);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);const result={handle,count:v.length/6};noobBevelCache.set(key,result);return result;
    }
    const targetHeadGeometry=TargetHead.geometry(),headGeometry=LinkedHead.geometry();
    const headBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,headBuffer); gl.bufferData(gl.ARRAY_BUFFER,headGeometry.vertices,gl.STATIC_DRAW);
    const headUVs=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,headUVs); gl.bufferData(gl.ARRAY_BUFFER,headGeometry.uvs,gl.STATIC_DRAW);
    const headIndices=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,headIndices); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,headGeometry.indices,gl.STATIC_DRAW);
    const faceTexture=gl.createTexture();let faceLoaded=false;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,faceTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const faceImage=new Image();faceImage.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,faceTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,faceImage);faceLoaded=true};
    window.JoiningScreen?.trackImage('Face texture',faceImage);faceImage.src=R6Face.dataUri;gl.uniform1i(loc.uFace,0);
    const studTexture=gl.createTexture();let studTextureLoaded=false;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,studTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,128,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const studImage=new Image();studImage.onload=()=>{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,studTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,studImage);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);studTextureLoaded=true;gl.activeTexture(gl.TEXTURE0)};window.JoiningScreen?.trackImage('Stud texture',studImage);studImage.src=StudTexture.dataUri;gl.uniform1i(loc.uStud,1);gl.activeTexture(gl.TEXTURE0);
    const swordGeometry=SwordMesh.geometry(),swordBuffer=gl.createBuffer(),swordUVs=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,swordBuffer);gl.bufferData(gl.ARRAY_BUFFER,swordGeometry.vertices,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,swordUVs);gl.bufferData(gl.ARRAY_BUFFER,swordGeometry.uvs,gl.STATIC_DRAW);
    const swordTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,swordTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    let swordTextureLoaded=false;const swordImage=new Image();swordImage.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,swordTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,swordImage);swordTextureLoaded=true};window.JoiningScreen?.trackImage('Sword texture',swordImage);swordImage.src=SwordData.textureData;
    function loadClassicTool(data,uri){const geometry=data.geometry(),vertices=gl.createBuffer(),uvs=gl.createBuffer(),texture=gl.createTexture();gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,geometry.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,uvs);gl.bufferData(gl.ARRAY_BUFFER,geometry.uvs,gl.STATIC_DRAW);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);const result={geometry,vertices,uvs,texture,loaded:false},img=new Image();img.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);result.loaded=true};window.JoiningScreen?.trackImage('Tool texture',img);img.src=uri;return result}
    const extraGeometry={trowel:loadClassicTool(TrowelData,TrowelData.textureData),rocket:loadClassicTool(RocketData,RocketData.textureData()),pistol:loadClassicTool(window.General45Data,window.General45Data.textureData()),bloxycola:loadClassicTool(window.BloxyColaData,window.BloxyColaData.textureData),...(window.SubspaceTripmineData?{subspace:loadClassicTool(window.SubspaceTripmineData,window.SubspaceTripmineData.textureData)}:{})},carpetData=window.RainbowCarpetData,carpetTexture=carpetData.textureData();for(let i=0;i<5;i++)extraGeometry['carpet'+i]=loadClassicTool({geometry:()=>carpetData.geometry(i)},carpetTexture);
    const worldSky=window.WorldSky.create(gl);
    const explosionRenderer=window.ExplosionRenderer1145.create(gl,window.RobloxExplosion1145),shieldRenderer=window.ForcefieldRenderer1145.create(gl,window.Forcefield1145Data);
    const ribbonBatch=window.BoxBatch?.create(gl,vertices);
    const staticParts=Obstacles.house.parts;
    const staticWorld=window.StaticWorld.create(gl,vertices,staticParts),sharedTV=Obstacles.house.tv?window.SharedTV.create(gl,Obstacles.house.tv):{draw(){}};
    const avatarRenderer=window.__avatarRenderer=window.AvatarAssets.create(gl,{pos,normal,uv,loc}),removedHats=new Set();
    window.dispatchEvent(new Event('avatar:renderer-ready'));
    const diskData = [0,0,0, 0,1,0];
    for (let i=0; i<=40; i++) { const a=i*Math.PI*2/40; diskData.push(Math.cos(a),0,Math.sin(a), 0,1,0); }
    const disk = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, disk); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diskData), gl.STATIC_DRAW);
    function buffer(which) {
    gl.bindBuffer(gl.ARRAY_BUFFER, which);
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 24, 12);
    }
    function draw(which, mode, count, scale, translation, yaw, color, floor, modelFrame) {
      buffer(which);gl.disableVertexAttribArray(uv);gl.vertexAttrib2f(uv,0,0);gl.uniform1f(loc.uUseFace,0);
      gl.uniform3fv(loc.uScale,scale);
      const frame=modelFrame||R6Animation.yawFrame(translation[0],translation[1],translation[2],yaw);
      gl.uniformMatrix4fv(loc.uModel,false,new Float32Array(frame));gl.uniform4fv(loc.uColor,color);gl.uniform1f(loc.uFloor,floor?1:0);
      gl.drawArrays(mode,0,count);
    }
    function box(scale,at,yaw,color,floor=false){draw(cube,gl.TRIANGLES,36,scale,at,yaw,color,floor)}
    let proxyCollector=null;
    function boxFrame(scale,modelFrame,color){if(proxyCollector){proxyCollector.push({size:scale,frame:modelFrame,color});return}draw(cube,gl.TRIANGLES,36,scale,null,0,color,false,modelFrame)}
    function avatarHead(appearance,frame,color,frames){if(!avatarRenderer.part(appearance,'Head',frame,color,[2,1,1],frames))linkedHeadFrame(R6Parts.headMeshScale,frames?.R15Head||frame,color,appearance)}
    function avatarBox(appearance,name,size,frame,color,frames){if(!avatarRenderer.part(appearance,name,frame,color,size,frames)){const geom=noobBevelGeometry(size);draw(geom.handle,gl.TRIANGLES,geom.count,[1,1,1],null,0,color,false,frame)}}
    // The indicator is a render attachment: it follows the same animated head frame
    // as the player's nametag, and never changes world geometry or avatar state.
    const remoteLoadingTags=new Map();
    function drawRemoteAvatarLoading(vp){
      const layer=document.getElementById('mp-tags'); if(!layer)return;
      for(const [id,el] of remoteLoadingTags)if(!mp.remotes.has(id)){el.remove();remoteLoadingTags.delete(id)}
      for(const r of mp.remotes.values()){
        const active=!!r.avatarLoading&&!!r.view&&!!r.visible&&!r.dead&&!!r.labelHead;
        let el=remoteLoadingTags.get(r.id);
        if(!el&&active){el=document.createElement('div');el.className='avatar-downloading';el.textContent='Downloading avatar…';el.setAttribute('role','status');el.style.cssText='position:absolute;white-space:nowrap;padding:4px 8px;border-radius:6px;background:rgba(20,24,33,.88);color:white;font:600 11px/1.25 system-ui,sans-serif;pointer-events:none';layer.append(el);remoteLoadingTags.set(r.id,el)}
        if(el&&r.labelHead)window.BillboardAttachments.frame(el,vp,r.labelHead,active,1.2,-48);else if(el)el.hidden=true;
      }
    }
    function linkedHeadFrame(scale,modelFrame,color,appearance=null) {
      buffer(headBuffer);gl.bindBuffer(gl.ARRAY_BUFFER,headUVs);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,8,0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,avatarRenderer.face?.(appearance)||faceTexture);gl.uniform1f(loc.uUseFace,1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,headIndices);
      gl.uniform3fv(loc.uScale,scale);gl.uniformMatrix4fv(loc.uModel,false,new Float32Array(modelFrame));
      gl.uniform4fv(loc.uColor,color);gl.uniform1f(loc.uFloor,0);gl.drawElements(gl.TRIANGLES,headGeometry.indices.length,gl.UNSIGNED_SHORT,0);
    }
    function linkedSwordFrame(modelFrame){
      buffer(swordBuffer);gl.bindBuffer(gl.ARRAY_BUFFER,swordUVs);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,8,0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,swordTexture);gl.uniform1f(loc.uUseFace,1);
      gl.uniform3fv(loc.uScale,[1,1,1]);gl.uniformMatrix4fv(loc.uModel,false,new Float32Array(modelFrame));gl.uniform4fv(loc.uColor,[1,1,1,1]);gl.uniform1f(loc.uFloor,0);
      gl.drawArrays(gl.TRIANGLES,0,swordGeometry.vertexCount);
    }
    function classicToolFrame(type,modelFrame,tint=null){const tool=extraGeometry[type];if(!tool){if(type==='subspace'&&window.SubspaceTripmine){window.SubspaceTripmine.drawFallback(modelFrame,boxFrame,R6Animation,tint?tint[3]:1);return}const color=type==='delete'?[.85,.12,.12,1]:type==='paint'?[.95,.77,.18,1]:type==='checker'?[.18,.65,.9,1]:[.48,.51,.54,1];boxFrame([.13,.85,.13],modelFrame,[.48,.3,.16,1]);boxFrame(type==='checker'?[.6,.6,.12]:[.65,.24,.27],R6Animation.multiply(modelFrame,R6Animation.yawFrame(0,.5,0,0)),color);return}buffer(tool.vertices);gl.bindBuffer(gl.ARRAY_BUFFER,tool.uvs);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,8,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tool.texture);gl.uniform1f(loc.uUseFace,1);gl.uniform3fv(loc.uScale,[1,1,1]);gl.uniformMatrix4fv(loc.uModel,false,new Float32Array(modelFrame));gl.uniform4fv(loc.uColor,tint||[1,1,1,1]);gl.uniform1f(loc.uFloor,0);gl.drawArrays(gl.TRIANGLES,0,tool.geometry.vertexCount)}
    function drawSubspaceMine(center,alpha=1,obj=null){
      if(alpha<=0.01)return;
      const frame=R6Animation.yawFrame(center[0],center[1],center[2],0);
      if(alpha<0.999){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(loc.uAvatarOpacity,alpha)}
      if(extraGeometry.subspace?.loaded)classicToolFrame('subspace',frame,[1,1,1,1]);
      else window.SubspaceTripmine?.drawFallback(frame,boxFrame,R6Animation,alpha);
      if(alpha<0.999){gl.uniform1f(loc.uAvatarOpacity,1);gl.disable(gl.BLEND)}
    }
    const {perspective,lookAt,multiply}=window.GameCameraMath;
    const inputMemory=new ArrayBuffer(MainQueue.layout.READ+4), eventQueue=new MainQueue(inputMemory);
    const keyboardInput=new KeyboardInput(eventQueue), inputContext=1024, inputObject=8192, inputScratch=4096;
    const inputVector=inputObject+136, inputStorage=16384, inputCapacity=MainQueue.layout.usable;
    eventQueue.view.setInt32(inputVector,inputStorage,true);
    eventQueue.view.setInt32(inputVector+4,inputStorage,true);
    eventQueue.view.setInt32(inputVector+8,inputStorage+12*inputCapacity,true);
    const inputHooks={lock(){},unlock(){},resolve(context,name){
      if(context!==inputContext||name!==InputDispatch.NAME)throw new Error('Unexpected demo input context');
      return inputObject;
    },alloc(){throw new Error('The demo input vector capacity was exceeded');},free(){throw new Error('The demo input vector does not own dynamic memory');}};
    const inputTelemetry={forwarded:0,filtered:0,objectUpdates:0,objectDispatches:0};
    const demoInputObjects=new Map(); let nextDemoInputObject=32768;
    const objectHooks={setState(v,p,x){v.setInt32(p+20,x,true);},setLogical(v,p,x){v.setInt32(p+16,x,true);},notify(){},signal(){}};
    function demoObjectFor(physical){
      if(!demoInputObjects.has(physical)){
        if(nextDemoInputObject+256>4_000_000)throw new Error('Demo input object capacity exceeded');
        const address=nextDemoInputObject; nextDemoInputObject+=256;
        eventQueue.bytes.fill(0,address,address+256);
        eventQueue.view.setInt32(address+112,2,true); // demo initial released state
        demoInputObjects.set(physical,address);
      }
      return demoInputObjects.get(physical);
    }
    function clearDemoInputObjects(){demoInputObjects.clear();nextDemoInputObject=32768;}
    const demoKeys=new Map([[119,'KeyW'],[97,'KeyA'],[115,'KeyS'],[100,'KeyD'],
      [273,'ArrowUp'],[276,'ArrowLeft'],[274,'ArrowDown'],[275,'ArrowRight'],[32,'Space']]);
    const held=new Set(),cameraKeys=new Set();
    const motionDefaults=Object.freeze({walkSpeed:16,jumpPower:50,gravity:196.2,airGlideGravityScale:.8});
    const worldSigns=window.WorldSigns.create(Obstacles.house.signs);
    const player={x:spawn.x,y:spawn.y,z:spawn.z,vy:0,grounded:true,gliding:false,yaw:0,walk:0,moving:false,seated:false,activeSeat:null,seatCooldown:0,seatLock:false,jumpTime:0,climbing:false,climbExit:false,climbSpeed:0,climbCooldown:0,climbVX:0,climbVZ:0};
    const mp=window.__multiplayer;if(!mp||!window.PlayerLimbEffects)throw new Error("Live multiplayer module did not load.");const limbs=window.__playerLimbEffects=window.PlayerLimbEffects.create();
    const r6Animator=R6Animation.create(R6AnimationData),sword=SwordScript.create(),demoTarget=DemoTarget.create(!swordMap&&!window.MapSelection?.isObby),demoTools=Tools.create(),carpet=window.RainbowCarpet.create();let r6Matrices=r6Animator.step(0,0),attackSerial=0,localHealth=100,lastHazardTime=-Infinity;
    function playerRootFrame(y=player.y+standingRootOffset){if(player.freeSeated)return R6Animation.qmatrix(player.freeSeated.rotation,player.freeSeated.center);if(player.freeSit&&player.bodyRotation){const o=player.seatVisualOffset||[0,0,0];return R6Animation.qmatrix(player.bodyRotation,[player.x+o[0],y+o[1],player.z+o[2]])}if(carpet.active)return carpet.rootFrame(R6Animation,player,standingRootOffset);return R6Animation.yawFrame(player.x,y,player.z,player.yaw+Math.PI)}
    function remoteRootFrame(r){if(r.freeSit&&r.bodyRotation){const o=r.renderSeatOffset||r.seatOffset||[0,0,0];return R6Animation.qmatrix(r.renderRotation||r.bodyRotation,[r.rx+o[0],r.ry+standingRootOffset+o[1],r.rz+o[2]])}return r.fly?carpet.rootFrame(R6Animation,{x:r.rx,y:r.ry,z:r.rz,yaw:r.ryaw,flightPitch:r.rpitch},standingRootOffset):R6Animation.yawFrame(r.rx,r.ry+standingRootOffset,r.rz,r.ryaw+Math.PI)}
    let swordSoundAttempts=0,lastSwordSound=null,lastSwordVolume=null,queuedSword=false,activeSwordDamage=5,activeSwordAt=-Infinity;const activeSwordSounds=new Set();
    const worldAudio=window.__worldAudio=window.WorldAudio.create(()=>player);
    function playSwordSound(name,scale=1,point=null){const source=SwordAudio[name];if(!source)return;lastSwordSound=name;swordSoundAttempts++;const audio=worldAudio.play(source.dataUri,point,source.volume*scale);lastSwordVolume=audio?.volume||0;}
    function activateSword(){
      if(!window.CombatMode.enabled)return;
      if(window.__hudInteraction&&window.__hudInteraction.blocksGameplay(canvas))return;
      const t=performance.now()/1000,action=sword.activate(t);if(!action.accepted){if(sword.getState().equipped&&!sword.getState().enabled)queuedSword=true;return}queuedSword=false;activeSwordDamage=action.damage;activeSwordAt=t;attackSerial++;
      r6Animator.triggerToolAction(action.toolanim);playSwordSound(action.sound);mp.sendSwing(action.toolanim);
    }
    let cursorKind='default';
    function playToolAudio(uri,point=null){return worldAudio.play(uri,point);}
    const bloxyColaController=window.BloxyCola.create({
      isOnline:()=>mp.connected,
      sendUse:reqId=>mp.sendUseCola(reqId),
      finishUse:(token,reqId)=>mp.sendFinishCola(token,reqId),
      sendCancel:(reqId,token)=>mp.sendCancelCola(reqId,token),
      playSound:uri=>playToolAudio(uri),
      healOffline:()=>{
        if(playerDeath||!Number.isFinite(localHealth)||localHealth<=0)return {accepted:false,reason:'dead'};
        const max=Math.max(localHealth,Number.isFinite(player.maxHealth)&&player.maxHealth>0?player.maxHealth:100);
        const before=localHealth;
        localHealth=Math.min(max,localHealth+5);
        window.__robloxHudResearch?.setHealth(localHealth,max,false,true);
        return {accepted:true,health:localHealth,maxHealth:max,healed:localHealth-before,cooldownMs:0};
      }
    });
    window.addEventListener('mp:cola-result',e=>bloxyColaController.onResult(e.detail));
    const subspaceController=window.SubspaceTripmine?.createEffectsManager({playSound:(uri,pt)=>playToolAudio(uri,pt)})||null;
    function updateToolCursor(state){const nowS=performance.now()/1000,tool=window.__robloxBackpack&&window.__robloxBackpack.getState().equippedTool,enabled=tool==='sword'?state.enabled:tool==='bloxycola'?!bloxyColaController.getState().pending:tool==='subspace'?(subspaceController?subspaceController.isReady(nowS):true):tool==='carpet'?true:tool==='pistol'?!gun.getState().reloading:nowS>=demoTools.readyAt(tool),kind=!tool?'default':enabled?'ready':'wait';if(kind===cursorKind)return;cursorKind=kind;canvas.style.cursor=kind==='default'?'':`url("${kind==='ready'?CursorData.ready:CursorData.wait}") 40 40, crosshair`;}
    window.addEventListener('backpack:changed',e=>{if(!e.detail.equipped||e.detail.equippedTool!=='sword')queuedSword=false;if(e.detail.equippedTool!=='carpet')carpet.stop(player);if(!e.detail.equipped||e.detail.equippedTool!=='bloxycola')bloxyColaController.cancel();else bloxyColaController.equip();const sound=sword.equip(!!e.detail.equipped&&e.detail.equippedTool==='sword');updateToolCursor(sword.getState());if(sound)playSwordSound(sound)});
    function activateEquipped(x,y){if(playerDeath||player.seated)return;if((characterCamera.firstPerson()||document.pointerLockElement===canvas)&&!rightCameraLock.isRightLook()){const rect=canvas.getBoundingClientRect();x=rect.left+rect.width/2;y=rect.top+rect.height/2}const tool=window.__robloxBackpack&&window.__robloxBackpack.getState().equippedTool;if(window.CombatMode.isWeapon(tool)&&!window.CombatMode.enabled&&!window.__adminUnlockedTools?.has(tool))return;if(tool==='sword'){activateSword();return}if(tool==='carpet'){carpet.toggle(player);return}if(tool==='bloxycola'){bloxyColaController.use();return}if(['paintball','slingshot','superball','timebomb','jetboots','subspace'].includes(tool)){const target=Tools.aimTarget(x,y,canvas.getBoundingClientRect(),cameraEye,camera,null,Obstacles,demoTools.getState(performance.now()/1000).walls);placeRuntime.activate(tool,[target.x,target.y,target.z]);updateToolCursor(sword.getState());return}if(tool==='pistol'){gun.fire(x,y);return}if(['build','delete','paint','checker'].includes(tool)){buildTools.activate(x,y);return}if(!tool)return;if(tool==='trowel'&&mp.connected){const now=performance.now()/1000;if(now<demoTools.readyAt('trowel'))return;mp.sendTrowel();return}const t=performance.now()/1000,target=tool==='rocket'?Tools.aimTarget(x,y,canvas.getBoundingClientRect(),cameraEye,camera,demoTarget.getState(),{...Obstacles,boxes:mp.remoteBoxes()},demoTools.getState(t).walls):null,root=playerRootFrame(player.y+standingRootOffset),origin=tool==='rocket'?Tools.rocketMuzzle(player,target,DemoTarget.point(classicModelFrame(root,'rocket'),[5,0,0])):null;if(demoTools.activate(tool,target,player,t,{origin})){if(tool==='rocket')mp.sendRocket(origin,target);else if(tool==='trowel')mp.sendTrowel();playToolAudio(tool==='rocket'?RocketData.whooshData():TrowelData.buildSound)}}
    const rightCameraLock=window.RightCameraLock.create(canvas);
    const shiftIcon=document.getElementById('rbx-shift-cursor');shiftIcon.src=window.CharacterEffects.shiftIcon;
    const characterSoundCounts={jump:0,death:0};let lastDummyHealth=100,playerDeath=null,forcefieldUntil=performance.now()/1000+10,carpetCollected=false;
    function playCharacterSound(kind,point=null){const source=window.R6LocalAudio&&window.R6LocalAudio[kind];if(!source)return;characterSoundCounts[kind]++;worldAudio.play(source.dataUri,point);}
    const camera={yaw:0.45,pitch:0.43,distance:ClassicCamera.source.defaultDistance};let cameraFocus=[0,0,0],cameraEye=[0,0,0],clickTarget=null,lastCameraPan=0;
    const buildTools=window.__buildTools=window.BuildTools.create(()=>({player,canvas,eye:cameraEye,camera,obstacles:Obstacles,tools:demoTools,mp,centered:()=>(characterCamera.firstPerson()||document.pointerLockElement===canvas)&&!rightCameraLock.isRightLook()}));
    const gun=window.General45.create(()=>({player,canvas,eye:cameraEye,camera,target:demoTarget,obstacles:Obstacles,tools:demoTools,mp:window.__multiplayer,muzzle:()=>DemoTarget.point(classicModelFrame(playerRootFrame(player.y+standingRootOffset),'pistol'),[0,0,-1.2])}));
    const placeRuntime=window.PlaceRuntime.create(window.MapSelection?.data,()=>({player,obstacles:Obstacles,dead:()=>!!playerDeath,kill:()=>diePlayer(),damage:n=>takeLocalDamage(n,false),heal:n=>{localHealth=Math.min(player.maxHealth||100,localHealth+n)},armor:n=>{player.maxHealth=n;localHealth=n},subspaceController,drawSubspace:drawSubspaceMine,onPlaceObjects:objs=>subspaceController?.syncObjects(objs)}));
    const {createPhysics}=await import('./box3d-physics.mjs');
    const characterPhysics=window.__characterPhysics=await createPhysics({obstacles:Obstacles,baseplate:!swordMap&&!window.MapSelection?.isObby?{center:scene.baseplate.center,size:plateSize}:null});
    const physicsExtras=[];let dummyPhysicsBox=null;
    const humanoid=window.HumanoidController.create(player,{rootOffset:standingRootOffset}),reconciliation=window.__poseReconciliation=window.PoseReconciliation.create(),characterCamera=window.CharacterCamera.create(canvas,camera,ClassicCamera);
    window.addEventListener('pagehide',e=>{if(!e.persisted)characterPhysics.destroy()});
    if(window.__multiplayer?.serverPose){const p=window.__multiplayer.serverPose;Object.assign(player,{x:p.x,y:p.y,z:p.z,yaw:p.yaw});Object.assign(spawn,{x:p.x,y:p.y,z:p.z,yaw:p.yaw})}
    let jumpQueued=false, lastFrame=0, dragging=false, pointerId=null, lastX=0, lastY=0,downX=0,downY=0,downButton=-1,pointerMoved=false;
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    function respawnPlayer() {
      if(player.freeSeated)characterPhysics.release(player.freeSeated);humanoid.reset();reconciliation.clear();characterPhysics.reset();bloxyColaController.cancel();playerDeath=null;player.blastVelocity=null;remoteHits.clear();limbs.reset('local');removedHats.delete('local');window.__robloxBackpack.restoreStarterTools();forcefieldUntil=performance.now()/1000+10;queuedSword=false;carpet.stop(player);
      Object.assign(player,{x:spawn.x,y:spawn.y,z:spawn.z,vy:0,grounded:true,gliding:false,yaw:0,walk:0,moving:false,seated:false,activeSeat:null,seatCooldown:0,seatLock:false,jumpTime:0,climbing:false,climbExit:false,climbSpeed:0,climbCooldown:0,climbVX:0,climbVZ:0,visualStepOffset:0});
      r6Animator.reset();sword.reset();gun.reset();attackSerial=0;localHealth=100;lastHazardTime=-Infinity;r6Matrices=r6Animator.step(0,0);
      if(window.__robloxBackpack)window.__robloxBackpack.unequip();
      Object.assign(camera,{yaw:0.45,pitch:0.43,distance:ClassicCamera.source.defaultDistance});clickTarget=null;if(document.pointerLockElement===canvas)document.exitPointerLock();if(window.__localSettings)window.__localSettings.setShiftLocked(false);held.clear();cameraKeys.clear();jumpQueued=false;clearDemoInputObjects();
      if(window.__robloxHudResearch)window.__robloxHudResearch.setHealth(100,100,false,true);
    }
    function reset(){respawnPlayer();demoTarget.reset();demoTools.reset();lastDummyHealth=100}
    function diePlayer(impulse=null,blastCenter=null){
      if(playerDeath)return;mp.sendDeath();
      const root=playerRootFrame(player.y+standingRootOffset);
      const snapshots=R6Death.names.filter(name=>!limbs.missing('local',name)).map(name=>{const m=R6Animation.multiply(root,r6Matrices[name]);return{name,size:R6Parts.parts[name].size.slice(),center:m.slice(12,15),rotation:R6Animation.quat(m)}});
      const validBlast=Array.isArray(blastCenter)&&blastCenter.length===3&&blastCenter.every(Number.isFinite),speed=player.moving?motionDefaults.walkSpeed:0,velocity=[Math.sin(player.yaw)*speed+(validBlast?0:impulse?.[0]||0),player.vy+(validBlast?0:impulse?.[1]||0),Math.cos(player.yaw)*speed+(validBlast?0:impulse?.[2]||0)],now=performance.now()/1000;
      playerDeath={sim:R6Death.create(snapshots,velocity,true),startedAt:now,respawnAt:now+R6Death.RESPAWN_SECONDS};if(validBlast)playerDeath.sim.blast(blastCenter,Tools.demoOverride.rocketImpulse,Tools.demoOverride.blastRadius);
      if(player.freeSeated)characterPhysics.release(player.freeSeated);humanoid.reset();reconciliation.clear();bloxyColaController.cancel();
      localHealth=0;forcefieldUntil=0;queuedSword=false;carpet.stop(player);player.moving=false;player.seated=false;player.gliding=false;held.clear();jumpQueued=false;clickTarget=null;
      if(window.__robloxBackpack)window.__robloxBackpack.unequip();sword.reset();
      if(window.__robloxHudResearch)window.__robloxHudResearch.setHealth(0,100,true,true);
      playCharacterSound('death');
    }
    function takeLocalDamage(amount,direct=false,impulse=null,blastCenter=null){if(playerDeath||!Number.isFinite(amount)||amount<=0||(!direct&&performance.now()/1000<forcefieldUntil))return false;localHealth=Math.max(0,localHealth-amount);if(!mp.connected)mp.sendHealth(localHealth);if(localHealth===0){diePlayer(impulse,blastCenter);return true}if(window.__robloxHudResearch)window.__robloxHudResearch.setHealth(localHealth,player.maxHealth||100,false,true);return true}
    function deathSurface(x,z,oldBottom,ext){
      let floor=!swordMap&&!window.MapSelection?.isObby&&Math.abs(x)<plateHalfBounds[0]&&Math.abs(z)<plateHalfBounds[2]?demoPlateTop:null;
      for(const part of Obstacles.nearby(x,z)){const top=part.center[1]+part.size[1]/2;if(oldBottom>=top-.2&&Math.abs(x-part.center[0])<=part.size[0]/2+Math.min(ext[0],.5)&&Math.abs(z-part.center[2])<=part.size[2]/2+Math.min(ext[2],.5))floor=floor===null?top:Math.max(floor,top)}
      return floor;
    }
    const controlled=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space']);
    window.addEventListener('keydown', e => {
      if (window.__hudInteraction && window.__hudInteraction.blocksGameplay(e.target)) return;
      if (e.target && e.target.closest && e.target.closest('button') && e.code==='Space') return;
      if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();cameraKeys.add(e.code);lastCameraPan=performance.now();return}
      if (controlled.has(e.code)) {e.preventDefault();if(e.code!=='Space')clickTarget=null;}
      if(!e.repeat&&(e.code==='ShiftLeft'||e.code==='ShiftRight')&&window.__localSettings){const x=window.__localSettings.getState();if(x.shiftLock){if(document.pointerLockElement===canvas)document.exitPointerLock();else if(canvas.requestPointerLock){const request=canvas.requestPointerLock();if(request&&request.catch)request.catch(()=>window.__localSettings.setShiftLocked(false))}e.preventDefault();return}}
      if(!e.repeat&&(e.code==='KeyI'||e.code==='KeyO')){characterCamera.zoom(e.code==='KeyI'?-.5:.5);e.preventDefault()}
      keyboardInput.handle(2,e);
    });
    window.addEventListener('keyup', e => {const blocked=!!(window.__hudInteraction&&window.__hudInteraction.blocksGameplay(e.target));if(e.code==='ArrowLeft'||e.code==='ArrowRight'){cameraKeys.delete(e.code);if(!blocked)e.preventDefault();return}if(blocked&&!controlled.has(e.code))return;keyboardInput.handle(3,e); });
    document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas&&!rightCameraLock.isRightLook();shiftIcon.hidden=!locked||characterCamera.firstPerson();if(window.__localSettings)window.__localSettings.setShiftLocked(locked&&!characterCamera.firstPerson())});
    document.addEventListener('pointerlockerror',()=>{shiftIcon.hidden=true;if(window.__localSettings)window.__localSettings.setShiftLocked(false)});
    window.addEventListener('hud:local-settings',e=>{if(!e.detail.shiftLock&&!characterCamera.firstPerson()&&document.pointerLockElement===canvas&&!rightCameraLock.isRightLook())document.exitPointerLock()});
    window.addEventListener('hud:chat-slash-focus',()=>{if(document.pointerLockElement===canvas)document.exitPointerLock();cameraKeys.clear();jumpQueued=false;held.delete('Space');dragging=false;clickTarget=null;});
    window.addEventListener('hud:control-suspend',(e)=>{if(document.pointerLockElement===canvas)document.exitPointerLock();
      // #4148 Social/UI: opening the chat box must not stop a player who is already walking.
      // Chat sends keepMoving, so the held WASD keys survive; a real keyup still stops them.
      if(e&&e.detail&&e.detail.keepMoving)return;eventQueue.drain(()=>{});eventQueue.view.setInt32(inputVector+4,inputStorage,true);held.clear();cameraKeys.clear();jumpQueued=false;clearDemoInputObjects();eventQueue.view.setInt32(inputObject+176,0,true);dragging=false;clickTarget=null;});
    window.addEventListener('blur', () => { eventQueue.drain(()=>{}); held.clear(); cameraKeys.clear(); clearDemoInputObjects(); eventQueue.view.setInt32(inputObject+176,0,true); dragging=false; }); // demo focus cleanup
    function dispatchKeyboardRecord(address,record) {
      if(record[0]!==0)return;
      const physical=eventQueue.view.getInt32(address+8,true);
      const kept=InputDispatch.dispatch(inputMemory,inputContext,inputScratch,record[4],physical,
        Keyboard.logicalFromCode(physical),record[12],inputHooks);
      if(kept)inputTelemetry.forwarded++;else inputTelemetry.filtered++;
    }
    function consumeDemoInput() {
      const view=eventQueue.view,end=view.getInt32(inputVector+4,true);
      for(let at=inputStorage;at<end;at+=12){
        KeyboardModifiers.apply(inputMemory,inputObject,at); // 3107 modifier-mask switch
        const down=view.getUint8(at)!==0,repeat=view.getUint8(at+1)!==0;
        const physical=view.getInt32(at+8,true),logical=view.getInt32(at+4,true);
        const gate=InputObjectTail.update(inputMemory,demoObjectFor(physical),down,repeat,physical,logical,view.getInt32(inputObject+176,true),objectHooks);
        inputTelemetry.objectUpdates++; if(gate)inputTelemetry.objectDispatches++;
        const key=demoKeys.get(logical);
        if(!key||!gate)continue; // demo adapter; 92288 itself is not recovered
        if(down){if(key==='Space'&&!repeat)jumpQueued=true;held.add(key);}else held.delete(key);
      }
      view.setInt32(inputVector+4,inputStorage,true);
    }
    let touchCamera=null,pinchDistance=0,paintStroke=null;const paintingNow=()=>!!(window.__robloxBackpack&&window.__robloxBackpack.getState().equippedTool==='paint');const touchPoints=new Map();const touchMove=window.MobileInput.create(document.getElementById('rbx-touch-stick'),()=>{clickTarget=null}),clearTouchMove=()=>touchMove.clear();
    canvas.addEventListener('pointerdown', e => {
      if(e.pointerType==='touch'){touchPoints.set(e.pointerId,{id:e.pointerId,x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(touchPoints.size===1)touchCamera={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};else{const p=[...touchPoints.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(touchCamera)touchCamera.moved=true}e.preventDefault();return}
      characterCamera.refresh(true);if(e.button!==0&&e.button!==2)return;
      canvas.focus({preventScroll:true});e.preventDefault();
      if(e.button===0){const opt=window.__localSettings&&window.__localSettings.getState();if(opt&&opt.movementMode==='Click to Move'&&!(window.__robloxBackpack&&window.__robloxBackpack.getState().equipped))clickTarget=groundTarget(e.clientX,e.clientY);else{activateEquipped(e.clientX,e.clientY);updateToolCursor(sword.getState());if(paintingNow())paintStroke=e.pointerId}return}
      if(document.pointerLockElement===canvas&&!rightCameraLock.isRightLook())return;dragging=true;pointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;if(!rightCameraLock.isRightLook()&&document.pointerLockElement!==canvas)canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      const sensitivity=window.__hudInteraction?window.__hudInteraction.sensitivity:1;
      if(touchPoints.has(e.pointerId)){touchPoints.set(e.pointerId,{id:e.pointerId,x:e.clientX,y:e.clientY});if(touchPoints.size>=2){const p=[...touchPoints.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinchDistance>0&&distance>10)camera.distance=clamp(camera.distance*pinchDistance/distance,.5,128);characterCamera.refresh(true);pinchDistance=distance;lastCameraPan=performance.now();if(touchCamera)touchCamera.moved=true;e.preventDefault();return;}}

      if(touchCamera&&e.pointerId===touchCamera.id){const dx=e.clientX-touchCamera.x,dy=e.clientY-touchCamera.y;if(Math.hypot(e.clientX-touchCamera.startX,e.clientY-touchCamera.startY)>7)touchCamera.moved=true;if(touchCamera.moved&&paintingNow()&&touchPoints.size<=1){if(e.clientX!==touchCamera.x||e.clientY!==touchCamera.y)activateEquipped(e.clientX,e.clientY);touchCamera.x=e.clientX;touchCamera.y=e.clientY;e.preventDefault();return}if(touchCamera.moved){lastCameraPan=performance.now();camera.yaw-=dx*.0065*sensitivity;camera.pitch=clamp(camera.pitch+dy*.005*sensitivity,-ClassicCamera.source.pitchLimit,ClassicCamera.source.pitchLimit)}touchCamera.x=e.clientX;touchCamera.y=e.clientY;e.preventDefault();return}
      if(document.pointerLockElement===canvas){lastCameraPan=performance.now();camera.yaw-=e.movementX*.0065*sensitivity;camera.pitch=clamp(camera.pitch+e.movementY*.005*sensitivity,-ClassicCamera.source.pitchLimit,ClassicCamera.source.pitchLimit);return}
      if(paintStroke!==null&&e.pointerId===paintStroke){if(e.buttons&1){if(paintingNow())activateEquipped(e.clientX,e.clientY)}else paintStroke=null;return}
      if(!dragging||e.pointerId!==pointerId)return;
      lastCameraPan=performance.now();camera.yaw-=(e.clientX-lastX)*0.0065*sensitivity;
      camera.pitch=clamp(camera.pitch+(e.clientY-lastY)*0.005*sensitivity,-ClassicCamera.source.pitchLimit,ClassicCamera.source.pitchLimit);
      lastX=e.clientX;lastY=e.clientY;
    });
    function groundTarget(clientX,clientY){const r=canvas.getBoundingClientRect(),nx=(clientX-r.left)/r.width*2-1,ny=1-(clientY-r.top)/r.height*2,cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch),sy=Math.sin(camera.yaw),cy=Math.cos(camera.yaw),k=Math.tan(Math.PI/6),aspect=r.width/r.height;
      const forward=[-sy*cp,-sp,-cy*cp],right=[cy,0,-sy],up=[-sy*sp,cp,-cy*sp],dir=forward.map((v,i)=>v+right[i]*nx*k*aspect+up[i]*ny*k);if(dir[1]>=-.0001)return null;const t=-cameraEye[1]/dir[1];if(t<=0)return null;return{x:clamp(cameraEye[0]+dir[0]*t,-plateHalfBounds[0],plateHalfBounds[0]),z:clamp(cameraEye[2]+dir[2]*t,-plateHalfBounds[2],plateHalfBounds[2])}}
    function endPointer(e){if(e.pointerId===paintStroke)paintStroke=null;if(touchPoints.has(e.pointerId)){const pinching=pinchDistance>0||touchPoints.size>1;touchPoints.delete(e.pointerId);pinchDistance=0;if(pinching){const p=[...touchPoints.values()][0];touchCamera=p?{...p,startX:p.x,startY:p.y,moved:true}:null;return;}}if(touchCamera&&e.pointerId===touchCamera.id){if(e.type==='pointerup'&&!touchCamera.moved){const opt=window.__localSettings&&window.__localSettings.getState();if(opt&&opt.movementMode==='Click to Move'&&!(window.__robloxBackpack&&window.__robloxBackpack.getState().equipped))clickTarget=groundTarget(e.clientX,e.clientY);else activateEquipped(e.clientX,e.clientY)}touchCamera=null;return}if(e.pointerId===pointerId){dragging=false;pointerId=null}}
    canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{e.preventDefault();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);characterCamera.zoom(clamp(pixels/300,-4,4));},{passive:false});
    for (const button of document.querySelectorAll('[data-touch]')) {
      const key=button.dataset.touch;
      button.addEventListener('pointerdown',e=>{ e.preventDefault(); if(window.__hudInteraction&&window.__hudInteraction.blocksGameplay(e.target))return; button.setPointerCapture(e.pointerId); if(key==='Space')jumpQueued=true;held.add(key); });
      const release=()=>held.delete(key);
      button.addEventListener('pointerup',release); button.addEventListener('pointercancel',release); button.addEventListener('lostpointercapture',release);
    }
    const clearTouch=()=>{clearTouchMove();touchCamera=null;touchPoints.clear();pinchDistance=0};window.addEventListener('hud:control-suspend',clearTouch);window.addEventListener('blur',clearTouch);
    // Phones often switch apps without a blur: release every held input when the page hides.
    document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();cameraKeys.clear();jumpQueued=false;dragging=false;clickTarget=null;clearTouch()}});
    window.__touchController=Object.freeze({getState:()=>({side:touchMove.side,forward:touchMove.forward,cameraDragging:!!touchCamera,pinching:touchPoints.size>=2})});
    let faceQueryChecks=0;
    function update(dt,swordFrame) {
      const cameraTurn=(cameraKeys.has('ArrowLeft')?1:0)-(cameraKeys.has('ArrowRight')?1:0);if(cameraTurn){camera.yaw+=cameraTurn*1.8*dt;lastCameraPan=performance.now()}
      reconciliation.step(player,characterPhysics,dt);
      if(held.has('Space'))jumpQueued=true;
      if(playerDeath){characterPhysics.reset();jumpQueued=false;return}
      if(!carpetCollected&&Math.abs(player.y-Obstacles.platform.top)<1.5&&Math.hypot(player.x-Obstacles.carpetPickup.center[0],player.z-Obstacles.carpetPickup.center[2])<Obstacles.carpetPickup.radius){carpetCollected=window.__robloxBackpack.grantTool('carpet')}
      player.freeSitCooldown=Math.max(0,(player.freeSitCooldown||0)-dt);
      if(player.freeSeated){const body=player.freeSeated;player.x=body.center[0];player.y=body.center[1]-standingRootOffset;player.z=body.center[2];player.vy=body.velocity[1];player.bodyRotation=body.rotation.slice();player.moving=false;
        if(jumpQueued){characterPhysics.release(body);player.y=body.center[1]-.8;humanoid.leaveFree(motionDefaults.jumpPower);characterPhysics.reset();jumpQueued=false;playCharacterSound('jump')}else{placeRuntime.step(dt);jumpQueued=false;return}}
      player.seatCooldown=Math.max(0,player.seatCooldown-dt);
      player.jumpTime=Math.max(0,player.jumpTime-dt);
      if(player.seated&&player.activeSeat?.buildKey&&window.GridWorld.blocks.get(player.activeSeat.buildKey)?.variant!=='chair'){humanoid.leaveSeat(0);characterPhysics.reset()}
      if(player.seated){
        player.moving=false;player.gliding=false;
        if(jumpQueued){humanoid.leaveSeat(motionDefaults.jumpPower);characterPhysics.reset();jumpQueued=false;playCharacterSound('jump');}
        else {characterPhysics.reset();jumpQueued=false;return;}
      }
      if(carpet.active){characterPhysics.reset();const flightHeld=new Set(held);if(touchMove.forward>.1)flightHeld.add('KeyW');if(touchMove.forward<-.1)flightHeld.add('KeyS');if(touchMove.side>.1)flightHeld.add('KeyD');if(touchMove.side<-.1)flightHeld.add('KeyA');carpet.step(dt,player,camera,flightHeld,performance.now()/1000,Obstacles);jumpQueued=false;return}
      const forward=clamp((held.has('KeyW')||held.has('ArrowUp')?1:0)-(held.has('KeyS')||held.has('ArrowDown')?1:0)+touchMove.forward,-1,1),side=clamp((held.has('KeyD')?1:0)-(held.has('KeyA')?1:0)+touchMove.side,-1,1);
      player.climbCooldown=Math.max(0,player.climbCooldown-dt);if(jumpQueued&&window.HumanoidClimbing.jump(player,Obstacles.climbables,motionDefaults.jumpPower)){jumpQueued=false;playCharacterSound('jump')}
      if(window.HumanoidClimbing.step(player,{forward,side,cameraYaw:camera.yaw,walkSpeed:motionDefaults.walkSpeed,physics:characterPhysics},dt,Obstacles.climbables)){characterPhysics.reset();jumpQueued=false;return}
      let dx=-Math.sin(camera.yaw)*forward+Math.cos(camera.yaw)*side;
      let dz=-Math.cos(camera.yaw)*forward-Math.sin(camera.yaw)*side;let goalDistance=Infinity;if(!player.grounded&&player.climbCooldown>0){dx+=player.climbVX/motionDefaults.walkSpeed;dz+=player.climbVZ/motionDefaults.walkSpeed;player.climbVX*=Math.exp(-2*dt);player.climbVZ*=Math.exp(-2*dt)}
      if(!forward&&!side&&clickTarget){dx=clickTarget.x-player.x;dz=clickTarget.z-player.z;goalDistance=Math.hypot(dx,dz);if(goalDistance<.2){clickTarget=null;dx=dz=0}}
      const length=Math.hypot(dx,dz);
      player.moving=length>0;
      let moveX=0,moveZ=0;
      if(length>0){
        dx/=length;dz/=length;const step=Math.min(motionDefaults.walkSpeed*dt*(clickTarget?1:Math.min(1,length)),goalDistance),x=player.x+dx*step,z=player.z+dz*step;
        moveX=x-player.x;moveZ=z-player.z;
        const settings=window.__localSettings&&window.__localSettings.getState(),targetHeading=characterCamera.aligned()?camera.yaw-Math.PI:Math.atan2(dx,dz),headingDelta=Math.atan2(Math.sin(targetHeading-player.yaw),Math.cos(targetHeading-player.yaw));if(!characterCamera.aligned())player.yaw+=headingDelta*(1-Math.exp(-12*dt));if(player.moving)player.walk+=dt*9;
        if(settings&&settings.cameraMode.includes('Follow')&&!characterCamera.aligned()&&performance.now()-lastCameraPan>2000){const targetYaw=player.yaw+Math.PI,diff=Math.atan2(Math.sin(targetYaw-camera.yaw),Math.cos(targetYaw-camera.yaw));camera.yaw+=diff*(1-Math.exp(-2*dt))}
      }
      characterCamera.face(player);
      if(player.blastVelocity){moveX+=player.blastVelocity[0]*dt;moveZ+=player.blastVelocity[2]*dt;const decay=Math.exp(-2.5*dt);player.blastVelocity[0]*=decay;player.blastVelocity[2]*=decay;if(Math.hypot(player.blastVelocity[0],player.blastVelocity[2])<.05)player.blastVelocity=null;}
      faceQueryChecks++;
      if(jumpQueued&&(player.grounded||player.groundGrace>0)){characterPhysics.reset();playCharacterSound('jump');player.vy=motionDefaults.jumpPower;player.grounded=false;player.groundGrace=0;player.jumpTime=.3;}
      jumpQueued=false;
      player.gliding=!!(swordFrame.forceUp&&!player.grounded&&player.vy<0);
      // Existing prop adapters still apply push impulses; their booleans never
      // resolve or override movement. All player displacement goes through Box3D.
      if(moveX||moveZ){const tx=player.x+moveX,tz=player.z+moveZ;
        // Box3D contact points apply off-center push impulses to bricks.
        mp.blocksPlayer(tx,tz,player.y,player.x,player.z);
        if(!swordMap&&!window.MapSelection?.isObby)demoTarget.blocksPlayer(tx,tz,player.y,player.x,player.z);
      }
      physicsExtras.length=0;
      // Trowel bricks already exist as dynamic bodies in this world.
      for(const r of mp.remotes.values())if(!r.dead){if(!r.physicsBox)r.physicsBox={center:[0,0,0],size:[2.4,5,2.4]};const p=r.physicsBox;p.center[0]=r.rx;p.center[1]=r.ry+2.5;p.center[2]=r.rz;physicsExtras.push(p)}
      const dummyBody=demoTarget.getState();if(!swordMap&&!window.MapSelection?.isObby&&dummyBody.health>0){if(!dummyPhysicsBox)dummyPhysicsBox={center:[0,2.5,0],size:[2,5,2]};dummyPhysicsBox.center[0]=dummyBody.center[0];dummyPhysicsBox.center[1]=dummyBody.center[1]+2.5;dummyPhysicsBox.center[2]=dummyBody.center[2];physicsExtras.push(dummyPhysicsBox)}
      characterPhysics.syncExtras(physicsExtras);
      if(player.recovering){player.x+=moveX;player.z+=moveZ;player.vy-=motionDefaults.gravity*dt;player.y+=player.vy*dt;player.grounded=false;player.groundGrace=0;return;}
      const oldX=player.x,oldZ=player.z;
      characterPhysics.step(player,moveX,moveZ,dt,motionDefaults.gravity*(player.gliding?motionDefaults.airGlideGravityScale:1));
      if(Math.abs(player.stepDelta||0)>.005)player.visualStepOffset=clamp((player.visualStepOffset||0)-player.stepDelta,-2.2,2.2);
      if(player.visualStepOffset){player.visualStepOffset*=Math.exp(-(player.grounded?16:26)*dt);if(Math.abs(player.visualStepOffset)<.001)player.visualStepOffset=0;}
      if(player.moving&&Math.hypot(player.x-oldX,player.z-oldZ)<.001){player.moving=false;clickTarget=null}
      if(player.support?.part?.sitOnTouch&&player.grounded&&!player.freeSitCooldown){const pose=r6Animator.step(.5,0,1,{phase:'sit'}),hull=[];for(const [name,part]of Object.entries(R6Parts.parts)){const m=pose[name];if(!m)continue;for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])hull.push(...DemoTarget.point(m,[x*part.size[0]/2,y*part.size[1]/2,z*part.size[2]/2]))}const rotation=[0,Math.sin((player.yaw+Math.PI)/2),0,Math.cos((player.yaw+Math.PI)/2)];humanoid.freeSit(characterPhysics.rigidCharacter(player,hull,rotation,standingRootOffset),pose);characterPhysics.reset();}
      const candidate=Obstacles.seatCandidate(player.x,player.z,player.y,player.grounded,player.seatCooldown,!window.CombatMode?.enabled);
      if(!swordFrame.forceUp&&humanoid.seat(candidate,dt,held.has('Space'))){characterPhysics.reset();if(player.freeSit)player.seatPoseSnap=true;}
      const hazard=demoTools.hazardAt(player),now=performance.now()/1000;if(!mp.connected&&hazard&&now-lastHazardTime>=1){lastHazardTime=now;takeLocalDamage(hazard.kind==='kill'?100:10,hazard.kind==='kill')}
      placeRuntime.step(dt);if(player.y < (window.MapSelection?.rules?.killY??-40))diePlayer();
    }
    let autoLevel=10,appliedLevel=0,frameCost=16,scaleAt=0,lastDraw=0;
    // Use more of high-density displays; Automatic quality still scales down on slower devices.
    const touchDevice=matchMedia('(pointer: coarse)').matches;
    // Graphics Quality 1-10 is the ceiling; Automatic also drops below it while frames run slow.
    const {qualityLevel,renderScale,minFrameMs}=window.GameGraphicsQuality.create(()=>autoLevel);
    function resize() {
      appliedLevel=qualityLevel();const dpr=Math.min(window.devicePixelRatio||1,touchDevice?1.5:2)*renderScale();
      const w=Math.max(1,Math.round(canvas.clientWidth*dpr)), h=Math.max(1,Math.round(canvas.clientHeight*dpr));
      if(canvas.width!==w || canvas.height!==h){ canvas.width=w; canvas.height=h; }
      gl.viewport(0,0,w,h);
    }
    function swordModelFrame(rootFrame){return weaponFrameFor(rootFrame,r6Matrices,sword.getState().equipped,sword.getState().grip);}
    const {weaponFrameFor,classicFrameFor}=window.GameToolFrames.create({R6Animation,SwordData,SwordScript,TrowelData,carpetData,RocketData});
    function classicModelFrame(rootFrame,type){return classicFrameFor(rootFrame,r6Matrices,type,type==='bloxycola'&&bloxyColaController.getState().drinking)}
    function render() {
      resize();window.BillboardAttachments.begin(canvas);
      const renderY=player.freeSeated||carpet.active||player.seated||player.climbing?player.y:player.y+(player.visualStepOffset||0);
      const rootFrame=playerRootFrame(renderY+standingRootOffset),weaponFrame=playerDeath?null:swordModelFrame(rootFrame);
      const time=performance.now()/1000,ss=sword.getState();demoTarget.step(time,weaponFrame,{...ss,damage:ss.action==='Lunge'||time-activeSwordAt<.35?activeSwordDamage:ss.damage,attackSerial},player);scanRemoteSword(weaponFrame,ss,time);const outcome=demoTools.step(time,player,demoTarget,Obstacles,{frame:weaponFrame,serial:attackSerial,active:ss.equipped&&(ss.action==='Lunge'||time-ss.lastAttack<.35)},mp.remoteBoxes());if(outcome.playerDamage&&!mp.connected)takeLocalDamage(outcome.playerDamage,false,outcome.playerImpulse,outcome.exploded[0]?.center);for(const e of outcome.exploded)playToolAudio(RocketData.boomData,e.center);const dummy=demoTarget.getState(),toolState=demoTools.getState(time,true);if(lastDummyHealth>0&&dummy.health<=0)playCharacterSound('death');lastDummyHealth=dummy.health;
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      const cameraSeatKey=player.freeSit&&!player.physicsSitOnTouch?player.activeSeat?.buildKey:null;
      const head=playerDeath&&playerDeath.sim.getParts().find(p=>p.name==='Head'),cp=Math.cos(camera.pitch),baseFocus=head?[head.center[0],head.center[1]-.35,head.center[2]]:ClassicCamera.focus({x:player.x+(player.seatVisualOffset?.[0]||0),y:renderY+(player.seatVisualOffset?.[1]||0),z:player.z+(player.seatVisualOffset?.[2]||0)},standingRootOffset),target=baseFocus.slice(),settings=window.__localSettings&&window.__localSettings.getState();
      if(settings&&settings.shiftLocked&&!characterCamera.firstPerson()&&camera.distance>=1){const desiredTarget=[baseFocus[0]+Math.cos(camera.yaw)*1.75,baseFocus[1],baseFocus[2]-Math.sin(camera.yaw)*1.75],fShift=characterPhysics.clipCamera?characterPhysics.clipCamera(baseFocus,desiredTarget,cameraSeatKey):1,sShift=fShift<.999?Math.max(0,fShift-.03):1;target[0]=baseFocus[0]+(desiredTarget[0]-baseFocus[0])*sShift;target[2]=baseFocus[2]+(desiredTarget[2]-baseFocus[2])*sShift;}
      const viewDistance=characterCamera.firstPerson()?0:camera.distance,desiredEye=[target[0]+Math.sin(camera.yaw)*cp*viewDistance,target[1]+Math.sin(camera.pitch)*viewDistance,target[2]+Math.cos(camera.yaw)*cp*viewDistance];
      let effectiveDistance=viewDistance;if(viewDistance>.05&&characterPhysics.clipCamera){const fCam=characterPhysics.clipCamera(target,desiredEye,cameraSeatKey);if(fCam<.999)effectiveDistance=Math.max(.15,viewDistance*Math.max(0,fCam-.02));}
      const eye=[target[0]+Math.sin(camera.yaw)*cp*effectiveDistance,target[1]+Math.sin(camera.pitch)*effectiveDistance,target[2]+Math.cos(camera.yaw)*cp*effectiveDistance];if(characterCamera.firstPerson()){target[0]=eye[0]-Math.sin(camera.yaw)*cp;target[1]=eye[1]-Math.sin(camera.pitch);target[2]=eye[2]-Math.cos(camera.yaw)*cp;}cameraFocus=target;cameraEye=eye;
      const vp=multiply(perspective(Math.PI/3,canvas.width/canvas.height,0.1,800),lookAt(eye,target));
      gl.disableVertexAttribArray(pos);gl.disableVertexAttribArray(normal);window.Atmosphere.update(time);worldSky.draw(eye,camera,canvas.width/canvas.height,time,program);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal);window.Atmosphere.apply(gl,program);
      gl.uniformMatrix4fv(loc.uViewProjection,false,vp);
      gl.uniform3fv(loc.uCamera,eye);gl.uniform1f(loc.uAvatarOpacity,1);
      const visible=!swordMap&&!window.MapSelection?.isObby&&Math.hypot(player.x-dummy.center[0],player.y-dummy.center[1],player.z-dummy.center[2])<=100;
      window.BillboardAttachments.point(overhead,vp,...dummy.overhead,visible);
      if(visible&&overhead.dataset.health!==String(dummy.health)){overhead.dataset.health=String(dummy.health);const ratio=Math.max(0,Math.min(1,dummy.health/dummy.maxHealth));overheadHealth.hidden=ratio>=1;overheadHealth.setAttribute('aria-valuenow',String(dummy.health));overheadFill.style.width=`${ratio*100}%`;const color=window.RobloxHealthResearch.colorForPercent(ratio);overheadFill.style.backgroundColor=`rgb(${color.map(x=>Math.round(x*255)).join(',')})`; }
      if(!swordMap&&!window.MapSelection?.isObby&&!window.MapSelection?.isObby)box(plateSize,scene.baseplate.center,0,[0.46,0.65,0.43,1],true);
      staticWorld.draw(new Float32Array(vp),new Float32Array(eye),program,pos,normal);buildTools.draw(gl,vertices,vp,eye,program,pos,normal,boxFrame,R6Animation);placeRuntime.draw?.(gl,vertices,vp,eye,program,pos,normal,staticWorld);sharedTV.draw(vp,program,pos,normal);if(!carpetCollected)classicToolFrame('carpet0',R6Animation.yawFrame(...Obstacles.carpetPickup.center,0));
      for(const h of toolState.hazards)box(h.size,h.center,0,h.color);if(ribbonBatch){ribbonBatch.draw(toolState.walls.map(w=>({size:w.size,frame:R6Animation.qmatrix(w.rotation,w.center),color:w.color})),vp,eye,program);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal)}else for(const wall of toolState.walls)boxFrame(wall.size,R6Animation.qmatrix(wall.rotation,wall.center),wall.color);for(const rocket of toolState.rockets)draw(cube,gl.TRIANGLES,36,[1,1,3],null,0,[.08,.32,.9,1],true,Tools.projectileFrame(rocket));
      for(const rr of (window.__multiplayer?.rockets?.()||[]))draw(cube,gl.TRIANGLES,36,[1,1,3],null,0,[.08,.32,.9,1],true,Tools.projectileFrame(rr));
      // #4166: blocks the server decided are unsupported drop out of the sky.
      if(window.__buildFallFx&&window.__buildFallFx.length){const nowT=performance.now()/1000;for(let i=window.__buildFallFx.length-1;i>=0;i--){const f=window.__buildFallFx[i],age=nowT-f.start;if(age>1.6){window.__buildFallFx.splice(i,1);continue}const drop=-.5*38*age*age;box(f.size,[f.center[0],f.center[1]+drop,f.center[2]],age*1.9,f.color)}}
      // #4163: pink paint splatter the server broadcast (blocks + ground marks).
      {const pinkNow=window.__multiplayer?.pinkPaint?.();if(pinkNow&&pinkNow.parts.length)for(const sp of pinkNow.parts){const s=sp.size;if(!Array.isArray(s)||s.length!==3)continue;box([s[0]*1.02,s[1]*1.02,s[2]*1.02],sp.center,0,[1,.36,.72,1])}}
      if(!swordMap&&!window.MapSelection?.isObby&&dummy.health>0){
        for(const part of dummy.parts){if(part.name==='Head')linkedHeadFrame(R6Parts.headMeshScale,R6Animation.yawFrame(...part.center,Math.PI),[.78,.78,.78,1]);else box(part.size,part.center,0,[.55,.55,.58,1]);}
      }
      {
        for(const part of dummy.fallenParts){const model=R6Animation.qmatrix(part.rotation,part.center);if(part.name==='Head')linkedHeadFrame(R6Parts.headMeshScale,model,[.78,.78,.78,1]);else boxFrame(part.size,model,[.55,.55,.58,1]);}
      }
      if(!swordMap&&!window.MapSelection?.isObby&&!playerDeath&&player.y<8 && Math.abs(player.x)<plateHalfBounds[0] && Math.abs(player.z)<plateHalfBounds[2]){
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        draw(disk,gl.TRIANGLE_FAN,42,[1.6,1,1.1],[player.x,0.015,player.z],0,[0.10,0.18,0.11,0.22*(1-player.y/10)],false);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
      const localAvatarFrames=Object.fromEntries(Object.entries(r6Matrices).map(([n,m])=>[n,R6Animation.multiply(rootFrame,m)]));
      window.BillboardAttachments.frame(chatBubble,vp,localAvatarFrames.Head,!playerDeath&&chatBubble.dataset.active==='true',1.15);
      const b=R6Parts.parts,skin=[245/255,205/255,48/255,1],shirt=[13/255,105/255,172/255,1],trousers=[164/255,189/255,71/255,1];
      const baseOpacity=characterCamera.opacity(),effectiveOpacity=effectiveDistance<.55?0:effectiveDistance<1.2?Math.min(baseOpacity,(effectiveDistance-.55)/.65):baseOpacity;
      if(playerDeath){
        for(const part of playerDeath.sim.getParts()){
          const model=R6Animation.qmatrix(part.rotation,part.center),color=window.__avatarColors?.[part.name]||(part.name==='Torso'?shirt:part.name.includes('Leg')?trousers:skin);
          if(part.name==='Head'){avatarHead(window.__avatarAppearanceName,model,color);if(!removedHats.has('local'))avatarRenderer.accessories(window.__avatarAppearanceName,model)}else avatarBox(window.__avatarAppearanceName,part.name,part.size,model,color);
        }
      }else if(effectiveOpacity>0){
        gl.uniform1f(loc.uAvatarOpacity,effectiveOpacity);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);
        for(const [name,color] of [['Torso',shirt],['Left Arm',skin],['Right Arm',skin],['Left Leg',trousers],['Right Leg',trousers]])
          if(!limbs.missing('local',name))avatarBox(window.__avatarAppearanceName,name,b[name].size,R6Animation.multiply(rootFrame,r6Matrices[name]),window.__avatarColors?.[name]||color,localAvatarFrames);
        avatarHead(window.__avatarAppearanceName,R6Animation.multiply(rootFrame,r6Matrices.Head),window.__avatarColors?.Head||skin,localAvatarFrames);if(!removedHats.has('local'))avatarRenderer.accessories(window.__avatarAppearanceName,R6Animation.multiply(rootFrame,r6Matrices.Head),localAvatarFrames);
      }
      gl.uniform1f(loc.uAvatarOpacity,1);gl.disable(gl.BLEND);
      for(const part of limbs.parts('local')){const model=R6Animation.qmatrix(part.rotation,part.center),color=window.__avatarColors?.[part.name]||(part.name.includes('Leg')?trousers:skin);avatarBox(window.__avatarAppearanceName,part.name,part.size,model,color)}
      for(const hat of limbs.hats())avatarRenderer.accessoryAt(hat.appearance,hat.index,R6Animation.qmatrix(hat.rotation,hat.center));
      for(const drop of limbs.drops()){const model=R6Animation.qmatrix(drop.rotation,drop.center);if(drop.tool==='sword')linkedSwordFrame(model);else classicToolFrame(drop.tool==='carpet'?'carpet0':drop.tool,model)}
      if(!playerDeath){if(carpet.active){for(const f of carpet.frames(R6Animation,player,time))classicToolFrame(f.type,f.frame);}else if(window.__robloxBackpack.getState().equippedTool==='carpet')classicToolFrame('carpet0',classicModelFrame(rootFrame,'carpet'));if(weaponFrame)linkedSwordFrame(weaponFrame);const equippedTool=window.__robloxBackpack&&window.__robloxBackpack.getState().equippedTool;if(['paintball','slingshot','superball','timebomb','jetboots'].includes(equippedTool))window.DrawLegacyTool(equippedTool,classicModelFrame(rootFrame,equippedTool),boxFrame,R6Animation);if(equippedTool==='subspace'&&effectiveDistance>=ClassicCamera.source.firstPersonThreshold&&(!subspaceController||subspaceController.isReady(time)))classicToolFrame('subspace',classicModelFrame(rootFrame,'subspace'));if(['trowel','rocket','pistol','bloxycola','build','delete','paint','checker'].includes(equippedTool)&&effectiveDistance>=ClassicCamera.source.firstPersonThreshold)classicToolFrame(equippedTool,classicModelFrame(rootFrame,equippedTool));}
      proxyCollector=[];
      for(const r of mp.remotes.values()){
        if(!r.view)continue;
        const dx=r.rx-eye[0],dy=r.ry+2.5-eye[1],dz=r.rz-eye[2],w=vp[3]*r.rx+vp[7]*(r.ry+2.5)+vp[11]*r.rz+vp[15];
        r.visible=dx*dx+dy*dy+dz*dz<(r.fly?600*600:380*380)&&w>0&&Math.abs(vp[0]*r.rx+vp[4]*(r.ry+2.5)+vp[8]*r.rz+vp[12])<w+8&&Math.abs(vp[1]*r.rx+vp[5]*(r.ry+2.5)+vp[9]*r.rz+vp[13])<w+8;
        if(!r.visible)continue;
        const nearAvatar=dx*dx+dy*dy+dz*dz<220*220,requested=r.avatarUrl||r.avatarName,remState=avatarRenderer.ensureRemote?avatarRenderer.ensureRemote(requested,r.avatarAssets):{key:requested,state:avatarRenderer.ensure(requested)},ready=remState.state?.status==='ready',appearance=(r.detailed||nearAvatar)&&ready?remState.key:null,remoteColor=(name,fallback)=>(requested||r.avatarAssets?.length)&&!appearance?fallback:(r.colors?.[name]||fallback);
        r.avatarLoading=!!remState.loading;
        const root=remoteRootFrame(r),m=r.view.m;
        const remoteAvatarFrames=Object.fromEntries(Object.entries(m).map(([n,frame])=>[n,R6Animation.multiply(root,frame)]));r.labelHead=remoteAvatarFrames.Head;
        if(r.dead&&r.view.death){for(const part of r.view.death.getParts()){const model=R6Animation.qmatrix(part.rotation,part.center),color=remoteColor(part.name,part.name==='Torso'?shirt:part.name.includes('Leg')?trousers:skin);if(part.name==='Head'){if(appearance||r.detailed)avatarHead(appearance,model,color);else boxFrame([2,1,1],model,color);if((appearance||r.detailed)&&!removedHats.has(r.id))avatarRenderer.accessories(appearance,model)}else avatarBox(appearance,part.name,part.size,model,color)}}else{
         for(const [name,color] of [['Torso',shirt],['Left Arm',skin],['Right Arm',skin],['Left Leg',trousers],['Right Leg',trousers]])if(!limbs.missing(r.id,name))avatarBox(appearance,name,b[name].size,R6Animation.multiply(root,m[name]),remoteColor(name,color),remoteAvatarFrames);
         if(appearance||r.detailed)avatarHead(appearance,R6Animation.multiply(root,m.Head),remoteColor('Head',skin),remoteAvatarFrames);else boxFrame([2,1,1],R6Animation.multiply(root,m.Head),remoteColor('Head',skin));if((appearance||r.detailed)&&!removedHats.has(r.id))avatarRenderer.accessories(appearance,R6Animation.multiply(root,m.Head),remoteAvatarFrames);
         const remoteWeapon=weaponFrameFor(root,m,!!r.eq&&r.tool==='sword',r.gr);if(remoteWeapon){if(r.detailed)linkedSwordFrame(remoteWeapon);else boxFrame([.18,.18,3],remoteWeapon,[.7,.7,.73,1])}
         if(r.tool==='carpet'&&r.fly){for(const f of carpet.frames(R6Animation,{x:r.rx,y:r.ry,z:r.rz,yaw:r.ryaw,flightPitch:r.rpitch},time))classicToolFrame(f.type,f.frame)}else if(r.tool==='carpet')classicToolFrame('carpet0',classicFrameFor(root,m,'carpet'));else if(['paintball','slingshot','superball','timebomb','jetboots'].includes(r.tool)){window.DrawLegacyTool(r.tool,classicFrameFor(root,m,r.tool),boxFrame,R6Animation)}else if(r.tool==='subspace'){const frame=classicFrameFor(root,m,'subspace');if(r.detailed||extraGeometry.subspace?.loaded)classicToolFrame('subspace',frame);else window.SubspaceTripmine?.drawFallback(frame,boxFrame,R6Animation,1)}else if(r.tool==='bloxycola'){const frame=classicFrameFor(root,m,'bloxycola',!!r.colaDrink);if(r.detailed||extraGeometry.bloxycola?.loaded)classicToolFrame('bloxycola',frame);else window.BloxyCola.draw(frame,boxFrame,R6Animation)}else if(['rocket','trowel','pistol','build','delete','paint','checker'].includes(r.tool)){const frame=classicFrameFor(root,m,r.tool);if(r.detailed)classicToolFrame(r.tool,frame);else boxFrame(r.tool==='rocket'?[.5,.5,2]:[.3,.7,.4],frame,[.4,.43,.48,1])}
         if(r.detailed&&Date.now()<r.shieldUntil)shieldRenderer.draw(vp,camera,[r.rx,r.ry+2.5,r.rz],time);
        }
        for(const part of limbs.parts(r.id)){const model=R6Animation.qmatrix(part.rotation,part.center),color=remoteColor(part.name,part.name.includes('Leg')?trousers:skin);avatarBox(appearance,part.name,part.size,model,color)}
      }
      const proxyBoxes=proxyCollector;proxyCollector=null;if(proxyBoxes.length){if(ribbonBatch){ribbonBatch.draw(proxyBoxes,vp,eye,program);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal)}else for(const p of proxyBoxes)boxFrame(p.size,p.frame,p.color)}
      mp.drawLabels(vp,standingRootOffset+2.7,player,localAvatarFrames.Head);drawRemoteAvatarLoading(vp);worldSigns.draw(vp);
      const ribbons=carpet.ribbons(time);remoteTrailLastDraws=0;
      for(const remote of mp.remotes.values())if(remote.visible&&remote.view?.trail){const list=remote.view.trail.ribbons(time);ribbons.push(...list);remoteTrailLastDraws+=list.length}
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      if(ribbonBatch){ribbonBatch.draw(ribbons,vp,eye,program);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(normal);}else for(const r of ribbons)boxFrame(r.size,r.frame,r.color);
      gl.depthMask(true);gl.disable(gl.BLEND);
      if(!playerDeath&&time<forcefieldUntil)shieldRenderer.draw(vp,camera,[player.x,player.y+2.5,player.z],time);
      gun.refresh(time);for(const shot of gun.tracers()){const delta=shot.b.map((v,i)=>v-shot.a[i]),mid=shot.a.map((v,i)=>(v+shot.b[i])/2),m=Tools.projectileFrame({velocity:delta,position:mid});boxFrame([.07,.07,Math.hypot(...delta)],m,[1,.82,.12,.85])}
      subspaceController?.drawBursts(time,drawSubspaceMine,boxFrame,R6Animation);
      explosionRenderer.draw(vp,camera,toolState.explosions.concat(mp.effects()),time);
    }
    const stepMemory=new ArrayBuffer(384*65536), stepView=new DataView(stepMemory);
    const stepWorld=4096, demoHz=60, demoStep=1/demoHz;
    stepView.setUint8(9113092,1); stepView.setUint8(stepWorld+452,1);
    stepView.setFloat32(stepWorld+1592,demoHz,true);
    const stepStats={frames:0,totalTicks:0,lastTicks:0};let perfTime=0,perfFrames=0;const perfDisplay=document.getElementById('rbx-performance-stats');
    let remoteTrailLastDraws=0;const remoteHits=new Map(),pendingPickups=new Map();
    function scanRemoteSword(frame,ss,t){if(!frame||!ss.equipped||!attackSerial||!(ss.action==='Lunge'||t-activeSwordAt<.35))return;const a=DemoTarget.point(frame,[0,0,-1.98]),b=DemoTarget.point(frame,[0,0,2.39]);for(const p of mp.remoteBoxes())if(remoteHits.get(p.id)!==attackSerial&&DemoTarget.segmentBox(a,b,p,.5)){remoteHits.set(p.id,attackSerial);mp.sendHit(p.id)}}
    window.addEventListener('mp:gunhit',e=>{const v=e.detail,t=performance.now()/1000,isLocal=v.id===mp.selfId,r=isLocal?null:mp.remotes.get(v.id);if(!isLocal&&!r)return;const id=isLocal?'local':r.id,root=isLocal?playerRootFrame(player.y+standingRootOffset):remoteRootFrame(r),m=isLocal?r6Matrices:ensureRemoteView(r).m;if(v.severed&&m[v.part])limbs.cut(id,v.part,R6Animation.multiply(root,m[v.part]),t);if(v.part==='Head'&&!removedHats.has(id)){const appearance=isLocal?window.__avatarAppearanceName:r.avatarName,head=R6Animation.multiply(root,m.Head);for(const h of avatarRenderer.placements(appearance,head))limbs.dropHat(id,appearance,h.index,h.frame,t);removedHats.add(id)}if(v.dropped){const frame=isLocal?(v.dropped==='sword'?swordModelFrame(root):classicModelFrame(root,v.dropped)):(v.dropped==='sword'?weaponFrameFor(root,m,true,r.gr):classicFrameFor(root,m,v.dropped));limbs.drop(id,v.dropped,frame,t,v.dropKey);if(isLocal)window.__robloxBackpack.dropEquipped()}});
    window.addEventListener('mp:gunpickup',e=>{const d=e.detail||{};if(d.key)pendingPickups.delete(d.key);limbs.removeDrop(d.key);if(d.winner&&d.winner===mp.selfId&&d.tool)(window.__robloxBackpack.pickupTool||window.__robloxBackpack.grantTool)?.(d.tool,d.key)});
    window.addEventListener('mp:correction',e=>{const p=e.detail;if(playerDeath&&!p.hard)return;const mode=reconciliation.receive(p,player);if(mode!=='hard')return;
      if(player.freeSeated)characterPhysics.release(player.freeSeated);characterPhysics.reset();humanoid.reset();player.x=p.x;player.y=p.y;player.z=p.z;player.vy=0;player.seated=false;player.activeSeat=null;player.climbing=false;player.climbContact=null;player.grounded=p.ph==='ground';clickTarget=null;if(!p.fly)carpet.stop(player);
    });
    window.addEventListener('mp:combat',e=>{const v=e.detail;if(v.id!==mp.selfId){const r=mp.remotes.get(v.id);if(r&&v.dead)playCharacterSound('death',[r.rx,r.ry+2.5,r.rz]);return;}if(v.dead){if(!playerDeath)diePlayer(v.impulse||null,v.blastCenter||null)}else{if(playerDeath){if(Number.isFinite(v.x))Object.assign(spawn,{x:v.x,y:v.y,z:v.z,yaw:v.yaw||0});respawnPlayer()}localHealth=v.health;player.maxHealth=v.maxHealth||100;forcefieldUntil=performance.now()/1000+Math.max(0,(v.shieldUntil-Date.now())/1000);if(window.__robloxHudResearch)window.__robloxHudResearch.setHealth(localHealth,player.maxHealth||100,false,true)}});
    // #4166 kind: the server deletes the blocks and then sends one buildFall animation event.
    // Without this the blocks simply vanish instead of dropping.
    window.__buildFallFx = window.__buildFallFx || [];
    const FAIL_SIZES={block:[4,4,4],full:[3,3,3],tiny:[1,1,1],slab:[4,1,4],pillar:[1,4,1]};
    window.addEventListener('mp:build-fall',e=>{const d=e.detail||{};const now=performance.now()/1000;for(const b of (Array.isArray(d.blocks)?d.blocks:[])){
      if(!b||!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(b.z))continue;
      const size=FAIL_SIZES[b.variant]||[4,4,4];
      const col=/^#[a-f0-9]{6}$/i.test(b.color||'')?[1,3,5].map(k=>parseInt(b.color.slice(k,k+2),16)/255).concat(1):[.55,.55,.58,1];
      window.__buildFallFx.push({start:now,center:[b.x*4,b.y*4+size[1]/2,b.z*4],size,color:col});
      if(window.__buildFallFx.length>240)window.__buildFallFx.shift();
    }});
    window.addEventListener('mp:rocket-sound',e=>playToolAudio(RocketData.whooshData(),e.detail.point));
    window.addEventListener('mp:jump',e=>playCharacterSound('jump',e.detail.point));
    window.addEventListener('mp:blast',e=>{const pos=[e.detail.x,e.detail.y,e.detail.z],t=performance.now()/1000,isSubspace=e.detail.kind==='subspace';if(!(isSubspace&&subspaceController?.onBlast(e.detail,t)))playToolAudio(RocketData.boomData,pos);const blastR=e.detail.radius||Tools.demoOverride.blastRadius,blastP=e.detail.power||Tools.demoOverride.rocketImpulse;characterPhysics.explode(pos,blastR,blastP);if(!playerDeath&&!player.freeSeated&&(window.CombatMode?.enabled||window.MapSelection?.data?.combat||window.MapSelection?.data?.swordOnly)){const d=[player.x-pos[0],player.y+2.5-pos[1],player.z-pos[2]],dist=Math.hypot(...d);if(dist<blastR){d[1]+=blastR*.12;const n=Math.hypot(...d)||1,k=blastP*Math.pow(1-dist/blastR,2)/n;player.blastVelocity=[d[0]*k,0,d[2]*k];player.vy+=d[1]*k;player.grounded=false;player.groundGrace=0;}}demoTarget.explode(t,pos,blastR,Tools.demoOverride.rocketDamage);if(playerDeath)playerDeath.sim.blast(pos,blastP,blastR);for(const r of mp.remotes.values())if(r.dead&&r.view?.death)r.view.death.blast(pos,blastP,blastR)});
    window.addEventListener('mp:world-reset',()=>demoTools.reset());
    const receiveTrowel=v=>{demoTools.activate('trowel',null,{x:v.x,y:v.y,z:v.z,yaw:v.yaw},performance.now()/1000-Math.min(24,Math.max(0,(Date.now()-(v.createdAt||Date.now()))/1000)),{remote:true,wallId:v.wallId});if(Date.now()-(v.createdAt||Date.now())<2000)playToolAudio(TrowelData.buildSound,[v.x,v.y+2.5,v.z])};
    window.addEventListener('mp:trowel',e=>receiveTrowel(e.detail));for(const v of mp.trowelHistory.values())receiveTrowel(v);
    function ensureRemoteView(r){if(!r.view){const animator=R6Animation.create(R6AnimationData);r.view={animator,m:animator.step(0,0),trail:window.RainbowCarpet.create()};}return r.view;}
    window.addEventListener('mp:swing',e=>{const r=mp.remotes.get(e.detail.id);if(!r)return;ensureRemoteView(r).animator.triggerToolAction(e.detail.ta);playSwordSound(e.detail.ta==='Lunge'?'lunge':'slash',1,[r.rx,r.ry+2.5,r.rz]);});
    let detailAt=0;
    function updateRemotes(dt,phase,swordFrame){
      mp.update(dt);
      const clock=performance.now();if(clock-detailAt>250){detailAt=clock;const sorted=[...mp.remotes.values()].sort((a,b)=>(a.rx-player.x)**2+(a.ry-player.y)**2+(a.rz-player.z)**2-((b.rx-player.x)**2+(b.ry-player.y)**2+(b.rz-player.z)**2)),budget=Math.max(2,Math.round((navigator.maxTouchPoints>0?6:12)*qualityLevel()/10));for(let i=0;i<sorted.length;i++){const r=sorted[i];r.detailed=i<budget&&(r.rx-player.x)**2+(r.ry-player.y)**2+(r.rz-player.z)**2<160*160}}
      for(const r of mp.remotes.values()){const v=ensureRemoteView(r);v.elapsed=(v.elapsed||0)+dt;const near=(r.rx-player.x)**2+(r.ry-player.y)**2+(r.rz-player.z)**2<90*90;const interval=r.dead?(near?1/20:1/5):r.detailed?1/24:r.visible?1/12:1/4;if(v.elapsed<interval)continue;const remoteDt=Math.min(.25,v.elapsed);v.elapsed=0;if(v.wasDead&&!r.dead){limbs.reset(r.id);removedHats.delete(r.id)}if(!r.dead)limbs.sync(r.id,r.missing);v.wasDead=r.dead;if(r.dead){if(!v.death){const root=remoteRootFrame(r),snapshots=R6Death.names.filter(name=>!limbs.missing(r.id,name)).map(name=>{const m=R6Animation.multiply(root,v.m[name]);return{name,size:R6Parts.parts[name].size.slice(),center:m.slice(12,15),rotation:R6Animation.quat(m)}});v.death=R6Death.create(snapshots,r.blastCenter?[0,0,0]:r.impulse||[0,0,0],true);if(r.blastCenter)v.death.blast(r.blastCenter,Tools.demoOverride.rocketImpulse,Tools.demoOverride.blastRadius)}v.death.step(remoteDt,deathSurface,Obstacles.collisionParts,player)}else{v.death=null;const seatSnap=!!r.freeSit&&!!r.seatPoseSnap;v.m=v.animator.step(seatSnap?0.5:remoteDt,r.mv?(r.ph==='climb'?motionDefaults.walkSpeed*.7:motionDefaults.walkSpeed):0,1,{phase:r.ph,equipped:!r.freeSit&&!!r.eq,emote:seatSnap?null:r.emote&&window.R6EmoteData[r.emote]&&(window.R6EmoteData[r.emote].loop||performance.now()/1000-r.emoteStarted<window.R6EmoteData[r.emote].duration)?r.emote:null});if(seatSnap)r.seatPoseSnap=false;const remKey=avatarRenderer.ensureRemote?avatarRenderer.ensureRemote(r.avatarUrl||r.avatarName,r.avatarAssets).key:(r.avatarUrl||r.avatarName);v.m=avatarRenderer.rigPose(remKey,v.m,v.animator.state());if(r.visible&&r.fly&&r.tool==='carpet'&&qualityLevel()>3)v.trail.track({x:r.rx,y:r.ry,z:r.rz,yaw:r.ryaw,flightPitch:r.rpitch},performance.now()/1000);else v.trail.stop()}}
      const now=performance.now()/1000;limbs.step(dt,deathSurface,Obstacles.collisionParts,player,now);if(!playerDeath){const bp=window.__robloxBackpack,canTake=(tool,key)=>bp?.canPickupTool?bp.canPickupTool(tool,true,key):true;if(mp.connected&&limbs.peekCollect){const cand=limbs.peekCollect('local',player,now,(tool,key)=>(!key||!pendingPickups.has(key)||now-pendingPickups.get(key)>.4)&&canTake(tool,key));if(cand?.key){pendingPickups.set(cand.key,now);mp.sendDropPickup(cand.key)}}else{const picked=limbs.collect('local',player,now,canTake);if(picked)(bp.pickupTool||bp.grantTool)?.(picked.tool,picked.key)}}
      mp.sendPose({recoveryId:player.recoveryId,recoveryDone:player.recoveryDone,bodyRotation:player.physicsSitOnTouch?null:player.bodyRotation,freeSit:player.freeSit&&!player.physicsSitOnTouch,seatOffset:player.physicsSitOnTouch?null:player.seatVisualOffset,seatKey:player.freeSit&&!player.physicsSitOnTouch?(player.activeSeat?.buildKey||null):null,stateSerial:player.stateSerial,x:player.x,y:player.y,z:player.z,yaw:player.yaw,ph:phase,mv:player.moving&&(player.grounded||player.groundGrace>0||player.climbing),eq:window.__robloxBackpack.getState().equipped,gr:sword.getState().grip,tool:window.__robloxBackpack.getState().equippedTool,fly:carpet.active,pitch:carpet.active?player.flightPitch:0});
    }
    function frame(now) {
      if(document.hidden){lastFrame=now;requestAnimationFrame(frame);return;}
      const gap=minFrameMs();if(gap&&lastDraw&&now-lastDraw<gap-5){requestAnimationFrame(frame);return;}
      lastDraw=now;
      if(mp.sessionReplaced)return;
      const dt=lastFrame ? Math.min(.1,Math.max((now-lastFrame)/1000,0)) : 0; lastFrame=now;
      frameCost=frameCost*.97+dt*1000*.03;if(now-scaleAt>2000){scaleAt=now;if(frameCost>90)autoLevel=Math.max(1,autoLevel-3);else if(frameCost>45)autoLevel=Math.max(1,autoLevel-1);else if(frameCost<22)autoLevel=Math.min(10,autoLevel+1)}if(qualityLevel()!==appliedLevel)resize();
      eventQueue.drain(dispatchKeyboardRecord); // 485 queue control + restricted 3213 path
      consumeDemoInput(); // not the original gameplay consumer
      const ticks=Math.min(4,WorldSteps.plan(stepMemory,stepWorld,dt));
      stepStats.frames++; stepStats.totalTicks+=ticks; stepStats.lastTicks=ticks;
      const swordFrame=sword.tick(now/1000);if(queuedSword&&swordFrame.enabled&&swordFrame.equipped&&!playerDeath)activateSword();updateToolCursor(sword.getState());
      for(let i=0;i<ticks;i++){const parts=demoTools.getState(now/1000,true).walls;if(player.freeSeated)parts.push(player.freeSeated);window.NetworkPhysics.prepare(parts);characterPhysics.tick(demoStep,parts);update(demoStep,swordFrame);}window.NetworkPhysics.publish(demoTools.getState(now/1000,true).walls); // One Box3D world for characters, environment and loose bricks.
      if(playerDeath){playerDeath.sim.step(dt,deathSurface,Obstacles.collisionParts);if(!mp.connected&&now/1000>=playerDeath.respawnAt)respawnPlayer()}
      characterCamera.refresh();characterCamera.face(player);
      const phase=humanoid.phase(!!playerDeath,carpet.active);
      if(!playerDeath&&!player.freeSeated){const seatSnap=!!player.freeSit&&!!player.seatPoseSnap;r6Matrices=r6Animator.step(seatSnap?0.5:ticks*demoStep,player.climbing?player.climbSpeed:player.moving&&(player.grounded||player.groundGrace>0)?motionDefaults.walkSpeed:0,1,{phase,equipped:!player.freeSit&&!!(window.__robloxBackpack&&window.__robloxBackpack.getState().equipped),emote:seatSnap?null:window.__emotes.current(player,now/1000),gun:gun.animation(now/1000)});if(seatSnap)player.seatPoseSnap=false;}
      if(player.freeSeated)r6Matrices=player.freeSeatedPose;
      if(!playerDeath&&!player.freeSeated)r6Matrices=avatarRenderer.rigPose(window.__avatarAppearanceName,r6Matrices,r6Animator.state());
      updateRemotes(dt,phase,swordFrame);worldAudio.update();render();const settings=window.__localSettings&&window.__localSettings.getState();perfDisplay.hidden=!(settings&&settings.performance);if(!perfDisplay.hidden){perfTime+=dt;perfFrames++;if(perfTime>=.5){perfDisplay.textContent='FPS '+Math.round(perfFrames/perfTime)+'   Q'+qualityLevel()+'   '+canvas.width+' × '+canvas.height;perfTime=0;perfFrames=0}}else{perfTime=0;perfFrames=0}requestAnimationFrame(frame);
    }
    window.__baseplate = {
      getState:()=>({player:{...player},health:localHealth,forcefield:{active:!playerDeath&&performance.now()/1000<forcefieldUntil,expiresAt:forcefieldUntil},death:playerDeath?{dead:true,startedAt:playerDeath.startedAt,respawnAt:playerDeath.respawnAt,parts:playerDeath.sim.getParts()}:{dead:false,parts:[]},camera:{...camera,focus:cameraFocus.slice(),eye:cameraEye.slice(),firstPerson:camera.distance<ClassicCamera.source.firstPersonThreshold},clickTarget:clickTarget&&{...clickTarget},pointerLocked:document.pointerLockElement===canvas,characterSoundCounts:{...characterSoundCounts}}),
      kill:diePlayer, takeDamage:takeLocalDamage,
      getAnimationState:()=>({ ...r6Animator.state(),parts:Object.fromEntries(Object.entries(r6Matrices).map(([name,m])=>[name,m.slice(12,15)])),rightArmMatrix:r6Matrices['Right Arm'].slice(),source:'archived R6 keyframes; browser interpolation and demo movement' }),
      getSwordState:()=>({...sword.getState(),cursor:cursorKind,soundAttempts:swordSoundAttempts,lastSound:lastSwordSound,lastSoundVolume:lastSwordVolume,masterVolume:window.__localAudio?window.__localAudio.volume:.5}),
      getObstacleState:()=>({house:Obstacles.house,seats:Obstacles.seats,stairs:Obstacles.stairs,chair:Obstacles.chair,ladder:Obstacles.ladder,platform:Obstacles.platform,carpetPickup:Obstacles.carpetPickup,carpetCollected,carpetFlying:carpet.active,remoteTrailDraws:remoteTrailLastDraws,source:'authored browser demo; contacts and seat welding approximated'}),
      getTargetState:()=>demoTarget.getState(),getGunState:()=>gun.getState(),
      getToolsState:()=>({...demoTools.getState(performance.now()/1000),cola:bloxyColaController.getState(),textureLoaded:{trowel:extraGeometry.trowel.loaded,rocket:extraGeometry.rocket.loaded,bloxycola:extraGeometry.bloxycola.loaded}}),
      getGroundTarget:(x,y)=>groundTarget(x,y),
      getInputState:()=>({read:eventQueue.view.getInt32(MainQueue.layout.READ,true),
        write:eventQueue.view.getInt32(MainQueue.layout.WRITE,true),dropped:eventQueue.view.getInt32(MainQueue.layout.DROPPED,true),
        forwarded:inputTelemetry.forwarded,filtered:inputTelemetry.filtered,modifiers:eventQueue.view.getInt32(inputObject+176,true),
        objectUpdates:inputTelemetry.objectUpdates,objectDispatches:inputTelemetry.objectDispatches}),
      getInputObjectState:(physical)=>{const at=demoInputObjects.get(physical);return at===undefined?null:{state:eventQueue.view.getInt32(at+112,true),physical:eventQueue.view.getInt32(at+172,true),logical:eventQueue.view.getInt32(at+108,true),mask:eventQueue.view.getInt32(at+156,true),repeat:eventQueue.view.getInt32(at+176,true)};},
      getResearchState:()=>({
        sceneSource:'authored demo; not an extracted place',
        r6Model:{source:R6Parts.source,sha256:R6Parts.modelSha256,parts:R6Parts.parts,rig:'six Motor6Ds from candidate archive morpherEditorR6',rigSha256:R6AnimationData.rigSha256,colors:'demo noob palette'},
        r6Animation:{source:R6AnimationData.animateSource,sourceSha256:R6AnimationData.animateSourceSha256,walkAssetId:R6AnimationData.clips.walk.assetId,walkSha256:R6AnimationData.clips.walk.sha256,idleAssetId:R6AnimationData.clips.idle.assetId,interpolation:'browser adapter; Roblox Animator not recovered',jumpAssetId:AirClips.jump.assetId,fallAssetId:AirClips.fall.assetId,sitAssetId:ActionClips.sit.assetId,toolAssets:[ActionClips.toolnone.assetId,ActionClips.toolslash.assetId,ActionClips.toollunge.assetId]},
        headMesh:{source:LinkedHead.source,assetId:LinkedHead.assetId,sha256:LinkedHead.sha256,vertices:headGeometry.vertexCount,triangles:headGeometry.triangleCount,transform:'archived Motor6D rig plus demo heading'},
        ownerHeadMesh:{source:TargetHead.source,sha256:TargetHead.sha256,vertices:targetHeadGeometry.vertexCount,triangles:targetHeadGeometry.triangleCount,displayed:false},
        faceTexture:{sha256:R6Face.sha256,loaded:faceLoaded},
        plateTexture:{atlasPath:StudTexture.atlasPath,atlasSha256:StudTexture.atlasSha256,tileSha256:StudTexture.tileSha256,loaded:studTextureLoaded,rendering:'64x64 decoded tile repeated in WebGL; UV scale and lighting are adapters'},
        camera:{source:ClassicCamera.source,focus:'user-requested near-head-bottom R6 root plus 1.1 studs; 1142 source uses 1.5',input:'browser input scaling; no Roblox spring or occlusion',firstPerson:'0.5 minimum and hide avatar approximation'},
        swordCursor:{script:'Linked Sword MouseIcon LocalScript',readyPath:CursorData.readyPath,waitPath:CursorData.waitPath,imageSource:CursorData.source,readySha256:CursorData.readySha256,waitSha256:CursorData.waitSha256},
        linkedSword:{assetId:SwordData.assetId,meshAssetId:SwordMesh.assetId,meshSha256:SwordMesh.sha256,triangleCount:swordGeometry.triangleCount,textureSha256:SwordData.textureSha256,textureLoaded:swordTextureLoaded,grip:'archived R6 attachment and public Tool Grip plus observed -90 degree R6 weld; not yet traced in WASM',attack:'source-script timing, animations, sounds and Blow checks adapted; training-dummy contacts and damage are approximations'},
        playerDeath:{source:'documented Humanoid classic BreakJointsOnDeath and default five-second Players.RespawnTime',physics:'six independent browser-approximated parts; no original death or contact solver recovered'},
        dummyDisplay:{name:'Dummy',healthDisplay:'DisplayWhenDamaged; color and projection approximated',breakJointsOnDeath:'six authored falling parts; not the Roblox physics solver',occlusion:'not implemented'},
        runningHeight:{source:runningHeight.source,branch:runningHeight.branch,plateTop:demoPlateTop,standingRootOffset,plateTarget:runningFloorTarget,contact:'demo approximation; full walking physics not recovered'},
        motion:{...motionDefaults,humanoidSource:'1145 content/avatar/characterR6NoFace.rbxm Humanoid WalkSpeed and JumpPower',gravitySource:'documented Workspace default; place gravity not recovered',swordGlide:'authored airborne-only gravity reduction, no grounded launch or horizontal force; not a reconstructed BodyVelocity solver',integration:'Box3D WASM capsule mover; smooth bounded stair lift, swept contacts and plane sliding; not Roblox Humanoid physics'},
        plateSize:[...plateSize],shapeSize:[...shapeSize],halfBounds:[...plateHalfBounds],
        canCollide:plate.canCollide,spawnDefaults:spawnProperties.snapshot(),
        materialCode:scene.baseplate.material,materialField4:partBytes.getFloat32(primitiveAddress+452,true),
        shapeKind:partBytes.getUint8(primitiveAddress+339),volumeAndCenter:Block.volumeAndCenter(plateSize),
        stagedFiles:assetFS.snapshot().inline.length,
        faceQueryChecks,
        stepScheduler:{demoHz,capSetting:stepView.getInt32(9031000,true),frames:stepStats.frames,totalTicks:stepStats.totalTicks,lastTicks:stepStats.lastTicks,retained:stepView.getFloat32(stepWorld+228,true),dropped:stepView.getFloat32(stepWorld+284,true)},
        keyboardTrace:{keyW:Keyboard.fromLoaderDomCode('KeyW'),logicalW:Keyboard.logicalFromCode(Keyboard.fromLoaderDomCode('KeyW')),usableQueueEntries:MainQueue.layout.usable},
        limitations:'renderer, movement, world and physics are approximations'
      }),
      reset
    };
    window.__warmGraphics=()=>{detailAt=-Infinity;updateRemotes(.25,'ground',sword.getState());render();gl.finish()};
    window.JoiningScreen?.graphicsReady();
    requestAnimationFrame(frame);
  } catch (err) {
    console.error(err);window.JoiningScreen?.fail(err?.message||'Graphics could not be initialized.');
    showError('The offline baseplate could not start: '+(err && err.message ? err.message : String(err)));
  }
})();
