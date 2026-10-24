'use strict';
/* ================= 🐉 末影龙钩子：第一关开场黑影掠顶 ================= */
let dragonHookT = 0, dragonFlyT = 0;
function drawDragonFly(ctx) {   // 屏幕坐标：黑影+紫光眼睛，从右向左呼啸扫过
  if (dragonFlyT <= 0) return;
  const t = 1 - dragonFlyT / 1.6;   // 0→1
  const x = 420 - t * 560, y = 60 + Math.sin(t * 6) * 12, s = 1 + t * 0.4;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#1a0a2a';
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 12, 0, 0, 6.3); ctx.fill();   // 身
  ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(-70, -26); ctx.lineTo(-46, 2); ctx.closePath(); ctx.fill();   // 左翅
  ctx.beginPath(); ctx.moveTo(30, -4); ctx.lineTo(70, -26); ctx.lineTo(46, 2); ctx.closePath(); ctx.fill();   // 右翅
  ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-72, 6); ctx.lineTo(-46, 8); ctx.closePath(); ctx.fill();   // 尾
  ctx.fillStyle = '#b48af2'; ctx.fillRect(38, -6, 4, 3); ctx.fillRect(38, 3, 4, 3);   // 💜 紫眼睛
  ctx.restore(); ctx.globalAlpha = 1;
}
function update(dt) {
  if (paused) return;   // 🏪 逛商店时僵尸等你
  if (sandboxMode && gameOver) {   // 🔮 旁观者死了：不进死亡结算，直接回选关台（装备全在）
    gameOver = false; deathT = 0; player.hearts = player.maxHearts; player.x = WORLD.w / 2; player.y = WORLD.h / 2;
    document.getElementById('over').style.display = 'none'; openSandboxPicker(); return;
  }
  banner.t = Math.max(0, banner.t - dt); shakeT = Math.max(0, shakeT - dt);
  if (hitstopT > 0) { hitstopT -= dt; return; }   // 💥 顿帧：命中那一瞬全世界冻住（只有震屏还在抖），这才叫打中了！
  if (slamFx) { slamFx.t -= dt; if (slamFx.t <= 0) slamFx = null; }
  hurtT = Math.max(0, hurtT - dt);   // 💥 受击后仰计时
  if (player.hearts < prevHearts) hurtT = 0.28;   // 掉血瞬间后仰一下
  prevHearts = player.hearts;
  // 🥷 刺客计时：传送窗口 + 超时换回弓
  if (tpWindowT > 0) tpWindowT = Math.max(0, tpWindowT - dt);
  if (assassinSwapT > 0) {
    assassinSwapT = Math.max(0, assassinSwapT - dt);
    if (assassinSwapT === 0 && prevBow) { player.weapon = prevBow; prevBow = null; assassinStrike = false; setBanner('🏹 两秒到，换回弓'); }
  }
  // 🛡️ 坦克计时：举盾期间无敌（靠 inv 统一挡所有伤害），冷却读秒上按钮
  if (blockT > 0) { blockT = Math.max(0, blockT - dt); player.inv = Math.max(player.inv, blockT + 0.05); }   // 无敌罩住整段举盾（帧长多大都不漏）
  if (playerFlyT > 0) {   // 🦅 被末影龙顶飞：落地掉 3 血（摔伤躲不掉）
    playerFlyT -= dt;
    if (playerFlyT <= 0) {
      player.hearts -= rollDmg(3); player.sinceHurt = 0; player.regenT = 0; shakeT = 0.5;
      burst(player.x, player.y, '#b48af2', 12); burst(player.x, player.y, '#8a8578', 8); beep(200, 80, 0.3, 'sawtooth', 0.2);
      if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
    }
  }
  if (blockCd > 0) blockCd = Math.max(0, blockCd - dt);
  if (player.bearT > 0) player.bearT = Math.max(0, player.bearT - dt);   // 🐻 熊形态倒计时
  mountTick(dt);   // 🐴 坐骑：自动攻击+阵亡检测+复活冷却
  resTick(dt);   // ✨ 灵魂共鸣：系别碰撞重算+宠物发锁定弹
  if (player.burnT > 0) { player.burnT -= dt; player.burnAcc = (player.burnAcc || 0) + dt; if (player.burnAcc >= 1) { player.burnAcc -= 1; player.hearts -= 0.5; player.sinceHurt = 0; burst(player.x, player.y, '#ff9a3d', 4); } }   // 🔥 灼烧词缀打的：着火每秒半心
  if ((player.slowT || 0) > 0) player.slowT -= dt;   // ❄️ 霜冻减速倒计时
  if (dragonHookT > 0) {   // 🐉 开场钩子：第一关 4 秒后龙影掠顶
    dragonHookT -= dt;
    if (dragonHookT <= 0 && level === 1 && !townMode && !dungeonMode && !skyMode) {
      dragonFlyT = 1.6; setBanner('🐉 一头巨龙从头顶呼啸而过……它好像在第九关等着谁'); beep(90, 60, 0.8, 'sawtooth', 0.2);
    }
  }
  if (dragonFlyT > 0) dragonFlyT -= dt;
  if (bearCd > 0) bearCd = Math.max(0, bearCd - dt);
  if (player.shieldT > 0) player.shieldT = Math.max(0, player.shieldT - dt);   // 🛡️ 魔法护盾倒计时
  const m0 = Math.floor(player.mana != null ? player.mana : 100);
  player.mana = Math.min(player.maxMana || 100, (player.mana != null ? player.mana : 100) + 4 * dt);   // 🔵 蓝条：每 0.1 秒回 0.4（=每秒 4 点，恩泽 1023 改的，法术放得更勤了）
  if (Math.floor(player.mana) !== m0) updateMana();
  const bkBtn = document.getElementById('blockBtn');
  if (player.job === 'tank' && !gameOver && !paused && !townMode) {
    bkBtn.style.display = 'block';
    bkBtn.textContent = blockCd > 0 ? `🛡️ ${blockCd.toFixed(1)}s` : '🛡️ 格挡！';
    bkBtn.style.opacity = blockCd > 0 ? 0.5 : 1;
  } else bkBtn.style.display = 'none';
  document.getElementById('eatFishBtn').style.display = (player.holdFish && (player.items[player.holdFish] || 0) > 0 && !gameOver && !paused) ? 'block' : 'none';   // 😋 手里拿着鱼才有「吃掉」
  const brBtn = document.getElementById('bearBtn');   // 🐻 德鲁伊专属按钮（仿格挡）
  if (player.job === 'druid' && !gameOver && !paused && !townMode) {
    brBtn.style.display = 'block';
    brBtn.textContent = player.bearT > 0 ? '🐻 ' + player.bearT.toFixed(1) + 's' : bearCd > 0 ? '🐻 ' + Math.ceil(bearCd) + 's' : '🐻 变熊！';
    brBtn.style.opacity = (bearCd > 0 || player.bearT > 0) ? 0.55 : 1;
  } else brBtn.style.display = 'none';
  document.getElementById('tpBtn').style.display = (player.job === 'assassin' && tpWindowT > 0 && tpLand && !gameOver && !paused && !townMode) ? 'block' : 'none';
  if (gameOver) { deathT += dt; const ov = document.getElementById('over'); if (ov) ov.style.display = deathT > 1.2 ? 'flex' : 'none'; }   // 💀 先看倒下动画，1.2 秒后才弹面板
  if (!gameOver) {
    /* 🗡️ 光影剑残影中：不能移动、全程无敌、0.5 秒到点闪回原点 */
    if (player.tpT > 0) {
      player.tpT -= dt; player.inv = Math.max(player.inv, player.tpT + 0.02);
      if (player.tpT <= 0) {
        player.x = player.tpRx; player.y = player.tpRy;
        burst(player.x, player.y, '#8fd8ff', 14); beep(1200, 700, 0.12, 'sine', 0.1);
      }
    } else if (!(player.frozenT > 0) && blockT <= 0 && playerFlyT <= 0) {   // ❄️ 冻住/🛡️举盾/🦅被顶飞时不能动
      let mx = joyVec.x, my = joyVec.y;
      if (sittingBench) {   // 🪑 坐着：推摇杆=起身
        if (Math.abs(mx) + Math.abs(my) > 0.1) { sittingBench = null; setBanner('🪑 起身啦'); }
        else { mx = 0; my = 0; }
      }
      if (keys['a'] || keys['arrowleft']) mx -= 1; if (keys['d'] || keys['arrowright']) mx += 1;
      if (keys['w'] || keys['arrowup']) my -= 1; if (keys['s'] || keys['arrowdown']) my += 1;
      if (rotated) { const t = mx; mx = my; my = -t; }   // 🔄 转屏后输入方向跟着转 90°
      const slow = player.drainSlow ? 0.4 : 1; player.drainSlow = false;   // ⛓️ 夺魂锁链减速
      if ((player.slowT || 0) > 0) player.drainSlow = true;   // ❄️ 霜冻词缀怪打的：减速中
      if (Math.abs(mx) + Math.abs(my) > 0.1) playerStillT = 0; else playerStillT += dt;   // 🤫 站着不动计时（坚守者瞎，看不见静止的你）
      playerStep(player, mx, my, dt, (player.speedMul || 1) * slow * (player.speedT > 0 ? 1.4 : 1) * (player.job === 'engineer' ? 0.9 : 1) * (player.mount ? mountOf(player.mount).speed : 1));   // 👟 跑鞋皇冠加速+⚡疾跑药水+🧲工程师腿短+🐴坐骑提速
    }
    if ((autoOn || holdAtk) && !(player.frozenT > 0) && blockT <= 0) { autoT -= dt; if (autoT <= 0) { autoT = 0.2; doAttack(true); } }   // ⚔️ 自动/按住：0.2 秒一刀（举盾时停手；手柄 Y=自动开关、X=单发攻击）
    /* ✨ 技能冷却递减 + 按钮显示 */
    player.powerT = Math.max(0, (player.powerT || 0) - dt); player.ironT = Math.max(0, (player.ironT || 0) - dt); player.speedT = Math.max(0, (player.speedT || 0) - dt);   // 🍗 药水计时
    if (player.skillCds) for (const k in player.skillCds) player.skillCds[k] = Math.max(0, player.skillCds[k] - dt);
    for (const r of skillRefs) {
      const c = (player.skillCds && player.skillCds[r.k]) || 0;
      r.btn.classList.toggle('oncd', c > 0);
      const t = c > 0 ? String(Math.ceil(c)) : '';
      if (r.cd.textContent !== t) r.cd.textContent = t;
    }
    /* ✨ 技能弹道（大火球/共鸣锁定弹等） */
    for (const s of skillShots) {
      s.t -= dt;
      if (s.track) {   // 🔒 共鸣锁定弹：空中转向追最近怪
        const tz = nearestZ(9999);
        if (tz) { const ta = Math.atan2(tz.y - s.y, tz.x - s.x), sp = Math.hypot(s.vx, s.vy); s.vx += (Math.cos(ta) * sp - s.vx) * 6 * dt; s.vy += (Math.sin(ta) * sp - s.vy) * 6 * dt; }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (Math.random() < 0.5) burst(s.x, s.y, s.color, 1);
      for (const z of zombies) {
        if (z.dead) continue;
        if (Math.hypot(z.x - s.x, z.y - s.y) < z.r + 10) {
          hurtZ(z, s.dmg, s.color);
          if (s.burn) { z.burnT = 2; z.burnAcc = 0; }
          if (s.freeze) z.freezeT = s.freeze;
          if (s.zapx) z.hp -= 2;
          if (s.poi && !z.dead) { z.poiT = s.poi; z.poiAcc = 0; z.poiColor = null; }   // 💚 毒弹挂毒
          s.t = 0; break;
        }
      }
    }
    skillShots = skillShots.filter(s => s.t > 0);
    /* ☁️ 毒雾：里面的怪每 0.1 秒掉十分之一血 */
    for (const c of clouds) {
      c.t -= dt; c.acc += dt;
      if (c.acc >= 0.1) { c.acc -= 0.1; for (const z of zombies.slice()) if (!z.dead && Math.hypot(z.x - c.x, z.y - c.y) < c.r) hurtZ(z, dotDmg(z), c.color); }
    }
    clouds = clouds.filter(c => c.t > 0);
    for (const f of fxLines) f.t -= dt;
    fxLines = fxLines.filter(f => f.t > 0);
    if (!document.hidden) { saveT -= dt; if (saveT <= 0) { saveT = 2; saveGame(); } }   // 💾 每 2 秒自动存档（只有前台页面才写，后台旧页面不许盖）
    if (pvpMode) { pvpT -= dt; if (pvpT <= 0) { pvpT = 0.1; pvpWrite(); } pvpRead(); }   // 📡 PVP：0.1 秒一存+每帧读对面（恩泽设计：存档直通当网络用）
    // 🎛️ 靠近商店才出现的旧独占显示已并入下方情境按钮（勿再加回）
    if (townMode && !inRoom) {
      const fd = Math.hypot(player.x - 1200, player.y - 1840);   // ⛲ 喷泉挡路，绕圈走
      if (fd < 52 && fd > 0) { const fa = Math.atan2(player.y - 1840, player.x - 1200); player.x = 1200 + Math.cos(fa) * 52; player.y = 1840 + Math.sin(fa) * 52; }
      const td = Math.hypot(player.x - 1200, player.y - 2080);   // 🗼 试炼塔挡路
      if (td < 60 && td > 0) { const ta = Math.atan2(player.y - 2080, player.x - 1200); player.x = 1200 + Math.cos(ta) * 60; player.y = 2080 + Math.sin(ta) * 60; }
      const gd = Math.hypot(player.x - DGN_GATE.x, player.y - DGN_GATE.y);   // 🌲 副本大门挡路（从正面按钮进）
      if (gd < 42 && gd > 0) { const ga2 = Math.atan2(player.y - DGN_GATE.y, player.x - DGN_GATE.x); player.x = DGN_GATE.x + Math.cos(ga2) * 42; player.y = DGN_GATE.y + Math.sin(ga2) * 42; }
      if (!plazaSeen && player.x > 920 && player.x < 1480 && player.y > 1560 && player.y < 2120) { plazaSeen = true; setBanner('⛲ 发现小镇广场！喷泉好凉快~'); }
      Games.runTick(dt); Games.arenaTick(dt); Games.mazeTick();   // 🎡 游乐场三项世界玩法（跑酷/擂台/迷宫）
    }
    // 🎛️ 情境按钮：宝箱 > 商店 > 长椅（靠近两格内才出现，点了才动作）
    let ctxAct = null, ctxBench = null, ctxPlay = -1;
    if (!gameOver && !paused && !sittingBench) {
      if (chest && !townMode && Math.hypot(player.x - chest.x, player.y - chest.y) < 64) ctxAct = chest.taken ? (pendingNext ? 'next' : null) : 'chest';
      else if (nearShop() >= 0) ctxAct = 'shop';
      else if (townMode && !inRoom && Math.hypot(player.x - 1200, player.y - 2080) < 100) ctxAct = 'tower';   // 🗼 试炼塔门口
      else if (townMode && !inRoom && Math.hypot(player.x - 1200, player.y - 2320) < 110) ctxAct = 'gate';   // ⚔️ 镇南城门：出镇冒险
      else if (altar && !altar.taken && !townMode && Math.hypot(player.x - altar.x, player.y - altar.y) < 110) ctxAct = 'altar';   // 🔮 紫晶祭坛前（主线/塔内）
      else if (townMode && !inRoom && Math.hypot(player.x - DGN_GATE.x, player.y - DGN_GATE.y) < 100) ctxAct = 'dungeon';   // 🌲 副本门口
      else if (townMode && !inRoom && (ctxPlay = Games.nearPlay()) >= 0) ctxAct = 'play';   // 🎡 游乐项目摊位
      else if (townMode && !inRoom) { for (const b of BENCHES) if (Math.hypot(player.x - b.x, player.y - b.y) < 64) { ctxAct = 'bench'; ctxBench = b; break; } }
    }
    const eb = document.getElementById('enterBtn');
    eb.style.display = ctxAct ? 'block' : 'none';
    if (ctxAct) eb.textContent = ctxAct === 'chest' ? '🎁 打开宝箱' : ctxAct === 'next' ? '🗺️ 下一关' : ctxAct === 'tower' ? '🗼 进入试炼塔' : ctxAct === 'gate' ? '⚔️ 出镇冒险' : ctxAct === 'altar' ? '🔮 触摸祭坛' : ctxAct === 'dungeon' ? '🌲 进入哥布林森林' : ctxAct === 'bench' ? '🪑 坐下' : ctxAct === 'play' ? '🎮 玩' + ATTRACT[ctxPlay].name : '🚪 进入';
    window.__ctx = { act: ctxAct, bench: ctxBench, play: ctxPlay };   // B 键/按钮共用
    if (townMode && !paused && !gameOver) {   // 🏡 小镇里的家：门/床/柜子
      if (ownedHouse && !inRoom && Math.hypot(player.x - 1200, player.y - 700) < 40) { inRoom = true; player.x = 1200; player.y = 1380; setBanner('🏠 到家啦！'); }
      else if (inRoom) {
        if (player.y > 1470) { inRoom = false; player.x = 1200; player.y = 760; }
        else {
          const dBed = Math.hypot(player.x - 1050, player.y - 1150), dCab = Math.hypot(player.x - 1360, player.y - 1150);
          if (dBed > 70 && dCab > 70) roomLatch = '';
          if (dBed < 48 && roomLatch !== 'bed') { roomLatch = 'bed'; askBed(); }
          else if (dCab < 48 && roomLatch !== 'cab') { roomLatch = 'cab'; openStore(); }
        }
      }
    }
    player.cd = Math.max(0, player.cd - dt); player.atkT = Math.max(0, player.atkT - dt); player.inv = Math.max(0, player.inv - dt); player.critT = Math.max(0, (player.critT || 0) - dt);
    player.frozenT = Math.max(0, (player.frozenT || 0) - dt);   // ❄️ 骷髅王寒冰
    player.bowCd = Math.max(0, (player.bowCd || 0) - dt);       // 🏹 弓 1 秒一支
    regenTick(player, dt);   // ❤️ 回血机制
    /* 🌟 职业被动区：💚牧师治疗光环 / ⏳时空全场冻结 / 🧲工程师炮塔 */
    if (player.job === 'cleric') {
      clericT -= dt;
      if (clericT <= 0) {   // 每 2 秒全队回 0.1（自己+宠物+狼）
        clericT = 2;
        if (player.hearts < player.maxHearts) { player.hearts = Math.min(player.maxHearts, player.hearts + 0.1); dotBurst(player.x, player.y - 14, '#7aff8a'); }
        for (const pt of pets) if (!pt.dead && (pt.hp || 0) < petMaxHp(pt.key)) pt.hp = Math.min(petMaxHp(pt.key), (pt.hp || 0) + 0.1);
        for (const w of wolves) w.hp = Math.min(6, w.hp + 0.1);
      }
    }
    if (player.job === 'chrono' && !townMode) {   // ⏳ 每 45 秒全场冻结 2 秒
      chronoT -= dt;
      if (chronoT <= 0) {
        if (zombies.some(z => !z.dead)) { chronoT = 45; freezeAllT = 2; setBanner('⏳ 时间静止！全场冻结 2 秒！'); beep(900, 300, 0.4, 'sine', 0.16); }
        else chronoT = 5;   // 场上没怪：5 秒后再瞅瞅
      }
    }
    if (freezeAllT > 0) freezeAllT = Math.max(0, freezeAllT - dt);
    if (player.job === 'engineer' && !townMode) {   // 🧲 每 12 秒自动部署炮塔（最多 2 座，旧的退役）
      turretT -= dt;
      if (turretT <= 0) {
        turretT = 12;
        if (turrets.length >= 2) turrets.shift();
        turrets.push({ x: Math.max(30, Math.min(WORLD.w - 30, player.x + (Math.random() - 0.5) * 60)), y: Math.max(30, Math.min(WORLD.h - 30, player.y + (Math.random() - 0.5) * 60)), cd: 0.5, ang: 0 });
        burst(player.x, player.y, '#c8ccd4', 8); setBanner('🧲 炮塔部署！（' + turrets.length + '/2）'); beep(300, 620, 0.12, 'square', 0.12);
      }
    }
    for (const tr of turrets) {   // 🧲 炮塔自动开火：1 秒一发，打 240 内最近的怪
      tr.cd -= dt;
      if (tr.cd > 0) continue;
      let tgt2 = null, bd2 = 240;
      for (const z of zombies) { if (z.dead || z.fake) continue; const dd = Math.hypot(z.x - tr.x, z.y - tr.y); if (dd < bd2) { bd2 = dd; tgt2 = z; } }
      if (tgt2) { tr.cd = 1; tr.ang = Math.atan2(tgt2.y - tr.y, tgt2.x - tr.x); tgt2.hp -= 1; tgt2.flash = 0.12; burst(tgt2.x, tgt2.y, '#ffe84a', 3); beep(760, 520, 0.04, 'square', 0.03); if (tgt2.hp <= 0) killZombie(tgt2); }
    }
    if (townMode && turrets.length) turrets = [];   // 🏡 小镇和平：炮塔收起来
    const diff = difficulty(kills), cloakMul = (player.owned.cloak ? 0.8 : 1) * (player.owned.radar ? 0.9 : 1) * (player.owned.snow_goggles ? 0.95 : 1) * (player.owned.fox_cloak ? 0.9 : 1) * (player.owned.snow_radar ? 0.92 : 1) * (player.owned.ghost_cloak ? 0.9 : 1) * (player.owned.wind_bell ? 0.92 : 1) * (player.owned.lava_badge ? 0.92 : 1) * (player.owned.storm_cloak ? 0.9 : 1) * (player.owned.shadow_cloak ? 0.9 : 1) * (1 - modVal('slow'));   // 🧥📡🥽🦊👻🎐🎖️🌫️🦇🥻 减速全家桶
    spawnT -= dt;
    const SPAWN_MUL = [0, 1, 1.1, 0.9, 0.78, 0.7, 0.62];   // 🌡️ 难度爬坡：每关刷怪间隔倍率（越往后越密：2s/2.2s/1.8s/1.6s/1.4s/1.24s）
    const cap = diff.cap + (level - 1) * 2;                 // 🌡️ 同屏上限每关+2（越往后越围攻）
    const bossAlive = zombies.some(z => z.boss && !z.dead);
    if (bossAlive && !dungeonMode) {   // 👹 BOSS 战：小怪停止刷新，每 10 秒 BOSS 召唤 3 只（受上限保护；🌲 副本王不召唤）
      summonT -= dt;
      if (summonT <= 0) {
        summonT = 10;
        const room = cap - zombies.filter(z => !z.dead && !z.boss).length;
        const n = Math.min(3, Math.max(0, room));
        for (let i = 0; i < n; i++) spawnEnemy();
        if (n > 0) { const bb = zombies.find(z => z.boss && !z.dead); if (bb) burst(bb.x, bb.y, '#b48af2', 12); setBanner('👹 BOSS 召唤了小怪！'); beep(180, 320, 0.25, 'sawtooth', 0.15); }
      }
    } else if (!townMode && !dungeonMode && !pvpMode && spawnT <= 0 && zombies.filter(z => !z.dead).length < cap) { spawnT = SPAWN.interval * (SPAWN_MUL[level] || 1); spawnEnemy(); }
    if (!townMode && !dungeonMode && !pvpMode && kills >= bossAt) { bossAt += 100; spawnBoss(); }   // 👹 每满 100 杀出一只 BOSS（天空城不出）
    if (dungeonMode && !gameOver && !pvpMode) {   // 🌲 副本里 BOSS 也算波次
      spawnT -= dt;
      if (!dgnKingSpawned && spawnT <= 0 && zombies.filter(z => !z.dead).length < 9) { spawnT = 1.4; Dgn.spawnGoblin(); }
      if (dgnKills >= DGN_GOAL && !dgnKingSpawned) Dgn.spawnDgnKing();
      if (dgnExit != null) { dgnExit -= dt; if (dgnExit <= 0) Dgn.exitDungeon(false); }
    }
    if (skyMode && !gameOver) {   // ☁️ 天空城：钓鱼+PVP 区+鱼商人
      player.x = Math.max(480, Math.min(1920, player.x)); player.y = Math.max(620, Math.min(1900, player.y));   // 云岛边缘有围墙，掉不下去
      Sky.fishTick(dt);
      const fb = document.getElementById('fishBtn');
      const showFb = nearPond() && !paused;
      fb.style.display = showFb ? 'block' : 'none';
      if (showFb) { const lbl = fishState === 'bite' ? '❗ 收杆！' : fishState ? '🎣 等鱼…（点=收杆）' : '🎣 抛杆'; if (fb.textContent !== lbl) fb.textContent = lbl; }
      if (Math.hypot(player.x - SKY_SHOP.x, player.y - SKY_SHOP.y) < 140) { window.__ctx = { act: 'fishshop' }; const nb = document.getElementById('enterBtn'); nb.textContent = '🐟 鱼商人（卖鱼换钱） [B]'; nb.style.display = 'block'; }
      else if (Math.hypot(player.x - 640, player.y - 1820) < 100) { window.__ctx = { act: 'skyleave' }; const nb = document.getElementById('enterBtn'); nb.textContent = '🚪 回冒险 [B]'; nb.style.display = 'block'; }
      if (player.hearts <= 0) {   // ⚔️ 擂台上被打倒：不死，回城门口复活（半血），还能再挑战
        player.hearts = Math.max(1, Math.ceil(player.maxHearts / 2)); player.x = 1200; player.y = 1830; player.inv = 2; fishState = null; bobber = null;
        setBanner('😵 被打出擂台了……在城门口复活（半血）！+200 金 +10💎 归对面'); burst(player.x, player.y, '#ffffff', 16); beep(300, 150, 0.3, 'sawtooth', 0.15);
      }
    }
    for (const z of zombies) { if (z.dead) continue;
      if (freezeAllT > 0) { z.flash = Math.max(0, z.flash - dt); continue; }   // ⏳ 时空冻结：全场罚站（时间真的停了）
      if (z.boss) { if (dotTick(z, dt)) continue; bossUpdate(z, dt); continue; }   // 👹 BOSS 有自己的大脑（🔥 但燃烧/中毒照掉血——恩泽点名末影龙要吃燃烧）
      z.flash = Math.max(0, z.flash - dt); z.walkT += dt; z.zapT = Math.max(0, (z.zapT || 0) - dt);
      if (z.affix === 'regen' && !z.dead) z.hp = Math.min(z.maxHp || z.hp, z.hp + 0.6 * dt);   // ♻️ 再生词缀：慢慢回血
      if (dotTick(z, dt)) continue;   // 🔥 DoT 结算（燃烧/附火/中毒）
      if (z.freezeT > 0) { z.freezeT -= dt; continue; }   // 🏹 冰冻：动不了也咬不了人
      if (z.slowT > 0) z.slowT -= dt;   // 🐾 宠物减速
      const slowF = z.slowT > 0 ? 0.5 : 1;   // 🐾 被宠物黏住：速度减半
      if (z.crystal) {   // 💠 激光怪：远远盘旋+飞快激光；近身被抓=半心
        const cev = crystalTick(z, player, dt, diff.speedMul * cloakMul * slowF, Math.random);
        if (cev.bolt) {
          earrows.push({ x: cev.bolt.x, y: cev.bolt.y, vx: cev.bolt.dx * 400, vy: cev.bolt.dy * 400, t: 1.5, laser: true });
          burst(z.x, z.y - 8, '#a8f2ff', 4); beep(1300, 1000, 0.05, 'square', 0.05);
        }
        const dmgC = rollDmg(0.5);
        if (touchHurt(player, z, dmgC)) {
          beep(300, 120, 0.15, 'sawtooth', 0.12); burst(player.x, player.y, '#a8f2ff', 6);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }   // 💀 死亡不存档（要存只能回主页存第一关）
        }
        continue;
      }
      if (z.storm) {   // ⛈️ 雷云精：盘旋+直线电光弹；近身被抓=半心
        const sev = stormTick(z, player, dt, diff.speedMul * cloakMul * slowF, Math.random);
        if (sev.bolt) {
          earrows.push({ x: sev.bolt.x, y: sev.bolt.y, vx: sev.bolt.dx * 340, vy: sev.bolt.dy * 340, t: 1.5, volt: true });
          burst(z.x, z.y - 8, '#ffe84a', 4); beep(1100, 880, 0.06, 'square', 0.06);
        }
        const dmgT = rollDmg(0.5);
        if (touchHurt(player, z, dmgT)) {
          beep(300, 120, 0.15, 'sawtooth', 0.12); burst(player.x, player.y, '#ffe84a', 6);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }   // 💀 死亡不存档（要存只能回主页存第一关）
        }
        continue;
      }
      if (z.voidw) {   // 🕳️ 虚空行者：瞬移贴脸挥爪 1 心
        const vev = voidTick(z, player, dt, diff.speedMul * cloakMul * slowF, Math.random);
        if (vev.blink) { burst(z.x, z.y, '#b48af2', 14); beep(600, 1400, 0.14, 'sine', 0.1); }
        const dmgV = rollDmg(1);
        if (touchHurt(player, z, dmgV)) {
          beep(260, 100, 0.2, 'sine', 0.16); burst(player.x, player.y, '#b48af2', 10); shakeT = Math.max(shakeT, 0.15);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }   // 💀 死亡不存档（要存只能回主页存第一关）
        }
        continue;
      }
      if (z.ghost) {   // 👻 鬼魂：飘忽近战，抓到 1 心（盔甲照挡）
        ghostTick(z, (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player, dt, diff.speedMul * cloakMul * slowF);   // 🐺 追仇恨目标
        const dmgG = rollDmg(1);
        if (touchHurt(player, z, dmgG)) {
          beep(300, 120, 0.2, 'sine', 0.16); burst(player.x, player.y, '#8ff2ea', 10); shakeT = Math.max(shakeT, 0.15);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }   // 💀 死亡不存档（要存只能回主页存第一关）
        }
        continue;
      }
      if (z.slime) {   // 🟢 史莱姆：蹦跳追人，咬半心
        slimeTick(z, (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player, dt, diff.speedMul * cloakMul * slowF);   // 🐺 追仇恨目标
        const dmgS2 = rollDmg(0.5);
        if (touchHurt(player, z, dmgS2)) {
          beep(300, 120, 0.15, 'sine', 0.12); burst(player.x, player.y, '#7ec850', 6);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
        }
        continue;
      }
      if (z.bat) {   // 🦇 蝙蝠：飞快扑腾，咬一口半心
        const bt = (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player;
        const bdx = bt.x - z.x, bdy = bt.y - z.y, bd = Math.hypot(bdx, bdy) || 1;
        z.x += (bdx / bd * 120 + Math.cos(z.walkT * 6) * 45) * dt * diff.speedMul; z.y += (bdy / bd * 120 + Math.sin(z.walkT * 7) * 45) * dt * diff.speedMul;
        const dmgB = rollDmg(0.5);
        if (touchHurt(player, z, dmgB)) {
          beep(500, 200, 0.12, 'sine', 0.1); burst(player.x, player.y, '#4a5a6a', 5);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
        }
        continue;
      }
      if (z.goblin) {   // 🌲 哥布林：抡木棍追人，抓到 1 心
        zombieStep(z, (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player, dt, diff.speedMul * cloakMul * slowF);
        const dmgGb = rollDmg(1);
        if (touchHurt(player, z, dmgGb)) {
          beep(300, 120, 0.15, 'sawtooth', 0.12); burst(player.x, player.y, '#5a8a2a', 6);
          if (player.hearts <= 0 && !angelSave()) { Dgn.dgnDie(); }
        }
        continue;
      }
      if (z.creep) {   // 🧨 苦力怕：悄悄靠近→引信→自爆（不咬人）
        creepTick(z, (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player, dt, diff.speedMul * cloakMul * slowF);   // 🐺 追仇恨目标
        continue;
      }
      if (z.lava) {   // 🌋 岩浆怪：蹦跳近战，抓到 1 心（盔甲照挡）
        lavaTick(z, (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player, dt, diff.speedMul * cloakMul * slowF);   // 🐺 追仇恨目标
        const dmgL = rollDmg(1);
        if (touchHurt(player, z, dmgL)) {
          beep(260, 100, 0.2, 'sawtooth', 0.16); burst(player.x, player.y, '#ff7a2a', 10); shakeT = Math.max(shakeT, 0.15);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }   // 💀 死亡不存档（要存只能回主页存第一关）
        }
        continue;
      }
      if (z.skel) {   // 💀 骷髅弓手：游走+直线射箭；近身被抓=半心
        const sev = skeletonTick(z, player, dt, diff.speedMul * cloakMul * slowF, Math.random);
        if (sev.arrow) {
          earrows.push({ x: sev.arrow.x, y: sev.arrow.y, vx: sev.arrow.dx * 240, vy: sev.arrow.dy * 240, t: 1.8 });
          burst(z.x, z.y - 8, '#f0e6b0', 4); beep(880, 660, 0.08, 'square', 0.07);   // 弓弦响
        }
        const dmgS = rollDmg(0.5);
        if (touchHurt(player, z, dmgS)) {
          beep(300, 120, 0.15, 'sawtooth', 0.12); burst(player.x, player.y, '#e8dca0', 6);
          if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
        }
        continue;
      }
      zombieStep(z, (z.aggroW && z.aggroW.hp > 0) ? z.aggroW : player, dt, diff.speedMul * cloakMul * slowF * (1 + (level - 1) * 0.05));   // 🌡️ 难度爬坡：每关怪物再快 5%；🐺 追仇恨目标
      const dmgRoll = rollDmg(1);   // 🛡️ 盔甲判定：金盔甲格挡，铁甲/皮甲/锁子甲减半
      if (touchHurt(player, z, dmgRoll)) {
        if (player.owned.thorns) { z.hp -= 2; z.flash = 0.12; burst(z.x, z.y, '#7ec850', 8); if (z.hp <= 0) killZombie(z); }   // 🌵 荆棘反伤
        if (player.owned.spring) { const sdx = z.x - player.x, sdy = z.y - player.y, sd = Math.hypot(sdx, sdy) || 1;   // 🌀 弹簧鞋弹飞
          z.x = Math.max(20, Math.min(WORLD.w - 20, z.x + sdx / sd * 130)); z.y = Math.max(20, Math.min(WORLD.h - 20, z.y + sdy / sd * 130)); }
        beep(dmgRoll === 0 ? 700 : dmgRoll === 0.5 ? 500 : 140, dmgRoll === 0 ? 900 : dmgRoll === 0.5 ? 300 : 60, dmgRoll === 1 ? 0.25 : 0.1, 'sawtooth', 0.16);
        burst(player.x, player.y, dmgRoll === 0 ? '#ffe84a' : dmgRoll === 0.5 ? '#a8c8e8' : '#e84a4a', dmgRoll === 1 ? 10 : 6);
        if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只僵尸！`; document.getElementById('over').style.display = 'flex'; }
      }
    }
    /* 🏹 骷髅王巨箭：追踪玩家 5 秒（转向有限，绕圈能甩开），速度=玩家 */
    for (const ga of garrows) {
      ga.t -= dt;
      const want = Math.atan2(player.y - ga.y, player.x - ga.x);
      const diff = ((want - ga.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ga.ang += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
      ga.x += Math.cos(ga.ang) * ga.speed * dt; ga.y += Math.sin(ga.ang) * ga.speed * dt;
      if (ga.t > 0 && !gameOver && !(player.tpT > 0) && Math.hypot(player.x - ga.x, player.y - ga.y) < PLAYER.r + 16) {
        ga.t = 0;
        const dmg = rollDmg(1);
        if (dmg > 0) {
          player.hearts -= dmg; player.inv = 0.8; player.sinceHurt = 0; shakeT = Math.max(shakeT, 0.2);
          burst(player.x, player.y, '#e84a4a', 14); beep(150, 60, 0.3, 'sawtooth', 0.2);
          if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('over').style.display = 'flex'; document.getElementById('overScore').textContent = `你击败了 ${kills} 只怪物！`; } }   // 💀 死亡不存档
        } else { burst(player.x, player.y, '#e8f4ff', 8); }
      }
      if (ga.t <= 0) burst(ga.x, ga.y, '#c8ccd4', 8);   // 5 秒没中就消散
    }
    garrows = garrows.filter(ga => ga.t > 0);
    /* ☄️ 陨石/落雷/裂隙：预警后砸下（伤害与半径按来源不同） */
    for (const m of meteors) {
      m.t -= dt;
      if (m.t <= 0 && !m.landed) {
        m.landed = true; m.showT = 0.18; shakeT = Math.max(shakeT, 0.25);
        const mr = m.r || 70;
        for (let i = 0; i < 14; i++) burst(m.x + (Math.random() - 0.5) * mr * 1.4, m.y + (Math.random() - 0.5) * mr * 1.4, m.color || '#ff7a2a');
        beep(100, 40, 0.3, 'sawtooth', 0.25);
        if (m.friendly) {   // ☄️ 友方陨石（流星火雨）：砸怪不砸自己
          for (const z of zombies.slice()) if (!z.dead && Math.hypot(z.x - m.x, z.y - m.y) < mr + (z.r || 10)) hurtZ(z, m.dmg || 8, m.color);
        } else if (!gameOver && !(player.tpT > 0) && Math.hypot(player.x - m.x, player.y - m.y) < mr + PLAYER.r) {
          const dmg = rollDmg(m.dmg || 1.5);
          if (dmg > 0) {
            player.hearts -= dmg; player.inv = 0.8; player.sinceHurt = 0; shakeT = Math.max(shakeT, 0.2);
            burst(player.x, player.y, '#e84a4a', 14); beep(150, 60, 0.3, 'sawtooth', 0.2);
            if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('over').style.display = 'flex'; document.getElementById('overScore').textContent = `你击败了 ${kills} 只怪物！`; } }   // 💀 死亡不存档
          }
        }
      }
      if (m.landed) m.showT -= dt;
    }
    meteors = meteors.filter(m => !m.landed || m.showT > 0);
    /* ⚡ 电网：电球环绕 BOSS，碰到半心 */
    if (netOrbs) {
      netOrbs.t -= dt; netOrbs.ang += dt * 5; netOrbs.hitAcc = Math.max(0, netOrbs.hitAcc - dt);
      if (netOrbs.t <= 0 || netOrbs.b.dead) netOrbs = null;
      else if (!gameOver && !(player.tpT > 0) && netOrbs.hitAcc <= 0) {
        for (let i = 0; i < 6; i++) {
          const a = netOrbs.ang + i * Math.PI / 3, ox = netOrbs.b.x + Math.cos(a) * 90, oy = netOrbs.b.y - 40 + Math.sin(a) * 90;
          if (Math.hypot(player.x - ox, player.y - oy) < 22) {
            netOrbs.hitAcc = 0.6;
            const dmg = rollDmg(0.5);
            if (dmg > 0) {
              player.hearts -= dmg; player.inv = 0.5; player.sinceHurt = 0;
              burst(player.x, player.y, '#ffe84a', 8); beep(400, 150, 0.15, 'square', 0.14);
              if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; } }   // 💀 死亡不存档（要存只能回主页存第一关）
            }
            break;
          }
        }
      }
    }
    for (const s of shocks) s.t -= dt;
    shocks = shocks.filter(s => s.t > 0);
    /* 🔥 岩浆水洼：站里面每秒半心 */
    let inPuddle = false;
    for (const p of puddles) { p.t -= dt; if (Math.hypot(player.x - p.x, player.y - p.y) < 20) inPuddle = true; }
    puddles = puddles.filter(p => p.t > 0);
    if (inPuddle && !gameOver && !(player.tpT > 0)) {
      player.lavaAcc = (player.lavaAcc || 0) + dt;
      if (player.lavaAcc >= 1) {
        player.lavaAcc -= 1;
        const dmg = rollDmg(0.5);
        if (dmg > 0) {
          player.hearts -= dmg; player.inv = 0.5; player.sinceHurt = 0;
          burst(player.x, player.y, '#ff7a2a', 8); beep(200, 100, 0.15, 'sawtooth', 0.12);
          if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('over').style.display = 'flex'; document.getElementById('overScore').textContent = `你击败了 ${kills} 只怪物！`; } }   // 💀 死亡不存档
        }
      }
    } else player.lavaAcc = 0;
    zombies = zombies.filter(z => !z.dead);
    petsTick(dt);     // 🐾 宠物出击
    wolvesTick(dt);   // 🐺 狼群出击
    minionsTick(dt);  // ☠️ 死灵小弟出击
    if (townMode && !inRoom) npcsTick(dt);   // 🧑‍🤝‍🧑 村民溜达
    if (!dungeonMode) portalTick(dt);   // 🕳️ 山洞/金币（副本里没有山洞）
    /* ➹ 骷髅的箭：直线飞，玩家移动就能躲开；命中=半心（盔甲可挡） */
    for (const a of earrows) {
      a.t -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.returned) {   // ⚾ 打回去的火球：微微追踪恶魂，砸中掉 15 血
        const gb = zombies.find(z2 => z2.ghast && !z2.dead);
        if (gb) {
          const gd = Math.hypot(gb.x - a.x, gb.y - a.y) || 1, want = 340;
          a.vx += ((gb.x - a.x) / gd * want - a.vx) * Math.min(1, dt * 6); a.vy += ((gb.y - a.y) / gd * want - a.vy) * Math.min(1, dt * 6);   // 追踪修正
          if (gd < 44) {
            a.t = 0; gb.hp -= 15; gb.flash = 0.2; shakeT = 0.3;
            burst(gb.x, gb.y - 30, '#ff8a5a', 18); beep(200, 60, 0.4, 'sawtooth', 0.25); setBanner('💥 火球砸中恶魂！掉 15 血！');
            if (gb.hp <= 0) killZombie(gb);
          }
        }
      }
      if (a.t > 0 && !gameOver && !(player.tpT > 0) && Math.hypot(a.x - player.x, a.y - player.y) < 12 && player.inv <= 0) {
        const dmgA = rollDmg(a.dmg != null ? a.dmg : 0.5);   // 💀 凋灵骷髅头命中=2 血，别的箭半心
        player.hearts -= dmgA; player.inv = 0.6; player.sinceHurt = 0; player.regenT = 0;
        beep(dmgA === 0 ? 700 : 500, dmgA === 0 ? 900 : 200, 0.12, 'square', 0.1);
        burst(player.x, player.y, dmgA === 0 ? '#ffe84a' : '#e84a4a', 6);
        a.t = 0;
        if (player.hearts <= 0 && !angelSave()) { gameOver = true; document.getElementById('overScore').textContent = `你这局打败了 ${kills} 只怪物！`; document.getElementById('over').style.display = 'flex'; }
      }
    }
    earrows = earrows.filter(a => a.t > 0 && a.x > 0 && a.x < WORLD.w && a.y > 0 && a.y < WORLD.h);
    /* 🏹 玩家的箭（寒冰弓）：自动瞄准射出后直线飞 */
    for (const a of parrows) {
      deflectGhastBalls(a.x, a.y, 16);   // ⚾ 飞行中的箭也能抽回火球
      if (pvpFoe && !pvpFoe.stale && (!skyMode || inArena(player.x, player.y)) && a.t > 0 && Math.hypot(a.x - pvpFoe.x, a.y - pvpFoe.y) < 14) { a.t = 0; pvpHits.push({ s: ++pvpHitSeq, d: a.dmg || 1 }); pvpWrite(); burst(pvpFoe.x, pvpFoe.y, '#ffb0b0', 8); }   // 📡 PVP：箭中幻影也算（同样要我在 PVP 圈里）
      a.t -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.t <= 0) continue;
      for (const z of zombies) {
        if (z.dead) continue;
        if (Math.hypot(a.x - z.x, a.y - z.y) < (z.r || ZOMBIE.r) + 6) {
          if (a.wave) {   // 🌪️ 法师剑风：穿透，一只怪只刮一次
            if (a.hitIds[z.id]) continue; a.hitIds[z.id] = 1;
            z.hp -= a.dmg; z.flash = 0.12; z.aggroW = null;   // 🐺 剑风也是你出手
            burst(a.x, a.y, '#a8e8ff', 4);
            if (z.hp <= 0) killZombie(z);
            continue;
          }
          if (a.pierce) {   // 🏹 游侠穿透箭：一只怪只中一次，穿过去继续飞
            if (a.hitIds[z.id]) continue; a.hitIds[z.id] = 1;
            z.hp -= a.dmg; z.flash = 0.12; z.aggroW = null;
            if (a.mageBurn && !z.dead) { z.mageBurnT = 2; z.mageBurnAcc = 0; }
            if (a.freeze && !z.boss && !z.dead) { z.freezeT = Math.max(z.freezeT || 0, a.freezeDur || 1.5); burst(z.x, z.y, '#a8e8ff', 8); }
            if (a.burn && !z.dead) { z.burnT = 2; z.burnAcc = 0; }
            if (a.volt && !z.dead) { z.hp -= 2; z.zapT = 0.12; burst(z.x, z.y, '#ffe84a', 8); }
            if (a.voidz && !z.dead) { z.hp -= 2; burst(z.x, z.y, '#b48af2', 8); }
            burst(a.x, a.y, '#d8f2ff', 4);
            if (z.hp <= 0) killZombie(z);
            continue;
          }
          z.hp -= a.dmg; z.flash = 0.15; a.t = 0;
          z.aggroW = null;   // 🐺 你的箭也是你出手：仇恨归位
          burst(a.x, a.y, '#ffd75e', 5); shakeT = Math.max(shakeT, 0.07);   // 💥 箭矢命中：金火花+轻震（不给顿帧，箭雨会狂顿）
          if (a.mageBurn && !z.dead) { z.mageBurnT = 2; z.mageBurnAcc = 0; }   // 🔮 法师附火
          if (a.freeze && !z.boss && !z.dead) { z.freezeT = Math.max(z.freezeT || 0, a.freezeDur || 1.5); burst(z.x, z.y, '#a8e8ff', 8); }
          if (a.burn && !z.dead) { z.burnT = 2; z.burnAcc = 0; }   // 🔥 火箭点燃
          if (a.volt && !z.dead) { z.hp -= 2; z.zapT = 0.12; burst(z.x, z.y, '#ffe84a', 8); }   // ⚡ 电光箭追加电击
          if (a.voidz && !z.dead) { z.hp -= 2; burst(z.x, z.y, '#b48af2', 8); }   // 🕳️ 虚空箭追加湮灭
          burst(a.x, a.y, '#eaf8ff', 5);
          if (z.hp <= 0) killZombie(z);
          break;
        }
      }
    }
    for (const a of parrows) if (a.asTp && a.t <= 0 && !a.asDone) { a.asDone = true; tpLand = { x: a.x, y: a.y }; tpWindowT = 2; }   // 🥷 刺客：箭消失处开 2 秒传送门
    parrows = parrows.filter(a => a.t > 0 && a.x > 0 && a.x < WORLD.w && a.y > 0 && a.y < WORLD.h);
  }
  for (const pt of parts) { pt.t -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 260 * dt; }
  parts = parts.filter(p => p.t > 0);
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (gameOver && !overRecorded) {   // 🏆 结算：试炼塔记排行榜
    overRecorded = true;
    if (towerMode) {
      recordEndless();
      const bst = bestEndless();
      document.getElementById('overScore').textContent = `🌀 无尽打到：第${endlessRound}遍·第${endlessWave}波（共击败 ${kills} 只）🏆 最佳：第${bst.round}遍·第${bst.wave}波`;
    }
  }
  requestAnimationFrame(loop);   // 🛡️ 先排下一帧：哪怕这一帧出错，游戏也绝不定格（一帧的错不该杀死整个游戏）
  try { padTick(dt); update(dt); draw(); } catch (err) { console.error('[frame] 这一帧出错了，已跳过：', err); }   // 🎮 手柄轮询每帧都跑（面板暂停时也要当鼠标用）
}
