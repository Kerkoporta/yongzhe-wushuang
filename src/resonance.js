'use strict';
/* ================= ✨ 灵魂共鸣：武器×宠物×装备的元素系碰撞出神秘力量 ================= */
/* 🌈 十元素系：名字/图标/颜色（ultOfItem 的 elemOf 公共版在 skills.js） */
const ELEMS = {
  fire: ['火', '🔥', '#ff6a2a'], ice: ['冰', '❄️', '#7ac8ff'], thunder: ['雷', '⚡', '#fff29a'],
  holy: ['圣', '✨', '#fff2b0'], poison: ['毒', '💚', '#7ee85a'], void: ['暗', '🕳️', '#8a5ac8'],
  bone: ['骨', '💀', '#e8e8f0'], blood: ['血', '🩸', '#ff5a5a'], wind: ['风', '🌀', '#a8f2d8'],
  brave: ['勇', '🦁', '#ffd24a'],
};
let resActive = [], resTickT = 0, resBlastMul = 0;   // 当前激活的共鸣列表；resBlastMul=爆裂概率
function resCompute() {   // 每半秒重算：手持武器×出战宠物×已购装备 的系碰撞
  const out = [];
  if (!player.weapon || townMode || sandboxMode) { resActive = out; resBlastMul = 0; return; }
  const w = elemOf(player.weapon);
  const gearElems = {};
  for (const gk in player.owned) if (player.owned[gk] && ALLKIND[gk] === 'gear') { const ge = elemOf(gk); gearElems[ge] = (gearElems[ge] || 0) + 1; }
  let blast = 0;
  for (const p of pets) {
    if (p.dead) continue;
    const pe = elemOf(p.key);
    if (pe === w) out.push({ type: 'wp', elem: w, pet: p });   // 🔥 同系武器×宠物：强化+锁定弹
    else out.push({ type: 'wx', elem: w, elem2: pe, pet: p });   // 💫 异系协奏：弱锁定弹
    if (gearElems[pe]) out.push({ type: 'pg', elem: pe });   // 🔗 宠物×装备同系：羁绊攻速
  }
  if (gearElems[w]) { blast += 0.12; out.push({ type: 'wg', elem: w }); }   // 💥 武器×装备同系：击杀爆裂
  // 🌟 大共鸣：武器+至少一只宠物+至少一件装备全同系
  if (out.some(r => r.type === 'wp') && gearElems[w]) { out.push({ type: 'trio', elem: w }); blast += 0.13; }
  resBlastMul = blast;
  // 新发现的共鸣写图鉴+播报
  for (const r of out) {
    const rk = r.type + '_' + r.elem + (r.elem2 ? '_' + r.elem2 : '');
    if (!player.resFound) player.resFound = {};
    if (!player.resFound[rk]) {
      player.resFound[rk] = 1;
      const e1 = ELEMS[r.elem], e2 = r.elem2 ? ELEMS[r.elem2] : null;
      const label = r.type === 'wp' ? e1[1] + e1[0] + '系共鸣·强化！武器+15% 宠物+40%，宠物还会发锁定元素弹'
        : r.type === 'wx' ? '💫 ' + e1[0] + '·' + e2[0] + '协奏！宠物学会了发射' + e1[0] + '之弹'
        : r.type === 'wg' ? '💥 ' + e1[0] + '系共鸣·爆裂！击杀有概率引发元素爆炸'
        : r.type === 'pg' ? '🔗 ' + e1[0] + '系羁绊！宠物攻速提升'
        : '🌟 大共鸣！武器·宠物·装备全是' + e1[0] + '系——神秘力量完全觉醒！';
      setBanner('✨ 灵魂共鸣觉醒：' + label);
      beep(660, 1320, 0.35, 'sine', 0.16); setTimeout(() => beep(880, 1760, 0.4, 'sine', 0.13), 220);
    }
  }
  resActive = out;
  renderResBar();   // ✨ HUD 图标行跟着刷新
}
function resTick(dt) {   // 每帧：半秒重算 + 宠物发锁定弹
  resTickT += dt;
  if (resTickT >= 0.5) { resTickT = 0; resCompute(); }
  for (const r of resActive) {
    if (r.type !== 'wp' && r.type !== 'wx') continue;
    const p = r.pet; if (!p || p.dead) continue;   // 🐾 pet 存的是对象引用（resCompute 每半秒重建，不会拿到死引用）
    p.resT = (p.resT || 0) - dt;
    if (p.resT > 0) continue;
    const trio = resActive.some(x => x.type === 'trio');
    p.resT = r.type === 'wp' ? (trio ? 2 : 3.5) : 5;   // 同系 3.5s（大共鸣 2s）/ 异系 5s
    const z = nearestZ(9999); if (!z) continue;
    const wd0 = WEAPON_FX[player.weapon] || {}; const wd = wd0.dmg != null ? wd0.dmg : 1;   // 🐛 0 伤是合法值
    const dmg = Math.max(1, Math.round(wd * T(player.weapon) * (r.type === 'wp' ? 1.2 : 0.8)));
    const a = Math.atan2(z.y - p.y, z.x - p.x);
    const e = ELEMS[r.elem];
    const shot = { x: p.x, y: p.y - 8, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, t: 2.2, dmg, color: e[2], track: true };
    if (r.elem === 'fire') shot.burn = 1; else if (r.elem === 'ice') shot.freeze = 1.5; else if (r.elem === 'thunder') shot.zapx = 1; else if (r.elem === 'poison') shot.poi = 3;
    skillShots.push(shot);
    burst(p.x, p.y - 10, e[2], 4);
  }
}
function resOnKill(z) {   // 💥 击杀爆裂判定（input.js killZombie 调用）
  if (!resBlastMul || z.boss) return;
  if (Math.random() >= resBlastMul) return;
  const w = resActive.find(r => r.type === 'wg' || r.type === 'trio'); if (!w) return;
  const e = ELEMS[w.elem];
  burst(z.x, z.y, e[2], 14);
  const wdmg2 = (WEAPON_FX[player.weapon] || {}).dmg;
  for (const o of zombies.slice()) if (!o.dead && o !== z && Math.hypot(o.x - z.x, o.y - z.y) < 60) hurtZ(o, Math.max(0, wdmg2 != null ? wdmg2 : 2), e[2]);   // 🐛 0 伤合法；爆炸允许 0 伤（只看不疼）
}
function resDmgMul() { return resActive.some(r => r.type === 'wp') ? 1.15 : 1; }   // 🔥 同系武器+15%
function resPetMul(pet) {   // 宠物伤害倍率：同系+40%；羁绊攻速在宠物攻击冷却处
  return resActive.some(r => r.type === 'wp' && r.pet === pet) ? 1.4 : 1;   // 🐾 对象引用比对象
}
function resCdMul(pet) { return resActive.some(r => r.type === 'pg' && r.elem === elemOf(pet.key)) ? 0.75 : 1; }   // 🔗 羁绊攻速
/* ✨ HUD：状态栏下的共鸣图标行（点它看图鉴） */
function renderResBar() {
  const el = document.getElementById('resBar'); if (!el) return;
  const seen = {};
  let h = '';
  for (const r of resActive) {
    const k = r.type + (r.elem2 || '');
    if (seen[k]) continue; seen[k] = 1;
    h += r.type === 'wp' ? ELEMS[r.elem][1] : r.type === 'wx' ? '💫' : r.type === 'wg' ? '💥' : r.type === 'pg' ? '🔗' : '🌟';
  }
  el.innerHTML = h;
}
function openResDex() {   // ✨ 共鸣图鉴：已发现的亮出来，没发现的是神秘剪影
  paused = true;
  const found = player.resFound || {};
  const total = 10 * 10 * 4 + 10;   // wp/wx/wg/pg 各 10×10 + 大共鸣 10 = 410 种
  const got = Object.keys(found).length;
  let h = '<div style="text-align:center;margin-bottom:8px;opacity:.85">已发现 <b style="color:#ffd24a">' + got + '</b> / ' + total + ' 种共鸣<br><span style="font-size:11px;opacity:.7">武器×宠物×装备的元素系碰撞出的神秘力量</span></div>';
  if (!got) h += '<div style="text-align:center;opacity:.6;padding:16px">还没有发现任何共鸣……<br>带着和你武器同系的宠物/装备出战试试！</div>';
  else {
    for (const k in found) {
      const [tp, e1, e2] = k.split('_');
      const a = ELEMS[e1] || ['?', '❓', '#888'], b = e2 ? (ELEMS[e2] || ['?', '❓', '#888']) : null;
      const txt = tp === 'wp' ? a[1] + ' ' + a[0] + '系共鸣·强化（武器+15% 宠物+40%+锁定元素弹）'
        : tp === 'wx' ? '💫 ' + a[0] + '·' + b[0] + '协奏（宠物发射' + a[0] + '之弹）'
        : tp === 'wg' ? '💥 ' + a[0] + '系爆裂（击杀概率引发元素爆炸）'
        : tp === 'pg' ? '🔗 ' + a[0] + '系羁绊（宠物攻速+25%）'
        : '🌟 ' + a[0] + '系大共鸣（三件同系，力量完全觉醒）';
      h += '<div style="padding:6px 8px;margin:4px 0;background:rgba(255,255,255,.06);border-radius:8px;border-left:3px solid ' + a[2] + '">' + txt + '</div>';
    }
  }
  document.getElementById('resoBody').innerHTML = h;
  document.getElementById('reso').style.display = 'flex';
}
document.getElementById('resBar').onclick = () => { if (!gameOver) openResDex(); };
document.getElementById('resoClose').onclick = () => { document.getElementById('reso').style.display = 'none'; if (!anyPanelOpen()) paused = false; };
