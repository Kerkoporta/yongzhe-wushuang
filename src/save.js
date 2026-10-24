'use strict';
/* ================= 🕳️ 神秘山洞（每关一个：金色精英怪守着金币） ================= */
let portalDone = false;   // 打没打过也记档（防读档重打刷奖励）
let hurtT = 0, deathT = 0, swingDir = 1, prevHearts = 99;   // 💥受击后仰/💀死亡倒下/↔️左右挥剑（v53）
function placePortal() {
  let px, py, tries = 0;
  do { px = 200 + Math.random() * (WORLD.w - 400); py = 200 + Math.random() * (WORLD.h - 400); tries++; } while (Math.hypot(px - player.x, py - player.y) < 300 && tries < 20);
  portal = { x: px, y: py }; portalDone = false;
}
function portalTick(dt) {
  if (portal && Math.hypot(player.x - portal.x, player.y - portal.y) < 32) {
    const px2 = portal.x, py2 = portal.y; portal = null; portalDone = true; saveGame();   // 🕳️ 打过了立刻存档
    setBanner('🕳️ 神秘山洞！金色精英怪守着宝箱！'); beep(500, 900, 0.4, 'sine', 0.2);
    spawnEnemy();
    const ez = zombies[zombies.length - 1];
    ez.x = px2; ez.y = py2 - 40; ez.elite = true; ez.hp *= 3; ez.r = (ez.r || 10) * 1.5;
    for (let i = 0; i < 5; i++) coins.push({ x: px2 + (Math.random() - 0.5) * 90, y: py2 + (Math.random() - 0.5) * 90, v: 10 + Math.floor(Math.random() * 11), t: 60 });
  }
  for (const c of coins) {
    c.t -= dt;
    if (Math.hypot(player.x - c.x, player.y - c.y) < 18) {
      c.t = 0;
      if (c.gem) { player.diamonds = (player.diamonds || 0) + c.v; updateDia(); burst(c.x, c.y, '#7ae8f2', 6); beep(1200, 1800, 0.1, 'sine', 0.12); }   // 💎 钻石入袋
      else { player.gold += c.v; updateGold(); burst(c.x, c.y, '#ffd24a', 6); beep(900, 1300, 0.08, 'sine', 0.1); }
    }
  }
  coins = coins.filter(c => c.t > 0);
}
/* ================= 📖 击杀图鉴（杀过的怪都记在这里） ================= */
const DEX_LIST = [
  ['zombie', '🧟', '僵尸', '草原小怪，慢慢追你'], ['skeleton', '💀', '骷髅', '雪原射手，会放冷箭'],
  ['ghost', '👻', '鬼魂', '地狱飘魂，速度快'], ['lava', '🌋', '岩浆怪', '死了会爆炸，别贴脸'],
  ['storm', '⛈️', '雷云精', '边飞边射电光弹'], ['voidw', '🕳️', '虚空行者', '3 秒瞬移到你背后'],
  ['crystal', '💠', '激光怪', '远远地射飞快激光'],
  ['boss1', '👹', '僵尸王', '砸地+陀螺'], ['boss2', '💀', '骷髅王', '巨箭追踪+寒冰'],
  ['boss3', '👻', '鬼王', '魂火连珠+夺魂锁链'], ['boss4', '🌋', '熔岩魔王', '火雨+冲锋'],
  ['boss5', '⛈️', '雷霆法王', '万雷天引+电网'], ['boss6', '🕳️', '虚空主宰', '裂隙+相位轰炸'], ['boss7', '💎', '水晶魔王', '分身+棱光齐射，假身没钱'],
  ['goblin', '👺', '哥布林', '副本森林小怪：绿皮尖牙抡木棍'], ['bossDgn', '👑', '哥布林王', '副本老大：鞭子横扫一鞭 5 血'],
];
const dexEl = document.getElementById('dex'), dexList = document.getElementById('dexList');
let dexOpen = false;
function toggleDex(force) {
  dexOpen = force == null ? !dexOpen : force;
  paused = dexOpen;
  if (dexOpen) renderDex();
  dexEl.style.display = dexOpen ? 'flex' : 'none';
}
function renderDex() {
  let h = '';
  for (const [kind, icon, name, tip] of DEX_LIST) {
    const n = dexCounts[kind] || 0;
    h += `<div class="slot"><div class="inf">${icon} ${name}<br>${n > 0 ? `已击败 <b>${n}</b> 只 · ${tip}` : '？？？（还没遇到过）'}</div></div>`;
  }
  dexList.innerHTML = h;
}
document.getElementById('gearDex').onclick = () => { toggleGear(false); toggleDex(true); };
document.getElementById('dexClose').onclick = () => toggleDex(false);
/* ================= 💾 存档口袋（自动档+4 手动档，全存在这台设备的浏览器里） ================= */
const SAVE_KEY = 'zombie_fight_save_v1';
const SLOT_KEY = i => 'zombie_fight_slot_' + i;
const mySid = 's' + Math.random().toString(36).slice(2, 8);   // 本页面实例 id
let saveT = 2;
function packSave() {
  const boss = zombies.find(z => z.boss && !z.dead && !z.fake);
  return { kills, gold: player.gold, weapon: player.weapon, owned: player.owned, hearts: player.hearts, bossAt, level, music: musicOn ? 1 : 0, rot: rotated ? 1 : 0, when: Date.now(), sid: mySid,
    job: player.job || null, job2: player.job2 || null, offhand: player.offhand || null,   // 🥷⚔️ 主副职业和副手跟着存档走
    dia: player.diamonds || 0, slots: player.slots, off2: player.offhands2 || [],   // 💎 钻石+扩展槽跟着存档走
    items: player.items || {},   // 🍗 道具袋跟着存档走
    mana: Math.round(player.mana != null ? player.mana : 100),   // 🔵 蓝条也进存档
    towerMode: towerMode ? 1 : 0,   // 🗼 在不在试炼塔里
    campaignLv,   // 🧭 主线进度跟着存档走
    bossAlive: boss ? 1 : 0, bossHp: boss ? boss.hp : 0,
    pets: pets.map(p => p.key), dex: dexCounts, bought: player.bought, skillSlots,
    mapShops, endlessRound, endlessWave, waveKills,
    chest: chest && { x: chest.x, y: chest.y, taken: chest.taken }, pendingNext,
    portal: portal && { x: portal.x, y: portal.y }, portalDone: portalDone ? 1 : 0,   // 🕳️ 山洞位置+打没打过
    faintDone: faintDone ? 1 : 0, townMode: (townMode || dungeonMode || skyMode) ? 1 : 0, townUnlocked: townUnlocked ? 1 : 0, ownedHouse: ownedHouse ? 1 : 0, storage, skin: player.skin, mount: player.mount || null, mountHp: player.mountHp || 0 };   // 🐴 坐骑也跟档走
}
function applySave(s) {
  kills = s.kills || 0; player.gold = s.gold || 0; player.owned = s.owned || {};
  player.job = s.job || null;   // 🥷 职业回来
  player.job2 = s.job2 || null;   // 🌟 副职业也回来
  towerMode = s.towerMode != null ? !!s.towerMode : s.level === 8;   // 🗼 老存档没这字段：level 8 一律算在塔里（旧无尽）
  campaignLv = s.campaignLv || (s.towerMode ? 8 : s.level) || 1;   // 🧭 老存档：塔里的算通关过，塔外的按当前关
  player.offhand = (s.offhand && ALLITEMS[s.offhand]) ? s.offhand : null;   // ⚔️ 副手回来（只认全物品表里的）
  player.diamonds = s.dia || 0; updateDia();   // 💎 钻石回来
  player.slots = s.slots || { off: 0, pet: 0, skill: 0 };   // 🧩 扩展槽回来
  player.items = s.items || {};   // 🍗 道具袋回来
  player.mana = s.mana != null ? Math.min(100, Math.max(0, s.mana)) : 100; updateMana();   // 🔵 蓝条回来
  player.offhands2 = (s.off2 || []).filter(k => ALLITEMS[k]);   // ⚔️ 额外副手回来
  player.bought = s.bought || Object.assign({}, player.owned);   // 🎒 老存档没有 bought：拿 owned 顶上
  {   // 🎽 老存档槽位超编检查：多穿的自动脱下进背包（头盔1/胸甲2/靴子1/小件5）
    const seen = { helm: 0, chest: 0, boots: 0, trinket: 0 };
    for (const g of Object.keys(player.owned)) {
      if (!player.owned[g] || ALLKIND[g] !== 'gear') continue;
      const sl = gearSlot(g);
      if (++seen[sl] > SLOT_CAP[sl]) player.owned[g] = false;
    }
  }
  if (s.music != null) { musicOn = !!s.music; document.getElementById('gearMusic').textContent = musicOn ? '🎵 音乐：开' : '🔇 音乐：关'; }
  if (!!s.rot !== rotated) toggleRotate();   // 🔄 转屏状态跟着存档走
  bossAt = s.bossAt || 100; level = (s.level >= 1 && s.level <= 12) ? s.level : 1;   // 🐛 关卡钳制跟着主线走（12 关时代）
  fixOldBought();   // 🌈 老存档的武器/装备升级成正式品质条目
  endlessRound = s.endlessRound || 1; endlessWave = s.endlessWave || 1; waveKills = s.waveKills || 0;   // 🌀 无尽进度回来
  chest = s.chest || null; pendingNext = s.pendingNext || null;   // 🎁 没开的宝箱回来
  faintDone = !!s.faintDone; townMode = !!s.townMode; townUnlocked = !!s.townUnlocked; ownedHouse = !!s.ownedHouse; storage = s.storage || {}; inRoom = false;   // 💉🏡 剧情进度回来（进门状态不存）
  if (s.skin) player.skin = s.skin;   // 🎨 捏人形象读档回来（老档没有就用默认配色）
  player.mount = s.mount || null; player.mountHp = s.mountHp || 0; player.mountCd = 0;   // 🐴 坐骑读档回来
  dungeonMode = false; dgnKills = 0; dgnKingSpawned = false; dgnExit = null;   // 🌲 副本不跟档走：读档永远落在副本外
  skyMode = false; fishState = null; bobber = null;   // ☁️ 天空城也不跟档走
  if (level === 8 && (endlessRound > 3 || (endlessRound === 3 && endlessWave > 1))) { townUnlocked = true; faintDone = true; }   // 🏡 过了剧情点的老存档：直接解锁小镇
  if (townMode) placeTownShops(); else if (Array.isArray(s.mapShops) && s.mapShops.length === 2) mapShops = s.mapShops;   // 🏪 小镇摆商店街，冒险用存档商店
  player.weapon = (s.weapon && ALLITEMS[s.weapon]) ? s.weapon : null;   // 🌈 武器全继承：读全物品表
  applyGear(); hurtT = 0; deathT = 0;   // 读档不触发后仰/倒下
  player.hearts = Math.min(player.maxHearts, Math.max(1, s.hearts || player.maxHearts));
  prevHearts = player.hearts;   // 要在血量恢复之后再对表
  zombies = []; garrows = []; meteors = []; puddles = []; shocks = []; netOrbs = null;   // 读档清场重摆
  minions = []; turrets = []; freezeAllT = 0;   // ☠️🧲⏳ 职业召唤物/冻结不跟档走（重进重新攒）
  if (s.bossAlive) {   // 👹 存档时场上有 BOSS：立刻召唤回来，血还是原来那些
    spawnBoss();
    const b = zombies[zombies.length - 1];
    if (s.bossHp > 0 && s.bossHp < b.hp) b.hp = s.bossHp;
    bossAt = kills + 100;   // 下一只 BOSS 从 100 杀后再算
    setBanner('👹 ' + LEVELS[level].bossName + '回来了！');
  }
  for (let i = 0; i < 3 && !townMode; i++) spawnEnemy();   // 小怪也先来三只，世界不空（🏡小镇不刷怪）
  pets = []; for (const k of s.pets || []) { const d = ALLPETS[k]; if (d) pets.push({ key: k, name: d.name, icon: d.icon, dmg: d.dmg, cd: d.cd, range: d.range, spec: d.spec, x: player.x, y: player.y, atkT: 0, wagT: Math.random() * 9, animT: 0, state: 'wander', face: 1, restT: 0 }); }   // 🐾 宠物回来（动画字段也要带齐，不然读档第一帧就炸）
  skillSlots = (s.skillSlots || Object.keys(player.bought).filter(k => ALLKIND[k] === 'skill').slice(0, 5)).filter(k => player.bought[k]);   // ✨ 上阵技能回来（老存档默认前 5 本上阵）
  dexCounts = s.dex || {};   // 📖 图鉴回来
  coins = [];
  portal = s.portal || null; portalDone = !!s.portalDone;   // 🕳️ 山洞原样回来（打过就不刷了）
  if (!portal && !portalDone && !townMode) placePortal();   // 老存档没记过山洞：才新刷一个
  if (!Array.isArray(s.mapShops) || (s.mapShops.length !== 2 && !townMode)) { if (!townMode) placeShops(); }   // 🏪 存档没商店就重摆
  renderSkills();   // ✨ 读档后技能按钮跟着来
  updateJobSwap();   // ⇄ 主副切换钮跟着来
  updateScore(); updateGold();
}
let saveGen = 0;
const SAVE_KEY_TOWN = 'zombie_fight_save_town';   // 🏡 小镇独立自动存档
function saveGame() {
  if (sandboxMode) return;   // 🔮 旁观者模式不写档：一切数据退出即清
  if (pvpMode && !skyMode) return;   // 📡 老 PVP 不写主档；☁️天空城要写（钓鱼卖鱼的钱得留住）
  try {
    const data = JSON.stringify(packSave());
    if (townMode || dungeonMode || skyMode) { localStorage.setItem(SAVE_KEY_TOWN, data); return; }   // 🏡🌲☁️ 在小镇/副本/天空城：只写小镇档，不动冒险自动档
    saveGen = 1 - saveGen;
    localStorage.setItem(SAVE_KEY + '_g' + saveGen, data);   // 🧬 双代轮换：先写新一代
    localStorage.setItem(SAVE_KEY, data);                    // 再写主档（写坏主档也有上一代兜底）
  } catch (e) {}
}
function loadGame() {
  const s = readSave((townMode || dungeonMode || skyMode) ? SAVE_KEY_TOWN : SAVE_KEY);   // 🐛 修"回前台掉回第一关"：在哪个世界读哪个档
  if (!s) return false;
  applySave(s);
  return true;
}
function readSave(key) {   // 🧬 主档坏了自动翻上一代/备份，永远不让存档"消失"
  for (const k of [key, key + '_g1', key + '_g0', key + '_bak']) {
    try { const s = JSON.parse(localStorage.getItem(k) || 'null'); if (s && typeof s === 'object' && s.kills != null) return s; } catch (e) {}
  }
  return null;
}
function writeSlot(i, data) {
  try { localStorage.setItem(SLOT_KEY(i) + '_bak', data); localStorage.setItem(SLOT_KEY(i), data); } catch (e) {}
}
/* 切到后台：立刻存一次；切回前台：同步最新存档（防止后台旧页面把新进度盖掉） */
addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); else loadGame(); });
