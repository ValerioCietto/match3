import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part,mesh,validateProject,gltf,objFiles,cockpitProfiles} from './model.js';
import {thrusterLayouts} from './blocks.js';
import {moduleVolume} from './stats.js';
const variants=[...['research','swan','axe'].map(hullProfile=>({...part('hull'),hullProfile})),...Object.keys(thrusterLayouts).map(thrusterProfile=>({...part('engine'),thrusterProfile}))];
variants.push(...Object.keys(cockpitProfiles).filter(key=>key!=='classic').map(cockpitProfile=>({...part('cockpit'),cockpitProfile})));
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
