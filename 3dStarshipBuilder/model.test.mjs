import {test} from 'node:test';
import assert from 'node:assert/strict';
import {library,hullProfiles,wingProfiles,part,mesh,preset,meshes,gltf,objFiles,validateProject} from './model.js';
test('wing profiles remain solid across sweep, dihedral and thickness limits',()=>{
  for(const wingProfile of Object.keys(wingProfiles))for(const wingSweep of [-35,0,35])for(const wingDihedral of [-45,0,45])for(const wingThickness of [.04,.6])for(const mirrored of [false,true]){
    const p={...part('wing'),wingProfile,wingSweep,wingDihedral,wingThickness},m=mesh(p,mirrored),center=[0,1,2].map(a=>m.vertices.reduce((s,v)=>s+v[a],0)/m.vertices.length);
    for(const f of m.faces){const [a,b,c]=f.map(i=>m.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(n.reduce((s,v,i)=>s+v*(a[i]-center[i]),0)>0,wingProfile);}
    const restored=validateProject(JSON.parse(JSON.stringify({version:1,name:'Wing',parts:[p]}))).parts[0];assert.deepEqual(mesh(restored).vertices,mesh(p).vertices);
    const doc=gltf([p]),bytes=Buffer.from(doc.buffers[0].uri.split(',')[1],'base64'),a=doc.accessors[doc.meshes[0].primitives[0].attributes.POSITION],view=doc.bufferViews[a.bufferView];
    const expected=m.faces.reduce((n,f)=>n+(f.length-2)*3,0);assert.equal(a.count,expected);for(let i=view.byteOffset;i<view.byteOffset+view.byteLength;i+=4)assert.ok(Number.isFinite(bytes.readFloatLE(i)));assert.equal((objFiles([p]).obj.match(/^f /gm)||[]).length,expected/3);
  }
  const legacy=part('wing');assert.deepEqual(mesh(legacy).vertices,mesh({...legacy,wingProfile:'swept',wingSweep:0,wingDihedral:0,wingThickness:.16}).vertices);
  for(const bad of [{wingProfile:'bad'},{wingProfile:'__proto__'},{wingSweep:36},{wingDihedral:-46},{wingThickness:0},{wingThickness:'0.16'}])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...legacy,...bad}]}));
});
test('hull profiles and taper stay outward, persist and export',()=>{
  for(const hullProfile of Object.keys(hullProfiles).filter(key=>!hullProfiles[key].composite))for(const deckTaper of [.35,.7,1])for(const reflected of [false,true]){
    const p={...part('hull'),hullProfile,deckTaper},m=mesh(p,reflected);
    const center=[0,1,2].map(a=>m.vertices.reduce((sum,v)=>sum+v[a],0)/m.vertices.length);
    for(const f of m.faces){const [a,b,c]=f.map(i=>m.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(n.reduce((s,v,i)=>s+v*(a[i]-center[i]),0)>0,hullProfile);}
    const restored=validateProject(JSON.parse(JSON.stringify({version:1,name:'Hull',parts:[p]}))).parts[0];assert.equal(restored.hullProfile,hullProfile);assert.equal(restored.deckTaper,deckTaper);assert.deepEqual(mesh(restored).vertices,mesh(p).vertices);
    const doc=gltf([p]);assert.equal(doc.meshes.length,1);assert.ok(objFiles([p]).obj.includes('f '));
  }
  const legacy=part('hull');assert.deepEqual(mesh(legacy).vertices,mesh({...legacy,hullProfile:'standard',deckTaper:1}).vertices);
  for(const bad of [{hullProfile:'missing'},{hullProfile:'__proto__'},{deckTaper:0},{deckTaper:2},{deckTaper:'0.5'}])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...legacy,...bad}]}));
});
test('every part has outward faces, including mirrored solids',()=>{
  for(const type of Object.keys(library).filter(type=>!library[type].composite))for(const reflected of [false,true]){
    const m=mesh(part(type),reflected),center=[0,1,2].map(a=>m.vertices.reduce((s,v)=>s+v[a],0)/m.vertices.length);
    for(const f of m.faces){const [a,b,c]=f.map(i=>m.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(n.reduce((s,v,i)=>s+v*(a[i]-center[i]),0)>0,type);}
  }
});
test('composite blocks have closed, consistently wound non-degenerate surfaces and export materials',()=>{
  for(const type of Object.keys(library).filter(type=>library[type].composite))for(const reflected of [false,true]){
    const p=part(type),m=mesh(p,reflected),edges=new Map();let volume=0;
    m.faces.forEach(f=>{f.forEach((a,i)=>{const b=f[(i+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');const entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=a<b?1:-1;edges.set(key,entry);});for(let i=1;i<f.length-1;i++){const [a,b,c]=[f[0],f[i],f[i+1]].map(i=>m.vertices[i]);const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(Math.hypot(...n)>1e-8,type);volume+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);}});
    for(const edge of edges.values())assert.deepEqual(edge,[2,0],type);assert.ok(volume>0,type);
    const doc=gltf([p]);assert.equal(doc.meshes.length,1);assert.equal(doc.materials.length,new Set(m.faceColors).size);assert.equal(doc.meshes[0].primitives.length,doc.materials.length);
    assert.equal((objFiles([p]).mtl.match(/newmtl/g)||[]).length,doc.materials.length);
    const bytes=Buffer.from(doc.buffers[0].uri.split(',')[1],'base64');for(const primitive of doc.meshes[0].primitives){const a=doc.accessors[primitive.attributes.NORMAL],view=doc.bufferViews[a.bufferView];for(let offset=view.byteOffset;offset<view.byteOffset+view.byteLength;offset+=12)assert.ok(Math.abs(Math.hypot(...[0,4,8].map(n=>bytes.readFloatLE(offset+n)))-1)<1e-5);}
    assert.equal(validateProject({version:1,name:type,parts:[p]}).parts[0].type,type);
  }
});
test('fighter bay has an unobstructed axial opening and a twenty-sided shield base',()=>{
  const m=mesh(part('fighterBay'));
  for(const f of m.faces)for(let i=1;i<f.length-1;i++){
    const tri=[f[0],f[i],f[i+1]].map(i=>m.vertices[i]);
    const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    if(Math.abs(area(...tri))<1e-8)continue;
    const signs=tri.map((a,j)=>area(a,tri[(j+1)%3],[0,0]));
    assert.ok(!(signs.every(v=>v>=0)||signs.every(v=>v<=0)),'No triangle covers the bay center');
  }
  assert.equal(mesh(part('shieldGenerator')).faces[0].length,20);
});
test('glTF buffers, normals and mesh counts are valid for each preset',()=>{
  for(const name of ['fighter','hauler','scout']){const parts=preset(name),doc=gltf(parts),buffer=Buffer.from(doc.buffers[0].uri.split(',')[1],'base64');assert.equal(buffer.length,doc.buffers[0].byteLength);assert.equal(doc.meshes.length,meshes(parts).length);
    doc.accessors.forEach((a,i)=>{const view=doc.bufferViews[a.bufferView];assert.equal(view.byteLength,a.count*12);assert.ok(view.byteOffset+view.byteLength<=buffer.length);for(let o=0;o<view.byteLength;o+=12){const values=[0,4,8].map(n=>buffer.readFloatLE(view.byteOffset+o+n));assert.ok(values.every(Number.isFinite));if(i%2)assert.ok(Math.abs(Math.hypot(...values)-1)<1e-5);}});
    const obj=objFiles(parts);assert.ok(obj.obj.includes('mtllib starship.mtl'));assert.equal((obj.mtl.match(/newmtl/g)||[]).length,doc.meshes.length);
  }
});
test('project roundtrip and malformed project rejection',()=>{const p={version:1,name:'Test',parts:preset('fighter')};p.parts[0].rotation=[180,-360,250];assert.equal(validateProject(JSON.parse(JSON.stringify(p))).parts.length,p.parts.length);assert.throws(()=>validateProject({...p,parts:[{...p.parts[0],scale:[0,1,1]}]}));assert.throws(()=>validateProject({...p,parts:[{...p.parts[0],type:'__proto__'}]}));assert.throws(()=>validateProject({...p,parts:Array(151).fill(p.parts[0])}));});
