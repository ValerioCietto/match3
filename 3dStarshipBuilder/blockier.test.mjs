import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part,mesh,validateProject,gltf} from './model.js';
import {moduleStats} from './stats.js';
test('Blockier SVG hull supports bevel 0–100%, closed geometry, persistence and export',()=>{
 for(const jaredHullProfile of ['blockier','interceptor','warlord'])for(const moduleBevel of [0,.15,.25,.5,.75,1]){
 const p={...part('hull'),designStyle:'jared',jaredHullProfile,moduleBevel},m=mesh(p),edges=new Map();let volume=0;
 for(const f of m.faces){for(let i=0;i<3;i++){const a=f[i],b=f[(i+1)%3],key=[a,b].sort((a,b)=>a-b).join(',');const e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}const [a,b,c]=f.map(i=>m.vertices[i]);volume+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);}
 for(const edge of edges.values())assert.deepEqual(edge,[2,0]);assert.ok(volume>0);assert.ok(Object.values(moduleStats(p)).every(Number.isFinite));
 assert.deepEqual(mesh(validateProject({version:1,name:'Blockier',parts:[p]}).parts[0]).vertices,m.vertices);assert.equal(gltf([p]).meshes.length,1);
 }
 for(const moduleBevel of [-.1,1.01,'0.5'])assert.throws(()=>validateProject({version:1,name:'Invalid',parts:[{...part('hull'),moduleBevel}]}));
});
