import {blockGeometry,specialHullGeometry,thrusterGeometry,cockpitGeometry} from './blocks.js';
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
  swan:{name:'Swan / open wings',composite:true},
  axe:{name:'Axe / double round blade',composite:true},
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
  cargo: {name:'Cargo pod',icon:'▤',color:'#bb975d',shape:[[-.55,-.9],[.55,-.9],[.55,.9],[-.55,.9]],height:.85},
  fin: {name:'Dorsal fin',icon:'◭',color:'#adbecc',shape:[[-.08,-.6],[.08,-.6],[.08,.8],[-.08,.8]],height:1.1},
  nozzle: {legacy:true,name:'Thruster core',icon:'◎',color:'#8ef1e4',shape:Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*.3,Math.sin(i*Math.PI/4)*.3]).reverse(),height:.12}
};
export function part(type,position=[0,0,0],scale=[1,1,1],mirror=false){return {id:crypto.randomUUID(),type,name:library[type].name,position,scale,rotation:[0,0,0],color:library[type].color,mirror};}
export const presetCatalog={
  fighter:{name:'Peregrine MK I',label:'Peregrine / Fighter',description:'A compact fighter with paired cannons and swept wings.'},
  interceptor:{name:'Kestrel Interceptor',label:'Kestrel / Interceptor',description:'Six small thrusters, four wings in an X configuration and paired forward cannons.'},
  hauler:{name:'Atlas MK I',label:'Atlas / Hauler',description:'A light hauler with two cargo pods.'},
  scout:{name:'Wisp MK I',label:'Wisp / Scout',description:'A small, unarmed scout with a narrow hull.'},
  carrier:{name:'Bastion Carrier',label:'Bastion / Carrier',description:'Four side-facing fighter bays, four defense turrets and a shield generator.'},
  megaCargo:{name:'Mammoth Mega Cargo',label:'Mammoth / Mega Cargo',description:'Eight oversized cargo pods, four fuel canisters and heavy engines.'},
  explorer:{name:'Odyssey Deep Space Explorer',label:'Odyssey / Deep Space Explorer',description:'Four enlarged fuel tanks, oversized thrusters, shields and a crew cabin.'},
  cruise:{name:'Aurora Luxury Cruise',label:'Aurora / Luxury Cruise',description:'Eight passenger modules for 96 passenger equivalents, with shields and gold-trimmed wings.'},
  empty:{name:'Untitled ship',label:'Empty hangar',description:'Start a new ship from individual modules.'}
};
function rolePreset(role){
  const list=[];
  const add=(type,position,scale=[1,1,1],mirror=false,options={})=>{const p=Object.assign(part(type,position,scale,mirror),options);list.push(p);return p;};
  const engines=(x,z,scale)=>{
    add('engine',[x,0,z],scale,true);
  };
  if(role==='interceptor'){
    add('hull',[0,0,0],[.8,.65,1.1],false,{hullProfile:'arrow',deckTaper:.7,color:'#9aaec3'});
    add('cockpit',[0,.35,-.85],[.8,.75,1.05]);
    for(const side of [-1,1])add('wing',[.4,side*.18,.25],[.85,1,.85],true,{wingProfile:'swept',wingDihedral:side*20,color:'#d0a357',name:side>0?'Upper interceptor wing':'Lower interceptor wing'});
    for(const [x,y,z] of [[.45,0,1.8],[1.2,.42,1.5],[1.2,-.42,1.5]]){
      add('engine',[x,y,z],[.55,.55,.65],true,{name:'Small interceptor thruster'});
    }
    add('cannon',[.65,0,-.75],[.65,.65,.85],true);
  }
  if(role==='carrier'){
    add('hull',[0,0,0],[1.5,2.2,2.4],false,{hullProfile:'freighter',deckTaper:.8,color:'#697f99'});
    add('cockpit',[0,1,-2.6],[1.6,1.2,1.5]);
    for(const z of [-1.7,1.7])add('fighterBay',[2.1,0,z],[1,1,1],true,{rotation:[0,90,0],color:'#bcc9d2'});
    for(const z of [-2,2])add('turret',[.8,.85,z],[.8,.8,.8],true);
    add('shieldGenerator',[0,.9,0]);
    add('wing',[1.2,-.35,2.4],[.65,1.5,1],true,{wingProfile:'clipped',color:'#697f99'});
    add('fuelPod',[.75,-1,1],[1,1,1],true);
    engines(.85,4.2,[1.4,1.4,1.5]);
  }
  if(role==='megaCargo'){
    add('hull',[0,0,0],[1.4,2,3],false,{hullProfile:'freighter',color:'#7b8589'});
    add('cockpit',[0,1,-4.2],[1.7,1.3,1.5]);
    for(const z of [-3.3,-1.1,1.1,3.3])add('cargo',[2,0,z],[1.3,1.5,1.1],true,{color:'#c59852'});
    for(const z of [-2,2])add('fuelPod',[3.3,0,z],[1.1,1.1,1.4],true);
    add('wing',[1,-.4,3.2],[1.2,1.5,1],true,{wingProfile:'straight',color:'#7b8589'});
    engines(1,5.2,[1.8,1.8,1.8]);
  }
  if(role==='explorer'){
    add('hull',[0,0,0],[1.1,1.4,2.1],false,{hullProfile:'capsule',deckTaper:.7,color:'#d2d9d9'});
    add('cockpit',[0,.65,-2.6],[1.3,1.3,1.4]);
    for(const z of [-1.6,1.6])add('fuelPod',[1.5,0,z],[1.3,1.3,1.2],true);
    add('passengerModule',[0,.85,.4],[.85,.75,1]);
    add('shieldGenerator',[0,.75,2.2],[.8,.8,.8]);
    add('wing',[.7,-.3,1.3],[1.25,1,1.2],true,{wingProfile:'tapered',wingDihedral:10,color:'#ce9f54'});
    engines(1.7,3.9,[1.8,1.8,2]);
  }
  if(role==='cruise'){
    add('hull',[0,0,0],[1.65,1.7,3.7],false,{hullProfile:'capsule',deckTaper:.75,color:'#e4ded0'});
    add('cockpit',[0,.85,-5.4],[1.8,1.4,1.6]);
    for(const z of [-3.9,-1.3,1.3,3.9])add('passengerModule',[1.7,.35,z],[1.2,1.25,1],true,{color:'#e9e0cb'});
    add('shieldGenerator',[0,.8,0],[1.5,1,1.5],false,{color:'#cba65e'});
    add('fuelPod',[.8,-.8,3],[1.1,1.1,1.5],true);
    add('wing',[1,-.35,4],[1.3,1.2,1],true,{wingProfile:'swept',color:'#cba65e'});
    engines(.85,6.1,[1.5,1.5,1.6]);
  }
  return list;
}
export function preset(name){
  if(name==='empty')return [];
  if(['interceptor','carrier','megaCargo','explorer','cruise'].includes(name))return rolePreset(name);
  const list=[part('hull'),part('cockpit',[0,.48,-.55]),part('wing',[.5,-.05,.3],[1,1,1],true),part('engine',[.65,0,1.35],[1,1,1],true),part('cannon',[1.65,.08,.1],[1,1,1],true),part('fin',[0,.65,1],[1,.65,1])];
  if(name==='hauler'){list[0].scale=[1.3,1.4,1.4];list[2].scale=[.7,1,1];list.splice(4,1,part('cargo',[1,.1,.1],[1,1,1],true));}
  if(name==='scout'){list[2].scale=[.7,1,1.3];list.splice(4,2);list[0].scale=[.8,.8,1.2];}
  return list;
}
function extruded(spec){
  const n=spec.shape.length;
  const area=spec.shape.reduce((sum,[x,z],i)=>{const next=spec.shape[(i+1)%n];return sum+x*next[1]-next[0]*z;},0);
  const outline=area>0?[...spec.shape].reverse():spec.shape;
  const vertices=[-1,1].flatMap(sign=>outline.map(([x,z])=>[x,sign*spec.height/2,z]));
  const faces=[Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i)];
  for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);
  return {vertices,faces};
}
export function mesh(p,reflected=false){
  const base=library[p.type];
  const hull=p.type==='hull'?hullProfiles[p.hullProfile||'standard']:null;
  const spec=hull?{...base,shape:hull.shape}:p.type==='wing'?{...base,shape:wingProfiles[p.wingProfile||'swept'].shape,height:p.wingThickness??.16}:base;
  const geometry=p.type==='cockpit'&&p.cockpitProfile&&p.cockpitProfile!=='classic'?cockpitGeometry(p.cockpitProfile,p.color):hull?.composite?specialHullGeometry(p.hullProfile,p.color):p.type==='engine'&&p.thrusterProfile&&p.thrusterProfile!=='classic'?thrusterGeometry(p.thrusterProfile,p.color):spec.composite?blockGeometry(p.type,p.color):extruded(spec);
  const {vertices,faces,faceColors}=geometry;
  if(hull&&!hull.composite)for(const v of vertices)if(v[1]>0){v[0]*=p.deckTaper??1;v[2]*=p.deckTaper??1;}
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
    if(p.type==='engine'&&p.thrusterProfile!==undefined&&!Object.hasOwn(thrusterProfiles,p.thrusterProfile))throw Error('Invalid thruster profile.');
    if(p.type==='cockpit'&&p.cockpitProfile!==undefined&&!Object.hasOwn(cockpitProfiles,p.cockpitProfile))throw Error('Invalid cockpit profile.');
    if(p.type==='hull'&&((p.hullProfile!==undefined&&!Object.hasOwn(hullProfiles,p.hullProfile))||(p.deckTaper!==undefined&&(!Number.isFinite(p.deckTaper)||p.deckTaper<.35||p.deckTaper>1))))throw Error('Invalid hull options.');
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
