(() => {
  'use strict';
  const canvas=document.querySelector('#happy-flower'),ctx=canvas.getContext('2d');
  const buttons=[...document.querySelectorAll('[data-mode]')],status=document.querySelector('#status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const background=document.createElement('canvas');background.width=900;background.height=562;
  const art=background.getContext('2d');
  const durations={attack:3.2,photo:4.8};
  const labels={idle:'Idle ? a soft chorus of laughter',attack:'Attack ? razor-leaf storm',photo:'Aggressive photosynthesis ? healing above, roots below',die:'Falling ? the laughter stops'};
  const descriptions={idle:'A three-headed sunflower softly laughs: left :), larger center :D, right XD.',attack:'The giant happy flower unleashes a storm of spinning razor leaves.',photo:'Sun rays make all three heads glow yellow. Healing plus signs rise from the soil while roots pierce upward from below.',die:'The left head is cut first, then the right. The center changes to o.o, waits one second, and is cut last.'};
  const heads=[{x:299,y:263,s:.72,cut:.35,side:-1,face:'smile'},{x:541,y:258,s:.72,cut:1.05,side:1,face:'xd'},{x:420,y:168,s:1.06,cut:2.05,side:.25,face:'grin'}];
  let mode='idle',age=0,time=0,last=null,lastPaint=-Infinity;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function curve(c,pts,color,width){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  function garden(){
    const sky=art.createLinearGradient(0,0,0,562);sky.addColorStop(0,'#203e38');sky.addColorStop(.6,'#819c67');sky.addColorStop(1,'#243b2c');art.fillStyle=sky;art.fillRect(0,0,900,562);
    const sun=art.createRadialGradient(732,65,6,732,65,150);sun.addColorStop(0,'#fff4bb99');sun.addColorStop(1,'#ffe7a200');art.fillStyle=sun;art.fillRect(572,0,328,225);ellipse(art,732,65,25,25,'#f1e1a3');
    for(let i=0;i<12;i++){
      const x=i*84-13;curve(art,[x,418,x-32,296,x+12,187,x-15,0],'#233b32',16+i%3*8);ellipse(art,x,84,94,72,'#193b30');ellipse(art,x+21,166,63,46,'#31513a');
    }
    for(let i=0;i<4;i++)poly(art,[[704+i*18,0],[340+i*45,420],[422+i*44,420],[715+i*18,0]],'#f2eab70b');
    poly(art,[[0,402],[162,377],[337,414],[522,383],[711,396],[900,362],[900,562],[0,562]],'#344b2e');
    ellipse(art,453,483,258,60,'#6c6b3e');ellipse(art,453,482,228,49,'#837349');
    for(let i=0;i<230;i++){
      const x=(i*139.3)%900,y=406+(i*47.7)%157;
      if(x>229&&x<689&&y>446&&y<511){ellipse(art,x,y,1+i%3,.8,'#b5a46c66');continue;}
      line(art,[[x,y],[x-5,y-10-i%9],[x+1,y-3],[x+5,y-16]],i%2?'#63844a':'#253d2e',1.3);
    }
    for(const [x,y,s] of [[155,452,.8],[729,446,.6],[789,510,.9],[77,515,1]]){
      line(art,[[x,y],[x,y-25*s]],'#86a360',2);for(let j=0;j<6;j++)ellipse(art,x+Math.cos(j)*5*s,y-25*s+Math.sin(j)*5*s,4*s,3*s,'#c5c0a2');ellipse(art,x,y-25*s,3*s,3*s,'#d8b05b');
    }
  }
  function leaf(x,y,angle,scale=1){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
    // Pointed, serrated edges make the launched leaves read as blades.
    poly(ctx,[[0,0],[17,-12],[18,-18],[32,-18],[38,-25],[47,-21],[68,-20],[88,-4],[70,3],[61,13],[47,11],[36,18],[25,9],[16,11]],'#548d3e');
    poly(ctx,[[0,0],[88,-4],[70,3],[61,13],[47,11],[36,18],[25,9],[16,11]],'#315e37');
    line(ctx,[[1,0],[78,-4]],'#c4db7b',1.6);
    for(let i=1;i<5;i++){const xx=i*13;line(ctx,[[xx,-2],[xx-6,-13]],'#8caf58',1);line(ctx,[[xx,-2],[xx-7,8]],'#83a856',1);}
    ctx.restore();
  }
  function face(expression){
    for(let layer=0;layer<2;layer++)for(let i=0;i<18;i++){
      ctx.save();ctx.rotate(i*Math.PI/9+layer*.1);
      ctx.beginPath();ctx.moveTo(-9,-42);ctx.bezierCurveTo(-22,-60,-12,-80,0,-89+layer*6);ctx.bezierCurveTo(15,-78,22,-60,9,-42);ctx.closePath();ctx.fillStyle=layer?'#ffd85d':'#dba035';ctx.fill();line(ctx,[[0,-49],[0,-77]],'#ffefad66',1);ctx.restore();
    }
    ellipse(ctx,0,0,52,53,'#8f582d');ellipse(ctx,0,-2,47,47,'#c08a42');
    for(let i=0;i<50;i++){const a=i*2.4,r=12+Math.sqrt(i/50)*31;ellipse(ctx,Math.cos(a)*r,Math.sin(a)*r,1,1.4,'#f4c97944');}
    if(expression==='shock'){
      for(const x of [-19,19]){ellipse(ctx,x,-9,10,12,'#fff1c5');ellipse(ctx,x,-9,3.5,4.5,'#382819');}
      ellipse(ctx,0,17,2.6,2.6,'#382819');
    }else{
      for(const x of [-19,19]){
        if(expression==='xd'){line(ctx,[[x-7,-17],[x+7,-3]],'#483020',3.5);line(ctx,[[x+7,-17],[x-7,-3]],'#483020',3.5);}
        else ellipse(ctx,x,-10,4,7,'#483020');
      }
      if(expression==='smile')curve(ctx,[-22,12,-12,36,12,36,22,12],'#483020',4);
      else{
        ctx.beginPath();ctx.moveTo(-24,9);ctx.lineTo(24,9);ctx.bezierCurveTo(22,46,-22,46,-24,9);ctx.fillStyle='#513022';ctx.fill();
        line(ctx,[[-19,12],[19,12]],'#fff2c8',5);ellipse(ctx,0,28,12,5,'#d58c75');
      }
      ellipse(ctx,-34,9,7,4,'#e9a265');ellipse(ctx,34,9,7,4,'#e9a265');
    }
  }
  function rootSpikes(t){
    const duration=4.8;
    for(let i=0;i<7;i++){
      const start=.48+i*.19,q=clamp((t-start)/.36),retract=1-ease((t-(duration-.65))/.6);
      if(q===0)continue;
      const x=[116,190,249,617,685,762,822][i],height=(85+i%3*32)*ease(q)*retract,y=488+i%2*13;
      ellipse(ctx,x,y,21,6,'#322d22');
      poly(ctx,[[x-16,y],[x-11,y-height*.45],[x+12,y-height],[x+7,y-height*.39],[x+17,y]],'#69503b');
      poly(ctx,[[x-4,y],[x-2,y-height*.45],[x+12,y-height],[x+7,y-height*.39],[x+17,y]],'#9d8051');
      line(ctx,[[x-1,y-5],[x+2,y-height*.37],[x+11,y-height+4]],'#bdab6b',2);
      if(q<1&&!reduced.matches)for(let j=0;j<4;j++){const dx=(j-1.5)*18*q,dy=Math.sin(q*Math.PI)*33;ellipse(ctx,x+dx,y-dy-j%2*9,3,2,'#837149');}
    }
  }
  function sunlight(t){
    ctx.save();ctx.globalAlpha=reduced.matches?.9:Math.min(1,t*2,(4.8-t)*2);
    for(let i=0;i<6;i++){
      const beam=ctx.createLinearGradient(670+i*30,0,320+i*35,477);beam.addColorStop(0,'#fff2a96b');beam.addColorStop(1,'#ffe86b00');
      poly(ctx,[[640+i*39,0],[665+i*39,0],[420+i*41,493],[320+i*40,493]],beam);
    }
    for(const h of heads){const halo=ctx.createRadialGradient(h.x,h.y,22,h.x,h.y,124*h.s);halo.addColorStop(0,'#ffe66a66');halo.addColorStop(1,'#ffe66a00');ctx.fillStyle=halo;ctx.fillRect(h.x-140,h.y-140,280,280);}
    ellipse(ctx,420,481,128,16,'#fff09a33');ctx.restore();
  }
  function healing(t){
    ctx.save();ctx.shadowColor='#fff291';ctx.shadowBlur=9;
    for(let i=0;i<18;i++){
      const h=heads[i%3],q=(t*.48+Math.floor(i/3)/6)%1,x=420+(h.x-420)*q+Math.sin(i*2.9)*30,y=483+(h.y-483)*q,s=5+Math.sin(q*Math.PI)*2;
      ctx.globalAlpha=Math.sin(q*Math.PI)*.9;line(ctx,[[x-s,y],[x+s,y]],'#fff7a4',3);line(ctx,[[x,y-s],[x,y+s]],'#fff7a4',3);
    }
    ctx.restore();
  }
  function plant(t){
    const dying=mode==='die',photo=mode==='photo';
    ellipse(ctx,420,485,141,17,'#1b2a2255');
    curve(ctx,[420,480,393,427,439,391,420,345],'#386738',29);curve(ctx,[412,474,389,426,432,390,413,345],'#8ca953',6);
    for(const side of [-1,1])for(let i=0;i<3;i++)curve(ctx,[420,477,420+side*25,460,420+side*(42+i*13),470,420+side*(56+i*15),485],'#54733e',7-i);
    // One stalk splits into three branches. Their stumps remain after the cuts.
    for(const h of heads){
      const cut=dying&&t>=h.cut,endY=h.y+48*h.s;
      curve(ctx,[420,345,420+(h.x-420)*.35,318,h.x,endY+43,h.x,endY],'#4e7f3e',15*h.s);
      curve(ctx,[416,345,416+(h.x-420)*.35,318,h.x-3,endY+43,h.x-3,endY],'#a2bb60',3);
      if(cut)ellipse(ctx,h.x,endY,8*h.s,3.5*h.s,'#e4e5aa');
    }
    for(const [x,y,a,s] of [[410,413,3.55,.9],[426,397,-.25,1],[383,334,3.6,.75],[466,328,-.7,.8]])leaf(x,y,a,s);
    for(const h of heads){
      const cut=dying&&t>=h.cut,d=cut?Math.max(0,t-h.cut):0,fall=ease(d/.8);
      const laugh=dying||reduced.matches?0:Math.sin(time*3.5+h.x)*3;
      const x=h.x+fall*h.side*81,y=cut?h.y+(487-h.s*87-h.y)*fall:h.y+laugh;
      ctx.save();ctx.translate(x,y);ctx.rotate(cut?fall*h.side*1.1:dying||reduced.matches?0:Math.sin(time*1.7+h.x)*.045);ctx.scale(h.s,h.s);
      if(photo){ctx.shadowColor='#ffe264';ctx.shadowBlur=23;}
      // After the right cut, the central grin becomes o.o for exactly one second.
      face(dying&&h.face==='grin'&&t>=1.05?'shock':h.face);
      if(cut){line(ctx,[[0,48],[0,60]],'#658f43',10);ellipse(ctx,0,61,5,2,'#e4e5aa');}
      ctx.restore();
      if(cut&&d<.18){ctx.save();ctx.globalAlpha=1-d/.18;line(ctx,[[h.x-29,h.y+46*h.s],[h.x+29,h.y+37*h.s]],'#fff8dc',3);ctx.restore();}
    }
  }
  function storm(t){
    for(let i=0;i<24;i++){
      const delay=.12+i*.074,flight=(t-delay)/1.15;if(flight<0||flight>1)continue;
      const side=i%2?-1:1,x=420+side*(35+flight*620),y=343+(i%6-2.5)*22-flight*(45+i%4*27);
      line(ctx,[[x-side*55,y+8],[x-side*14,y+2]],'#e0ef9455',2);
      leaf(x,y,side*(flight*12+i),.48+i%3*.12);
    }
  }
  function select(next){mode=next;age=0;last=null;lastPaint=-Infinity;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));status.textContent=labels[next];canvas.setAttribute('aria-label',descriptions[next]);}
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?100:32))return;
    if(last!==null){const dt=Math.min((now-last)/1000,.1);age+=dt;if(!reduced.matches)time+=dt;}last=now;lastPaint=now;
    if(durations[mode]&&age>=durations[mode])select('idle');
    const t=reduced.matches?({idle:0,attack:1.25,photo:2.1,die:3.2}[mode]):age;
    ctx.drawImage(background,0,0);
    if(mode==='photo'){sunlight(t);rootSpikes(t);}
    plant(t);
    if(mode==='attack')storm(t);
    if(mode==='photo')healing(t);
    if(mode==='die'){
      const text=t<.35?'Falling · the laughter stops':t<1.05?'Left head severed':t<2.05?'Right head severed · the center stares o.o':'Center head severed · the garden falls silent';
      if(status.textContent!==text)status.textContent=text;
    }
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;const next={i:'idle',a:'attack',' ':'attack',s:'photo',d:'die'}[e.key.toLowerCase()];if(next){e.preventDefault();select(next);}});
  canvas.width=900;canvas.height=562;garden();requestAnimationFrame(render);
})();
