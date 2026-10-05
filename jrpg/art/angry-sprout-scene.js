(() => {
  'use strict';
  const canvas=document.querySelector('#sprout'),ctx=canvas.getContext('2d');
  const buttons=[...document.querySelectorAll('[data-mode]')],status=document.querySelector('#status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const background=document.createElement('canvas');background.width=900;background.height=562;
  const art=background.getContext('2d');
  const durations={attack:2.1,sunbath:3.8};
  const labels={idle:'Idle · rooted in a bad mood',attack:'Attack · razor leaves incoming',sunbath:'Sunbathing attack · soaking up the sunshine',die:'Fallen · a very bad day in the garden'};
  const descriptions={idle:'An angry sunflower sways in a garden, with golden petals and sharp green leaves.',attack:'The angry sunflower launches its stalk leaves to the right as spinning razor leaves.',sunbath:'Sun rays strike the sunflower, which glows yellow while plus signs rise from the ground to its head.',die:'The sunflower stalk is severed halfway up. The upper half falls sideways, with X X eyes and a flat underscore mouth.'};
  const leaves=[{x:425,y:310,angle:-.5,delay:.32},{x:415,y:400,angle:Math.PI+.35,delay:.5}];
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
  function face(dead,charging){
    // Two layers of pointed golden ray petals around a textured seed disk.
    for(let layer=0;layer<2;layer++)for(let i=0;i<16;i++){
      ctx.save();ctx.rotate(i*Math.PI/8+layer*.1);
      ctx.beginPath();ctx.moveTo(-9,-42);ctx.bezierCurveTo(-21,-57,-13,-77,0,-89+layer*5);ctx.bezierCurveTo(15,-76,21,-57,9,-42);ctx.closePath();ctx.fillStyle=dead?(layer?'#c8a14c':'#a6833d'):(layer?'#f6cb45':'#d89a32');ctx.fill();line(ctx,[[0,-47],[0,-77]],'#fff0a244',1);ctx.restore();
    }
    ellipse(ctx,0,0,53,54,'#724624');ellipse(ctx,0,-2,48,48,charging?'#be8935':'#ad7034');
    for(let i=0;i<74;i++){
      const a=i*2.399,r=8+Math.sqrt(i/74)*36,x=Math.cos(a)*r,y=Math.sin(a)*r;
      ellipse(ctx,x,y,1.1,1.4,'#ebbd663d');
    }
    if(dead){
      for(const x of [-19,19]){line(ctx,[[x-8,-17],[x+8,-1]],'#382719',4);line(ctx,[[x+8,-17],[x-8,-1]],'#382719',4);}
      line(ctx,[[-13,24],[13,24]],'#382719',4);
    }else{
      for(const x of [-19,19]){ellipse(ctx,x,-5,10,12,'#f7e8b4');ellipse(ctx,x+(x<0?3:-3),-3,4,7,'#34231d');ellipse(ctx,x+(x<0?2:-4),-6,1.2,2,'#fff9dc');}
      line(ctx,[[-33,-23],[-8,-12]],'#432b23',6);line(ctx,[[8,-12],[33,-23]],'#432b23',6);
      curve(ctx,[-18,26,-6,10,7,10,19,26],'#432b23',4);
      line(ctx,[[-36,10],[-29,14]],'#d49443',2);line(ctx,[[29,14],[36,10]],'#d49443',2);
    }
  }
  function drawSprout(t){
    const dead=mode==='die',fall=dead?ease((t-.12)/1.1):0,charging=mode==='sunbath';
    const sway=reduced.matches?0:Math.sin(time*1.6)*.028;
    const recoil=mode==='attack'?Math.sin(clamp(t/.65)*Math.PI)*-.08:0;
    ellipse(ctx,440+fall*58,481,83+fall*30,12,'#1b2a2255');
    // The rooted lower stalk survives, with a clearly exposed pale cut surface.
    curve(ctx,[420,475,410,430,434,386,420,350],'#315f36',17);curve(ctx,[416,474,407,430,429,386,416,350],'#8aaa54',4);
    for(const side of [-1,1])curve(ctx,[420,473,420+side*13,463,420+side*30,470,420+side*42,483],'#527445',6);
    const attachmentScale=l=>mode==='attack'&&t>=l.delay?clamp((t-1.45)/.5):1;
    leaf(leaves[1].x,leaves[1].y,leaves[1].angle,attachmentScale(leaves[1]));
    if(dead)ellipse(ctx,420,350,9,4,'#d9dda2');
    ctx.save();ctx.translate(420+fall*17,350+fall*44);ctx.rotate(dead?fall*1.57:sway+recoil);
    curve(ctx,[0,dead?-6:1,8,-43,-8,-95,0,-135],'#3f743d',17);curve(ctx,[-4,-5,3,-45,-12,-94,-4,-135],'#a0bb5e',4);
    if(dead)ellipse(ctx,0,-6,9,4,'#d9dda2');
    leaf(5,-40,leaves[0].angle,attachmentScale(leaves[0]));
    ctx.translate(0,-135);
    if(charging){ctx.shadowColor='#ffe354';ctx.shadowBlur=24;}
    face(dead,charging);ctx.restore();
    if(dead&&t<.5){
      const a=1-t/.5;ctx.save();ctx.globalAlpha=a;line(ctx,[[389,355],[448,342]],'#fff7c4',3);ctx.restore();
    }
  }
  function razorLeaves(t){
    for(const l of leaves){
      const flight=(t-l.delay)/.85;if(flight<0||flight>1)continue;
      const x=l.x+flight*560,y=l.y-flight*98+Math.sin(flight*Math.PI)*-23;
      for(let i=0;i<3;i++)line(ctx,[[x-50-i*15,y+i*6],[x-10,y+i*6]],'#cae79155',2-i*.4);
      leaf(x,y,flight*11+l.angle,.85);
    }
  }
  function sunlight(t){
    const power=reduced.matches?.8:Math.sin(clamp(t/3.8)*Math.PI);
    ctx.save();ctx.globalAlpha=power;
    for(let i=0;i<5;i++){
      const x=658+i*41;
      const beam=ctx.createLinearGradient(x,0,420,450);beam.addColorStop(0,'#ffeda751');beam.addColorStop(.65,'#fff0a42c');beam.addColorStop(1,'#ffe78000');
      poly(ctx,[[x,0],[x+22,0],[393+i*21,450],[337+i*21,450]],beam);
    }
    const halo=ctx.createRadialGradient(420,215,32,420,215,148);halo.addColorStop(0,'#ffec7044');halo.addColorStop(.6,'#ffde4933');halo.addColorStop(1,'#ffe64d00');ctx.fillStyle=halo;ctx.fillRect(270,65,300,300);
    ellipse(ctx,420,476,80,12,'#fff19633');ctx.restore();
  }
  function healing(t){
    ctx.save();ctx.shadowColor='#fff293';ctx.shadowBlur=8;
    for(let i=0;i<10;i++){
      const progress=(t*.55+i*.1)%1,x=420+Math.sin(i*3.1)*55*(1-progress*.45),y=477-progress*288,s=4+Math.sin(progress*Math.PI)*3;
      ctx.globalAlpha=Math.sin(progress*Math.PI)*.9;
      line(ctx,[[x-s,y],[x+s,y]],'#fff7a4',3);line(ctx,[[x,y-s],[x,y+s]],'#fff7a4',3);
    }
    ctx.restore();
  }
  function select(next){
    mode=next;age=0;last=null;lastPaint=-Infinity;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));
    status.textContent=labels[next];canvas.setAttribute('aria-label',descriptions[next]);
  }
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?100:32))return;
    if(last!==null){const dt=Math.min((now-last)/1000,.1);age+=dt;if(!reduced.matches)time+=dt;}
    last=now;lastPaint=now;
    if(durations[mode]&&age>=durations[mode])select('idle');
    const t=reduced.matches?({idle:0,attack:.85,sunbath:1.7,die:1.5}[mode]):age;
    ctx.drawImage(background,0,0);
    if(mode==='sunbath')sunlight(t);
    drawSprout(t);
    if(mode==='attack')razorLeaves(t);
    if(mode==='sunbath')healing(t);
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.addEventListener('keydown',e=>{
    if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;
    const next={i:'idle',a:'attack',' ':'attack',s:'sunbath',d:'die'}[e.key.toLowerCase()];if(next){e.preventDefault();select(next);}
  });
  canvas.width=900;canvas.height=562;garden();requestAnimationFrame(render);
})();
