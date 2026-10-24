'use strict';
/* ================= 🔮 紫晶祭坛：关卡/试炼塔随机出现，三个挑战选一（或扭头就走） ================= */
let altar = null;   // { x, y, offers: [3 个挑战 key], taken }
const ALTAR_POOL = [
  { key: 'blood', icon: '🩸', name: '嗜血契约', desc: '怪物血 ×3，但金币掉落 ×3', mods: { hpMul: 3, goldMul: 3 } },
  { key: 'swift', icon: '💨', name: '疾风契约', desc: '怪物跑得飞快 ×1.5，但每只都掉钻石碎片（20% 掉 1💎）', mods: { spdMul: 1.5, diaDrop: 0.2 } },
  { key: 'glass', icon: '💪', name: '玻璃大炮', desc: '你的伤害 ×2，但你受伤也 ×2', mods: { dmgMul: 2, hurtMul: 2 } },
  { key: 'horde', icon: '👹', name: '围攻契约', desc: '刷怪数量 ×2，金币 ×2', mods: { spawnMul: 2, goldMul: 2 } },
  { key: 'elite', icon: '👑', name: '精英猎场', desc: '词缀怪概率 12%→40%，词缀怪金币再 ×2', mods: { affixRate: 0.4, goldMul: 2 } },
  { key: 'greed', icon: '💰', name: '贪婪诅咒', desc: '金币 ×4，但你不能自动回血', mods: { goldMul: 4, noRegen: true } },
];
let altarMods = null;   // 本关生效的修饰（过关/出塔即清）
function altarRollOffers() {   // 抽三个不重复的挑战
  const pool = ALTAR_POOL.slice(); const out = [];
  for (let i = 0; i < 3; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
function altarMaybeSpawn() {   // 关卡/波次开始时 25% 出祭坛（主线+塔内，副本不出）
  if (sandboxMode || townMode || dungeonMode || skyMode) return;
  if (level === 9) return;   // 🐉 末影之地专心屠龙
  if (Math.random() > 0.25) return;
  const a = Math.random() * 6.28, d = 200 + Math.random() * 300;
  altar = { x: Math.max(60, Math.min(WORLD.w - 60, player.x + Math.cos(a) * d)), y: Math.max(60, Math.min(WORLD.h - 60, player.y + Math.sin(a) * d)), offers: altarRollOffers(), taken: false };
  setBanner('🔮 不远处出现了一座紫晶祭坛……');
  beep(330, 660, 0.5, 'sine', 0.14);
}
function openAltar() {   // 摸祭坛：三个挑战摆上来
  if (!altar || altar.taken) return;
  paused = true;
  let h = '<div style="text-align:center;font-size:17px;font-weight:bold;margin-bottom:2px">🔮 紫晶祭坛</div>'
    + '<div style="text-align:center;font-size:12px;opacity:.8;margin-bottom:10px">祭坛低语着……选一个契约，或者扭头就走</div>';
  for (const o of altar.offers) h += `<button data-pact="${o.key}" style="display:block;width:100%;margin:6px 0;padding:10px;border:2px solid #8a5ac8;border-radius:12px;background:#2a1a4a;color:#fff;font-weight:bold;cursor:pointer;text-align:left">${o.icon} ${o.name}<br><span style="font-weight:normal;font-size:12px;opacity:.85">${o.desc}</span></button>`;
  h += '<button id="pactNo" style="width:100%;margin-top:8px;padding:9px;border:0;border-radius:10px;background:#4a4a55;color:#fff;cursor:pointer">🚶 不接受（祭坛消失）</button>';
  document.getElementById('altarBody').innerHTML = h;
  document.getElementById('altar').style.display = 'flex';
  for (const b of document.querySelectorAll('#altarBody button[data-pact]')) b.onclick = () => acceptPact(b.dataset.pact);
  document.getElementById('pactNo').onclick = () => {   // 拒绝：祭坛没了
    document.getElementById('altar').style.display = 'none'; paused = false;
    altar = null; setBanner('🚶 你扭头走了，祭坛化作一缕紫烟散了'); beep(400, 200, 0.2, 'sine', 0.1);
  };
}
function acceptPact(key) {
  const o = altar.offers.find(x => x.key === key);
  altarMods = Object.assign({}, o.mods); altar.taken = true; altar = null;   // 🔮 契约生效，祭坛消散
  document.getElementById('altar').style.display = 'none'; paused = false;
  setBanner('🔮 契约成立：' + o.icon + ' ' + o.name + '！' + o.desc);
  beep(400, 800, 0.3, 'sine', 0.16); burst(player.x, player.y, '#b48af2', 18);
}
