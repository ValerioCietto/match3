import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bladeSurface} from './blade-surface.js';
test('side edges are thin and upper tip has circular tapered cross sections',()=>{
 const contours=[[{x:-10,y:0},{x:10,y:0},{x:10,y:50},{x:0,y:100},{x:-10,y:50}]];
 const points=bladeSurface(contours,10,4);assert.ok(points.length>0&&points.every(Number.isFinite));
 let edgeCount=0,coneCount=0;
 for(let i=0;i<points.length;i+=3){const [x,y,z]=points.slice(i,i+3);if(y<40&&Math.abs(x)>9.999){assert.ok(Math.abs(Math.abs(z)-.03)<1e-8);edgeCount++;}if(y>75&&y<95){const radius=(100-y)/5;assert.ok(Math.abs((Math.abs(z)-.03)**2+x*x-radius*radius)<1e-7);coneCount++;}}
 assert.ok(edgeCount>0&&coneCount>0);
 const wide=bladeSurface(contours,10,8);assert.ok(Math.max(...wide.filter((_,i)=>i%3===2))>0);
});

test('branching shoulders share a continuous watertight surface and smooth normals',()=>{
 const outline=[{x:-8,y:0},{x:-4,y:0},{x:0,y:40},{x:4,y:0},{x:8,y:0},{x:8,y:50},{x:0,y:100},{x:-8,y:50}];
 const {positions,normals}=bladeSurface([outline],12,4,true),edges=new Map(),seams=new Map();
 for(let i=0;i<positions.length;i+=9){const keys=[];for(let j=0;j<3;j++){const p=positions.slice(i+j*3,i+j*3+3),key=p.map(v=>v.toFixed(5)).join(',');keys.push(key);if(Math.abs(p[1]-40)<1e-7&&p[2]>.04){const n=normals.slice(i+j*3,i+j*3+3);if(seams.has(key))assert.deepEqual(n,seams.get(key));else seams.set(key,n);}}for(let j=0;j<3;j++){const key=[keys[j],keys[(j+1)%3]].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}}
 assert.ok(seams.size>0);for(const count of edges.values())assert.equal(count,2,'Every surface edge is shared by two triangles');
 assert.ok(normals.every(Number.isFinite));
});