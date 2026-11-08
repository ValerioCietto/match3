import fighter from './presets/fighter.json' with {type:'json'};
import interceptor from './presets/interceptor.json' with {type:'json'};
import hauler from './presets/hauler.json' with {type:'json'};
import scout from './presets/scout.json' with {type:'json'};
import carrier from './presets/carrier.json' with {type:'json'};
import megaCargo from './presets/megaCargo.json' with {type:'json'};
import explorer from './presets/explorer.json' with {type:'json'};
import cruise from './presets/cruise.json' with {type:'json'};
import sharkDestroyer from './presets/sharkDestroyer.json' with {type:'json'};
import artemisSniper from './presets/artemisSniper.json' with {type:'json'};
import aresArmoredFighter from './presets/aresArmoredFighter.json' with {type:'json'};
import empty from './presets/empty.json' with {type:'json'};

const configurations={aresArmoredFighter,fighter,interceptor,hauler,scout,carrier,megaCargo,explorer,cruise,sharkDestroyer,artemisSniper,empty};
export const presetCatalog=Object.fromEntries(Object.entries(configurations).map(([id,{name,label,description}])=>[id,{name,label:label||name,description:description||''}]));
export function preset(id){
  const configuration=configurations[id];
  if(!configuration)throw Error('Unknown preset: '+id);
  return structuredClone(configuration.parts).map(p=>({...p,id:crypto.randomUUID()}));
}
