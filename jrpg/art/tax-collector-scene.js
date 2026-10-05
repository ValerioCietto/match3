(() => {
  'use strict';
  const canvas=document.querySelector('#tax-collector'),ctx=canvas.getContext('2d');
  const buttons=[...document.querySelectorAll('[data-mode]')],status=document.querySelector('#status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const background=document.createElement('canvas');background.width=900;background.height=562;
  const art=background.getContext('2d');
  const labels={idle:'Idle · counting on your contribution',attack:'Mace attack · the price of resistance',collect:'Collect taxes · your gold comes to him',away:'Run away · a costly retreat'};
  const descriptions={idle:'A human in a dollar-embroidered cloth tunic tosses a money bag and catches it in the same hand.',attack:'The tax collector swings a mace topped by a large golden dollar sign.',collect:'Telekinetic coins fly from the left at hip height into a purse at his right hip.',away:'The tax collector runs right, spilling a trail of gold coins behind him.'};
  let mode='idle',age=0,time=0,last=null,lastPaint=-Infinity;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function curve(c,pts,color,width){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  function dollar(c,x,y,size,color){c.fillStyle=color;c.font=`bold ${size}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',x,y);}
  function build(){
    const sky=art.createLinearGradient(0,0,0,562);sky.addColorStop(0,'#69838b');sky.addColorStop(1,'#c3b99c');art.fillStyle=sky;art.fillRect(0,0,900,562);
    poly(art,[[0,262],[94,153],[206,258],[324,132],[429,248],[600,144],[732,218],[900,180],[900,562],[0,562]],'#566b6a');
    art.fillStyle='#737c73';art.fillRect(70,129,740,306);
    for(let row=0;row<14;row++){const y=129+row*23;line(art,[[70,y],[810,y]],'#465e5b',1);for(let x=70+(row%2)*29;x<810;x+=58)line(art,[[x,y],[x,y+23]],'#4e635c',1);}
    for(const x of [64,196,692,808]){art.fillStyle='#929589';art.fillRect(x,111,26,325);art.fillStyle='#b5b39c';art.fillRect(x-7,101,40,16);}
    art.beginPath();art.moveTo(334,438);art.lineTo(334,259);art.arc(445,259,111,Math.PI,Math.PI*2);art.lineTo(556,438);art.fillStyle='#b4aa8d';art.fill();
    art.beginPath();art.moveTo(349,438);art.lineTo(349,259);art.arc(445,259,96,Math.PI,Math.PI*2);art.lineTo(541,438);art.fillStyle='#2e4341';art.fill();
    for(let x=359;x<541;x+=22)line(art,[[x,211+Math.abs(x-445)*.5],[x,438]],'#1d3434',5);
    art.fillStyle='#334641';art.fillRect(351,106,188,32);art.fillStyle='#dbc69a';art.font='13px Georgia';art.textAlign='center';art.fillText('ROYAL TREASURY',445,128);
    for(const x of [242,623]){poly(art,[[x-27,173],[x+27,173],[x+27,295],[x,280],[x-27,295]],'#425c46');line(art,[[x-24,176],[x-24,281]],'#c2ac7555',2);dollar(art,x,229,42,'#c7af75');}
    poly(art,[[0,432],[900,432],[900,562],[0,562]],'#77786a');
    for(let i=0;i<5;i++){const y=440+i*i*6;line(art,[[0,y],[900,y]],'#485c5266',1.5);}
    for(let x=-500;x<1400;x+=110)line(art,[[445,432],[x,562]],'#485c5255',1);
    ellipse(art,97,469,52,12,'#596953');ellipse(art,797,480,58,9,'#53654f');
  }
  function coin(x,y,rotation=0,size=1){
    ctx.save();ctx.translate(x,y);ctx.scale(Math.max(.23,Math.abs(Math.cos(rotation)))*size,size);
    ellipse(ctx,0,0,8,10,'#9d6c27');ellipse(ctx,-1,-1,6.5,8.5,'#f0cc60');line(ctx,[[-3,-5],[-3,4]],'#fff0a5',1);dollar(ctx,0,0,10,'#97692c');ctx.restore();
  }
  function bag(x,y,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    poly(ctx,[[-9,-23],[9,-23],[5,-13],[18,1],[19,17],[9,24],[-12,23],[-21,12],[-17,-1],[-5,-13]],'#a78953');
    curve(ctx,[-10,-7,-20,16,-10,23,8,22],'#d2b87b',3);line(ctx,[[-9,-14],[8,-14]],'#544a35',3);dollar(ctx,0,7,23,'#4f5437');ctx.restore();
  }
  function mace(x,y,angle){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    line(ctx,[[0,16],[0,-62]],'#513d2e',10);line(ctx,[[-2,13],[-2,-62]],'#b99a62',3);
    for(let i=0;i<5;i++)line(ctx,[[-5,-i*5],[5,3-i*5]],'#c5ad80',2);
    ellipse(ctx,0,-66,10,5,'#cca745');
    ctx.save();ctx.shadowColor='#e8ba4b';ctx.shadowBlur=7;dollar(ctx,0,-90,60,'#b47c29');dollar(ctx,-2,-92,60,'#f4d065');ctx.restore();
    line(ctx,[[-8,-116],[-2,-122],[5,-116]],'#fff0a5',2);ctx.restore();
  }
  function person(t){
    const running=mode==='away',phase=running?(reduced.matches?1:time*12):0,bob=mode==='collect'?0:reduced.matches?0:running?Math.abs(Math.sin(phase))*5:Math.sin(time*1.7)*1.5;
    const travel=running?Math.max(0,t-.15)*275:0,lunge=mode==='attack'?Math.sin(clamp(t/1.25)*Math.PI)*29:0;
    const x=510+travel+lunge,y=451+bob;
    ellipse(ctx,x,459,73,11,'#273c3555');ctx.save();ctx.translate(x,y);
    for(const side of [-1,1]){
      const swing=running?Math.sin(phase+(side<0?Math.PI:0))*30:0,lift=running?Math.max(0,Math.cos(phase+(side<0?Math.PI:0)))*17:0;
      line(ctx,[[side*20,-77],[side*23+swing*.45,-42],[side*26+swing,-10-lift]],side<0?'#464641':'#58544a',20);
      ellipse(ctx,side*26+swing+7,-6-lift,20,9,'#3c342e');line(ctx,[[side*26+swing-5,-3-lift],[side*26+swing+23,-3-lift]],'#927b50',2);
    }
    // The garment is cloth: broad folds, stitched hem and an embroidered chest emblem.
    poly(ctx,[[-31,-191],[27,-191],[51,-163],[38,-115],[48,-65],[12,-57],[-15,-63],[-47,-67],[-39,-124],[-48,-161]],'#4c624b');
    poly(ctx,[[-27,-175],[-8,-170],[-12,-72],[-37,-77]],'#7c8a60');poly(ctx,[[15,-176],[28,-167],[21,-83],[40,-71],[14,-68]],'#344d3d');
    line(ctx,[[-42,-72],[-13,-68],[13,-62],[43,-70]],'#d4bf78',3);
    for(let i=0;i<12;i++){const xx=-38+i*7;line(ctx,[[xx,-73],[xx+2,-77]],'#d8ca98',1);}
    dollar(ctx,0,-144,51,'#e0c177');
    for(let i=0;i<10;i++){const a=i*Math.PI/5;line(ctx,[[Math.cos(a)*26,-144+Math.sin(a)*30],[Math.cos(a)*29,-144+Math.sin(a)*33]],'#d0ba7b',1);}
    line(ctx,[[-39,-100],[39,-100]],'#4a3629',11);ctx.strokeStyle='#c1a259';ctx.lineWidth=3;ctx.strokeRect(-7,-107,17,14);
    // Purse stays on the viewer's right hip, the destination of collected coins.
    line(ctx,[[37,-103],[55,-90]],'#a58b59',4);ellipse(ctx,57,-78,20,25,'#6a472f');ellipse(ctx,57,-96,15,6,'#322f25');line(ctx,[[43,-86],[44,-67],[56,-58]],'#b18a51',2);dollar(ctx,57,-76,21,'#cfac64');
    ctx.save();ctx.translate(0,-209);
    ellipse(ctx,0,0,27,34,'#c49470');ellipse(ctx,-24,0,5,9,'#b38162');ellipse(ctx,25,0,5,9,'#b38162');
    poly(ctx,[[-27,-9],[-24,-26],[-12,-36],[13,-35],[27,-22],[26,-6],[17,-20],[0,-18],[-16,-22],[-19,-4]],'#585448');
    ellipse(ctx,-11,-1,7,5,'#eddfba');ellipse(ctx,12,-1,7,5,'#eddfba');ellipse(ctx,-8,-1,2,4,'#36352c');ellipse(ctx,15,-1,2,4,'#36352c');
    line(ctx,[[-19,-12],[-5,-9]],'#514538',3);line(ctx,[[5,-9],[19,-12]],'#514538',3);poly(ctx,[[2,-2],[-1,12],[9,11]],'#a77856');
    curve(ctx,[-13,18,-5,25,9,24,17,15],'#694b38',2);line(ctx,[[-9,20],[9,20]],'#e9d4ab',2);ctx.restore();
    poly(ctx,[[-27,-191],[-8,-178],[0,-194],[10,-178],[28,-191],[19,-199],[-19,-199]],'#c1b58c');
    const handX=mode==='collect'?-103:-79,handY=mode==='collect'?-83:-128;
    line(ctx,[[-34,-172],[-54,-125],[handX,handY]],'#5d7251',19);line(ctx,[[handX+7,handY],[handX-4,handY-2]],'#c79974',12);
    for(let i=0;i<3;i++)line(ctx,[[handX-4,handY-3+i*3],[handX-15,handY-6+i*4]],'#c79974',3);
    const swing=mode==='attack'?-.65+ease(t/.35)*-.5+ease((t-.35)/.4)*2.4-ease((t-.85)/.4)*1.25:running?Math.sin(phase)*.18:.12;
    line(ctx,[[32,-170],[62,-142],[76,-137]],'#4a6048',20);mace(78,-139,swing);ellipse(ctx,77,-135,8,10,'#c49470');
    if(mode==='idle'){
      const cycle=reduced.matches?0:time%2.5,q=clamp((cycle-.35)/1.35),height=4*99*q*(1-q);
      bag(handX,handY-24-height,q*Math.PI*2);
    }else if(mode!=='collect')bag(-79,-103,mode==='away'?Math.sin(phase)*.12:0);
    if(mode==='collect'){
      ctx.save();ctx.shadowColor='#bce2ba';ctx.shadowBlur=15;ellipse(ctx,handX-8,handY-2,14,4,'#d2f4bb99');ctx.restore();
    }
    ctx.restore();
    if(mode==='attack'&&t>.36&&t<.83){ctx.save();ctx.globalAlpha=Math.sin((t-.36)/.47*Math.PI);curve(ctx,[x+21,192,x+210,181,x+235,326,x+142,374],'#ffe5a5',5);ctx.restore();}
  }
  function collect(t){
    // Coins travel left-to-right at hip height and disappear into the purse mouth.
    const destination={x:567,y:355};
    for(let i=0;i<16;i++){
      const start=i*.18,progress=(t-start)/1.05;if(progress<0||progress>=1)continue;
      const x=45+(destination.x-45)*progress,y=destination.y+Math.sin(progress*Math.PI*2+i)*9*Math.sin(progress*Math.PI);
      line(ctx,[[x-29,y],[x-11,y]],'#e1efae44',2);coin(x,y,t*7+i,.9);
    }
    ctx.save();ctx.globalAlpha=.35+.15*Math.sin(t*9);ctx.strokeStyle='#cbe6aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(destination.x,destination.y,21,8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function coinTrail(t){
    for(let i=0;i<15;i++){
      const dropped=.2+i*.105,elapsed=t-dropped;if(elapsed<0)continue;
      const x=510+Math.max(0,dropped-.15)*275+57-elapsed*9;
      const fall=Math.min(1,elapsed/.6),bounce=elapsed>.6?Math.max(0,1-(elapsed-.6)*3)*Math.abs(Math.sin((elapsed-.6)*16))*14:0;
      coin(x,355+103*fall*fall-bounce,elapsed<.9?elapsed*10:1.15,.8);
    }
  }
  function select(next){mode=next;age=0;time=0;last=null;lastPaint=-Infinity;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));status.textContent=labels[next];canvas.setAttribute('aria-label',descriptions[next]);}
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?100:32))return;
    if(last!==null){const dt=Math.min((now-last)/1000,.1);age+=dt;if(!reduced.matches)time+=dt;}last=now;lastPaint=now;
    if(mode==='attack'&&age>=1.4||mode==='collect'&&age>=4.1)select('idle');
    const t=reduced.matches?({idle:0,attack:.66,collect:1.8,away:2.3}[mode]):Math.min(age,3.3);
    ctx.drawImage(background,0,0);
    if(mode!=='away'||t<3.3)person(t);
    if(mode==='collect')collect(t);
    if(mode==='away'){coinTrail(t);if(age>=3.3)status.textContent='Escaped · he left some change behind';}
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;const next={i:'idle',a:'attack',' ':'attack',c:'collect',r:'away'}[e.key.toLowerCase()];if(next){e.preventDefault();select(next);}});
  canvas.width=900;canvas.height=562;build();requestAnimationFrame(render);
})();
