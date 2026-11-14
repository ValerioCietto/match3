import {solid} from './blocks.js';

// Level 0 is an icosahedron; each subdivision splits every triangle into four.
const cache=new Map();
export function icosphere(radius,color,level=3){
 if(!cache.has(level)){
  const phi=(1+Math.sqrt(5))/2,vertices=[],triangles=[];
  for(const a of [-1,1])for(const b of [-phi,phi])vertices.push([0,a,b],[a,b,0],[b,0,a]);
  const adjacent=(a,b)=>Math.abs(Math.hypot(...vertices[a].map((n,i)=>n-vertices[b][i]))-2)<1e-8;
  for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)for(let c=b+1;c<12;c++)if(adjacent(a,b)&&adjacent(b,c)&&adjacent(c,a))triangles.push([a,b,c]);
  let faces=solid(vertices,triangles,color).faces;
  const unit=v=>{const length=Math.hypot(...v);return v.map(n=>n/length);};
  vertices.forEach((v,i)=>vertices[i]=unit(v));
  for(let step=0;step<level;step++){
   const midpoints=new Map();
   const midpoint=(a,b)=>{
    const key=a<b?`${a},${b}`:`${b},${a}`;
    if(!midpoints.has(key)){midpoints.set(key,vertices.length);vertices.push(unit(vertices[a].map((n,i)=>(n+vertices[b][i])/2)));}
    return midpoints.get(key);
   };
   faces=faces.flatMap(([a,b,c])=>{const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);return [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]];});
  }
  cache.set(level,{vertices,faces});
 }
 const template=cache.get(level);
 return {vertices:template.vertices.map(v=>v.map(n=>n*radius)),faces:template.faces.map(f=>[...f]),faceColors:template.faces.map(()=>color)};
}
