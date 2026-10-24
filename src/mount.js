'use strict';
/* ================= 🐴 坐骑系统（20 匹：越贵越快/血越厚/攻越强；怪先打坐骑） ================= */
function mountOf(key) { return MOUNTS.find(m => m.key === key); }
function mountOwned(key) { return !!player.owned['mount_' + key]; }
function buyMount(key) {   // 买坐骑（永久拥有；买过再点=骑上/换下）
  const m = mountOf(key); if (!m) return;
  if (!mountOwned(key)) {
    if (player.gold < m.price) { setBanner('💰 金币不够！' + m.name + '要 ' + m.price + ' 金'); beep(200, 150, 0.15, 'square', 0.1); return; }
    player.gold -= m.price; updateGold(); player.owned['mount_' + key] = 1;
    setBanner('🎉 买到 ' + m.icon + ' ' + m.name + '！自动骑上啦'); beep(600, 1200, 0.25, 'sine', 0.16);
  } else if (player.mount === key) {   // 已骑着它 → 下马
    player.mount = null; player.mountHp = 0; setBanner('🐴 ' + m.name + ' 回马厩休息啦'); beep(400, 300, 0.12, 'sine', 0.1); applyGear(); return;
  } else if ((player.mountCd || 0) > 0) { setBanner('😴 坐骑们还在休息，' + Math.ceil(player.mountCd) + ' 秒后能骑'); return; }
  player.mount = key; player.mountHp = m.hp;   // 🐴 骑上（满血出厩）
  setBanner('🐴 骑上 ' + m.icon + ' ' + m.name + '！移速 ×' + m.speed + '，怪物会先打它'); beep(500, 900, 0.18, 'sine', 0.14);
  applyGear();
}
function mountTick(dt) {   // 每帧：复活冷却 + 坐骑自动攻击（偏慢）+ 阵亡检测
  if ((player.mountCd || 0) > 0) player.mountCd = Math.max(0, player.mountCd - dt);
  if (!player.mount) return;
  const m = mountOf(player.mount); if (!m) { player.mount = null; return; }
  player.mountAtkT = (player.mountAtkT || 0) - dt;
  if (player.mountAtkT <= 0 && !townMode && !gameOver) {   // 坐骑攻击：打 90 内最近的怪
    let tgt = null, best = 90;
    for (const z of zombies) { if (z.dead) continue; const d = Math.hypot(z.x - player.x, z.y - player.y); if (d < best) { best = d; tgt = z; } }
    if (tgt) {
      player.mountAtkT = m.cd;
      tgt.hp -= m.dmg; tgt.flash = 0.12;
      burst(tgt.x, tgt.y - 6, '#c8a05a', 5); beep(350, 250, 0.07, 'square', 0.07);   // 🐾 坐骑蹄击
      if (tgt.hp <= 0) killZombie(tgt);
    }
  }
  if ((player.mountHp || 0) <= 0) {   // 💔 坐骑阵亡：回厩休息 60 秒
    burst(player.x, player.y, '#8a8a92', 14); beep(300, 100, 0.4, 'sawtooth', 0.16);
    setBanner('💔 ' + m.name + ' 倒下了……回马厩休息 60 秒');
    player.mount = null; player.mountHp = 0; player.mountCd = 60; applyGear();
  }
}
