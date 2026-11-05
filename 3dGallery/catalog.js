import player from './models/player.js';
import scout from './models/very_small.js';
import normal from './models/normal.js';
import stealth from './models/stealth.js';
import specialOps from './models/special_ops.js';
import boss from './models/boss.js';
import bigBoss from './models/big_boss.js';
import playerUpgraded from './models/upgraded/player.js';
import scoutUpgraded from './models/upgraded/very_small.js';
import normalUpgraded from './models/upgraded/normal.js';
import stealthUpgraded from './models/upgraded/stealth.js';
import specialOpsUpgraded from './models/upgraded/special_ops.js';
import bossUpgraded from './models/upgraded/boss.js';
import bigBossUpgraded from './models/upgraded/big_boss.js';

export const catalog = [player, scout, normal, stealth, specialOps, boss, bigBoss];
export const upgrades = Object.fromEntries([playerUpgraded,scoutUpgraded,normalUpgraded,stealthUpgraded,specialOpsUpgraded,bossUpgraded,bigBossUpgraded].map(model=>[model.id,model]));
