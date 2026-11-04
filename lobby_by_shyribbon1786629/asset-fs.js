/*
 * A narrow, single-threaded JavaScript port of four traced WebClient.wasm
 * asset-filesystem functions. This is NOT the renderer, physics, or engine.
 * See ANALYSIS.md in the demo for evidence and test limitations.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WasmAssetFS = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMIT = Object.freeze({path:255, baseUrl:511, assets:32768, inlineFiles:16, inlineBytes:4096, directories:256});
  const encoder = new TextEncoder();
  function cBytes(value) {
    const input = typeof value === 'string' ? encoder.encode(value) : Uint8Array.from(value || []);
    const zero = input.indexOf(0);
    return new Uint8Array(zero < 0 ? input : input.subarray(0, zero));
  }
  function same(a,b) {
    if (a.length !== b.length) return false;
    for (let i=0;i<a.length;i++) if (a[i]!==b[i]) return false;
    return true;
  }
  function normalizedDirectory(path) {
    if (!path.length || path[0] !== 47) return new Uint8Array(path);
    const components=[];
    let start=1;
    for (let i=1;i<=path.length;i++) {
      if (i!==path.length && path[i]!==47) continue;
      const part=path.subarray(start,i); start=i+1;
      if (!part.length || (part.length===1 && part[0]===46)) continue;
      if (part.length===2 && part[0]===46 && part[1]===46) { if (components.length) components.pop(); }
      else components.push(new Uint8Array(part));
    }
    const length=1+components.reduce((n,p)=>n+p.length,0)+Math.max(0,components.length-1);
    const out=new Uint8Array(length); out[0]=47; let offset=1;
    components.forEach((part,i)=>{ if(i) out[offset++]=47; out.set(part,offset); offset+=part.length; });
    return out;
  }
  class AssetFS {
    constructor() { this.assets=[]; this.inline=[]; this.directories=[]; this.baseUrl=new Uint8Array(); }
    // WASM function 278: append a fixed-width path + i32 size, or return -1.
    registerAsset(path, size) {
      if (this.assets.length >= LIMIT.assets) return -1;
      this.assets.push({path:cBytes(path).slice(0,LIMIT.path), size:size|0, dataPointer:0});
      return 0;
    }
    // WASM function 291: compare exact C-string bytes and update first match.
    preloadAsset(path, dataPointer, size) {
      const key=cBytes(path), item=this.assets.find(entry=>same(entry.path,key));
      if (!item) return -1;
      item.size=size|0; item.dataPointer=dataPointer|0;
      return 0;
    }
    // WASM function 289: strncpy(...,511), with a forced trailing NUL.
    setBaseUrl(url) { this.baseUrl=cBytes(url).slice(0,LIMIT.baseUrl); }
    // WASM function 279: 16 slots; each holds a 255-byte path and <=4096 bytes.
    addFile(path, data, size) {
      const input=Uint8Array.from(data || []);
      const n=(size === undefined ? input.length : size) >>> 0;
      if (n > LIMIT.inlineBytes || this.inline.length >= LIMIT.inlineFiles) return -1;
      if (n > input.length) throw new RangeError('Source buffer is shorter than size');
      const storedPath=cBytes(path).slice(0,LIMIT.path);
      this.inline.push({path:storedPath, data:input.slice(0,n)});
      let current=new Uint8Array(storedPath), slash=current.lastIndexOf(47);
      while (slash > 0) {
        current=current.slice(0,slash);
        const dir=normalizedDirectory(current);
        if (!this.directories.some(existing=>same(existing,dir)) && this.directories.length<LIMIT.directories)
          this.directories.push(dir);
        slash=current.lastIndexOf(47);
      }
      return 0;
    }
    snapshot() {
      return {
        assets:this.assets.map(x=>({path:Array.from(x.path),size:x.size,dataPointer:x.dataPointer})),
        inline:this.inline.map(x=>({path:Array.from(x.path),data:Array.from(x.data)})),
        directories:this.directories.map(x=>Array.from(x)),baseUrl:Array.from(this.baseUrl)
      };
    }
  }
  AssetFS.LIMIT=LIMIT;
  AssetFS.normalizeDirectory=normalizedDirectory;
  return AssetFS;
});
