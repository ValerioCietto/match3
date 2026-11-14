import fs from 'node:fs';
const svg=fs.readFileSync(new URL('grav-cannon.svg',import.meta.url),'utf8');
function points(d){
 const tokens=d.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi),out=[];let i=0,cmd,x=0,y=0;
 while(i<tokens.length){
  if(/^[a-z]$/i.test(tokens[i]))cmd=tokens[i++];const relative=cmd===cmd.toLowerCase(),kind=cmd.toLowerCase();
  if(kind==='z')break;
  if(kind==='m'||kind==='l'){const a=+tokens[i++],b=+tokens[i++];x=relative?x+a:a;y=relative?y+b:b;if(kind==='m')cmd=relative?'l':'L';}
  else if(kind==='h'){const a=+tokens[i++];x=relative?x+a:a;}
  else if(kind==='v'){const b=+tokens[i++];y=relative?y+b:b;}
  else throw Error('Unsupported SVG command '+cmd);
  if(!out.length||Math.hypot(x-out.at(-1)[0],y-out.at(-1)[1])>1e-7)out.push([x,y]);
 }return out;
}
const regions=[],traces=[];
for(const [tag] of svg.matchAll(/<path\b[^>]*>/g)){
 const style=tag.match(/style="([^"]+)"/)?.[1]||'',fill=style.match(/(?:^|;)fill:(#[0-9a-f]{6})/i)?.[1],stroke=style.match(/(?:^|;)stroke:(#[0-9a-f]{6})/i)?.[1],d=tag.match(/\sd="([^"]+)"/)?.[1];
 if(!d)continue;
 if(fill){const rgb=[1,3,5].map(i=>parseInt(fill.slice(i,i+2),16));if(rgb.every(n=>n===rgb[0]))regions.push({fill,brightness:rgb[0]/255,outline:points(d)});}
 else if(stroke?.toLowerCase()==='#800080')traces.push(points(d));
}
const all=regions.flatMap(r=>r.outline),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),scale=2.2/(maxY-minY),rootX=107;
const convert=path=>path.map(([x,y])=>[(x-rootX)*scale,(y-maxY)*scale]);
fs.writeFileSync(new URL('grav-cannon.shape.json',import.meta.url),JSON.stringify({source:'grav-cannon.svg',length:2.2,regions:regions.map(r=>({...r,outline:convert(r.outline),thickness:.08+.42*(1-r.brightness)/(1-179/255)})),traces:traces.map(convert)},null,2)+'\n');
