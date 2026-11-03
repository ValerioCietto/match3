(function(root){
  'use strict';
  const items = {wood:['Wood','🪵'],stick:['Stick','🦯'],iron:['Iron','🪨'],ingot:['Ingot','▰'],head:['Head','⚒'],axe:['Axe','🪓']};
  const levels = [{name:'01 / GREENWOOD VALLEY',target:8},{name:'02 / COPPER RIDGE',target:16},{name:'03 / THE KING’S WORKSHOP',target:25}];
  const definitions = [
    ['tree','Trees','Axeman',150,180,{},'wood',1.1,50,'🌲'],
    ['sawmill','Sawmill','Miller',430,180,{wood:1},'stick',1.5,100,'🪚'],
    ['mine','Iron mine','Miner',150,440,{},'iron',1.3,50,'⛏'],
    ['furnace','Furnace','Smelter',430,440,{iron:1},'ingot',1.7,100,'🔥'],
    ['forge','Forge','Smith',710,440,{ingot:1},'head',1.7,125,'⚒'],
    ['table','Assembly','Crafter',710,180,{stick:1,head:1},'axe',1.8,150,'🪓'],
    ['market','Market','Merchant',990,180,{axe:1},null,0.7,150,'💰']
  ];
  function createStations(level){return definitions.map(d=>({id:d[0],name:d[1],workerName:d[2],x:d[3],y:d[4]+(level===1 && d[0]==='market'?260:0),inputs:d[5],output:d[6],duration:d[7],cost:d[8],icon:d[9],paid:0,worker:false,rank:0,progress:0,payClock:0,workerProgress:0}));}
  function createGame(){return {level:0,player:{x:300,y:320},bag:Object.fromEntries(Object.keys(items).map(k=>[k,0])),gold:0,sold:0,totalSold:0,stations:createStations(0),active:null,paying:null,message:'Walk into the tree ring to gather wood.',won:false};}
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function pad(s){return {x:s.x,y:s.y+100};}
  function canProduce(g,s){return Object.entries(s.inputs).every(([k,n])=>g.bag[k]>=n);}
  function produce(g,s){if(!canProduce(g,s))return false;for(const [k,n] of Object.entries(s.inputs))g.bag[k]-=n;if(s.output)g.bag[s.output]++;else {g.gold+=20;g.sold++;g.totalSold++;}return true;}
  function tick(g,dt,input={x:0,y:0}){
    dt=Math.max(0,Math.min(dt,0.1));
    const mag=Math.hypot(input.x,input.y), scale=mag>1?1/mag:1;
    g.player.x=Math.max(45,Math.min(1115,g.player.x+input.x*scale*205*dt));
    g.player.y=Math.max(65,Math.min(665,g.player.y+input.y*scale*205*dt));
    g.active=null;g.paying=null;
    for(const s of g.stations){
      const near=distance(g.player,s)<62, onPad=distance(g.player,pad(s))<30;
      const duration=s.duration/(1+s.rank*0.3);
      if(near){g.active=s.id;g.message=canProduce(g,s)?`${s.name}: ${s.output?'making '+items[s.output][0].toLowerCase():'selling axes for 20 gold'}…`:`${s.name} needs ${Object.keys(s.inputs).map(k=>items[k][0].toLowerCase()).join(' + ')}.`;if(canProduce(g,s)){s.progress+=dt;if(s.progress>=duration){produce(g,s);s.progress-=duration;}}else s.progress=0;}else s.progress=0;
      if(s.worker){s.workerProgress+=dt;if(s.workerProgress>=duration){produce(g,s);s.workerProgress=0;}}
      if(onPad){g.paying=s.id;g.message=`${s.worker?'Upgrade '+s.name:'Hire '+s.workerName}: ${s.paid} / ${s.cost} gold${g.gold===0?' · Sell axes for more gold.':''}`;
        if(g.gold>0){s.payClock+=dt;while(s.payClock>=0.1-1e-9 && g.gold>0){s.payClock=Math.max(0,s.payClock-0.1);g.gold--;s.paid++;if(s.paid===s.cost){if(s.worker)s.rank++;else s.worker=true;s.paid=0;s.cost=Math.ceil(s.cost*1.6);s.payClock=0;g.message=`${s.workerName} ready! ${s.name} now works automatically.`;break;}}}else s.payClock=0;
      }else s.payClock=0;
    }
    const goal=levels[g.level].target;
    if(g.sold>=goal && distance(g.player,{x:990,y:550})<55){
      if(g.level<levels.length-1){g.level++;g.sold=0;g.stations=createStations(g.level);g.player={x:300,y:320};g.message='New workshop! Your gold and materials travel with you; build a new local crew.';}
      else {g.won=true;g.message='Valley master! All three workshops complete. Keep growing your business.';}
    }else if(!g.active&&!g.paying){g.message=g.sold>=goal?'Target reached! Walk to the expedition flag to continue.':'Gather → refine → assemble → sell. Gold pads hire workers.';}
  }
  const api={items,levels,createGame,tick,pad,canProduce};
  if(typeof module!=='undefined')module.exports=api;else root.AxeGame=api;
})(typeof window!=='undefined'?window:globalThis);
