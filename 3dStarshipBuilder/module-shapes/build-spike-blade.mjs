import fs from 'node:fs';
const svg=fs.readFileSync(new URL('spike-blade.svg',import.meta.url),'utf8');
const paths=[...svg.matchAll(/\sd="([^"]+)"/g)].map(([,d])=>{
 const tokens=d.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi),points=[];let i=0,cmd,x=0,y=0;
 while(i<tokens.length){
  if(/^[a-z]$/i.test(tokens[i]))cmd=tokens[i++];
  const relative=cmd===cmd.toLowerCase(),kind=cmd.toLowerCase();
  if(kind==='z')break;
  if(kind==='m'||kind==='l'){const a=+tokens[i++],b=+tokens[i++];x=relative?x+a:a;y=relative?y+b:b;if(kind==='m')cmd=relative?'l':'L';}
  else if(kind==='h'){const a=+tokens[i++];x=relative?x+a:a;}
  else if(kind==='v'){const b=+tokens[i++];y=relative?y+b:b;}
  else throw Error('Unsupported SVG command: '+cmd);
  points.push([x,y]);
 }return points;
});
const outline=paths[0],minY=Math.min(...outline.map(p=>p[1])),maxY=Math.max(...outline.map(p=>p[1]));
const root=outline.find(p=>p[1]===maxY)[0],scale=1.6/(maxY-minY);
const convert=points=>points.map(([x,y])=>[(x-root)*scale,(y-maxY)*scale]);
fs.writeFileSync(new URL('spike-blade.shape.json',import.meta.url),JSON.stringify({source:'spike-blade.svg',length:1.6,outline:convert(outline),traces:paths.slice(1).map(convert)},null,2)+'\n');
