export const library = {
  hull: {name:'Hull',icon:'⬡',color:'#91a6b5',shape:[[-.65,1.6],[.65,1.6],[.65,-.6],[.3,-1.7],[-.3,-1.7],[-.65,-.6]],height:.65},
  wing: {name:'Swept wing',icon:'◿',color:'#afc3cd',shape:[[0,-.7],[2.2,.6],[2.3,1.2],[0,.65]],height:.16},
  engine: {name:'Engine',icon:'⊙',color:'#5b7d8a',shape:[[-.38,-.8],[.38,-.8],[.5,.7],[.3,1],[-.3,1],[-.5,.7]],height:.7},
  cockpit: {name:'Cockpit',icon:'◈',color:'#64ddd5',shape:[[-.35,.65],[.35,.65],[.25,-.5],[0,-.9],[-.25,-.5]],height:.42},
  cannon: {name:'Cannon',icon:'╎',color:'#ced5d4',shape:[[-.13,-1.4],[.13,-1.4],[.2,.65],[-.2,.65]],height:.25},
  cargo: {name:'Cargo pod',icon:'▤',color:'#bb975d',shape:[[-.55,-.9],[.55,-.9],[.55,.9],[-.55,.9]],height:.85},
  fin: {name:'Dorsal fin',icon:'◭',color:'#adbecc',shape:[[-.08,-.6],[.08,-.6],[.08,.8],[-.08,.8]],height:1.1},
  nozzle: {name:'Thruster core',icon:'◎',color:'#8ef1e4',shape:Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4)*.3,Math.sin(i*Math.PI/4)*.3]).reverse(),height:.12}
};
export function part(type,position=[0,0,0],scale=[1,1,1],mirror=false){return {id:crypto.randomUUID(),type,name:library[type].name,position,scale,rotation:[0,0,0],color:library[type].color,mirror};}
export function preset(name){
  if(name==='empty')return [];
  const list=[part('hull'),part('cockpit',[0,.48,-.55]),part('wing',[.5,-.05,.3],[1,1,1],true),part('engine',[.65,0,1.35],[1,1,1],true),part('cannon',[1.65,.08,.1],[1,1,1],true),part('fin',[0,.65,1],[1,.65,1])];
  if(name==='hauler'){list[0].scale=[1.3,1.4,1.4];list[2].scale=[.7,1,1];list.splice(4,1,part('cargo',[1,.1,.1],[1,1,1],true));}
  if(name==='scout'){list[2].scale=[.7,1,1.3];list.splice(4,2);list[0].scale=[.8,.8,1.2];}
  list.push(part('nozzle',[.65,0,2.37],[1,1,1],true));list.at(-1).rotation=[90,0,0];return list;
}
export function mesh(p,reflected=false){
  const spec=library[p.type],n=spec.shape.length;
  const vertices=[-1,1].flatMap(sign=>spec.shape.map(([x,z])=>[x,sign*spec.height/2,z]));
  const faces=[Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i)];
  for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);
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
  return {name:p.name+(reflected?' mirrored':''),vertices,faces,color:p.color};
}
export function meshes(parts){return parts.flatMap(p=>p.mirror?[mesh(p),mesh(p,true)]:[mesh(p)]);}
export function combined(parts){const result={vertices:[],faces:[],faceColors:[],color:'#91a6b5'};for(const m of meshes(parts)){const offset=result.vertices.length;result.vertices.push(...m.vertices);result.faces.push(...m.faces.map(f=>f.map(i=>i+offset)));result.faceColors.push(...m.faces.map(()=>m.color));}return result;}
export function validateProject(data){
  if(data?.version!==1||typeof data.name!=='string'||!Array.isArray(data.parts)||data.parts.length>150)throw Error('Invalid project or more than 150 parts.');
  for(const p of data.parts){
    if(!Object.hasOwn(library,p.type)||typeof p.name!=='string'||!/^#[0-9a-f]{6}$/i.test(p.color)||typeof p.mirror!=='boolean')throw Error('Invalid part data.');
    for(const field of ['position','rotation','scale'])if(!Array.isArray(p[field])||p[field].length!==3||p[field].some(v=>!Number.isFinite(v)||Math.abs(v)>100||(field==='scale'&&v<.05)))throw Error('Invalid part transform.');
  }
  return {version:1,name:data.name.slice(0,60),parts:data.parts.map(p=>({...p,id:crypto.randomUUID(),name:p.name.slice(0,60)}))};
}
export function objFiles(parts){let offset=1;const obj=['# Orbital Foundry | Y up, -Z forward','mtllib starship.mtl'],mtl=[];meshes(parts).forEach((m,j)=>{obj.push(`o part_${j}`,`usemtl material_${j}`,...m.vertices.map(v=>'v '+v.join(' ')));for(const f of m.faces)for(let i=1;i<f.length-1;i++)obj.push('f '+[f[0],f[i],f[i+1]].map(v=>v+offset).join(' '));offset+=m.vertices.length;mtl.push(`newmtl material_${j}`,`Kd ${[1,3,5].map(i=>parseInt(m.color.slice(i,i+2),16)/255).join(' ')}`,'');});return {obj:obj.join('\n'),mtl:mtl.join('\n')};}
export function gltf(parts){
  const doc={asset:{version:'2.0',generator:'Orbital Foundry'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],buffers:[],bufferViews:[],accessors:[]},chunks=[];let byteLength=0;
  const accessor=(values,bounds)=>{const array=new Float32Array(values),view=doc.bufferViews.length;chunks.push(new Uint8Array(array.buffer));doc.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:array.byteLength,target:34962});byteLength+=array.byteLength;const index=doc.accessors.length;doc.accessors.push({bufferView:view,componentType:5126,count:values.length/3,type:'VEC3',...bounds});return index;};
  meshes(parts).forEach((m,index)=>{const pos=[],norm=[];for(const f of m.faces)for(let i=1;i<f.length-1;i++){const tri=[m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]],u=tri[1].map((v,a)=>v-tri[0][a]),v=tri[2].map((v,a)=>v-tri[0][a]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n)||1;pos.push(...tri.flat());for(let k=0;k<3;k++)norm.push(...n.map(v=>v/length));}
    const min=[0,1,2].map(a=>Math.min(...m.vertices.map(v=>v[a]))),max=[0,1,2].map(a=>Math.max(...m.vertices.map(v=>v[a])));
    doc.meshes.push({name:m.name,primitives:[{attributes:{POSITION:accessor(pos,{min,max}),NORMAL:accessor(norm,{})},material:index}]});doc.materials.push({name:m.name,pbrMetallicRoughness:{baseColorFactor:[...[1,3,5].map(i=>{const s=parseInt(m.color.slice(i,i+2),16)/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}),1],metallicFactor:.35,roughnessFactor:.65}});doc.nodes.push({name:m.name,mesh:index});doc.scenes[0].nodes.push(index);
  });
  const bytes=new Uint8Array(byteLength);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));doc.buffers=[{byteLength,uri:'data:application/octet-stream;base64,'+btoa(binary)}];return doc;
}
