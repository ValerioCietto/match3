import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part,mesh,hullProfiles,validateProject,gltf,objFiles} from './model.js';
import {moduleVolume} from './stats.js';
test('independent upper/lower hull chamfers stay closed and outward across taper limits',()=>{
  for(const hullProfile of Object.keys(hullProfiles).filter(k=>!hullProfiles[k].composite))for(const deckTaper of [.35,1])for(const upperChamfer of [0,.2,.4])for(const lowerChamfer of [0,.2,.4])for(const reflected of [false,true]){
    const p={...part('hull'),hullProfile,deckTaper,upperChamfer,lowerChamfer},m=mesh(p,reflected),edges=new Map(),center=[0,1,2].map(a=>m.vertices.reduce((s,v)=>s+v[a],0)/m.vertices.length);
    for(const f of m.faces){f.forEach((a,i)=>{const b=f[(i+1)%f.length],key=[a,b].sort((a,b)=>a-b).join(','),edge=edges.get(key)||[0,0];edge[0]++;edge[1]+=a<b?1:-1;edges.set(key,edge);});for(let i=1;i<f.length-1;i++){const [a,b,c]=[f[0],f[i],f[i+1]].map(k=>m.vertices[k]),u=b.map((n,j)=>n-a[j]),v=c.map((n,j)=>n-a[j]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(normal.reduce((s,n,j)=>s+n*(a[j]-center[j]),0)>0,hullProfile);}}
    for(const edge of edges.values())assert.deepEqual(edge,[2,0]);
    const baseline=moduleVolume({...p,upperChamfer:0,lowerChamfer:0});assert.ok(moduleVolume(p)<=baseline+1e-9);if(upperChamfer||lowerChamfer)assert.ok(moduleVolume(p)<baseline);
    const loaded=validateProject(JSON.parse(JSON.stringify({version:1,name:'Hull',parts:[p]}))).parts[0];assert.deepEqual(mesh(loaded).vertices,mesh(p).vertices);
    assert.ok(gltf([p]).buffers[0].byteLength>0);assert.ok(objFiles([p]).obj.includes('f '));
    if(!upperChamfer)assert.equal(m.vertices.filter(v=>Math.abs(v[1]-.325)<1e-9).length,hullProfiles[hullProfile].shape.length);
  }
});
test('zero chamfers preserve old hulls, and malformed values are rejected',()=>{
  const p=part('hull');assert.deepEqual(mesh(p),mesh({...p,upperChamfer:0,lowerChamfer:0}));
  for(const key of ['upperChamfer','lowerChamfer'])for(const value of [-.1,.5,'0.2',null])assert.throws(()=>validateProject({version:1,name:'Invalid',parts:[{...p,[key]:value}]}));
});
