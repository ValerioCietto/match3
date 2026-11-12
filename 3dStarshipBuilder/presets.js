import fighter from './presets/human/fighter.json' with {type:'json'};
import interceptor from './presets/human/interceptor.json' with {type:'json'};
import hauler from './presets/human/hauler.json' with {type:'json'};
import scout from './presets/human/scout.json' with {type:'json'};
import carrier from './presets/human/carrier.json' with {type:'json'};
import megaCargo from './presets/human/megaCargo.json' with {type:'json'};
import explorer from './presets/human/explorer.json' with {type:'json'};
import cruise from './presets/human/cruise.json' with {type:'json'};
import sharkDestroyer from './presets/human/sharkDestroyer.json' with {type:'json'};
import artemisSniper from './presets/human/artemisSniper.json' with {type:'json'};
import aresArmoredFighter from './presets/human/aresArmoredFighter.json' with {type:'json'};
import empty from './presets/human/empty.json' with {type:'json'};

const configurations={aresArmoredFighter,fighter,interceptor,hauler,scout,carrier,megaCargo,explorer,cruise,sharkDestroyer,artemisSniper,empty};
export const presetCatalog=Object.fromEntries(Object.entries(configurations).map(([id,{name,label,description}])=>[id,{name,label:label||name,description:description||''}]));
const factionConfigurations={human:configurations,jared:{empty},technician:{empty}};
export function catalogForFaction(faction='human'){return Object.fromEntries(Object.entries(factionConfigurations[faction]||configurations).map(([id,{name,label,description}])=>[id,{name,label:label||name,description:description||''}]));}
export function preset(id){
  const configuration=configurations[id];
  if(!configuration)throw Error('Unknown preset: '+id);
  return structuredClone(configuration.parts).map(p=>({...p,id:crypto.randomUUID()}));
}
