import {test} from 'node:test';
import assert from 'node:assert/strict';
import source from './module-shapes/grav-cannon.shape.json' with {type:'json'};
import {gravCannonGeometry} from './grav-cannon.js';
import {part,mesh,validateProject} from './model.js';

test('SVG depth map makes darker regions thicker and mirrors thickness around Y',()=>{
 assert.equal(source.regions.length,4);assert.equal(source.traces.length,2);
 const white=source.regions.find(r=>r.fill==='#ffffff'),light=source.regions.find(r=>r.fill==='#ececec'),grey=source.regions.find(r=>r.fill==='#b3b3b3');
 assert.ok(white.thickness<light.thickness&&light.thickness<grey.thickness);
 const geometry=gravCannonGeometry('#a4abb1');
 for(const [x,y,z] of geometry.vertices)assert.ok(geometry.vertices.some(v=>Math.abs(v[0]-x)<1e-6&&Math.abs(v[1]+y)<1e-6&&Math.abs(v[2]-z)<1e-6));
 assert.ok(Math.abs(Math.max(...geometry.vertices.map(v=>v[1]))-.25)<1e-6);
 assert.ok(Math.abs(Math.min(...geometry.vertices.map(v=>v[2]))+2.2)<1e-6);
});
test('gravity cannon power traces are emissive on both sides and save correctly',()=>{
 const p={...part('gravStop'),octagonalSymmetry:false},m=mesh(p);
 const energy=m.faces.filter((_,i)=>m.faceColors[i]==='#bc65ff');
 assert.ok(energy.some(face=>face.every(i=>m.vertices[i][1]>0)));
 assert.ok(energy.some(face=>face.every(i=>m.vertices[i][1]<0)));
 assert.ok(m.emissiveColors.includes('#bc65ff'));
 assert.deepEqual(mesh(validateProject({version:1,name:'Grav cannon',parts:[p]}).parts[0]).vertices,m.vertices);
});
