// Merge overlapping SVG cabin contours into one silhouette, then use its half-width
// as the radius of revolution around the vertical axis.
export function cockpitProfile(contours,segments=160){
 const points=contours.flat(),minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y)),centerX=(minX+maxX)/2;
 const profile=Array.from({length:segments+1},(_,i)=>{
   const y=minY+(maxY-minY)*i/segments;if(i===0||i===segments)return {radius:0,y};
   const intersections=[];
   for(const poly of contours)for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length];if((a.y>y)===(b.y>y))continue;intersections.push(a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y));}
   return {radius:intersections.length?Math.max(...intersections.map(x=>Math.abs(x-centerX))):0,y};
 });
 return {centerX,profile};
}
