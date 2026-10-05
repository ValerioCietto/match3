(() => {
  'use strict';
  const canvas=document.querySelector('#cat-wolf'),ctx=canvas.getContext('2d');
  const buttons=[...document.querySelectorAll('[data-mode]')],status=document.querySelector('#status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const background=document.createElement('canvas');background.width=900;background.height=562;
  const art=background.getContext('2d');
  const labels={idle:'Idle · she is watching you',run:'Run · a four-pawed gallop',attack:'Claw attack · mind those claws',away:'Run away · turning tail'};
  const descriptions={idle:'A female monster with a cat head, furry wolf body, bushy tail and trousers stands on four paws.',run:'The cat-wolf gallops toward the right on all four legs, her trousers and tail moving with her stride.',attack:'The cat-wolf lunges right and swipes a raised front paw with extended claws.',away:'The cat-wolf turns around and runs off the left side, opposite her normal running direction.'};
  let mode='idle',age=0,time=0,last=null,lastPaint=-Infinity;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function curve(c,pts,color,width){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  function build(){
    const sky=art.createLinearGradient(0,0,0,562);sky.addColorStop(0,'#17243b');sky.addColorStop(.7,'#647c89');sky.addColorStop(1,'#263c46');art.fillStyle=sky;art.fillRect(0,0,900,562);
    const glow=art.createRadialGradient(704,90,14,704,90,139);glow.addColorStop(0,'#cfdeed66');glow.addColorStop(1,'#cfdeed00');art.fillStyle=glow;art.fillRect(560,0,290,239);ellipse(art,704,90,29,29,'#d2e0e8');
    for(let layer=0;layer<3;layer++)for(let i=0;i<12;i++){
      const x=i*93+layer*27-40,y=263+layer*53,h=100+(Math.sin(i*31+layer)+1)*74;
      poly(art,[[x,y-h],[x-39,y-32],[x-18,y-39],[x-51,y+12],[x+48,y+12],[x+18,y-38],[x+37,y-32]],['#3b5668','#2e4556','#213946'][layer]);line(art,[[x,y-4],[x,y+113]],'#263847',7);
    }
    poly(art,[[0,421],[193,386],[459,417],[700,394],[900,414],[900,562],[0,562]],'#33424a');
    poly(art,[[0,464],[360,409],[594,422],[900,489],[900,562],[0,562]],'#59616a');
    for(let i=0;i<120;i++){
      const x=(i*113.7)%900,y=438+(i*73.1)%125;
      ellipse(art,x,y,1+i%3,.7+i%2,'#c2ced42b');
      if(i%5===0)line(art,[[x,y],[x-4,y-12],[x+1,y-3],[x+7,y-17]],'#263e42',1.3);
    }
    for(const [x,y,s] of [[43,492,1],[783,455,.7],[846,527,1.2]])poly(art,[[x-20*s,y],[x-11*s,y-15*s],[x+9*s,y-21*s],[x+25*s,y-4*s],[x+15*s,y+3*s]],'#354957');
  }
  function paw(x,y,fur,claws=false){
    ellipse(ctx,x+6,y,15,8,fur);
    for(let i=0;i<3;i++){
      line(ctx,[[x+4+i*6,y-2],[x+5+i*6,y+4]],'#3a3d4b',1);
      if(claws)poly(ctx,[[x+9+i*5,y-2],[x+27+i*5,y+3],[x+10+i*5,y+4]],'#f2eada');
    }
  }
  function hindLeg(phase,near,moving=false){
    const swing=moving?Math.sin(phase):0,lift=moving?Math.max(0,Math.cos(phase)):0,hip=-75,foot=-77+swing*34;
    const color=near?'#66557b':'#413e5c';
    line(ctx,[[hip,-90],[hip+24+swing*8,-48],[foot-9,-25-lift*17]],color,24);
    line(ctx,[[hip+24+swing*8,-48],[foot-9,-25-lift*17]],near?'#a391ac':'#69617c',2);
    line(ctx,[[foot-9,-26-lift*17],[foot,-8-lift*17]],near?'#b1a6af':'#6e7385',11);
    line(ctx,[[foot-16,-28-lift*17],[foot-1,-23-lift*17]],near?'#a99ab5':'#736b86',6);
    paw(foot,-5-lift*17,near?'#bbb1b6':'#74798a');
  }
  function frontLeg(phase,near,swipe,moving=false){
    const shoulder=60,fur=near?'#a5a2b0':'#636d80';
    if(near&&swipe>0){
      const reach=Math.sin(swipe*Math.PI),x=93+reach*62,y=-49-reach*34;
      line(ctx,[[shoulder,-98],[84,-66],[x,y]],fur,17);poly(ctx,[[58,-101],[72,-96],[68,-80],[78,-74],[59,-79]],fur);paw(x,y,fur,true);return;
    }
    const swing=moving?Math.sin(phase):0,lift=moving?Math.max(0,Math.cos(phase)):0,foot=68+swing*31;
    line(ctx,[[shoulder,-99],[56+swing*16,-51],[foot,-8-lift*19]],fur,15);
    poly(ctx,[[51,-85],[65,-91],[62,-63],[70,-57],[55,-61]],fur);paw(foot,-5-lift*19,fur);
  }
  function head(blink,attack){
    ctx.save();ctx.translate(105,-132);ctx.rotate(attack?-.12:0);
    // A short feline muzzle, triangular ears, whiskers and slit pupils distinguish her head.
    poly(ctx,[[-37,-17],[-43,-65],[-10,-39],[11,-37],[39,-64],[35,-11],[42,8],[29,31],[-12,37],[-36,16]],'#b3abb7');
    poly(ctx,[[-36,-48],[-30,-22],[-15,-35]],'#9c748d');poly(ctx,[[17,-35],[33,-49],[29,-20]],'#9c748d');
    poly(ctx,[[-35,4],[-48,7],[-34,14],[-43,21],[-28,23],[-34,31],[-11,36]],'#d3c6c9');
    poly(ctx,[[28,4],[43,8],[34,14],[42,21],[24,27]],'#d3c6c9');
    poly(ctx,[[-27,-28],[-7,-49],[3,-32],[13,-42],[18,-24],[5,-12],[-1,-26],[-12,-13]],'#707186');
    for(const x of [-16,17]){
      if(blink)line(ctx,[[x-9,-3],[x+9,-2]],'#343448',2.5);
      else{ellipse(ctx,x,-4,10,7,'#d1d68f',x<0?.12:-.12);ellipse(ctx,x+2,-4,2.1,6,'#242d3a');ellipse(ctx,x-1,-6,1.6,1.6,'#fffde9');}
      line(ctx,[[x-10,-14+(x<0?-2:2)],[x+9,-14+(x<0?2:-2)]],'#515169',3);
    }
    ellipse(ctx,-5,13,12,9,'#e1d2cf');ellipse(ctx,13,13,12,9,'#e1d2cf');poly(ctx,[[-2,7],[10,7],[4,14]],'#80576b');
    line(ctx,[[4,14],[4,20],[-3,23]],'#514254',1.5);line(ctx,[[4,20],[11,23]],'#514254',1.5);
    if(attack){poly(ctx,[[-3,23],[14,23],[9,33],[1,32]],'#473445');poly(ctx,[[0,23],[3,29],[5,23]],'#eee5d8');}
    for(const side of [-1,1])for(let i=0;i<3;i++)line(ctx,[[4+side*13,12+i*4],[4+side*47,8+i*10]],'#d3d0db',.8);
    // Small ear cuff and a violet forelock accent her individual design.
    line(ctx,[[-37,-39],[-33,-42]],'#dac08c',3);ctx.restore();
  }
  function monster(t){
    const fleeing=mode==='away',running=mode==='run'||fleeing&&t>.38;
    const turn=fleeing?ease(t/.38):0,travel=fleeing?Math.max(0,t-.38)**1.15*340:0;
    const swipe=mode==='attack'?clamp((t-.2)/.65):0,lunge=mode==='attack'?Math.sin(clamp(t/1.15)*Math.PI)*49:0;
    const phase=running?(reduced.matches?1.1:time*11):0;
    const bob=running?Math.sin(phase*2)*4:reduced.matches?0:Math.sin(time*1.9)*1.5;
    const x=437-travel+lunge,y=440+bob,flip=Math.cos(turn*Math.PI);
    ellipse(ctx,x,452,154*(.45+Math.abs(flip)*.55),13,'#15213266');
    ctx.save();ctx.translate(x,y);ctx.scale(flip*1.36,1.36);
    // Broad wolf back and a long, shaggy tail; all four limbs stay animal-like.
    const wag=reduced.matches?0:Math.sin(time*(running?6:1.5))*9;
    ctx.beginPath();ctx.moveTo(-85,-102);ctx.bezierCurveTo(-139,-120,-171,-75+wag,-201,-98+wag);ctx.bezierCurveTo(-181,-36+wag,-137,-45,-92,-73);ctx.closePath();ctx.fillStyle='#747b90';ctx.fill();
    poly(ctx,[[-172,-81+wag],[-201,-98+wag],[-195,-80+wag],[-208,-80+wag],[-184,-63+wag],[-190,-57+wag],[-160,-57+wag]],'#c1b8c4');
    hindLeg(running?phase+Math.PI:0,false,running);frontLeg(running?phase:0,false,0,running);
    ellipse(ctx,-7,-104,101,43,'#85899b',-.05);
    poly(ctx,[[-82,-120],[-58,-151],[-40,-139],[-25,-152],[-11,-140],[6,-150],[18,-135],[39,-145],[64,-132],[78,-105],[71,-78],[58,-82],[51,-58],[41,-72],[25,-58],[17,-73],[-2,-65],[-29,-77]],'#9497a7');
    // Trousers wrap the hips and both hind legs, with seams, waistband and cuffs.
    poly(ctx,[[-99,-122],[-80,-140],[-51,-142],[-37,-124],[-44,-72],[-70,-65],[-104,-81]],'#66557b');
    line(ctx,[[-82,-138],[-53,-138],[-40,-123]],'#ab94ab',5);line(ctx,[[-71,-132],[-68,-94],[-83,-78]],'#ad99b1',1.5);
    poly(ctx,[[-92,-113],[-75,-111],[-78,-92],[-94,-96]],'#514764');line(ctx,[[-91,-110],[-77,-108]],'#a592ab',1);
    ellipse(ctx,-49,-127,3,3,'#ccb58b');
    hindLeg(running?phase:0,true,running);
    poly(ctx,[[40,-137],[75,-158],[86,-149],[98,-157],[115,-139],[104,-105],[91,-101],[94,-85],[77,-89],[72,-72],[60,-85],[44,-74],[46,-96],[32,-95]],'#c5bac4');
    for(let i=0;i<6;i++)line(ctx,[[34+i*10,-127],[29+i*10,-108]],'#e8d9dc44',1.5);
    frontLeg(running?phase+Math.PI:0,true,mode==='attack'?swipe:0,running);
    head(!running&&mode==='idle'&&!reduced.matches&&time%4.6>4.4,mode==='attack');ctx.restore();
    if(mode==='attack'&&t>.33&&t<.88){
      ctx.save();ctx.globalAlpha=Math.sin((t-.33)/.55*Math.PI);
      for(let i=0;i<3;i++)curve(ctx,[x+205+i*12,244+i*6,x+267+i*9,277,x+232+i*12,327,x+192+i*10,357],'#f6e5f2',3);
      ctx.restore();
    }
    if(running&&!reduced.matches){
      for(let i=0;i<7;i++){const q=(time*1.8+i/7)%1,dx=x+(fleeing?1:-1)*(60+q*125);ellipse(ctx,dx,451-q*15,2+q*10,1+q*4,`rgba(168,174,187,${(1-q)*.16})`);}
    }
  }
  function select(next){mode=next;age=0;last=null;lastPaint=-Infinity;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));status.textContent=labels[next];canvas.setAttribute('aria-label',descriptions[next]);}
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?100:32))return;
    if(last!==null){const dt=Math.min((now-last)/1000,.1);age+=dt;if(!reduced.matches)time+=dt;}last=now;lastPaint=now;
    if(mode==='attack'&&age>=1.3)select('idle');
    ctx.drawImage(background,0,0);
    if(mode==='away'&&age>3.3){status.textContent='Escaped · choose an animation to bring her back';return;}
    const t=reduced.matches?({idle:0,run:0,attack:.55,away:.65}[mode]):age;
    monster(t);
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;const next={i:'idle',r:'run',a:'attack',' ':'attack',f:'away'}[e.key.toLowerCase()];if(next){e.preventDefault();select(next);}});
  canvas.width=900;canvas.height=562;build();requestAnimationFrame(render);
})();
