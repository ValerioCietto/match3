import {solid} from './blocks.js';

// Rectifying an icosahedron yields 20 equilateral triangles and 12 regular pentagons.
export function icosidodecahedron(radius,color){
 const phi=(1+Math.sqrt(5))/2,ico=[];
 for(const a of [-1,1])for(const b of [-phi,phi])ico.push([0,a,b],[a,b,0],[b,0,a]);
 const vertices=[],edges=new Map(),incident=ico.map(()=>[]),faces=[];
 const key=(a,b)=>[a,b].sort((a,b)=>a-b).join(',');
 for(let a=0;a<ico.length;a++)for(let b=a+1;b<ico.length;b++){
  if(Math.abs(Math.hypot(...ico[a].map((n,i)=>n-ico[b][i]))-2)>1e-8)continue;
  const v=ico[a].map((n,i)=>(n+ico[b][i])/2),length=Math.hypot(...v),index=vertices.length;
  vertices.push(v.map(n=>n*radius/length));edges.set(key(a,b),index);incident[a].push(index);incident[b].push(index);
 }
 for(let a=0;a<ico.length;a++)for(let b=a+1;b<ico.length;b++)for(let c=b+1;c<ico.length;c++){
  if([key(a,b),key(b,c),key(c,a)].every(k=>edges.has(k)))faces.push([edges.get(key(a,b)),edges.get(key(b,c)),edges.get(key(c,a))]);
 }
 for(let i=0;i<ico.length;i++){
  const length=Math.hypot(...ico[i]),normal=ico[i].map(n=>n/length),indices=incident[i];
  const center=[0,1,2].map(axis=>indices.reduce((sum,j)=>sum+vertices[j][axis],0)/indices.length);
  const u=vertices[indices[0]].map((n,axis)=>n-center[axis]);
  const v=[normal[1]*u[2]-normal[2]*u[1],normal[2]*u[0]-normal[0]*u[2],normal[0]*u[1]-normal[1]*u[0]];
  const angle=j=>{const d=vertices[j].map((n,axis)=>n-center[axis]);return Math.atan2(d.reduce((s,n,a)=>s+n*v[a],0),d.reduce((s,n,a)=>s+n*u[a],0));};
  faces.push(indices.sort((a,b)=>angle(a)-angle(b)));
 }
 return solid(vertices,faces,color);
}
