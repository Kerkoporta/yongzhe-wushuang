'use strict';
/* ================= 🏪 商店（买东西时游戏暂停） ================= */
let paused = false;
const shopEl = document.getElementById('shop'), shopItems = document.getElementById('shopItems');
function renderShop() {
  const TBL = shopNow();
  const wSec = level === 2 ? '❄️ 雪原武器（点「装备」随时换）' : '🗡️ 武器（点「装备」随时换）';
  const gSec = level === 2 ? '❄️ 雪原装备（买了就一直生效）' : '🛡️ 装备（买了就一直生效）';
  const sSec = '✨ 技能书（贵但超痛，有冷却）';
  const pSec = '🐾 宠物（帮你打怪，继承不收回，最多 3 只出战）';
  let h = '';
  for (const [sec, kind] of [[wSec, 'weapon'], [gSec, 'gear'], [sSec, 'skill'], [pSec, 'pet']]) {
    h += `<div class="shopSec">${sec}</div>`;
    for (const key in TBL) {
      const it = TBL[key]; if (it.kind !== kind) continue;
      const owned = !!player.bought[key];   // 🎒 买过=已拥有（卸下也算有）
      const disc = shopDisc();   // 🪙🃏 金币护符 9 折 + 盗贼 8 折
      const price = Math.ceil(it.price * (1 - disc));
      const priceTxt = disc ? `💰${price} <s style="opacity:.5;font-size:11px">${it.price}</s>` : `💰${price}`;
      let btn;
      if (kind === 'weapon') {
        if (player.weapon === key) btn = '<button disabled>✅ 手上拿着</button>';
        else if (owned) btn = `<button data-eq="${key}">换上</button>`;
        else btn = player.gold >= price ? `<button data-k="${key}">${priceTxt}</button>` : `<button disabled>${priceTxt}（差${price - player.gold}）</button>`;
      } else {
        if (owned) btn = '<button disabled>✅ 已有</button>';
        else btn = player.gold >= price ? `<button data-k="${key}">${priceTxt}</button>` : `<button disabled>${priceTxt}（差${price - player.gold}）</button>`;
      }
      h += `<div class="shopIt"><div class="ic">${it.icon}</div><div><div class="nm">${it.name}</div><div class="ds">${it.desc}</div></div>${btn}</div>`;
    }
  }
  shopItems.innerHTML = h;
  for (const b of shopItems.querySelectorAll('button[data-k]')) b.onclick = () => buyFromShop(b.dataset.k);
  for (const b of shopItems.querySelectorAll('button[data-eq]')) b.onclick = () => { player.weapon = b.dataset.eq; beep(700, 900, 0.08, 'square', 0.1); renderShop(); };
}
function buyFromShop(key) {
  const left = buyItem(player.gold, key, player.owned.charm ? 0.1 : 0, shopNow());   // 🪙 9 折
  if (left === null) { beep(160, 90, 0.15, 'square', 0.1); return; }
  player.gold = left;
  player.bought[key] = true; player.owned[key] = true;   // 🎒 买下=进背包；装备默认装上
  if (shopNow()[key].kind === 'weapon') player.weapon = key;   // 买武器直接上手
  if (shopNow()[key].kind === 'skill') {   // ✨ 技能位只有 5 个，满了进背包休息
    if (skillSlots.length < skillMax() && !skillSlots.includes(key)) skillSlots.push(key);
    else setBanner('✨ 技能位满啦，它在背包里休息（去背包换上）');
    renderSkills();
  }
  if (shopNow()[key].kind === 'pet') addPet(key);   // 🐾 宠物位 3 个，满了进背包休息
  applyGear(); saveGame();   // 💾 买完立刻存档
  beep(660, 990, 0.14, 'square', 0.12); setTimeout(() => beep(880, 1320, 0.16, 'square', 0.1), 120);
  updateGold(); renderShop();
}
/* 💎 水晶装备通用加成读取器（mod 字段，读全物品表——装备继承到哪关都生效；数值乘品质倍率） */
function modVal(name) { let v = 0; for (const k in player.owned) { if (!player.owned[k]) continue; const m = (ALLITEMS[k] || {}).mod; if (m && m[name]) v += m[name] * T(k); } return v; }
function modMul(name) { let v = 1; for (const k in player.owned) { if (!player.owned[k]) continue; const m = (ALLITEMS[k] || {}).mod; if (m && m[name]) v *= 1 + (m[name] - 1) * T(k); } return v; }
/* 🎒 装备加成重算（全部数值乘品质倍率 T(k)：普通(白)的更强、神话(彩)的最强；🏡小镇里装备全部失效） */
function applyGear() {
  const o = player.owned;
  if (townMode) {   // 🏡 小镇是和平区：装备不生效
    player.maxHearts = PLAYER.hearts; player.regenDelay = REGEN.delay; player.regenEvery = REGEN.every;
    player.speedMul = 1; player.dmgAdd = 0; player.cdMulGear = 1; player.armor = false;
    player.hearts = Math.min(player.hearts, player.maxHearts);
    return;
  }
  const g = (k, x) => o[k] ? x * T(k) : 0;         // 加法项×品质
  const m = (k, x) => o[k] ? 1 + (x - 1) * T(k) : 1;   // 乘法项×品质
  player.maxHearts = PLAYER.hearts + g('hat', 1) + g('crown', 1) + g('chestplate', 2) + g('belt', 1) + g('bone_helm', 1) + g('snowman_apron', 2) + g('ice_crown', 1) + g('soul_lantern', 1) + g('soul_heart', 1) + g('ghost_crown', 2) + g('obsidian_helm', 1) + g('volcano_stone', 2) + g('obsidian_heart', 3) + g('lava_crown', 2)
    + g('cloud_hat', 1) + g('sky_stone', 2) + g('cloud_seat', 1) + g('thunder_crown', 2)
    + g('void_helm', 1) + g('starlight_stone', 2) + g('blackhole_stone', 3) + g('darkstar_crown', 2)
    + modVal('heart');
  if (player.job === 'mage') player.maxHearts = 2.5 + (player.maxHearts - PLAYER.hearts) * 0.5;   // 🔮 法师代价：初始 2.5 格血，加血装备只发挥一半
  if (player.job === 'summoner') player.maxHearts = 3 + (player.maxHearts - PLAYER.hearts) * 0.5;   // 🐺 召唤师代价：3 格血，加血装备减半
  if (player.job === 'necro') player.maxHearts = 3 + (player.maxHearts - PLAYER.hearts) * 0.5;   // ☠️ 死灵法师：也是 3 格血
  if (player.job === 'berserker') player.maxHearts = Math.max(1, player.maxHearts - 1);   // 🩸 狂战士：血上限 -1
  player.regenDelay = o.medkit ? REGEN.delay / 2 : REGEN.delay;
  if (o.snow_medkit || o.hell_map || o.cosmic_map || modVal('map')) player.regenDelay = Math.max(1, player.regenDelay - 1);
  player.regenEvery = (o.medkit || o.warm_hearth || o.soul_heart || o.magma_core_heart || o.thunder_heart || o.abyss_heart || modVal('regen') >= 2) ? REGEN.every / 2 : REGEN.every;
  player.speedMul = m('shoes', 1.4) * m('crown', 1.15) * m('boots', 1.25) * m('belt', 0.9) * m('ice_boots', 1.2) * m('sled_shoes', 1.15) * m('snowman_apron', 0.95) * m('ice_crown', 1.1) * m('hell_boots', 1.2) * m('ghost_crown', 1.1) * m('fire_boots', 1.2) * m('lava_crown', 1.1) * m('volcano_stone', 0.95) * m('obsidian_heart', 0.9)
    * m('wind_boots', 1.25) * m('sky_stone', 0.95) * m('thunder_crown', 1.1)
    * m('stardust_boots', 1.25) * m('blackhole_stone', 0.9) * m('darkstar_crown', 1.1)
    * modMul('speed');
  player.dmgAdd = g('crown', 1) + g('north_star', 1) + g('ice_crown', 1) + g('other_side', 1) + g('ghost_crown', 1) + g('lava_crown', 1) + g('storm_eye', 1) + g('thunder_crown', 1) + g('void_eye', 2) + g('darkstar_crown', 1)
    + modVal('dmgAdd');
  player.cdMulGear = ((o.ghost_hand || o.inferno_glove || o.thunderbird || o.time_bracer) ? 0.85 : 1) * (1 - modVal('haste'));
  player.armor = !!o.armor;
}
/* 🛡️ 受伤判定：格挡类→减半类轮流判定（两关装备通用） */
function rollDmg(dmg) {
  if (player.ironT > 0) return 0;   // 🛡️ 铁皮药水：无敌
  if (modVal('block') && Math.random() < modVal('block')) return 0;   // 💎 水晶格挡
  if (player.owned.gold_armor && Math.random() < 0.25) return 0;
  if (player.owned.bone_charm && Math.random() < 0.15) return 0;
  if (player.owned.winter_cloak && Math.random() < 0.2) return 0;
  if (player.owned.ghost_mask && Math.random() < 0.1) return 0;
  if (player.owned.soul_charm && Math.random() < 0.2) return 0;
  if (player.owned.hell_cloak && Math.random() < 0.25) return 0;
  if (player.owned.magma_charm && Math.random() < 0.15) return 0;
  if (player.owned.ash_cloak && Math.random() < 0.2) return 0;
  if (player.owned.lightning_rod && Math.random() < 0.15) return 0;
  if (player.owned.storm_charm && Math.random() < 0.15) return 0;
  if (player.owned.volt_charm && Math.random() < 0.2) return 0;
  if (player.owned.gravity_charm && Math.random() < 0.15) return 0;
  if (player.owned.void_cloak && Math.random() < 0.25) return 0;
  if (player.armor && Math.random() < 0.2) dmg *= 0.5;
  if (player.owned.leather && Math.random() < 0.1) dmg *= 0.5;
  if (player.owned.chainmail && Math.random() < 0.25) dmg *= 0.5;
  if (player.owned.snow_coat && Math.random() < 0.1) dmg *= 0.5;
  if (player.owned.ice_armor && Math.random() < 0.25) dmg *= 0.5;
  if (player.owned.hell_armor && Math.random() < 0.25) dmg *= 0.5;
  if (player.owned.volcano_hide && Math.random() < 0.1) dmg *= 0.5;
  if (player.owned.obsidian_armor && Math.random() < 0.25) dmg *= 0.5;
  if (player.owned.sky_armor && Math.random() < 0.25) dmg *= 0.5;
  if (player.owned.dimension_armor && Math.random() < 0.25) dmg *= 0.5;
  if (modVal('half') && Math.random() < modVal('half')) dmg *= 0.5;   // 💎 水晶减半
  if (player.job === 'rogue') dmg *= 1.15;   // 🃏 盗贼短板：被打更疼
  if (player.bearT > 0) dmg *= 0.5;   // 🐻 熊形态：受伤减半
  if (player.shieldT > 0) dmg *= 0.5;   // 🛡️ 魔法护盾：受伤减半
  return dmg;
}
/* 👼 致命保护：天使/冰晶/魂/火种留 1 心，轮回石 2 心，凤凰之羽 3 心（最强）。每局一次。返回 true=被救了 */
function angelSave() {
  if ((player.items || {}).use_totem > 0) {   // ❤️‍🔥 复活图腾：倒下自动满血复活（不限次数，有几个救几次）
    player.items.use_totem--; player.hearts = player.maxHearts; player.inv = 1.5;
    setBanner('❤️‍🔥 复活图腾碎了——满血复活！'); beep(800, 1600, 0.5, 'sine', 0.22);
    for (let i = 0; i < 20; i++) burst(player.x + (Math.random() - 0.5) * 100, player.y + (Math.random() - 0.5) * 100, '#ffd24a');
    saveGame(); return true;
  }
  if ((!player.owned.angel && !player.owned.frost_crystal && !player.owned.undying_soul && !player.owned.samsara_stone && !player.owned.undying_flame && !player.owned.phoenix_feather && !player.owned.undying_volt && !player.owned.undying_void && !modVal('angel')) || player.angelUsed) return false;
  player.angelUsed = true; player.hearts = player.owned.phoenix_feather ? 3 : player.owned.samsara_stone ? 2 : 1; player.inv = 1.5;
  setBanner('👼 守护天使救了你！'); beep(700, 1400, 0.4, 'sine', 0.2);
  for (let i = 0; i < 16; i++) burst(player.x, player.y, '#fff2b0', 3);
  return true;
}
