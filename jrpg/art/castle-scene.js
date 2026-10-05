(() => {
  'use strict';
  const canvas=document.querySelector('#castle'),ctx=canvas.getContext('2d');
  const background=document.createElement('canvas');background.width=1200;background.height=750;
  const art=background.getContext('2d'),buttons=[...document.querySelectorAll('[data-era]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let era='past',time=0,last=null,lastPaint=-Infinity;
  const ivory='#f5edd7',ivoryShade='#c9c5b1';
  const palettes={past:{sky:'#6b9cbd',horizon:'#f3e5c5',stone:'#a7acaf',light:'#e0dcd0',dark:'#757f8b',mortar:'#7f8c96',floor:'#bbbdb6'},present:{sky:'#657687',horizon:'#c2c2b4',stone:'#7d8688',light:'#b0b4aa',dark:'#576570',mortar:'#55656f',floor:'#8b9590'},future:{sky:'#72aec0',horizon:'#f4ead0',stone:'#939c98',light:'#cecfbb',dark:'#687b80',mortar:'#788f90',floor:'#b8c0ae'}};
  const breaches=[[[269,336],[291,318],[312,327],[319,363],[297,382],[268,369]],[[740,386],[764,357],[795,366],[807,394],[781,419],[752,408]],[[180,617],[207,600],[234,609],[248,647],[216,670],[184,656]]];
  function poly(c,pts,color){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  function line(c,pts,color,width=1){c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function masonry(x,y,w,h,p){
    rect(art,x,y,w,h,p.stone);
    for(let row=0;row<h/21;row++){
      const yy=y+row*21;line(art,[[x,yy],[x+w,yy]],p.mortar,1);
      for(let xx=x+(row%2)*26;xx<x+w;xx+=52){line(art,[[xx,yy],[xx,Math.min(yy+21,y+h)]],p.mortar,1);line(art,[[xx+3,yy+3],[Math.min(xx+46,x+w),yy+3]],p.light+'66',1);}
    }
    rect(art,x+w*.76,y,w*.24,h,p.dark+'66');
  }
  function arch(x,y,w,h,color){art.beginPath();art.moveTo(x,y+h);art.lineTo(x,y+w/2);art.arc(x+w/2,y+w/2,w/2,Math.PI,Math.PI*2);art.lineTo(x+w,y+h);art.closePath();art.fillStyle=color;art.fill();}
  function crenels(x,y,w,color){rect(art,x,y+13,w,12,color);for(let xx=x;xx<x+w-12;xx+=29)rect(art,xx,y,17,22,color);}
  function solar(x,y,w){
    poly(art,[[x,y],[x+w,y],[x+w+14,y-26],[x+14,y-26]],'#233f60');
    for(let i=0;i<=5;i++)line(art,[[x+w*i/5,y],[x+14+w*i/5,y-26]],'#a3d3e2',1);
    line(art,[[x+7,y-13],[x+w+7,y-13]],'#a3d3e2',1);line(art,[[x+7,y+1],[x+7,y+10],[x+w-6,y+10],[x+w-6,y+1]],ivoryShade,3);
  }
  function tower(x,y,w,h,broken){
    const p=palettes[era],cut=y+48;
    masonry(x,broken&&era==='present'?cut:y,w,broken&&era==='present'?h-48:h,p);
    if(broken&&era!=='past'){
      const crown=[[x,cut+10],[x,cut-9],[x+15,cut+1],[x+27,cut-16],[x+43,cut+7],[x+57,cut-2],[x+72,cut+14],[x+w,cut-9],[x+w,cut+19]];
      if(era==='present')poly(art,crown,p.stone);
      else{
        rect(art,x,y,w,70,ivory);poly(art,crown,p.stone);
        crenels(x-5,y-16,w+10,ivory);solar(x+8,y-25,w-22);
      }
    }else{
      crenels(x-5,y-16,w+10,p.light);line(art,[[x-6,y+13],[x+w+6,y+13]],p.dark,3);
      if(era==='future')solar(x+8,y-25,w-22);
    }
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){
      const xx=x+20+col*(w-50),yy=y+80+row*65;if(yy+30<y+h)arch(xx,yy,12,29,'#2f4455');
    }
    line(art,[[x+4,Math.max(y+20,broken&&era==='present'?cut+22:0)],[x+4,y+h]],p.light+'99',3);
  }
  function bridge(ax,ay,bx,by,cut){
    const p=palettes[era],ruin=era==='present';
    const point=q=>[ax+(bx-ax)*q,ay+(by-ay)*q+Math.sin(q*Math.PI)*22];
    function segment(start,end,dy,color){const pts=[];for(let j=0;j<=30;j++){const [x,y]=point(start+(end-start)*j/30);pts.push([x,y+dy]);}line(art,pts,color,1.8);}
    for(const dy of [-24,5]){
      if(ruin&&cut){segment(0,.35,dy,'#887964');segment(.79,1,dy,'#887964');const [x,y]=point(.35);line(art,[[x,y+dy],[x+8,y+dy+35],[x+3,y+dy+65]],'#9e8c6d',1.5);}
      else segment(0,1,dy,era==='future'?ivoryShade:'#c5ad83');
    }
    for(let i=0;i<=32;i++){
      if(ruin&&(cut&&i>11&&i<26||!cut&&[5,6,17,23,24].includes(i)))continue;
      const [x,y]=point(i/32),repaired=cut&&i>11&&i<26||[5,6,17,23,24].includes(i);
      line(art,[[x-2,y-2],[x+3,y+7]],era==='future'&&repaired?ivory:era==='past'?'#d3b487':'#998877',5);
      if(i%4===0)line(art,[[x,y],[x,y-24]],era==='future'?ivoryShade:'#bba885',1);
    }
  }
  function stairs(ax,ay,bx,by,width){
    const p=palettes[era];poly(art,[[ax,ay],[bx,by],[bx+width,by],[ax+width,ay]],p.dark);
    for(let i=0;i<18;i++){
      const q=i/18,x=ax+(bx-ax)*q,y=ay+(by-ay)*q,damaged=[5,6,12].includes(i);
      if(era==='present'&&damaged){poly(art,[[x,y],[x+width*.4,y-3],[x+width*.7,y+5],[x+width,y]],p.dark);continue;}
      line(art,[[x,y],[x+width,y]],era==='future'&&damaged?ivory:p.light,5);
      line(art,[[x,y+3],[x+width,y+3]],p.mortar,1.3);
    }
    line(art,[[ax-3,ay-13],[bx-3,by-13]],era==='future'?ivoryShade:p.light,6);
  }
  function vine(x,y,length,tidy){
    const pts=[];
    for(let i=0;i<=length;i+=5)pts.push([x+Math.sin(i*.065)*(tidy?7:19),y+i]);
    line(art,pts,tidy?'#526d49':'#3e5945',2);
    for(let i=0;i<length;i+=9){const xx=x+Math.sin(i*.065)*(tidy?7:19);ellipse(art,xx+(i%2?5:-5),y+i,tidy?5:8,3,tidy?'#789464':'#526f50');}
    if(tidy)for(let i=12;i<length;i+=36)ellipse(art,x+Math.sin(i*.065)*7,y+i,3,3,'#efdfb5');
  }
  function topiary(x,y,s){
    art.save();art.translate(x,y);art.scale(s,s);
    poly(art,[[-19,-4],[19,-4],[13,20],[-13,20]],ivoryShade);rect(art,-21,-6,42,7,ivory);
    line(art,[[0,0],[0,-71]],'#746e51',5);
    for(const [yy,rx,ry] of [[-29,23,18],[-62,17,15],[-88,10,11]]){ellipse(art,0,yy,rx,ry,'#41694f');ellipse(art,-5,yy-4,rx*.66,ry*.72,'#79a476');}
    art.restore();
  }
  function build(){
    const p=palettes[era],sky=art.createLinearGradient(0,0,0,600);sky.addColorStop(0,p.sky);sky.addColorStop(1,p.horizon);art.fillStyle=sky;art.fillRect(0,0,1200,750);
    ellipse(art,945,96,30,30,'#fff2ce');
    for(let i=0;i<5;i++)ellipse(art,115+i*246,138+i%2*30,110,13,'#ffffff22');
    poly(art,[[0,405],[140,293],[235,375],[386,241],[535,364],[726,254],[880,347],[1067,249],[1200,353],[1200,750],[0,750]],'#879ba3');
    masonry(96,324,1000,245,p);crenels(96,308,1000,p.light);
    // The central keep and outer towers sit beyond the foreground wall walk.
    masonry(440,235,321,294,p);crenels(440,218,321,p.light);
    arch(561,373,79,152,p.dark);arch(571,386,59,139,'#293e4d');
    for(let x=476;x<733;x+=61)arch(x,273,19,42,'#394e5b');
    tower(149,166,106,365,true);tower(382,108,101,362,false);tower(730,135,110,381,true);tower(984,212,101,339,false);
    stairs(265,469,392,311,38);stairs(835,500,967,359,38);
    bridge(254,281,381,231,true);bridge(840,292,984,330,false);
    // The viewer stands on this broad stone wall, looking along its paving.
    poly(art,[[430,489],[720,489],[1058,750],[143,750]],p.floor);
    for(let i=0;i<9;i++){
      const q=i/8,y=489+q*q*261,left=430-287*q*q,right=720+338*q*q;
      line(art,[[left,y],[right,y]],p.mortar,2);
    }
    for(let i=0;i<7;i++)line(art,[[432+i*47,490],[144+i*151,750]],p.mortar,1.5);
    poly(art,[[0,498],[419,456],[438,490],[166,750],[0,750]],p.dark);
    poly(art,[[1200,502],[735,456],[716,490],[1058,750],[1200,750]],p.dark);
    poly(art,[[0,484],[419,445],[435,459],[168,669],[0,635]],p.stone);
    poly(art,[[1200,484],[735,445],[719,459],[1052,669],[1200,635]],p.stone);
    line(art,[[0,485],[419,445],[435,459],[168,669]],p.light,10);line(art,[[1200,485],[735,445],[719,459],[1052,669]],p.light,10);
    for(let i=0;i<5;i++){
      const q=i/4,x=45+q*342,y=493-q*33,w=55-q*25;
      poly(art,[[x,y],[x,y-42+q*14],[x+w,y-44+q*14],[x+w,y+4]],p.stone);line(art,[[x,y-42+q*14],[x+w,y-44+q*14]],p.light,5);
      const rx=1200-x-w;poly(art,[[rx,y+4],[rx,y-44+q*14],[rx+w,y-42+q*14],[rx+w,y]],p.stone);line(art,[[rx,y-44+q*14],[rx+w,y-42+q*14]],p.light,5);
    }
    for(let i=0;i<5;i++){const y=528+i*29;line(art,[[0,y],[Math.max(155,380-i*43),y+16]],p.mortar,2);line(art,[[1200,y],[Math.min(1050,804+i*43),y+16]],p.mortar,2);}
    if(era!=='past'){
      // Reuse exactly the same breach outlines: future ivory fills present-day damage.
      for(const pts of breaches){poly(art,pts,era==='future'?ivory:'#253d4d');line(art,[...pts,pts[0]],era==='future'?ivoryShade:'#637374',3);}
      const cracks=[[[486,338],[503,351],[497,375],[510,393],[504,422]],[[113,543],[140,559],[132,586],[158,609]],[[894,361],[880,385],[894,402]]];
      for(const pts of cracks)line(art,pts,era==='future'?ivory:'#354e5b',era==='future'?5:2);
      for(const [x,y,len] of [[172,212,205],[236,271,146],[471,247,108],[761,229,130],[1021,342,177],[59,496,131],[1125,497,133]])vine(x,y,len,era==='future');
      if(era==='present'){
        for(let i=0;i<15;i++){const x=339+i*33,y=581+(i*41)%145;poly(art,[[x,y],[x+9,y-7],[x+21,y-2],[x+16,y+7]],p.dark);}
      }else{for(const [x,y,s] of [[383,535,.6],[795,537,.6],[289,648,1],[918,656,1]])topiary(x,y,s);}
    }
    if(era==='past'){
      const sheen=art.createLinearGradient(200,450,790,750);sheen.addColorStop(0,'#fff8df00');sheen.addColorStop(.48,'#fff8df33');sheen.addColorStop(1,'#fff8df00');poly(art,[[430,489],[720,489],[1058,750],[143,750]],sheen);
      for(const [x,y] of [[205,169],[418,112],[735,140],[366,490]]){line(art,[[x-5,y],[x+5,y]],'#fff9e9',1);line(art,[[x,y-5],[x,y+5]],'#fff9e9',1);}
    }
  }
  function flag(x,y,phase){
    const ragged=era==='present',color=era==='future'?'#68a897':ragged?'#847181':'#945d78';
    line(ctx,[[x,y],[x,y-47]],era==='future'?ivory:'#b7a791',2);
    const wave=Math.sin(time*2+phase)*3;
    poly(ctx,[[x+1,y-46],[x+30,y-43+wave],[x+39,y-30+wave],[x+(ragged?20:35),y-29],[x+(ragged?31:35),y-23],[x+1,y-27]],color);
  }
  function render(now){
    requestAnimationFrame(render);if(document.hidden){last=null;return;}if(now-lastPaint<(reduced.matches?150:32))return;
    if(last!==null&&!reduced.matches)time+=Math.min((now-last)/1000,.1);last=now;lastPaint=now;ctx.drawImage(background,0,0);
    flag(433,96,0);flag(1034,200,2);
    for(let i=0;i<4;i++){const x=((time*13+i*173)%1300)-50,y=80+i%2*55+Math.sin(time+i)*5;line(ctx,[[x-5,y],[x,y+2],[x+5,y]],'#4a657a',1);}
  }
  function select(next){
    era=next;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.era===next)));lastPaint=-Infinity;
    document.querySelector('#status').textContent={past:'The Past · freshly built, polished stone',present:'The Present · wild vines and broken crossings',future:'The Future · ivory repairs, gardens and solar roofs'}[next];
    document.querySelector('#note').textContent={past:'Every stone in its place. Every bridge intact.',present:'Time has opened the walls and torn the bridges.',future:'Old scars filled with ivory. A carefully tended new life.'}[next];
    canvas.setAttribute('aria-label','View from atop a castle wall, with towers, suspended rope bridges and stone stairs. '+{past:'Newly built polished walls, complete towers and intact bridges and stairs.',present:'Holes and vines cover walls; bridges are severed or missing planks, stairs are chipped and two towers have broken tops.',future:'The same structural damage is patched with ivory material, tower tops restored with solar panels, bridges and stairs repaired, with topiary and tended vines.'}[next]);build();
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.era)));
  document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;const next={'1':'past','2':'present','3':'future'}[e.key];if(next)select(next);});
  canvas.width=1200;canvas.height=750;build();requestAnimationFrame(render);
})();
