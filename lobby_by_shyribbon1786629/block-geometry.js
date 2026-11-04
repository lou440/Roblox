/* Selected RBX::Block geometry operations translated from WebClient.wasm.
 * These calculate a half-diagonal and rotated half-extents; they are not a
 * collision solver or renderer. Values follow the original f32 arithmetic.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.WasmBlockGeometry=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const f=Math.fround;
  function size3(size){if(!size || size.length!==3)throw new TypeError('size must contain three floats');return Array.from(size,f)}
  // Function 114617: copy the three raw float32 words to geometry offsets 4..15.
  function copySize(buffer,geometryAddress,vectorAddress){
    const view=new DataView((typeof WebAssembly!=='undefined' && buffer instanceof WebAssembly.Memory)?buffer.buffer:buffer);
    const a=vectorAddress>>>0,g=geometryAddress>>>0;
    const x=view.getUint32(a,true),y=view.getUint32(a+4,true),z=view.getUint32(a+8,true);
    view.setUint32(g+12,z,true);view.setUint32(g+4,x,true);view.setUint32(g+8,y,true);
  }
  // Function 144450: half the Euclidean diagonal, with f32 rounding per opcode.
  function halfDiagonal(size){
    const [x,y,z]=size3(size);
    const sum=f(f(f(y*y)+f(x*x))+f(z*z));
    return f(f(Math.sqrt(sum))*0.5);
  }
  // Function 144407: extents of a rotated block, excluding its translation.
  // rotation is a row-major 3x3 matrix of f32 values.
  function rotatedHalfExtents(size,rotation){
    if(!rotation || rotation.length!==9)throw new TypeError('rotation must contain nine floats');
    const [x,y,z]=size3(size),m=Array.from(rotation,f),hx=f(x*0.5),hy=f(y*0.5),hz=f(z*0.5);
    const mul=(a,b)=>f(Math.abs(a)*b);
    return [
      f(mul(m[2],hz)+f(mul(m[1],hy)+mul(m[0],hx))),
      f(mul(m[5],hz)+f(mul(m[3],hx)+mul(m[4],hy))),
      f(mul(m[8],hz)+f(mul(m[6],hx)+mul(m[7],hy)))
    ];
  }
  // Functions 114363/138148/143512 on a kind-2 primitive without custom
  // shape data: volume and center vector. Other shape kinds are not covered.
  function volumeAndCenter(size){
    const minimum=f(0.05),dims=size3(size).map(v=>v>minimum?v:minimum);
    const [x,y,z]=dims,volume=f(z*f(y*x));
    return [volume,f(x*0),f(y*0),f(z*0)];
  }
  // Functions 144440 and 144437 for Block kind 0: eight indexed corners.
  function vertex(size,index){
    if(!Number.isInteger(index)||index<0||index>=8)throw new RangeError('Block vertex index must be 0..7');
    const xyz=size3(size),bits=new DataView(new ArrayBuffer(4));
    return xyz.map((v,axis)=>{
      bits.setFloat32(0,f(v*0.5),true);
      if(index & (4>>axis))bits.setUint32(0,bits.getUint32(0,true)|0x80000000,true);
      return bits.getFloat32(0,true);
    });
  }
  // Block face order recovered from segment 1378 and function 144442. Each
  // row is a four-vertex perimeter; no renderer triangulation is inferred.
  const faces=Object.freeze([[1,0,2,3],[1,5,4,0],[0,4,6,2],[4,5,7,6],[7,3,2,6],[5,1,3,7]].map(Object.freeze));
  function faceVertexIndices(face){
    if(!Number.isInteger(face)||face<0||face>=6)throw new RangeError('Block face index must be 0..5');
    return faces[face].slice();
  }
  function faceVertices(size,face){return faceVertexIndices(face).map(index=>vertex(size,index))}
  // Functions 144424/144444 and the Block normal table in segment 1378.
  // A plane is [normal.x, normal.y, normal.z, distance].
  const normals=Object.freeze([[1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1]].map(Object.freeze));
  function facePlane(size,face){
    if(face===-1)return [0,1,0,0];
    if(!Number.isInteger(face)||face<0||face>=6)throw new RangeError('Block face index must be -1 or 0..5');
    const dimensions=size3(size);
    return [...normals[face],f(dimensions[face%3]*0.5)];
  }
  // Connect the two traced Block virtual methods to the detached primitive
  // size port. The remaining engine callbacks are supplied explicitly.
  function detachedSizeHooks(buffer,callbacks={}){
    const view=new DataView((typeof WebAssembly!=='undefined' && buffer instanceof WebAssembly.Memory)?buffer.buffer:buffer);
    const checkBlock=g=>{
      if(view.getUint32(g,true)!==8074444)throw new Error('geometry is not the traced RBX::Block vtable');
    };
    return {
      geometrySet(g,size){
        checkBlock(g);
        view.setFloat32(g+12,size[2],true);
        view.setFloat32(g+4,size[0],true);
        view.setFloat32(g+8,size[1],true);
      },
      geometryMeasure(g,size){checkBlock(g);return halfDiagonal(size)},
      call114418:callbacks.call114418,
      call114374:callbacks.call114374
    };
  }
  return {copySize,halfDiagonal,rotatedHalfExtents,volumeAndCenter,vertex,vertexCount:8,faceCount:6,faceVertexIndices,faceVertices,facePlane,detachedSizeHooks};
});
