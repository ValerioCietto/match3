import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part,mesh,validateProject,gltf,objFiles,cockpitProfiles,finProfiles,cannonOptions} from './model.js';
import {thrusterLayouts} from './blocks.js';
import {moduleVolume} from './stats.js';
const variants=[...['sphere','cylinder','research','swan','axe'].map(hullProfile=>({...part('hull'),hullProfile})),...Object.keys(thrusterLayouts).map(thrusterProfile=>({...part('engine'),thrusterProfile}))];
variants.push(...Object.keys(cockpitProfiles).filter(key=>key!=='classic').map(cockpitProfile=>({...part('cockpit'),cockpitProfile})));
variants.push(...Object.keys(cockpitProfiles).flatMap(cockpitProfile=>[.02,.2,.4].map(cockpitBevel=>({...part('cockpit'),cockpitProfile,cockpitBevel}))));
test('cockpit bevel preserves old defaults and validates its range',()=>{
  const p=part('cockpit');assert.deepEqual(mesh(p),mesh({...p,cockpitBevel:0}));
  for(const value of [-.1,.5,null,'0.2'])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...p,cockpitBevel:value}]}));
  const beveled={...p,cockpitBevel:.4};assert.ok(mesh(beveled).faces.length>mesh(p).faces.length);assert.ok(moduleVolume(beveled)<moduleVolume(p));
});
variants.push(...Object.keys(finProfiles).flatMap(finProfile=>[-1,1].map(sign=>({...part('fin'),finProfile,finSweep:sign*35,finCant:sign*45,finThickness:sign<0?.04:.4}))));
for(const cannonBarrel of ['hexagonal','square','octagonal'])for(const cannonMuzzle of Object.keys(cannonOptions.cannonMuzzle))for(const cannonReceiver of Object.keys(cannonOptions.cannonReceiver))variants.push({...part('cannon'),cannonBarrel,cannonMuzzle,cannonReceiver});
test('cannon components are independently configurable and preserve classic projects',()=>{
  const p=part('cannon');assert.deepEqual(mesh(p),mesh({...p,cannonBarrel:'classic'}));
  const configurations=variants.filter(p=>p.type==='cannon');assert.equal(configurations.length,48);assert.equal(new Set(configurations.map(p=>JSON.stringify(mesh(p).vertices))).size,48);
  for(const key of Object.keys(cannonOptions))for(const value of ['invalid','__proto__',null])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...p,[key]:value}]}));
});
test('fin options retain classic geometry and reject invalid values',()=>{
  const p=part('fin');assert.deepEqual(mesh(p).vertices,mesh({...p,finProfile:'classic',finSweep:0,finCant:0,finThickness:.16}).vertices);
  for(const bad of [{finProfile:'missing'},{finProfile:'__proto__'},{finSweep:36},{finCant:-46},{finThickness:0}])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...p,...bad}]}));
  for(const finProfile of Object.keys(finProfiles)){const model=mesh({...p,finProfile}),root=model.vertices.filter(v=>v[1]===-.55),changed=mesh({...p,finProfile,finSweep:35,finCant:45});assert.deepEqual(changed.vertices.filter(v=>v[1]===-.55),root);}
});
test('hull, cockpit and thruster variants are closed, nondegenerate, exportable and scalable',()=>{
  for(const p of variants)for(const reflected of [false,true]){
    const m=mesh(p,reflected),edges=new Map();
    for(const f of m.faces){for(let i=0;i<f.length;i++){const a=f[i],b=f[(i+1)%f.length],key=[a,b].sort((a,b)=>a-b).join(','),entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=a<b?1:-1;edges.set(key,entry);}for(let i=1;i<f.length-1;i++){const [a,b,c]=[f[0],f[i],f[i+1]].map(k=>m.vertices[k]),u=b.map((n,j)=>n-a[j]),v=c.map((n,j)=>n-a[j]);assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-9);}}
    for(const entry of edges.values())assert.deepEqual(entry,[2,0]);assert.ok(moduleVolume(p)>0);
    assert.ok(Math.abs(moduleVolume({...p,scale:[.5,.5,.5]})*8-moduleVolume(p))<1e-9);
    const saved=validateProject({version:1,name:'Variant',parts:[p]});assert.deepEqual(mesh(saved.parts[0]).vertices,mesh(p).vertices);
    const doc=gltf([p]);assert.ok(doc.meshes[0].primitives.length>0);assert.ok(objFiles([p]).obj.includes('f '));
    const buffer=Buffer.from(doc.buffers[0].uri.split(',')[1],'base64');for(const primitive of doc.meshes[0].primitives){const view=doc.bufferViews[doc.accessors[primitive.attributes.NORMAL].bufferView];for(let i=view.byteOffset;i<view.byteOffset+view.byteLength;i+=12)assert.ok(Math.abs(Math.hypot(buffer.readFloatLE(i),buffer.readFloatLE(i+4),buffer.readFloatLE(i+8))-1)<1e-5);}
  }
});
test('cockpit variants are distinct, preserve classic saves and reject unknown profiles',()=>{
  const p=part('cockpit');assert.deepEqual(mesh(p).vertices,mesh({...p,cockpitProfile:'classic'}).vertices);
  const signatures=Object.keys(cockpitProfiles).map(cockpitProfile=>JSON.stringify(mesh({...p,cockpitProfile}).vertices));assert.equal(new Set(signatures).size,Object.keys(cockpitProfiles).length);
  for(const cockpitProfile of ['missing','__proto__'])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...p,cockpitProfile}]}));
});
test('thruster layouts contain 1, 1, 2, 3 and 4 complete exhaust assemblies',()=>{
  for(const [profile,count] of Object.entries({drone:1,reverseDrone:1,speeder:2,hauler:3,carrier:4})){assert.equal(thrusterLayouts[profile].exhausts.length,count);const m=mesh({...part('engine'),thrusterProfile:profile});assert.ok(m.faceColors.includes('#7ce9ec'));const scaled=mesh({...part('engine'),thrusterProfile:profile,scale:[2,3,4]});m.vertices.forEach((v,i)=>v.forEach((n,j)=>assert.equal(scaled.vertices[i][j],n*[2,3,4][j])));}
  const p=part('engine'),normal=mesh({...p,thrusterProfile:'drone'}),reverse=mesh({...p,thrusterProfile:'reverseDrone'});normal.vertices.forEach(([x,y,z],i)=>assert.deepEqual(reverse.vertices[i],[-x,y,-z]));
  assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...p,thrusterProfile:'invalid'}]}));
});
test('thruster housings and collars are octagonal along Z with shortened bodies',()=>{
  const originalHalfLengths={drone:.45,reverseDrone:.45,speeder:1.3,hauler:.85,carrier:1.65};
  for(const [profile,spec] of Object.entries(thrusterLayouts)){
    const m=mesh({...part('engine'),thrusterProfile:profile});
    assert.equal(m.faces[0].length,8);assert.equal(m.faces[1].length,8);assert.equal(m.faces[10].length,8);
    const body=m.vertices.slice(0,16),zs=body.map(v=>v[2]);
    assert.ok(Math.abs(Math.max(...zs)-Math.min(...zs)-originalHalfLengths[profile]*2*.6)<1e-9);
    assert.equal(new Set(zs).size,2);assert.equal(new Set(body.slice(0,8).map(v=>v.slice(0,2).join(','))).size,8);
  }
});
