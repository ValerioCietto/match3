import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, upgrades } from './catalog.js';
import { edgesOf, normalize, rotate } from './geometry.js';
import { ENEMY_MESHES } from '../3dShooter/core.mjs';

test('catalog includes every shooter enemy without changing its geometry',()=>{
  assert.equal(new Set(catalog.map(m=>m.id)).size,catalog.length);
  for(const [id,mesh] of Object.entries(ENEMY_MESHES)){
    const model=catalog.find(m=>m.id===id);assert.ok(model,id);
    assert.deepEqual(model.vertices,mesh.vertices);assert.deepEqual(model.faces,mesh.faces);
  }
  assert.ok(catalog.some(m=>m.id==='player'));
});
test('every upgraded model has valid detailed geometry and the required equipment',()=>{
  for(const original of catalog){
    const model=upgrades[original.id];assert.ok(model);
    assert.ok(model.vertices.length>original.vertices.length);
    assert.ok(model.faces.length>original.faces.length);
    assert.equal(model.faceColors.length,model.faces.length);
    assert.ok(model.faceColors.every(color=>/^#[0-9a-f]{6}$/i.test(color)));
    assert.ok(model.vertices.every(v=>v.length===3&&v.every(Number.isFinite)));
    for(const face of model.faces){
      assert.ok(face.every(i=>Number.isInteger(i)&&i>=0&&i<model.vertices.length));
      const [a,b,c]=face.map(i=>model.vertices[i]);
      const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
      assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-10);
    }
    assert.ok(normalize(model).every(v=>Math.hypot(...v)<=1+1e-10));
  }
  assert.equal(upgrades.normal.parts.filter(p=>p.name==='cannon barrel').length,4);
  const silver=upgrades.big_boss;
  for(let face=1;face<=20;face++){
    assert.ok(silver.parts.some(p=>p.name===`face ${face} gun barrel`));
    assert.ok(silver.parts.some(p=>p.name===`face ${face} cockpit`));
  }
});
test('models have valid faces and fit safely inside the orbit camera',()=>{
  for(const model of catalog){
    for(const vertex of model.vertices){assert.equal(vertex.length,3);assert.ok(vertex.every(Number.isFinite));}
    for(const face of model.faces){assert.ok(face.length>=3);assert.ok(face.every(i=>Number.isInteger(i)&&i>=0&&i<model.vertices.length));}
    const before=JSON.stringify(model);const points=normalize(model);
    assert.equal(JSON.stringify(model),before);
    assert.ok(points.every(v=>Math.hypot(...v)<=1+1e-10));
    for(const point of points)assert.ok(Math.abs(Math.hypot(...rotate(point,.8,.3))-Math.hypot(...point))<1e-10);
    const edges=edgesOf(model);assert.ok(edges.length>0);
    if(model.id!=='player')assert.equal(model.vertices.length-edges.length+model.faces.length,2);
  }
});
