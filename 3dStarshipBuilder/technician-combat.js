export const specialWeapons={
 laserLine:{projectileSpeed:0,range:100,reloadTime:0,damage:0,dps:10,coneCos:Math.cos(Math.PI/6)},
 pushOutside:{projectileSpeed:35,range:60,reloadTime:1.2,damage:0,hitRadius:1.5},
 gravStop:{projectileSpeed:28,range:100,reloadTime:1,damage:0,hitRadius:.6},
 nanitesSpray:{projectileSpeed:30,range:100,reloadTime:.9,damage:0,hitRadius:.2}
};

export function combatState(parts){return {teleport:parts.some(p=>p.type==='teleportShield'),blinkCooldown:0,blinkFlash:0,blinkFrom:null,pushVx:0,pushVz:0,statusClock:0,nextNaniteTick:.1,nanites:[]};}
export function infestation(ship){return ship.nanites.reduce((sum,stack)=>sum+stack.amount,0);}
export function combatStatus(ship){
 const labels=[];if(infestation(ship)>0)labels.push(`Nanite infestation ${infestation(ship)} (-${infestation(ship)}/s, ${Math.max(...ship.nanites.map(s=>s.expires-ship.statusClock)).toFixed(1)}s)`);
 if(ship.teleport)labels.push(ship.blinkCooldown>0?`Blink ${ship.blinkCooldown.toFixed(1)}s`:'Blink ready');
 return labels.length?' · '+labels.join(' · '):'';
}
export function tickStatuses(ship,dt){
 ship.blinkCooldown=Math.max(0,ship.blinkCooldown-dt);ship.blinkFlash=Math.max(0,ship.blinkFlash-dt);
 const end=ship.statusClock+dt;
 while(ship.nextNaniteTick<=end+1e-9){
  const value=ship.nanites.filter(s=>s.expires>=ship.nextNaniteTick-1e-9).reduce((sum,s)=>sum+s.amount,0);
  ship.hull=Math.max(0,ship.hull-value/10);ship.nextNaniteTick+=.1;
 }
 ship.statusClock=end;ship.nanites=ship.nanites.filter(s=>s.expires>end+1e-9);
 const decay=Math.exp(-3*dt),travel=(1-decay)/3;
 ship.x+=ship.pushVx*travel;ship.z+=ship.pushVz*travel;ship.pushVx*=decay;ship.pushVz*=decay;
}
export function onHit(ship,random=Math.random){
 ship.hitAgo=0;
 if(!ship.teleport||ship.blinkCooldown>1e-9||ship.hull<=0)return;
 const angle=random()*Math.PI*2;ship.blinkFrom=[ship.x,ship.z];
 ship.x+=Math.cos(angle)*6;ship.z+=Math.sin(angle)*6;ship.blinkCooldown=2;ship.blinkFlash=.25;
}
export function specialHit(ship,bullet){
 if(bullet.kind==='gravStop'){
  ship.speed*=.9;ship.vx*=.9;ship.vz*=.9;ship.pushVx*=.9;ship.pushVz*=.9;
 }else if(bullet.kind==='nanitesSpray')ship.nanites.push({amount:10,expires:ship.statusClock+10});
 else if(bullet.kind==='pushOutside'){
  const speed=Math.hypot(bullet.vx,bullet.vz)||1;
  ship.pushVx-=bullet.vx/speed*18;ship.pushVz-=bullet.vz/speed*18;
 }else return false;
 onHit(ship);return true;
}
export function seek(bullet,target,dt){
 if(bullet.kind!=='nanitesSpray'||!target||target.hull<=0)return;
 const angle=Math.atan2(bullet.vz,bullet.vx),desired=Math.atan2(target.z-bullet.z,target.x-bullet.x);
 const delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));
 const heading=angle+Math.max(-3*dt,Math.min(3*dt,delta)),speed=Math.hypot(bullet.vx,bullet.vz);
 bullet.vx=Math.cos(heading)*speed;bullet.vz=Math.sin(heading)*speed;
}
