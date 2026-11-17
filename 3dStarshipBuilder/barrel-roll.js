export const rollDuration=.6,rollCooldown=1.5;
export function rollState(){return {dodge:null,dodgeCooldown:0};}
export function startRoll(ship,direction){
 if(ship.hull<=0||ship.dodge||ship.dodgeCooldown>1e-9||![-1,1].includes(direction))return false;
 ship.dodge={elapsed:0,direction,startRoll:ship.roll||0,dx:Math.cos(ship.yaw)*direction,dz:Math.sin(ship.yaw)*direction};
 ship.dodgeCooldown=rollCooldown;return true;
}
export function stepRoll(ship,dt){
 ship.dodgeCooldown=Math.max(0,ship.dodgeCooldown-dt);
 if(!ship.dodge)return;
 const d=ship.dodge,old=d.elapsed/rollDuration;
 d.elapsed=Math.min(rollDuration,d.elapsed+dt);const t=d.elapsed/rollDuration;
 const ease=v=>v*v*(3-2*v),travel=(ease(t)-ease(old))*4;
 ship.x+=d.dx*travel;ship.z+=d.dz*travel;
 ship.roll=d.startRoll*(1-ease(t))-d.direction*Math.PI*2*ease(t);
 if(d.elapsed>=rollDuration-1e-9){ship.dodge=null;ship.roll=0;}
}
export function rollStatus(ship){return ship.dodge?' · Barrel roll':ship.dodgeCooldown>0?` · Roll ${ship.dodgeCooldown.toFixed(1)}s`:' · Roll ready';}
