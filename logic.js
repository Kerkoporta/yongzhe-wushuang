/* 🧟 僵尸大作战 · 纯逻辑层（无 DOM，Node 可测）
   v1：2D 俯视；人物周围生成绿色僵尸；基础攻击；僵尸 4 下才死。
   v2：回血机制（4 秒不受伤开始回血）；击杀得 1~4 金币；商店；
       光影剑=伤害×2，20% 瞬移到怪物背后再砍一刀；铁盔甲=20% 概率受伤减半。 */
'use strict';

const WORLD = { w: 2400, h: 2400 };          // 世界大小（像素）
const PLAYER = { speed: 120, hearts: 5, r: 10 };   // 玩家：速度/血量/碰撞半径
const ZOMBIE = { speed: 52, hp: 4, r: 10 };          // 僵尸：速度/4 下才死/半径
const SPAWN = { ringMin: 300, ringMax: 460, interval: 2.0, capBase: 6 };   // 在人物周围一圈生成
const ATTACK = { range: 38, arc: Math.PI * 0.7, swing: 0.18, cd: 0.32, knock: 70 };  // 攻击：前扇形
const HURT = { invincible: 0.9, knock: 120 };        // 被抓后无敌时间+弹开
const REGEN = { delay: 4, every: 2, amount: 0.5 };   // ❤️ 回血：4 秒不受伤，之后每 2 秒回半颗心
const SHOP = {
  /* ---- 武器（买了能随便切换着用） ---- */
  sword: { name: '光影剑', icon: '🗡️', price: 30, kind: 'weapon', desc: '伤害×2！砍怪时 20% 瞬移到它背后再补一刀' },
  stick: { name: '木棍', icon: '🪵', price: 15, kind: 'weapon', desc: '伤害 1.5：比空手疼一半，新手好伙伴' },
  iron_sword: { name: '铁剑', icon: '⚔️', price: 45, kind: 'weapon', desc: '伤害 2.5：铁匠铺出品，靠谱！' },
  diamond_sword: { name: '钻石剑', icon: '💎', price: 90, kind: 'weapon', desc: '伤害 4：一刀一个僵尸，壕气冲天' },
  fire_rod: { name: '烈焰棒', icon: '🔥', price: 70, kind: 'weapon', desc: '远程速射：0.5 秒一发火球，点燃 2 秒（单发 0.9）' },
  mjolnir: { name: '雷神之锤', icon: '⚡', price: 120, kind: 'weapon', desc: '伤害 2，25% 概率一道雷直接把怪劈成灰' },
  ice_bow: { name: '寒冰弓', icon: '🏹', price: 80, kind: 'weapon', desc: '射程×2+冰冻 1.5 秒：远远地冻住慢慢打' },
  boomerang: { name: '回旋镖', icon: '🪃', price: 60, kind: 'weapon', desc: '360° 转圈攻击：周围的怪全挨揍' },
  gold_axe: { name: '黄金大斧', icon: '🪓', price: 100, kind: 'weapon', desc: '伤害 3+攻速×2：又重又快，斧头帮帮主' },
  spear: { name: '木矛', icon: '🔱', price: 25, kind: 'weapon', desc: '伤害 1.2+射程×1.4：戳得远，僵尸近不了身' },
  stone_sword: { name: '石剑', icon: '🗿', price: 35, kind: 'weapon', desc: '伤害 2 但挥得慢点：沉甸甸的实在货' },
  poison_blade: { name: '毒刃', icon: '🐍', price: 55, kind: 'weapon', desc: '伤害 1+中毒 3 秒：绿油油的持续掉血' },
  fire_greatsword: { name: '火焰大剑', icon: '🌋', price: 110, kind: 'weapon', desc: '伤害 3+点燃 2 秒：烈焰剑士的招牌' },
  frost_blade: { name: '冰霜之刃', icon: '❄️', price: 90, kind: 'weapon', desc: '伤害 2，20% 把怪冻成冰棍 1 秒' },
  dual_daggers: { name: '双持短剑', icon: '🔪', price: 75, kind: 'weapon', desc: '伤害 1.5+攻速×1.5：左右开弓快如闪电' },
  lightning_staff: { name: '闪电法杖', icon: '🪄', price: 100, kind: 'weapon', desc: '伤害 1.5，15% 追加一道电击（再掉 2 血）' },
  war_hammer: { name: '巨型战锤', icon: '🔨', price: 130, kind: 'weapon', desc: '伤害 4+击退×3：一锤把僵尸轰上天，就是慢' },
  phantom_dagger: { name: '幻影匕首', icon: '👻', price: 150, kind: 'weapon', desc: '伤害 1.5，30% 出现幻影再砍一刀' },
  holy_sword: { name: '圣光之剑', icon: '✨', price: 200, kind: 'weapon', desc: '伤害 3.5+击杀回半心：圣骑士毕业武器' },
  /* ---- 装备（买了就一直生效，还能叠加） ---- */
  armor: { name: '铁盔甲', icon: '🛡️', price: 25, kind: 'gear', desc: '20% 概率让这次受伤减半' },
  hat: { name: '皮帽子', icon: '🎩', price: 20, kind: 'gear', desc: '最大血量+1，多一颗心的安全感' },
  gold_armor: { name: '金盔甲', icon: '🥇', price: 60, kind: 'gear', desc: '25% 概率完全格挡，金光一闪毫发无伤' },
  thorns: { name: '荆棘甲', icon: '🌵', price: 50, kind: 'gear', desc: '反伤：敢咬你的僵尸先掉 2 滴血' },
  magnet: { name: '磁铁项链', icon: '🧲', price: 30, kind: 'gear', desc: '金币×2！金币自己飞进你的口袋' },
  clover: { name: '幸运四叶草', icon: '🍀', price: 40, kind: 'gear', desc: '15% 概率暴击，这一刀伤害×3' },
  shoes: { name: '跑鞋', icon: '👟', price: 25, kind: 'gear', desc: '移动速度+40%，僵尸连你的灰都吃不到' },
  spring: { name: '弹簧鞋', icon: '🌀', price: 45, kind: 'gear', desc: '僵尸咬你一口，自己先被弹飞八丈远' },
  medkit: { name: '医疗包', icon: '🎒', price: 35, kind: 'gear', desc: '回血快一倍，而且受伤后提前 2 秒开始回' },
  vampire: { name: '吸血戒指', icon: '🧛', price: 70, kind: 'gear', desc: '每打败一只僵尸，自己回半颗心' },
  cloak: { name: '亡灵披风', icon: '🧥', price: 55, kind: 'gear', desc: '僵尸全体减速 20%，看你像开了慢动作' },
  telescope: { name: '望远镜', icon: '🔭', price: 15, kind: 'gear', desc: '每杀一只僵尸额外多捡 1 金币' },
  crown: { name: '王者皇冠', icon: '👑', price: 150, kind: 'gear', desc: '毕业神装：伤害+1、移速+15%、最大血+1' },
  leather: { name: '皮甲', icon: '🦺', price: 15, kind: 'gear', desc: '10% 概率受伤减半：轻便又实惠' },
  chainmail: { name: '锁子甲', icon: '⛓️', price: 45, kind: 'gear', desc: '25% 概率受伤减半：一环扣一环的守护' },
  chestplate: { name: '钻石胸甲', icon: '💠', price: 100, kind: 'gear', desc: '最大血量+2：硬邦邦的安全感' },
  boots: { name: '速度之靴', icon: '🚀', price: 60, kind: 'gear', desc: '移动速度+25%，还能和跑鞋叠加' },
  belt: { name: '巨人腰带', icon: '🦣', price: 80, kind: 'gear', desc: '最大血量+1 但移速-10%：肉盾的选择' },
  charm: { name: '金币护符', icon: '🪙', price: 50, kind: 'gear', desc: '商店全场 9 折：老板见了你就笑' },
  berserk: { name: '狂暴指环', icon: '💢', price: 70, kind: 'gear', desc: '血量≤2 颗时伤害×1.5：越残血越凶猛' },
  angel: { name: '守护天使', icon: '👼', price: 120, kind: 'gear', desc: '每局一次：致命一击时留 1 颗心救你一命' },
  book: { name: '经验之书', icon: '📖', price: 40, kind: 'gear', desc: '击杀金币×1.5：知识就是财富' },
  radar: { name: '雷达头盔', icon: '📡', price: 35, kind: 'gear', desc: '全场僵尸再慢 10%：提前发现它们的脚步' },
};

/* ❄️ 雪原商店（第二关专属，和草原完全不同的 40 件） */
const SHOP2 = {
  /* ---- 雪原武器 ×20 ---- */
  ice_spike: { name: '冰锥', icon: '🔱', price: 20, kind: 'weapon', desc: '伤害 1.2，10% 把怪冻住 1 秒' },
  bone_sword: { name: '骨剑', icon: '🦴', price: 35, kind: 'weapon', desc: '伤害 2：骷髅的骨头磨的，结实' },
  snow_staff: { name: '雪杖', icon: '🌨️', price: 45, kind: 'weapon', desc: '远程速射：0.5 秒一发雪球（单发 0.8）' },
  frost_fang: { name: '霜之牙', icon: '🧊', price: 60, kind: 'weapon', desc: '伤害 1.8，20% 冰冻 1 秒' },
  ice_crystal_sword: { name: '冰晶剑', icon: '💠', price: 85, kind: 'weapon', desc: '伤害 3：亮晶晶的冰剑' },
  bone_boomerang: { name: '白骨回旋镖', icon: '🪃', price: 70, kind: 'weapon', desc: '伤害 1.5+360° 转圈：雪原群怪克星' },
  frost_bow: { name: '极寒弓', icon: '🏹', price: 90, kind: 'weapon', desc: '射程×2+冰冻 1 秒：雪原神射手' },
  ice_dual: { name: '冰风双刀', icon: '⚔️', price: 95, kind: 'weapon', desc: '伤害 1.8+攻速×1.4：冰风一样的快刀' },
  white_spear: { name: '白夜长枪', icon: '🔱', price: 80, kind: 'weapon', desc: '伤害 1.5+射程×1.5：雪原最远兵器' },
  frost_axe: { name: '冻土战斧', icon: '🪓', price: 110, kind: 'weapon', desc: '伤害 3.5+攻速×1.25：斧头落处冻土开裂' },
  snow_dagger: { name: '雪影匕首', icon: '🔪', price: 140, kind: 'weapon', desc: '伤害 2，30% 雪影再砍一刀' },
  ice_staff: { name: '冰封法杖', icon: '🪄', price: 130, kind: 'weapon', desc: '伤害 2，20% 追加冰电击（再掉 2 血）' },
  avalanche_hammer: { name: '雪崩锤', icon: '🔨', price: 120, kind: 'weapon', desc: '伤害 3.5+击退×2：一锤砸出雪崩' },
  bone_greatsword: { name: '骸骨巨剑', icon: '💀', price: 160, kind: 'weapon', desc: '伤害 4.5 但挥得慢：门板大的骨剑' },
  aurora_sword: { name: '极光剑', icon: '🌈', price: 180, kind: 'weapon', desc: '伤害 3，20% 瞬移背刺+无敌残影（光影剑雪原版）' },
  ice_dragon: { name: '冰龙吐息', icon: '🐉', price: 150, kind: 'weapon', desc: '伤害 2+冻伤 3 秒：蓝色的持续掉血' },
  yeti_totem: { name: '雪怪图腾', icon: '🗿', price: 100, kind: 'weapon', desc: '伤害 2+击杀回半心：雪怪的力量' },
  frost_warhammer: { name: '寒冰巨锤', icon: '⚒️', price: 170, kind: 'weapon', desc: '伤害 4+击退×3：冰山都给你敲碎' },
  ice_breaker: { name: '碎冰者', icon: '⛏️', price: 190, kind: 'weapon', desc: '伤害 4，20% 一击双倍伤害' },
  eternal_winter: { name: '永冬之剑', icon: '❄️', price: 250, kind: 'weapon', desc: '伤害 5+15% 冰冻 2 秒：雪原毕业神剑' },
  /* ---- 雪原装备 ×20 ---- */
  snow_coat: { name: '雪皮衣', icon: '🧥', price: 20, kind: 'gear', desc: '10% 概率受伤减半：雪原入门装' },
  bone_helm: { name: '骨盔', icon: '🪖', price: 25, kind: 'gear', desc: '最大血量+1' },
  ice_armor: { name: '冰甲', icon: '🧊', price: 50, kind: 'gear', desc: '25% 概率受伤减半：浑身冰甲片' },
  snow_goggles: { name: '雪镜', icon: '🥽', price: 30, kind: 'gear', desc: '怪物全体再慢 5%：看得清它们的脚印' },
  warm_hearth: { name: '暖炉之心', icon: '🔥', price: 60, kind: 'gear', desc: '回血速度×2：怀里揣着小火炉' },
  ice_boots: { name: '冰爪靴', icon: '🥾', price: 45, kind: 'gear', desc: '移动速度+20%：雪地抓地不打滑' },
  sled_shoes: { name: '雪橇鞋', icon: '🛷', price: 35, kind: 'gear', desc: '移动速度+15%：出溜一下就滑远了' },
  snow_medkit: { name: '医疗雪包', icon: '🎒', price: 40, kind: 'gear', desc: '受伤后提前 1 秒开始回血' },
  ice_necklace: { name: '冰晶项链', icon: '📿', price: 55, kind: 'gear', desc: '击杀金币×1.5' },
  fox_cloak: { name: '雪狐披风', icon: '🦊', price: 65, kind: 'gear', desc: '怪物减速 10%：像雪狐一样难抓' },
  bone_charm: { name: '白骨护符', icon: '🧿', price: 70, kind: 'gear', desc: '15% 概率完全格挡不掉血' },
  ice_ring: { name: '冰霜指环', icon: '💍', price: 90, kind: 'gear', desc: '任何武器攻击都有 10% 概率冰冻 1 秒' },
  snowman_apron: { name: '雪人肚兜', icon: '⛄', price: 85, kind: 'gear', desc: '最大血量+2 但移速-5%：圆滚滚抗揍' },
  north_star: { name: '北极星', icon: '⭐', price: 100, kind: 'gear', desc: '伤害+1：北极星指路' },
  ice_wolf: { name: '冰狼之魂', icon: '🐺', price: 110, kind: 'gear', desc: '血量≤2 颗时伤害×1.5' },
  avalanche_belt: { name: '雪崩腰带', icon: '🎽', price: 95, kind: 'gear', desc: '武器击退+50%：怪被你打飞更远' },
  winter_cloak: { name: '寒冬斗篷', icon: '🌬️', price: 120, kind: 'gear', desc: '20% 概率完全格挡不掉血' },
  snow_radar: { name: '雪境雷达', icon: '📡', price: 50, kind: 'gear', desc: '怪物减速 8%：提前听见雪里脚步声' },
  frost_crystal: { name: '不灭冰晶', icon: '💎', price: 150, kind: 'gear', desc: '每局一次：致命一击留 1 颗心' },
  ice_crown: { name: '冰皇之冠', icon: '🤴', price: 200, kind: 'gear', desc: '伤害+1、最大血+1、移速+10%：雪原毕业神装' },
};
let _id = 1;
function makePlayer() {
  return { x: WORLD.w / 2, y: WORLD.h / 2, dir: 0, hearts: PLAYER.hearts, atkT: 0, cd: 0, inv: 0, walkT: 0, moving: false, sinceHurt: 99, regenT: 0, gold: 0, weapon: null, armor: false, owned: {}, maxHearts: PLAYER.hearts, speedMul: 1, dmgAdd: 0 };
}
/* 在人物周围一圈圆环上挑生成点（不刷脸上，也不刷出世界） */
function pickSpawn(p, rnd) {
  for (let i = 0; i < 20; i++) {
    const a = rnd() * Math.PI * 2, d = SPAWN.ringMin + rnd() * (SPAWN.ringMax - SPAWN.ringMin);
    const x = Math.max(30, Math.min(WORLD.w - 30, p.x + Math.cos(a) * d));
    const y = Math.max(30, Math.min(WORLD.h - 30, p.y + Math.sin(a) * d));
    if (Math.hypot(x - p.x, y - p.y) >= SPAWN.ringMin * 0.8) return { x, y };
  }
  return { x: 40, y: 40 };
}
function spawnZombie(p, rnd) {
  const s = pickSpawn(p, rnd);
  return { id: _id++, x: s.x, y: s.y, hp: ZOMBIE.hp, flash: 0, walkT: rnd() * 10, dead: false };
}
/* 僵尸追人一步（撞世界边就停） */
function zombieStep(z, p, dt, speedMul) {
  const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy) || 1;
  const sp = ZOMBIE.speed * (speedMul || 1) * dt;
  z.x = Math.max(20, Math.min(WORLD.w - 20, z.x + dx / d * sp));
  z.y = Math.max(20, Math.min(WORLD.h - 20, z.y + dy / d * sp));
}
/* 攻击判定：扇形内的僵尸掉血+弹开；opts.dmg=每刀伤害（光影剑=2）；
   opts.rangeMul=射程倍率（寒冰弓×2）；opts.arc=攻击角度（回旋镖=一整圈）；
   opts.teleport=随机函数（光影剑专属：20% 瞬移到怪物背后再砍一刀）。返回打中的僵尸 */
function attackHit(p, zombies, opts) {
  const dmg = (opts && opts.dmg) || 1, tp = opts && opts.teleport;
  const range = ATTACK.range * ((opts && opts.rangeMul) || 1), arc = (opts && opts.arc) || ATTACK.arc;
  const hit = [];
  for (const z of zombies) {
    if (z.dead) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy);
    if (d > range + (z.r || ZOMBIE.r)) continue;
    const ang = Math.atan2(dy, dx);
    let diff = Math.abs(ang - p.dir); if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff <= arc / 2) {
      z.hp -= dmg; z.flash = 0.12;
      const kb = ATTACK.knock * (z.boss ? 0.15 : 1) * ((opts && opts.kbMul) || 1);   // 👹 BOSS 太重，只退一点；🔨 战锤击退×3
      z.x = Math.max(20, Math.min(WORLD.w - 20, z.x + (dx / (d || 1)) * kb));
      z.y = Math.max(20, Math.min(WORLD.h - 20, z.y + (dy / (d || 1)) * kb));
      if (tp && !z.dead && z.hp > 0 && tp() < 0.2) {   // 🗡️ 光影剑：瞬移背刺！
        const bx = z.x + (dx / (d || 1)) * 18, by = z.y + (dy / (d || 1)) * 18;
        p.x = Math.max(16, Math.min(WORLD.w - 16, bx)); p.y = Math.max(16, Math.min(WORLD.h - 16, by));
        z.hp -= dmg; z.flash = 0.15; z.tp = true;
      }
      if (z.hp <= 0) z.dead = true;
      hit.push(z);
    }
  }
  return hit;
}
/* 击杀掉落：僵尸 1~4，骷髅 3~6，鬼魂 4~8，岩浆怪 5~10，雷云精 6~12，虚空行者 8~15 */
function lootGold(rnd) { return 1 + Math.floor(rnd() * 4); }
function lootBounty(z, rnd) {
  if (z && z.voidw) return 8 + Math.floor(rnd() * 8);
  if (z && z.storm) return 6 + Math.floor(rnd() * 7);
  if (z && z.lava) return 5 + Math.floor(rnd() * 6);
  if (z && z.ghost) return 4 + Math.floor(rnd() * 5);
  if (z && z.skel) return 3 + Math.floor(rnd() * 4);
  return lootGold(rnd);
}
/* 商店购买：钱够就扣钱返回剩余，不够返回 null；off=折扣（金币护符 0.1=9 折）；shop=商品表（雪原用 SHOP2） */
function buyItem(gold, key, off, shop) {
  const it = (shop || SHOP)[key]; if (!it) return null;
  const price = Math.ceil(it.price * (1 - (off || 0)));
  if (gold < price) return null;
  return gold - price;
}
/* ❤️ 回血：4 秒没受伤，之后每 2 秒回半颗心（医疗包：delay/every 减半；帽子皇冠：上限更高） */
function regenTick(p, dt) {
  p.sinceHurt += dt;
  const maxH = p.maxHearts || PLAYER.hearts, dl = p.regenDelay || REGEN.delay, ev = p.regenEvery || REGEN.every;
  if (p.sinceHurt < dl || p.hearts >= maxH) return;
  p.regenT += dt;
  while (p.regenT >= ev && p.hearts < maxH) { p.regenT -= ev; p.hearts = Math.min(maxH, p.hearts + REGEN.amount); }
}
/* 玩家移动一步（带世界边界；speedMul=跑鞋皇冠加速） */
function playerStep(p, mx, my, dt, speedMul) {
  const d = Math.hypot(mx, my);
  p.moving = d > 0.01;
  if (!p.moving) return;
  const sp = PLAYER.speed * (speedMul || 1);
  p.x = Math.max(16, Math.min(WORLD.w - 16, p.x + mx / d * sp * dt));
  p.y = Math.max(16, Math.min(WORLD.h - 16, p.y + my / d * sp * dt));
  p.dir = Math.atan2(my, mx);
  p.walkT += dt;
}
/* 僵尸碰到玩家：掉心+弹开+短暂无敌。dmg=本次伤害（铁盔甲触发时传 0.5）。返回是否真的抓到了 */
function touchHurt(p, z, dmg) {
  if (p.inv > 0 || z.dead) return false;
  if (Math.hypot(z.x - p.x, z.y - p.y) > PLAYER.r + (z.r || ZOMBIE.r)) return false;
  p.hearts -= (dmg == null ? 1 : dmg); p.inv = HURT.invincible; p.sinceHurt = 0; p.regenT = 0;
  const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy) || 1;
  p.x = Math.max(16, Math.min(WORLD.w - 16, p.x + dx / d * HURT.knock));
  p.y = Math.max(16, Math.min(WORLD.h - 16, p.y + dy / d * HURT.knock));
  return true;
}
/* 难度成长：每 10 只击杀，同屏上限+1、速度微涨（玩到后面越来越刺激） */
function difficulty(kills) {
  return { cap: SPAWN.capBase + Math.floor(kills / 10), speedMul: 1 + Math.min(0.6, kills * 0.008) };
}
/* 👹 BOSS：击杀满 100 出现。体型=10 只僵尸、血量=10 只僵尸(40)；
   技能①双臂砸地：周围 10 格（150px）内玩家掉 2 心，冷却 20 秒；
   技能②陀螺追击：持续 5 秒、冷却 30 秒，被碰到每秒掉半颗心 */
const BOSS = { hp: 40, r: 60, slamR: 150, slamCd: 20, slamWind: 0.8, spinCd: 30, spinDur: 5, spinMul: 2.2, firstSlam: 6, firstSpin: 12 };
function makeBoss(x, y) {
  return { x, y, hp: BOSS.hp, r: BOSS.r, boss: true, dead: false, flash: 0, walkT: Math.random() * 9,
    state: 'chase', stateT: 0, slamT: BOSS.firstSlam, spinT: BOSS.firstSpin, spinA: 0, kb: null };
}
/* BOSS 每帧行为（纯逻辑）；zspeed=当前僵尸速度。返回事件 {slam/giantArrow/freeze/soulFire/drain} 由界面层做伤害和特效 */
function bossTick(b, p, dt, zspeed) {
  const ev = { slam: false };
  b.flash = Math.max(0, b.flash - dt);
  if (b.kb) { b.x += b.kb.dx; b.y += b.kb.dy; b.kb.t -= dt; if (b.kb.t <= 0) b.kb = null; }
  const d = Math.hypot(p.x - b.x, p.y - b.y) || 1;
  if (b.crystalBoss) {   /* 💎 水晶魔王：①晶影分身 冷却22s（分出 2 个假身，假身一刀就碎不给赏金）②棱光齐射 冷却16s（8 方向激光） */
    b.walkT += dt;
    b.cloneCd = (b.cloneCd == null ? 8 : b.cloneCd) - dt;
    if (b.cloneCd <= 0 && d < 520) { b.cloneCd = 22; ev.clone = { n: 2 }; }
    b.laserCd = (b.laserCd == null ? 12 : b.laserCd) - dt;
    if (b.laserCd <= 0 && d < 560) {
      b.laserCd = 16; ev.lasers = [];
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ev.lasers.push({ x: b.x, y: b.y - 30, dx: Math.cos(a), dy: Math.sin(a) }); }
    }
    const spc = zspeed * 0.9;
    b.x += (p.x - b.x) / d * spc * dt; b.y += (p.y - b.y) / d * spc * dt;
    return ev;
  }
  if (b.voidBoss) {   /* 🕳️ 虚空主宰：①虚空裂隙 冷却18s（脚下裂隙 1 秒预警爆发 2 心）②相位轰炸 冷却28s（隐身 4 连瞬移冲击波） */
    b.walkT += dt;
    if (b.state === 'blink') {
      b.stateT -= dt; b.blinkAcc = (b.blinkAcc || 0) - dt;
      if (b.blinkAcc <= 0 && b.blinkN > 0) {
        b.blinkAcc = 0.5; b.blinkN--;
        const a = Math.random() * 6.28, dd = 70 + Math.random() * 40;
        b.x = Math.max(70, Math.min(WORLD.w - 70, p.x + Math.cos(a) * dd));
        b.y = Math.max(90, Math.min(WORLD.h - 70, p.y + Math.sin(a) * dd));
        ev.shock = { x: b.x, y: b.y };
      }
      if (b.stateT <= 0 || b.blinkN <= 0) { b.state = 'chase'; b.hidden = false; }
      return ev;
    }
    b.riftCd = (b.riftCd == null ? 7 : b.riftCd) - dt;
    if (b.riftCd <= 0 && d < 520) { b.riftCd = 18; ev.rift = { x: p.x, y: p.y }; }
    b.blinkCd = (b.blinkCd == null ? 16 : b.blinkCd) - dt;
    if (b.blinkCd <= 0 && d < 420) { b.blinkCd = 28; b.state = 'blink'; b.stateT = 2.5; b.blinkN = 4; b.blinkAcc = 0; b.hidden = true; return ev; }
    const spv = zspeed * 0.85;
    b.x += (p.x - b.x) / d * spv * dt; b.y += (p.y - b.y) / d * spv * dt;
    return ev;
  }
  if (b.stormBoss) {   /* ⛈️ 雷霆法王：①万雷天引 冷却16s（5 道落雷 sequential 砸玩家位置）②电网 冷却26s（6 电球环绕 3 秒） */
    b.walkT += dt;
    b.strikeCd = (b.strikeCd == null ? 6 : b.strikeCd) - dt;
    if (b.strikeCd <= 0 && d < 560) { b.strikeCd = 16; b.strikeN = 5; b.strikeAcc = 0; }
    if (b.strikeN > 0) { b.strikeAcc -= dt; if (b.strikeAcc <= 0) { b.strikeAcc = 0.35; b.strikeN--; ev.strike = { x: p.x, y: p.y }; } }
    b.netCd = (b.netCd == null ? 14 : b.netCd) - dt;
    if (b.netCd <= 0 && d < 400) { b.netCd = 26; ev.net = true; }
    const spt = zspeed * 0.85;
    b.x += (p.x - b.x) / d * spt * dt; b.y += (p.y - b.y) / d * spt * dt;
    return ev;
  }
  if (b.lavaBoss) {   /* 🌋 熔岩魔王：①陨星火雨 冷却18s（3 颗定点陨石，红圈预警）②熔岩冲锋 冷却28s（2 秒 3 倍速冲撞+岩浆路） */
    b.walkT += dt;
    if (b.state === 'charge') {
      b.stateT -= dt;
      b.x += b.chargeDx * zspeed * 3 * dt; b.y += b.chargeDy * zspeed * 3 * dt;
      b.x = Math.max(70, Math.min(WORLD.w - 70, b.x)); b.y = Math.max(90, Math.min(WORLD.h - 70, b.y));
      ev.trail = true;
      if (b.stateT <= 0) b.state = 'chase';
      return ev;
    }
    b.meteorCd = (b.meteorCd == null ? 7 : b.meteorCd) - dt;
    if (b.meteorCd <= 0 && d < 520) {
      b.meteorCd = 18;
      ev.meteors = [{ x: p.x, y: p.y }, { x: p.x + 100, y: p.y - 70 }, { x: p.x - 100, y: p.y + 70 }];
    }
    b.chargeCd = (b.chargeCd == null ? 15 : b.chargeCd) - dt;
    if (b.chargeCd <= 0 && d < 400) { b.chargeCd = 28; b.state = 'charge'; b.stateT = 2; b.chargeDx = (p.x - b.x) / d; b.chargeDy = (p.y - b.y) / d; return ev; }
    const spl = zspeed * 0.8;
    b.x += (p.x - b.x) / d * spl * dt; b.y += (p.y - b.y) / d * spl * dt;
    return ev;
  }
  if (b.ghostBoss) {   /* 👻 鬼王：①魂火连珠 冷却15s（连发 3 颗直线魂火）②夺魂锁链 冷却25s（定住吸 3 秒） */
    b.walkT += dt;
    if (b.state === 'drain') {
      b.stateT -= dt; ev.drain = d < 240;
      if (b.stateT <= 0) b.state = 'chase';
      return ev;
    }
    b.soulCd = (b.soulCd == null ? 8 : b.soulCd) - dt;
    if (b.soulCd <= 0 && d < 460) { b.soulCd = 15; b.soulN = 3; b.soulAcc = 0; }
    if (b.soulN > 0) { b.soulAcc -= dt; if (b.soulAcc <= 0) { b.soulAcc = 0.3; b.soulN--; ev.soulFire = { x: b.x, y: b.y - 40, dx: (p.x - b.x) / d, dy: (p.y - b.y) / d }; } }
    b.drainCd = (b.drainCd == null ? 14 : b.drainCd) - dt;
    if (b.drainCd <= 0 && d < 300 && !(b.soulN > 0)) { b.drainCd = 25; b.state = 'drain'; b.stateT = 3; return ev; }
    const spg = zspeed * 0.9;
    b.x += (p.x - b.x) / d * spg * dt; b.y += (p.y - b.y) / d * spg * dt;
    return ev;
  }
  if (b.skelBoss) {   /* 💀 骷髅王：①巨箭 冷却20s（追踪 5 秒，速度=玩家）②寒冰 冷却30s（冻住 1 秒） */
    b.walkT += dt;
    b.giantCd = (b.giantCd == null ? 6 : b.giantCd) - dt;
    if (b.giantCd <= 0 && d < 600) { b.giantCd = 20; ev.giantArrow = { x: b.x, y: b.y - 40, dx: (p.x - b.x) / d, dy: (p.y - b.y) / d }; }
    b.freezeCd = (b.freezeCd == null ? 16 : b.freezeCd) - dt;
    if (b.freezeCd <= 0 && d < 420) { b.freezeCd = 30; ev.freeze = true; }
    const sps = zspeed * 0.75;
    b.x += (p.x - b.x) / d * sps * dt; b.y += (p.y - b.y) / d * sps * dt;
    return ev;
  }
  b.slamT -= dt; b.spinT -= dt;
  if (b.state === 'chase') {
    b.walkT += dt;
    const sp = zspeed * 0.75;
    b.x += (p.x - b.x) / d * sp * dt; b.y += (p.y - b.y) / d * sp * dt;
    if (b.slamT <= 0 && d < BOSS.slamR + 60) { b.state = 'windup'; b.stateT = BOSS.slamWind; }   // 够近才举臂
    else if (b.spinT <= 0) { b.state = 'spin'; b.stateT = BOSS.spinDur; }
  } else if (b.state === 'windup') {
    b.stateT -= dt;
    if (b.stateT <= 0) { b.state = 'chase'; b.slamT = BOSS.slamCd; ev.slam = true; }   // 砸！
  } else if (b.state === 'spin') {
    b.stateT -= dt; b.walkT += dt * 2; b.spinA += dt * 12;
    const sp = zspeed * BOSS.spinMul;
    b.x += (p.x - b.x) / d * sp * dt; b.y += (p.y - b.y) / d * sp * dt;
    if (b.stateT <= 0) { b.state = 'chase'; b.spinT = BOSS.spinCd; b.spinA = 0; }
  }
  return ev;
}
/* 💀 骷髅弓手（第二关）：骨白色，保持 150~230 距离游走，直线射箭（箭射出后不改方向，玩家移动就能躲开） */
const SKELETON = { hp: 3, r: 12, speed: ZOMBIE.speed * 0.85, keepMin: 150, keepMax: 230, fireCd: 2.5, range: 420 };
function makeSkeleton(x, y, rnd) {
  const r = rnd || Math.random;
  return { x, y, hp: SKELETON.hp, r: SKELETON.r, skel: true, dead: false, flash: 0, walkT: r() * 9, fireT: 1.2 + r() * 1.5,
    keepMin: 130 + r() * 60, keepMax: 200 + r() * 90 };   // 每只站位不同，不挤一堆
}
/* 骷髅每帧：远了靠近、近了拉开；冷却到就朝玩家当前位置射一箭（锁定瞬间方向，直线飞） */
function skeletonTick(s, p, dt, speedMul, rnd) {
  const ev = { arrow: null };
  s.flash = Math.max(0, s.flash - dt); s.walkT += dt;
  const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
  const sp = SKELETON.speed * (speedMul || 1);
  const kMin = s.keepMin || SKELETON.keepMin, kMax = s.keepMax || SKELETON.keepMax;
  if (d > kMax) { s.x += dx / d * sp * dt; s.y += dy / d * sp * dt; }
  else if (d < kMin) { s.x -= dx / d * sp * 0.8 * dt; s.y -= dy / d * sp * 0.8 * dt; }
  s.x = Math.max(20, Math.min(WORLD.w - 20, s.x)); s.y = Math.max(20, Math.min(WORLD.h - 20, s.y));
  s.fireT -= dt;
  if (s.fireT <= 0 && d < SKELETON.range) {
    s.fireT = SKELETON.fireCd + (rnd || Math.random)() * 0.8;
    ev.arrow = { x: s.x, y: s.y - 6, dx: dx / d, dy: dy / d };   // 射出瞬间锁定方向，之后直线
  }
  return ev;
}
/* 👻 鬼魂商店（第三关专属，40 件全新） */
const SHOP3 = {
  /* ---- 鬼魂武器 ×20 ---- */
  soul_dagger: { name: '魂刃', icon: '🔪', price: 30, kind: 'weapon', desc: '伤害 2：凝着魂光的小刀' },
  chain_sickle: { name: '锁链镰刀', icon: '⛓️', price: 45, kind: 'weapon', desc: '伤害 1.8+射程×1.4：甩出去老远' },
  ghost_claw: { name: '幽冥爪', icon: '🐾', price: 55, kind: 'weapon', desc: '伤害 1.5+攻速×1.4：鬼影般乱抓' },
  soul_bell: { name: '摄魂铃', icon: '🔔', price: 60, kind: 'weapon', desc: '伤害 1.2+360° 音波：铃响一圈全中' },
  ghostfire_staff: { name: '鬼火法杖', icon: '🕯️', price: 70, kind: 'weapon', desc: '远程速射：0.5 秒一发鬼火，点燃 2 秒（单发 1.1）' },
  wraith_sword: { name: '怨灵大剑', icon: '🗡️', price: 90, kind: 'weapon', desc: '伤害 3.5：怨灵寄宿的巨剑' },
  hell_trident: { name: '地狱三叉戟', icon: '🔱', price: 100, kind: 'weapon', desc: '伤害 2.5+射程×1.5：地狱制式武器' },
  soul_eater: { name: '噬魂刀', icon: '🍴', price: 120, kind: 'weapon', desc: '伤害 2.5+击杀回半心：吃魂的刀' },
  ghost_bow: { name: '幽灵弓', icon: '🏹', price: 110, kind: 'weapon', desc: '自动瞄准射灵魂箭：伤害 2' },
  samsara_blade: { name: '轮回之刃', icon: '🌀', price: 140, kind: 'weapon', desc: '伤害 3，25% 轮回再斩一刀' },
  banshee_staff: { name: '黄泉杖', icon: '🪄', price: 150, kind: 'weapon', desc: '伤害 2.5，25% 追加冥电击（再掉 2 血）' },
  ghost_dual: { name: '幽灵双刺', icon: '⚔️', price: 130, kind: 'weapon', desc: '伤害 2+攻速×1.5：双鬼拍门' },
  grudge_axe: { name: '怨念战斧', icon: '🪓', price: 160, kind: 'weapon', desc: '伤害 4+击退×2：一斧子怨念' },
  soul_chain: { name: '灵魂锁链', icon: '🔗', price: 170, kind: 'weapon', desc: '伤害 3+360° 锁链横扫' },
  soul_breaker: { name: '灭魂枪', icon: '🔫', price: 180, kind: 'weapon', desc: '远程重炮：1.5 秒一发，单发伤害 8，一枪灭魂' },
  reaper_scythe: { name: '死神镰刀', icon: '⚰️', price: 200, kind: 'weapon', desc: '伤害 4.5+射程×1.6：死神同款' },
  hellfire_blade: { name: '地狱火刃', icon: '🔥', price: 190, kind: 'weapon', desc: '伤害 3+地狱火点燃' },
  phantom_soul: { name: '幻影魂刃', icon: '👤', price: 210, kind: 'weapon', desc: '伤害 3.5，20% 瞬移背刺+无敌残影' },
  night_sword: { name: '冥夜剑', icon: '🌑', price: 220, kind: 'weapon', desc: '伤害 5：吸走光的黑剑' },
  final_judge: { name: '终焉之剑', icon: '⚡', price: 300, kind: 'weapon', desc: '伤害 6+击杀回半心：地狱毕业神剑' },
  /* ---- 鬼魂装备 ×20 ---- */
  soul_lantern: { name: '魂灯', icon: '🏮', price: 25, kind: 'gear', desc: '最大血量+1' },
  ghost_mask: { name: '鬼面', icon: '👺', price: 35, kind: 'gear', desc: '10% 概率完全格挡' },
  hell_armor: { name: '冥甲', icon: '🛡️', price: 60, kind: 'gear', desc: '25% 概率受伤减半' },
  soul_stone: { name: '魂吸石', icon: '🪨', price: 80, kind: 'gear', desc: '击杀金币+1：石头会吸魂' },
  ghost_cloak: { name: '幽灵披风', icon: '👻', price: 55, kind: 'gear', desc: '怪物减速 10%' },
  hell_boots: { name: '地狱火靴', icon: '👢', price: 70, kind: 'gear', desc: '移动速度+20%：脚下冒火' },
  soul_ring: { name: '摄魂戒指', icon: '💍', price: 95, kind: 'gear', desc: '击杀 15% 概率回半心' },
  other_side: { name: '彼岸徽章', icon: '🎖️', price: 100, kind: 'gear', desc: '伤害+1' },
  wind_bell: { name: '阴风铃', icon: '🎐', price: 40, kind: 'gear', desc: '怪物减速 8%：铃声让它们发抖' },
  hell_map: { name: '黄泉图', icon: '🗺️', price: 45, kind: 'gear', desc: '受伤后提前 1 秒开始回血' },
  soul_belt: { name: '幽冥腰带', icon: '🎽', price: 85, kind: 'gear', desc: '武器击退+50%' },
  soul_pearl: { name: '聚魂珠', icon: '🔮', price: 90, kind: 'gear', desc: '击杀金币×1.5' },
  ghost_hand: { name: '鬼手护腕', icon: '🧤', price: 110, kind: 'gear', desc: '武器攻速+18%：鬼手帮你挥' },
  soul_charm: { name: '魂佑符', icon: '🧧', price: 130, kind: 'gear', desc: '20% 概率完全格挡' },
  hellhound: { name: '地狱犬牙', icon: '🦷', price: 120, kind: 'gear', desc: '血量≤2 颗时伤害×1.5' },
  samsara_stone: { name: '轮回石', icon: '🪙', price: 150, kind: 'gear', desc: '每局一次：致命一击留 2 颗心' },
  hell_cloak: { name: '冥王披风', icon: '🦇', price: 160, kind: 'gear', desc: '25% 概率完全格挡' },
  soul_heart: { name: '聚灵之心', icon: '💜', price: 200, kind: 'gear', desc: '回血×2+最大血+1' },
  undying_soul: { name: '不熄之魂', icon: '🕯️', price: 180, kind: 'gear', desc: '每局一次：致命一击留 1 颗心' },
  ghost_crown: { name: '鬼王冠', icon: '👑', price: 250, kind: 'gear', desc: '伤害+1、最大血+2、移速+10%：地狱毕业神装' },
};
/* 🌋 熔岩商店（第四关专属，40 件全新） */
const SHOP4 = {
  /* ---- 熔岩武器 ×20 ---- */
  fire_sword: { name: '火石剑', icon: '🗡️', price: 30, kind: 'weapon', desc: '伤害 2：打火石磨的剑' },
  flame_knife: { name: '烈焰刀', icon: '🔪', price: 55, kind: 'weapon', desc: '伤害 1.5+攻速×1.4：刀刀带火星' },
  lava_hammer: { name: '熔岩锤', icon: '🔨', price: 45, kind: 'weapon', desc: '伤害 3+击退×2：锤头是一整块岩浆' },
  fire_whip: { name: '火舌鞭', icon: '〰️', price: 65, kind: 'weapon', desc: '伤害 2+射程×1.5：甩出一条火舌' },
  obsidian_sword: { name: '黑曜石剑', icon: '⚫', price: 75, kind: 'weapon', desc: '伤害 3：火山玻璃打的，又黑又利' },
  magma_boomerang: { name: '岩浆回旋镖', icon: '🪃', price: 90, kind: 'weapon', desc: '伤害 2+360° 转圈：烧一圈' },
  lava_bow: { name: '熔岩弓', icon: '🏹', price: 85, kind: 'weapon', desc: '自动瞄准射火箭：伤害 1.8+点燃 2 秒' },
  ash_dual: { name: '灰烬双刃', icon: '⚔️', price: 95, kind: 'weapon', desc: '伤害 1.8+攻速×1.4：灰烬双舞' },
  red_spear: { name: '赤焰枪', icon: '🔱', price: 100, kind: 'weapon', desc: '伤害 2+射程×1.5：枪尖永远通红' },
  magma_staff: { name: '熔核法杖', icon: '🪄', price: 105, kind: 'weapon', desc: '远程速射：0.5 秒一发岩浆弹，20% 追加熔核击（单发 1.2）' },
  volcano_axe: { name: '火山战斧', icon: '🪓', price: 115, kind: 'weapon', desc: '伤害 3.5+击退×2：劈开火山口' },
  sulfur_dagger: { name: '硫磺匕首', icon: '🟡', price: 125, kind: 'weapon', desc: '伤害 1.5+硫磺毒 3 秒：臭但好用' },
  dragon_breath: { name: '火龙之息', icon: '🐉', price: 160, kind: 'weapon', desc: '伤害 2.5+点燃 2 秒：真·火龙吐息' },
  inferno_sword: { name: '炼狱大剑', icon: '🔥', price: 150, kind: 'weapon', desc: '伤害 4：炼狱之火铸成' },
  magma_heart_blade: { name: '熔岩之心刃', icon: '❤️‍🔥', price: 180, kind: 'weapon', desc: '伤害 3.5+击杀回半心：跳着熔岩的心脏' },
  sky_hammer: { name: '焚天锤', icon: '⚒️', price: 170, kind: 'weapon', desc: '伤害 4.5+击退×3：一锤焚天' },
  burst_hammer: { name: '爆裂战锤', icon: '💥', price: 190, kind: 'weapon', desc: '伤害 4+击退×3+攻速×1.25' },
  corona_sword: { name: '日冕剑', icon: '🌞', price: 220, kind: 'weapon', desc: '伤害 4.5：剑身是凝固的阳光' },
  doom_fire_sword: { name: '灭世火剑', icon: '🌋', price: 240, kind: 'weapon', desc: '伤害 5+点燃 2 秒' },
  eternal_forge: { name: '永恒熔炉剑', icon: '⭐', price: 320, kind: 'weapon', desc: '伤害 6.5+点燃+击杀回半心：火山毕业神剑' },
  /* ---- 熔岩装备 ×20 ---- */
  obsidian_helm: { name: '黑曜石头盔', icon: '🪖', price: 25, kind: 'gear', desc: '最大血量+1' },
  volcano_hide: { name: '火山皮甲', icon: '🧥', price: 35, kind: 'gear', desc: '10% 概率受伤减半' },
  lava_badge: { name: '熔岩徽章', icon: '🎖️', price: 45, kind: 'gear', desc: '怪物减速 8%' },
  magma_charm: { name: '岩浆护符', icon: '🧿', price: 55, kind: 'gear', desc: '15% 概率完全格挡' },
  volcano_stone: { name: '火山石', icon: '🪨', price: 60, kind: 'gear', desc: '最大血量+2 但移速-5%：沉但抗揍' },
  fire_boots: { name: '火羽靴', icon: '👢', price: 65, kind: 'gear', desc: '移动速度+20%：脚下生风火' },
  obsidian_armor: { name: '黑曜石甲', icon: '🛡️', price: 80, kind: 'gear', desc: '25% 概率受伤减半' },
  volcano_belt: { name: '火山腰带', icon: '🎽', price: 85, kind: 'gear', desc: '武器击退+50%' },
  magma_core_heart: { name: '熔核之心', icon: '🧡', price: 90, kind: 'gear', desc: '回血速度×2：心里有个小熔炉' },
  lava_magnet_stone: { name: '熔岩吸石', icon: '🧲', price: 95, kind: 'gear', desc: '击杀金币×1.5' },
  sulfur_ring: { name: '硫磺戒指', icon: '💍', price: 100, kind: 'gear', desc: '任何武器攻击都有 10% 概率点燃' },
  ash_cloak: { name: '灰烬斗篷', icon: '🌫️', price: 110, kind: 'gear', desc: '20% 概率完全格挡' },
  magma_tattoo: { name: '岩浆纹身', icon: '🐉', price: 115, kind: 'gear', desc: '血量≤2 颗时伤害×1.5' },
  fire_orb: { name: '火灵珠', icon: '🔮', price: 120, kind: 'gear', desc: '击杀金币+2' },
  inferno_glove: { name: '炼狱手套', icon: '🧤', price: 130, kind: 'gear', desc: '武器攻速+18%' },
  flame_ring: { name: '烈焰之环', icon: '⭕', price: 140, kind: 'gear', desc: '攻击 15% 概率追加 2 点火焰伤害' },
  obsidian_heart: { name: '黑曜石之心', icon: '🖤', price: 150, kind: 'gear', desc: '最大血量+3 但移速-10%' },
  undying_flame: { name: '不灭火种', icon: '🕯️', price: 170, kind: 'gear', desc: '每局一次：致命一击留 1 颗心' },
  phoenix_feather: { name: '凤凰之羽', icon: '🪶', price: 210, kind: 'gear', desc: '每局一次：致命一击留 3 颗心！涅槃重生' },
  lava_crown: { name: '熔岩王冠', icon: '👑', price: 260, kind: 'gear', desc: '伤害+1、最大血+2、移速+10%：火山毕业神装' },
};
/* 🌋 岩浆怪（第四关）：橙红蹦跳近战，一蹦一停；死掉会小爆炸 */
const LAVA = { hp: 6, r: 13, speed: 100 };
function makeLava(x, y, rnd) {
  const r = rnd || Math.random;
  return { x, y, hp: LAVA.hp, r: LAVA.r, lava: true, dead: false, flash: 0, walkT: r() * 9, driftA: r() * 6.3 };
}
function lavaTick(g, p, dt, speedMul) {
  g.flash = Math.max(0, g.flash - dt); g.walkT += dt;
  const phase = g.walkT % 0.7;
  if (phase < 0.35) {   // 起跳那半秒猛扑，后半秒落地喘息（一蹦一停）
    const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
    const sp = LAVA.speed * (speedMul || 1) * 2;
    g.x += dx / d * sp * dt; g.y += dy / d * sp * dt;
  }
  g.x = Math.max(20, Math.min(WORLD.w - 20, g.x)); g.y = Math.max(20, Math.min(WORLD.h - 20, g.y));
}
/* 👻 鬼魂（第三关）：青色飘浮近战，走位带飘忽漂移 */
const GHOST = { hp: 5, r: 13, speed: 78 };
function makeGhost(x, y, rnd) {
  const r = rnd || Math.random;
  return { x, y, hp: GHOST.hp, r: GHOST.r, ghost: true, dead: false, flash: 0, walkT: r() * 9, driftA: r() * 6.3 };
}
function ghostTick(g, p, dt, speedMul) {
  g.flash = Math.max(0, g.flash - dt); g.walkT += dt;
  const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
  const sp = GHOST.speed * (speedMul || 1);
  g.x += (dx / d * sp + Math.cos(g.walkT * 2 + g.driftA) * 10) * dt;   // 飘来飘去（放缓）
  g.y += (dy / d * sp + Math.sin(g.walkT * 2 + g.driftA) * 10) * dt;
  g.x = Math.max(20, Math.min(WORLD.w - 20, g.x)); g.y = Math.max(20, Math.min(WORLD.h - 20, g.y));
}
/* ✨ 技能书（全六关商店有售：贵但高伤，带冷却） */
const SKBOOKS = {
  1: [
    ['sk1_fireball', '火球术', '🔥', 100, '技能：喷出大火球 6 伤+点燃（冷却 4 秒）'],
    ['sk1_zap', '雷击术', '⚡', 120, '技能：天雷劈最近的怪 8 伤（冷却 5 秒）'],
    ['sk1_frost', '霜冻术', '❄️', 110, '技能：冻住周围怪物 2 秒（冷却 8 秒）'],
    ['sk1_spin', '旋风斩', '🌪️', 130, '技能：360° 旋风斩 5 伤（冷却 6 秒）'],
    ['sk1_cloud', '毒雾术', '☁️', 140, '技能：放毒雾 4 秒持续掉血（冷却 9 秒）'],
    ['sk1_meteor', '落石术', '🪨', 200, '技能：砸巨石 10 伤（冷却 10 秒）'],
    ['sk1_rain', '剑雨术', '🗡️', 180, '技能：5 把飞剑各 3 伤（冷却 9 秒）'],
    ['sk1_pull', '引力术', '🧲', 150, '技能：把怪吸过来 3 伤（冷却 8 秒）'],
    ['sk1_chain', '连环电', '⚡', 160, '技能：电连环劈 3 只各 4 伤（冷却 7 秒）'],
    ['sk1_holy', '圣光爆', '✨', 300, '技能：圣光炸裂一圈 12 伤（冷却 15 秒）'],
  ],
  2: [
    ['sk2_iceball', '冰球术', '🧊', 150, '技能：大冰球 8 伤+冰冻（冷却 4 秒）'],
    ['sk2_icezap', '冰雷击', '⚡', 170, '技能：冰雷劈最近的怪 10 伤（冷却 5 秒）'],
    ['sk2_blizzard', '暴风雪', '🌨️', 160, '技能：暴雪冻住周围 2.5 秒（冷却 8 秒）'],
    ['sk2_icespin', '冰旋斩', '🌪️', 180, '技能：360° 冰旋斩 7 伤（冷却 6 秒）'],
    ['sk2_coldcloud', '寒雾术', '☁️', 190, '技能：寒雾 4.5 秒持续掉血（冷却 9 秒）'],
    ['sk2_icemeteor', '冰陨石', '☄️', 280, '技能：砸冰陨石 14 伤（冷却 10 秒）'],
    ['sk2_icerain', '冰锥雨', '🌧️', 240, '技能：5 根冰锥各 4 伤（冷却 9 秒）'],
    ['sk2_frostpull', '寒潮引力', '🧲', 200, '技能：寒潮吸怪 4 伤（冷却 8 秒）'],
    ['sk2_icechain', '冰链电', '⚡', 220, '技能：冰链劈 3 只各 5 伤（冷却 7 秒）'],
    ['sk2_winter', '永冬爆', '❄️', 400, '技能：永冬爆发一圈 16 伤（冷却 15 秒）'],
  ],
  3: [
    ['sk3_soulball', '魂火球', '🔮', 200, '技能：魂火球 10 伤+点燃（冷却 4 秒）'],
    ['sk3_hellzap', '冥雷击', '⚡', 220, '技能：冥雷劈最近的怪 12 伤（冷却 5 秒）'],
    ['sk3_soulfreeze', '摄魂冻', '❄️', 210, '技能：摄魂冻结周围 2.5 秒（冷却 8 秒）'],
    ['sk3_wraithspin', '怨灵旋斩', '🌪️', 230, '技能：360° 怨灵旋斩 9 伤（冷却 6 秒）'],
    ['sk3_hellcloud', '黄泉雾', '☁️', 240, '技能：黄泉雾 5 秒持续掉血（冷却 9 秒）'],
    ['sk3_ghostmeteor', '幽冥陨石', '☄️', 340, '技能：砸幽冥陨石 18 伤（冷却 10 秒）'],
    ['sk3_soulrain', '魂剑雨', '🗡️', 290, '技能：5 把魂剑各 5 伤（冷却 9 秒）'],
    ['sk3_soulpull', '吸魂引力', '🧲', 250, '技能：吸魂拉怪 5 伤（冷却 8 秒）'],
    ['sk3_hellchain', '冥链电', '⚡', 270, '技能：冥链劈 3 只各 6 伤（冷却 7 秒）'],
    ['sk3_banshee', '鬼王怒吼', '👻', 500, '技能：鬼王怒吼一圈 20 伤（冷却 15 秒）'],
  ],
  4: [
    ['sk4_fireball', '烈焰球', '🔥', 250, '技能：烈焰巨球 12 伤+点燃（冷却 4 秒）'],
    ['sk4_skyfire', '天火雷', '⚡', 270, '技能：天火劈最近的怪 14 伤（冷却 5 秒）'],
    ['sk4_lavaroot', '岩浆缠绕', '🌋', 260, '技能：岩浆缠住周围 2.5 秒（冷却 8 秒）'],
    ['sk4_firedragon', '火龙卷', '🐉', 280, '技能：360° 火龙卷 11 伤（冷却 6 秒）'],
    ['sk4_sulfurcloud', '硫磺雾', '☁️', 290, '技能：硫磺雾 5 秒持续掉血（冷却 9 秒）'],
    ['sk4_volcmeteor', '火山陨石', '☄️', 400, '技能：砸火山陨石 22 伤（冷却 10 秒）'],
    ['sk4_firerain', '火剑雨', '🗡️', 340, '技能：5 把火剑各 6 伤（冷却 9 秒）'],
    ['sk4_magmapull', '熔核引力', '🧲', 300, '技能：熔核吸怪 6 伤（冷却 8 秒）'],
    ['sk4_firechain', '火链电', '⚡', 320, '技能：火链劈 3 只各 7 伤（冷却 7 秒）'],
    ['sk4_inferno', '焚世爆', '💥', 600, '技能：焚世烈焰一圈 24 伤（冷却 15 秒）'],
  ],
  5: [
    ['sk5_voltball', '雷光球', '⚡', 300, '技能：雷光巨球 14 伤+电击（冷却 4 秒）'],
    ['sk5_truezap', '真雷击', '🌩️', 330, '技能：真雷劈最近的怪 16 伤（冷却 5 秒）'],
    ['sk5_stormfreeze', '雷暴禁锢', '❄️', 310, '技能：雷暴禁锢周围 3 秒（冷却 8 秒）'],
    ['sk5_voltspin', '雷光旋斩', '🌪️', 340, '技能：360° 雷光旋斩 13 伤（冷却 6 秒）'],
    ['sk5_eleccloud', '电云雾', '☁️', 350, '技能：电云雾 5.5 秒持续掉血（冷却 9 秒）'],
    ['sk5_skymeteor', '天雷陨石', '☄️', 460, '技能：砸天雷陨石 26 伤（冷却 10 秒）'],
    ['sk5_voltrain', '雷剑雨', '🗡️', 400, '技能：5 把雷剑各 7 伤（冷却 9 秒）'],
    ['sk5_magpull', '磁暴引力', '🧲', 360, '技能：磁暴吸怪 7 伤（冷却 8 秒）'],
    ['sk5_megachain', '万链电', '⚡', 380, '技能：万链劈 3 只各 8 伤（冷却 7 秒）'],
    ['sk5_thundergod', '雷霆万钧', '🌩️', 700, '技能：雷霆万钧一圈 28 伤（冷却 15 秒）'],
  ],
  6: [
    ['sk6_voidball', '虚空球', '🕳️', 400, '技能：虚空巨球 16 伤+湮灭（冷却 4 秒）'],
    ['sk6_oblivionzap', '湮灭雷', '⚡', 440, '技能：湮灭劈最近的怪 18 伤（冷却 5 秒）'],
    ['sk6_voidfreeze', '虚空冻结', '❄️', 420, '技能：虚空冻结周围 3 秒（冷却 8 秒）'],
    ['sk6_voidspin', '虚无旋斩', '🌪️', 450, '技能：360° 虚无旋斩 15 伤（冷却 6 秒）'],
    ['sk6_darkcloud', '暗物质雾', '☁️', 460, '技能：暗物质雾 6 秒持续掉血（冷却 9 秒）'],
    ['sk6_voidmeteor', '虚空陨石', '☄️', 600, '技能：砸虚空陨石 30 伤（冷却 10 秒）'],
    ['sk6_oblivionrain', '湮灭剑雨', '🗡️', 520, '技能：5 把湮灭剑各 8 伤（冷却 9 秒）'],
    ['sk6_singularpull', '奇点引力', '🧲', 480, '技能：奇点吸怪 8 伤（冷却 8 秒）'],
    ['sk6_voidchain', '虚空链电', '⚡', 500, '技能：虚空链劈 3 只各 9 伤（冷却 7 秒）'],
    ['sk6_bigbang', '宇宙大爆炸', '💫', 900, '技能：宇宙大爆炸一圈 32 伤（冷却 15 秒）'],
  ],
};
/* ⛈️ 雷域商店（第五关专属，40 件+10 技能书） */
const SHOP5 = {
  spark_knife: { name: '电光小刀', icon: '🔪', price: 35, kind: 'weapon', desc: '伤害 2+攻速×1.2' },
  thunder_sword: { name: '雷鸣剑', icon: '🗡️', price: 60, kind: 'weapon', desc: '伤害 2.5，15% 追加电击' },
  gale_dagger: { name: '疾风匕首', icon: '💨', price: 110, kind: 'weapon', desc: '伤害 2.5+攻速×1.5：风一样的刀' },
  storm_spear: { name: '风暴长枪', icon: '🔱', price: 80, kind: 'weapon', desc: '伤害 2+射程×1.5' },
  volt_dual: { name: '伏特双刀', icon: '⚔️', price: 95, kind: 'weapon', desc: '伤害 2+攻速×1.4：电光双舞' },
  cloud_boomerang: { name: '云回旋镖', icon: '🪃', price: 100, kind: 'weapon', desc: '伤害 2+360° 转圈' },
  thunder_bow: { name: '雷霆弓', icon: '🏹', price: 120, kind: 'weapon', desc: '自动瞄准射电光箭：伤害 2+追加电击' },
  sky_axe: { name: '天穹战斧', icon: '🪓', price: 130, kind: 'weapon', desc: '伤害 3.5+击退×2' },
  storm_staff: { name: '风暴法杖', icon: '🪄', price: 140, kind: 'weapon', desc: '远程速射：0.5 秒一发电光弹，25% 追加电击（单发 1.5）' },
  lightning_blade: { name: '闪电之刃', icon: '⚡', price: 150, kind: 'weapon', desc: '伤害 3+攻速×1.25' },
  volt_rifle: { name: '伏特枪', icon: '🔫', price: 160, kind: 'weapon', desc: '远程重炮：1.5 秒一发，单发伤害 6' },
  tempest_hammer: { name: '飓风锤', icon: '🔨', price: 170, kind: 'weapon', desc: '伤害 4+击退×2：一锤起飞' },
  thunder_greatsword: { name: '雷霆大剑', icon: '🗡️', price: 190, kind: 'weapon', desc: '伤害 4.5：剑身缠绕雷电' },
  cloud_sword: { name: '行云剑', icon: '☁️', price: 200, kind: 'weapon', desc: '伤害 3.5，25% 残影再斩' },
  volt_chain_sword: { name: '链雷剑', icon: '⚡', price: 210, kind: 'weapon', desc: '伤害 4，20% 追加电击' },
  storm_caller: { name: '唤雷杖', icon: '🌩️', price: 220, kind: 'weapon', desc: '伤害 4，30% 召雷追加' },
  sky_splitter: { name: '裂空剑', icon: '🌌', price: 240, kind: 'weapon', desc: '伤害 5：一剑裂空' },
  heaven_bow: { name: '天罚之弓', icon: '🏹', price: 250, kind: 'weapon', desc: '自动瞄准射天罚箭：伤害 3+追加电击' },
  thunder_god_hammer: { name: '雷神之怒', icon: '🔨', price: 260, kind: 'weapon', desc: '伤害 5+击退×3：雷神托尔同款' },
  final_storm: { name: '终焉雷暴剑', icon: '👑', price: 340, kind: 'weapon', desc: '伤害 7+追加电击+击杀回半心：雷域毕业神剑' },
  cloud_hat: { name: '云帽', icon: '🎩', price: 30, kind: 'gear', desc: '最大血量+1' },
  lightning_rod: { name: '避雷针', icon: '📍', price: 45, kind: 'gear', desc: '15% 概率完全格挡' },
  wind_boots: { name: '风行之靴', icon: '👢', price: 70, kind: 'gear', desc: '移动速度+25%：脚下生风' },
  storm_cloak: { name: '雷云披风', icon: '🌫️', price: 60, kind: 'gear', desc: '怪物减速 10%' },
  sky_stone: { name: '天空石', icon: '🪨', price: 70, kind: 'gear', desc: '最大血量+2 但移速-5%' },
  storm_charm: { name: '风暴护符', icon: '🧿', price: 80, kind: 'gear', desc: '15% 概率完全格挡' },
  sky_armor: { name: '天穹甲', icon: '🛡️', price: 90, kind: 'gear', desc: '25% 概率受伤减半' },
  volt_pearl: { name: '聚雷珠', icon: '🔮', price: 110, kind: 'gear', desc: '击杀金币×1.5' },
  volt_ring: { name: '电光戒指', icon: '💍', price: 120, kind: 'gear', desc: '攻击 10% 概率追加 2 点电击' },
  storm_belt: { name: '暴风腰带', icon: '🎽', price: 100, kind: 'gear', desc: '武器击退+50%' },
  thunderbird: { name: '雷鸟羽', icon: '🪶', price: 130, kind: 'gear', desc: '武器攻速+18%' },
  thunder_heart: { name: '雷霆之心', icon: '💛', price: 140, kind: 'gear', desc: '回血速度×2' },
  volt_box: { name: '高压电匣', icon: '🔋', price: 150, kind: 'gear', desc: '血量≤2 颗时伤害×1.5' },
  storm_eye: { name: '风暴之眼', icon: '👁️', price: 160, kind: 'gear', desc: '伤害+1' },
  volt_charm: { name: '万雷符', icon: '🧧', price: 170, kind: 'gear', desc: '20% 概率完全格挡' },
  cloud_seat: { name: '雷云坐垫', icon: '☁️', price: 85, kind: 'gear', desc: '最大血量+1' },
  undying_volt: { name: '不熄雷光', icon: '🕯️', price: 190, kind: 'gear', desc: '每局一次：致命一击留 1 颗心' },
  thunder_orb: { name: '雷灵珠', icon: '🔮', price: 95, kind: 'gear', desc: '击杀金币+2' },
  thunder_crown: { name: '雷神冠', icon: '👑', price: 280, kind: 'gear', desc: '伤害+1、最大血+2、移速+10%：雷域毕业神装' },
};
/* 🕳️ 虚空商店（第六关专属，40 件+10 技能书） */
const SHOP6 = {
  void_dagger: { name: '虚空匕首', icon: '🔪', price: 40, kind: 'weapon', desc: '伤害 2+攻速×1.2' },
  dark_sword: { name: '暗剑', icon: '🌑', price: 70, kind: 'weapon', desc: '伤害 3：吞噬光的剑' },
  rift_blade: { name: '裂隙之刃', icon: '⚡', price: 100, kind: 'weapon', desc: '伤害 3，20% 追加虚空击' },
  void_dual: { name: '虚无双刃', icon: '⚔️', price: 120, kind: 'weapon', desc: '伤害 2.5+攻速×1.4' },
  star_boomerang: { name: '星屑回旋镖', icon: '🪃', price: 130, kind: 'weapon', desc: '伤害 2.5+360° 转圈' },
  void_bow: { name: '虚空弓', icon: '🏹', price: 150, kind: 'weapon', desc: '自动瞄准射虚空箭：伤害 2.5+追加虚空击' },
  dark_spear: { name: '暗物质枪', icon: '🔱', price: 170, kind: 'weapon', desc: '伤害 3+射程×1.5' },
  gravity_hammer: { name: '重力锤', icon: '🔨', price: 180, kind: 'weapon', desc: '伤害 4.5+击退×3：一锤一个坑' },
  star_staff: { name: '星辰法杖', icon: '🪄', price: 190, kind: 'weapon', desc: '伤害 3，25% 追加星击' },
  eclipse_sword: { name: '蚀之剑', icon: '🌘', price: 200, kind: 'weapon', desc: '伤害 4：日蚀之刃' },
  oblivion_dagger: { name: '湮灭匕首', icon: '🔪', price: 210, kind: 'weapon', desc: '伤害 3，30% 湮灭再斩' },
  nebula_blade: { name: '星云刃', icon: '🌌', price: 220, kind: 'weapon', desc: '伤害 4+攻速×1.25' },
  cosmic_axe: { name: '宇宙战斧', icon: '🪓', price: 230, kind: 'weapon', desc: '伤害 4.5+击退×2' },
  void_scythe: { name: '虚空镰刀', icon: '⚰️', price: 240, kind: 'weapon', desc: '伤害 5+射程×1.6' },
  void_chain: { name: '虚空锁链', icon: '🔗', price: 250, kind: 'weapon', desc: '伤害 4+360° 锁链横扫' },
  star_bow: { name: '群星弓', icon: '🏹', price: 260, kind: 'weapon', desc: '自动瞄准射星箭：伤害 3.5+追加星击' },
  abyss_sword: { name: '深渊大剑', icon: '🗡️', price: 280, kind: 'weapon', desc: '伤害 5.5：深渊凝视你' },
  dimension_blade: { name: '次元斩', icon: '💠', price: 300, kind: 'weapon', desc: '伤害 5，20% 瞬移背刺+无敌残影' },
  chaos_sword: { name: '混沌之剑', icon: '🌀', price: 320, kind: 'weapon', desc: '伤害 6：混沌之力' },
  final_void: { name: '终焉虚空剑', icon: '👑', price: 400, kind: 'weapon', desc: '伤害 8+湮灭+击杀回半心：虚空毕业神剑' },
  void_helm: { name: '虚空头盔', icon: '🪖', price: 35, kind: 'gear', desc: '最大血量+1' },
  cosmic_map: { name: '宇宙图', icon: '🗺️', price: 60, kind: 'gear', desc: '受伤后提前 1 秒开始回血' },
  shadow_cloak: { name: '暗影披风', icon: '🦇', price: 65, kind: 'gear', desc: '怪物减速 10%' },
  starlight_stone: { name: '星辉石', icon: '🪨', price: 100, kind: 'gear', desc: '最大血量+2' },
  stardust_boots: { name: '星尘靴', icon: '👢', price: 85, kind: 'gear', desc: '移动速度+25%：踏星而行' },
  gravity_charm: { name: '引力护符', icon: '🧿', price: 90, kind: 'gear', desc: '15% 概率完全格挡' },
  dimension_armor: { name: '次元甲', icon: '🛡️', price: 110, kind: 'gear', desc: '25% 概率受伤减半' },
  void_ring: { name: '虚无戒指', icon: '💍', price: 140, kind: 'gear', desc: '攻击 10% 概率追加 2 点虚空伤害' },
  dark_pearl: { name: '暗物质珠', icon: '🔮', price: 130, kind: 'gear', desc: '击杀金币×1.5' },
  dimension_pearl: { name: '次元珠', icon: '🔮', price: 105, kind: 'gear', desc: '击杀金币+2' },
  star_belt: { name: '星辰腰带', icon: '🎽', price: 120, kind: 'gear', desc: '武器击退+50%' },
  gravity_ring: { name: '引力戒指', icon: '💍', price: 145, kind: 'gear', desc: '攻击 10% 概率追加 2 点引力伤害' },
  time_bracer: { name: '时空护腕', icon: '🧤', price: 150, kind: 'gear', desc: '武器攻速+18%' },
  abyss_heart: { name: '深渊之心', icon: '💜', price: 160, kind: 'gear', desc: '回血速度×2' },
  oblivion_tattoo: { name: '湮灭纹身', icon: '🐉', price: 170, kind: 'gear', desc: '血量≤2 颗时伤害×1.5' },
  void_cloak: { name: '虚无斗篷', icon: '🌫️', price: 190, kind: 'gear', desc: '25% 概率完全格挡' },
  void_eye: { name: '虚空之瞳', icon: '👁️', price: 200, kind: 'gear', desc: '伤害+2：看透虚空' },
  blackhole_stone: { name: '黑洞石', icon: '⚫', price: 180, kind: 'gear', desc: '最大血量+3 但移速-10%' },
  undying_void: { name: '不灭虚空', icon: '🕯️', price: 230, kind: 'gear', desc: '每局一次：致命一击留 1 颗心' },
  darkstar_crown: { name: '暗星冠', icon: '👑', price: 320, kind: 'gear', desc: '伤害+1、最大血+2、移速+10%：虚空毕业神装' },
};
/* 💎 第七关·水晶洞窟商店（20 武器+20 装备，全零重名） */
const SHOP7 = {
  /* ---- 武器 ---- */
  crystal_blade: { name: '晶石剑', icon: '🗡️', price: 60, kind: 'weapon', desc: '伤害 8：洞窟入门，亮晶晶' },
  shard_dagger: { name: '晶刺匕首', icon: '🔪', price: 70, kind: 'weapon', desc: '伤害 9：攻速+10%，小小的超快' },
  prism_sword: { name: '光棱剑', icon: '⚔️', price: 85, kind: 'weapon', desc: '伤害 10：阳光一照七彩光' },
  crystal_bow: { name: '水晶弓', icon: '🏹', price: 95, kind: 'weapon', desc: '伤害 9：射程超远的水晶箭' },
  refraction_spear: { name: '折射矛', icon: '🔱', price: 90, kind: 'weapon', desc: '伤害 9：射程×1.4，光都会拐弯' },
  crystal_hammer: { name: '晶簇锤', icon: '🔨', price: 110, kind: 'weapon', desc: '伤害 12：一锤把怪锤飞' },
  diamond_edge: { name: '金刚剑', icon: '💎', price: 120, kind: 'weapon', desc: '伤害 13：世界上最硬的剑' },
  laser_pen: { name: '激光笔', icon: '🔦', price: 115, kind: 'weapon', desc: '远程重炮：1.5 秒一发激光，单发伤害 20，别照眼睛！' },
  rainbow_prism: { name: '彩虹棱镜剑', icon: '🌈', price: 150, kind: 'weapon', desc: '伤害 12：25% 折射电到旁边的怪' },
  crystal_staff: { name: '水晶法杖', icon: '🪄', price: 140, kind: 'weapon', desc: '远程速射：0.5 秒一发水晶焰，点燃 2 秒（单发 6.6）' },
  light_blade: { name: '光刃', icon: '✨', price: 135, kind: 'weapon', desc: '伤害 12：快得只剩一道光' },
  star_shard_hammer: { name: '碎星晶锤', icon: '🔨', price: 160, kind: 'weapon', desc: '伤害 14：星星碎片做的锤头' },
  aurora_sword: { name: '极光剑', icon: '🌌', price: 155, kind: 'weapon', desc: '伤害 13+冰冻 1 秒：北极光做的' },
  crystalized_bow: { name: '晶化弓', icon: '🏹', price: 145, kind: 'weapon', desc: '伤害 11+电伤：箭上带着晶电' },
  mirror_boomerang: { name: '折光回旋镖', icon: '🪃', price: 150, kind: 'weapon', desc: '伤害 10：360° 转圈，光做的镖' },
  holy_crystal_lance: { name: '圣晶枪', icon: '🔱', price: 170, kind: 'weapon', desc: '伤害 14：射程×1.4，圣光加持' },
  amethyst_sword: { name: '紫晶剑', icon: '🟣', price: 165, kind: 'weapon', desc: '伤害 13+中毒：紫晶淬毒' },
  prism_greatsword: { name: '棱光巨剑', icon: '⚔️', price: 200, kind: 'weapon', desc: '伤害 16：两个人才抬得动' },
  cavern_lord: { name: '洞窟之主', icon: '👑', price: 300, kind: 'weapon', desc: '伤害 25+点燃+折射：毕业神兵，洞窟之王' },
  glow_pick: { name: '荧光镐', icon: '⛏️', price: 75, kind: 'weapon', desc: '伤害 8.5：挖矿顺手打怪' },
  /* ---- 装备 ---- */
  crystal_helm: { name: '晶石头盔', icon: '🪖', price: 45, kind: 'gear', desc: '最大血量+1', mod: { heart: 1 } },
  crystal_armor: { name: '水晶甲', icon: '🛡️', price: 80, kind: 'gear', desc: '25% 概率受伤减半', mod: { half: 0.25 } },
  refract_charm: { name: '折射护符', icon: '🧿', price: 85, kind: 'gear', desc: '15% 概率完全格挡', mod: { block: 0.15 } },
  prism_ring: { name: '光棱戒指', icon: '💍', price: 100, kind: 'gear', desc: '攻击 10% 概率追加 2 点光伤', mod: { ringDmg: 2 } },
  cluster_belt: { name: '晶簇腰带', icon: '🎽', price: 95, kind: 'gear', desc: '武器击退+50%', mod: { knock: 1.5 } },
  diamond_brooch: { name: '钻石胸针', icon: '💠', price: 120, kind: 'gear', desc: '击杀金币+2', mod: { goldAdd: 2 } },
  crystal_boots: { name: '水晶靴', icon: '👢', price: 90, kind: 'gear', desc: '移动速度+25%', mod: { speed: 1.25 } },
  mirror_cloak: { name: '镜面斗篷', icon: '🥻', price: 100, kind: 'gear', desc: '怪物减速 10%', mod: { slow: 0.1 } },
  crystal_core: { name: '晶核', icon: '🔮', price: 130, kind: 'gear', desc: '最大血量+2', mod: { heart: 2 } },
  light_tear: { name: '光之泪', icon: '💧', price: 140, kind: 'gear', desc: '回血速度×2', mod: { regen: 2 } },
  prism_bracer: { name: '棱镜手环', icon: '🧤', price: 110, kind: 'gear', desc: '武器攻速+18%', mod: { haste: 0.18 } },
  crystal_tattoo: { name: '晶化纹身', icon: '🐉', price: 150, kind: 'gear', desc: '血量≤2 颗时伤害×1.5', mod: { rage: 1.5 } },
  mirror_shield: { name: '反光镜', icon: '🪞', price: 160, kind: 'gear', desc: '25% 概率完全格挡', mod: { block: 0.25 } },
  focus_stone: { name: '聚光石', icon: '🪨', price: 135, kind: 'gear', desc: '伤害+2', mod: { dmgAdd: 2 } },
  crystal_heart: { name: '水晶之心', icon: '💎', price: 170, kind: 'gear', desc: '最大血量+3', mod: { heart: 3 } },
  undying_core: { name: '不灭晶核', icon: '🕯️', price: 220, kind: 'gear', desc: '每局一次：致命一击留 1 颗心', mod: { angel: 1 } },
  light_wings: { name: '光翼', icon: '🪽', price: 190, kind: 'gear', desc: '移速+10%、伤害+1', mod: { speed: 1.1, dmgAdd: 1 } },
  cave_map: { name: '晶洞地图', icon: '🗺️', price: 100, kind: 'gear', desc: '受伤后提前 1 秒开始回血', mod: { map: 1 } },
  rainbow_stone: { name: '彩虹石', icon: '🌈', price: 150, kind: 'gear', desc: '击杀金币×1.5', mod: { goldMul: 1.5 } },
  crystal_crown: { name: '水晶皇冠', icon: '👑', price: 320, kind: 'gear', desc: '伤害+1、最大血+2、移速+10%：洞窟毕业神装', mod: { heart: 2, dmgAdd: 1, speed: 1.1 } },
};
SKBOOKS[7] = [
  ['sk7_spikeball', '晶刺球', '💠', 520, '技能：喷出晶刺球 12 伤+点燃（冷却 4 秒）'],
  ['sk7_prismzap', '棱镜雷', '🌈', 540, '技能：彩虹雷劈最近的怪 14 伤（冷却 5 秒）'],
  ['sk7_crystalfrost', '晶冻术', '❄️', 530, '技能：冻住周围怪物 2.5 秒（冷却 8 秒）'],
  ['sk7_gemspin', '晶刃风暴', '🌪️', 560, '技能：360° 晶刃风暴 11 伤（冷却 6 秒）'],
  ['sk7_lightcloud', '光雾术', '🌫️', 580, '技能：放光雾 4 秒持续掉血（冷却 9 秒）'],
  ['sk7_gemmeteor', '晶陨术', '☄️', 640, '技能：砸晶陨 18 伤（冷却 10 秒）'],
  ['sk7_prismrain', '棱光剑雨', '🗡️', 620, '技能：7 把光剑各 6 伤（冷却 9 秒）'],
  ['sk7_pull', '引力晶', '🧲', 600, '技能：把怪吸过来 8 伤（冷却 8 秒）'],
  ['sk7_chain', '折光链', '⚡', 610, '技能：光链劈 3 只各 9 伤（冷却 7 秒）'],
  ['sk7_annihilate', '水晶湮灭', '💎', 900, '技能：毕业大招！一圈 34 伤（冷却 30 秒）'],
];
/* 🐾 宠物（七关各 10 只，出战帮你咬怪；宠物继承，过关不收回！最多 3 只出战） */
const PETS = {
  1: [ /* [key,名字,图标,价格,伤害,攻速秒,射程,特性] */
    ['pet1_chick', '小鸡', '🐤', 30, 1, 1.0, 26, null], ['pet1_dog', '小狗', '🐶', 45, 1.5, 0.9, 28, null],
    ['pet1_hedgehog', '刺猬', '🦔', 60, 1, 0.8, 26, 'knock'], ['pet1_frog', '青蛙', '🐸', 55, 1, 0.7, 40, null],
    ['pet1_cat', '猫咪', '🐱', 70, 2, 1.1, 28, null], ['pet1_rabbit', '兔子', '🐰', 65, 1, 0.6, 26, null],
    ['pet1_squirrel', '松鼠', '🐿️', 60, 1.5, 0.9, 28, 'crit'], ['pet1_bee', '蜜蜂', '🐝', 75, 1, 0.8, 30, 'dot'],
    ['pet1_turtle', '乌龟', '🐢', 50, 2.5, 1.4, 26, null], ['pet1_wolf', '草原狼', '🐺', 120, 3, 0.8, 30, null] ],
  2: [
    ['pet2_snowrabbit', '雪兔', '🐇', 90, 2, 0.7, 28, null], ['pet2_penguin', '企鹅', '🐧', 100, 2.5, 1.0, 28, null],
    ['pet2_snowfox', '雪狐', '🦊', 110, 2.5, 0.8, 30, null], ['pet2_owl', '猫头鹰', '🦉', 105, 2, 0.7, 36, null],
    ['pet2_bear', '北极熊', '🐻‍❄️', 150, 3.5, 1.2, 30, null], ['pet2_seal', '海豹', '🦭', 95, 2, 0.9, 30, 'knock'],
    ['pet2_deer', '驯鹿', '🦌', 115, 2.5, 0.9, 30, null], ['pet2_icewolf', '冰狼', '🐺', 130, 3, 0.8, 30, null],
    ['pet2_leopard', '雪豹', '🐆', 140, 3, 0.7, 30, null], ['pet2_icedragon', '冰霜巨龙', '🐉', 200, 4.5, 0.8, 34, null] ],
  3: [
    ['pet3_bat', '蝙蝠', '🦇', 140, 3, 0.7, 30, null], ['pet3_blackcat', '黑猫', '🐈‍⬛', 150, 3.5, 0.9, 30, null],
    ['pet3_crow', '乌鸦', '🐦‍⬛', 145, 3, 0.7, 34, null], ['pet3_scorpion', '蝎子', '🦂', 160, 3, 0.9, 28, 'dot'],
    ['pet3_spider', '蜘蛛', '🕷️', 155, 3, 0.8, 30, 'slow'], ['pet3_ghostlet', '小幽灵', '👻', 170, 4, 1.0, 32, null],
    ['pet3_snake', '小蛇', '🐍', 165, 3.5, 0.8, 30, 'dot'], ['pet3_hound', '冥犬', '🐕', 175, 4, 0.9, 32, null],
    ['pet3_skullbird', '骷髅鸟', '🦅', 180, 4, 0.8, 36, null], ['pet3_wraithwolf', '幽魂狼', '🐺', 280, 6, 0.8, 34, null] ],
  4: [
    ['pet4_salamander', '火蜥蜴', '🦎', 190, 4, 0.8, 30, 'dot'], ['pet4_firefox', '火狐', '🦊', 200, 4.5, 0.8, 32, null],
    ['pet4_lavaturtle', '岩浆龟', '🐢', 210, 5.5, 1.3, 30, null], ['pet4_firehawk', '火鹰', '🦅', 195, 4, 0.7, 36, null],
    ['pet4_flamehorse', '烈焰马', '🐴', 215, 4.5, 0.8, 32, null], ['pet4_lavadog', '熔岩犬', '🐕', 205, 4.5, 0.9, 30, null],
    ['pet4_firebee', '火蜂', '🐝', 200, 4, 0.7, 32, 'dot'], ['pet4_flamecat', '炎猫', '🐱', 210, 4.5, 0.8, 30, null],
    ['pet4_phoenix', '凤凰', '🐦‍🔥', 260, 5, 0.7, 36, 'dot'], ['pet4_firedragon', '火龙', '🐉', 360, 7.5, 0.8, 36, null] ],
  5: [
    ['pet5_thunderbird', '雷鸟', '🦅', 240, 5, 0.7, 36, null], ['pet5_eel', '电鳗', '🐍', 245, 5, 0.8, 30, 'slow'],
    ['pet5_voltfox', '电光狐', '🦊', 250, 5.5, 0.8, 32, null], ['pet5_stormcat', '雷云猫', '🐱', 255, 5.5, 0.8, 30, null],
    ['pet5_thunderbear', '雷震熊', '🐻', 280, 7, 1.2, 32, null], ['pet5_sparkrabbit', '闪电兔', '🐰', 245, 5, 0.6, 30, null],
    ['pet5_voltbee', '电蜂', '🐝', 250, 5, 0.7, 32, 'dot'], ['pet5_stormeagle', '风暴鹰', '🦅', 260, 5.5, 0.7, 38, null],
    ['pet5_minithor', '小雷神', '⚡', 300, 6, 0.8, 34, 'knock'], ['pet5_thunderdragon', '雷龙', '🐲', 440, 9, 0.8, 38, null] ],
  6: [
    ['pet6_voidcat', '虚空猫', '🐈‍⬛', 300, 6, 0.8, 32, null], ['pet6_shadowbat', '影蝠', '🦇', 305, 6, 0.7, 34, null],
    ['pet6_voidwolf', '虚空狼', '🐺', 320, 6.5, 0.8, 32, null], ['pet6_starabbit', '星尘兔', '🐇', 310, 6, 0.6, 30, null],
    ['pet6_darkcrow', '暗鸦', '🐦‍⬛', 315, 6, 0.7, 36, null], ['pet6_voidbear', '虚空熊', '🐻', 340, 8, 1.2, 32, null],
    ['pet6_shadowsnake', '影蛇', '🐍', 325, 6.5, 0.8, 30, 'dot'], ['pet6_voidowl', '星瞳猫头鹰', '🦉', 330, 6, 0.7, 40, null],
    ['pet6_voiddragon', '虚空龙', '🐉', 380, 7.5, 0.8, 36, null], ['pet6_endshadow', '终焉之影', '🌑', 520, 11, 0.8, 38, null] ],
  7: [
    ['pet7_crystalbee', '水晶蜂', '🐝', 380, 7, 0.7, 34, 'dot'], ['pet7_gemturtle', '晶石龟', '🐢', 390, 9, 1.3, 30, null],
    ['pet7_prismbird', '光棱鸟', '🐦', 400, 7, 0.7, 40, null], ['pet7_crystalfox', '水晶狐', '🦊', 410, 7.5, 0.8, 34, null],
    ['pet7_diamonddog', '钻石犬', '🐕', 405, 7.5, 0.8, 32, null], ['pet7_gembat', '晶翼蝙蝠', '🦇', 395, 7, 0.7, 36, null],
    ['pet7_leopard', '水晶豹', '🐆', 420, 8, 0.7, 34, null], ['pet7_lightdeer', '光之鹿', '🦌', 415, 7.5, 0.8, 34, 'knock'],
    ['pet7_crystaldragon', '水晶龙', '🐉', 480, 9, 0.8, 38, null], ['pet7_prismphoenix', '棱镜凤凰', '🐦‍🔥', 650, 13, 0.8, 40, 'dot'] ],
};
/* ✨ 技能书+🐾 宠物并入七关商店 */
{
  const TBLS = { 1: SHOP, 2: SHOP2, 3: SHOP3, 4: SHOP4, 5: SHOP5, 6: SHOP6, 7: SHOP7 };
  const SPEC_TXT = { knock: '，把怪打飞', slow: '，让怪减速', dot: '，让怪中毒', crit: '，会暴击' };
  for (const lv of [1, 2, 3, 4, 5, 6, 7]) for (const [k, n, i, p, d] of SKBOOKS[lv]) TBLS[lv][k] = { name: n, icon: i, price: p, kind: 'skill', desc: d };
  for (const lv of [1, 2, 3, 4, 5, 6, 7]) for (const [k, n, i, p, dmg, cd, range, spec] of PETS[lv]) TBLS[lv][k] = { name: n, icon: i, price: p, kind: 'pet', desc: `宠物：帮你咬怪 ${dmg} 伤/${cd} 秒${SPEC_TXT[spec] || ''}（继承，过关不收回）`, pet: { dmg, cd, range, spec } };
}
/* ⛈️ 雷云精（第五关）：白云快飞，绕玩家 190 距离盘旋，直线射电光弹（比骷髅箭快） */
const STORM = { hp: 7, r: 12, speed: 115, keepMin: 150, keepMax: 230, fireCd: 2, range: 460 };
function makeStorm(x, y, rnd) {
  const r = rnd || Math.random;
  return { x, y, hp: STORM.hp, r: STORM.r, storm: true, dead: false, flash: 0, walkT: r() * 9, fireT: 0.8 + r() * 1.2,
    keepMin: 140 + r() * 50, keepMax: 190 + r() * 80, orbitD: r() < 0.5 ? 1 : -1 };
}
function stormTick(s, p, dt, speedMul, rnd) {
  const ev = { bolt: null };
  s.flash = Math.max(0, s.flash - dt); s.walkT += dt;
  const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
  const sp = STORM.speed * (speedMul || 1);
  const kMin = s.keepMin || STORM.keepMin, kMax = s.keepMax || STORM.keepMax;
  if (d > kMax) { s.x += dx / d * sp * dt; s.y += dy / d * sp * dt; }
  else if (d < kMin) { s.x -= dx / d * sp * 0.9 * dt; s.y -= dy / d * sp * 0.9 * dt; }
  else { s.x += -dy / d * sp * 0.5 * s.orbitD * dt; s.y += dx / d * sp * 0.5 * s.orbitD * dt; }   // 盘旋
  s.x = Math.max(20, Math.min(WORLD.w - 20, s.x)); s.y = Math.max(20, Math.min(WORLD.h - 20, s.y));
  s.fireT -= dt;
  if (s.fireT <= 0 && d < STORM.range) {
    s.fireT = STORM.fireCd + (rnd || Math.random)() * 0.6;
    ev.bolt = { x: s.x, y: s.y - 6, dx: dx / d, dy: dy / d };   // 电光弹直线飞（射出瞬间锁定）
  }
  return ev;
}
/* 🕳️ 虚空行者（第六关）：暗紫细高个，慢走+每 3 秒瞬移到玩家身边挥爪 */
const VOIDW = { hp: 9, r: 13, speed: 70, blinkCd: 3 };
function makeVoid(x, y, rnd) {
  const r = rnd || Math.random;
  return { x, y, hp: VOIDW.hp, r: VOIDW.r, voidw: true, dead: false, flash: 0, walkT: r() * 9, blinkT: 1.5 + r() * 1.5 };
}
function voidTick(v, p, dt, speedMul, rnd) {
  const ev = { blink: false };
  v.flash = Math.max(0, v.flash - dt); v.walkT += dt;
  v.blinkT -= dt;
  if (v.blinkT <= 0) {   // 瞬移到玩家附近（60~110px 随机角）
    v.blinkT = VOIDW.blinkCd + (rnd || Math.random)() * 0.5;
    const a = (rnd || Math.random)() * 6.28, dd = 60 + (rnd || Math.random)() * 50;
    v.x = Math.max(20, Math.min(WORLD.w - 20, p.x + Math.cos(a) * dd));
    v.y = Math.max(20, Math.min(WORLD.h - 20, p.y + Math.sin(a) * dd));
    ev.blink = true;
    return ev;
  }
  const dx = p.x - v.x, dy = p.y - v.y, d = Math.hypot(dx, dy) || 1;
  const sp = VOIDW.speed * (speedMul || 1);
  v.x += dx / d * sp * dt; v.y += dy / d * sp * dt;
  v.x = Math.max(20, Math.min(WORLD.w - 20, v.x)); v.y = Math.max(20, Math.min(WORLD.h - 20, v.y));
  return ev;
}
/* 💠 激光怪（第七关·水晶洞窟）：晶亮小飞虫，远远地射飞快的激光 */
const CRYSTAL = { hp: 12, r: 13, speed: 95, keepMin: 200, keepMax: 300, fireCd: 2.4, range: 560 };
function makeCrystal(x, y, rnd) {
  const r = rnd || Math.random;
  return { x, y, hp: CRYSTAL.hp, r: CRYSTAL.r, crystal: true, dead: false, flash: 0, walkT: r() * 9, fireT: 1 + r() * 1.4,
    keepMin: 190 + r() * 50, keepMax: 260 + r() * 80, orbitD: r() < 0.5 ? 1 : -1 };
}
function crystalTick(c, p, dt, speedMul, rnd) {
  const ev = { bolt: null };
  c.flash = Math.max(0, c.flash - dt); c.walkT += dt;
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
  const sp = CRYSTAL.speed * (speedMul || 1);
  const kMin = c.keepMin || CRYSTAL.keepMin, kMax = c.keepMax || CRYSTAL.keepMax;
  if (d > kMax) { c.x += dx / d * sp * dt; c.y += dy / d * sp * dt; }
  else if (d < kMin) { c.x -= dx / d * sp * 0.9 * dt; c.y -= dy / d * sp * 0.9 * dt; }
  else { c.x += -dy / d * sp * 0.6 * c.orbitD * dt; c.y += dx / d * sp * 0.6 * c.orbitD * dt; }   // 盘旋
  c.x = Math.max(20, Math.min(WORLD.w - 20, c.x)); c.y = Math.max(20, Math.min(WORLD.h - 20, c.y));
  c.fireT -= dt;
  if (c.fireT <= 0 && d < CRYSTAL.range) {
    c.fireT = CRYSTAL.fireCd + (rnd || Math.random)() * 0.6;
    ev.bolt = { x: c.x, y: c.y - 6, dx: dx / d, dy: dy / d, laser: true };   // 💠 激光弹：飞得超快
  }
  return ev;
}
if (typeof module !== 'undefined') module.exports = { WORLD, PLAYER, ZOMBIE, SPAWN, ATTACK, HURT, REGEN, SHOP, SHOP2, SHOP3, SHOP4, SHOP5, SHOP6, SHOP7, SKBOOKS, PETS, BOSS, SKELETON, GHOST, LAVA, STORM, VOIDW, CRYSTAL, makePlayer, pickSpawn, spawnZombie, zombieStep, attackHit, lootGold, lootBounty, buyItem, regenTick, playerStep, touchHurt, difficulty, makeBoss, bossTick, makeSkeleton, skeletonTick, makeGhost, ghostTick, makeLava, lavaTick, makeStorm, stormTick, makeVoid, voidTick, makeCrystal, crystalTick };
