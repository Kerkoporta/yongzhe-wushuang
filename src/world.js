'use strict';
/* ================= 🎁 BOSS 宝箱（走近自动开：三选一；开完问要不要进下一关） ================= */
let chest = null, pendingNext = null;   // chest={x,y,taken}；pendingNext='level'|'endless'
let chestLatch = false, roomLatch = false, plazaSeen = false;   // 🎁🏠⛲ 触发闩锁与发现标记
function rollLoot() {
  const out = [], used = {};
  const kinds = ['weapon', 'gear', 'skill', 'pet'];
  let guard = 0;
  while (out.length < 3 && guard++ < 60) {
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const pool = Object.keys(ALLITEMS).filter(k => ALLKIND[k] === kind && !used[k] && (kind === 'weapon' || kind === 'gear' ? !invB(k) : !player.bought[k]));
    if (!pool.length) continue;
    const key = pool[Math.floor(Math.random() * pool.length)]; used[key] = true;
    let tier = 0;
    if (kind === 'weapon' || kind === 'gear') { const r = Math.random(); tier = r < 0.6 ? 0 : r < 0.9 ? 1 : 2; }   // 粗糙(灰) 60% 普通(白) 30% 优秀(绿) 10%
    out.push({ key, tier });
  }
  return out;
}
function openChest() {
  chest.loot = rollLoot(); chest.taken = true; paused = true;
  if (!player.job) chest.loot[0] = { key: 'awaken_stone', tier: 0 };   // 🌟 没觉醒职业？每关宝箱保底一颗觉醒石（恩泽定的规矩）
  document.getElementById('chest').style.display = 'flex';
  document.getElementById('chestNext').style.display = 'none';
  document.getElementById('chestHint').textContent = '三选一！点一张拿走';
  const lo = document.getElementById('chestLoot'); lo.style.display = 'grid';
  lo.innerHTML = chest.loot.map((L, i) => {
    const d = ALLITEMS[L.key], kind = ALLKIND[L.key];
    const tb = (kind === 'weapon' || kind === 'gear') ? `<div style="color:${TIERS[L.tier].c};font-weight:bold">［${TIERS[L.tier].n}级］</div>` : '';
    const kn = { weapon: '🗡️武器', gear: '🛡️装备', skill: '✨技能', pet: '🐾宠物', awaken: '🌟职业' }[kind];
    return `<button class="chestIt" data-loot="${i}"><div style="font-size:34px">${d.icon}</div><div style="font-weight:bold;font-size:13px">${d.name}</div>${tb}<div style="font-size:10px;opacity:.7">${kn}</div><div style="font-size:11px;opacity:.85">${d.desc}</div></button>`;
  }).join('');
  for (const b of lo.querySelectorAll('button[data-loot]')) b.onclick = () => takeLoot(+b.dataset.loot);
  beep(700, 1100, 0.3, 'sine', 0.18);
}
function takeLoot(i) {
  const L = chest.loot && chest.loot[i]; if (!L) return;
  const kind = ALLKIND[L.key];
  if (kind === 'awaken') {   // 🌟 觉醒石：第一颗主职业，第二颗副职业，之后重 roll 副职业（不许挑！）
    const pool = JOB_LIST.map(j => j[0]).filter(j => j !== player.job && j !== player.job2);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!player.job) { player.job = pick; jobGift(pick); }
    else player.job2 = pick;
    for (let j = 0; j < 30; j++) burst(player.x + (Math.random() - 0.5) * 120, player.y + (Math.random() - 0.5) * 120, ['#b48af2', '#ffd24a', '#ffffff'][j % 3]);
    beep(600, 1200, 0.3, 'sine', 0.18); setTimeout(() => beep(800, 1600, 0.3, 'sine', 0.16), 200);
    applyGear(); player.hearts = Math.min(player.hearts, player.maxHearts);
    updateJobSwap();
  }
  else if (kind === 'weapon' || kind === 'gear') addToInv(L.key, L.tier);
  else if (kind === 'skill') { player.bought[L.key] = true; player.owned[L.key] = true; if (skillSlots.length < skillMax() && !skillSlots.includes(L.key)) skillSlots.push(L.key); else setBanner('✨ 技能位满啦，它在背包里休息'); renderSkills(); }
  else if (kind === 'pet') { player.bought[L.key] = true; player.owned[L.key] = true; addPet(L.key); }
  if (kind === 'awaken') { const just = JOB_LIST.find(x => x[0] === (player.job2 || player.job)); setBanner('🌟 觉醒成功！【' + just[1] + ' ' + just[2] + '】' + JOB_DESC[just[0]] + (player.job2 ? '（点左上角 ⇄ 切换主副职业）' : '')); }
  else setBanner('🎁 拿到 ' + ALLITEMS[L.key].name + '！');
  beep(880, 1320, 0.2, 'square', 0.14);
  chest.loot = null;
  document.getElementById('chestLoot').style.display = 'none';
  document.getElementById('chestHint').textContent = '拿好啦！';
  saveGame();
  if (pendingNext) document.getElementById('chestNext').style.display = 'block';   // 🗺️ 问要不要进下一关
  else closeChest();
}
function askNext() {   // 宝箱开过了但还没走：再靠近只问下一关
  paused = true;
  document.getElementById('chest').style.display = 'flex';
  document.getElementById('chestLoot').style.display = 'none';
  document.getElementById('chestHint').textContent = '宝箱开过了';
  document.getElementById('chestNext').style.display = 'block';
}
function closeChest() { document.getElementById('chest').style.display = 'none'; paused = false; }
function goNextLevel() {   // 🗺️ 真正过关（旧自动过渡搬到这里）
  if (!pendingNext) return;
  const what = pendingNext; pendingNext = null; chest = null;
  if (what === 'level') {
    level++; campaignLv = level;   // 🧭 主线进度推进
    setBanner((level === 2 ? '❄️ 第二关：骷髅雪原！' : level === 3 ? '👻 第三关：鬼魂地狱！' : level === 4 ? '🌋 第四关：熔岩火山！' : level === 5 ? '⛈️ 第五关：天空雷域！' : level === 6 ? '🕳️ 第六关：虚空之境！' : level === 8 ? '💀 第八关：凋零之地！凋灵骷髅大举入侵！' : level === 9 ? '🐉 第九关：末影之地！没有小怪，只有末影龙！' : level === 10 ? '🧨 第十关：苦力怕矿洞！听脚步声，嘶嘶响就跑！' : level === 11 ? '🟢 第十一关：史莱姆沼泽！打死还会分裂！' : level === 12 ? '👿 第十二关：深邃古城！别乱动——坚守者瞎但听得见！' : '💎 第七关：水晶洞窟！') + '全部家当都继承，商店已刷新！');
  } else {   // what === 'town'：主线通关→剧情→进小镇（🗼 试炼塔在小镇广场南边）
    townUnlocked = true; setBanner('🏆 主线通关！宁静小镇开启，试炼塔在等你！');
    for (const o of zombies) o.dead = true;
    player.hearts = player.maxHearts; updateGold(); revivePets(); updateScore(); saveGame();
    setTimeout(startFaint, 900);
    return;
  }
  for (const o of zombies) o.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = [];
  player.angelUsed = false; player.skillCds = {}; applyGear(); renderSkills();
  player.hearts = player.maxHearts; updateGold(); revivePets();   // 🐾 过关复活伙伴
  placePortal(); placeShops(); updateScore();
  if (level === 9 && !towerMode) spawnBoss();   // 🐉 末影之地进门就决战（清场之后才召龙！）
  beep(600, 1200, 0.5, 'sine', 0.2); saveGame();
}
/* ================= 🌅 开场剧情：我在哪儿→"你醒了"→宁静小镇（新冒险第一眼） ================= */
let faintDone = false, townMode = false, townUnlocked = false, ownedHouse = false, inRoom = false, storage = {};
const INTRO_LINES = [   // 📜 神秘人的话（点一下换一句）
  '你醒了。',
  '你在森林边上晕倒了，是我把你背回来的。',
  '外面现在到处是怪物……不安全。先在小镇歇歇吧。',
  '养好了就从镇子的城门出发——东边的草原，等着勇者呢。',
];
function startFaint() {   // 🌅 开场剧情（新冒险第一眼；老触发点：faintDone 后自动跳过）
  if (faintDone) return; faintDone = true;
  const el = document.getElementById('faint'), txt = document.getElementById('faintTxt'), npc = document.getElementById('faintNpc'), dlg = document.getElementById('faintDlg');
  paused = true;
  el.style.display = 'flex'; el.style.background = 'rgba(0,0,0,1)';
  txt.style.opacity = 0; txt.textContent = '……我在哪儿？';   // 🌑 黑屏，主角心里犯迷糊
  npc.style.display = 'none'; dlg.style.display = 'none';
  beep(200, 120, 0.8, 'sine', 0.12);
  setTimeout(() => { txt.style.transition = 'opacity 1.2s'; txt.style.opacity = 1; }, 600);   // 「我在哪儿」慢慢浮出来
  setTimeout(() => {   // 💡 亮起来：是温暖的小屋，神秘人坐在旁边
    el.style.background = 'rgba(26,20,12,.96)'; txt.style.opacity = 0;
    npc.style.display = 'block'; dlg.style.display = 'flex';
    beep(400, 700, 0.3, 'sine', 0.15);
    let li = 0;
    dlg.innerHTML = '<div id="introTxt" style="font-size:18px;font-weight:bold;margin-bottom:10px;min-height:52px">' + INTRO_LINES[0] + '</div>'
      + '<button id="introNext">▶ 继续</button>'
      + '<button id="introSkip" style="margin-top:6px;opacity:.75">⏭ 跳过剧情</button>';
    const goTown = () => { document.getElementById('faint').style.display = 'none'; saveGame(); enterTown(); setBanner('🚪 想出镇冒险？走到镇子下方的城门，或打开装备面板点「出发战斗」！'); };
    document.getElementById('introNext').onclick = () => {   // 点一下换下一句，说完进镇
      li++; beep(600, 900, 0.06, 'sine', 0.08);
      if (li >= INTRO_LINES.length) { goTown(); return; }
      document.getElementById('introTxt').textContent = INTRO_LINES[li];
      if (li === INTRO_LINES.length - 1) document.getElementById('introNext').textContent = '🏡 在小镇歇下';
    };
    document.getElementById('introSkip').onclick = goTown;   // ⏭ 急性子直接进镇
  }, 2600);
}
document.getElementById('faintRun').onclick = () => {   // （旧按钮已不在剧情里出现，保险留一个关掉面板的出口）
  document.getElementById('faint').style.display = 'none'; paused = false;
};
document.getElementById('faintStay').onclick = () => {   // 同上
  document.getElementById('faint').style.display = 'none'; paused = false;
};
/* ================= 🏡 宁静小镇（马路+商店街+小家） ================= */
function enterTown() {
  townMode = true; townUnlocked = true; inRoom = false; paused = false; towerMode = false;   // 🗼 出塔回镇
  dungeonMode = false; dgnExit = null;   // 🌲 保险：从副本回来也算回镇
  for (const z of zombies) z.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = []; chest = null;
  player.x = WORLD.w / 2; player.y = WORLD.h / 2 - 200;
  placeTownShops(); spawnTownNpcs(); applyGear(); updateScore();   // 🏡 装备失效+村民上街
  mazeChest = true; runOn = false; arenaOn = false;   // 🎡 迷宫宝箱补货，跑酷/擂台收摊
  setBanner('🏡 宁静小镇：随便逛！马路两边全是商店（小镇里装备会休息哦）'); saveGame();
}
function exitTown() {   // ⚔️ 继续刷怪=永远回主线（试炼塔只能走到塔门口进）
  townMode = false; inRoom = false; paused = false; sittingBench = null;   // 🪑 回战场不能坐着
  dungeonMode = false; dgnExit = null;   // 🌲 保险
  towerMode = false; level = campaignLv;   // 🧭 回主线：恢复到第几关
  for (const z of zombies) z.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = [];
  player.x = WORLD.w / 2; player.y = WORLD.h / 2;
  placeShops(); placePortal(); applyGear(); updateScore();   // ⚔️ 回来装备重新生效
  setBanner('⚔️ 回到主线：第' + level + '关·' + LEVELS[level].name + '，接着闯！');
  saveGame();
}
function enterTower() {   // 🗼 走到塔门口才能进：无尽进度接着刷（不清遍数）
  townMode = false; inRoom = false; paused = false; towerMode = true; level = 8;
  dungeonMode = false; dgnExit = null;   // 🌲 保险
  for (const z of zombies) z.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = [];
  player.x = WORLD.w / 2; player.y = WORLD.h / 2;
  placeShops(); placePortal(); applyGear(); updateScore();
  setBanner('🗼 试炼塔：第' + endlessRound + '遍·第' + endlessWave + '波，接着刷！死了就掉下来，比比谁爬得高！');
  beep(300, 700, 0.4, 'sawtooth', 0.2); saveGame();
}
document.getElementById('gearFight').onclick = () => { toggleGear(false); exitTown(); };
document.getElementById('gearTown').onclick = () => { toggleGear(false); enterTown(); };
/* ================= 🌲 哥布林森林（小镇副本①）：杀 12 只哥布林引出哥布林王；倒下=被抬出副本，不是真死 ================= */
const DGN_GATE = { x: 1520, y: 1840 };   // 🌲 副本入口：小镇广场东边
const DGN_GOAL = 12;   // 杀满 12 只哥布林出王
/* 🌲 哥布林森林副本（收进 Dgn 对象，不占全局） */
const Dgn = {
makeGoblin(x, y) { return { id: _id++, x, y, hp: 5, r: 10, goblin: true, dead: false, flash: 0, walkT: Math.random() * 9, kind: 'goblin' }; },

   // 🌲 哥布林：绿皮尖牙木棍，5 血
spawnGoblin() { const s = pickSpawn(player, Math.random); zombies.push(Dgn.makeGoblin(s.x, s.y)); },

spawnDgnKing() {   // 👑 哥布林王登场
  dgnKingSpawned = true;
  const pos = pickSpawn(player, Math.random);
  const b = makeBoss(pos.x, pos.y);
  b.dgnKing = true; b.kind = 'bossDgn'; b.hp = b.maxHp = 300;
  zombies.push(b);
  setBanner('👑 哥布林王来了！它的鞭子一扫就是 5 血，看到红区快跑！'); beep(90, 45, 0.7, 'sawtooth', 0.25); shakeT = 0.5;
},

enterDungeon() {   // 🌲 进副本
  dungeonMode = true; townMode = false; inRoom = false; paused = false; sittingBench = null;
  dgnKills = 0; dgnKingSpawned = false; dgnExit = null; spawnT = 1;
  for (const z of zombies) z.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = []; chest = null;
  player.x = WORLD.w / 2; player.y = WORLD.h / 2;   // 林子中央落地
  applyGear(); updateScore();   // ⚔️ 副本里装备火力全开
  setBanner('🌲 哥布林森林！杀 ' + DGN_GOAL + ' 只哥布林引出哥布林王！倒下会被抬出副本'); beep(300, 700, 0.4, 'sawtooth', 0.2);
  saveGame();
},

exitDungeon(dead) {   // 🌲 出副本：回小镇门口
  dungeonMode = false; townMode = true; inRoom = false; paused = false; dgnExit = null;
  for (const z of zombies) z.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = []; chest = null;
  player.x = DGN_GATE.x - 90; player.y = DGN_GATE.y;
  placeTownShops(); spawnTownNpcs(); applyGear(); updateScore();   // 🏡 回小镇：装备休息、村民回来
  if (dead) { setBanner('😵 你被哥布林抬出了副本……回镇练强点再来！'); beep(300, 150, 0.5, 'sawtooth', 0.18); }
  else { setBanner('🌲 副本通关凯旋！小镇欢迎英雄！'); beep(600, 1200, 0.5, 'sine', 0.2); }
  saveGame();
},

dgnDie() {   // 😵 副本里倒下≠真死：抬出副本+回半血
  player.hearts = Math.max(1, Math.round(player.maxHearts / 2)); player.inv = 1.5;
  Dgn.exitDungeon(true);
},

/* 👑 哥布林王：更大更壮，手臂缠着鞭子——横扫一鞭 5 血（红色扇形预警 0.7 秒，跑出红区就没事） */
dgnKingTick(z, dt) {
  z.walkT += dt;
  const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx, dy) || 1;
  if (!z.whip) zombieStep(z, player, dt, 0.85);   // 抡鞭子时站住
  z.whipCd = (z.whipCd == null ? 2.5 : z.whipCd) - dt;
  if (!z.whip && z.whipCd <= 0 && d < 210) {
    z.whip = { warn: 0.7, ang: Math.atan2(dy, dx) };   // 锁定方向甩鞭
    setBanner('👑 哥布林王甩鞭子了！快跑出红区！'); beep(300, 150, 0.25, 'sawtooth', 0.2);
  }
  if (z.whip) {
    z.whip.warn -= dt;
    if (z.whip.warn <= 0) {
      const wa = z.whip.ang; z.whip = null; z.whipCd = 6;
      z.whipFx = 0.28; z.whipFxA = wa;   // 鞭影留一瞬
      shakeT = 0.4; beep(180, 60, 0.3, 'sawtooth', 0.25);
      const pd = Math.hypot(player.x - z.x, player.y - z.y);
      if (pd < 175 && player.inv <= 0 && !(player.tpT > 0)) {
        const pa = Math.atan2(player.y - z.y, player.x - z.x);
        const da = Math.abs(((pa - wa) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        if (da < Math.PI * 5 / 12) {   // 150° 横扫扇形（±75°）
          player.hearts -= rollDmg(5); player.inv = 1; player.sinceHurt = 0; player.regenT = 0;
          burst(player.x, player.y, '#e84a4a', 16); shakeT = 0.6;
          setBanner('💥 被鞭子抽中！掉 5 血！'); beep(150, 50, 0.35, 'sawtooth', 0.25);
          if (player.hearts <= 0 && !angelSave()) { Dgn.dgnDie(); return; }
        }
      }
    }
  }
  if (z.whipFx > 0) z.whipFx -= dt;
  const dmgK = rollDmg(1);   // 平时撞到=1 心
  if (touchHurt(player, z, dmgK)) {
    beep(260, 100, 0.2, 'sawtooth', 0.16); burst(player.x, player.y, '#5a8a2a', 8);
    if (player.hearts <= 0 && !angelSave()) { Dgn.dgnDie(); return; }
  }
}
};






/* 🧑‍🤝‍🧑 小镇村民（CPU：在家附近溜达的像素小人） */
const NPC_PX = new Image(); NPC_PX.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAjCAYAAAB2KjFhAAAEeElEQVR42uWVS28bVRSAv2uPx89MHNd5mKaPtAoEQluJFFBIaESoBAQhlbZSihRKN0ViRVmA2MCCPwCsWZZNJCClSO2iUaVWjipaKtJHUFLUpm0cHCdpYo/tsT2T6bCYeGwnrtiwQRxpdOfo3vPNed0zgir55suPOfXVtwjg2InjGNllPA3R8rZV1j8feVvsOzjMRhEbQUePDDG7kLGKmTRZNbfJoEEJ4WsME/JKXL54SbzQ18f1iYkKrAx678Rx7vx51wIoZtLUE1PLoa1VwFO3p0SNZ0ePDNHf3clYfNLKldYIeSXHuLkp6IRqZJcBWFrNkyutUcyk2R1r4pcLcWEBYmBwgEsXLzEwOGBVA4DqfAHw18MH5Eq2W9UfbHSb4uyFeCXMXx+uWvXCMrLLzC5k2JjDgIQTbkCC6XsPhAQwFp+0qj2aXchQzlsZYOia7a0cAGyQoWtYpo7hlhGAuDE+yvCHn1kZTUM39Bqv1gyB5Kl1WPbINbpu6MgemZF3XhfS96NjVIPM9dXtkTeBADTNQFBydJ/Xhs+uqLhGht/FIweQPTIelw3xee13c/2rwWCYYDCM7JFrQKZpktcKWKaOrqpIAM3b2sknE7gDLfgaw07JZUXh6rUpGpQQWTWHRw7Q1/ci8csT5LUCwYAf4/F6+IqCq1zm1p07ibZECXkloi1RBnt7AMjn0zxKJVDTi+TzaToiCu8feovtHZ3ktQIeF8j+MF989IHdGt3Pd7OyvGjpho7HBVta29m7v4ebv13nj9tTNCp+J7QDL/dwN7kKwLPP7CB+eQLhlkkuLAkXwFDvHixTpy3WTv+BPvbu78HILmNqOdramsmoBTJqAdM0mZyZY3esiaHePXREFAAi0RYB2DlLGDLCLZNVc/R3dzKfTEFEoX/kEPPJFDP3E45ng709zCdTbI21MhafpFjSOXn4IKduT1Xu5tVrU9bqoySvvfJSjcGTZD6Z4rvRnwHIqAVhgV2A/u5ODF0j1NDI5MzcP4IAZu4nME0TfyDE5PhoZWp07dphpbNphFsmEm0hq+YYfqO3BjifTAGwNdbKfDLF6TPnCTeExcy9B5RbW3x68hinz5y38lrBMXS73aTVgjh6ZAiwz3ZEFGZXVHRV5eyFuDPDZF8XerEdGMd17sotiiXdgZSviAB++PEcS6t5J6wySKznWQB6cRoYtz2LtTVT0HJW9RVp2hIjW9xqD/7i77RFW3h69zbu3J0juZzB5XsOgFLRbv81PS3efDVaHyYF97OrU7A0l2Bh0Y9lPiTgty+0QRden6teTYRUzklZXG57Xi3NJTB0DUmO4fVFyKsrAAQVF6XiY9b0NJIcrgZbkmXqmKZZBbPXhUU/4Ceo2IclOVyZc3oaoziNXw4Ddsh5daXyq6uWG+OjVu/hr/H6XE5equXKT5+w7+DwJlupHgjAKNzEKDy5aW+Mj1obgZsyWT4g3NudxzA0Ua1Xn6v7R98osq/LKYxenBYb9Xo2Lv5F+Z/ApCdt7Hqq0hfT9zbr/60w/wYBqgLiUsY4DQAAAABJRU5ErkJggg==';   // 🚶 神秘人像素版帧1（全身带腿）
const NPC_PX2 = new Image(); NPC_PX2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAjCAYAAAB2KjFhAAAEfElEQVR42uWVT2wUVRzHP292d2baaXe7tLublgqkpKGAlmDRELIChcIBGoNAT0iAcDIe0IMXLoaQeCVy9GL0Wo3RQIhJwyqBgAGkUCxVZNOWSLN/2u3+mXZ2ZrfjYZnpbukmHrwYv8nL5M17v8/7/X7zfr8RVOnzTz/m3IVLCODE6ZMUCxmUpqCzbDvz86feFVv6h1gpsRI0dHyQeDJvW5lZsjnd3WhZJgBtrUF8wVYCskRsJCbe3L2H+zd+XoY5oPdPn+RJfNq2MrMuJJvTCfi1mrmjgF/j0dhjUePZ0PFBolu7+Tr2q13tdkCWaG3R3FCLhQwAs/M6WXMJKzNLWyREbCQmbEDsG+jn+kiMfQP9Lqi1peJJVb4oFjIupPowx6nrI7HlMO9Ope2VCa0GODm0LBOfT67JpV/1MRGfFF6A72+N2tUexZN5nLw5gJVy3tklnZyhIQAxHhvm6NlP7GxhHmuJfyxZ1rBLOtYS+CQ4c+yw8H721Q9kC/MYRhGPrFA2iwB4ZGVViLO++PKpqgrCq/E0lUV6a30bckMQVVXwSRWIqiquoU8CTQuiaUFkWasFl2103cAu6ZTyOaQDe3cR8GsEmloIRTrpaO8kFOnknb5eBg7uR24IEvBrbo4GDu5HVRXKZRtNU5EbVAC8zX68AG2REFmztfpTs7mrg6epLLqeQdczlM1KGpSmIGeOHebKzYdMxv9E01SEV+PCh6cqV6P3jddJz2Zs09TxSRCKdNLbt51H9x8wNvaYFn8D5bKNxyPY/vZO0okUABs71nDnwSOEV+PFi7+EBDAY3YZp6nS0dxLdHaW3bzvFQgZTL9DesZb53CKGVcnRxPgftEVCDEa3obWvd+pVAJUwpxclfFLlTkW3dpNIJqEhQPTkeySSSZ7En7vh793ZRyKZJBIOc+fWKIZR5OzRA5wbe1yBFQsZ5IYgmfQMP9257xoARMJhIuHwK1ckkUxy7/ZtPB7BRxcuASABRLd2Y1kmks/PL2PP3JPrKRIO8yT+HMOq3LPfYsPLXaOna4Odzs1TKsmsey1MNqdz4tAuF+h46YASySRffnuVQFOL+D0+iVPU4vwHJ/hi+KptLhoYVuWlpgoyuUUxdHyQUj5ne5v9KE1B9JkpAL778Ybbw2S1B9PoBEaQrtx86JaI6qsMj6wggOFvrpAteyjlczUg8bIHCsA0JoCRimcdHWtZLMzZ1SXSFGhlweqqbCjeI9IWYXP3Op69mGP6eRJ8mwAwTSgVUwDi8J4woj3cgmEUa3qZrexg42aJ9NQ0MwkFliZRfSD5/Jj2JmR51e8ivIC92kp6appsVserdAIhjGIKytDYDAv5FI3qHAvGGhqbQwAs5FO25Fa/URm21IxpwkxCYcFY48K9SsgNDSA7n6RRnVv9V+doPDZs7zhy+WUDXDauVqmYYvTaRbb0D4m6sPHYsBvyjiOXKS3efZUkbWD02kV3uhJIPaCs9tgrx2r76oZZ0+erjB2ZxkRdG4l/Uf8TWN1k9nRtsOutTcQnxX8rzL8BfUELecva2pkAAAAASUVORK5CYII=';   // 🚶 帧2（迈步）
let npcs = [];
function spawnTownNpcs() {
  npcs = [];
  const spots = [[700, 1090], [900, 1310], [1400, 1080], [1700, 1300], [1050, 950], [2000, 1180]];
  const colors = ['#e84a4a', '#4a8af2', '#ffd24a', '#8a5ac8', '#5ac85a', '#ff8af2'];
  const skins = ['#f0c8a0', '#e8b88a', '#d8a878'];
  for (let i = 0; i < spots.length; i++) npcs.push({ x: spots[i][0], y: spots[i][1], hx: spots[i][0], hy: spots[i][1], c: colors[i], skin: skins[i % 3], tx: null, ty: null, restT: Math.random() * 2, walkT: Math.random() * 9, face: 1 });
  npcs.push({ x: 1200, y: 1450, hx: 1200, hy: 1500, img: true, tx: null, ty: null, restT: 1, walkT: 0, face: 1 });   // 🚶 神秘人：住在小镇啦（广场北边溜达）
}
function npcsTick(dt) {
  for (const n of npcs) {
    n.walkT += dt;
    if (n.tx == null || (Math.abs(n.x - n.tx) < 4 && Math.abs(n.y - n.ty) < 4)) {
      n.restT -= dt;
      if (n.restT <= 0) { n.tx = n.hx + (Math.random() - 0.5) * 320; n.ty = n.hy + (Math.random() - 0.5) * 220; n.restT = 1.5 + Math.random() * 3; }
    } else {
      const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy) || 1;
      n.x += dx / d * 60 * dt; n.y += dy / d * 60 * dt;
      n.face = dx < -0.5 ? -1 : 1;
    }
  }
}
/* 🏘️ 小镇装饰画法（收进 TownArt 对象，不占全局） */
const TownArt = {
drawVillager(n) {   // 像素小人：腿交替+手臂摆动；img 款=神秘人像素立绘
  const moving = n.tx != null && (Math.abs(n.x - n.tx) > 4 || Math.abs(n.y - n.ty) > 4);
  const step = moving ? Math.sin(n.walkT * 8) : 0;
  ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(n.x, n.y + 1, n.img ? 10 : 7, 3, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(Math.round(n.x), Math.round(n.y)); if (n.face < 0) ctx.scale(-1, 1);
  if (n.img) {   // 🚶 神秘人：抠图像素版（自带下半身），1:1 像素不模糊，走路两帧交替
    const bob = moving ? Math.abs(Math.sin(n.walkT * 8)) * 2 : 0;
    const fr = (moving && Math.sin(n.walkT * 8) > 0) ? NPC_PX2 : NPC_PX;
    if (fr.complete && fr.naturalWidth) ctx.drawImage(fr, -10, -33 - bob, 19, 35);
    ctx.restore(); return;
  }
  ctx.fillStyle = '#3a3a4a'; ctx.fillRect(-5 + (step > 0 ? 1 : -1), -8, 4, 8); ctx.fillRect(1 + (step > 0 ? -1 : 1), -8, 4, 8);   // 腿
  ctx.fillStyle = n.c; ctx.fillRect(-7, -18, 14, 11);   // 衣服
  ctx.fillRect(-9, -17 + (step > 0 ? 1 : -1), 3, 8); ctx.fillRect(6, -17 + (step > 0 ? -1 : 1), 3, 8);   // 手臂
  ctx.fillStyle = n.skin; ctx.fillRect(-5, -27, 10, 10);   // 头
  ctx.fillStyle = '#5a4632'; ctx.fillRect(-5, -29, 10, 4);   // 头发
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(1, -23, 2, 2);   // 眼
  ctx.restore();
},

drawBench(x, y, face) {   // 整条长椅（靠背在远离喷泉的一侧）
  const bx = face > 0 ? x - 21 : x + 16;
  ctx.fillStyle = '#5a3f24'; ctx.fillRect(x - 15, y - 2, 5, 10); ctx.fillRect(x + 10, y - 2, 5, 10);   // 腿
  ctx.fillStyle = '#8a6a3f'; ctx.fillRect(x - 19, y - 9, 38, 8);   // 坐板
  ctx.fillStyle = '#a8814f'; ctx.fillRect(x - 19, y - 9, 38, 3);   // 坐板亮边
  ctx.fillStyle = '#8a6a3f'; ctx.fillRect(bx, y - 30, 5, 22);   // 靠背板
  ctx.fillStyle = '#a8814f'; ctx.fillRect(bx, y - 30, 5, 4);
},

drawSeated(x, y, face) {   // 🪑 真·坐姿：屁股贴椅面、大腿平放、小腿垂到地面、背靠椅背
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (face < 0) ctx.scale(-1, 1);
  ctx.fillStyle = '#4a7ad4'; ctx.fillRect(-11, -25, 9, 16);   // 躯干（底部正好落在椅面）
  ctx.fillRect(-8, -22, 3, 9);   // 手臂垂放身侧
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(-11, -12, 9, 3);   // 屁股（坐面上）
  ctx.fillRect(-3, -12, 12, 3);   // 大腿向前平伸
  ctx.fillRect(7, -10, 4, 10);   // 小腿垂到地面
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(7, -1, 6, 3);   // 鞋踩地
  ctx.fillStyle = '#f0c8a0'; ctx.fillRect(-10, -33, 8, 8);   // 头
  ctx.fillStyle = '#5a4632'; ctx.fillRect(-10, -35, 8, 3);   // 头发
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-5, -30, 2, 2);   // 眼
  ctx.restore();
},

drawStatue(x, y) {   // 🗿 勇者石像：基座+举剑小人
  ctx.fillStyle = '#7a7a84'; ctx.fillRect(x - 14, y - 8, 28, 8);   // 基座
  ctx.fillStyle = '#8f8f99'; ctx.fillRect(x - 10, y - 14, 20, 6);
  ctx.fillStyle = '#9a9aa4';   // 石像身体
  ctx.fillRect(x - 3, y - 30, 6, 16);   // 身
  ctx.beginPath(); ctx.arc(x, y - 34, 4, 0, 6.3); ctx.fill();   // 头
  ctx.fillRect(x + 3, y - 40, 3, 10);   // 举剑的手臂
  ctx.fillStyle = '#c8c8d4'; ctx.fillRect(x + 4, y - 50, 2, 12);   // 石剑
  ctx.fillStyle = '#6a6a74'; ctx.fillRect(x - 5, y - 20, 10, 2);   // 裙摆线
},

drawLamp(x, y) {   // 💡 路灯
  ctx.fillStyle = '#4a4a52'; ctx.fillRect(x - 2, y - 34, 4, 34);
  ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(x, y - 38, 5, 0, 6.3); ctx.fill();
  ctx.globalAlpha = 0.15; ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(x, y - 38, 13, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
},

drawFlowerBed(x, y) {   // 🌸 花坛：绿叶底+三色小花
  ctx.fillStyle = '#2e6a2e'; ctx.beginPath(); ctx.ellipse(x, y, 26, 16, 0, 0, 6.3); ctx.fill();
  const cols = ['#ff6a6a', '#ffd24a', '#ff9af2'];
  for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 15, y + Math.sin(a) * 9, 2.5, 0, 6.3); ctx.fill(); }
},

drawBush(x, y) {   // 🌿 广场草丛：三团绿
  ctx.fillStyle = '#2e6a2e'; ctx.beginPath(); ctx.arc(x, y, 26, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#3f8a3f'; ctx.beginPath(); ctx.arc(x - 8, y - 6, 16, 0, 6.3); ctx.arc(x + 10, y - 4, 14, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#54a854'; ctx.beginPath(); ctx.arc(x - 4, y - 10, 8, 0, 6.3); ctx.fill();
},

drawFountain(x, y) {   // ⛲ 喷泉：石沿+水面波光+石柱+跳动水珠
  const t = performance.now() / 1000;
  ctx.fillStyle = '#b8b8c0'; ctx.beginPath(); ctx.arc(x, y, 46, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#8a8a94'; ctx.beginPath(); ctx.arc(x, y, 40, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#4ab8f0'; ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#a8e4ff';
  for (let i = 0; i < 3; i++) { const a = t * 1.2 + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 16, y + Math.sin(a) * 12, 3, 0, 6.3); ctx.fill(); }
  ctx.fillStyle = '#b8b8c0'; ctx.fillRect(x - 8, y - 22, 16, 24);
  ctx.fillStyle = '#8a8a94'; ctx.fillRect(x - 10, y - 26, 20, 6);
  for (let i = 0; i < 5; i++) {   // 水珠跳上跳下
    const ph = (t * 2 + i * 0.4) % 1;
    ctx.fillStyle = ph < 0.5 ? '#d8f4ff' : '#8ad8ff';
    ctx.fillRect(x + (i - 2) * 5 - 1.5, y - 26 - ph * 26, 3, 3);
  }
}
};

/* 🪑 广场长椅 + 坐下 */
const BENCHES = [{ x: 1000, y: 1840, face: 1 }, { x: 1400, y: 1840, face: -1 }];   // 喷泉左右各一张，面朝喷泉
let sittingBench = null;
function sitBench(b) {
  sittingBench = b; player.x = b.x; player.y = b.y; player.dir = b.face > 0 ? 0 : Math.PI; player.moving = false;   // 脚线=椅脚线，小腿正好落地
  setBanner('🪑 坐下歇会儿~ 推摇杆起身'); beep(500, 700, 0.1, 'sine', 0.1); saveGame();
}








function placeTownShops() {   // 🛣️ 马路两边排排坐：8 家店 + 房产中介
  mapShops = [];
  const specs = [['weapon', '🗡️ 武器店'], ['gear', '🛡️ 装备店'], ['skill', '✨ 法术店'], ['pet', '🐾 宠物店'], ['weapon', '🗡️ 武器店·二店'], ['gear', '🛡️ 装备店·二店'], ['skill', '✨ 法术店·二店'], ['pet', '🐾 宠物店·二店'], ['dia', '💎 钻石商店']];
  for (let i = 0; i < specs.length; i++) {
    const [kind, label] = specs[i];
    mapShops.push({ x: 480 + i * 205, y: 1200 + (i % 2 ? -110 : 110), kind, label, items: rollShopItems(kind) });
  }
  mapShops.push({ x: 2150, y: 1200 - 110, kind: 'house', label: '🏠 房产中介', items: [] });
  mapShops.push({ x: 250, y: 1200 + 110, kind: 'mount', label: '🐴 马厩', items: [] });   // 🐴 马厩：20 匹坐骑（买/骑/换）
}
function buyHouse() {
  if (ownedHouse || player.gold < 10000) { beep(160, 90, 0.15, 'square', 0.1); return; }
  player.gold -= 10000; ownedHouse = true; updateGold(); saveGame();
  setBanner('🏡 买到小家啦！北边那栋蓝房子就是你的：床=睡觉回满血，柜子=存宝贝');
  beep(660, 990, 0.2, 'square', 0.14); renderMapShop();
}
/* 🗄️ 大柜子：背包⇆柜子存取（武器/装备） */
const storeEl = document.getElementById('store');
function openStore() { paused = true; renderStore(); storeEl.style.display = 'flex'; }
function renderStore() {
  const sb = document.getElementById('storeBag'), sx = document.getElementById('storeBox');
  const it = (k, act, src) => { const d = ALLITEMS[k], b = src[k]; return `<button class="bagIt off" data-${act}="${k}"><span class="bi">${d.icon}</span><span class="bn">${d.name}<span style="color:${TIERS[b.t].c}">·${TIERS[b.t].n}</span></span><span class="bs">${act === 'put' ? '🗄️ 存进去' : '🎒 拿出来'}</span></button>`; };
  const bagKeys = Object.keys(player.bought).filter(k => invB(k));
  sb.innerHTML = bagKeys.length ? bagKeys.map(k => it(k, 'put', player.bought)).join('') : '<div class="htxt">背包空空的</div>';
  const boxKeys = Object.keys(storage);
  sx.innerHTML = boxKeys.length ? boxKeys.map(k => it(k, 'take', storage)).join('') : '<div class="htxt">柜子空空的</div>';
  for (const b of sb.querySelectorAll('button[data-put]')) b.onclick = () => { const k = b.dataset.put; storage[k] = player.bought[k]; delete player.bought[k]; delete player.owned[k]; if (player.weapon === k) player.weapon = null; applyGear(); saveGame(); renderStore(); beep(500, 700, 0.08, 'square', 0.1); };
  for (const b of sx.querySelectorAll('button[data-take]')) b.onclick = () => { const k = b.dataset.take; player.bought[k] = storage[k]; delete storage[k]; player.owned[k] = true; applyGear(); saveGame(); renderStore(); beep(700, 900, 0.08, 'square', 0.1); };
}
document.getElementById('storeClose').onclick = () => { storeEl.style.display = 'none'; paused = false; };
/* 🛏️ 床：睡觉回满血+存档 */
const bedEl = document.getElementById('bed');
function askBed() { paused = true; bedEl.style.display = 'flex'; }
document.getElementById('bedYes').onclick = () => { player.hearts = player.maxHearts; saveGame(); bedEl.style.display = 'none'; paused = false; setBanner('😴 睡得真香！血全满了（已存档）'); beep(400, 800, 0.4, 'sine', 0.14); };
document.getElementById('bedNo').onclick = () => { bedEl.style.display = 'none'; paused = false; };
const TIERS = [   // 🌍 魔兽世界稀有度色彩体系：灰粗糙→白普通→绿优秀→蓝精良→紫史诗→橙传说（封顶！金/青/彩截肢——升级石封顶橙，上面不做海报级）
  { n: '粗糙', c: '#9d9d9d', mul: 1 },      // 灰（WoW: Poor）
  { n: '普通', c: '#ffffff', mul: 1.5 },    // 白（Common）
  { n: '优秀', c: '#1eff00', mul: 2 },      // 绿（Uncommon）
  { n: '精良', c: '#0070dd', mul: 2.6 },    // 蓝（Rare）
  { n: '史诗', c: '#a335ee', mul: 3.3 },    // 紫（Epic）
  { n: '传说', c: '#ff8000', mul: 4.1 },    // 橙（Legendary，封顶）
];
const MAX_TIER = TIERS.length - 1;   // 🛡️ 品质天花板=橙：跟着天梯表自动走
function invB(k) { const b = player.bought[k]; return (b && b.t != null) ? b : null; }   // 武器/装备的 {t:品质, w:材料数}
/* 🎽 装备槽位（恩泽定的：头盔1/胸甲2/靴子1/小件5，武器技能宠物不占格） */
const SLOT_CAP = { helm: 1, chest: 2, boots: 1, trinket: 5 };
const SLOT_NAME = { helm: '⛑️头盔', chest: '🛡️胸甲', boots: '👢靴子', trinket: '💍小件' };
function gearSlot(k) {   // 按名字分槽：甲/衣/肚兜=胸甲（先判，"金盔甲"带"盔"字也是甲！）；帽/冠/盔/雪镜/鬼面=头盔；鞋/靴=靴子；其余=小件
  const n = (ALLITEMS[k] || {}).name || '';
  if (/甲|衣|肚兜/.test(n)) return 'chest';
  if (/帽|冠|盔|雪镜|鬼面/.test(n)) return 'helm';
  if (/鞋|靴/.test(n)) return 'boots';
  return 'trinket';
}
function T(k) { const b = invB(k); return b ? TIERS[b.t].mul : 1; }   // 品质倍率
function fixOldBought() {   // 老存档升级：true→{t,w}；品质天梯换成魔兽世界稀有度色彩体系（级别序号不变自动映射，超纲的压到封顶级）
  for (const k in player.bought) {
    if (player.bought[k] === true && (ALLKIND[k] === 'weapon' || ALLKIND[k] === 'gear')) player.bought[k] = { t: 0, w: 0 };
    const b = player.bought[k];
    if (b && b.t != null && b.t > MAX_TIER) b.t = MAX_TIER;
  }
}
function addToInv(key, tier) {
  const kind = ALLKIND[key];
  if (kind !== 'weapon' && kind !== 'gear') return false;
  const b = invB(key);
  if (!b) {
    player.bought[key] = { t: tier, w: 0 };
    if (kind === 'weapon') { player.owned[key] = true; player.weapon = key; }
    else {   // 🎽 装备：槽位有空才自动穿上，满了先进背包（背包里点它和身上的换）
      const slot = gearSlot(key), on = Object.keys(player.owned).filter(g => player.owned[g] && ALLKIND[g] === 'gear' && gearSlot(g) === slot);
      if (on.length < SLOT_CAP[slot]) player.owned[key] = true;
      else setBanner('🎽 ' + SLOT_NAME[slot] + '槽满啦，「' + ALLITEMS[key].name + '」先放背包里');
    }
  }
  applyGear(); return true;
}
/* 🔧 合成系统已退役（v52）：商店宝箱永不出重复装备→材料永远凑不齐→合成是摆设；升级全靠升级石 */
/* ================= 🏪 地图实体商店（每关 2 个随机类型，走近按 B / 点「进入」） ================= */
const SHOP_TYPES = [['weapon', '🗡️ 武器店', 50], ['gear', '🛡️ 装备店', 30], ['skill', '✨ 法术店', 20], ['pet', '🐾 宠物店', 30]];
const SHOP_ICON = { weapon: '🗡️', gear: '🛡️', skill: '✨', pet: '🐾' };
let mapShops = [], curShop = -1;
function rollShopType() { const tot = SHOP_TYPES.reduce((s, t) => s + t[2], 0); let r = Math.random() * tot; for (const t of SHOP_TYPES) { r -= t[2]; if (r <= 0) return t; } return SHOP_TYPES[0]; }
function shopDisc() { return Math.min(0.3, (player.owned.charm ? 0.1 : 0) + (player.job === 'rogue' ? 0.2 : 0)); }   // 🪙🃏 折扣叠加：金币护符 9 折 + 盗贼 8 折
function rollShopItems(kind) {
  const pool = Object.keys(ALLITEMS).filter(k => ALLKIND[k] === kind).filter(k => {
    if (CLASS_ITEMS[k]) return false;   // 🥷 职业物品不上货架
    if (kind === 'weapon' || kind === 'gear') { const b = player.bought[k]; return !invB(k); }   // 武器/装备：已有的不再卖
    return !player.bought[k];   // 技能/宠物：已有的不卖
  });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  const items = pool.slice(0, 6).map((k, i) => {
    const tier = (kind === 'weapon' || kind === 'gear') && i >= 4 ? 1 : 0;   // 6 件里 4 灰 2 白
    return { key: k, tier, price: ALLITEMS[k].price * (tier === 1 ? 2 : 1), sold: false };
  });
  // 🔷 升级石：武器店每件货 1% 概率变成石头（恩泽设计：稀有的工匠，一块升一级，封顶橙·传说）
  if (kind === 'weapon') for (let i = 0; i < items.length; i++) {
    if (Math.random() < 0.01) items[i] = { key: 'use_stone', use: true, price: towerMode ? 3000 : 300, sold: false };   // 🔷 升级石进道具袋：点它→点谁升谁（无尽涨价 300/3000 恩泽定的）
  }
  // 🍗 一次性道具：每家店固定带 2 样，永远买不光（无限购！）
  const upool = Object.keys(USE_ITEMS);
  for (let i = 0; i < 2; i++) { const k = upool[Math.floor(Math.random() * upool.length)]; items.push({ key: k, tier: 0, price: USE_ITEMS[k].price, sold: false, use: true }); }
  return items;
}
function placeShops() {
  mapShops = [];
  for (let s = 0; s < 2; s++) {
    const [kind, label] = rollShopType();
    let x, y, tries = 0;
    do { x = 200 + Math.random() * (WORLD.w - 400); y = 200 + Math.random() * (WORLD.h - 400); tries++; }
    while (tries < 20 && (Math.hypot(x - player.x, y - player.y) < 300 || (mapShops[0] && Math.hypot(x - mapShops[0].x, y - mapShops[0].y) < 300)));
    mapShops.push({ x, y, kind, label, items: rollShopItems(kind) });
  }
}

function nearShop() { for (let i = 0; i < mapShops.length; i++) if (Math.hypot(player.x - mapShops[i].x, player.y - mapShops[i].y) < 64) return i; return -1; }
function openMapShop(i) { if (i < 0) return; curShop = i; diaPicking = false; paused = true; renderMapShop(); shopEl.style.display = 'flex'; beep(500, 700, 0.1, 'sine', 0.1); }
function renderMapShop() {
  const s = mapShops[curShop]; if (!s) return;
  document.getElementById('shopTitle').textContent = s.label;
  let h = '';
  if (s.kind === 'mount') {   // 🐴 马厩：20 匹坐骑（越贵越快/血越厚/攻越强）
    h = '<div class="htxt" style="text-align:center;margin-bottom:6px">🐴 挑一匹坐骑！怪物会先打它，它也会帮你踢怪</div>';
    if (player.mount) { const cur = mountOf(player.mount); h += '<div class="htxt" style="text-align:center;color:#7ae8f2">现在骑着：' + cur.icon + ' ' + cur.name + '（❤️' + Math.ceil(player.mountHp) + '/' + cur.hp + '）——再点它=下马</div>'; }
    if ((player.mountCd || 0) > 0) h += '<div class="htxt" style="text-align:center;color:#e8a05a">😴 坐骑休息中：' + Math.ceil(player.mountCd) + ' 秒后可骑</div>';
    for (const m of MOUNTS) {
      const own = mountOwned(m.key), riding = player.mount === m.key;
      h += '<div class="shopIt"><div class="ic">' + m.icon + '</div><div><div class="nm" style="' + (riding ? 'color:#7ae8f2' : own ? 'color:#7ee85a' : '') + '">' + m.name + (riding ? '（骑乘中）' : own ? '（已有）' : '') + '</div><div class="ds">' + m.desc + '——移速×' + m.speed + ' ❤️' + m.hp + ' 蹄击' + m.dmg + '血/' + m.cd + '秒</div></div>'
        + (own ? '<button data-mi="' + m.key + '">' + (riding ? '🔽 下马' : '🐴 骑上') + '</button>' : player.gold >= m.price ? '<button data-mi="' + m.key + '">💰' + m.price + '</button>' : '<button disabled>💰' + m.price + '</button>') + '</div>';
    }
    shopItems.innerHTML = h;
    for (const b of shopItems.querySelectorAll('button[data-mi]')) b.onclick = () => { buyMount(b.dataset.mi); renderMapShop(); };
    return;
  }
  if (s.kind === 'house') {   // 🏠 房产中介：一万买小家
    h = ownedHouse ? '<div class="htxt">你已经有自己的小家啦！北边那栋蓝房子就是</div>'
      : `<div class="shopIt"><div class="ic">🏡</div><div><div class="nm">温馨小房间</div><div class="ds">有床有柜子！床能睡觉回满血+存档，柜子能存背包里的宝贝</div></div>${player.gold >= 10000 ? '<button data-house="1">💰10000</button>' : `<button disabled>💰10000（差${10000 - player.gold}）</button>`}</div>`;
  } else if (s.kind === 'dia') {   // 💎 钻石商店：只收钻石，全部不限购
    h = `<div class="htxt" style="text-align:center;margin-bottom:6px">你有 💎 ${player.diamonds || 0}（钻石只在试炼塔里掉）</div>`;
    if (diaPicking) {   // 🎯 指定转职：挑一个职业
      h += '<div class="htxt" style="text-align:center">🎯 挑一个职业（立刻转，扣 💎500）：</div>';
      h += JOB_LIST.map(([j, ic, nm]) => `<button data-job="${j}" ${j === player.job ? 'disabled' : ''} style="display:block;width:100%;margin:5px 0;padding:9px;border:2px solid #b48af2;border-radius:10px;background:#2a1a3a;color:#fff;font-weight:bold;cursor:pointer">${ic} ${nm}${j === player.job ? '（现在的职业）' : ''}</button>`).join('');
      h += '<div class="htxt" style="text-align:center;opacity:.7">点下面的「💎 钻石商店」标题栏外随便哪都行……算了还是给你个反悔钮：<button data-job="cancel" style="margin-top:4px;padding:6px 14px;border-radius:10px;border:2px solid #888;background:#333;color:#fff;cursor:pointer">🙅 不转了</button></div>';
    } else {
      for (const it of DIA_ITEMS) {
        const afford = (player.diamonds || 0) >= it.price;
        const soldOut = it.max && player.slots[it.key] >= it.max;   // 🚫 副手槽限购 1 次
        const own = it.key === 'off' ? `（${soldOut ? '已买到！' : '还没买'}）` : it.key === 'pet' ? `（现在 ${petMax()} 只上限）` : it.key === 'skill' ? `（现在 ${skillMax()} 个上阵）` : '';
        h += `<div class="shopIt"><div class="ic">${it.icon}</div><div><div class="nm" style="color:#7ae8f2;font-weight:bold">${it.name}</div><div class="ds">${it.desc}${own}${it.max ? '' : '——不限购！'}</div></div>${soldOut ? '<button disabled>已售罄</button>' : afford ? `<button data-dia="${it.key}">💎${it.price}</button>` : `<button disabled>💎${it.price}（差${it.price - (player.diamonds || 0)}）</button>`}</div>`;
      }
    }
  } else if (!s.items.length) h = '<div class="htxt">货架空空啦，打死 BOSS 或过关会补货！</div>';
  for (let i = 0; i < s.items.length; i++) {
    const it = s.items[i];
    const itp = Math.ceil(it.price * (1 - shopDisc()));   // 🃏 盗贼购物 8 折
    const btn = it.use ? (player.gold >= itp ? `<button data-ms="${i}">💰${itp}</button>` : `<button disabled>💰${itp}（差${itp - player.gold}）</button>`)   // 🍗 道具永不售罄
      : it.sold ? '<button disabled>卖光了</button>'
      : player.gold >= itp ? `<button data-ms="${i}">💰${itp}</button>` : `<button disabled>💰${itp}（差${itp - player.gold}）</button>`;
    const d = ALLITEMS[it.key];
    const tb = (s.kind === 'weapon' || s.kind === 'gear') && !it.use ? `<span style="color:${TIERS[it.tier].c};font-weight:bold">［${TIERS[it.tier].n}］</span>` : '';
    const own = it.use && player.items && player.items[it.key] ? `（背包有 ${player.items[it.key]} 个）` : '';
    h += `<div class="shopIt"><div class="ic">${d.icon}</div><div><div class="nm">${d.name}${tb}</div><div class="ds">${d.desc}${own}${it.use ? '——无限购！' : ''}</div></div>${btn}</div>`;
  }
  shopItems.innerHTML = h;
  const hb = shopItems.querySelector('button[data-house]'); if (hb) hb.onclick = buyHouse;
  for (const b of shopItems.querySelectorAll('button[data-dia]')) b.onclick = () => buyDia(b.dataset.dia);   // 💎 钻石商店买单
  for (const b of shopItems.querySelectorAll('button[data-job]')) b.onclick = () => {   // 🎯 指定转职挑职业
    const j = b.dataset.job; diaPicking = false;
    if (j !== 'cancel') { player.diamonds -= 500; updateDia(); applyJob(j); }
    renderMapShop();
  };
  for (const b of shopItems.querySelectorAll('button[data-ms]')) b.onclick = () => buyFromMapShop(+b.dataset.ms);
}
function buyFromMapShop(i) {
  const s = mapShops[curShop]; if (!s) return;
  const it = s.items[i]; const itp = it ? Math.ceil(it.price * (1 - shopDisc())) : 0;   // 🃏 盗贼 8 折
  if (!it || it.sold || player.gold < itp) { beep(160, 90, 0.15, 'square', 0.1); return; }
  player.gold -= itp;   // 🃏 盗贼 8 折后的价
  if (it.use) {   // 🍗 一次性道具：进道具袋，永不售罄（不标 sold）
    player.items = player.items || {}; player.items[it.key] = (player.items[it.key] || 0) + 1;
    setBanner('🍗 买到 ' + ALLITEMS[it.key].name + '！背包里点一下就吃/喝/扔');
    beep(660, 990, 0.14, 'square', 0.12); updateGold(); saveGame(); renderMapShop(); return;
  }
  it.sold = true;
  if (s.kind === 'weapon' || s.kind === 'gear') addToInv(it.key, it.tier);
  else if (s.kind === 'skill') { player.bought[it.key] = true; player.owned[it.key] = true; if (skillSlots.length < skillMax() && !skillSlots.includes(it.key)) skillSlots.push(it.key); else setBanner('✨ 技能位满啦，它在背包里休息'); renderSkills(); }
  else if (s.kind === 'pet') { player.bought[it.key] = true; player.owned[it.key] = true; addPet(it.key); }
  beep(660, 990, 0.14, 'square', 0.12); setTimeout(() => beep(880, 1320, 0.16, 'square', 0.1), 120);
  updateGold(); saveGame(); renderMapShop();
}
/* ================= 💎 钻石商店（小镇）：只收试炼塔钻石，全部不限购 ================= */
const DIA_ITEMS = [
  { key: 'off', icon: '⚔️', name: '副手槽', price: 600, max: 1, desc: '副手栏多装一把武器（弓/剑/枪都行，法杖除外），挥砍轮流出手——全服限购 1 次！' },
  { key: 'pet', icon: '🐾', name: '宠物槽', price: 450, desc: '出战宠物上限 +1 只' },
  { key: 'skill', icon: '✨', name: '技能槽', price: 450, desc: '上阵技能上限 +1 个' },
  { key: 'jobrand', icon: '🎲', name: '随机转职石', price: 300, desc: '立刻随机转成别的职业（除现在的）' },
  { key: 'jobpick', icon: '🎯', name: '指定转职石', price: 800, desc: '自己挑一个职业立刻转' },
];
let diaPicking = false;   // 🎯 指定转职：正在挑职业
const JOB_LIST = [['assassin', '🥷', '刺客'], ['mage', '🔮', '法师'], ['warrior', '⚔️', '战士'], ['tank', '🛡️', '坦克'], ['summoner', '🐺', '召唤师'],
  ['berserker', '🩸', '狂战士'], ['ranger', '🏹', '游侠'], ['cleric', '💚', '牧师'], ['rogue', '🃏', '盗贼'], ['chrono', '⏳', '时空术士'],
  ['engineer', '🧲', '工程师'], ['lucky', '🍀', '幸运星'], ['druid', '🐻', '德鲁伊'], ['necro', '☠️', '死灵法师'], ['alchemist', '⚗️', '炼金术士']];
const JOB_DESC = {   // 🌟 一句话卖点（觉醒横幅/图鉴用）
  assassin: '射箭→传送→落地一刀×2', mage: '武器附魔+15%，法杖再+15%，剑放剑风、箭带燃烧——只有 2.5 格血',
  warrior: '双手各持一把武器轮流砍，双剑=300° 大扇形——法杖只能九成', tank: '格挡 0.5 秒免疫一切（站桩）冷却 2 秒——技能位 4 格',
  summoner: '每 8 秒自动召唤一只狼（上限 3 只）——只有 3 格血',
  berserker: '血越少攻越高（最高+100%）——血上限-1', ranger: '箭穿透+20% 双箭——近战-30%',
  cleric: '全队持续回血，对亡灵×2 伤——伤害-15%', rogue: '金币×2，打"没看你的怪"背刺×2.5，商店 8 折——被打更疼',
  chrono: '技能冷却-40%，每 45 秒全场冻结 2 秒——伤害-10%', engineer: '每 12 秒自动部署炮塔（最多 2 座）——移速-10%',
  lucky: '25% 暴击×3，金币+25%——伤害-5%', druid: '专属按钮变熊 6 秒：攻×2.5、受伤减半，冷却 25 秒——技能冷却+20%',
  necro: '击杀的怪 30% 复活成骷髅小弟（10 秒，上限 3）——只有 3 格血', alchemist: '一次性道具效果翻倍、手雷加强——武器伤害-20%',
};
function cdMul() { return (player.job === 'chrono' ? 0.6 : 1) * (player.job === 'druid' ? 1.2 : 1); }   // ⏳🐻 技能冷却系数
function jobGift(j) {   // 🎁 成为主职业的见面礼
  if (j === 'warrior' && !Object.keys(player.bought).some(k => ALLKIND[k] === 'weapon')) { player.bought.wood_sword = { t: 0, w: 0 }; player.owned.wood_sword = true; player.weapon = 'wood_sword'; player.offhand = 'wood_sword'; }
  if (j === 'tank') { player.bought.block_skill = true; player.owned.block_skill = true; if (!skillSlots.includes('block_skill')) skillSlots.unshift('block_skill'); renderSkills(); }
  if (j === 'summoner') wolfT = 1;
}
function swapJob() {   // 🔄 主副职业一键切换（左上角按钮）
  if (!player.job2) { setBanner('😴 还没有副职业——再捡一颗觉醒石！'); return; }
  const t = player.job; player.job = player.job2; player.job2 = t;
  player.bearT = 0; bearCd = 0;   // 🐻 切换时熊形态解除
  if (player.job !== 'summoner') wolves = [];   // 🐺 切走召唤师收狼群
  if (player.job !== 'engineer') turrets = [];   // 🧲 切走工程师收炮塔
  if (player.job !== 'necro') minions = [];   // ☠️ 切走死灵收小弟
  jobGift(player.job); applyGear(); player.hearts = Math.min(player.hearts, player.maxHearts);
  const jb = JOB_LIST.find(x => x[0] === player.job);
  setBanner('🔄 主职业换成【' + jb[1] + ' ' + jb[2] + '】！');
  beep(500, 900, 0.12, 'square', 0.12); updateJobSwap(); saveGame();
}
function updateJobSwap() {   // 🔘 左上角切换按钮：有副职业才出现
  const b = document.getElementById('jobSwap'); if (!b) return;
  if (player.job2) { const j1 = JOB_LIST.find(x => x[0] === player.job), j2 = JOB_LIST.find(x => x[0] === player.job2); b.textContent = j1[1] + '⇄' + j2[1]; b.style.display = 'block'; }
  else b.style.display = 'none';
}
function applyJob(j) {   // 🔄 转职：清职业状态，重新算属性
  player.job = j;
  player.bearT = 0;
  if (j !== 'summoner') wolves = []; else wolfT = 1;   // 🐺 离开召唤师收狼群，转来马上有狼
  if (j !== 'engineer') turrets = [];   // 🧲 离开工程师收炮塔
  if (j !== 'necro') minions = [];   // ☠️ 离开死灵收小弟
  jobGift(j);
  applyGear(); player.hearts = Math.min(player.hearts, player.maxHearts);
  const jb = JOB_LIST.find(x => x[0] === j);
  for (let i = 0; i < 24; i++) burst(player.x + (Math.random() - 0.5) * 120, player.y + (Math.random() - 0.5) * 120, ['#b48af2', '#ffd24a', '#ffffff'][i % 3]);
  setBanner('🔄 转职成功！你现在是【' + jb[1] + ' ' + jb[2] + '】！');
  beep(600, 1200, 0.3, 'sine', 0.18); setTimeout(() => beep(800, 1600, 0.3, 'sine', 0.16), 200);
  updateJobSwap(); saveGame();
}
function buyDia(key) {   // 💎 买单
  const it = DIA_ITEMS.find(x => x.key === key); if (!it) return;
  if (it.max && player.slots[key] >= it.max) { setBanner('🚫 ' + it.name + '只能买一次！'); beep(160, 90, 0.15, 'square', 0.1); return; }   // 副手槽限购
  if ((player.diamonds || 0) < it.price) { setBanner('💎 钻石不够！去试炼塔刷怪掉钻石'); beep(160, 90, 0.15, 'square', 0.1); return; }
  if (key === 'jobpick' && !diaPicking) { diaPicking = true; renderMapShop(); return; }   // 🎯 指定转职：先挑职业
  player.diamonds -= it.price; updateDia();
  if (key === 'off') { player.slots.off++; setBanner('⚔️ 副手槽 +1！现在能装 ' + offMax() + ' 把副手武器（背包里点武器上副手）'); }
  else if (key === 'pet') { player.slots.pet++; setBanner('🐾 宠物槽 +1！现在能带 ' + petMax() + ' 只出战'); }
  else if (key === 'skill') { player.slots.skill++; setBanner('✨ 技能槽 +1！现在能上阵 ' + skillMax() + ' 个技能'); }
  else if (key === 'jobrand') { const pool = JOB_LIST.map(x => x[0]).filter(j => j !== player.job); applyJob(pool[Math.floor(Math.random() * pool.length)]); }
  beep(880, 1320, 0.16, 'square', 0.14); saveGame(); renderMapShop();
}
/* ================= 🌀 第八关·无尽模式（7 波一轮回，每遍 BOSS 血/速+2%、攻+1%） ================= */
let endlessRound = 1, endlessWave = 1, waveKills = 0, overRecorded = false;
const LB_KEY = 'zf_endless_lb';
function getLB() { try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; } catch (e) { return []; } }
function recordEndless() {
  const lb = getLB(); lb.push({ round: endlessRound, wave: endlessWave, when: Date.now() });
  lb.sort((a, b) => b.round - a.round || b.wave - a.wave);
  try { localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0, 5))); } catch (e) {}
}
function bestEndless() { return getLB()[0] || null; }
const WAVE_KIND = ['', 'zombie', 'skeleton', 'ghost', 'lava', 'storm', 'voidw', 'crystal'];
function waveSpawn() {   // 无尽模式按波次出怪
  const w = endlessWave, s2 = pickSpawn(player, Math.random);
  zombies.push(w === 2 ? makeSkeleton(s2.x, s2.y, Math.random) : w === 3 ? makeGhost(s2.x, s2.y, Math.random) : w === 4 ? makeLava(s2.x, s2.y, Math.random) : w === 5 ? makeStorm(s2.x, s2.y, Math.random) : w === 6 ? makeVoid(s2.x, s2.y, Math.random) : w === 7 ? makeCrystal(s2.x, s2.y, Math.random) : spawnZombie(player, Math.random));
  zombies[zombies.length - 1].kind = WAVE_KIND[w];
}
function endlessBossDown(z) {
  player.gold += 100 * endlessRound; updateGold();
  for (const o of zombies) if (o !== z) o.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = [];
  placeShops();   // 🏪 无尽每打完一波 BOSS：商店重新抽签（类型+位置+货全换新的）
  waveKills = 0; endlessWave++;
  if (endlessWave > 7) { endlessWave = 1; endlessRound++; setBanner(`🌀 第 ${endlessRound} 遍开始！BOSS 又变强了！商店已刷新`); }
  else setBanner(`🌀 第 ${endlessWave} 波：${LEVELS[endlessWave].name}的怪来了！商店已刷新`);
  player.hearts = player.maxHearts; placePortal(); revivePets();   // 🐾 无尽过波也复活伙伴
  beep(600, 1200, 0.5, 'sine', 0.2); saveGame(); updateScore();
}
/* ================= 🔍 倍数镜（1×/2×/4× 循环） ================= */
let zoomLv = 0; const ZOOMS = [1, 2, 4];
document.getElementById('zoomBtn').onclick = () => { zoomLv = (zoomLv + 1) % 3; document.getElementById('zoomBtn').textContent = '🔍×' + ZOOMS[zoomLv]; beep(600, 800, 0.06, 'square', 0.08); };
/* 🎛️ 情境动作：宝箱开/下一关/进店/坐长椅，共用一个按钮和 B 键 */
function ctxGo() {
  const c = window.__ctx || {};
  if (c.act === 'chest') openChest();
  else if (c.act === 'next') askNext();
  else if (c.act === 'shop') openMapShop(nearShop());
  else if (c.act === 'bench' && c.bench) sitBench(c.bench);
  else if (c.act === 'tower') enterTower();   // 🗼 进试炼塔
  else if (c.act === 'gate') exitTown();   // ⚔️ 出城门=回主线冒险（第一关走起）
  else if (c.act === 'dungeon') Dgn.enterDungeon();   // 🌲 进哥布林森林副本
  else if (c.act === 'fishshop') Sky.openFishShop();   // 🐟 天空城鱼商人
  else if (c.act === 'skyleave') leavePvp();   // 🚪 离开天空城回冒险
  else if (c.act === 'play') Games.startPlay(c.play);   // 🎡 游乐项目
}
document.getElementById('enterBtn').onclick = ctxGo;
document.getElementById('fishBtn').onclick = () => Sky.fishGo();   // 🎣 抛杆/收杆（箭头包一层：fishGo 在 sky.js，点的时候才去找它）
document.getElementById('eatFishBtn').onclick = () => Sky.eatFish();   // 😋 吃掉手里的鱼
document.getElementById('fishShopClose').onclick = () => { document.getElementById('fishShop').style.display = 'none'; };
document.getElementById('fishSellAll').onclick = () => Sky.sellAllFish();
let AC = null;
function beep(f0, f1, dur, type, vol) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), AC.currentTime + dur);
    g.gain.setValueAtTime((vol || 0.12) * (settings.sfxVol / 100), AC.currentTime); g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);   // 🔔 音效音量（设置滑条）
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
  } catch (e) {}
}
