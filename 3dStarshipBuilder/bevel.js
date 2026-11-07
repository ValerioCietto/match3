// Inset each face, bridge shared edges and close the corners of each solid.
export function bevelGeometry(source,amount,color){
  if(!amount)return source;
  const vertices=[],faces=[],faceColors=[],edges=new Map(),corners=new Map();
  const addFace=(face,tint)=>{faces.push(face);faceColors.push(tint);};
  source.faces.forEach((face,fi)=>{
    const center=[0,1,2].map(axis=>face.reduce((sum,id)=>sum+source.vertices[id][axis],0)/face.length);
    const inset=face.map(id=>{const index=vertices.length;vertices.push(source.vertices[id].map((v,axis)=>v+(center[axis]-v)*amount));return index;});
    const tint=source.faceColors?.[fi]||color;addFace(inset,tint);
    face.forEach((a,i)=>{const b=face[(i+1)%face.length],key=[a,b].sort((x,y)=>x-y).join(','),edge={a,b,ia:inset[i],ib:inset[(i+1)%face.length],tint};
      if(!edges.has(key)){edges.set(key,edge);return;}
      const other=edges.get(key);
      addFace([edge.ia,other.ib,other.ia,edge.ib],tint);
      for(const [vertex,from,to] of [[a,other.ib,edge.ia],[b,edge.ib,other.ia]]){if(!corners.has(vertex))corners.set(vertex,new Map());corners.get(vertex).set(from,to);}
    });
  });
  for(const [id,links] of corners){const start=links.keys().next().value,ring=[start];let next=links.get(start);while(next!==start&&ring.length<=links.size){ring.push(next);next=links.get(next);}if(next!==start)throw Error('Cannot bevel an open mesh.');
    const center=vertices.length;vertices.push([0,1,2].map(axis=>ring.reduce((sum,i)=>sum+vertices[i][axis],0)/ring.length));
    for(let i=0;i<ring.length;i++)addFace([ring[i],ring[(i+1)%ring.length],center],color);
  }
  return {vertices,faces,faceColors};
}
