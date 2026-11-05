import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, upgrades } from './catalog.js';
import { meshBuffers, WebGLRenderer } from './webgl-renderer.js';
import { mockGL } from './webgl-test-helper.mjs';

test('GPU buffers triangulate all original and upgraded faces with flat normals and colors',()=>{
  for(const model of [...catalog,...Object.values(upgrades)]){
    const buffers=meshBuffers(model);
    assert.equal(buffers.triangles.length/27,model.faces.reduce((sum,face)=>sum+face.length-2,0));
    for(const data of Object.values(buffers))assert.ok(data.every(Number.isFinite));
    for(let i=0;i<buffers.triangles.length;i+=9){
      assert.ok(Math.abs(Math.hypot(...buffers.triangles.slice(i+3,i+6))-1)<1e-6);
      assert.ok(buffers.triangles.slice(i+6,i+9).every(c=>c>=0&&c<=1));
    }
  }
});
test('solid rendering clears and tests depth; restores GPU buffers after context loss',()=>{
  const gl=mockGL(),events={};let restored=0,error='';
  const canvas={width:900,height:550,getContext:(type,options)=>{assert.equal(type,'webgl');assert.equal(options.depth,true);return gl;},addEventListener:(type,handler)=>events[type]=handler};
  const renderer=new WebGLRenderer(canvas,{onRestore:()=>restored++,onError:message=>error=message});
  renderer.setModel(upgrades.player);
  const view={yaw:0,pitch:0,distance:4.2,width:900,height:550,wireframe:false,grid:true};
  renderer.render(view);
  assert.ok(gl.calls.some(([name,value])=>name==='enable'&&value===gl.DEPTH_TEST));
  assert.ok(gl.calls.some(([name,value])=>name==='clear'&&value===(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)));
  assert.deepEqual(gl.calls.filter(([name])=>name==='drawArrays').map(call=>call[1]),[gl.TRIANGLES,gl.LINES,gl.LINES]);
  const uploads=gl.calls.filter(([name])=>name==='bufferData').length;
  renderer.render(view);assert.equal(gl.calls.filter(([name])=>name==='bufferData').length,uploads);
  events.webglcontextlost({preventDefault(){}});assert.match(error,/context lost/);
  renderer.setModel(upgrades.big_boss);
  const drawCount=gl.calls.length;renderer.render(view);assert.equal(gl.calls.length,drawCount);
  events.webglcontextrestored();assert.equal(restored,1);
  assert.equal(renderer.buffers.triangles.count,meshBuffers(upgrades.big_boss).triangles.length/9);
  gl.calls.length=0;renderer.render({...view,wireframe:true,grid:false});
  assert.deepEqual(gl.calls.filter(([name])=>name==='drawArrays').map(call=>call[1]),[gl.LINES,gl.POINTS]);
});
test('missing WebGL fails with an actionable message',()=>{
  assert.throws(()=>new WebGLRenderer({getContext:()=>null}),/WebGL is unavailable/);
});
