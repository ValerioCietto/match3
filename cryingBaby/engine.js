(function (root) {
  'use strict';
  const DAY = 1440, END = DAY * 7;
  const definitions = {
    feed: ['Fame', 'Dare da mangiare', '🍼', 'Cerca il seno; porta le mani alla bocca', 15],
    diaper: ['Pannolino', 'Cambiare il pannolino', '🧷', 'Il pannolino è sporco; controlla il diario dei cambi', 8],
    burp: ['Ruttino', 'Aiutare con il ruttino', '🫧', 'La poppata è appena finita; il ruttino non è ancora stato fatto', 8],
    belly: ['Pancino gonfio', 'Massaggiare il pancino', '🤲', 'Il cambio ha tardato oltre 90 minuti; raccoglie le gambe', 10],
    legs: ['Sgambettamento', 'Fare sgambettamento', '🦵', '', 8],
    suit: ['Tutina', 'Cambiare la tutina', '👕', 'La tutina è sporca; sono stati completati diversi cambi', 10],
    bath: ['Bagnetto', 'Fare il bagnetto', '🛁', 'Sono state cambiate più tutine; è la fascia del bagnetto', 25],
    nose: ['Nasino', 'Fare il lavaggio nasale', '💧', 'Il nasino è da pulire; compare del muco nell’illustrazione', 6],
    tummy: ['Tummy time', 'Fare Tummy time', '🌿', 'Il tappetino è pronto; manca l’attività quotidiana nel diario', 15],
    vitamin: ['Vitamina D', 'Completare vitamina D', '☀️', 'Il promemoria quotidiano è aperto; oggi non è ancora stata completata', 3],
    shower: ['Doccia', 'Fare una doccia', '🚿', '', 15],
    shopping: ['Spesa', 'Fare la spesa', '🛒', '', 45],
    sleep: ['Sonno', 'Aiutare ad addormentarsi', '🌙', 'Sbadiglia; gli occhi si chiudono', 20],
    cuddle: ['Coccole', 'Prendere in braccio', '💗', 'Tende le braccia; segue il tuo sguardo', 10],
    quiet: ['Troppi stimoli', 'Ridurre luci e rumori', '🔇', 'La luce è intensa; i giocattoli sono rumorosi', 4]
  };
  function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function calendar(seed) {
    const rng = random(seed), int = (a,b) => a + Math.floor(rng() * (b-a+1));
    for (let attempt=0; attempt<500; attempt++) {
      const events=[], clusters=[], quotas=[];
      for (let d=0; d<8; d++) if (rng()<.5) { const start=d*DAY+int(1080,1320); clusters.push([start,start+240]); }
      let invalid=false;
      for (let d=0; d<8; d++) {
        const count=int(10,20), times=[];
        for(let tries=0; times.length<count && tries<10000; tries++) {
          const t=d*DAY+int(5,1430), clustered=clusters.some(([a,b])=>t>=a&&t<b);
          if(rng()>(clustered?1:1/3) || times.some(x=>Math.abs(x-t)<44) || events.some(e=>e.type==='feed'&&Math.abs(e.at-t)<44)) continue;
          times.push(t);
        }
        if(times.length!==count) {invalid=true;break;}
        times.sort((a,b)=>a-b).forEach(at=>events.push({type:'feed',at,duration:int(6,28),burpDuration:int(2,15)}));
        quotas.push(int(10,14));
        for(let n=int(0,2);n>0;n--) events.push({type:'nose',at:d*DAY+int(60,1380)});
        for(const type of ['sleep','cuddle','quiet']) events.push({type,at:d*DAY+int(80,1350)});
      }
      if(invalid) continue;
      const feeds=events.filter(e=>e.type==='feed').sort((a,b)=>a.at-b.at), diapers=[];
      for(const f of feeds) if(!diapers.some(t=>t>=f.at+30&&t<=f.at+120)) diapers.push(f.at+120);
      for(let d=0;d<8;d++) {
        let n=diapers.filter(t=>Math.floor(t/DAY)===d).length;
        if(n>quotas[d]) { invalid=true;break; }
        while(n<quotas[d]) {const t=d*DAY+int(10,1430);if(!diapers.includes(t)){diapers.push(t);n++;}}
      }
      if(invalid) continue;
      for(const [a,b] of clusters.filter(c=>c[0]<END)) {
        const inside=feeds.filter(f=>f.at>=a&&f.at<b);
        const outside=feeds.filter(f=>f.at>=Math.floor(a/DAY)*DAY&&f.at<Math.floor(a/DAY)*DAY+DAY&&(f.at<a||f.at>=b));
        const average=list=>list.length<2?Infinity:(list.at(-1).at-list[0].at)/(list.length-1);
        if(inside.length<2||average(inside)>=average(outside)) invalid=true;
      }
      if(invalid) continue;
      diapers.forEach(at=>events.push({type:'diaper',at}));
      return {events:events.sort((a,b)=>a.at-b.at),clusters,quotas};
    }
    throw new Error('Calendario non generato: riprova con una nuova partita.');
  }
  class Game {
    constructor(seed=Date.now()) {
      this.seed=seed;this.rng=random(seed+1);this.plan=calendar(seed);this.queue=this.plan.events.map(e=>({...e}));
      this.time=0;this.needs=[];this.log=[];this.serial=0;this.job=null;this.episode=null;this.done=false;
      this.stats={resolved:0,errors:0,missed:0,timeouts:0,responses:[]};this.changes=0;this.suits=0;this.suitLimit=this.int(3,4);this.bathLimit=this.int(2,3);
      this.routines = Array.from({length: 7}, () => ({tummy: false, vitamin: false}));
      this.activityMessage = '';
      this.activityVersion = 0;
    }
    calmAvailable(action) {
      if (this.done || this.job || this.active().length) return false;
      if (action === 'shopping') return this.time % DAY >= 540 && this.time % DAY < 1200;
      if (action === 'shower') return true;
      if (action === 'tummy' || action === 'vitamin') {
        return !this.routines[Math.floor(this.time / DAY)][action];
      }
      return false;
    }
    startCalmActivity(action) {
      if (!this.calmAvailable(action)) return false;
      this.job = {
        calm: true, action, day: Math.floor(this.time / DAY),
        start: this.time, end: this.time + definitions[action][4]
      };
      return true;
    }
    notifyActivity(message) {
      this.activityMessage = message;
      this.activityVersion++;
      this.record(message);
    }
    int(a,b){return a+Math.floor(this.rng()*(b-a+1));}
    available(n){return n.type!=='bath'||this.time%DAY>=600&&this.time%DAY<1080;}
    active(){return this.needs.filter(n=>this.available(n));}
    level(){return this.episode===null?0:Math.min(3,1+Math.floor((this.time-this.episode+1e-7)/30));}
    record(text){this.log.unshift({time:this.time,text});this.log=this.log.slice(0,80);}
    add(type,data={}) {
      if (['tummy', 'vitamin', 'shower', 'shopping'].includes(type)) return;
      if(!['feed','burp','tummy','vitamin'].includes(type)&&this.needs.some(n=>n.type===type))return;
      this.needs.push({id:++this.serial,type,since:this.time,...data});this.updateEpisode();
    }
    updateEpisode(){const upset=this.active().some(n=>!['tummy','vitamin'].includes(n.type));if(!upset)this.episode=null;else if(this.episode===null)this.episode=this.time;}
    actions(n){return n.type==='belly'?['belly','legs'].filter(k=>!n[k]):[n.type];}
    choose(action){
      if(this.done||this.job)return false;
      const n=this.active().find(n=>this.actions(n).includes(action));
      if(!n){this.stats.errors++;this.record('Tentativo: questo intervento non serve adesso.');return false;}
      this.stats.responses.push((this.time-n.since)/3);
      const duration=n.type==='feed'?n.duration:n.type==='burp'?n.duration:definitions[action][4];
      this.job={id:n.id,action,start:this.time,end:this.time+duration};
      if(action==='feed') {
        const low=this.time+30,high=this.time+120;
        if(!this.queue.some(e=>e.type==='diaper'&&e.at>=low&&e.at<=high)) {this.queue.push({type:'diaper',at:this.int(Math.ceil(low),Math.floor(high))});this.queue.sort((a,b)=>a.at-b.at);}
      }
      return true;
    }
    finish(){
      const job=this.job;this.job=null;
      if (job.calm) {
        if (job.action === 'tummy' || job.action === 'vitamin') {
          this.routines[job.day][job.action] = true;
        }
        const messages = {
          shower: 'ti prendi una pausa per lavarti mentre il bimbo è tranquillo, batterie ricaricate!',
          shopping: 'ottieni importanti provviste per mangiare, pannolini, quadrotti, e salviette!',
          tummy: 'Tummy time completato per oggi!',
          vitamin: 'Vitamina D completata per oggi!'
        };
        this.notifyActivity(messages[job.action]);
        return;
      }
      const n=this.needs.find(n=>n.id===job.id);if(!n)return;
      if(n.type==='belly'){n[job.action]=true;if(!n.belly||!n.legs){this.record('Pancino: manca ancora '+(!n.belly?'il massaggio.':'lo sgambettamento.'));return;}}
      this.needs=this.needs.filter(x=>x.id!==n.id);this.stats.resolved++;this.record(definitions[n.type][0]+' completato.');
      if(n.type==='feed')this.add('burp',{duration:n.burpDuration});
      if(n.type==='diaper'&&++this.changes>=this.suitLimit)this.add('suit');
      if(n.type==='suit'){this.changes=0;this.suitLimit=this.int(3,4);if(++this.suits>=this.bathLimit)this.add('bath');}
      if(n.type==='bath'){this.suits=0;this.bathLimit=this.int(2,3);}
    }
    advance(seconds){
      const target=Math.min(END,this.time+seconds*3);
      // Small deterministic steps preserve intermediate deadlines and midnight boundaries.
      while(this.time<target-1e-8){
        const previousDay=Math.floor(this.time/DAY);
        const nextEvent=this.queue[0]?.at??Infinity;
        this.time=Math.min(target,this.time+.25,this.job?.end??Infinity,nextEvent,(previousDay+1)*DAY);
        if(this.job&&this.job.end<=this.time+1e-8)this.finish();
        if(Math.floor(this.time/DAY)>previousDay){
          if (this.job?.calm && ['tummy', 'vitamin'].includes(this.job.action)) {
            this.job = null;
            this.notifyActivity('È iniziato un nuovo giorno: puoi scegliere di nuovo le attività quotidiane.');
          }
          this.record('Giorno '+(previousDay+1)+' concluso.');
        }
        while(this.queue.length&&this.queue[0].at<=this.time){const e=this.queue.shift();if(this.time<END)this.add(e.type,{duration:e.duration,burpDuration:e.burpDuration});}
        for(const n of [...this.needs])if(n.type==='diaper'&&!n.triggered&&this.time-n.since>90){n.triggered=true;this.add('belly');}
        this.updateEpisode();
        if (this.job?.calm && this.active().length) {
          this.job = null;
          this.notifyActivity('Attività interrotta: il bambino ha bisogno di te. Potrai riprovare quando sarà calmo.');
        }
      }
      if(this.time>=END)this.done=true;
    }
  }
  const api={Game,calendar,definitions,DAY,END};
  if(typeof module!=='undefined')module.exports=api;else root.CryingBaby=api;
})(typeof window!=='undefined'?window:globalThis);
