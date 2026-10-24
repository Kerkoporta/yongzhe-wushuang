'use strict';
/* ================= 游戏状态 ================= */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const mapCtx = document.getElementById('mapC').getContext('2d');   // 🗺️ 小地图
let VW = 0, VH = 0, DPR = 1, rotated = false;
function resize() { DPR = Math.min(1.5, devicePixelRatio || 1); VW = rotated ? innerHeight : innerWidth; VH = rotated ? innerWidth : innerHeight; cv.width = VW * DPR; cv.height = VH * DPR; cv.style.width = VW + 'px'; cv.style.height = VH + 'px'; ctx.imageSmoothingEnabled = false; }   // 📱 DPR 上限 1.5：Retina 少画一倍像素，手机不卡
addEventListener('resize', resize); resize();
function toggleRotate() {
  rotated = !rotated;
  const rot = document.getElementById('rot');
  rot.classList.toggle('rot90', rotated);
  if (rotated) { rot.style.left = innerWidth + 'px'; rot.style.width = innerHeight + 'px'; rot.style.height = innerWidth + 'px'; }   // 真实像素，iPad 严丝合缝
  else { rot.style.left = ''; rot.style.width = ''; rot.style.height = ''; }
  resize(); saveGame();
}
document.getElementById('gearRot').onclick = () => { toggleGear(false); toggleRotate(); };

let player, zombies, kills, spawnT, summonT, parts, gameOver, deco;
let pets = [], dexCounts = {}, coins = [], portal = null;   // 🐾宠物 / 📖图鉴 / 🪙金币 / 🕳️山洞
let bossAt = 100, banner = { txt: '', t: 0 }, shakeT = 0, slamFx = null, hitstopT = 0;   // 💥 hitstopT=打击顿帧：命中瞬间全世界冻结一瞬
/* 🗺️ 关卡：第一关僵尸草原 → 打败 BOSS 进第二关骷髅雪原 */
const LEVELS = {
  1: { name: '僵尸草原', grassA: '#69b04a', grassB: '#62a844', edge: '#3a6a2a', trunk: '#6a4a2a', leaf: '#3f7a2a', leafHi: '#5aa83c', rock: '#8a8a92', rockHi: '#a8a8b0', enemy: 'zombie', bossName: '👹 僵尸王' },
  2: { name: '骷髅雪原', grassA: '#eceae2', grassB: '#e0ded4', edge: '#b8b4a4', trunk: '#8a7a6a', leaf: '#f2f2ec', leafHi: '#ffffff', rock: '#b8b8c0', rockHi: '#d0d0d8', enemy: 'skeleton', bossName: '💀 骷髅王' },
  3: { name: '鬼魂地狱', grassA: '#3d2a3d', grassB: '#35243a', edge: '#1e1420', trunk: '#2a1a2a', leaf: '#5a3a5a', leafHi: '#7a4a6a', rock: '#4a3a4a', rockHi: '#5e4a5e', enemy: 'ghost', bossName: '👻 鬼王' },
  4: { name: '熔岩火山', grassA: '#2e1c18', grassB: '#281713', edge: '#180c0a', trunk: '#3a2418', leaf: '#c84818', leafHi: '#ff7a2a', rock: '#4a2a20', rockHi: '#6a3a28', enemy: 'lava', bossName: '🌋 熔岩魔王' },
  5: { name: '天空雷域', grassA: '#a8d8f0', grassB: '#9ccfea', edge: '#6aa8c8', trunk: '#8ab8d8', leaf: '#ffffff', leafHi: '#f0f8ff', rock: '#c0d8e8', rockHi: '#dceaf4', enemy: 'storm', bossName: '⛈️ 雷霆法王' },
  6: { name: '虚空之境', grassA: '#1c1226', grassB: '#171020', edge: '#0c0814', trunk: '#241a30', leaf: '#3a2a52', leafHi: '#523a72', rock: '#2e2440', rockHi: '#403358', enemy: 'void', bossName: '🕳️ 虚空主宰' },
  7: { name: '水晶洞窟', grassA: '#1e3a44', grassB: '#1a333c', edge: '#0e2028', trunk: '#2a4a56', leaf: '#4ad8e8', leafHi: '#a8f2ff', rock: '#3a5a66', rockHi: '#56d8e8', enemy: 'crystal', bossName: '💎 水晶魔王' },
  8: { name: '凋零之地', grassA: '#14101c', grassB: '#100c18', edge: '#080610', trunk: '#241a30', leaf: '#3a2a52', leafHi: '#5a4a82', rock: '#1e1828', rockHi: '#342a44', enemy: 'wskeleton', bossName: '💀 凋灵' },
  9: { name: '末影之地', grassA: '#18142a', grassB: '#141022', edge: '#0a0816', trunk: '#2a2444', leaf: '#b8b08a', leafHi: '#d8d0a8', rock: '#3a3454', rockHi: '#5a5478', enemy: 'none', bossName: '🐉 末影龙' },
  10: { name: '苦力怕矿洞', grassA: '#2a3020', grassB: '#242a1c', edge: '#141810', trunk: '#3a3428', leaf: '#5a6a3a', leafHi: '#7a8a4a', rock: '#4a4a44', rockHi: '#6a6a60', enemy: 'creeper', bossName: '🧨 泰坦苦力怕' },
  11: { name: '史莱姆沼泽', grassA: '#1e3026', grassB: '#1a2a22', edge: '#0c1812', trunk: '#2a3a2a', leaf: '#3a6a4a', leafHi: '#5a9a6a', rock: '#2a4438', rockHi: '#4a6a58', enemy: 'slime', bossName: '👻 恶魂' },
  12: { name: '深邃古城', grassA: '#0e1a1e', grassB: '#0c161a', edge: '#060c0e', trunk: '#1a2e34', leaf: '#2a4a44', leafHi: '#3a6a5a', rock: '#16262c', rockHi: '#26424a', enemy: 'bat', bossName: '👿 坚守者' },
};
let level = 1, earrows = [], parrows = [], garrows = [], meteors = [], puddles = [], skillShots = [], clouds = [], fxLines = [], netOrbs = null, shocks = [];   // 各种飞行物与特效
let towerMode = false;   // 🗼 试炼塔（无尽）中：第八关是凋零关主线，无尽搬进了小镇试炼塔
let campaignLv = 1;   // 🧭 主线进度（唯一的真相）：试炼塔用 level=8 显示，主线第几关永远记在这里
function makeWSkel(x, y) { return { id: _id++, x, y, hp: 8, r: 11, ws: true, dead: false, flash: 0, walkT: Math.random() * 9, kind: 'wskeleton' }; }   // 💀 MC 凋零骷髅：黑高个，8 血，近战
function makeCreeper(x, y) { return { id: _id++, x, y, hp: 6, r: 10, creep: true, dead: false, flash: 0, walkT: Math.random() * 9, kind: 'creeper' }; }   // 🧨 MC 苦力怕：6 血，靠近就自爆
function makeSlime(x, y, size) { return { id: _id++, x, y, hp: [2, 4, 8][size], r: [7, 10, 14][size], slime: true, size, dead: false, flash: 0, walkT: Math.random() * 9, kind: 'slime' }; }   // 🟢 MC 史莱姆：大 8 血/中 4/小 2，打死分裂
function makeBat(x, y) { return { id: _id++, x, y, hp: 2, r: 8, bat: true, dead: false, flash: 0, walkT: Math.random() * 9, kind: 'bat' }; }   // 🦇 洞穴蝙蝠：2 血，飞得飞快
function spawnEnemy() {   // 按关卡出怪（试炼塔按波次）
  if (pvpMode) return;   // 📡 PVP 擂台不刷怪，只有对面那个真人
  if (towerMode) { waveSpawn(); return; }
  if (level === 9) return;   // 🐉 末影之地只有末影龙，一只小怪都没有
  const s = pickSpawn(player, Math.random);
  zombies.push(level === 2 ? makeSkeleton(s.x, s.y, Math.random) : level === 3 ? makeGhost(s.x, s.y, Math.random) : level === 4 ? makeLava(s.x, s.y, Math.random) : level === 5 ? makeStorm(s.x, s.y, Math.random) : level === 6 ? makeVoid(s.x, s.y, Math.random) : level === 7 ? makeCrystal(s.x, s.y, Math.random) : level === 8 ? makeWSkel(s.x, s.y) : level === 10 ? makeCreeper(s.x, s.y) : level === 11 ? makeSlime(s.x, s.y, 2) : level === 12 ? makeBat(s.x, s.y) : spawnZombie(player, Math.random));
  zombies[zombies.length - 1].kind = ['', 'zombie', 'skeleton', 'ghost', 'lava', 'storm', 'voidw', 'crystal', 'wskeleton', 'none', 'creeper', 'slime', 'bat'][level];   // 📖 图鉴计数用
  const zz = zombies[zombies.length - 1], aff = rollAffix(Math.random);   // 👑 12% 精英词缀
  zz.maxHp = zz.hp;   // ♻️ 再生词缀回血上限
  if (aff && !zz.boss) { zz.affix = aff; if (aff === 'king') { zz.hp *= 3; zz.maxHp = zz.hp; zz.r = (zz.r || 10) * 1.35; } }   // 暴君：血×3 个头大一号
  if (challengeMode === 'swift') zz.affix = 'swift';   // 📅 每日挑战规则：全员疾电
  if (challengeMode === 'tough') { zz.hp *= 2; zz.maxHp = zz.hp; }   // 📅 全员皮糙肉厚
}
function setBanner(t) { banner = { txt: t, t: 2.6 }; }
/* 👹 BOSS 登场：击杀满 100（之后每 100 一只） */
function spawnBoss() {
  for (const z of zombies) if (!z.boss) z.dead = true;   // 👑 BOSS 登场清场
  summonT = 10;   // 10 秒后开始召唤小怪
  const pos = pickSpawn(player, Math.random);
  const b = makeBoss(pos.x, pos.y);
  if (towerMode) {   // 🗼 试炼塔：BOSS 类型按波次，血/速+2%×遍、攻+1%×遍
    const w = endlessWave, R = endlessRound;
    b.skelBoss = w === 2; b.ghostBoss = w === 3; b.lavaBoss = w === 4; b.stormBoss = w === 5; b.voidBoss = w === 6; b.crystalBoss = w === 7;
    b.hp = b.maxHp = Math.round((BOSS.hp + (w - 1) * 15) * (1 + 0.02 * R));
    b.spdMul = 1 + 0.02 * R; b.atkMul = 1 + 0.01 * R;
    b.kind = 'boss' + w;
    zombies.push(b);
    setBanner('⚠️ 第' + w + '波 BOSS：' + LEVELS[w].bossName + '（第' + R + '遍加成！）');
    beep(90, 45, 0.7, 'sawtooth', 0.25); saveGame();
    return;
  }
  b.skelBoss = level === 2;    // 💀 第二关出骷髅王（巨箭+寒冰）
  b.ghostBoss = level === 3;   // 👻 第三关出鬼王（魂火+夺魂）
  b.lavaBoss = level === 4;    // 🌋 第四关出熔岩魔王（火雨+冲锋）
  b.stormBoss = level === 5;   // ⛈️ 第五关出雷霆法王（落雷+电网）
  b.voidBoss = level === 6;    // 🕳️ 第六关出虚空主宰（裂隙+相位轰炸）
  b.crystalBoss = level === 7; // 💎 第七关出水晶魔王（分身+棱光齐射）
  b.wither = level === 8;      // 💀 第八关出凋灵（蓝色骷髅头+直线冲锋）
  b.ender = level === 9;       // 🐉 第九关出末影龙（龙息+俯冲顶飞）
  b.titan = level === 10;      // 🧨 第十关出泰坦苦力怕（TNT 雨+撕咬扑击）
  b.ghast = level === 11;      // 👻 第十一关出恶魂（火球可打回去）
  b.warden = level === 12;     // 👿 第十二关出坚守者（50 万血！盲眼听声辨位+音波炮）
  b.kind = 'boss' + level;     // 📖 图鉴计数用
  b.hp = b.maxHp = BOSS.hp + (level - 1) * 15;   // 🌡️ 难度爬坡：每关 BOSS 血更厚（40→55→70→85→100→115）
  if (b.ender) b.hp = b.maxHp = 10000;   // 🐉 末影龙一万血（恩泽定的）
  if (b.warden) b.hp = b.maxHp = 500000;   // 👿 坚守者五十万血（恩泽定的，慢慢磨！）
  zombies.push(b);
  setBanner('⚠️ ' + LEVELS[level].bossName + '出现了！');
  beep(90, 45, 0.6, 'sawtooth', 0.3); setTimeout(() => beep(60, 30, 0.8, 'sawtooth', 0.35), 200);
}
/* 💀 凋灵（第八关 BOSS）：普攻=蓝色凋灵骷髅头（命中 2 血）；技能=直线冲锋 3×10 格（96×320px），路径内 2.5 血，冷却 30 秒 */
function pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / L2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function witherTick(z, dt) {
  z.walkT += dt;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  if (!z.charge) { z.x += dx / d * 42 * dt; z.y += dy / d * 42 * dt; }   // 慢慢飘近
  z.skullT = (z.skullT == null ? 1.5 : z.skullT) - dt;
  if (z.skullT <= 0 && !z.charge) {   // 💙 普攻：蓝色凋灵骷髅头（击中才造成伤害，2 血）
    z.skullT = 2;
    earrows.push({ x: z.x, y: z.y - 20, vx: dx / d * 260, vy: dy / d * 260, t: 2, wskull: true, dmg: 2 });
    burst(z.x, z.y - 20, '#4a6aff', 6); beep(300, 180, 0.15, 'sawtooth', 0.1);
  }
  z.chargeCd = (z.chargeCd == null ? 8 : z.chargeCd) - dt;
  if (z.charge) {   // 💨 直线冲锋：只能直着冲，从起点冲到终点（10 格）；走廊 3 格宽内 2.5 血
    z.charge.left -= 900 * dt;
    z.x += z.charge.vx * dt; z.y += z.charge.vy * dt;
    if (player.inv <= 0 && pointSegDist(player.x, player.y, z.charge.sx, z.charge.sy, z.x, z.y) < 60) {
      player.hearts -= rollDmg(2.5); player.inv = 0.8; player.sinceHurt = 0; player.regenT = 0;
      burst(player.x, player.y, '#4a6aff', 12); shakeT = 0.3; beep(200, 80, 0.25, 'sawtooth', 0.2);
      if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
    }
    if (z.charge.left <= 0 || z.x < 30 || z.x > WORLD.w - 30 || z.y < 30 || z.y > WORLD.h - 30) { z.charge = null; z.chargeCd = 30; }   // 冷却 30 秒
  } else if (z.chargeCd <= 0) {
    if (z.chargeWarn == null) { z.chargeWarn = 0.7; z.warnDx = dx / d; z.warnDy = dy / d; setBanner('💀 凋灵要直线冲锋了！快闪出红线！'); beep(150, 90, 0.3, 'sawtooth', 0.2); }
    z.chargeWarn -= dt;
    if (z.chargeWarn <= 0) { z.charge = { sx: z.x, sy: z.y, vx: z.warnDx * 900, vy: z.warnDy * 900, left: 320 }; z.chargeWarn = null; }
  }
  const dmgW = rollDmg(1);   // 碰到也掉 1 心
  if (touchHurt(player, z, dmgW)) { beep(300, 120, 0.2, 'sawtooth', 0.16); burst(player.x, player.y, '#4a6aff', 8); if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; } }   // 💀 死亡不存档
}
/* 🐉 末影龙（第九关 BOSS，10000 血）：盘旋飞行；①龙息=朝玩家喷紫气，落地成紫雾（站雾里每秒半心，和 MC 一个判定）②俯冲=把玩家顶飞，落地掉 3 血 */
let playerFlyT = 0;   // 被顶飞中（不能动，落地结算）
function enderTick(z, dt) {
  z.walkT += dt;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  z.flyA = (z.flyA || 0) + dt * 0.55;   // 🐉 绕地图中心盘旋（MC 绕喷泉同款，恩泽点名改的）
  if (!z.dive) {
    const tx = WORLD.w / 2 + Math.cos(z.flyA) * 320, ty = WORLD.h / 2 + Math.sin(z.flyA) * 240;
    const ddx = tx - z.x, ddy = ty - z.y, dd = Math.hypot(ddx, ddy) || 1;
    z.x += ddx / dd * 200 * dt; z.y += ddy / dd * 200 * dt;
  }
  z.breathT = (z.breathT == null ? 3 : z.breathT) - dt;
  if (z.breathT <= 0 && !z.dive) {   // 💜 龙息：紫气弹飞向玩家，落地成雾 4 秒
    z.breathT = 6;
    z.breaths = z.breaths || [];
    z.breaths.push({ x: z.x, y: z.y - 40, vx: dx / d * 200, vy: dy / d * 200, t: Math.min(1.4, d / 200) });
    burst(z.x, z.y - 40, '#b48af2', 8); beep(200, 120, 0.4, 'sawtooth', 0.15); setBanner('🐉 龙息来了！别踩紫雾！');
  }
  if (z.breaths) for (const br of z.breaths) {
    br.t -= dt; br.x += br.vx * dt; br.y += br.vy * dt;
    if (br.t <= 0 && !br.landed) { br.landed = true; puddles.push({ x: br.x, y: br.y, t: 4, dragon: 1 }); burst(br.x, br.y, '#b48af2', 10); }
  }
  if (z.breaths) z.breaths = z.breaths.filter(br => !br.landed);
  z.diveCd = (z.diveCd == null ? 6 : z.diveCd) - dt;
  if (z.dive) {   // 🦅 俯冲中：撞上就把玩家顶飞（顶飞不直接掉血，落地才掉）
    z.x += z.dive.vx * dt; z.y += z.dive.vy * dt;
    if (!z.dive.hit && playerFlyT <= 0 && Math.hypot(player.x - z.x, player.y - z.y) < 50 && player.inv <= 0) {
      z.dive.hit = true; playerFlyT = 0.9; player.inv = 1.6;
      burst(player.x, player.y, '#b48af2', 14); shakeT = 0.5; beep(150, 400, 0.3, 'sawtooth', 0.2); setBanner('🦅 被顶飞了！小心落地！');
    }
    z.dive.left -= 500 * dt;
    if (z.dive.left <= 0) { z.dive = null; z.diveCd = 12; }
  } else if (z.diveCd <= 0 && d < 420) {
    if (z.diveWarn == null) { z.diveWarn = 0.8; z.warnDx = dx / d; z.warnDy = dy / d; setBanner('🐉 末影龙要俯冲了！'); beep(150, 90, 0.3, 'sawtooth', 0.25); }
    z.diveWarn -= dt;
    if (z.diveWarn <= 0) { z.dive = { vx: z.warnDx * 500, vy: z.warnDy * 500, left: Math.max(320, d + 120), hit: false }; z.diveWarn = null; }
  }
}
/* 🧨 苦力怕小怪：悄悄靠近→嘶嘶引信 0.8 秒→自爆（跑远 2 格引信熄灭，MC 同款；爆炸还会连环伤别的怪） */
function creepTick(z, p, dt, spdMul) {
  if (z.fuseT != null) {   // 引信点燃中：站住，越烧越亮
    z.fuseT -= dt;
    if (Math.hypot(p.x - z.x, p.y - z.y) > 64) { z.fuseT = null; return; }   // 跑远了：引信熄灭
    if (z.fuseT <= 0) {   // 💥 爆！
      z.dead = true;
      burst(z.x, z.y, '#7ec850', 18); burst(z.x, z.y, '#5a5a5a', 12); shakeT = Math.max(shakeT, 0.3); beep(80, 40, 0.4, 'sawtooth', 0.25);
      if (p === player && Math.hypot(p.x - z.x, p.y - z.y) < 75 && player.inv <= 0 && !(player.tpT > 0)) {
        player.hearts -= rollDmg(1.5); player.inv = 0.6; player.sinceHurt = 0; player.regenT = 0;
        burst(player.x, player.y, '#e84a4a', 8);
        if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
      }
      for (const o of zombies) { if (o !== z && !o.dead && Math.hypot(o.x - z.x, o.y - z.y) < 75) { o.hp -= 3; o.flash = 0.12; if (o.hp <= 0) killZombie(o); } }   // 连环爆
    }
    return;
  }
  zombieStep(z, p, dt, spdMul);   // 悄悄靠近（不咬人）
  if (Math.hypot(p.x - z.x, p.y - z.y) < 42) { z.fuseT = 0.8; beep(900, 1400, 0.5, 'sine', 0.08); }   // 嘶——
}
/* 🧨 泰坦苦力怕（第十关 BOSS）：①TNT 雨=周围降 10 个 TNT（1 个瞄准玩家），2.5 秒爆炸掉 2.5 血，冷却 10 秒；②撕咬扑击=玩家进 2 格内就扑上去咬 3 血，冷却 15 秒 */
function titanTick(z, dt) {
  z.walkT += dt;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  if (!z.lunge) zombieStep(z, player, dt, 0.9);   // 慢慢逼近
  z.tntCd = (z.tntCd == null ? 4 : z.tntCd) - dt;
  if (z.tntCd <= 0) {   // ① TNT 雨
    z.tntCd = 10; z.tnts = [];
    for (let i = 0; i < 9; i++) { const a = Math.random() * 6.28, rr = 60 + Math.random() * 110; z.tnts.push({ x: z.x + Math.cos(a) * rr, y: z.y + Math.sin(a) * rr, t: 2.5 }); }
    z.tnts.push({ x: player.x, y: player.y, t: 2.5, aim: true });   // 🎯 有一个瞄准玩家
    setBanner('🧨 TNT 雨！2.5 秒后爆炸，快跑出红圈！'); beep(500, 900, 0.3, 'square', 0.15);
  }
  if (z.tnts) for (const t of z.tnts) {
    t.t -= dt;
    if (t.t <= 0 && !t.boom) {
      t.boom = true; burst(t.x, t.y, '#ff8a5a', 16); burst(t.x, t.y, '#5a5a5a', 10); shakeT = Math.max(shakeT, 0.2); beep(80, 40, 0.35, 'sawtooth', 0.2);
      if (Math.hypot(player.x - t.x, player.y - t.y) < 65 && player.inv <= 0 && !(player.tpT > 0)) {
        player.hearts -= rollDmg(2.5); player.inv = 0.7; player.sinceHurt = 0; player.regenT = 0; burst(player.x, player.y, '#e84a4a', 10);
        if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
      }
    }
  }
  if (z.tnts) z.tnts = z.tnts.filter(t => !t.boom);
  z.lungeCd = (z.lungeCd == null ? 3 : z.lungeCd) - dt;
  if (z.lunge) {   // ② 扑击中
    z.x += z.lunge.vx * dt; z.y += z.lunge.vy * dt; z.lunge.left -= 400 * dt;
    if (!z.lunge.bit && Math.hypot(player.x - z.x, player.y - z.y) < 30 && player.inv <= 0) {
      z.lunge.bit = true; player.hearts -= rollDmg(3); player.inv = 0.8; player.sinceHurt = 0; player.regenT = 0;
      burst(player.x, player.y, '#7ec850', 10); beep(250, 90, 0.2, 'sawtooth', 0.2); shakeT = 0.3;
      if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
    }
    if (z.lunge.left <= 0) z.lunge = null;
  } else if (z.lungeCd <= 0 && d < 64) {   // 玩家进两格：扑！
    z.lungeCd = 15; z.lunge = { vx: dx / d * 400, vy: dy / d * 400, left: 80, bit: false };
    setBanner('🧨 泰坦苦力怕扑过来了！'); beep(300, 600, 0.15, 'square', 0.15);
  }
  if (!z.lunge) {   // 扑击时普通接触不抢戏（撕咬 3 血才是正戏）
    const dmgT = rollDmg(1);
    if (touchHurt(player, z, dmgT)) { beep(300, 120, 0.2, 'sawtooth', 0.16); burst(player.x, player.y, '#7ec850', 8); if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; } }   // 💀 死亡不存档
  }
}
/* 🟢 史莱姆小怪：一蹦一跳追人（MC 同款弹跳） */
function slimeTick(z, p, dt, spdMul) {
  z.hopT = (z.hopT == null ? Math.random() * 0.5 : z.hopT) - dt;
  if (z.hopT <= 0) {
    z.hopT = 0.7;
    const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy) || 1;
    z.hvx = dx / d * 95 * (spdMul || 1); z.hvy = dy / d * 95 * (spdMul || 1); z.hopAir = 0.35;
  }
  if (z.hopAir > 0) { z.hopAir -= dt; z.x += z.hvx * dt; z.y += z.hvy * dt; }
}
/* 👻 恶魂（第十一关 BOSS，190 血）：高空漂浮绕圈；喷火球 3 秒一发（2 血）——火球能被玩家打回去，砸中恶魂掉 15 血；每 12 秒扇形三连发 */
function ghastTick(z, dt) {
  z.walkT += dt;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  z.driftA = (z.driftA || 0) + dt * 0.5;   // 绕玩家高空绕圈
  const tx = player.x + Math.cos(z.driftA) * 240, ty = player.y + Math.sin(z.driftA) * 240;
  const ddx = tx - z.x, ddy = ty - z.y, dd = Math.hypot(ddx, ddy) || 1;
  z.x += ddx / dd * 90 * dt; z.y += ddy / dd * 90 * dt;
  z.fireT = (z.fireT == null ? 2 : z.fireT) - dt;
  if (z.fireT <= 0) {   // 🔥 火球：可以打回去！
    z.fireT = 3; z.mouthT = 0.5;
    earrows.push({ x: z.x, y: z.y - 30, vx: dx / d * 170, vy: dy / d * 170, t: 4, ghastBall: true, dmg: 2 });
    beep(400, 200, 0.4, 'sawtooth', 0.18); setBanner('👻 恶魂喷火球了——砍火球能打回去！');
  }
  z.triT = (z.triT == null ? 8 : z.triT) - dt;
  if (z.triT <= 0) {   // 🔥🔥🔥 扇形三连发
    z.triT = 12; z.mouthT = 0.8;
    for (let k = -1; k <= 1; k++) { const a = Math.atan2(dy, dx) + k * 0.22; earrows.push({ x: z.x, y: z.y - 30, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, t: 4, ghastBall: true, dmg: 2 }); }
    beep(400, 150, 0.5, 'sawtooth', 0.2); setBanner('👻 三连火球！');
  }
}
/* ⚾ 打回恶魂火球：近战挥砍/射箭都能把火球抽回去 */
function deflectGhastBalls(px, py, r) {
  for (const a of earrows) {
    if (!a.ghastBall || a.returned || a.t <= 0) continue;
    if (Math.hypot(a.x - px, a.y - py) < r) {
      const gb = zombies.find(z2 => z2.ghast && !z2.dead);
      if (gb) { const gd = Math.hypot(gb.x - a.x, gb.y - a.y) || 1; a.vx = (gb.x - a.x) / gd * 320; a.vy = (gb.y - a.y) / gd * 320; a.returned = true; a.t = 3; burst(a.x, a.y, '#ffd24a', 6); beep(800, 1200, 0.08, 'square', 0.1); setBanner('⚾ 打回去了！'); }
    }
  }
}
/* 👿 坚守者（第十二关 BOSS，50 万血）：盲眼！你站着不动 1.5 秒他就找不到你（MC 潜行同款）；音波炮=蓄力直线光束 3 血（瞬移侧边躲）；贴身震地猛击 3.5 血 */
let playerStillT = 0;   // 🤫 站着不动计时（坚守者看不见静止的你）
function wardenTick(z, dt) {
  z.walkT += dt;
  const still = playerStillT > 1.5;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  if (still) {   // 🤫 找不到你：原地嗅探徘徊
    z.sniffA = (z.sniffA || 0) + dt * 1.2;
    z.x += Math.cos(z.sniffA) * 30 * dt; z.y += Math.sin(z.sniffA * 1.3) * 30 * dt;
    z.sonicT = Math.max(z.sonicT != null ? z.sonicT : 4, 2);   // 看不见就不开炮
  } else {   // 👂 听到你：大步追
    z.x += dx / d * 72 * dt; z.y += dy / d * 72 * dt;
  }
  z.sonicT = (z.sonicT == null ? 4 : z.sonicT) - dt;
  if (z.sonicT <= 0 && !still && z.chargeT == null) { z.chargeT = 1.0; beep(200, 500, 0.9, 'sawtooth', 0.2); setBanner('👿 坚守者蓄力音波炮——快闪开直线！'); }
  if (z.chargeT != null) {
    z.chargeT -= dt;
    z.aimA = Math.atan2(player.y - z.y, player.x - z.x);   // 蓄力时持续瞄准
    if (z.chargeT <= 0) {
      z.chargeT = null; z.sonicT = 12;
      shocks.push({ pts: [[z.x, z.y], [z.x + Math.cos(z.aimA) * 420, z.y + Math.sin(z.aimA) * 420]], t: 0.3, w: 10, col: '#7ae8f2' });
      if (pointSegDist(player.x, player.y, z.x, z.y, z.x + Math.cos(z.aimA) * 420, z.y + Math.sin(z.aimA) * 420) < 20 && player.inv <= 0 && !(player.tpT > 0)) {
        const dmgS3 = rollDmg(3); player.hearts -= dmgS3; player.inv = 0.7; player.sinceHurt = 0; player.regenT = 0;
        burst(player.x, player.y, '#7ae8f2', 14); beep(150, 60, 0.4, 'sawtooth', 0.22);
        if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
      }
      shakeT = 0.3;
    }
  }
  if (d < 36 && !still) {   // 👊 震地猛击
    z.slamT = (z.slamT == null ? 0 : z.slamT) - dt;
    if (z.slamT <= 0) {
      z.slamT = 2; shakeT = 0.35;
      burst(player.x, player.y, '#2a4a44', 12); beep(120, 50, 0.35, 'sawtooth', 0.22);
      if (player.inv <= 0 && !(player.tpT > 0)) {
        const dmgW = rollDmg(3.5); player.hearts -= dmgW; player.inv = 0.7; player.sinceHurt = 0; player.regenT = 0;
        if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
      }
    }
  }
}
/* 🧨 MC 苦力怕统一画法：高绿柱躯干+迷彩斑块+四条小短腿+经典苦脸（小怪/泰坦/宠物共用，s=缩放） */
function drawCreeper(cx, cy, s, opt) {
  opt = opt || {};
  const fusing = opt.fuseT != null, flashOn = fusing && Math.floor(opt.fuseT * 10) % 2 === 0;
  const grow = fusing ? 1 + (0.8 - opt.fuseT) * 0.25 : 1;
  const wob = Math.sin((opt.walkT || 0) * 8) * 2.2;
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.scale(s * grow, s * grow);
  ctx.fillStyle = flashOn ? '#c8e8b0' : '#3a7a22';   // 四条小短腿（前后交替迈步）
  ctx.fillRect(-7, -4 + Math.max(0, wob), 4, 4 - Math.max(0, wob)); ctx.fillRect(3, -4 + Math.max(0, wob), 4, 4 - Math.max(0, wob));
  ctx.fillRect(-7, -4 + Math.max(0, -wob), 4, 4 - Math.max(0, -wob)); ctx.fillRect(3, -4 + Math.max(0, -wob), 4, 4 - Math.max(0, -wob));
  ctx.fillStyle = flashOn ? '#e8f8dc' : '#55a02e'; ctx.fillRect(-8, -28, 16, 24);   // 高躯干
  if (!flashOn) {   // 迷彩斑块（MC 苦力怕的花皮）
    ctx.fillStyle = '#478a26'; ctx.fillRect(-6, -25, 5, 4); ctx.fillRect(2, -18, 5, 5); ctx.fillRect(-7, -10, 4, 4); ctx.fillRect(3, -26, 4, 3);
    ctx.fillStyle = '#63b436'; ctx.fillRect(0, -24, 4, 4); ctx.fillRect(-5, -16, 4, 5); ctx.fillRect(2, -7, 5, 3);
  }
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(5, -28, 3, 24);   // 右侧阴影
  ctx.fillStyle = flashOn ? '#4a5a3a' : '#101408';   // 经典苦脸
  ctx.fillRect(-6, -25, 4, 4); ctx.fillRect(2, -25, 4, 4);   // 两眼
  ctx.fillRect(-2, -20, 4, 5);   // 中间竖嘴
  ctx.fillRect(-5, -16, 3, 4); ctx.fillRect(2, -16, 3, 4);   // 嘴角下撇
  ctx.restore();
  if (fusing) { ctx.fillStyle = '#ffe84a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', Math.round(cx), Math.round(cy) - 36 * s); ctx.textAlign = 'left'; }
}
/* 🌲 哥布林统一画法：绿皮小个子+尖耳朵+黄眼尖牙+手里抡木棍（小怪/王共用，s=缩放，face=-1 朝左） */
function drawGoblin(cx, cy, s, opt) {
  opt = opt || {};
  const step = Math.sin((opt.walkT || 0) * 8) * 2;
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.scale(s * (opt.face < 0 ? -1 : 1), s);
  ctx.fillStyle = '#3a5a22'; ctx.fillRect(-5, -6, 4, 6 + Math.max(0, step)); ctx.fillRect(1, -6, 4, 6 + Math.max(0, -step));   // 腿倒腾
  ctx.fillStyle = '#4a8a2a'; ctx.fillRect(-7, -20, 14, 14);   // 绿皮身体
  ctx.fillStyle = '#3a6a20'; ctx.fillRect(-7, -20, 14, 3);   // 肩膀阴影
  ctx.fillStyle = '#55a02e'; ctx.fillRect(-6, -30, 12, 10);   // 头
  ctx.fillStyle = '#4a8a2a';   // 尖耳朵两边伸出
  ctx.beginPath(); ctx.moveTo(-6, -27); ctx.lineTo(-12, -30); ctx.lineTo(-6, -24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -27); ctx.lineTo(12, -30); ctx.lineTo(6, -24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8d24a'; ctx.fillRect(-4, -27, 3, 3); ctx.fillRect(1, -27, 3, 3);   // 黄眼睛
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-3, -26, 2, 2); ctx.fillRect(2, -26, 2, 2);   // 瞳
  ctx.fillStyle = '#2a4a18'; ctx.fillRect(-3, -22, 6, 2);   // 嘴
  ctx.fillStyle = '#fff'; ctx.fillRect(-3, -22, 1.6, 2.6); ctx.fillRect(1.4, -22, 1.6, 2.6);   // 尖牙
  const clubA = opt.clubA != null ? opt.clubA : Math.sin((opt.walkT || 0) * 4) * 0.4 + 0.5;   // 木棍（抡鞭时举高）
  ctx.save(); ctx.translate(8, -14); ctx.rotate(clubA);
  ctx.fillStyle = '#7a5a2a'; ctx.fillRect(0, -2.5, 16, 5);   // 棍身
  ctx.fillStyle = '#5a3f1a'; ctx.fillRect(12, -3.5, 6, 7);   // 棍头粗端
  ctx.restore();
  ctx.restore();
}
/* 🌲 副本大树：深绿松树（树干+两层针叶） */
function drawDgnTree(x, y) {
  ctx.fillStyle = '#3a2a18'; ctx.fillRect(x + 18, y + 34, 10, 16);
  ctx.fillStyle = '#24401c';
  ctx.beginPath(); ctx.moveTo(x + 23, y); ctx.lineTo(x + 6, y + 22); ctx.lineTo(x + 40, y + 22); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 23, y + 10); ctx.lineTo(x + 2, y + 34); ctx.lineTo(x + 44, y + 34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2e5524';
  ctx.beginPath(); ctx.moveTo(x + 23, y + 4); ctx.lineTo(x + 10, y + 20); ctx.lineTo(x + 36, y + 20); ctx.closePath(); ctx.fill();
}
/* 👹 BOSS 每帧：砸地伤害结算+陀螺持续刮血+骷髅王巨箭/寒冰+鬼王魂火/夺魂 */
/* 🔥 DoT 结算（燃烧/法师附火/中毒冻伤）：每 0.1 秒一跳，死掉返回 true */
function dotTick(z, dt) {
  if (z.mageBurnT > 0) {
    z.mageBurnT -= dt; z.mageBurnAcc = (z.mageBurnAcc || 0) + dt;
    if (z.mageBurnAcc >= 0.1) { z.mageBurnAcc -= 0.1; z.hp -= 0.1; z.flash = 0.1; dotBurst(z.x, z.y, '#ff9a3d'); if (z.hp <= 0) { killZombie(z); return true; } }
  }
  if (z.burnT > 0) {
    z.burnT -= dt; z.burnAcc = (z.burnAcc || 0) + dt;
    if (z.burnAcc >= 0.1) { z.burnAcc -= 0.1; z.hp -= dotDmg(z); z.flash = 0.1; dotBurst(z.x, z.y, '#ff9a3d'); if (z.hp <= 0) { killZombie(z); return true; } }
  }
  if (z.poiT > 0) {
    z.poiT -= dt; z.poiAcc = (z.poiAcc || 0) + dt;
    if (z.poiAcc >= 0.1) { z.poiAcc -= 0.1; z.hp -= dotDmg(z); z.flash = 0.1; dotBurst(z.x, z.y, z.poiColor || '#7ee85a'); if (z.hp <= 0) { killZombie(z); return true; } }
  }
  return false;
}
function bossUpdate(z, dt) {
  if (z.dgnKing) { Dgn.dgnKingTick(z, dt); return; }   // 👑 哥布林王有自己的大脑
  if (z.warden) { wardenTick(z, dt); return; }   // 👿 坚守者有自己的大脑
  if (z.ghast) { ghastTick(z, dt); return; }   // 👻 恶魂有自己的大脑
  if (z.titan) { titanTick(z, dt); return; }   // 🧨 泰坦苦力怕有自己的大脑
  if (z.ender) { enderTick(z, dt); return; }   // 🐉 末影龙有自己的大脑
  if (z.wither) { witherTick(z, dt); return; }   // 💀 凋灵有自己的大脑
  if (z.fake) {   // 💎 水晶魔王假身：只会慢慢飘过来吓人，不放技能、不给赏金
    z.walkT += dt;
    const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
    z.x += dx / d * 50 * dt; z.y += dy / d * 50 * dt;
    const dmgF = rollDmg(0.5);
    if (touchHurt(player, z, dmgF)) { if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; } }   // 💀 死亡不存档
    return;
  }
  const ev = bossTick(z, player, dt, ZOMBIE.speed * (z.spdMul || 1));   // 🌀 无尽 BOSS 速度加成
  if (ev.clone) {   // 💎 晶影分身：分出 2 个假身
    for (let i = 0; i < ev.clone.n; i++) {
      const a = Math.random() * 6.28;
      zombies.push({ x: z.x + Math.cos(a) * 70, y: z.y + Math.sin(a) * 70, hp: 1, r: 60, fake: true, boss: true, crystalBoss: true, dead: false, flash: 0, walkT: Math.random() * 9, state: 'chase', stateT: 0 });
    }
    setBanner('💎 水晶魔王分身了！找出真的打！'); beep(400, 800, 0.3, 'sine', 0.15);
  }
  if (ev.lasers) {   // 💎 棱光齐射：8 方向激光
    for (const l of ev.lasers) earrows.push({ x: l.x, y: l.y, vx: l.dx * 420, vy: l.dy * 420, t: 1.6, laser: true });
    setBanner('💎 棱光齐射！快找空隙！'); beep(900, 1400, 0.2, 'sawtooth', 0.14);
  }
  if (ev.puddles) {   // 🌋 火山喷发：4 池岩浆喷在周围，踩上烫脚
    for (const p2 of ev.puddles) puddles.push({ x: p2.x, y: p2.y, t: 5 });
    setBanner('🌋 火山喷发！离开岩浆！'); beep(200, 70, 0.5, 'sawtooth', 0.2);
  }
  if (ev.trail) {   // 🔥 冲锋犁出岩浆路
    z.trailAcc = (z.trailAcc || 0) + dt;
    if (z.trailAcc >= 0.1) { z.trailAcc -= 0.1; puddles.push({ x: z.x, y: z.y + 30, t: 3 }); }
    shakeT = Math.max(shakeT, 0.06);
  }
  if (ev.strike) {   // 🌩️ 万雷天引：一道落雷砸向玩家位置（0.7 秒预警）
    meteors.push({ x: ev.strike.x, y: ev.strike.y, t: 0.7, landed: false, dmg: z.atkMul || 1, r: 50, color: '#ffe84a', bolt: true });
    beep(400, 100, 0.2, 'sawtooth', 0.15);
  }
  if (ev.net) {   // ⚡ 电网：6 颗电球绕 BOSS 转 3 秒
    netOrbs = { b: z, t: 3, ang: 0, hitAcc: 0 };
    setBanner('⚡ 电网来了，别靠近！'); beep(300, 800, 0.4, 'sawtooth', 0.18);
  }
  if (ev.rift) {   // 🕳️ 虚空裂隙：玩家脚下裂隙爆发 2 心
    meteors.push({ x: ev.rift.x, y: ev.rift.y, t: 1, landed: false, dmg: 2 * (z.atkMul || 1), r: 80, color: '#8a5ac8' });
    setBanner('🕳️ 脚下要裂开了，快跑！'); beep(150, 60, 0.5, 'sawtooth', 0.2);
  }
  if (ev.shock) {   // 💫 相位轰炸：瞬移落点冲击波 0.5 心
    shocks.push({ x: ev.shock.x, y: ev.shock.y, t: 0.3 });
    burst(ev.shock.x, ev.shock.y, '#b48af2', 16); beep(500, 1200, 0.15, 'sine', 0.15);
    if (!gameOver && !(player.tpT > 0) && Math.hypot(player.x - ev.shock.x, player.y - ev.shock.y) < 70) {
      const dmg = rollDmg(0.5);
      if (dmg > 0) {
        player.hearts -= dmg; player.inv = 0.6; player.sinceHurt = 0;
        burst(player.x, player.y, '#b48af2', 10);
        if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; } }   // 💀 死亡不存档
      }
    }
  }
  if (ev.giantArrow) {   // 🏹 骷髅王巨箭：追踪 5 秒，速度=玩家，打空就消失
    garrows.push({ x: ev.giantArrow.x, y: ev.giantArrow.y, ang: Math.atan2(ev.giantArrow.dy, ev.giantArrow.dx), t: 5, speed: PLAYER.speed });
    setBanner('🏹 巨箭来袭，快跑 5 秒！'); beep(200, 90, 0.4, 'sawtooth', 0.2);
  }
  if (ev.freeze) {   // ❄️ 骷髅王寒冰：冻住 1 秒（不能动，期间会挨打）
    if (!gameOver) {
      player.frozenT = 1; player.sinceHurt = 0;
      burst(player.x, player.y, '#a8e8ff', 18); beep(500, 1200, 0.3, 'sine', 0.18);
      setBanner('❄️ 被冻住了！');
    }
  }
  if (ev.soulFire) {   // 🔮 鬼王魂火：直线魂珠半心
    earrows.push({ x: ev.soulFire.x, y: ev.soulFire.y, vx: ev.soulFire.dx * 200, vy: ev.soulFire.dy * 200, t: 2.2, soul: true });
    beep(600, 300, 0.15, 'sine', 0.12);
  }
  if (ev.drain && !gameOver && !(player.tpT > 0)) {   // ⛓️ 夺魂锁链：范围内减速+每秒半心
    player.drainSlow = true;
    z.drainAcc = (z.drainAcc || 0) + dt;
    if (Math.random() < dt * 20) burst((z.x + player.x) / 2 + (Math.random() - 0.5) * 40, (z.y + player.y) / 2 + (Math.random() - 0.5) * 40, '#8ff2ea', 2);
    if (z.drainAcc >= 1) {
      z.drainAcc -= 1;
      const dmg = rollDmg(0.5);
      if (dmg > 0) {
        player.hearts -= dmg; player.inv = 0.4; player.sinceHurt = 0; shakeT = Math.max(shakeT, 0.1);
        burst(player.x, player.y, '#8ff2ea', 8); beep(400, 200, 0.15, 'sine', 0.14);
        if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('over').style.display = 'flex'; document.getElementById('overScore').textContent = `你击败了 ${kills} 只怪物！`; } }   // 💀 死亡不存档
      }
    }
  }
  if (ev.slam) {   // 💥 双臂砸地：周围 10 格 2 心
    shakeT = 0.35; slamFx = { x: z.x, y: z.y, t: 0.4 };
    beep(70, 35, 0.35, 'sawtooth', 0.3);
    for (let i = 0; i < 20; i++) burst(z.x + (Math.random() - 0.5) * BOSS.slamR * 1.8, z.y + (Math.random() - 0.5) * BOSS.slamR * 1.8, '#c8a86a');
    const d = Math.hypot(player.x - z.x, player.y - z.y);
    if (d <= BOSS.slamR + PLAYER.r && !gameOver && !(player.tpT > 0)) {   // 🗡️ 残影中不吃砸地
      const dmg = rollDmg(2 * (z.atkMul || 1));   // 🌀 无尽 BOSS 攻击加成
      if (dmg === 0) beep(700, 400, 0.08, 'square', 0.1);
      else {
        player.hearts -= dmg; player.inv = HURT.invincible; player.sinceHurt = 0; player.regenT = 0;
        const dx = player.x - z.x, dy = player.y - z.y, dd = Math.hypot(dx, dy) || 1;
        player.x = Math.max(16, Math.min(WORLD.w - 16, player.x + dx / dd * 70));   // 冲击波弹飞
        player.y = Math.max(16, Math.min(WORLD.h - 16, player.y + dy / dd * 70));
        beep(120, 50, 0.3, 'sawtooth', 0.2); burst(player.x, player.y, '#e84a4a', 12);
        if (player.hearts <= 0 && !angelSave() && !gameOver) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只僵尸！`; document.getElementById('over').style.display = 'flex'; }
      }
    }
  }
  if (z.state === 'spin') {   // 🌀 陀螺：碰到每秒半心（持续刮；光影残影不吃）
    const d = Math.hypot(player.x - z.x, player.y - z.y);
    if (d < z.r + PLAYER.r && !gameOver && !(player.tpT > 0)) {
      player.hearts -= 0.5 * dt * (z.atkMul || 1); player.sinceHurt = 0;   // 🌀 无尽 BOSS 攻击加成
      if (Math.random() < 0.3) burst(player.x, player.y, '#bfefff');
      if (player.hearts <= 0 && !angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只僵尸！`; document.getElementById('over').style.display = 'flex'; }
    }
    return;
  }
  /* 平时像僵尸一样抓人（1 心），盔甲照挡 */
  const dmgN = rollDmg(1);
  if (touchHurt(player, z, dmgN)) {
    if (player.owned.thorns) { z.hp -= 2; z.flash = 0.12; burst(z.x, z.y, '#7ec850', 8); if (z.hp <= 0) killZombie(z); }
    if (player.owned.spring) { const sdx = z.x - player.x, sdy = z.y - player.y, sd = Math.hypot(sdx, sdy) || 1;
      z.x = Math.max(20, Math.min(WORLD.w - 20, z.x + sdx / sd * 60)); z.y = Math.max(20, Math.min(WORLD.h - 20, z.y + sdy / sd * 60)); }   // BOSS 沉，弹得近
    beep(dmgN === 0 ? 700 : dmgN === 0.5 ? 500 : 140, dmgN === 0 ? 900 : dmgN === 0.5 ? 300 : 60, dmgN === 1 ? 0.25 : 0.1, 'sawtooth', 0.16);
    burst(player.x, player.y, dmgN === 0 ? '#ffe84a' : dmgN === 0.5 ? '#a8c8e8' : '#e84a4a', dmgN === 1 ? 10 : 6);
    if (player.hearts <= 0 && !angelSave() && !gameOver) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只僵尸！`; document.getElementById('over').style.display = 'flex'; }
  }
}
function reset() {
  player = makePlayer(); zombies = []; kills = 0; spawnT = 1; summonT = 10; parts = []; gameOver = false;
  player.job = null; player.job2 = null; player.offhand = null; warriorHand = false; lastSwingKey = null;   // 🥷⚔️ 新冒险：无职业无副手，等宝箱觉醒
  towerMode = false; campaignLv = 1;   // 🗼🧭 新冒险不在塔里，主线从第一关开始
  pets = []; dexCounts = {}; coins = []; skillSlots = [];   // 🐾📖🪙✨ 新冒险从零开始
  endlessRound = 1; endlessWave = 1; waveKills = 0; overRecorded = false;   // 🌀 无尽从零开始
  chest = null; pendingNext = null; chestLatch = false; roomLatch = false; plazaSeen = false;   // 🎁 宝箱清空
  faintDone = false; townMode = false; townUnlocked = false; ownedHouse = false; inRoom = false; storage = {}; sittingBench = null;   // 💉🏡 剧情小镇清零（🪑屁股也起来）
  dungeonMode = false; dgnKills = 0; dgnKingSpawned = false; dgnExit = null;   // 🌲 副本清零
  document.getElementById('faint').style.display = 'none'; document.getElementById('bed').style.display = 'none'; storeEl.style.display = 'none';
  bossAt = 100; banner = { txt: '', t: 0 }; shakeT = 0; slamFx = null;
  hurtT = 0; deathT = 0; swingDir = 1; prevHearts = 99;   // 💥💀↔️ 动作状态清零
  tpWindowT = 0; tpLand = null; prevBow = null; assassinStrike = false; assassinSwapT = 0;   // 🥷 刺客状态清零
  blockT = 0; blockCd = 0;   // 🛡️ 格挡清零
  wolves = []; wolfT = 0;   // 🐺 狼群解散
  player.mount = null; player.mountHp = 0; player.mountCd = 0; player.mountAtkT = 0;   // 🐴 新冒险没坐骑
  challengeMode = null; chKills = 0;   // 📅 重置=挑战模式也清掉（重新进才算）
  dragonHookT = 4;   // 🐉 新局 4 秒后播龙影钩子（只有第一关真的播）
  minions = []; turrets = [];   // ☠️🧲 小弟炮塔解散
  bearCd = 0; freezeAllT = 0; chronoT = 20; clericT = 2; turretT = 6;   // 🌟 职业被动计时器归零
  level = 1; earrows = []; parrows = [];
  autoOn = false; holdAtk = false; autoT = 0; autoBtn.classList.remove('on');
  skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = [];
  renderSkills(); updateJobSwap();   // ⇄ 新冒险：切换钮藏起来
  deco = [];   // 树和石头点缀（固定随机，玩久了认得路）
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) deco.push({ x: 60 + rnd() * (WORLD.w - 120), y: 60 + rnd() * (WORLD.h - 120), t: rnd() < 0.65 ? 'tree' : 'rock' });
  document.getElementById('over').style.display = 'none'; updateScore(); updateGold(); toggleShop(false); updateMana();   // 🔵 新冒险满蓝
  placePortal();   // 🕳️ 这关的山洞在哪呢
  placeShops();   // 🏪 地图上摆两个商店
}
function updateScore() { document.getElementById('score').textContent = '⚔️ 击败 ' + kills; document.getElementById('levelTag').textContent = pvpMode ? '☁️ 天空城 #' + String(pvpMode).replace('net', '') : dungeonMode ? '🌲 哥布林森林 ' + dgnKills + '/' + DGN_GOAL + (dgnKingSpawned ? ' 👑王来了！' : '') : townMode ? '🏡 宁静小镇' : towerMode ? `🗼试炼塔 第${endlessRound}遍·第${endlessWave}波` : '🗺️ 第' + level + '关·' + LEVELS[level].name; }
function updateGold() { document.getElementById('gold').textContent = '💰 ' + player.gold; updateDia(); }
function updateDia() { document.getElementById('dia').textContent = '💎 ' + (player.diamonds || 0); }   // 💎 钻石只认试炼塔
