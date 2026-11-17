const approachZero=(value,amount)=>Math.sign(value)*Math.max(0,Math.abs(value)-amount);
export function stepVelocity(ship,input,dt,motion){
 const fx=Math.sin(ship.yaw),fz=-Math.cos(ship.yaw),rx=Math.cos(ship.yaw),rz=Math.sin(ship.yaw);
 const brakeAcceleration=Math.max(motion.acceleration,motion.reverseAcceleration)*2,boost=ship.afterburn>0?3:1;
 ship.vx+=ship.pushVx;ship.vz+=ship.pushVz;ship.pushVx=ship.pushVz=0;
 if(ship.emergencyBrake){
  const speed=Math.hypot(ship.vx,ship.vz),next=Math.max(0,speed-brakeAcceleration*4*dt);
  if(speed){ship.vx*=next/speed;ship.vz*=next/speed;}
  if(next===0)ship.emergencyBrake=false;
 }else if(input.brake){ship.vx=approachZero(ship.vx,brakeAcceleration*dt);ship.vz=approachZero(ship.vz,brakeAcceleration*dt);}
 else if(ship.omni){
  let dx=input.steer||0,dz=-(input.throttle||0);const size=Math.hypot(dx,dz);if(size>1){dx/=size;dz/=size;}
  if(size){
   const norm=Math.hypot(dx,dz),ux=dx/norm,uz=dz/norm,along=ship.vx*ux+ship.vz*uz;
   const thrust=Math.min(motion.acceleration*boost*dt,Math.max(0,motion.forward*Math.min(size,1)-along));
   ship.vx+=ux*thrust;ship.vz+=uz*thrust;
   if(!input.inertialOff){const side=ship.vx*(-uz)+ship.vz*ux,correction=approachZero(side,brakeAcceleration*dt)-side;ship.vx-=uz*correction;ship.vz+=ux*correction;}
  }else if(!input.inertialOff){
   const speed=Math.hypot(ship.vx,ship.vz),next=Math.max(0,speed-brakeAcceleration*dt);
   if(speed){ship.vx*=next/speed;ship.vz*=next/speed;}
  }
 }else{
  let forward=ship.vx*fx+ship.vz*fz,lateral=ship.vx*rx+ship.vz*rz;
  const throttle=Math.max(-1,Math.min(1,input.throttle||0));
  if(throttle){
   const limit=throttle>0?motion.forward:ship.instantCar?motion.forward:motion.reverse;
   if(ship.instantCar)forward=throttle*limit;
   else{const direction=Math.sign(throttle),acceleration=throttle>0?motion.acceleration:motion.reverseAcceleration;
    forward+=direction*Math.min(acceleration*boost*Math.abs(throttle)*dt,Math.max(0,Math.abs(throttle)*limit-forward*direction));}
  }else if(!input.inertialOff)forward=approachZero(forward,brakeAcceleration*dt);
  if(!input.inertialOff)lateral=approachZero(lateral,brakeAcceleration*dt);
  ship.vx=forward*fx+lateral*rx;ship.vz=forward*fz+lateral*rz;
 }
 ship.speed=Math.hypot(ship.vx,ship.vz);ship.x+=ship.vx*dt;ship.z+=ship.vz*dt;
}
