'use strict';
/* ================= ⚙️ 齿轮设置面板（暂停） ================= */
let gearOpen = false;
function toggleGear(force) {
  gearOpen = force == null ? !gearOpen : force;
  paused = gearOpen; if (gearOpen) {
    document.getElementById('gearNext').style.display = pendingNext ? 'block' : 'none';   // 🗺️ 有下一关可去就亮出来
    document.getElementById('gearFight').style.display = townMode ? 'block' : 'none';   // ⚔️ 小镇里能回去刷怪
    document.getElementById('gearTown').style.display = (townUnlocked && !townMode) ? 'block' : 'none';   // 🏡 刷怪时能回小镇
  }
  document.getElementById('gear').style.display = gearOpen ? 'flex' : 'none';
}
document.getElementById('gearBtn').onclick = () => toggleGear();
document.getElementById('gearClose').onclick = () => toggleGear(false);
/* ================= ❓ 玩法介绍面板（暂停） ================= */
let helpOpen = false;
function toggleHelp(force) {
  helpOpen = force == null ? !helpOpen : force;
  paused = helpOpen;
  document.getElementById('help').style.display = helpOpen ? 'flex' : 'none';
}
document.getElementById('helpBtn').onclick = () => toggleHelp();
document.getElementById('helpClose').onclick = () => toggleHelp(false);
/* ================= 🎒 背包（武器换装/装备装卸/技能五上阵/宠物三出战） ================= */
let skillSlots = [];   // ✨ 上阵技能（最多 5 个）
const bagEl = document.getElementById('bag'), bagList = document.getElementById('bagList');
let bagOpen = false;
function toggleBag(force) {
  bagOpen = force == null ? !bagOpen : force;
  paused = bagOpen;
  if (bagOpen) renderBag();
  bagEl.style.display = bagOpen ? 'flex' : 'none';
}
document.getElementById('gearBag').onclick = () => { toggleGear(false); toggleBag(true); };
document.getElementById('bagClose').onclick = () => toggleBag(false);
document.getElementById('chestGo').onclick = () => { closeChest(); goNextLevel(); };
document.getElementById('chestStay').onclick = () => closeChest();
document.getElementById('gearNext').onclick = () => { toggleGear(false); goNextLevel(); };
function renderBag() {
  const sec = (t, n) => `<div class="shopSec">${t}</div>`;
  const tierOf = k => { const b = invB(k); return b ? `<span style="color:${TIERS[b.t].c}">·${TIERS[b.t].n}</span>` : ''; };
  const btn = (k, it, state, on) => { const b2 = invB(k); return `<button class="bagIt ${on ? 'on' : 'off'}" data-bag="${k}"><span class="bi">${it.icon}</span><span class="bn">${it.name}${tierOf(k)}</span><span class="bs">${state}</span>${b2 ? `<span class="bs" data-sell="${k}" style="background:#8a6a3a;border-radius:8px;padding:2px 6px">💰卖${Math.round(ALLITEMS[k].price * (b2.t + 1) * 0.5)}</span>` : ''}</button>`; };   // 🔧 合成按钮已随系统退役（v52）
  const grid = arr => `<div class="bagGrid">${arr.join('')}</div>`;
  let h = '';
  /* 🌟 职业展示卡（v60）：背包最顶上亮明身份（15 职业全表：主+副都亮出来） */
  const JOBS = {}; for (const [jj, ic, nm] of JOB_LIST) JOBS[jj] = [ic, nm, JOB_DESC[jj] || ''];
  const jb = JOBS[player.job], jb2 = JOBS[player.job2];
  h += sec('🌟 职业');
  h += jb
    ? `<div style="background:linear-gradient(135deg,#3a2a5a,#2a1a3a);border:2px solid #b48af2;border-radius:12px;padding:8px;text-align:center;margin:4px 0"><span style="font-size:26px">${jb[0]}</span> <b style="font-size:17px">${jb[1]}</b><div style="font-size:11px;opacity:.85;margin-top:3px">${jb[2]}</div>${jb2 ? `<div style="margin-top:6px;padding-top:5px;border-top:1px dashed rgba(255,255,255,.25);font-size:12px">副职业：${jb2[0]} <b>${jb2[1]}</b>（点左上角 ⇄ 一键换）</div>` : ''}</div>`
    : '<div class="htxt">还没觉醒职业——打 BOSS 开宝箱，找 🌟 觉醒石！</div>';
  const ws = Object.keys(player.bought).filter(k => ALLKIND[k] === 'weapon');
  const offN = offMax();
  h += sec(offN >= 1 ? `⚔️ 武器（主手+副手${offN} 个槽，多把轮流砍；法杖不能进副手）` : '🗡️ 武器（点一下拿手上，只能拿一把）');
  h += ws.length ? grid(ws.map(k => {
    const offIdx = [player.offhand, ...(player.offhands2 || [])].indexOf(k);
    const label = player.weapon === k ? '✅ 主手拿着' : offIdx >= 0 ? '🤚 副手' + (offIdx + 1) + '拿着' : '点我装备';
    return btn(k, ALLITEMS[k], label, player.weapon === k || offIdx >= 0);
  })) : '<div class="htxt">还没买过武器，去商店看看！</div>';
  const gs = Object.keys(player.bought).filter(k => ALLKIND[k] === 'gear');
  const gCnt = { helm: 0, chest: 0, boots: 0, trinket: 0 };
  for (const g of gs) if (player.owned[g]) gCnt[gearSlot(g)]++;
  h += sec(`🛡️ 装备（⛑️头盔 ${gCnt.helm}/1 · 🛡️胸甲 ${gCnt.chest}/2 · 👢靴子 ${gCnt.boots}/1 · 💍小件 ${gCnt.trinket}/5，满了自动换）`);
  h += gs.length ? grid(gs.map(k => btn(k, ALLITEMS[k], player.owned[k] ? '✅ 装着' : '💤 卸下了', !!player.owned[k]))) : '<div class="htxt">还没买过装备</div>';
  const ss = Object.keys(player.bought).filter(k => ALLKIND[k] === 'skill');
  h += sec(`✨ 技能（最多上阵 ${skillMax()} 个：现在 ${skillSlots.length}/${skillMax()}）`);
  h += ss.length ? grid(ss.map(k => btn(k, ALLITEMS[k], skillSlots.includes(k) ? '⚡ 上阵中' : '💤 休息中', skillSlots.includes(k)))) : '<div class="htxt">还没买过技能书</div>';
  const ps = Object.keys(player.bought).filter(k => ALLKIND[k] === 'pet');
  h += sec(`🐾 宠物（最多出战 ${petMax()} 只：现在 ${pets.length}/${petMax()}）`);
  h += ps.length ? grid(ps.map(k => { const act = pets.some(p => p.key === k); return btn(k, ALLPETS[k], act ? '🐾 出战中' : '💤 休息中', act); })) : '<div class="htxt">还没买过宠物</div>';
  const us = Object.keys(player.items || {}).filter(k => player.items[k] > 0);   // 🍗 一次性道具+🐟鱼
  h += sec('🍗 道具（点一下就用；🐟 鱼点一下拿在手里，摇杆边出「吃掉」）');
  h += us.length ? grid(us.map(k => btn(k, ALLITEMS[k], ALLKIND[k] === 'fish' ? ('×' + player.items[k] + (player.holdFish === k ? ' 🖐️拿着呢' : ' 点我拿手里')) : ('×' + player.items[k] + ' 点我用'), true))) : '<div class="htxt">商店有一次性道具卖：烤鸡/药水/手雷/图腾；天空城能钓鱼</div>';
  bagList.innerHTML = h;
  bagList.onclick = e => {   // 💰卖钱优先，最后换装（事件委托）；🔧合成已退役（v52）
    const se = e.target.closest('[data-sell]');
    if (se) { sellItem(se.dataset.sell); renderBag(); return; }
    const b = e.target.closest('[data-bag]');
    if (b) bagTap(b.dataset.bag);
  };
}
/* 💰 卖装备：按（品质+1）×半价回收 */
function sellItem(k) {
  const b = invB(k); if (!b) return;
  const price = Math.round(ALLITEMS[k].price * (b.t + 1) * 0.5);
  player.gold += price; delete player.bought[k]; delete player.owned[k];
  if (player.weapon === k) player.weapon = null;
  if (player.offhand === k) player.offhand = null;   // ⚔️ 副手也卸
  player.offhands2 = (player.offhands2 || []).filter(x => x !== k);   // ⚔️ 额外副手也卸
  applyGear(); updateGold();
  setBanner(`💰 卖掉了 ${ALLITEMS[k].name}，+${price} 金币！`);
  beep(900, 1300, 0.1, 'sine', 0.12); saveGame();
}
/* 🍗 用道具：吃了就没了 */
function useItem(k) {
  player.items = player.items || {};
  if ((player.items[k] || 0) <= 0) return;
  if (k === 'use_totem') { setBanner('❤️‍🔥 图腾不用点：放背包里，倒下时它会自己救你！'); return; }   // 图腾自动生效
  const m = player.job === 'alchemist' ? 2 : 1;   // ⚗️ 炼金术士：道具效果翻倍
  player.items[k]--;
  if (k === 'use_chicken') { player.hearts = Math.min(player.maxHearts, player.hearts + 2 * m); setBanner('🍗 烤鸡真香！+' + 2 * m + ' 格血'); }
  else if (k === 'use_power') { player.powerT = 20 * m; setBanner('💪 力量药水下肚！' + 20 * m + ' 秒伤害 ×1.5'); }
  else if (k === 'use_iron') { player.ironT = 5 * m; setBanner('🛡️ 铁皮附体！' + 5 * m + ' 秒无敌'); }
  else if (k === 'use_speed') { player.speedT = 15 * m; setBanner('⚡ 健步如飞！' + 15 * m + ' 秒移速 +40%'); }
  else if (k === 'use_bomb') {
    const bx = player.x + Math.cos(player.dir) * 70, by = player.y + Math.sin(player.dir) * 70;
    burst(bx, by, '#ff8a5a', 20 * m); shakeT = 0.3; beep(150, 50, 0.4, 'sawtooth', 0.22);
    for (const z of zombies) if (!z.dead && !z.fake && Math.hypot(z.x - bx, z.y - by) < 90 * m) { z.hp -= 8 * m; z.flash = 0.2; if (z.hp <= 0) killZombie(z); }
    setBanner('💣 轰隆！');
  }
  beep(700, 1100, 0.1, 'sine', 0.12); saveGame();
}
function bagTap(k) {
  const kind = ALLKIND[k];
  if (kind === 'weapon') {
    const offs = [player.offhand, ...(player.offhands2 || [])].filter(Boolean);   // ⚔️ 现有副手队列
    const oi = offs.indexOf(k);
    if (player.weapon === k) { player.weapon = offs.shift() || null; setBanner('🗡️ 主手放下了' + (player.weapon ? '，副手顶上！' : '')); }   // 卸主手：副手顺位顶上
    else if (oi >= 0) { offs.splice(oi, 1); setBanner('🤚 副手卸下了'); }
    else if (!player.weapon) player.weapon = k;
    else if (offs.length < offMax()) {
      if (weapFam(k) === 'staff') { setBanner('🪄 法杖不能装副手！'); beep(160, 90, 0.15, 'square', 0.1); renderBag(); return; }
      offs.push(k); setBanner('🤚 装上副手' + offs.length + '！挥砍会轮流出手');
    }
    else player.weapon = k;   // 槽都满了：换主手
    player.offhand = offs[0] || null; player.offhands2 = offs.slice(1);
    beep(700, 900, 0.08, 'square', 0.1);
  }
  else if (kind === 'gear') {   // 🎽 装备槽位：满了自动换下最早穿上的同槽装备
    if (player.owned[k]) player.owned[k] = false;   // 点身上的=脱下
    else {
      const slot = gearSlot(k), on = Object.keys(player.owned).filter(g => player.owned[g] && ALLKIND[g] === 'gear' && gearSlot(g) === slot);
      if (on.length >= SLOT_CAP[slot]) { player.owned[on[0]] = false; setBanner('🎽 ' + SLOT_NAME[slot] + '槽满啦：换下了「' + (ALLITEMS[on[0]] || {}).name + '」'); }
      player.owned[k] = true;
    }
    applyGear(); player.hearts = Math.min(player.hearts, player.maxHearts); beep(500, 700, 0.08, 'square', 0.1);
  }
  else if (kind === 'fish') {   // 🐟 鱼：点一下拿手里/放回（拿着联网对面看得见）
    if (player.holdFish === k) { player.holdFish = null; setBanner('🎒 把「' + FISH[k].name + '」放回背包'); }
    else if ((player.items[k] || 0) > 0) { player.holdFish = k; setBanner(FISH[k].icon + ' 把「' + FISH[k].name + '」拿在手里啦！摇杆边有「吃掉」按钮'); }
    renderBag(); return;
  }
  else if (kind === 'use') { useItem(k); renderBag(); return; }   // 🍗 道具：点一下就用
  else if (kind === 'skill') {
    if (skillSlots.includes(k)) {
      if (k === 'block_skill' && player.job === 'tank') setBanner('🛡️ 格挡是坦克的本命技，永不下场！');
      else skillSlots = skillSlots.filter(s => s !== k);
    }
    else if (skillSlots.length < skillMax()) skillSlots.push(k);
    else { setBanner('✨ 最多上阵 5 个技能，先卸一个！'); beep(160, 90, 0.15, 'square', 0.1); renderBag(); return; }
    renderSkills(); beep(600, 900, 0.08, 'square', 0.1);
  } else if (kind === 'pet') {
    if (pets.some(p => p.key === k)) { pets = pets.filter(p => p.key !== k); beep(400, 300, 0.08, 'square', 0.1); }
    else if (pets.length < petMax()) addPet(k);
    else { setBanner('🐾 最多 ' + petMax() + ' 只出战，先让一只下场！'); beep(160, 90, 0.15, 'square', 0.1); renderBag(); return; }
  }
  saveGame(); renderBag();
}

/* ================= 🎨 捏人换装（五部位×八色，联机时对面也看得见） ================= */
const SKIN_PARTS = [   // 键=皮肤字符（a=鞋，f 被岩浆怪占用了）
  ['h', '💇 头发', ['#1a1a1a', '#5a3a1a', '#8a6a2a', '#c8a02a', '#c84a2a', '#3a6ee8', '#3aa83c', '#e8e8e8']],
  ['s', '🙂 皮肤', ['#e8b88a', '#d8a06a', '#b87848', '#8a5430', '#f2d8b8', '#c8e8f2', '#a8d8a8', '#e8a8b8']],
  ['b', '👕 衣服', ['#3a6ee8', '#e84a4a', '#3aa83c', '#e8b83a', '#8a5ac8', '#3a3a4a', '#f2f2f2', '#e87a2a']],
  ['p', '👖 裤子', ['#3a3a4a', '#1a2a5a', '#5a3a1a', '#6a6a6a', '#b8a878', '#e8e8e8', '#8a2a2a', '#2a5a3a']],
  ['a', '👟 鞋子', ['#1a1a1a', '#5a3a1a', '#e8e8e8', '#c83a2a', '#3a6ee8', '#e8c84a', '#8a8a92', '#e8a8c8']],
];
const SKIN_DEFAULT = { h: '#5a3a1a', s: '#e8b88a', b: '#3a6ee8', p: '#3a3a4a', a: '#1a1a1a' };
function openSkin() {
  renderSkinRows(); drawSkinPreview();
  document.getElementById('skin').style.display = 'flex';
}
function renderSkinRows() {   // 五排色板，当前选中的带金框
  const rows = document.getElementById('skinRows'); rows.innerHTML = '';
  for (const [key, label, colors] of SKIN_PARTS) {
    const row = document.createElement('div'); row.style.margin = '6px 0';
    row.innerHTML = '<div style="font-size:13px;font-weight:bold;margin-bottom:3px">' + label + '</div>';
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap';
    for (const c of colors) {
      const sw = document.createElement('button');
      sw.style.cssText = 'width:30px;height:30px;border-radius:8px;border:' + (player.skin[key] === c ? '3px solid #ffd24a' : '2px solid #555') + ';background:' + c + ';cursor:pointer';
      sw.onclick = () => { player.skin[key] = c; beep(600, 900, 0.05, 'sine', 0.07); renderSkinRows(); drawSkinPreview(); };
      wrap.appendChild(sw);
    }
    row.appendChild(wrap); rows.appendChild(row);
  }
}
function drawSkinPreview() {   // 实时预览：正面小人
  const cv = document.getElementById('skinCv'), c2 = cv.getContext('2d');
  c2.clearRect(0, 0, cv.width, cv.height);
  drawPlayerSpr(c2, MAN_DOWN, 12, 8, 6, false, player.skin);
}
document.getElementById('homeSkin').onclick = () => { openSkin(); beep(500, 800, 0.08, 'sine', 0.1); };
document.getElementById('homeDaily').onclick = () => { startDaily(); };   // 📅 每日挑战
document.getElementById('skinDone').onclick = () => { document.getElementById('skin').style.display = 'none'; saveGame(); setBanner('🎨 新形象保存啦！联机时对面也能看见'); beep(700, 1200, 0.15, 'sine', 0.12); };
document.getElementById('skinReset').onclick = () => { player.skin = Object.assign({}, SKIN_DEFAULT); renderSkinRows(); drawSkinPreview(); beep(300, 500, 0.08, 'sine', 0.08); };
