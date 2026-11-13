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
import runner from './presets/jared/runner.json' with {type:'json'};
import jaredInterceptor from './presets/jared/interceptor.json' with {type:'json'};
import small_warlord from './presets/jared/small_warlord.json' with {type:'json'};
import warlord from './presets/jared/warlord.json' with {type:'json'};
import sniper from './presets/jared/sniper.json' with {type:'json'};

const configurations={aresArmoredFighter,fighter,interceptor,hauler,scout,carrier,megaCargo,explorer,cruise,sharkDestroyer,artemisSniper,empty};
export const presetCatalog=Object.fromEntries(Object.entries(configurations).map(([id,{name,label,description}])=>[id,{name,label:label||name,description:description||''}]));
const factionConfigurations={human:configurations,jared:{runner,jaredInterceptor,small_warlord,warlord,sniper,empty},technician:{empty}};
export function catalogForFaction(faction='human'){return Object.fromEntries(Object.entries(factionConfigurations[faction]||configurations).map(([id,{name,label,description}])=>[id,{name,label:label||name,description:description||''}]));}
export function preset(id){
  const configuration=id==='runner'?runner:id==='jaredInterceptor'?jaredInterceptor:id==='small_warlord'?small_warlord:id==='warlord'?warlord:id==='sniper'?sniper:configurations[id];
  if(!configuration)throw Error('Unknown preset: '+id);
  return structuredClone(configuration.parts).map(p=>({...p,id:crypto.randomUUID()}));
}
