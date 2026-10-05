(() => {
  'use strict';
  const canvas=document.querySelector('#apache'),ctx=canvas.getContext('2d');
  const buttons=[...document.querySelectorAll('[data-mode]')],status=document.querySelector('#status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const background=document.createElement('canvas');background.width=900;background.height=562;
  const art=background.getContext('2d');
  const labels={idle:'Hover · holding position',attack:'Gun attack · sweeping the lower-left ground',missiles:'Missiles · air-to-ground barrage',fall:'Fall · systems failing'};
  const descriptions={idle:'A detailed olive-drab Apache hovers facing left with spinning main and tail rotors.',attack:'The left-facing Apache fires rapid gun bursts toward the lower-left corner, with tracers and ground impacts.',missiles:'A barrage of missiles flies from the stub-wing racks to the ground and erupts in explosions.',fall:'Sparks erupt on the helicopter, black smoke billows, and it falls to the ground and explodes, leaving wreckage.'};
  const launches=Array.from({length:8},(_,i)=>({at:.25+i*.24,x:62+i*43,y:493+i%3*12}));
  let mode='idle',age=0,time=0,last=null,lastPaint=-Infinity;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function build(){
    const sky=art.createLinearGradient(0,0,0,562);sky.addColorStop(0,'#647b86');sky.addColorStop(.65,'#b8bba2');sky.addColorStop(1,'#5a6051');art.fillStyle=sky;art.fillRect(0,0,900,562);
    for(let layer=0;layer<3;layer++){
      const pts=[[0,562]];for(let x=0;x<=930;x+=30)pts.push([x,338+layer*43+Math.sin(x*.013+layer)*28+Math.cos(x*.027)*17]);pts.push([900,562]);poly(art,pts,['#7f8e83','#65796d','#4b6054'][layer]);
    }
    poly(art,[[0,465],[227,444],[480,462],[718,438],[900,454],[900,562],[0,562]],'#72725a');
    for(let i=0;i<160;i++){const x=(i*113.9)%900,y=467+(i*41.3)%95;ellipse(art,x,y,1+i%4,.6+i%2,'#b9b18b55');}
    for(const [x,y] of [[81,457],[244,446],[714,449],[838,459]]){line(art,[[x,y],[x-6,y-37],[x-18,y-49]],'#3b4d43',3);line(art,[[x-5,y-25],[x+11,y-38]],'#3b4d43',2);}
  }
  function smoke(x,y,t,size=1){
    for(let i=0;i<13;i++){
      const q=(t*.24+i/13)%1;ctx.save();ctx.globalAlpha=(1-q)*.72;
      ellipse(ctx,x+Math.sin(i*4+q*3)*18*size+q*31*size,y-q*146*size,(13+q*28)*size,(11+q*25)*size,i%2?'#202725':'#111817');ctx.restore();
    }
  }
  function explosion(x,y,t,size=1){
    if(t<0||t>1.45)return;const q=t/1.45;
    ellipse(ctx,x,y,39*size,8*size,'#29312688');
    ctx.save();ctx.globalAlpha=1-q;
    for(let i=0;i<9;i++){
      const a=i*2.4,r=(9+q*49)*size,cx=x+Math.cos(a)*r,cy=y-12*size+Math.sin(a)*r*.65-q*27*size;
      ellipse(ctx,cx,cy,(13+q*18)*size,(15+q*14)*size,i%3===0?'#edac48':i%3===1?'#bc6331':'#53523e');
    }
    ellipse(ctx,x,y-13*size,(1-q)*23*size,(1-q)*31*size,'#ffe3a0');
    for(let i=0;i<10;i++){const a=i*Math.PI/10+Math.PI,r=(22+q*76)*size;line(ctx,[[x+Math.cos(a)*r,y+Math.sin(a)*r*.6],[x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9)*.6]],'#f5bc69',2);}
    ctx.restore();
  }
  function helicopter(x,y,pitch,damaged,t){
    ctx.save();ctx.translate(x,y);ctx.rotate(pitch);
    // AH-64-inspired tandem canopy, twin engine nacelles and rising tail boom.
    poly(ctx,[[37,-14],[98,-22],[259,-48],[280,-43],[267,-24],[99,9],[44,19]],'#4d5b48');
    poly(ctx,[[98,-22],[258,-48],[265,-40],[102,-13]],'#85907b');
    poly(ctx,[[245,-35],[274,-106],[288,-112],[282,-27],[300,-7],[258,-16]],'#53604b');
    poly(ctx,[[179,-22],[206,-11],[283,-17],[264,-27]],'#78816a');
    line(ctx,[[241,-13],[249,26]],'#353f36',4);ellipse(ctx,250,29,9,11,'#202a28');ellipse(ctx,250,29,3,4,'#8c9683');
    // Far wing and its rail stores sit behind the fuselage.
    poly(ctx,[[-34,-6],[11,-27],[75,-15],[78,-4],[7,3]],'#414f41');line(ctx,[[24,-5],[64,2]],'#8a9175',4);
    poly(ctx,[[-166,18],[-147,-5],[-126,-17],[-109,-41],[-77,-50],[-50,-66],[-17,-65],[8,-29],[60,-21],[91,-7],[85,24],[40,37],[-98,40],[-145,34]],'#58644e');
    poly(ctx,[[-160,23],[-100,21],[-54,31],[35,20],[85,11],[85,24],[40,37],[-98,40],[-145,34]],'#35483b');
    poly(ctx,[[-132,-9],[-105,-36],[-80,-43],[-69,-7]],'#1c3845');
    poly(ctx,[[-68,-10],[-72,-43],[-49,-60],[-21,-59],[-1,-14]],'#244450');
    poly(ctx,[[-123,-13],[-105,-31],[-88,-36],[-96,-12]],'#7cabb044');poly(ctx,[[-62,-20],[-62,-41],[-45,-53],[-30,-53],[-19,-20]],'#80afb044');
    // Two helmet silhouettes show the front gunner and higher rear pilot.
    ellipse(ctx,-99,-21,6,7,'#39483e');line(ctx,[[-99,-14],[-96,-6]],'#485b4b',9);ellipse(ctx,-42,-36,6,7,'#39483e');line(ctx,[[-42,-29],[-38,-15]],'#485b4b',9);
    line(ctx,[[-134,-9],[-105,-39],[-78,-47],[-49,-64],[-18,-63],[7,-12]],'#9aa58b',3);
    line(ctx,[[-77,-45],[-66,-8]],'#a3ae92',4);line(ctx,[[-22,-60],[-13,-13]],'#87967f',3);
    // Sensor housings at the blunt nose, with dark optical apertures.
    ellipse(ctx,-148,14,19,15,'#414c3b');ellipse(ctx,-158,13,9,10,'#172c30');ellipse(ctx,-159,10,4,5,'#718b87');ellipse(ctx,-143,33,15,10,'#576047');ellipse(ctx,-151,34,6,5,'#192b2c');
    for(const [ex,ey] of [[6,-40],[24,-25]]){
      poly(ctx,[[ex-31,ey],[ex-20,ey-14],[ex+37,ey-11],[ex+64,ey],[ex+59,ey+16],[ex-26,ey+14]],'#67735b');
      ellipse(ctx,ex-26,ey+2,10,13,'#263b31');ellipse(ctx,ex-27,ey+2,6,9,'#152b29');
      poly(ctx,[[ex+38,ey-5],[ex+69,ey+1],[ex+67,ey+12],[ex+38,ey+8]],'#2e3d34');
      for(let i=0;i<5;i++)line(ctx,[[ex+i*5,ey-9],[ex+i*5,ey+7]],'#394d3c',2);
    }
    // Near stub wing carries a rocket pod and paired missile rails.
    poly(ctx,[[-28,14],[22,9],[89,38],[72,49],[-16,35]],'#77816a');line(ctx,[[-19,34],[72,48]],'#a2a58a',2);
    line(ctx,[[11,31],[9,48]],'#394c3b',5);line(ctx,[[53,40],[52,59]],'#394c3b',5);
    poly(ctx,[[-14,46],[38,45],[43,61],[-15,62]],'#4a5642');ellipse(ctx,-15,54,10,12,'#77816a');
    for(let i=0;i<7;i++){const a=i*Math.PI/3;ellipse(ctx,-15+Math.cos(a)*5,54+Math.sin(a)*7,2,2.6,'#20332c');}
    for(let j=0;j<2;j++){line(ctx,[[32,57+j*7],[82,57+j*7]],'#414c36',5);poly(ctx,[[27,57+j*7],[37,53+j*7],[37,61+j*7]],'#839070');}
    for(const [gx,gy] of [[-89,34],[42,32]]){line(ctx,[[gx,gy],[gx-8,gy+32]],'#9ca18c',4);line(ctx,[[gx+14,gy],[gx-8,gy+32]],'#3a4b3d',3);ellipse(ctx,gx-9,gy+36,11,14,'#1b2926');ellipse(ctx,gx-9,gy+36,4,6,'#889581');}
    line(ctx,[[-113,39],[-116,51]],'#89917a',6);ellipse(ctx,-116,51,12,8,'#394b39');
    const aim=Math.atan2(510-(y+51),42-(x-116)),end={x:-116+Math.cos(aim)*34,y:51+Math.sin(aim)*34};
    line(ctx,[[-116,51],[end.x,end.y]],'#222f28',6);line(ctx,[[-113,49],[end.x+2,end.y-2]],'#879078',1.5);
    for(const pts of [[[-102,10],[-77,10],[-69,23]],[[8,23],[34,23],[43,14]],[[115,-12],[152,-19]]])line(ctx,pts,'#a7ad8b55',1);
    for(let i=0;i<14;i++)ellipse(ctx,-110+i*12,29,1,1,'#a9ad8a');
    line(ctx,[[51,-37],[61,-60]],'#465a46',2);line(ctx,[[185,-35],[181,-54]],'#43543f',1.5);
    ctx.fillStyle='#cad0b0';ctx.font='8px monospace';ctx.fillText('AH-64',3,17);
    // Four rotor blades, a low mast and the Longbow-style radar dome.
    line(ctx,[[-10,-39],[-10,-92]],'#a5ac98',7);ellipse(ctx,-10,-79,17,5,'#465849');
    const spin=reduced.matches?.6:time*(damaged?Math.max(2,24-t*6):24);
    ctx.save();ctx.translate(-10,-82);
    if(!reduced.matches){ctx.globalAlpha=.12;ellipse(ctx,0,0,223,20,'#b9c2b3');ctx.globalAlpha=1;}
    for(let i=0;i<4;i++){const a=spin+i*Math.PI/2,dx=Math.cos(a)*218,dy=Math.sin(a)*19;poly(ctx,[[0,-3],[dx,dy-3],[dx*.99,dy+3],[0,3]],i%2?'#34443a':'#5d6b58');line(ctx,[[dx*.89,dy*.89],[dx*.98,dy*.98]],'#b7b797',2);}
    ctx.restore();line(ctx,[[-10,-85],[-10,-103]],'#465745',5);ellipse(ctx,-10,-107,32,10,'#5b6853');line(ctx,[[-35,-109],[12,-112]],'#939c80',2);
    ctx.save();ctx.translate(278,-43);ctx.rotate(spin*1.3);
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);poly(ctx,[[-3,0],[-4,-36],[2,-38],[4,0]],'#283c34');line(ctx,[[-3,-32],[2,-32]],'#c9bea0',3);}
    ctx.restore();ellipse(ctx,278,-43,5,5,'#a6ac97');ctx.restore();
    return {x:x+end.x,y:y+end.y};
  }
  function gunfire(origin,t){
    if(t<.2||t>2.5)return;
    for(let i=0;i<7;i++){
      const q=(t*3.4+i/7)%1,target={x:32+i*8,y:516+i%2*8},x=origin.x+(target.x-origin.x)*q,y=origin.y+(target.y-origin.y)*q;
      line(ctx,[[x,y],[x+(target.x-origin.x)*.035,y+(target.y-origin.y)*.035]],'#ffd187',2);
    }
    // Small muzzle flames and dust impacts, without full-screen flashing.
    poly(ctx,[[origin.x+3,origin.y-4],[origin.x-20,origin.y+11],[origin.x-8,origin.y+4],[origin.x-12,origin.y+18],[origin.x+3,origin.y+3]],'#ffe6a3');
    for(let i=0;i<5;i++){const q=(t*2+i*.19)%1;ellipse(ctx,38+i*11,520-q*15,3+q*8,2+q*6,'#a68a5f77');}
  }
  function missiles(t){
    for(let i=0;i<launches.length;i++){
      const m=launches[i],q=(t-m.at)/.9;if(q<0)continue;
      if(q>=1){explosion(m.x,m.y,t-m.at-.9,.65);continue;}
      const start={x:530+(i%2)*21,y:288},x=start.x+(m.x-start.x)*q,y=start.y+(m.y-start.y)*q*q;
      const angle=Math.atan2(2*(m.y-start.y)*q,m.x-start.x);
      for(let j=1;j<7;j++){const trail=Math.max(0,q-j*.025);ellipse(ctx,start.x+(m.x-start.x)*trail,start.y+(m.y-start.y)*trail*trail,2+j*.8,2+j*.8,'#e2d9b33c');}
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);poly(ctx,[[-19,-3],[-32,0],[-19,3]],'#ffd180');poly(ctx,[[-17,-3],[10,-3],[19,0],[10,3],[-17,3]],'#c0c4ad');poly(ctx,[[-10,-2],[-17,-9],[-16,9],[-10,2]],'#53644c');ctx.restore();
    }
  }
  function wreck(){
    ellipse(ctx,483,505,129,16,'#202820aa');poly(ctx,[[351,499],[380,464],[453,456],[503,475],[564,478],[579,502]],'#303c32');
    poly(ctx,[[382,465],[409,459],[416,480],[369,487]],'#1a2d31');poly(ctx,[[531,480],[681,454],[710,469],[582,497]],'#43513c');
    line(ctx,[[455,472],[373,431]],'#6e7960',5);line(ctx,[[401,450],[552,460]],'#394c3b',4);line(ctx,[[578,501],[624,517]],'#606c54',4);ellipse(ctx,474,499,13,10,'#101f1a');
  }
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?100:32))return;
    if(last!==null){const dt=Math.min((now-last)/1000,.1);age+=dt;if(!reduced.matches)time+=dt;}last=now;lastPaint=now;
    if(mode==='attack'&&age>=2.8||mode==='missiles'&&age>=4.5)select('idle');
    const t=reduced.matches?({idle:0,attack:.8,missiles:1.9,fall:4.5}[mode]):age;
    ctx.drawImage(background,0,0);
    if(mode==='fall'&&t>=2.6){wreck();smoke(456,458,t,1.15);explosion(455,487,t-2.6,1.9);status.textContent='Down · wreckage in the lowlands';return;}
    const dropping=mode==='fall'?ease((t-1)/1.6):0,x=500-dropping*20,y=239+dropping*180+(reduced.matches?0:Math.sin(time*1.7)*5),pitch=-dropping*.16;
    ellipse(ctx,x,488,134-dropping*20,12+dropping*4,'#293d323b');
    const origin=helicopter(x,y,pitch,mode==='fall',t);
    if(mode==='attack')gunfire(origin,t);
    if(mode==='missiles')missiles(t);
    if(mode==='fall'){
      if(t>.55)smoke(x+25,y-25,t,.9);
      if(t<1.6)for(let i=0;i<12;i++){const q=(t*1.7+i/12)%1,a=i*2.4,r=q*56;line(ctx,[[x+20+Math.cos(a)*r,y-23+Math.sin(a)*r],[x+20+Math.cos(a)*(r+7),y-23+Math.sin(a)*(r+7)]],'#ffd27b',1.5);}
    }
  }
  function select(next){mode=next;age=0;time=0;last=null;lastPaint=-Infinity;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));status.textContent=labels[next];canvas.setAttribute('aria-label',descriptions[next]);}
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;const next={i:'idle',a:'attack',' ':'attack',m:'missiles',f:'fall'}[e.key.toLowerCase()];if(next){e.preventDefault();select(next);}});
  canvas.width=900;canvas.height=562;build();requestAnimationFrame(render);
})();
