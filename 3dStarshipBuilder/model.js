import {blockGeometry,specialHullGeometry,thrusterGeometry,cockpitGeometry,finGeometry,cannonGeometry} from './blocks.js';
export const cannonOptions={
  cannonBarrel:{classic:'Classic / original cannon',hexagonal:'Hexagonal',square:'Square',octagonal:'Octagonal'},
  cannonMuzzle:{none:'None',hexagonal:'Hexagonal',octagonal:'Octagonal',square:'Square'},
  cannonReceiver:{square:'Square',beveledSquare:'Beveled square',beveledParallelepiped:'Beveled parallelepiped',cylinder:'Cylinder'}
};
import {bevelGeometry} from './bevel.js';
export const finProfiles={
  classic:{name:'Classic / rectangular'},
  swept:{name:'Swept / fighter tail',outline:[[-.55,-.6],[-.55,.8],[.55,.95],[.55,.35]]},
  shark:{name:'Shark / pointed',outline:[[-.55,-.7],[-.55,.85],[.7,.6],[.35,.05]]},
  delta:{name:'Delta / triangular',outline:[[-.55,-.85],[-.55,.95],[.8,.75]]},
  clipped:{name:'Clipped / stealth',outline:[[-.55,-.65],[-.55,.85],[.35,.95],[.65,.6],[.65,.15]]},
  sail:{name:'Sail / tall rounded',outline:[[-.55,-.65],[-.55,.85],[.65,.7],[1,.35],[1,-.05],[.65,-.45]]}
};
export const cockpitProfiles={classic:{name:'Classic / original cockpit'},capsule:{name:'Capsule'},fighterCanopy:{name:'Fighter jet canopy'},almond:{name:'Almond shape'},industrialDiamond:{name:'Industrial diamond'},luxuryDiamond:{name:'Luxury diamond'}};
export const thrusterProfiles={classic:{name:'Classic / original engine'},drone:{name:'Drone / small conical exhaust'},reverseDrone:{name:'Reverse drone / front mount'},speeder:{name:'Speeder / twin exhaust'},hauler:{name:'Hauler / triangular triple exhaust'},carrier:{name:'Carrier / square quad exhaust'}};
export const wingProfiles = {
  swept: {name:'Swept / classic',shape:[[0,-.7],[2.2,.6],[2.3,1.2],[0,.65]]},
  straight: {name:'Straight / patrol',shape:[[0,-.7],[2.3,-.7],[2.3,.65],[0,.65]]},
  delta: {name:'Delta / interceptor',shape:[[0,-1.15],[2.3,1.05],[0,1.05]]},
  forward: {name:'Forward swept / experimental',shape:[[0,-.7],[2.3,-1.5],[2.3,-.85],[0,.65]]},
  tapered: {name:'Tapered / scout',shape:[[0,-.85],[2.3,-.25],[2.3,.25],[0,.85]]},
  clipped: {name:'Clipped / heavy fighter',shape:[[0,-.85],[1.65,-.3],[2.3,.35],[2.3,.7],[1.65,1],[0,.8]]}
};
export const hullProfiles = {
  research:{name:'Research ship / joined spheres',composite:true},
  swan:{name:'Swan / open wings',composite:true,legacy:true},
  axe:{name:'Axe / double round blade',composite:true,legacy:true},
  standard: {name:'Classic / tapered bow',shape:[[-.65,1.6],[.65,1.6],[.65,-.6],[.3,-1.7],[-.3,-1.7],[-.65,-.6]]},
  arrow: {name:'Arrowhead / interceptor',shape:[[-.85,1.6],[.85,1.6],[.5,-.5],[0,-1.7],[-.5,-.5]]},
  wedge: {name:'Wedge / destroyer',shape:[[-1.15,1.6],[1.15,1.6],[.18,-1.7],[-.18,-1.7]]},
  freighter: {name:'Box / freighter',shape:[[-.9,1.6],[.9,1.6],[.9,-1.7],[-.9,-1.7]]},
  diamond: {name:'Diamond / stealth',shape:[[0,1.6],[1.05,.1],[0,-1.7],[-1.05,.1]]},
  capsule: {name:'Capsule / cruiser',shape:[[-.45,1.6],[.45,1.6],[.8,1.15],[.8,-1.25],[.45,-1.7],[-.45,-1.7],[-.8,-1.25],[-.8,1.15]]}
};
export const library = {
  turret: {name:'Turret slot',icon:'⊕',color:'#91a6b5',composite:true},
  fighterBay: {name:'Fighter bay',icon:'⬡',color:'#8c9eac',composite:true},
  fuelPod: {name:'Fuel pod',icon:'◉',color:'#a16bd4',composite:true},
  shieldGenerator: {name:'Shield generator',icon:'◌',color:'#6aaec9',composite:true},
  passengerModule: {name:'Passenger module',icon:'▣',color:'#c0cbd2',composite:true},
  hull: {name:'Hull',icon:'⬡',color:'#91a6b5',shape:[[-.65,1.6],[.65,1.6],[.65,-.6],[.3,-1.7],[-.3,-1.7],[-.65,-.6]],height:.65},
  wing: {name:'Swept wing',icon:'◿',color:'#afc3cd',shape:[[0,-.7],[2.2,.6],[2.3,1.2],[0,.65]],height:.16},
  engine: {name:'Engine',icon:'⊙',color:'#5b7d8a',shape:[[-.38,-.8],[.38,-.8],[.5,.7],[.3,1],[-.3,1],[-.5,.7]],height:.7},
  cockpit: {name:'Cockpit',icon:'◈',color:'#64ddd5',shape:[[-.35,.65],[.35,.65],[.25,-.5],[0,-.9],[-.25,-.5]],height:.42},
  cannon: {name:'Cannon',icon:'╎',color:'#ced5d4',shape:[[-.13,-1.4],[.13,-1.4],[.2,.65],[-.2,.65]],height:.25},
  cargo: {name:'Cargo pod',icon:'▤',color:'#bb975d',composite:true},
  fin: {name:'Dorsal fin',icon:'◭',color:'#adbecc',shape:[[-.08,-.6],[.08,-.6],[.08,.8],[-.08,.8]],height:1.1},
  nozzle: {legacy:true,name:'Thruster core',icon:'◎',color:'#8ef1e4',shape:Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*.3,Math.sin(i*Math.PI/4)*.3]).reverse(),height:.12}
};
export function part(type,position=[0,0,0],scale=[1,1,1],mirror=false){return {id:crypto.randomUUID(),type,name:library[type].name,position,scale,rotation:[0,0,0],color:library[type].color,mirror};}
export {preset,presetCatalog} from './presets.js';
function extruded(spec){
  const n=spec.shape.length;
  const area=spec.shape.reduce((sum,[x,z],i)=>{const next=spec.shape[(i+1)%n];return sum+x*next[1]-next[0]*z;},0);
  const outline=area>0?[...spec.shape].reverse():spec.shape;
  const vertices=[-1,1].flatMap(sign=>outline.map(([x,z])=>[x,sign*spec.height/2,z]));
  const faces=[Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i)];
  for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);
  return {vertices,faces};
}
function hullGeometry(spec,p){
  const upper=p.upperChamfer??0,lower=p.lowerChamfer??0,taper=p.deckTaper??1;
  if(!upper&&!lower){const m=extruded(spec);for(const v of m.vertices)if(v[1]>0){v[0]*=taper;v[2]*=taper;}return m;}
  const area=spec.shape.reduce((sum,[x,z],i)=>{const next=spec.shape[(i+1)%spec.shape.length];return sum+x*next[1]-next[0]*z;},0);
  const outline=area>0?[...spec.shape].reverse():spec.shape,n=outline.length;
  // Separate cap and shoulder rings create actual bevel faces, not a shading effect.
  const levels=[[0,1-lower*.5]];
  if(lower)levels.push([lower,1+(taper-1)*lower]);
  if(upper)levels.push([1-upper,1+(taper-1)*(1-upper)]);
  levels.push([1,taper*(1-upper*.5)]);
  const vertices=levels.flatMap(([height,scale])=>outline.map(([x,z])=>[x*scale,(height-.5)*spec.height,z*scale]));
  const faces=[Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>(levels.length-1)*n+i)];
  for(let ring=0;ring<levels.length-1;ring++)for(let i=0;i<n;i++){const a=ring*n+i,b=ring*n+(i+1)%n;faces.push([a,b,b+n,a+n]);}
  return {vertices,faces};
}
export function mesh(p,reflected=false){
  const base=library[p.type];
  const hull=p.type==='hull'?hullProfiles[p.hullProfile||'standard']:null;
  const spec=hull?{...base,shape:hull.shape}:p.type==='wing'?{...base,shape:wingProfiles[p.wingProfile||'swept'].shape,height:p.wingThickness??.16}:base;
  const geometry=p.type==='cockpit'&&p.cockpitProfile&&p.cockpitProfile!=='classic'?cockpitGeometry(p.cockpitProfile,p.color):hull?.composite?specialHullGeometry(p.hullProfile,p.color):p.type==='engine'&&p.thrusterProfile&&p.thrusterProfile!=='classic'?thrusterGeometry(p.thrusterProfile,p.color):spec.composite?blockGeometry(p.type,p.color):extruded(spec);
  const selectedGeometry=p.type==='cannon'&&p.cannonBarrel&&p.cannonBarrel!=='classic'?cannonGeometry(p):hull&&!hull.composite?hullGeometry(spec,p):p.type==='fin'&&p.finProfile&&p.finProfile!=='classic'?finGeometry(finProfiles[p.finProfile].outline,p.color):geometry;
  const {vertices,faces,faceColors}=p.type==='cockpit'?bevelGeometry(selectedGeometry,p.cockpitBevel??0,p.color):selectedGeometry;
  if(p.type==='fin')for(const v of vertices){const height=v[1]+.55;v[0]=v[0]*(p.finThickness??.16)/.16+height*Math.tan((p.finCant??0)*Math.PI/180);v[2]+=height*Math.tan((p.finSweep??0)*Math.PI/180);}
  if(p.type==='wing')for(const v of vertices){v[2]+=v[0]*Math.tan((p.wingSweep??0)*Math.PI/180);v[1]+=v[0]*Math.tan((p.wingDihedral??0)*Math.PI/180);}
  const angles=p.rotation.map(v=>v*Math.PI/180);
  for(let i=0;i<vertices.length;i++){
    let [x,y,z]=vertices[i].map((v,a)=>v*p.scale[a]);
    let c=Math.cos(angles[0]),s=Math.sin(angles[0]);[y,z]=[y*c-z*s,y*s+z*c];
    c=Math.cos(angles[1]);s=Math.sin(angles[1]);[x,z]=[x*c+z*s,-x*s+z*c];
    c=Math.cos(angles[2]);s=Math.sin(angles[2]);[x,y]=[x*c-y*s,x*s+y*c];
    vertices[i]=[x+p.position[0],y+p.position[1],z+p.position[2]];
    if(reflected)vertices[i][0]*=-1;
  }
  if(reflected)faces.forEach(f=>f.reverse());
  return {name:p.name+(reflected?' mirrored':''),vertices,faces,color:p.color,faceColors};
}
export function meshes(parts){return parts.flatMap(p=>p.mirror?[mesh(p),mesh(p,true)]:[mesh(p)]);}
export function combined(parts){const result={vertices:[],faces:[],faceColors:[],color:'#91a6b5'};for(const m of meshes(parts)){const offset=result.vertices.length;result.vertices.push(...m.vertices);result.faces.push(...m.faces.map(f=>f.map(i=>i+offset)));result.faceColors.push(...m.faces.map((_,i)=>m.faceColors?.[i]||m.color));}return result;}
export function validateProject(data){
  if(data?.version!==1||typeof data.name!=='string'||!Array.isArray(data.parts)||data.parts.length>150)throw Error('Invalid project or more than 150 parts.');
  for(const p of data.parts){
    if(!Object.hasOwn(library,p.type)||typeof p.name!=='string'||!/^#[0-9a-f]{6}$/i.test(p.color)||typeof p.mirror!=='boolean')throw Error('Invalid part data.');
    if(p.type==='cannon')for(const [key,options] of Object.entries(cannonOptions))if(p[key]!==undefined&&!Object.hasOwn(options,p[key]))throw Error('Invalid cannon option.');
    if(p.type==='engine'&&p.thrusterProfile!==undefined&&!Object.hasOwn(thrusterProfiles,p.thrusterProfile))throw Error('Invalid thruster profile.');
    if(p.type==='cockpit'&&p.cockpitProfile!==undefined&&!Object.hasOwn(cockpitProfiles,p.cockpitProfile))throw Error('Invalid cockpit profile.');
    if(p.type==='cockpit'&&p.cockpitBevel!==undefined&&(!Number.isFinite(p.cockpitBevel)||p.cockpitBevel<0||p.cockpitBevel>.4))throw Error('Invalid cockpit bevel.');
    if(p.type==='fin'){
      if(p.finProfile!==undefined&&!Object.hasOwn(finProfiles,p.finProfile))throw Error('Invalid fin profile.');
      for(const [key,min,max] of [['finSweep',-35,35],['finCant',-45,45],['finThickness',.04,.4]])if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<min||p[key]>max))throw Error('Invalid fin geometry.');
    }
    if(p.type==='hull'&&((p.hullProfile!==undefined&&!Object.hasOwn(hullProfiles,p.hullProfile))||(p.deckTaper!==undefined&&(!Number.isFinite(p.deckTaper)||p.deckTaper<.35||p.deckTaper>1))))throw Error('Invalid hull options.');
    if(p.type==='hull')for(const key of ['upperChamfer','lowerChamfer'])if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<0||p[key]>.4))throw Error('Invalid hull chamfer.');
    if(p.type==='wing'){
      if(p.wingProfile!==undefined&&!Object.hasOwn(wingProfiles,p.wingProfile))throw Error('Invalid wing profile.');
      for(const [key,min,max] of [['wingSweep',-35,35],['wingDihedral',-45,45],['wingThickness',.04,.6]])if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<min||p[key]>max))throw Error('Invalid wing geometry.');
    }
    for(const field of ['position','rotation','scale'])if(!Array.isArray(p[field])||p[field].length!==3||p[field].some(v=>!Number.isFinite(v)||Math.abs(v)>(field==='rotation'?360:100)||(field==='scale'&&v<.05)))throw Error('Invalid part transform.');
  }
  return {version:1,name:data.name.slice(0,60),parts:data.parts.map(p=>({...p,id:crypto.randomUUID(),name:p.name.slice(0,60)}))};
}
function surfaces(m){const groups=new Map();m.faces.forEach((f,i)=>{const color=m.faceColors?.[i]||m.color;if(!groups.has(color))groups.set(color,[]);groups.get(color).push(f);});return groups;}
export function objFiles(parts){let offset=1;const obj=['# Starship builder | Y up, -Z forward','mtllib starship.mtl'],mtl=[];meshes(parts).forEach((m,j)=>{obj.push(`o part_${j}`,...m.vertices.map(v=>'v '+v.join(' ')));let k=0;for(const [color,faces] of surfaces(m)){const name=`material_${j}_${k++}`;obj.push(`usemtl ${name}`);for(const f of faces)for(let i=1;i<f.length-1;i++)obj.push('f '+[f[0],f[i],f[i+1]].map(v=>v+offset).join(' '));mtl.push(`newmtl ${name}`,`Kd ${[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).join(' ')}`,'');}offset+=m.vertices.length;});return {obj:obj.join('\n'),mtl:mtl.join('\n')};}
export function gltf(parts){
  const doc={asset:{version:'2.0',generator:'Starship builder'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],buffers:[],bufferViews:[],accessors:[]},chunks=[];let byteLength=0;
  const accessor=(values,bounds)=>{const array=new Float32Array(values),view=doc.bufferViews.length;chunks.push(new Uint8Array(array.buffer));doc.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:array.byteLength,target:34962});byteLength+=array.byteLength;const index=doc.accessors.length;doc.accessors.push({bufferView:view,componentType:5126,count:values.length/3,type:'VEC3',...bounds});return index;};
  meshes(parts).forEach((m,index)=>{const primitives=[];for(const [color,faces] of surfaces(m)){const pos=[],norm=[];for(const f of faces)for(let i=1;i<f.length-1;i++){const tri=[m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]],u=tri[1].map((v,a)=>v-tri[0][a]),v=tri[2].map((v,a)=>v-tri[0][a]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n)||1;pos.push(...tri.flat());for(let k=0;k<3;k++)norm.push(...n.map(v=>v/length));}
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];pos.forEach((v,i)=>{min[i%3]=Math.min(min[i%3],v);max[i%3]=Math.max(max[i%3],v);});
    primitives.push({attributes:{POSITION:accessor(pos,{min,max}),NORMAL:accessor(norm,{})},material:doc.materials.length});doc.materials.push({name:m.name,pbrMetallicRoughness:{baseColorFactor:[...[1,3,5].map(i=>{const s=parseInt(color.slice(i,i+2),16)/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}),1],metallicFactor:.35,roughnessFactor:.65}});}
    doc.meshes.push({name:m.name,primitives});doc.nodes.push({name:m.name,mesh:index});doc.scenes[0].nodes.push(index);
  });
  const bytes=new Uint8Array(byteLength);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));doc.buffers=[{byteLength,uri:'data:application/octet-stream;base64,'+btoa(binary)}];return doc;
}
