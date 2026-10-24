'use strict';
/* ================= 🔮 旁观者模式（沙盒试炼场）：全装备全技能全宠物随便试，任意选关，死了重选，退出清空 ================= */
let sandboxMode = false, sandboxBackup = null;
const sandboxRule = { dmg3: false, god: false, horde: false };   // 🎛️ 试炼规则：伤害×3 / 无敌 / 刷怪×3
const LEVEL_LIST = [
  [1, '🧟 第1关·僵尸草原'], [2, '❄️ 第2关·骷髅雪原'], [3, '👻 第3关·鬼魂地狱'], [4, '🌋 第4关·熔岩火山'],
  [5, '⛈️ 第5关·天空雷域'], [6, '🕳️ 第6关·虚空之境'], [7, '💎 第7关·水晶洞窟'], [8, '💀 第8关·凋零之地'],
  [9, '🐉 第9关·末影之地'], [10, '🧨 第10关·苦力怕矿洞'], [11, '🟢 第11关·史莱姆沼泽'], [12, '👿 第12关·深邃古城'],
];
function enterSandbox() {   // 🔮 进来：正常档先存好+备份，然后全解锁开玩
  saveGame(); sandboxBackup = packSave();
  reset(); sandboxMode = true;
  player.gold = 999999; player.diamonds = 9999; player.maxHearts = 20; player.hearts = 20;
  for (const t of [SHOP, SHOP2, SHOP3, SHOP4, SHOP5, SHOP6, SHOP7, SHOP8, SHOP9, SHOP10])   // 🎁 全商店表扫一遍：武器装备全进包
    for (const k in t) { const kd = t[k].kind; if (kd === 'weapon' || kd === 'gear') addToInv(k, 0); }
  for (const t of [SHOP, SHOP2, SHOP3, SHOP4, SHOP5, SHOP6, SHOP7, SHOP8, SHOP9, SHOP10])   // ✨ 技能全上阵 + 🐾 宠物全出战
    for (const k in t) {
      if (t[k].kind === 'skill') { player.bought[k] = true; if (!skillSlots.includes(k)) skillSlots.push(k); }
      if (t[k].kind === 'pet' && !pets.some(p => p.key === k)) { player.bought[k] = true; addPet(k); }
    }
  applyGear(); renderSkills(); updateGold(); updateDia();
  setBanner('🔮 旁观者模式！全部家当都在背包里，随便试！');
  openSandboxPicker();
}
function openSandboxPicker() {   // 🗺️ 选关台：12 关+小镇+副本+天空城+规则开关+退出
  paused = true;
  const p = document.getElementById('sandbox');
  let h = '<div style="font-size:17px;font-weight:bold;text-align:center;margin-bottom:6px">🔮 旁观者模式 · 选一张地图</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
  for (const [n, label] of LEVEL_LIST) h += `<button data-sb="${n}" style="padding:8px;border:0;border-radius:10px;background:#3a3a5a;color:#fff;font-weight:bold;cursor:pointer;font-size:12px">${label}</button>`;
  h += `<button data-sb="town" style="padding:8px;border:0;border-radius:10px;background:#2a6a3a;color:#fff;font-weight:bold;cursor:pointer;font-size:12px">🏡 宁静小镇</button>`;
  h += `<button data-sb="dungeon" style="padding:8px;border:0;border-radius:10px;background:#2a5a4a;color:#fff;font-weight:bold;cursor:pointer;font-size:12px">🌲 哥布林森林</button>`;
  h += `<button data-sb="sky" style="padding:8px;border:0;border-radius:10px;background:#4a5a8a;color:#fff;font-weight:bold;cursor:pointer;font-size:12px">☁️ 天空城</button>`;
  h += '</div><div style="display:flex;gap:6px;margin-top:8px">'
    + `<button data-rule="dmg3" style="flex:1;padding:7px;border:0;border-radius:9px;background:${sandboxRule.dmg3 ? '#c85a2a' : '#4a4a5a'};color:#fff;font-weight:bold;cursor:pointer;font-size:12px">💪 伤害×3 ${sandboxRule.dmg3 ? '开' : '关'}</button>`
    + `<button data-rule="god" style="flex:1;padding:7px;border:0;border-radius:9px;background:${sandboxRule.god ? '#c85a2a' : '#4a4a5a'};color:#fff;font-weight:bold;cursor:pointer;font-size:12px">🛡️ 无敌 ${sandboxRule.god ? '开' : '关'}</button>`
    + `<button data-rule="horde" style="flex:1;padding:7px;border:0;border-radius:9px;background:${sandboxRule.horde ? '#c85a2a' : '#4a4a5a'};color:#fff;font-weight:bold;cursor:pointer;font-size:12px">👹 怪×3 ${sandboxRule.horde ? '开' : '关'}</button></div>`;
  h += '<button id="sbExit" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:10px;background:#8a3a3a;color:#fff;font-weight:bold;cursor:pointer">🚪 退出旁观模式（这里的一切都会清空）</button>';
  document.getElementById('sbBody').innerHTML = h;
  p.style.display = 'flex';
  for (const b of document.querySelectorAll('#sbBody button[data-sb]')) b.onclick = () => sandboxGo(b.dataset.sb);
  for (const b of document.querySelectorAll('#sbBody button[data-rule]')) b.onclick = () => { sandboxRule[b.dataset.rule] = !sandboxRule[b.dataset.rule]; beep(500, 800, 0.06, 'sine', 0.08); openSandboxPicker(); };
  document.getElementById('sbExit').onclick = exitSandbox;
}
function sandboxGo(where) {   // 🗺️ 去选中的地图
  document.getElementById('sandbox').style.display = 'none'; paused = false;
  for (const o of zombies) o.dead = true;
  earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; netOrbs = null; shocks = [];
  player.hearts = player.maxHearts; player.x = WORLD.w / 2; player.y = WORLD.h / 2;
  if (where === 'town') { townMode = true; townUnlocked = true; enterTown(); setBanner('🏡 小镇随便逛！'); return; }
  if (where === 'dungeon') { townMode = true; townUnlocked = true; enterTown(); Dgn.enterDungeon(); return; }   // 🌲 副本从镇里进
  if (where === 'sky') { townMode = true; townUnlocked = true; enterTown(); enterPvp(); return; }   // ☁️ 天空城
  level = +where; campaignLv = level; townMode = false;
  placePortal(); placeShops(); updateScore(); applyGear();
  if (level === 9) spawnBoss();   // 🐉 末影之地直接决战
  setBanner('🔮 传送到 ' + LEVEL_LIST[where - 1][1] + '！');
  beep(500, 1000, 0.2, 'sine', 0.14);
}
function exitSandbox() {   // 🚪 退出：恢复进来前的正常档，旁观数据全清
  document.getElementById('sandbox').style.display = 'none';
  sandboxMode = false; const bak = sandboxBackup; sandboxBackup = null;
  reset(); if (bak) applySave(bak);
  townMode = !!bak && !!bak.townMode; dungeonMode = false; skyMode = false;
  saveGame(); showHome();
  setBanner('🚪 已退出旁观模式——你的正常存档原封不动！');
}
