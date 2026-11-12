import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('exported cockpit LOD1 is closed, nondegenerate and matches embedded glTF',async()=>{
 const shape=JSON.parse(await readFile(new URL('./module-shapes/jared-cockpit-lod1.shape.json',import.meta.url),'utf8'));
 const gltf=JSON.parse(await readFile(new URL('./module-shapes/jared-cockpit-lod1.gltf',import.meta.url),'utf8'));
 assert.equal(shape.resolution,1);assert.equal(shape.vertices.length,58);assert.equal(shape.faces.length,112);
 const edges=new Map();let volume=0;
 for(const face of shape.faces){for(let i=0;i<3;i++){const a=face[i],b=face[(i+1)%3],key=[a,b].sort((a,b)=>a-b).join(',');const count=edges.get(key)||[0,0];count[0]++;count[1]+=a<b?1:-1;edges.set(key,count);}const [a,b,c]=face.map(i=>shape.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-12);volume+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);}
 for(const count of edges.values())assert.deepEqual(count,[2,0]);assert.ok(volume>0);
 for(const n of shape.normals)assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6);
 const bytes=Buffer.from(gltf.buffers[0].uri.split(',')[1],'base64');assert.equal(bytes.length,gltf.buffers[0].byteLength);assert.equal(gltf.accessors[2].count,shape.faces.length*3);
 shape.vertices.flat().forEach((v,i)=>assert.ok(Math.abs(bytes.readFloatLE(i*4)-v)<1e-8));
});
