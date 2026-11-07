import {test} from 'node:test';
import assert from 'node:assert/strict';
import {part,mesh,gltf,objFiles} from './model.js';
import {moduleStats} from './stats.js';
test('mirrored cabins retain portholes only on their world-space outer sides',()=>{
  for(const x of [-2,2])for(const yaw of [0,180])for(const reflected of [false,true]){
    const p={...part('passengerModule',[x,0,0],[1,1,1],true),rotation:[0,yaw,0]},m=mesh(p,reflected),center=reflected?-x:x;
    const glassVertices=new Set(m.faces.filter((_,i)=>m.faceColors[i]==='#73e3ed').flat());assert.ok(glassVertices.size>0);
    for(const id of glassVertices)assert.ok(Math.sign(center)*(m.vertices[id][0]-center)>.6);
    const full=mesh({...p,mirror:false});assert.equal(m.faces.filter((_,i)=>m.faceColors[i]==='#73e3ed').length*2,full.faces.filter((_,i)=>full.faceColors[i]==='#73e3ed').length);
    assert.equal(gltf([p]).meshes.length,2);assert.ok(objFiles([p]).obj.includes('f '));
  }
});
test('removing inner windows reduces mass without reducing passenger capacity',()=>{
  const p=part('passengerModule'),single=moduleStats(p),pair=moduleStats({...p,mirror:true});assert.equal(single.maxPassengers,8);assert.equal(pair.maxPassengers,16);assert.ok(pair.massEmpty<single.massEmpty*2);assert.ok(pair.volume<single.volume*2);
});
