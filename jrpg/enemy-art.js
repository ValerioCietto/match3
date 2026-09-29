// Shared enemy artwork for combat and the bestiary.
(function(root){
  'use strict';
  root.SiluxEnemyArt={draw(ctx,e){
    ctx.save();
    ctx.fillStyle=e.color||'#b6a68d';
    if(e.shape==='slime'){ctx.beginPath();ctx.moveTo(-35,2);ctx.bezierCurveTo(-50,-70,40,-80,38,2);ctx.quadraticCurveTo(0,17,-35,2);ctx.fill();}
    else if(e.shape==='wing'){ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(-50,-65);ctx.lineTo(-36,-16);ctx.lineTo(-12,-9);ctx.lineTo(0,0);ctx.lineTo(12,-9);ctx.lineTo(36,-16);ctx.lineTo(50,-65);ctx.closePath();ctx.fill();}
    else if(e.shape==='plant'){ctx.fillRect(-5,-53,10,56);for(let p=0;p<6;p++){const a=p*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*19,-51+Math.sin(a)*19,14,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#6c784e';ctx.beginPath();ctx.arc(0,-51,16,0,Math.PI*2);ctx.fill();}
    else if(e.shape==='machine'){ctx.fillRect(-42,-46,66,28);ctx.fillRect(10,-41,52,8);ctx.fillRect(-7,-60,5,20);ctx.fillRect(-60,-63,110,4);ctx.fillRect(-36,-8,65,4);ctx.fillRect(-24,-22,4,15);ctx.fillRect(14,-22,4,15);}
    else if(e.shape==='beast'){ctx.beginPath();ctx.ellipse(-3,-23,32,24,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(25,-37,19,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(12,-48);ctx.lineTo(13,-68);ctx.lineTo(27,-52);ctx.fill();ctx.fillRect(-26,-8,9,17);ctx.fillRect(14,-8,9,17);ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-33,-21);ctx.quadraticCurveTo(-57,-25,-43,-45);ctx.stroke();}
    else{ctx.beginPath();ctx.moveTo(-18,-45);ctx.lineTo(17,-45);ctx.lineTo(29,0);ctx.lineTo(-28,0);ctx.fill();ctx.beginPath();ctx.arc(0,-60,16,0,Math.PI*2);ctx.fill();ctx.fillRect(-13,-4,9,16);ctx.fillRect(6,-4,9,16);ctx.fillRect(33,-53,4,62);}
    ctx.fillStyle='#17232b';const eyeY=e.shape==='plant'?-54:e.shape==='humanoid'?-62:e.shape==='beast'?-41:-32;ctx.fillRect(e.shape==='beast'?28:-11,eyeY,5,5);if(e.shape!=='beast')ctx.fillRect(7,eyeY,5,5);
    if(e.boss){ctx.fillStyle='#e0bb70';ctx.beginPath();ctx.moveTo(-15,-82);ctx.lineTo(-20,-101);ctx.lineTo(-5,-91);ctx.lineTo(0,-106);ctx.lineTo(7,-91);ctx.lineTo(20,-101);ctx.lineTo(15,-82);ctx.fill();}
    ctx.restore();
  }};
})(globalThis);
