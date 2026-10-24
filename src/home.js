'use strict';
/* ================= 🏠 主页（开机先进主页选存档；游戏里点 🏠=暂停+自动存好，怪物干瞪眼） ================= */
const homeEl = document.getElementById('home'), homeSlots = document.getElementById('homeSlots');
let homeOpen = false;
function slotInfo(s) { return `第${s.level || 1}关 · ⚔️${s.kills || 0} · 💰${s.gold || 0}`; }
function fmtWhen(w) { const d = new Date(w); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function showHome() {
  saveGame();   // 进主页先存好
  homeOpen = true; paused = true;   // 怪物全部罚站
  const bst = bestEndless();
  document.getElementById('homeBest').textContent = bst ? `🏆 无尽榜最佳：第${bst.round}遍·第${bst.wave}波` : '🗼 试炼塔：通关第十三关去小镇，无尽挑战爬最高！';
  renderHome(); homeEl.style.display = 'flex'; homeMobsStart();   // 🏠 封面飘起怪物剪影
}
function closeHome() {
  homeOpen = false; paused = false; homeMobsStop();
  homeEl.style.display = 'none';
  document.getElementById('over').style.display = 'none';
}
function renderHome() {
  const auto = readSave(SAVE_KEY);
  const town = readSave(SAVE_KEY_TOWN);
  let h = `<div class="slot"><div class="inf">🤖 自动档（一直在记）<br>${auto ? slotInfo(auto) + (auto.when ? ' · ' + fmtWhen(auto.when) : '') : '空空的'}</div>${auto ? '<button data-play="auto">▶️ 继续</button>' : ''}</div>`;
  if (town) h += `<div class="slot"><div class="inf">🏡 小镇自动档（一直在记）<br>🏡 宁静小镇 · 💰${town.gold || 0}${town.when ? ' · ' + fmtWhen(town.when) : ''}</div><button data-play="town">▶️ 回小镇</button></div>`;
  for (let i = 1; i <= 4; i++) {
    const s = readSave(SLOT_KEY(i));
    h += `<div class="slot"><div class="inf">📁 存档 ${i}<br>${s ? slotInfo(s) + ' · ' + fmtWhen(s.when) : '空'}</div>${s ? `<button data-play="${i}">▶️ 玩</button>` : ''}${auto ? `<button data-copy="${i}">📥 存到这</button>` : ''}</div>`;
  }
  homeSlots.innerHTML = h;
  for (const b of homeSlots.querySelectorAll('button[data-play]')) b.onclick = () => {
    const key = b.dataset.play === 'auto' ? SAVE_KEY : b.dataset.play === 'town' ? SAVE_KEY_TOWN : SLOT_KEY(+b.dataset.play);
    const s = readSave(key);
    if (s) { gameOver = false; applySave(s); saveGame(); setBanner('💾 读取成功，出发！'); beep(600, 1000, 0.15, 'sine', 0.12); }
    closeHome();
  };
  for (const b of homeSlots.querySelectorAll('button[data-copy]')) b.onclick = () => {
    writeSlot(+b.dataset.copy, JSON.stringify(packSave()));   // 🐛 存"当前这一局"而不是旧的自动档文件（小镇里自动档不更新，拷它会回第一关）
    beep(700, 1000, 0.12, 'sine', 0.12); renderHome();
  };
}
document.getElementById('homeNew').onclick = () => { for (const k of [SAVE_KEY, SAVE_KEY + '_g0', SAVE_KEY + '_g1', SAVE_KEY + '_bak', SAVE_KEY_TOWN]) { try { localStorage.removeItem(k); } catch (e) {} } gameOver = false; reset(); closeHome(); startFaint(); };   // 🌅 新冒险先播开场剧情（我在哪儿→你醒了→小镇醒来）
document.getElementById('homePvp').onclick = () => { openLobby(); };
document.getElementById('pvpClose').onclick = () => { document.getElementById('pvpLob').style.display = 'none'; };
document.getElementById('gearHome').onclick = () => { toggleGear(false); showHome(); };
/* 🗡️ 武器招式表：每把武器的手感（含雪原 20 把） */
const WEAPON_FX = {
  sword: { dmg: 2, tp: true, color: '#8fd8ff' },
  stick: { dmg: 1.5 },
  iron_sword: { dmg: 2.5 },
  diamond_sword: { dmg: 4, color: '#a8f2ff' },
  fire_rod: { dmg: 1.5, burn: true, staff: true, color: '#ff9a3d' },
  mjolnir: { dmg: 2, zap: true, color: '#ffe84a' },
  ice_bow: { dmg: 1, bow: true, freezeDur: 1.5, color: '#a8e8ff' },
  boomerang: { dmg: 1, circle: true, color: '#d8b87a' },
  gold_axe: { dmg: 3, cdMul: 0.5, color: '#ffd24a' },
  spear: { dmg: 1.2, rangeMul: 1.4, color: '#d8b87a' },
  stone_sword: { dmg: 2, cdMul: 1.2, color: '#b8b8c2' },
  poison_blade: { dmg: 1, poison: 3, color: '#7ee85a' },
  fire_greatsword: { dmg: 3, burn: true, color: '#ff7a3d' },
  frost_blade: { dmg: 2, freezePct: 0.2, color: '#c8f4ff' },
  dual_daggers: { dmg: 1.5, cdMul: 0.67, color: '#e8e8f2' },
  lightning_staff: { dmg: 1.5, zapPct: 0.15, color: '#fff29a' },
  war_hammer: { dmg: 4, cdMul: 1.3, kbMul: 3, color: '#d8d8e2' },
  phantom_dagger: { dmg: 1.5, doublePct: 0.3, color: '#c8a0ff' },
  holy_sword: { dmg: 3.5, holy: true, color: '#fff2b0' },
  /* ❄️ 雪原 20 把 */
  ice_spike: { dmg: 1.2, freezePct: 0.1, color: '#a8f2ff' },
  bone_sword: { dmg: 2, color: '#f0e6b0' },
  snow_staff: { dmg: 1.3, staff: true, color: '#f0f4ff' },
  frost_fang: { dmg: 1.8, freezePct: 0.2, color: '#c8f4ff' },
  ice_crystal_sword: { dmg: 3, color: '#a8f2ff' },
  bone_boomerang: { dmg: 1.5, circle: true, color: '#f0e6b0' },
  frost_bow: { dmg: 1.5, bow: true, freezeDur: 1, color: '#a8e8ff' },
  ice_dual: { dmg: 1.8, cdMul: 0.7, color: '#c8f4ff' },
  white_spear: { dmg: 1.5, rangeMul: 1.5, color: '#f0f4ff' },
  frost_axe: { dmg: 3.5, cdMul: 0.8, color: '#a8f2ff' },
  snow_dagger: { dmg: 2, doublePct: 0.3, color: '#e8f4ff' },
  ice_staff: { dmg: 2, zapPct: 0.2, color: '#c8f4ff' },
  avalanche_hammer: { dmg: 3.5, cdMul: 1.2, kbMul: 2, color: '#e8f0ff' },
  bone_greatsword: { dmg: 4.5, cdMul: 1.15, color: '#f0e6b0' },
  aurora_sword: { dmg: 3, tp: true, color: '#a8ffd8' },
  ice_dragon: { dmg: 2, frostbite: 3, color: '#7ac8ff' },
  yeti_totem: { dmg: 2, holy: true, color: '#f0f0ea' },
  frost_warhammer: { dmg: 4, cdMul: 1.3, kbMul: 3, color: '#c8f4ff' },
  ice_breaker: { dmg: 4, doublePct: 0.2, color: '#a8f2ff' },
  eternal_winter: { dmg: 5, freezePct: 0.15, freezeDur: 2, color: '#8fd8ff' },
  /* 👻 地狱 20 把 */
  soul_dagger: { dmg: 2, color: '#8ff2ea' },
  chain_sickle: { dmg: 1.8, rangeMul: 1.4, color: '#c8ccd4' },
  ghost_claw: { dmg: 1.5, cdMul: 0.7, color: '#8ff2ea' },
  soul_bell: { dmg: 1.2, circle: true, color: '#ffd24a' },
  ghostfire_staff: { dmg: 1.8, burn: true, staff: true, color: '#4ac8c0' },
  wraith_sword: { dmg: 3.5, cdMul: 1.1, color: '#c8a0ff' },
  hell_trident: { dmg: 2.5, rangeMul: 1.5, color: '#8ff2ea' },
  soul_eater: { dmg: 2.5, holy: true, color: '#a0ffd0' },
  ghost_bow: { dmg: 2, bow: 'soul', freezeDur: 0, color: '#8ff2ea' },
  samsara_blade: { dmg: 3, doublePct: 0.25, color: '#c8a0ff' },
  banshee_staff: { dmg: 2.5, zapPct: 0.25, color: '#8ff2ea' },
  ghost_dual: { dmg: 2, cdMul: 0.65, color: '#b0f2ea' },
  grudge_axe: { dmg: 4, kbMul: 2, color: '#c8a0ff' },
  soul_chain: { dmg: 3, circle: true, color: '#c8ccd4' },
  soul_breaker: { dmg: 4, gun: true, color: '#8ff2ea' },
  reaper_scythe: { dmg: 4.5, rangeMul: 1.6, color: '#e8e8f2' },
  hellfire_blade: { dmg: 3, burn: true, color: '#ff9a3d' },
  phantom_soul: { dmg: 3.5, tp: true, color: '#c8a0ff' },
  night_sword: { dmg: 5, color: '#6a6a8a' },
  final_judge: { dmg: 6, holy: true, color: '#fff2b0' },
  /* 💀 凋零 7 把 */
  wskel_sword: { dmg: 2, color: '#b8b8c2' },
  coal_dagger: { dmg: 1.8, cdMul: 0.7, color: '#3a3440' },
  dark_bow: { dmg: 1.8, bow: 'soul', color: '#5a4a82' },
  bone_scythe: { dmg: 2.5, rangeMul: 1.5, color: '#e8e8f0' },
  wither_blade: { dmg: 3, poison: 3, color: '#241a30' },
  wither_staff: { dmg: 2.2, staff: true, color: '#4a6aff' },
  netherite_sword: { dmg: 5, color: '#3a2a30' },
  /* 🐉 末影 7 把 */
  purpur_sword: { dmg: 2.2, color: '#c8a0ff' },
  void_bow: { dmg: 2.2, bow: 'void', color: '#b48af2' },
  ender_pearl_blade: { dmg: 3, tp: true, color: '#8a5ac8' },
  end_staff: { dmg: 2, staff: true, zapPct: 0.2, color: '#e0ccff' },
  shulker_gun: { dmg: 3, gun: true, color: '#d0b0ff' },
  dragon_breath_blade: { dmg: 4.5, cdMul: 1.2, color: '#b48af2' },
  dragon_fang: { dmg: 6, color: '#e8e8f0' },
  /* 🧨 苦力怕 6 把 */
  powder_dagger: { dmg: 1.6, doublePct: 0.3, color: '#8a8578' },
  tnt_stick: { dmg: 2, cdMul: 0.8, color: '#c8302a' },
  blast_bow: { dmg: 2, bow: 'fire', color: '#ff8a5a' },
  fuse_blade: { dmg: 2.5, zapPct: 0.15, color: '#ffe84a' },
  creeper_hammer: { dmg: 4, cdMul: 1.3, kbMul: 3, color: '#7ec850' },
  titan_fist: { dmg: 5.5, cdMul: 1.2, color: '#5aa832' },
  /* 🌋 火山 20 把 */
  fire_sword: { dmg: 2, color: '#ff9a3d' },
  flame_knife: { dmg: 1.5, cdMul: 0.7, color: '#ffb03d' },
  lava_hammer: { dmg: 3, cdMul: 1.3, kbMul: 2, color: '#ff7a2a' },
  fire_whip: { dmg: 2, rangeMul: 1.5, color: '#ff9a3d' },
  obsidian_sword: { dmg: 3, color: '#4a4a5a' },
  magma_boomerang: { dmg: 2, circle: true, color: '#ff7a2a' },
  lava_bow: { dmg: 1.8, bow: 'fire', freezeDur: 0, color: '#ff9a3d' },
  ash_dual: { dmg: 1.8, cdMul: 0.7, color: '#c8c8d8' },
  red_spear: { dmg: 2, rangeMul: 1.5, color: '#ff6a3d' },
  magma_staff: { dmg: 2, zapPct: 0.2, staff: true, color: '#ffb03d' },
  volcano_axe: { dmg: 3.5, kbMul: 2, color: '#ff7a2a' },
  sulfur_dagger: { dmg: 1.5, poison: 3, color: '#d8d84a' },
  dragon_breath: { dmg: 2.5, burn: true, color: '#ff6a3d' },
  inferno_sword: { dmg: 4, color: '#ff7a2a' },
  magma_heart_blade: { dmg: 3.5, holy: true, color: '#ff8a5a' },
  sky_hammer: { dmg: 4.5, cdMul: 1.3, kbMul: 3, color: '#ffb03d' },
  burst_hammer: { dmg: 4, cdMul: 0.8, kbMul: 3, color: '#ff7a2a' },
  corona_sword: { dmg: 4.5, color: '#ffe84a' },
  doom_fire_sword: { dmg: 5, burn: true, color: '#ff5a2a' },
  eternal_forge: { dmg: 6.5, holy: true, burn: true, color: '#ffd24a' },
  /* ⛈️ 雷域武器 */
  spark_knife: { dmg: 2, cdMul: 0.85, color: '#ffe84a' },
  thunder_sword: { dmg: 2.5, zapPct: 0.15, color: '#fff29a' },
  gale_dagger: { dmg: 2.5, cdMul: 0.65, color: '#f0f8ff' },
  storm_spear: { dmg: 2, rangeMul: 1.5, color: '#ffe84a' },
  volt_dual: { dmg: 2, cdMul: 0.7, color: '#fff29a' },
  cloud_boomerang: { dmg: 2, circle: true, color: '#f0f8ff' },
  thunder_bow: { dmg: 2, bow: 'volt', color: '#ffe84a' },
  sky_axe: { dmg: 3.5, kbMul: 2, color: '#f0f8ff' },
  storm_staff: { dmg: 2.5, zapPct: 0.25, staff: true, color: '#ffe84a' },
  lightning_blade: { dmg: 3, cdMul: 0.8, color: '#ffe84a' },
  volt_rifle: { dmg: 3, gun: true, color: '#fff29a' },
  tempest_hammer: { dmg: 4, kbMul: 2, color: '#f0f8ff' },
  thunder_greatsword: { dmg: 4.5, color: '#ffe84a' },
  cloud_sword: { dmg: 3.5, doublePct: 0.25, color: '#f0f8ff' },
  volt_chain_sword: { dmg: 4, zapPct: 0.2, color: '#ffe84a' },
  storm_caller: { dmg: 4, zapPct: 0.3, color: '#fff29a' },
  sky_splitter: { dmg: 5, color: '#f0f8ff' },
  heaven_bow: { dmg: 3, bow: 'volt', color: '#f0f8ff' },
  thunder_god_hammer: { dmg: 5, kbMul: 3, color: '#ffe84a' },
  final_storm: { dmg: 7, zapPct: 0.3, holy: true, color: '#fff29a' },
  /* 🕳️ 虚空武器 */
  void_dagger: { dmg: 2, cdMul: 0.85, color: '#b48af2' },
  dark_sword: { dmg: 3, color: '#8a5ac8' },
  rift_blade: { dmg: 3, zapPct: 0.2, color: '#b48af2' },
  void_dual: { dmg: 2.5, cdMul: 0.7, color: '#8a5ac8' },
  star_boomerang: { dmg: 2.5, circle: true, color: '#b48af2' },
  void_bow: { dmg: 2.5, bow: 'void', color: '#8a5ac8' },
  dark_spear: { dmg: 3, rangeMul: 1.5, color: '#8a5ac8' },
  gravity_hammer: { dmg: 4.5, kbMul: 3, cdMul: 1.25, color: '#b48af2' },
  star_staff: { dmg: 3, zapPct: 0.25, color: '#d0b0ff' },
  eclipse_sword: { dmg: 4, color: '#8a5ac8' },
  oblivion_dagger: { dmg: 3, doublePct: 0.3, color: '#b48af2' },
  nebula_blade: { dmg: 4, cdMul: 0.8, color: '#d0b0ff' },
  cosmic_axe: { dmg: 4.5, kbMul: 2, color: '#b48af2' },
  void_scythe: { dmg: 5, rangeMul: 1.6, color: '#8a5ac8' },
  void_chain: { dmg: 4, circle: true, color: '#b48af2' },
  star_bow: { dmg: 3.5, bow: 'void', color: '#d0b0ff' },
  abyss_sword: { dmg: 5.5, color: '#8a5ac8' },
  dimension_blade: { dmg: 5, tp: true, color: '#b48af2' },
  chaos_sword: { dmg: 6, color: '#b48af2' },
  final_void: { dmg: 8, zapPct: 0.3, holy: true, color: '#d0b0ff' },
  /* 💎 水晶武器 */
  crystal_blade: { dmg: 8, color: '#a8f2ff' },
  shard_dagger: { dmg: 9, cdMul: 0.9, color: '#c8f4ff' },
  prism_sword: { dmg: 10, color: '#eaf8ff' },
  crystal_bow: { dmg: 9, bow: true, color: '#a8f2ff' },
  refraction_spear: { dmg: 9, rangeMul: 1.4, color: '#a8f2ff' },
  crystal_hammer: { dmg: 12, kbMul: 2, color: '#c8f4ff' },
  diamond_edge: { dmg: 13, color: '#f0f8ff' },
  laser_pen: { dmg: 10, zapPct: 0.2, gun: true, color: '#7ae8f2' },
  rainbow_prism: { dmg: 12, zapPct: 0.25, color: '#a8f2ff' },
  crystal_staff: { dmg: 11, burn: true, staff: true, color: '#a8f2ff' },
  light_blade: { dmg: 12, cdMul: 0.8, color: '#f0f8ff' },
  star_shard_hammer: { dmg: 14, kbMul: 2, color: '#d0f2ff' },
  aurora_sword: { dmg: 13, freezePct: 0.2, freezeDur: 1, color: '#8ff2ea' },
  crystalized_bow: { dmg: 11, bow: true, zapPct: 0.2, color: '#c8f4ff' },
  mirror_boomerang: { dmg: 10, circle: true, color: '#d0f2ff' },
  holy_crystal_lance: { dmg: 14, rangeMul: 1.4, color: '#f0f8ff' },
  amethyst_sword: { dmg: 13, poison: 3, color: '#b48af2' },
  prism_greatsword: { dmg: 16, cdMul: 1.15, color: '#d0f2ff' },
  cavern_lord: { dmg: 25, burn: true, zapPct: 0.25, holy: true, color: '#eaf8ff' },
  glow_pick: { dmg: 8.5, color: '#a8f2ff' },
};
function shopNow() { return level === 13 ? SHOP10 : level === 2 ? SHOP2 : level === 3 ? SHOP3 : level === 4 ? SHOP4 : level === 5 ? SHOP5 : level === 6 ? SHOP6 : level === 7 ? SHOP7 : SHOP; }   // 每关商店完全不同
const ULT_ITEMS = {   // ⭐ 满级奥义 10 式：不进商店，武器/装备练到橙·传说自动觉醒
  ult_fire: { name: '烈焰风暴', icon: '🔥', price: 0, kind: 'skill', desc: '火系满级觉醒：焚尽一切的烈焰环' },
  ult_ice: { name: '绝对零度', icon: '❄️', price: 0, kind: 'skill', desc: '冰系满级觉醒：大范围冻结 4 秒' },
  ult_thunder: { name: '万雷天引', icon: '⚡', price: 0, kind: 'skill', desc: '雷系满级觉醒：十二道天雷连环劈' },
  ult_holy: { name: '神圣审判', icon: '✨', price: 0, kind: 'skill', desc: '圣系满级觉醒：净化全场的圣光' },
  ult_poison: { name: '剧毒新星', icon: '💚', price: 0, kind: 'skill', desc: '毒系满级觉醒：蚀骨毒雾铺天盖地' },
  ult_void: { name: '虚空湮灭', icon: '🕳️', price: 0, kind: 'skill', desc: '暗系满级觉醒：吞噬一切的黑洞' },
  ult_bone: { name: '凋零诅咒', icon: '💀', price: 0, kind: 'skill', desc: '骨系满级觉醒：怨魂锁链夺命' },
  ult_blood: { name: '血之狂暴', icon: '🩸', price: 0, kind: 'skill', desc: '血系满级觉醒：战意燃烧大量回血' },
  ult_wind: { name: '风暴之眼', icon: '🌀', price: 0, kind: 'skill', desc: '风系满级觉醒：化身风暴席卷八方' },
  ult_brave: { name: '勇者怒吼', icon: '🦁', price: 0, kind: 'skill', desc: '凡铁满级觉醒：无畏者的一击定乾坤' },
};
const ALLKIND = {}; for (const t of [SHOP, SHOP2, SHOP3, SHOP4, SHOP5, SHOP6, SHOP7, SHOP8, SHOP9, SHOP10, USE_ITEMS, ULT_ITEMS]) for (const k in t) ALLKIND[k] = t[k].kind;   // 全商品类型表（过关保留技能/宠物用）
function toggleShop(force) {
  paused = force == null ? !paused : force;
  shopEl.style.display = paused ? 'flex' : 'none';
  if (paused) renderShop();
}
document.getElementById('shopClose').onclick = () => { curShop = -1; diaPicking = false; toggleShop(false); };

/* 🏠 主页动态封面：怪物剪影从右往左飘过（进游戏就停） */
let homeMobT = null;
function homeMobsStart() {
  homeMobsStop();
  const card = document.getElementById('homeCard'); if (!card) return;
  const wrap = document.createElement('div'); wrap.className = 'homeMobs'; wrap.id = 'homeMobs';
  card.style.position = 'relative'; card.prepend(wrap);   /* ⚠️ 别动 card 的 overflow：CSS 里定了可滚动，内联会盖掉它 */
  const icons = ['🧟', '👻', '🐉', '🔥', '💀', '🦇'];
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('span'); s.textContent = icons[i];
    s.style.animationDuration = (7 + i * 2.3) + 's'; s.style.animationDelay = (-i * 2.1) + 's'; s.style.top = (12 + i * 14) + '%';
    wrap.appendChild(s);
  }
}
function homeMobsStop() { const w = document.getElementById('homeMobs'); if (w) w.remove(); }
const _closeHome2 = closeHome;
