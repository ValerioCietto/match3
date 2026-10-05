(() => {
  'use strict';
  const canvas=document.querySelector('#lair'),ctx=canvas.getContext('2d');
  const background=document.createElement('canvas');background.width=1200;background.height=750;
  const art=background.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const braziers=[{x:449,y:425,s:.48},{x:751,y:425,s:.48},{x:302,y:511,s:.78},{x:898,y:511,s:.78},{x:123,y:650,s:1.22},{x:1077,y:650,s:1.22}];
  const standards=[{x:173,y:16,s:1.18},{x:341,y:68,s:.79},{x:859,y:68,s:.79},{x:1027,y:16,s:1.18}];
  let time=0,last=null,lastPaint=-Infinity;
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function curve(c,pts,color,width=1){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function arch(c,x,y,w,h,color){c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,Math.PI*2);c.lineTo(x+w,y+h);c.closePath();c.fillStyle=color;c.fill();}
  function scroll(c,x,y,s,flip=1){
    c.save();c.translate(x,y);c.scale(s*flip,s);
    curve(c,[0,35,-37,22,-36,-13,-12,-14],'#8f7960',2.5);curve(c,[-12,-14,13,-13,11,11,-2,7],'#b29a73',2);
    curve(c,[0,35,14,9,35,5,27,-9],'#8f7960',2.5);
    poly(c,[[0,33],[-5,12],[-16,6],[-10,25]],'#66563f');poly(c,[[4,24],[14,3],[23,-2],[16,18]],'#9b865f');c.restore();
  }
  function column(x,y,s){
    art.save();art.translate(x,y);art.scale(s,s);
    rect(art,-28,0,56,425,'#26232d');rect(art,-17,0,11,425,'#43404a');rect(art,11,0,7,425,'#393841');
    for(let i=0;i<5;i++)line(art,[[-22+i*11,20],[-22+i*11,408]],'#96857a22',1.5);
    rect(art,-40,-7,80,13,'#776e61');rect(art,-33,8,66,8,'#504938');
    for(const side of [-1,1])scroll(art,side*19,-11,.65,side);
    for(let i=0;i<5;i++)poly(art,[[-24+i*12,12],[-19+i*12,-5],[-12+i*12,12],[-18+i*12,22]],'#897a59');
    rect(art,-34,418,68,13,'#5c5752');rect(art,-44,431,88,18,'#35343e');line(art,[[-44,431],[44,431]],'#aa9c7b77',2);art.restore();
  }
  function throne(){
    // Carved gilt acanthus, a velvet back, clawed feet and a crown-like crest.
    arch(art,540,236,120,184,'#8c785b');arch(art,548,246,104,166,'#21172d');arch(art,556,254,88,146,'#51325f');
    for(let i=0;i<5;i++){
      const y=285+i*22;line(art,[[559,y],[600,y+20],[641,y]],'#795782',1);ellipse(art,600,y+20,2,2,'#c0a070');
    }
    for(const side of [-1,1]){
      scroll(art,600+side*63,257,.85,side);scroll(art,600+side*78,344,.75,side);
      line(art,[[600+side*68,366],[600+side*67,408],[600+side*76,426]],'#9b815d',7);
      ellipse(art,600+side*76,425,10,4,'#aa9168');ellipse(art,600+side*73,355,10,10,'#b7a078');
      line(art,[[600+side*74,362],[600+side*49,362]],'#b8a17b',9);
    }
    rect(art,548,390,104,22,'#251a31');ellipse(art,600,390,53,10,'#684477');line(art,[[549,403],[651,403]],'#ad956e',3);
    poly(art,[[567,251],[557,222],[580,235],[588,207],[600,229],[613,207],[621,234],[646,219],[634,252]],'#a48b60');
    ellipse(art,600,244,9,13,'#6ab59b');ellipse(art,598,240,3,5,'#c0f7d0');
    // Skull relief above the empty seat.
    ellipse(art,600,188,15,16,'#a49b82');ellipse(art,594,187,4,5,'#292a2c');ellipse(art,606,187,4,5,'#292a2c');poly(art,[[600,191],[597,197],[603,197]],'#353238');
    for(let x=593;x<608;x+=4)line(art,[[x,199],[x,205]],'#9d957d',2);
    for(const side of [-1,1])scroll(art,600+side*26,173,.7,side);
  }
  function build(){
    const wall=art.createRadialGradient(600,310,40,600,330,700);wall.addColorStop(0,'#38303d');wall.addColorStop(1,'#0c1018');art.fillStyle=wall;art.fillRect(0,0,1200,750);
    // Nested barrel vaults, gilded moldings and dark marble wall panels.
    for(const [x,y,w,h] of [[85,-216,1030,860],[243,-89,714,648],[391,60,418,453]]){
      arch(art,x,y,w,h,'#4b4446');arch(art,x+8,y+9,w-16,h-9,'#1b1c27');
      arch(art,x+20,y+22,w-40,h-22,'#6f615044');arch(art,x+24,y+27,w-48,h-27,'#20202c');
    }
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side<0?52+i*145:1048-i*145,y=195+i*41,w=86-i*12;
      arch(art,x,y,w,300-i*43,'#524941');arch(art,x+6,y+7,w-12,289-i*43,'#101721');
      scroll(art,x+w/2,y-19,.6,side);
    }
    arch(art,474,156,252,300,'#78664f');arch(art,482,165,236,291,'#171725');
    // A scalloped velvet canopy anchors the throne at the far end of the room.
    poly(art,[[469,174],[731,174],[716,210],[685,218],[647,206],[600,220],[552,206],[513,218],[484,210]],'#38243f');
    curve(art,[481,179,490,241,511,249,507,319],'#5a3a5f',14);curve(art,[719,179,710,241,689,249,693,319],'#5a3a5f',14);
    for(let i=0;i<9;i++)scroll(art,492+i*27,146,.35,i%2?1:-1);
    poly(art,[[0,520],[480,413],[720,413],[1200,520],[1200,750],[0,750]],'#20222c');
    for(let i=0;i<10;i++){const q=i/9,y=424+q*q*326;line(art,[[0,y],[1200,y]],'#5c596233',1);}
    for(let x=-1100;x<=2300;x+=190)line(art,[[600,405],[x,750]],'#76707933',1);
    for(let i=0;i<4;i++){
      const x=440-i*24,y=418+i*15,w=320+i*48;rect(art,x,y,w,15,'#3b3740');line(art,[[x,y],[x+w,y]],'#a69b8077',2);
    }
    // A violet runner climbs the dais and widens toward the viewer.
    const carpet=art.createLinearGradient(0,410,0,750);carpet.addColorStop(0,'#4a285e');carpet.addColorStop(1,'#70378b');
    poly(art,[[558,405],[642,405],[824,750],[376,750]],carpet);
    for(const side of [-1,1]){
      line(art,[[600+side*37,414],[600+side*208,750]],'#b29a6866',3);
      line(art,[[600+side*33,414],[600+side*192,750]],'#b29a6833',1);
      for(let i=0;i<14;i++){const q=i/13,y=448+q*q*302,x=600+side*(52+q*q*151);poly(art,[[x,y-4],[x+3,y],[x,y+4],[x-3,y]],'#c3a27b66');}
    }
    for(let i=0;i<4;i++)line(art,[[548-i*8,430+i*15],[652+i*8,430+i*15]],'#b092c02a',2);
    throne();
    for(const [x,y,s] of [[418,166,.62],[782,166,.62],[282,108,.93],[918,108,.93],[67,3,1.42],[1133,3,1.42]])column(x,y,s);
    for(const b of braziers){
      art.save();art.translate(b.x,b.y);art.scale(b.s,b.s);
      ellipse(art,0,8,29,7,'#070e1677');poly(art,[[-23,5],[-12,-5],[-5,-61],[5,-61],[12,-5],[23,5]],'#605c4c');
      line(art,[[0,-3],[0,-58]],'#a19669',3);
      for(const side of [-1,1])scroll(art,side*9,-43,.45,side);
      poly(art,[[-33,-76],[33,-76],[20,-55],[-20,-55]],'#373e37');ellipse(art,0,-76,34,8,'#9eac76');ellipse(art,0,-78,28,5,'#294c35');
      line(art,[[-20,-57],[20,-57]],'#a69565',3);art.restore();
    }
  }
  function standard(b,index){
    ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.s,b.s);const sway=Math.sin(time*.65+index)*3;
    line(ctx,[[-30,-30],[-30,21]],'#7b7968',1);line(ctx,[[30,-30],[30,21]],'#7b7968',1);line(ctx,[[-45,21],[45,21]],'#9c8862',3);
    poly(ctx,[[-37,23],[37,23],[34+sway,197],[25+sway,182],[18+sway,212],[7+sway,189],[-1+sway,216],[-10+sway,199],[-20+sway,213],[-23+sway,188],[-36+sway,199]],'#352639');
    line(ctx,[[-32,26],[-30+sway,183]],'#8a705655',2);line(ctx,[[32,26],[30+sway,180]],'#8a705655',2);
    curve(ctx,[-14,25,-25,83,-3,117,-16+sway,182],'#71587833',6);curve(ctx,[13,24,4,76,24,145,13+sway,188],'#090e1a55',9);
    // Faded crown-and-eye heraldry, interrupted by rents in the fabric.
    poly(ctx,[[-19,81],[-23,61],[-7,70],[0,52],[8,70],[23,61],[19,81]],'#9c896655');
    poly(ctx,[[-20,100],[0,89],[20,100],[0,112]],'#af9a6a77');ellipse(ctx,0,100,4,8,'#141e24');
    poly(ctx,[[19,128],[12,141],[19,137],[14,157],[25,136]],'#111823');line(ctx,[[-22+sway,194],[-25+sway,218]],'#6a5962',1);ctx.restore();
  }
  function flame(b,index){
    ctx.save();ctx.translate(b.x,b.y-78*b.s);ctx.scale(b.s,b.s);
    const pulse=.92+Math.sin(time*3+index)*.08,glow=ctx.createRadialGradient(0,-21,3,0,-21,108);
    glow.addColorStop(0,'#86ff8355');glow.addColorStop(.38,'#50eb6122');glow.addColorStop(1,'#45e67500');ctx.fillStyle=glow;ctx.fillRect(-110,-132,220,220);
    for(let i=0;i<4;i++){
      const x=-18+i*12,tip=-48-(i%2)*24+Math.sin(time*5+i+index)*9,bend=Math.sin(time*3.2+i)*10;
      ctx.beginPath();ctx.moveTo(x-12,1);ctx.bezierCurveTo(x-23,-22,x+17+bend,tip+24,x+bend,tip*pulse);ctx.bezierCurveTo(x+28+bend,tip+30,x+19,-14,x+11,1);ctx.closePath();ctx.fillStyle=['#2dbe66','#69eb77','#a3ff91','#50df73'][i];ctx.fill();
    }
    ellipse(ctx,0,0,23,4,'#d2ffb8');
    for(let i=0;i<5;i++){const age=(time*.35+i*.21+index*.1)%1;ellipse(ctx,Math.sin(i*8+age*5)*22,-15-age*89,1.2,1.9,`rgba(161,255,155,${(1-age)*.7})`);}
    ctx.restore();
  }
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?150:32))return;
    if(last!==null&&!reduced.matches)time+=Math.min((now-last)/1000,.1);last=now;lastPaint=now;
    ctx.drawImage(background,0,0);standards.forEach(standard);
    for(const b of braziers){
      ctx.save();ctx.globalAlpha=.09;ellipse(ctx,b.x,b.y+23*b.s,39*b.s,6*b.s,'#83f79f');ctx.restore();
    }
    braziers.forEach(flame);
    const vignette=ctx.createRadialGradient(600,370,210,600,370,735);vignette.addColorStop(0,'#03050d00');vignette.addColorStop(1,'#03050d99');ctx.fillStyle=vignette;ctx.fillRect(0,0,1200,750);
  }
  canvas.width=1200;canvas.height=750;build();requestAnimationFrame(render);
})();
