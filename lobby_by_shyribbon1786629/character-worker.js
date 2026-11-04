importScripts('vendor/fflate.js','r15-rig.js','character-mesh.js');
onmessage=async e=>{try{const result=await CharacterMesh.build(e.data);postMessage({result})}catch(error){postMessage({error:error.message||'Character import failed'})}};
