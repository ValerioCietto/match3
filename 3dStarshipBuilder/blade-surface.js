// Continuous depth field and shared scanline vertices keep the cone/arm junction smooth.
export function bladeSurface(contours,thickness,bladeWidth,withNormals=false,{rows=160,step=.6}={}){
 const points=contours.flat(),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y)),height=maxY-minY;
 const levels=[...new Set([...points.map(p=>p.y),...Array.from({length:rows+1},(_,i)=>minY+height*i/rows)])].sort((a,b)=>a-b);
 const inside=(x,y)=>contours.some(poly=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;});
 const exterior=[];
 for(const poly of contours)for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1e-8)continue;const x=(a.x+b.x)/2,y=(a.y+b.y)/2,nx=-dy/len*.02,ny=dx/len*.02;if(inside(x+nx,y+ny)&&inside(x-nx,y-ny))continue;exterior.push({a,dx,dy,len2:len*len});}
 const spansAt=y=>{
   const spans=[];for(const poly of contours){const hits=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if((a.y>y)===(b.y>y))continue;const at=v=>a.x+(v-a.y)*(b.x-a.x)/(b.y-a.y);hits.push({x:at(y),at});}hits.sort((a,b)=>a.x-b.x);for(let i=0;i+1<hits.length;i+=2)spans.push({l:hits[i],r:hits[i+1]});}
   spans.sort((a,b)=>a.l.x-b.l.x);const merged=[];for(const span of spans){const prev=merged.at(-1);if(prev&&span.l.x<=prev.r.x+.01){if(span.r.x>prev.r.x)prev.r=span.r;}else merged.push({...span});}return merged;
 };
 const depthCache=new Map(),widthCache=new Map();
 const depth=(x,y)=>{
   const key=x.toFixed(7)+','+y.toFixed(7);if(depthCache.has(key))return depthCache.get(key);
   let distance=Infinity;for(const {a,dx,dy,len2} of exterior){const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/len2));distance=Math.min(distance,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));}
   const u=Math.min(1,distance/bladeWidth),blade=thickness*.5*Math.sin(u*Math.PI/2);
   let blend=Math.max(0,Math.min(1,(y-(minY+height*.55))/(height*.15)));blend=blend*blend*(3-2*blend);
   let cone=0;if(blend){let spans=widthCache.get(y);if(!spans){spans=spansAt(Math.min(maxY-1e-8,Math.max(minY+1e-8,y)));widthCache.set(y,spans);}if(spans.length){const l=spans[0].l.x,r=spans.at(-1).r.x,radius=(r-l)/2;cone=Math.sqrt(Math.max(0,radius*radius-(x-(l+r)/2)**2));}}
   const value=.03+(1-blend)*blade+blend*cone;depthCache.set(key,value);return value;
 };
 const bands=[],cuts=new Map();
 const cut=(y,x)=>{if(!cuts.has(y))cuts.set(y,new Set());cuts.get(y).add(Number(x.toFixed(7)));};
 for(let row=0;row<levels.length-1;row++){const y0=levels[row],y1=levels[row+1];if(y1-y0<1e-7)continue;for(const {l,r} of spansAt((y0+y1)/2)){const band={y0,y1,l0:l.at(y0),r0:r.at(y0),l1:l.at(y1),r1:r.at(y1)};bands.push(band);cut(y0,band.l0);cut(y0,band.r0);cut(y1,band.l1);cut(y1,band.r1);}}
 const positions=[],normals=[],normalCache=new Map();
 const smoothNormal=p=>{const key=p.map(v=>v.toFixed(7)).join(',');if(normalCache.has(key))return normalCache.get(key);const e=.015,dx=(depth(p[0]+e,p[1])-depth(p[0]-e,p[1]))/(2*e),dy=(depth(p[0],p[1]+e)-depth(p[0],p[1]-e))/(2*e),n=[-dx,-dy,Math.sign(p[2])],len=Math.hypot(...n);const out=n.map(v=>v/len);normalCache.set(key,out);return out;};
 const emit=(a,b,c,smooth=true)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(len<1e-9)return;positions.push(...a,...b,...c);if(withNormals)for(const p of [a,b,c])normals.push(...(smooth?smoothNormal(p):n.map(v=>v/len)));};
 const row=(y,l,r)=>{const xs=[l,r,...cuts.get(y)];for(let x=Math.ceil(l/step)*step;x<r;x+=step)xs.push(x);return [...new Set(xs.filter(x=>x>=l-1e-7&&x<=r+1e-7).map(x=>Number(Math.max(l,Math.min(r,x)).toFixed(7))))].sort((a,b)=>a-b).map(x=>[x,y,depth(x,y)]);};
 const back=p=>[p[0],p[1],-p[2]];
 const cap=(a,b,reverse=false)=>{const c=back(b),d=back(a);if(reverse){emit(a,b,c,false);emit(a,c,d,false);}else{emit(a,c,b,false);emit(a,d,c,false);}};
 for(const b of bands){const lower=row(b.y0,b.l0,b.r0),upper=row(b.y1,b.l1,b.r1);let i=0,j=0;
   while(i<lower.length-1||j<upper.length-1){let tri;if(i<lower.length-1&&(j===upper.length-1||lower[i+1][0]<=upper[j+1][0])){tri=[lower[i],lower[i+1],upper[j]];i++;}else{tri=[lower[i],upper[j+1],upper[j]];j++;}emit(...tri);emit(...tri.slice().reverse().map(back));}
   cap(lower[0],upper[0],true);cap(lower.at(-1),upper.at(-1));
   if(b.y0===minY)for(let k=0;k<lower.length-1;k++)cap(lower[k],lower[k+1],true);
   if(b.y1===maxY)for(let k=0;k<upper.length-1;k++)cap(upper[k],upper[k+1]);
 }
 return withNormals?{positions,normals}:positions;
}
