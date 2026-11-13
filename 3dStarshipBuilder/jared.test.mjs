import {test} from 'node:test';
import assert from 'node:assert/strict';
import {factions} from './factions.js';
import {part,mesh,combined,validateProject,gltf,objFiles} from './model.js';
import {moduleStats} from './stats.js';
const make=type=>({...part(type),...factions.jared.defaults[type]});
test('Jared library geometries are closed, exportable and scale consistently',()=>{
 for(const type of factions.jared.parts){const p=make(type),m=mesh(p),edges=new Map();
  for(const f of m.faces){for(let i=0;i<f.length;i++){const a=f[i],b=f[(i+1)%f.length],key=[a,b].sort((a,b)=>a-b).join(',');const e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}for(let i=1;i<f.length-1;i++){const [a,b,c]=[f[0],f[i],f[i+1]].map(j=>m.vertices[j]),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]);assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-8,type);}}
  for(const edge of edges.values())assert.deepEqual(edge,[2,0],type);
  assert.deepEqual(mesh(validateProject({version:1,name:type,parts:[p]}).parts[0]).vertices,m.vertices);
  const stats=moduleStats(p),small=moduleStats({...p,scale:[.5,.5,.5],mirror:true});for(const key of Object.keys(stats))assert.ok(Math.abs(small[key]-stats[key]/4)<1e-7,key);
  assert.ok(gltf([p]).meshes.length);assert.ok(objFiles([p]).obj.includes('f '));
 }
});
test('Jared plasma stays stationary without changing stats or stored transforms; spike length is validated',()=>{
 const engine=make('engine'),saved=JSON.stringify(engine),stats=moduleStats(engine);
 assert.deepEqual(combined([engine],0).vertices,combined([engine],2).vertices);assert.equal(JSON.stringify(engine),saved);assert.deepEqual(moduleStats(engine),stats);
 assert.ok(gltf([engine]).materials.some(m=>m.emissiveFactor));
 const cannon=make('cannon');assert.ok(Math.min(...mesh({...cannon,spikeLength:4}).vertices.map(v=>v[2]))<Math.min(...mesh(cannon).vertices.map(v=>v[2])));
 for(const spikeLength of [0,6,'2'])assert.throws(()=>validateProject({version:1,name:'Bad',parts:[{...cannon,spikeLength}]}));
 const cabin=moduleStats(make('passengerModule'));assert.ok(cabin.maxPassengers>0&&cabin.massFull>cabin.massEmpty);
});
