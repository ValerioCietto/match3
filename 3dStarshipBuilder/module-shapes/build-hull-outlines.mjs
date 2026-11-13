import fs from 'node:fs';
for(const name of ['interceptor','warlord']){
 const svg=fs.readFileSync(new URL(name+'.svg',import.meta.url),'utf8'),tokens=svg.match(/\sd="([^"]+)"/)[1].match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);let i=0,cmd,x=0,y=0;const outline=[];
 while(i<tokens.length){if(/^[a-z]$/i.test(tokens[i]))cmd=tokens[i++];const rel=cmd===cmd.toLowerCase();switch(cmd.toLowerCase()){case 'm':case 'l':{const a=+tokens[i++],b=+tokens[i++];x=rel?x+a:a;y=rel?y+b:b;outline.push([x,y]);if(cmd==='m')cmd='l';if(cmd==='M')cmd='L';break;}case 'h':{const a=+tokens[i++];x=rel?x+a:a;outline.push([x,y]);break;}case 'v':{const a=+tokens[i++];y=rel?y+a:a;outline.push([x,y]);break;}case 'z':i=tokens.length;break;default:throw Error('Unsupported SVG command '+cmd);}}
 const min=[0,1].map(a=>Math.min(...outline.map(p=>p[a]))),max=[0,1].map(a=>Math.max(...outline.map(p=>p[a]))),scale=3.4/Math.max(max[0]-min[0],max[1]-min[1]);
 const clean=[];for(const p of outline){const v=p.map((v,a)=>(v-(min[a]+max[a])/2)*scale);if(!clean.length||Math.hypot(v[0]-clean.at(-1)[0],v[1]-clean.at(-1)[1])>1e-6)clean.push(v);}if(Math.hypot(clean[0][0]-clean.at(-1)[0],clean[0][1]-clean.at(-1)[1])<1e-6)clean.pop();
 fs.writeFileSync(new URL(name+'.outline.json',import.meta.url),JSON.stringify({source:name+'.svg',outline:clean},null,2)+'\n');
}
