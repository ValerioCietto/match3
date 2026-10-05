(() => {
  'use strict';
  const canvas=document.querySelector('#city-guard'),ctx=canvas.getContext('2d');
  const buttons=[...document.querySelectorAll('[data-mode]')],status=document.querySelector('#status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const background=document.createElement('canvas');background.width=900;background.height=562;
  const art=background.getContext('2d');
  const labels={idle:'Idle · asleep on his feet',attack:'Attack · just five more minutes…',nap:'Overdue sleep nap · the floor will do',flee:'Flee · finally, the end of his shift'};
  const descriptions={idle:'A tired city guard sleeps upright in weathered armor, dented helmet and shoulder plates. His sword points to the ground and he carries a buckler.',attack:'He reluctantly opens his eyes, makes a slow half-hearted sword lunge, then returns to sleeping upright.',nap:'He slumps and falls sideways to the ground, remaining asleep with his sword and buckler beside him.',flee:'The city guard wakes and runs off to the right with his sword and buckler.'};
  let mode='idle',age=0,time=0,last=null,lastPaint=-Infinity;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function curve(c,pts,color,width){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  function build(){
    const sky=art.createLinearGradient(0,0,0,562);sky.addColorStop(0,'#18283c');sky.addColorStop(1,'#6c797a');art.fillStyle=sky;art.fillRect(0,0,900,562);
    ellipse(art,735,87,25,25,'#c6d6dc');
    for(let i=0;i<5;i++)poly(art,[[i*200-40,395],[i*200-40,195+i%2*43],[i*200+26,143+i%2*43],[i*200+91,195+i%2*43],[i*200+91,395]],'#263c4a');
    art.fillStyle='#495b63';art.fillRect(45,126,692,320);
    for(let row=0;row<13;row++){const y=126+row*25;line(art,[[45,y],[737,y]],'#293f4c',2);for(let x=45+row%2*35;x<737;x+=70)line(art,[[x,y],[x,y+25]],'#304653',1);}
    for(const x of [48,686]){art.fillStyle='#627078';art.fillRect(x,110,49,343);art.fillStyle='#86908f';art.fillRect(x-6,106,61,16);}
    art.beginPath();art.moveTo(123,444);art.lineTo(123,253);art.arc(234,253,111,Math.PI,Math.PI*2);art.lineTo(345,444);art.fillStyle='#929585';art.fill();
    art.beginPath();art.moveTo(135,444);art.lineTo(135,253);art.arc(234,253,99,Math.PI,Math.PI*2);art.lineTo(333,444);art.fillStyle='#172d3b';art.fill();
    for(let x=147;x<333;x+=21)line(art,[[x,211+Math.abs(x-234)*.5],[x,444]],'#091c2b',5);
    art.fillStyle='#304451';art.fillRect(440,195,157,57);art.fillStyle='#b6bda9';art.font='13px Georgia';art.textAlign='center';art.fillText('NIGHT WATCH',518,218);art.font='10px system-ui';art.fillText('NO SLEEPING ON DUTY',518,238);
    line(art,[[602,288],[602,361]],'#746b54',4);poly(art,[[588,303],[616,303],[611,337],[593,337]],'#c9ae69');ellipse(art,602,320,7,13,'#f8d888');
    const glow=art.createRadialGradient(602,318,4,602,318,106);glow.addColorStop(0,'#f4cd6633');glow.addColorStop(1,'#f4cd6600');art.fillStyle=glow;art.fillRect(490,207,224,225);
    art.fillStyle='#646f70';art.fillRect(0,449,900,113);for(let i=0;i<5;i++){const y=454+i*i*6;line(art,[[0,y],[900,y]],'#354d5744',1.5);}for(let x=-800;x<1700;x+=140)line(art,[[420,449],[x,562]],'#33495455',1);
    ellipse(art,726,485,59,8,'#8a9fa155');ellipse(art,124,522,88,8,'#859a9e44');
    for(let i=0;i<17;i++){const x=66+i*39,y=463+(i*43)%92;ellipse(art,x,y,2+i%3,1,'#b0b4aa44');}
  }
  function sword(x,y,angle){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    line(ctx,[[0,-13],[0,7]],'#554738',8);for(let i=0;i<4;i++)line(ctx,[[-4,-11+i*5],[4,-9+i*5]],'#a29473',1);
    ellipse(ctx,0,-17,6,5,'#85928e');line(ctx,[[-16,9],[16,9]],'#8e9e9e',5);
    poly(ctx,[[-6,13],[6,13],[5,91],[0,108],[-5,91]],'#929fa6');poly(ctx,[[0,13],[6,13],[5,91],[0,108]],'#c9d1cb');
    line(ctx,[[-4,51],[1,45]],'#506570',1);line(ctx,[[1,77],[5,73]],'#536773',1);ctx.restore();
  }
  function buckler(x,y){
    ellipse(ctx,x,y,30,34,'#414f59');ellipse(ctx,x,y,26,30,'#94a09f');ellipse(ctx,x,y,22,26,'#697e85');ellipse(ctx,x,y,11,13,'#b2bab0');ellipse(ctx,x+3,y+2,7,9,'#7a8c91');
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(ctx,x+Math.cos(a)*25,y+Math.sin(a)*29,2,2,'#d1cabb');}
    line(ctx,[[x-17,y-11],[x-4,y-22]],'#c0c6be',1.4);line(ctx,[[x+11,y+13],[x+18,y+6]],'#435c68',2);poly(ctx,[[x-23,y+9],[x-16,y+12],[x-20,y+19]],'#80664d');
  }
  function head(awake,nod){
    ctx.save();ctx.translate(0,-211);ctx.rotate(nod);
    ellipse(ctx,0,0,24,31,'#b99c84');ellipse(ctx,-23,1,4,8,'#ad8d73');ellipse(ctx,23,1,4,8,'#ad8d73');
    for(const x of [-10,11]){
      curve(ctx,[x-8,5,x-5,13,x+5,13,x+8,5],'#827477',3);
      if(awake){ellipse(ctx,x,0,7,4,'#ded5bb');ellipse(ctx,x+1,1,2,3,'#44454b');line(ctx,[[x-7,-2],[x+7,-1]],'#75645b',2);}
      else curve(ctx,[x-7,1,x-3,5,x+3,5,x+7,1],'#5b4c48',2);
    }
    poly(ctx,[[0,3],[-4,14],[5,14]],'#967c69');
    if(awake)line(ctx,[[-8,21],[7,21]],'#6e554a',2);else ellipse(ctx,0,22,4,5,'#6c544d');
    for(let i=0;i<11;i++){const x=-17+i*3;line(ctx,[[x,24+Math.abs(x)*.13],[x+1,26+Math.abs(x)*.13]],'#807169',1);}
    // A collapsed ridge and jagged rim make the metal helmet visibly dented.
    poly(ctx,[[-29,-7],[-26,-28],[-15,-41],[-4,-42],[2,-32],[11,-38],[23,-27],[28,-5],[34,0],[-34,0]],'#71858d');
    poly(ctx,[[-25,-25],[-15,-39],[-4,-40],[2,-31],[10,-36],[18,-29],[14,-7],[-26,-7]],'#a5b0ad');
    line(ctx,[[-31,-3],[-15,-5],[-5,-1],[6,-6],[30,-3]],'#c1c7ba',4);
    line(ctx,[[2,-32],[5,-20],[-2,-16]],'#526978',2);line(ctx,[[-17,-24],[-9,-30]],'#dae0d1',1);poly(ctx,[[18,-18],[25,-22],[27,-13],[20,-10]],'#82705a');
    line(ctx,[[-25,0],[-22,18],[-14,29],[11,29],[23,13],[25,0]],'#5b605c',3);ctx.restore();
  }
  function guard(t){
    const nap=mode==='nap',flee=mode==='flee',attacking=mode==='attack';
    const fall=nap?ease((t-.4)/1.25):0,thrust=attacking?ease((t-.9)/1.4)*(1-ease((t-2.5)/1.0)):0;
    const awake=flee||attacking&&t>.35&&t<3.4,phase=flee?(reduced.matches?1.1:time*10):0;
    const travel=flee?Math.max(0,t-.2)*292:0,x=448+travel+thrust*36;
    const breathing=reduced.matches?0:Math.sin(time*1.4)*1.3;
    ellipse(ctx,x-fall*92,463,69+fall*75,12,'#23374366');
    ctx.save();ctx.translate(x,451-fall*29+breathing);ctx.rotate(-fall*Math.PI/2);
    for(const side of [-1,1]){
      const stride=flee?Math.sin(phase+(side<0?Math.PI:0))*29:side*thrust*16,lift=flee?Math.max(0,Math.cos(phase+(side<0?Math.PI:0)))*17:0,foot=side*24+stride;
      line(ctx,[[side*19,-82],[side*22+stride*.35,-44],[foot,-10-lift]],'#4c5358',20);
      line(ctx,[[side*22+stride*.35,-39],[foot,-15-lift]],side<0?'#7d8f95':'#94a2a3',16);line(ctx,[[side*22+stride*.35-3,-39],[foot-3,-15-lift]],'#bbc2b6',2);
      ellipse(ctx,foot+7,-7-lift,19,9,'#514b42');line(ctx,[[foot-7,-3-lift],[foot+24,-3-lift]],'#a19377',2);
    }
    poly(ctx,[[-30,-177],[29,-177],[38,-136],[32,-103],[42,-68],[6,-61],[-5,-71],[-39,-64],[-32,-113]],'#5a6261');
    poly(ctx,[[-27,-173],[26,-173],[32,-120],[20,-104],[-24,-107],[-34,-132]],'#87969b');poly(ctx,[[-24,-168],[-3,-177],[-7,-117],[-27,-119]],'#b0b7b0');
    curve(ctx,[-26,-144,-10,-132,11,-135,28,-144],'#d0cec155',2);
    line(ctx,[[-13,-157],[0,-166]],'#556f7c',2);line(ctx,[[-9,-152],[4,-161]],'#cdd3c7',1);poly(ctx,[[17,-130],[27,-138],[29,-124],[22,-119]],'#927556');
    line(ctx,[[-31,-102],[32,-102]],'#504437',8);ctx.strokeStyle='#b29b65';ctx.lineWidth=2;ctx.strokeRect(-7,-108,14,13);
    for(const side of [-1,1]){
      poly(ctx,[[side*23,-184],[side*40,-185],[side*53,-170],[side*49,-148],[side*28,-157]],side<0?'#9aa5a5':'#7f929a');
      line(ctx,[[side*28,-179],[side*39,-178],[side*48,-165]],'#c7cbbc',3);
      line(ctx,[[side*36,-173],[side*40,-165],[side*34,-160]],'#526b77',2);
    }
    head(awake,awake?-.03:.12+(reduced.matches?0:Math.sin(time*.9)*.04));
    line(ctx,[[-37,-160],[-52,-125],[-47,-94]],'#717f83',17);ellipse(ctx,-47,-94,8,10,'#b69a80');buckler(-56,-99);
    const handX=57+thrust*48,handY=-112-thrust*20;
    line(ctx,[[37,-161],[48+thrust*24,-125],[handX,handY]],'#7d8f94',16);line(ctx,[[48+thrust*24,-125],[handX,handY]],'#b2bbb2',3);
    sword(handX,handY,-thrust*Math.PI/2+(flee?-.55:0));ellipse(ctx,handX,handY,8,10,'#bca083');
    ctx.restore();
    if(!awake&&!flee)snores(nap&&fall>.8?x-226:x+26,nap&&fall>.8?405:229);
  }
  function snores(x,y){
    ctx.save();ctx.font='italic 18px Georgia';ctx.fillStyle='#c2d8db';
    for(let i=0;i<3;i++){const q=reduced.matches?i/3:(time*.27+i/3)%1;ctx.globalAlpha=(1-q)*.8;ctx.fillText('z',x+q*24,y-q*57);}
    ctx.restore();
  }
  function select(next){mode=next;age=0;time=0;last=null;lastPaint=-Infinity;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));status.textContent=labels[next];canvas.setAttribute('aria-label',descriptions[next]);}
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?100:32))return;
    if(last!==null){const dt=Math.min((now-last)/1000,.1);age+=dt;if(!reduced.matches)time+=dt;}last=now;lastPaint=now;
    if(mode==='attack'&&age>=3.8)select('idle');
    ctx.drawImage(background,0,0);
    if(mode==='flee'&&age>=2.6){status.textContent='Gone · someone else can take the next watch';return;}
    const t=reduced.matches?({idle:0,attack:2.2,nap:2,flee:.6}[mode]):age;
    guard(t);
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;const next={i:'idle',a:'attack',' ':'attack',n:'nap',f:'flee'}[e.key.toLowerCase()];if(next){e.preventDefault();select(next);}});
  canvas.width=900;canvas.height=562;build();requestAnimationFrame(render);
})();
