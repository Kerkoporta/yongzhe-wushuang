'use strict';
/* ================= ✨ 技能书系统（贵但高伤，带冷却，特效拉满） ================= */
/* 类型: ball=飞行球 zap=劈最近 freeze=范围冻结 spin=360°爆发 cloud=毒雾 pull=引力 chain=连环电（陨石/剑雨太卡已删除） */
const SKILL_FX = {
  sk1_fireball: ['ball', 6, 4, '#ff9a3d', { burn: 1 }], sk1_zap: ['zap', 8, 5, '#ffe84a'], sk1_frost: ['freeze', 0, 8, '#a8e8ff', { r: 150, dur: 2 }], sk1_spin: ['spin', 5, 6, '#e8f4ff', { r: 95 }], sk1_cloud: ['cloud', 1, 9, '#7ee85a', { dur: 4, r: 70 }], sk1_meteor: ['zap', 10, 10, '#ffe84a'], sk1_rain: ['chain', 5, 9, '#7ee85a'], sk1_pull: ['pull', 3, 8, '#b48af2', { r: 220 }], sk1_chain: ['chain', 4, 7, '#ffe84a'], sk1_holy: ['spin', 12, 15, '#fff2b0', { r: 130 }],
  sk2_iceball: ['ball', 8, 4, '#a8f2ff', { freeze: 1 }], sk2_icezap: ['zap', 10, 5, '#a8e8ff'], sk2_blizzard: ['freeze', 0, 8, '#c8f4ff', { r: 180, dur: 2.5 }], sk2_icespin: ['spin', 7, 6, '#c8f4ff', { r: 95 }], sk2_coldcloud: ['cloud', 1, 9, '#a8e8ff', { dur: 4.5, r: 70 }], sk2_icemeteor: ['zap', 14, 10, '#a8e8ff'], sk2_icerain: ['chain', 6, 9, '#c8f4ff'], sk2_frostpull: ['pull', 4, 8, '#a8e8ff', { r: 220 }], sk2_icechain: ['chain', 5, 7, '#a8e8ff'], sk2_winter: ['spin', 16, 15, '#8fd8ff', { r: 130 }],
  sk3_soulball: ['ball', 10, 4, '#8ff2ea', { burn: 1 }], sk3_hellzap: ['zap', 12, 5, '#8ff2ea'], sk3_soulfreeze: ['freeze', 0, 8, '#8ff2ea', { r: 180, dur: 2.5 }], sk3_wraithspin: ['spin', 9, 6, '#8ff2ea', { r: 95 }], sk3_hellcloud: ['cloud', 1, 9, '#4ac8c0', { dur: 5, r: 75 }], sk3_ghostmeteor: ['zap', 18, 10, '#8ff2ea'], sk3_soulrain: ['chain', 7, 9, '#8ff2ea'], sk3_soulpull: ['pull', 5, 8, '#8ff2ea', { r: 220 }], sk3_hellchain: ['chain', 6, 7, '#8ff2ea'], sk3_banshee: ['spin', 20, 15, '#8ff2ea', { r: 130 }],
  sk4_fireball: ['ball', 12, 4, '#ff7a2a', { burn: 1 }], sk4_skyfire: ['zap', 14, 5, '#ffb03d'], sk4_lavaroot: ['freeze', 0, 8, '#ff9a3d', { r: 180, dur: 2.5 }], sk4_firedragon: ['spin', 11, 6, '#ff7a2a', { r: 95 }], sk4_sulfurcloud: ['cloud', 1, 9, '#d8d84a', { dur: 5, r: 75 }], sk4_volcmeteor: ['zap', 22, 10, '#ff7a2a'], sk4_firerain: ['chain', 8, 9, '#ff9a3d'], sk4_magmapull: ['pull', 6, 8, '#ff7a2a', { r: 220 }], sk4_firechain: ['chain', 7, 7, '#ffb03d'], sk4_inferno: ['spin', 24, 15, '#ff6a2a', { r: 130 }],
  sk5_voltball: ['ball', 14, 4, '#ffe84a', { zapx: 1 }], sk5_truezap: ['zap', 16, 5, '#ffe84a'], sk5_stormfreeze: ['freeze', 0, 8, '#ffe84a', { r: 190, dur: 3 }], sk5_voltspin: ['spin', 13, 6, '#ffe84a', { r: 95 }], sk5_eleccloud: ['cloud', 1, 9, '#fff29a', { dur: 5.5, r: 80 }], sk5_skymeteor: ['zap', 26, 10, '#ffe84a'], sk5_voltrain: ['chain', 9, 9, '#ffe84a'], sk5_magpull: ['pull', 7, 8, '#ffe84a', { r: 230 }], sk5_megachain: ['chain', 8, 7, '#ffe84a'], sk5_thundergod: ['spin', 28, 15, '#fff29a', { r: 135 }],
  sk6_voidball: ['ball', 16, 4, '#b48af2', { zapx: 1 }], sk6_oblivionzap: ['zap', 18, 5, '#b48af2'], sk6_voidfreeze: ['freeze', 0, 8, '#b48af2', { r: 190, dur: 3 }], sk6_voidspin: ['spin', 15, 6, '#b48af2', { r: 95 }], sk6_darkcloud: ['cloud', 1, 9, '#8a5ac8', { dur: 6, r: 80 }], sk6_voidmeteor: ['zap', 30, 10, '#b48af2'], sk6_oblivionrain: ['chain', 10, 9, '#b48af2'], sk6_singularpull: ['pull', 8, 8, '#b48af2', { r: 230 }], sk6_voidchain: ['chain', 9, 7, '#b48af2'], sk6_bigbang: ['spin', 32, 15, '#d0b0ff', { r: 140 }],
  sk7_spikeball: ['ball', 12, 4, '#a8f2ff', { burn: 1 }], sk7_prismzap: ['zap', 14, 5, '#d0b0ff'], sk7_crystalfrost: ['freeze', 0, 8, '#c8f4ff', { r: 180, dur: 2.5 }], sk7_gemspin: ['spin', 11, 6, '#a8f2ff', { r: 95 }], sk7_lightcloud: ['cloud', 1, 9, '#d0f2ff', { dur: 5, r: 75 }], sk7_gemmeteor: ['zap', 18, 10, '#a8f2ff'], sk7_prismrain: ['chain', 8, 9, '#d0b0ff'], sk7_pull: ['pull', 8, 8, '#b48af2', { r: 220 }], sk7_chain: ['chain', 9, 7, '#d0b0ff'], sk7_annihilate: ['spin', 34, 30, '#eaf8ff', { r: 140 }],
  /* 💀 凋零 7 技 */
  sk8_wskull: ['ball', 16, 5, '#4a6aff'], sk8_darkzap: ['zap', 14, 5, '#3a3440'], sk8_bonefreeze: ['freeze', 0, 9, '#e8e8f0', { r: 150, dur: 2 }], sk8_soulcloud: ['cloud', 2, 8, '#4a6aff', { dur: 4, r: 70 }], sk8_wspin: ['spin', 20, 13, '#5a4a82', { r: 110 }], sk8_wchain: ['chain', 9, 7, '#8a5ac8'], sk8_nether: ['spin', 28, 16, '#241a30', { r: 135 }],
  /* 🐉 末影 7 技 */
  sk9_pearl: ['ball', 15, 5, '#8a5ac8'], sk9_breath: ['cloud', 3, 9, '#b48af2', { dur: 5, r: 75 }], sk9_roar: ['spin', 22, 14, '#b48af2', { r: 120 }], sk9_pull: ['pull', 5, 8, '#6a4a92', { r: 220 }], sk9_shulker: ['ball', 20, 7, '#d0b0ff'], sk9_endbeam: ['zap', 24, 8, '#e0ccff'], sk9_chorus: ['chain', 13, 8, '#c8a0ff'],
  /* 🧨 苦力怕 6 技 */
  sk10_tnt: ['ball', 22, 8, '#c8302a'], sk10_blast: ['spin', 18, 12, '#ff8a5a', { r: 100 }], sk10_powder: ['cloud', 2, 8, '#8a8578', { dur: 4.5, r: 70 }], sk10_creep: ['chain', 10, 7, '#7ec850'], sk10_mega: ['spin', 30, 18, '#ff6a2a', { r: 140 }], sk10_fuse: ['zap', 16, 6, '#ffe84a'],
  /* 🔵 法术时代 10 技（全部耗蓝！蓝每秒回 0.4——恩泽定的珍贵手感） */
  sk11_meteor: ['meteors', 8, 12, '#ff8a3a'], sk11_frostfield: ['freeze', 0, 20, '#7ac8ff', { r: 150, dur: 3 }], sk11_blackhole: ['blackhole', 2, 25, '#8a5ac8', { r: 220 }], sk11_thunder: ['chain', 6, 10, '#ffe84a', { n: 8 }], sk11_dragonbreath: ['cloud', 2, 15, '#ff7a2a', { dur: 3, r: 55, fwd: 80 }],
  sk11_bladestorm: ['spin', 15, 12, '#d8e8ff', { r: 110 }], sk11_heal: ['heal', 2, 30, '#7aff8a'], sk11_shield: ['shield', 0, 30, '#7af2ff', { dur: 5 }], sk11_blink: ['blink', 0, 8, '#8fd8ff', { dist: 128 }], sk11_clone: ['clone', 0, 40, '#b8b8ff', { dur: 8 }],
};
const MANA_COST = {   // 🔵 新法术耗蓝表（老技能按伤害自动估 5~25）
  sk11_meteor: 30, sk11_frostfield: 25, sk11_blackhole: 35, sk11_thunder: 20, sk11_dragonbreath: 30,
  sk11_bladestorm: 25, sk11_heal: 40, sk11_shield: 30, sk11_blink: 15, sk11_clone: 45,
};
function updateMana() { const el = document.getElementById('mana'); if (el) el.textContent = '🔵 ' + Math.floor(player.mana != null ? player.mana : 100); }
function zMaxHp(z) { return z.boss ? BOSS.hp : z.voidw ? VOIDW.hp : z.storm ? STORM.hp : z.lava ? LAVA.hp : z.ghost ? GHOST.hp : z.skel ? SKELETON.hp : z.crystal ? CRYSTAL.hp : ZOMBIE.hp; }
function dotDmg(z) { return z.boss ? 1 : Math.max(1, Math.ceil(zMaxHp(z) * 0.1)); }   // 🩸 持续伤害：每 0.1 秒掉十分之一血（BOSS 固定 1）
function nearestZ(rng) {   // 最近的活怪
  let bz = null, bd = rng || 1e9;
  for (const z of zombies) { if (z.dead) continue; const d = Math.hypot(z.x - player.x, z.y - player.y); if (d < bd) { bd = d; bz = z; } }
  return bz;
}
function hurtZ(z, dmg, color) {   // 技能直伤结算（吃击杀计数）
  if (z.dead) return;
  z.hp -= dmg; z.flash = 0.12; burst(z.x, z.y, color, 7);
  if (z.hp <= 0) killZombie(z);
}
/* ⚡ 闪电溅射：主目标周围极小范围内的密怪一起挨劈（群攻里最小的圈） */
function splashZap(cx, cy, r, dmg, color, exclude) {
  for (const z of zombies.slice()) if (!z.dead && z !== exclude && Math.hypot(z.x - cx, z.y - cy) < r) {
    fxLines.push({ bolt: true, x1: cx, y1: cy, x2: z.x, y2: z.y, t: 0.24, color, w: 4 });
    z.zapT = 0.2; hurtZ(z, Math.max(1, Math.round(dmg / 2)), color);
  }
}
function castSkill(key) {
  const sf = SKILL_FX[key]; if (!sf || gameOver || paused) return;
  player.skillCds = player.skillCds || {};
  if (player.skillCds[key] > 0) return;
  const mc = MANA_COST[key] != null ? MANA_COST[key] : Math.max(5, Math.min(25, Math.round(sf[1] / 2)));   // 🔵 法术耗蓝：新法术表里有准数，老技能按伤害估 5~25
  const curMana = player.mana != null ? player.mana : 100;
  if (curMana < mc) { setBanner('🔵 蓝不够！还差 ' + Math.ceil(mc - curMana) + ' 点（蓝每秒回 0.4，慢慢攒）'); beep(160, 90, 0.15, 'square', 0.1); return; }
  player.mana = curMana - mc; updateMana();
  player.skillCds[key] = sf[2] * cdMul();   // ⏳🐻 时空术士冷却-40%/德鲁伊+20%
  const [type, dmg, , color, ex] = sf, o = ex || {};
  beep(880, 440, 0.15, 'square', 0.14);
  fxLines.push({ ring: true, x: player.x, y: player.y, r: 60, t: 0.25, color });   // ✨ 施法闪光阵
  burst(player.x, player.y, '#ffffff', 10);
  if (type === 'ball') {
    const t = nearestZ(600), a = t ? Math.atan2(t.y - player.y, t.x - player.x) : (player.faceA || 0);
    skillShots.push({ x: player.x, y: player.y - 8, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, t: 1.6, dmg, color, burn: o.burn, freeze: o.freeze, zapx: o.zapx });
    burst(player.x, player.y, color, 8);
  } else if (type === 'zap') {
    const t = nearestZ(360);
    if (t) {
      fxLines.push({ bolt: true, x1: t.x, y1: t.y - 240, x2: t.x, y2: t.y, t: 0.32, color, w: 10 });
      t.zapT = 0.3; hurtZ(t, dmg, color);
      splashZap(t.x, t.y, 36, dmg, color, t);   // ⚡ 极小范围群攻
      beep(1200, 200, 0.2, 'sawtooth', 0.16);
    }
    else player.skillCds[key] = 1;
  } else if (type === 'freeze') {
    for (const z of zombies) if (!z.dead && Math.hypot(z.x - player.x, z.y - player.y) < o.r) z.freezeT = o.dur;
    fxLines.push({ ring: true, x: player.x, y: player.y, r: o.r, t: 0.35, color });
    burst(player.x, player.y, color, 18); beep(1400, 900, 0.3, 'sine', 0.14);
  } else if (type === 'spin') {
    for (const z of zombies.slice()) if (!z.dead && Math.hypot(z.x - player.x, z.y - player.y) < o.r) {
      const a = Math.atan2(z.y - player.y, z.x - player.x);
      z.kb = { dx: Math.cos(a) * 14, dy: Math.sin(a) * 14, t: 0.12 };
      hurtZ(z, dmg, color);
    }
    fxLines.push({ ring: true, x: player.x, y: player.y, r: o.r, t: 0.45, color });
    fxLines.push({ ring: true, x: player.x, y: player.y, r: o.r * 0.6, t: 0.35, color: '#ffffff' });
    shakeT = Math.max(shakeT, 0.3); beep(220, 60, 0.3, 'sawtooth', 0.2);
  } else if (type === 'cloud') {
    const c = { x: player.x + Math.cos(player.dir) * (o.fwd || 0), y: player.y + Math.sin(player.dir) * (o.fwd || 0), t: o.dur, r: o.r, color, acc: 0, blobs: [] };   // 🐉 龙息=喷到面前一段距离
    for (let i = 0; i < 9; i++) c.blobs.push({ a: Math.random() * 6.28, d: Math.random() * o.r * 0.72, r: 20 + Math.random() * 18, spin: (Math.random() - 0.5) * 1.1, bob: Math.random() * 6.28 });
    clouds.push(c);
    burst(player.x, player.y, color, 10);
  } else if (type === 'pull') {
    for (const z of zombies) if (!z.dead && Math.hypot(z.x - player.x, z.y - player.y) < o.r) {
      const a = Math.atan2(player.y - z.y, player.x - z.x);
      z.x += Math.cos(a) * 70; z.y += Math.sin(a) * 70;
      hurtZ(z, dmg, color);
    }
    fxLines.push({ ring: true, x: player.x, y: player.y, r: o.r, t: 0.3, color });
    beep(300, 700, 0.25, 'sine', 0.14);
  } else if (type === 'chain') {
    let from = player, hit = 0;
    const pool = zombies.filter(z => !z.dead).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)).slice(0, o.n || 3);   // ⚡ 连环目标数可配（雷霆万钧劈 8 只）
    for (const t of pool) {
      if (Math.hypot(t.x - from.x, t.y - from.y) > 340) continue;
      fxLines.push({ bolt: true, x1: from.x, y1: from.y, x2: t.x, y2: t.y, t: 0.3, color, w: 7 });
      t.zapT = 0.25; hurtZ(t, dmg, color);
      splashZap(t.x, t.y, 30, dmg, color, t);   // ⚡ 每环也带极小溅射
      from = t; hit++;
    }
    if (!hit) player.skillCds[key] = 1;
    beep(1300, 500, 0.15, 'square', 0.14);
  } else if (type === 'meteors') {   // ☄️ 流星火雨：最近怪所在区域连砸 5 颗（友方陨石，不砸自己）
    const t = nearestZ(600), cx = t ? t.x : player.x + Math.cos(player.dir) * 100, cy = t ? t.y : player.y + Math.sin(player.dir) * 100;
    for (let i = 0; i < 5; i++) meteors.push({ x: cx + (Math.random() - 0.5) * 120, y: cy + (Math.random() - 0.5) * 120, t: 0.5 + i * 0.22, landed: false, dmg, r: 55, color, friendly: true });
    setBanner('☄️ 流星火雨！'); beep(400, 100, 0.4, 'sawtooth', 0.18);
  } else if (type === 'blackhole') {   // 🌀 黑洞：前方一点把怪全吸过去挤成一团+定住 1 秒
    const bx = player.x + Math.cos(player.dir) * 110, by = player.y + Math.sin(player.dir) * 110;
    for (const z of zombies) if (!z.dead && Math.hypot(z.x - bx, z.y - by) < o.r) {
      const a = Math.atan2(by - z.y, bx - z.x), dd = Math.hypot(bx - z.x, by - z.y) || 1, pull2 = Math.min(dd, 130);
      z.x += Math.cos(a) * pull2; z.y += Math.sin(a) * pull2; z.freezeT = Math.max(z.freezeT || 0, 1);
      hurtZ(z, dmg, color);
    }
    fxLines.push({ ring: true, x: bx, y: by, r: o.r, t: 0.4, color });
    fxLines.push({ ring: true, x: bx, y: by, r: 40, t: 0.5, color: '#0a0612' });
    beep(200, 600, 0.35, 'sine', 0.16);
  } else if (type === 'heal') {   // 💚 治疗术：立刻回血（dmg 字段当回血量）
    player.hearts = Math.min(player.maxHearts, player.hearts + dmg);
    burst(player.x, player.y - 10, color, 14); beep(600, 1200, 0.3, 'sine', 0.16);
  } else if (type === 'shield') {   // 🛡️ 魔法护盾：受伤减半几秒
    player.shieldT = o.dur || 5; burst(player.x, player.y, color, 12); beep(500, 900, 0.25, 'sine', 0.15);
  } else if (type === 'blink') {   // 💨 闪现：朝面朝方向瞬移
    burst(player.x, player.y, color, 10);
    player.x = Math.max(20, Math.min(WORLD.w - 20, player.x + Math.cos(player.dir) * (o.dist || 128)));
    player.y = Math.max(20, Math.min(WORLD.h - 20, player.y + Math.sin(player.dir) * (o.dist || 128)));
    player.inv = Math.max(player.inv, 0.3);
    burst(player.x, player.y, color, 14); beep(900, 1500, 0.16, 'sine', 0.14);
  } else if (type === 'clone') {   // 👥 分身术：影子分身拿你一半武器攻击力帮你打
    const wd = ((WEAPON_FX[player.weapon] || {}).dmg || 1) * 0.5;
    minions.push({ x: player.x + 20, y: player.y + 10, t: o.dur || 8, cd: 0, clone: true, dmg: Math.max(1, wd) });
    burst(player.x, player.y, color, 14); beep(700, 1100, 0.2, 'sine', 0.14);
  }
}
const skillsEl = document.getElementById('skills');
let skillRefs = [];
const ALLITEMS = {}; for (const t of [SHOP, SHOP2, SHOP3, SHOP4, SHOP5, SHOP6, SHOP7, SHOP8, SHOP9, SHOP10, USE_ITEMS]) for (const k in t) ALLITEMS[k] = t[k];   // 全关卡物品表（继承的技能跨关也能用）
/* 🥷 职业物品（v54）：不进商店货架、不进宝箱抽奖池，只能靠剧情获得 */
const CLASS_ITEMS = {
  awaken_stone: { name: '觉醒石', icon: '🌟', price: 0, kind: 'awaken', desc: '随机觉醒职业（共 15 个）：第一颗主职业、第二颗副职业，左上角 ⇄ 一键切换！' },
  assassin_dagger: { name: '刺客匕首', icon: '🔪', price: 0, kind: 'weapon', desc: '刺客的终结武器：传送落地后的那一刀' },
  wood_sword: { name: '木剑', icon: '🗡️', price: 0, kind: 'weapon', desc: '战士的入门剑，开局人手一把' },
  block_skill: { name: '格挡', icon: '🛡️', price: 0, kind: 'skill', desc: '坦克本命技：0.5 秒举盾免疫一切伤害（站桩），冷却 2 秒。永不下场' },
};
Object.assign(ALLITEMS, CLASS_ITEMS); ALLKIND.awaken_stone = 'awaken'; ALLKIND.assassin_dagger = 'weapon'; ALLKIND.wood_sword = 'weapon'; ALLKIND.block_skill = 'skill';
Object.assign(ALLITEMS, FISH); for (const k in FISH) ALLKIND[k] = 'fish';   // 🎣 四种鱼进全物品表（背包道具栏显示）
WEAPON_FX.assassin_dagger = { dmg: 2, cdMul: 0.8, color: '#b48af2' };
WEAPON_FX.wood_sword = { dmg: 1, cdMul: 1, color: '#c89058' };
function ownedSkills() { return skillSlots.filter(k => player.bought[k] && ALLKIND[k] === 'skill'); }   // ✨ 只有上阵的 5 个技能显示按钮
function renderSkills() {
  const keys = ownedSkills(), s = ALLITEMS;
  skillsEl.innerHTML = ''; skillRefs = [];
  skillsEl.style.display = keys.length ? 'flex' : 'none';
  keys.forEach(k => {
    const b = document.createElement('button');
    b.className = 'skl'; b.innerHTML = `<span class="ic">${s[k].icon}</span><span class="cd"></span>`;
    b.addEventListener('pointerdown', e => { e.preventDefault(); castSkill(k); });
    skillsEl.appendChild(b); skillRefs.push({ k, btn: b, cd: b.querySelector('.cd') });
  });
}
function castSkillByIndex(i) { const k = ownedSkills()[i]; if (k) castSkill(k); }

