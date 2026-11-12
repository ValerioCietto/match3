// Preserve corners while reducing sampled SVG contours for lower mesh resolutions.
export function simplifyContour(points,tolerance){
 if(!tolerance||points.length<5)return points;
 const same=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8;
 const poly=same(points[0],points.at(-1))?points.slice(0,-1):points.slice();
 const reduce=path=>{if(path.length<3)return path;const a=path[0],b=path.at(-1),dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;let far=0,index=0;for(let i=1;i<path.length-1;i++){const p=path[i],t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0,d=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);if(d>far){far=d;index=i;}}return far>tolerance?[...reduce(path.slice(0,index+1)).slice(0,-1),...reduce(path.slice(index))]:[a,b];};
 let opposite=1;for(let i=2;i<poly.length;i++)if(Math.hypot(poly[i].x-poly[0].x,poly[i].y-poly[0].y)>Math.hypot(poly[opposite].x-poly[0].x,poly[opposite].y-poly[0].y))opposite=i;
 return [...reduce(poly.slice(0,opposite+1)).slice(0,-1),...reduce([...poly.slice(opposite),poly[0]]).slice(0,-1)];
}
export function resolutionSettings(level){const q=(Math.max(1,Math.min(10,level))/10)**1.3;return {rows:Math.max(8,Math.round(160*q)),step:.6/q,tolerance:level>=10?0:(1-q)*1.2,cabinRows:Math.max(8,Math.round(160*q)),radial:Math.max(8,Math.round(64*q))};}
