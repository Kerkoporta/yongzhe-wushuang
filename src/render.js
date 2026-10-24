'use strict';
function draw() {
  ctx.imageSmoothingEnabled = false;   // 👾 像素游戏全局关平滑（像素人不发虚）
  const Z = ZOOMS[zoomLv];   // 🔍 倍数镜：1×/2×/4×
  const camX = Math.max(0, Math.min(WORLD.w - VW / Z, player.x - VW / Z / 2));
  const camY = Math.max(0, Math.min(WORLD.h - VH / Z, player.y - VH / Z / 2));
  const shx = shakeT > 0 ? (Math.random() - 0.5) * 9 : 0, shy = shakeT > 0 ? (Math.random() - 0.5) * 9 : 0;   // 💥 砸地震屏
  ctx.setTransform(DPR * Z, 0, 0, DPR * Z, (-camX + shx) * DPR * Z, (-camY + shy) * DPR * Z);
  // 🗺️ 地面：副本=幽暗密林；小镇=草地+马路+小家；冒险=图案填充
  const LV = LEVELS[level];
  if (dungeonMode) {   // 🌲 哥布林森林：暗绿林地+四周密林树墙+几棵大树
    ctx.fillStyle = '#1e3318'; ctx.fillRect(camX, camY, VW + 2, VH + 2);
    ctx.fillStyle = 'rgba(0,0,0,.16)';   // 斑驳树影
    for (let gx = 0; gx < WORLD.w; gx += 160) for (let gy = 0; gy < WORLD.h; gy += 160) if ((gx * 7 + gy * 13) % 320 === 0) ctx.fillRect(gx, gy, 80, 80);
    for (let tx = 0; tx < WORLD.w; tx += 74) { drawDgnTree(tx, -10); drawDgnTree(tx + 37, WORLD.h - 60); }   // 上下树墙
    for (let ty = 0; ty < WORLD.h; ty += 74) { drawDgnTree(-10, ty); drawDgnTree(WORLD.w - 60, ty + 37); }   // 左右树墙
    for (const tp of [[800, 900], [1600, 800], [700, 1600], [1700, 1650], [1200, 620], [500, 1200], [1900, 1200]]) drawDgnTree(tp[0], tp[1]);   // 林间大树
  } else if (skyMode) { Sky.drawSkyCity();   // ☁️ 天空城：蓝天+云岛+钓鱼池+PVP 擂台
  } else if (townMode) {
    ctx.fillStyle = '#4a7a3a'; ctx.fillRect(camX, camY, VW + 2, VH + 2);   // 草地
    if (inRoom) {   // 🏠 房间内部：木地板+墙+床+柜子+门垫
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(950, 1050, 520, 470);
      ctx.fillStyle = '#6a4a2e'; ctx.fillRect(950, 1050, 520, 14); ctx.fillRect(950, 1506, 520, 14); ctx.fillRect(950, 1050, 14, 470); ctx.fillRect(1456, 1050, 14, 470);
      for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#96755a' : '#8a6a4a'; ctx.fillRect(964, 1064 + i * 37, 492, 36); }
      ctx.fillStyle = '#c8a86a'; ctx.fillRect(1160, 1490, 90, 18);   // 门垫
      // 🛏️ 床
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(1010, 1110, 90, 80);
      ctx.fillStyle = '#4a8af2'; ctx.fillRect(1016, 1130, 78, 54);   // 蓝被子
      ctx.fillStyle = '#fff'; ctx.fillRect(1016, 1116, 78, 16);      // 白枕头
      // 🗄️ 柜子
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(1330, 1100, 70, 100);
      ctx.fillStyle = '#8a6a3f'; ctx.fillRect(1336, 1106, 58, 42); ctx.fillRect(1336, 1152, 58, 42);
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(1362, 1124, 6, 6); ctx.fillRect(1362, 1170, 6, 6);
    } else {
      ctx.fillStyle = '#4a4a52'; ctx.fillRect(0, 1152, WORLD.w, 96); ctx.fillRect(1152, 0, 96, WORLD.h);   // 十字马路
      ctx.fillStyle = '#e8e8e8'; for (let x = 0; x < WORLD.w; x += 60) ctx.fillRect(x + 10, 1197, 30, 6);   // 横线
      for (let y = 0; y < WORLD.h; y += 60) ctx.fillRect(1197, y + 10, 6, 30);   // 竖线
      ctx.fillStyle = '#8a8a92'; ctx.fillRect(0, 1144, WORLD.w, 8); ctx.fillRect(0, 1248, WORLD.w, 8); ctx.fillRect(1144, 0, 8, WORLD.h); ctx.fillRect(1248, 0, 8, WORLD.h);   // 路缘
      if (ownedHouse) {   // 🏡 你的蓝色小家（北边）
        ctx.fillStyle = '#4a8af2'; ctx.fillRect(1150, 620, 100, 80);
        ctx.fillStyle = '#2a5ab8'; ctx.beginPath(); ctx.moveTo(1140, 620); ctx.lineTo(1200, 570); ctx.lineTo(1260, 620); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(1182, 660, 36, 40);   // 门
        ctx.fillStyle = '#ffd24a'; ctx.fillRect(1208, 678, 5, 5);     // 门把
      }
      // ⛲ 南边大广场：灰色环路+石砖地+四角草丛+中央喷泉
      ctx.fillStyle = '#4a4a52';   // 环路
      ctx.fillRect(872, 1512, 656, 48); ctx.fillRect(872, 2120, 656, 48); ctx.fillRect(872, 1512, 48, 656); ctx.fillRect(1480, 1512, 48, 656);
      ctx.fillStyle = '#9a9aa2'; ctx.fillRect(920, 1560, 560, 560);   // 石砖广场
      ctx.strokeStyle = '#83838c'; ctx.lineWidth = 2;
      for (let gx = 976; gx < 1480; gx += 56) { ctx.beginPath(); ctx.moveTo(gx, 1560); ctx.lineTo(gx, 2120); ctx.stroke(); }
      for (let gy = 1616; gy < 2120; gy += 56) { ctx.beginPath(); ctx.moveTo(920, gy); ctx.lineTo(1480, gy); ctx.stroke(); }
      for (const bpos of [[968, 1608], [1432, 1608], [968, 2072], [1432, 2072]]) TownArt.drawBush(bpos[0], bpos[1]);   // 四角草丛
      TownArt.drawFountain(1200, 1840);   // ⛲ 中央喷泉
      for (const lpos of [[1000, 1625], [1400, 1625], [1000, 2055], [1400, 2055]]) TownArt.drawLamp(lpos[0], lpos[1]);   // 💡 四盏路灯
      for (const fpos of [[1090, 1680], [1310, 1680], [1090, 2000], [1310, 2000]]) TownArt.drawFlowerBed(fpos[0], fpos[1]);   // 🌸 四个花坛
      for (const b of BENCHES) TownArt.drawBench(b.x, b.y, b.face);   // 🪑 两张长椅面朝喷泉
      TownArt.drawStatue(1100, 1500); TownArt.drawStatue(1300, 1500);   // 🗿 广场北门口两座勇者石像
      /* 🗼 试炼塔（广场南边）：无尽挑战入口 */
      const ttw = performance.now() / 1000;
      ctx.fillStyle = '#0e0a16'; ctx.fillRect(1178, 1980, 44, 100);   // 塔身
      ctx.fillStyle = '#1a1428'; ctx.fillRect(1172, 1974, 56, 12);   // 塔檐
      ctx.fillStyle = '#0a0712'; ctx.fillRect(1190, 2046, 20, 34);   // 门口
      ctx.strokeStyle = '#4a6aff'; ctx.globalAlpha = 0.5 + Math.sin(ttw * 3) * 0.3; ctx.lineWidth = 3;
      ctx.strokeRect(1190, 2046, 20, 34);   // 门口蓝光脉动
      ctx.globalAlpha = 1;
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💀', 1200, 1996 + Math.sin(ttw * 2) * 2); ctx.textAlign = 'left';
      ctx.fillStyle = '#b8b8d0'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('试炼塔', 1200, 2096); ctx.textAlign = 'left';
      /* 🌲 哥布林森林副本入口（广场东边）：两棵松树夹一扇黑洞门 */
      drawDgnTree(DGN_GATE.x - 46, DGN_GATE.y - 44); drawDgnTree(DGN_GATE.x + 6, DGN_GATE.y - 44);
      ctx.fillStyle = '#0a1206'; ctx.beginPath(); ctx.ellipse(DGN_GATE.x, DGN_GATE.y - 6, 18, 26, 0, 0, 6.3); ctx.fill();   // 黑洞门
      ctx.strokeStyle = '#5aff5a'; ctx.globalAlpha = 0.5 + Math.sin(ttw * 3) * 0.3; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(DGN_GATE.x, DGN_GATE.y - 6, 22, 30, 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;   // 绿光脉动
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('👺', DGN_GATE.x, DGN_GATE.y - 44 + Math.sin(ttw * 2) * 2); ctx.textAlign = 'left';
      ctx.fillStyle = '#b8e8a8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('哥布林森林', DGN_GATE.x, DGN_GATE.y + 36); ctx.textAlign = 'left';
      // ⭐ 喷泉周围地砖拼花（八角星）
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.moveTo(1200 + Math.cos(a) * 62, 1840 + Math.sin(a) * 62); ctx.lineTo(1200 + Math.cos(a + 0.5) * 78, 1840 + Math.sin(a + 0.5) * 78); }
      ctx.stroke();
      /* 🎡 游乐场摊位牌子（东西两排）+ 跑酷旗子 + 迷宫树篱 */
      const ptw2 = performance.now() / 1000;
      for (const a of ATTRACT) {
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(a.x - 3, a.y - 6, 6, 22);   // 木杆
        ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(a.icon, a.x, a.y - 10 + Math.sin(ptw2 * 2 + a.x) * 2);   // 图标
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(a.name, a.x, a.y + 30); ctx.textAlign = 'left';
      }
      if (runOn) {   // 🏃 当前目标旗：金光闪闪
        const cp = RUN_CPS[runCp];
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(cp[0] - 2, cp[1] - 26, 4, 26);
        ctx.fillStyle = '#e84a4a'; ctx.beginPath(); ctx.moveTo(cp[0] + 2, cp[1] - 26); ctx.lineTo(cp[0] + 24, cp[1] - 19); ctx.lineTo(cp[0] + 2, cp[1] - 12); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffd24a'; ctx.globalAlpha = 0.6 + Math.sin(ptw2 * 4) * 0.3; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cp[0], cp[1], 30, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (arenaOn) {   // ⚔️ 擂台圈
        ctx.strokeStyle = '#e84a4a'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(1200, 1840, 210, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
      }
      /* 🌳 迷宫树篱（西北角）+ 宝箱 */
      for (const w of MAZE_WALLS) {
        ctx.fillStyle = '#2a5a2a'; ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#3a7a3a'; for (let hx = w.x + 6; hx < w.x + w.w - 4; hx += 16) ctx.fillRect(hx, w.y - 3, 8, 6);   // 篱叶
      }
      if (mazeChest) { ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎁', 450, 488 + Math.sin(ptw2 * 2) * 3); ctx.textAlign = 'left'; }
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌳迷宫', 450, 770); ctx.textAlign = 'left';
    }
  } else {
    ctx.fillStyle = groundPattern(); ctx.fillRect(camX, camY, VW, VH);
  }
  if (!townMode && !dungeonMode) {   // 冒险模式才画边缘+装饰（🌲 副本自己画林子）
  ctx.strokeStyle = LV.edge; ctx.lineWidth = 12; ctx.strokeRect(0, 0, WORLD.w, WORLD.h);
  for (const d of deco) { if (d.x < camX - 60 || d.x > camX + VW + 60 || d.y < camY - 60 || d.y > camY + VH + 60) continue;
    if (d.t === 'tree') { ctx.fillStyle = LV.trunk; ctx.fillRect(d.x - 4, d.y - 6, 8, 18); ctx.fillStyle = LV.leaf; ctx.beginPath(); ctx.arc(d.x, d.y - 14, 16, 0, 6.3); ctx.fill(); ctx.fillStyle = LV.leafHi; ctx.beginPath(); ctx.arc(d.x - 4, d.y - 18, 9, 0, 6.3); ctx.fill(); }
    else { ctx.fillStyle = LV.rock; ctx.beginPath(); ctx.arc(d.x, d.y, 9, 0, 6.3); ctx.fill(); ctx.fillStyle = LV.rockHi; ctx.beginPath(); ctx.arc(d.x - 2, d.y - 3, 4, 0, 6.3); ctx.fill(); } }
  }   // 🏡 !townMode 结束
  // 🏪 地图商店：小木屋+类型图标，走近提示（房间里不画，🌲副本里没有商店）
  if (!inRoom && !dungeonMode) {
  const nearI = nearShop();
  for (let si = 0; si < mapShops.length; si++) {
    const s = mapShops[si];
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(s.x - 16, s.y - 10, 32, 20);   // 屋身
    ctx.fillStyle = '#a83a2a'; ctx.beginPath(); ctx.moveTo(s.x - 20, s.y - 10); ctx.lineTo(s.x, s.y - 26); ctx.lineTo(s.x + 20, s.y - 10); ctx.closePath(); ctx.fill();   // 屋顶
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(SHOP_ICON[s.kind], s.x, s.y + 6);
    if (si === nearI) { ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('按 B / 点「进入」', s.x, s.y - 32); }
    ctx.textAlign = 'left';
  }
  }   // 🏠 !inRoom 商店结束
  // 🎁 BOSS 宝箱（金光闪闪的小木箱）
  if (chest && !townMode && !dungeonMode) {
    if (!chest.taken) { ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 300) * 0.2; ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(chest.x, chest.y - 2, 22, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(chest.x - 12, chest.y - 8, 24, 16);   // 箱身
    ctx.fillStyle = '#6a3f1a'; ctx.fillRect(chest.x - 12, chest.y - 8, 24, 6);    // 箱盖
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(chest.x - 2, chest.y - 8, 4, 16);     // 金箍
    ctx.fillStyle = '#ffe84a'; ctx.fillRect(chest.x - 2, chest.y - 2, 4, 4);      // 锁
  }
  // 僵尸
  for (const z of zombies) {
    if (z.boss) { drawBoss(z); continue; }   // 👹 BOSS 专属画法
    if (z.elite) {   // ✨ 精英怪：脚下金色光环
      ctx.strokeStyle = '#ffd24a'; ctx.globalAlpha = 0.8; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(z.x, z.y + 2, 18 + Math.sin(z.walkT * 5) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (z.ghost) {   // 👻 鬼魂：青色半透明、上下飘
      const bob = Math.sin(z.walkT * 3) * 4;
      ctx.globalAlpha = 0.85;
      drawSprite(ctx, GHOST_DOWN, z.x - 10, z.y - 20 - bob, 2, z.x < player.x);
      ctx.globalAlpha = 1;
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 10, z.y - 20 - bob, 20, 24); ctx.globalAlpha = 1; }
      if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 10, z.y - 20 - bob, 20, 24); }
      ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 28 - bob, 24, 4);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 28 - bob, 24 * (z.hp / GHOST.hp), 4);
      continue;
    }
    if (z.lava) {   // 🌋 岩浆怪：一蹦一停，橙心发光
      const phase = z.walkT % 0.7, hop = phase < 0.35 ? Math.sin(phase / 0.35 * Math.PI) * 8 : 0;
      drawSprite(ctx, LAVA_DOWN, z.x - 10, z.y - 20 - hop, 2, z.x < player.x);
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 10, z.y - 20 - hop, 20, 24); ctx.globalAlpha = 1; }
      if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 10, z.y - 20 - hop, 20, 24); }
      ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 28 - hop, 24, 4);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 28 - hop, 24 * (z.hp / LAVA.hp), 4);
      continue;
    }
    if (z.crystal) {   // 💠 激光怪：晶虫上下飘，蓄能时发亮
      const bob = Math.sin(z.walkT * 4) * 3;
      drawSprite(ctx, CRYSTAL_DOWN, z.x - 10, z.y - 20 - bob, 2, z.x < player.x);
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 10, z.y - 20 - bob, 20, 24); ctx.globalAlpha = 1; }
      if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 10, z.y - 20 - bob, 20, 24); }
      ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 28 - bob, 24, 4);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 28 - bob, 24 * (z.hp / CRYSTAL.hp), 4);
      continue;
    }
    if (z.storm) {   // ⛈️ 雷云精：云朵上下飘，闪电脚
      const bob = Math.sin(z.walkT * 4) * 3;
      drawSprite(ctx, STORM_DOWN, z.x - 10, z.y - 20 - bob, 2, z.x < player.x);
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 10, z.y - 20 - bob, 20, 24); ctx.globalAlpha = 1; }
      if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 10, z.y - 20 - bob, 20, 24); }
      ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 28 - bob, 24, 4);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 28 - bob, 24 * (z.hp / STORM.hp), 4);
      continue;
    }
    if (z.voidw) {   // 🕳️ 虚空行者：暗紫细高个，身边冒紫星
      const hop2 = Math.abs(Math.sin(z.walkT * 5)) * 2;
      drawSprite(ctx, VOID_DOWN, z.x - 10, z.y - 24 - hop2, 2, z.x < player.x);
      if (Math.random() < 0.1) burst(z.x + (Math.random() - 0.5) * 24, z.y - 10 + (Math.random() - 0.5) * 24, '#8a5ac8');
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 10, z.y - 24 - hop2, 20, 28); ctx.globalAlpha = 1; }
      if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 10, z.y - 24 - hop2, 20, 28); }
      ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 32 - hop2, 24, 4);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 32 - hop2, 24 * (z.hp / VOIDW.hp), 4);
      continue;
    }
    if (z.slime) {   // 🟢 史莱姆：绿色果冻方块，蹦跳时压扁拉长
      const air = z.hopAir > 0, sq = air ? 1.15 : 1, sqy = air ? 0.85 : 1;
      const sx = Math.round(z.x), sy = Math.round(z.y), rr = z.r;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(sq, sqy);
      ctx.fillStyle = 'rgba(126,200,80,.9)'; ctx.fillRect(-rr, -rr * 1.6, rr * 2, rr * 1.6);
      ctx.fillStyle = 'rgba(168,230,130,.9)'; ctx.fillRect(-rr + 3, -rr * 1.6 + 3, rr * 2 - 6, rr * 0.7);   // 果冻高光
      ctx.fillStyle = '#1e3a1a';
      const es = Math.max(2, rr * 0.22);
      ctx.fillRect(-rr * 0.5, -rr * 1.2, es, es); ctx.fillRect(rr * 0.5 - es, -rr * 1.2, es, es);   // 眼睛
      ctx.fillRect(-rr * 0.3, -rr * 0.8, rr * 0.6, Math.max(1.5, rr * 0.12));   // 嘴
      ctx.restore();
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(sx - rr, sy - rr * 1.6, rr * 2, rr * 1.6); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#0008'; ctx.fillRect(sx - rr, sy - rr * 1.6 - 6, rr * 2, 3);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(sx - rr, sy - rr * 1.6 - 6, rr * 2 * (z.hp / [2, 4, 8][z.size]), 3);
      continue;
    }
    if (z.bat) {   // 🦇 蝙蝠：小黑翅膀扑腾
      const bx2 = Math.round(z.x), by2 = Math.round(z.y - 10), flap = Math.sin(z.walkT * 14) * 6;
      ctx.fillStyle = '#2a3038';
      ctx.beginPath(); ctx.moveTo(bx2 - 3, by2); ctx.lineTo(bx2 - 14, by2 - 4 - flap); ctx.lineTo(bx2 - 6, by2 + 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx2 + 3, by2); ctx.lineTo(bx2 + 14, by2 - 4 - flap); ctx.lineTo(bx2 + 6, by2 + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a424c'; ctx.beginPath(); ctx.arc(bx2, by2, 5, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(bx2 - 3, by2 - 2, 2, 2); ctx.fillRect(bx2 + 1, by2 - 2, 2, 2);
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(bx2, by2, 8, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#0008'; ctx.fillRect(bx2 - 8, by2 - 12, 16, 3);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(bx2 - 8, by2 - 12, 16 * (z.hp / 2), 3);
      continue;
    }
    if (z.goblin) {   // 🌲 哥布林：绿皮尖牙木棍（统一画法）
      drawGoblin(z.x, z.y, 1.0, { walkT: z.walkT, face: player.x < z.x ? -1 : 1 });
      const gx2 = Math.round(z.x), gy2 = Math.round(z.y);
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(gx2 - 10, gy2 - 30, 20, 32); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#0008'; ctx.fillRect(gx2 - 10, gy2 - 34, 20, 3);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(gx2 - 10, gy2 - 34, 20 * (z.hp / 5), 3);
      continue;
    }
    if (z.creep) {   // 🧨 苦力怕：MC 同款高绿柱（统一画法）
      drawCreeper(z.x, z.y, 1.05, { walkT: z.walkT, fuseT: z.fuseT });
      const cx = Math.round(z.x), cy = Math.round(z.y);
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(cx - 10, cy - 30, 20, 32); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#0008'; ctx.fillRect(cx - 10, cy - 34, 20, 3);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(cx - 10, cy - 34, 20 * (z.hp / 6), 3);
      continue;
    }
    if (z.ws) {   // 💀 MC 凋零骷髅：黑色高个骷髅，正面/侧面走路，手拿石剑
      const wside = Math.abs(player.x - z.x) > Math.abs(player.y - z.y), wflip = wside && z.x < player.x;
      const wstep = Math.sin(z.walkT * 8) * 3;   // 走路腿交替
      ctx.save(); ctx.translate(Math.round(z.x), Math.round(z.y)); if (wflip) ctx.scale(-1, 1);
      ctx.fillStyle = '#16121a';
      ctx.fillRect(-5, -10 + Math.max(0, wstep), 4, 10 - Math.max(0, wstep));   // 左腿
      ctx.fillRect(1, -10 + Math.max(0, -wstep), 4, 10 - Math.max(0, -wstep));   // 右腿
      ctx.fillRect(-6, -26, 12, 16);   // 躯干
      ctx.fillStyle = '#3a3440';
      ctx.fillRect(-6, -23, 12, 2); ctx.fillRect(-6, -19, 12, 2); ctx.fillRect(-6, -15, 12, 2);   // 肋线
      ctx.fillStyle = '#16121a';
      if (wside) { ctx.fillRect(6, -24, 8, 3); ctx.fillStyle = '#8a8a92'; ctx.fillRect(14, -28, 3, 13); }   // 侧面：手臂前伸+石剑
      else { ctx.fillRect(-10, -24, 3, 10); ctx.fillRect(7, -24, 3, 10); ctx.fillStyle = '#8a8a92'; ctx.fillRect(7, -14, 3, 10); }   // 正面：双臂+一手垂剑
      ctx.fillStyle = '#16121a'; ctx.fillRect(-6, -38, 12, 12);   // 骷髅头
      ctx.fillStyle = '#e8e8f0';
      if (wside) { ctx.fillRect(2, -35, 3, 3); } else { ctx.fillRect(-4, -35, 3, 3); ctx.fillRect(1, -35, 3, 3); }   // 眼窝
      ctx.fillStyle = '#16121a'; ctx.fillRect(-2, -29, 4, 3);   // 嘴
      ctx.restore();
      if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 12, z.y - 40, 24, 40); ctx.globalAlpha = 1; }
      if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 12, z.y - 40, 24, 40); }
      ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 44, 24, 4);
      ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 44, 24 * (z.hp / 8), 4);
      continue;
    }
    const hop = Math.abs(Math.sin(z.walkT * 6)) * 2;
    const side = Math.abs(player.x - z.x) > Math.abs(player.y - z.y);
    const spr = z.skel ? (side ? SKEL_SIDE : SKEL_DOWN) : (side ? ZOM_SIDE : ZOM_DOWN), flip = side && z.x < player.x;
    drawSprite(ctx, spr, z.x - 12, z.y - 16 - hop, 2, flip);
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(z.x - 12, z.y - 16 - hop, 24, 32); ctx.globalAlpha = 1; }
    if (z.freezeT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.fillRect(z.x - 12, z.y - 16 - hop, 24, 32); }   // 🏹 冻成蓝冰棍
    if (z.zapT > 0) { ctx.fillStyle = 'rgba(255,232,74,.8)'; ctx.fillRect(z.x - 6, z.y - 30 - hop, 12, 46); }        // ⚡ 雷劈光柱
    // 血条：绿格子
    ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 12, z.y - 24 - hop, 24, 4);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 12, z.y - 24 - hop, 24 * (z.hp / (z.skel ? SKELETON.hp : ZOMBIE.hp)), 4);
  }
  // 🔥 岩浆水洼（踩了每秒半心）
  for (const p of puddles) {
    ctx.globalAlpha = Math.min(0.85, p.t);
    if (p.dragon) {   // 🐉 龙息紫雾
      ctx.fillStyle = '#8a5ac8'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d0a8ff'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // ☄️ 陨石预警红圈（缩圈=要砸了）
  for (const m of meteors) {
    const mr = m.r || 70, mc = m.color || '#e84a4a';
    if (!m.landed) {   // 🔧 预警圈只在落地前画（落地后 m.t 继续变小，半径会变负把 arc 画炸）
      const pr = Math.max(0.1, mr * (m.t / 0.8) + 8);
      ctx.strokeStyle = mc; ctx.globalAlpha = 0.9; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(m.x, m.y, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.2; ctx.fillStyle = mc; ctx.beginPath(); ctx.arc(m.x, m.y, pr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(m.x, m.y - 200 * Math.max(0, m.t / 0.8) - 10, 10, 0, Math.PI * 2); ctx.fill();   // 天上掉下来的石头
    }
    if (m.landed && m.showT > 0 && m.bolt) {   // 🌩️ 落雷：天上一道光柱劈下
      ctx.fillStyle = '#fff'; ctx.fillRect(m.x - 4, m.y - 400, 8, 400);
      ctx.fillStyle = mc; ctx.fillRect(m.x - 8, m.y - 400, 3, 400); ctx.fillRect(m.x + 5, m.y - 400, 3, 400);
    }
  }
  /* ⚡ 电网：6 颗电球绕 BOSS */
  if (netOrbs) {
    for (let i = 0; i < 6; i++) {
      const a = netOrbs.ang + i * Math.PI / 3, ox = netOrbs.b.x + Math.cos(a) * 90, oy = netOrbs.b.y - 40 + Math.sin(a) * 90;
      ctx.fillStyle = '#ffe84a'; ctx.beginPath(); ctx.arc(ox, oy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  /* 💫 相位轰炸冲击波 */
  for (const s of shocks) {
    const p = 1 - s.t / 0.3;
    ctx.strokeStyle = `rgba(180,138,242,${1 - p})`; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(s.x, s.y, 20 + p * 60, 0, Math.PI * 2); ctx.stroke();
  }
  /* ☁️ 技能毒雾：一团团真云雾慢慢飘（预渲染柔雾团，便宜又好看） */
  for (const c of clouds) {
    const life = Math.min(1, c.t / 0.8);   // 快散时变淡
    if (c.blobs) {
      for (const b of c.blobs) {
        b.a += b.spin * 0.016;
        const bx = c.x + Math.cos(b.a) * b.d, by = c.y + Math.sin(b.a) * b.d * 0.8 + Math.sin(c.t * 2 + b.bob) * 4;
        const sz = b.r * (1 + Math.sin(c.t * 2.4 + b.bob) * 0.12);
        ctx.globalAlpha = 0.4 * life;
        ctx.drawImage(softBlob(c.color), bx - sz, by - sz, sz * 2, sz * 2);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.35 * life; ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  /* ✨ 技能弹道（大火球）：大号发光球+白芯（多层圆代替 shadowBlur，手机不卡） */
  for (const s of skillShots) {
    ctx.globalAlpha = 0.3; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill();
  }
  /* ✨ 技能特效线与法阵环、闪电（折线带分叉，每帧抖动=活闪电） */
  for (const f of fxLines) {
    if (f.ring) {
      ctx.strokeStyle = f.color; ctx.globalAlpha = Math.max(0, f.t * 2.5); ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.15 - f.t), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = Math.max(0, f.t * 1.1); ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.15 - f.t), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = Math.max(0, f.t * 3); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.15 - f.t), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (f.bolt) {
      /* ⚡ 真闪电：6 段折线+随机分叉，白芯彩边 */
      const a = Math.max(0, Math.min(1, f.t * 3.5));
      const pts = [[f.x1, f.y1]];
      for (let i = 1; i < 6; i++) { const p = i / 6; pts.push([f.x1 + (f.x2 - f.x1) * p + (Math.random() - 0.5) * 34, f.y1 + (f.y2 - f.y1) * p + (Math.random() - 0.5) * 22]); }
      pts.push([f.x2, f.y2]);
      const stroke = (w, style, alpha) => {
        ctx.strokeStyle = style; ctx.globalAlpha = alpha; ctx.lineWidth = w; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
        /* 分叉 */
        if (w > 3) {
          const bi = 2 + Math.floor(Math.random() * 3), bx = pts[bi][0], by = pts[bi][1];
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (Math.random() - 0.5) * 50, by + (Math.random() - 0.5) * 50); ctx.stroke();
        }
      };
      stroke(f.w || 6, f.color, a * 0.85);
      stroke(Math.max(2, (f.w || 6) * 0.4), '#ffffff', a);
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = f.color; ctx.globalAlpha = Math.max(0, f.t * 2.6); ctx.lineWidth = f.w || 3;
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.globalAlpha = Math.max(0, f.t * 3.5); ctx.lineWidth = Math.max(2, (f.w || 3) * 0.4);
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // 🐾 宠物（像素模型：游荡/奔跑/攻击三种动画，朝哪边跑就朝哪边）
  for (const pt of pets) {
    if (pt.dead) {   // 💔 倒下的宠物：灰影趴地等下关复活
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#666';
      ctx.beginPath(); ctx.ellipse(pt.x, pt.y, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💤', pt.x, pt.y - 12); ctx.textAlign = 'left';
      continue;
    }
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 2, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    if (pt.key === 'pet10_minicreep' || pt.key === 'pet10_minititan') {   // 🧨 苦力怕/泰坦宠物：MC 同款迷彩画法（迷你版；v78 修 key 对不上永远走不到这的真 bug）
      drawCreeper(pt.x, pt.y, pt.key === 'pet10_minititan' ? 1.0 : 0.8, { walkT: pt.animT || 0 });
    } else {
      const art = petArt(pt.key);
      const ptAnimT = pt.animT || 0;   // 🛡️ 兜底：animT 缺了/变 NaN 也不能让绘制炸掉
      const set = (pt.state === 'atk' && ptAnimT < 0.3) ? art.atk : pt.state === 'run' ? art.run : art.wander;
      const frame = set[Math.floor(ptAnimT * (pt.state === 'run' ? 8 : 3)) % set.length] || set[0];
      ctx.save(); ctx.translate(Math.round(pt.x), Math.round(pt.y));
      if ((pt.face || 1) < 0) ctx.scale(-1, 1);
      if (frame) ctx.drawImage(frame, -19, -30, 38, 32);
      ctx.restore();
    }
    const mh = petMaxHp(pt.key);   // 🐾 血条：掉过血才显示
    if (pt.hp < mh) {
      ctx.fillStyle = '#000'; ctx.fillRect(pt.x - 10, pt.y - 34, 20, 3);
      ctx.fillStyle = pt.hp / mh > 0.5 ? '#6ae84a' : '#e84a4a'; ctx.fillRect(pt.x - 10, pt.y - 34, 20 * Math.max(0, pt.hp / mh), 3);
    }
  }
  for (const w of wolves) {   // 🐺 召唤狼群：emoji 狼+血条
    if (townMode) continue;
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(w.x, w.y + 2, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(Math.round(w.x), Math.round(w.y - 10)); ctx.scale(w.face < 0 ? -1 : 1, 1);
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🐺', 0, 0); ctx.restore(); ctx.textAlign = 'left';
    ctx.fillStyle = '#000'; ctx.fillRect(w.x - 10, w.y - 26, 20, 3);
    ctx.fillStyle = w.hp > 3 ? '#6ae84a' : '#e84a4a'; ctx.fillRect(w.x - 10, w.y - 26, 20 * Math.max(0, w.hp / 6), 3);
  }
  for (const mn of minions) {   // ☠️ 死灵骷髅小弟/👥分身：白色小骨架/半透明影子+寿命倒计时
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(mn.x, mn.y + 2, 8, 3.5, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    if (mn.clone) {   // 👥 分身：我的半透明影子
      ctx.globalAlpha = 0.55; drawSprite(ctx, MAN_DOWN, mn.x - 12, mn.y - 16, 2, mn.face < 0); ctx.globalAlpha = 1;
      ctx.fillStyle = '#b8b8ff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(mn.t) + 's', mn.x, mn.y - 26); ctx.textAlign = 'left';
      continue;
    }
    const mstep = Math.sin((mn.animT || 0) * 8) * 2;
    ctx.save(); ctx.translate(Math.round(mn.x), Math.round(mn.y)); ctx.scale(mn.face < 0 ? -1 : 1, 1);
    ctx.fillStyle = '#e8e8dc'; ctx.fillRect(-5, -22, 10, 9);   // 骷髅头
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-3, -19, 2, 3); ctx.fillRect(1, -19, 2, 3);   // 眼窝
    ctx.fillStyle = '#d0d0c0'; ctx.fillRect(-4, -12, 8, 8);   // 肋骨身
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-4, -10, 8, 1); ctx.fillRect(-4, -7, 8, 1);   // 肋缝
    ctx.fillStyle = '#e8e8dc'; ctx.fillRect(-4, -4, 3, 4 + Math.max(0, mstep)); ctx.fillRect(1, -4, 3, 4 + Math.max(0, -mstep));   // 小腿倒腾
    ctx.restore();
    ctx.fillStyle = '#c8f4ff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(mn.t) + 's', mn.x, mn.y - 26); ctx.textAlign = 'left';
  }
  for (const tr of turrets) {   // 🧲 工程师炮塔：铁灰底座+会转头的炮管
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 2, 9, 4, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#5a626e'; ctx.fillRect(tr.x - 8, tr.y - 10, 16, 12);   // 底座
    ctx.fillStyle = '#7a828e'; ctx.fillRect(tr.x - 5, tr.y - 16, 10, 8);   // 炮身
    ctx.save(); ctx.translate(tr.x, tr.y - 12); ctx.rotate(tr.ang || 0); ctx.fillStyle = '#3a4250'; ctx.fillRect(0, -2, 14, 4); ctx.restore();   // 炮管指着目标
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(tr.x - 2, tr.y - 19, 4, 3);   // 指示灯
  }
  if (townMode && !inRoom) for (const n of npcs) TownArt.drawVillager(n);   // 🧑‍🤝‍🧑 村民逛街
  // 🕳️ 神秘山洞（发光漩涡）+ 🪙 散落金币
  if (portal && !dungeonMode) {
    const pt2 = performance.now() / 1000;
    ctx.fillStyle = '#120a1e'; ctx.beginPath(); ctx.ellipse(portal.x, portal.y, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd24a'; ctx.globalAlpha = 0.6 + Math.sin(pt2 * 4) * 0.3; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(portal.x, portal.y, 30, 22, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✨', portal.x, portal.y - 24 + Math.sin(pt2 * 3) * 3); ctx.textAlign = 'left';
  }
  for (const c of coins) {
    if (c.gem) {   // 💎 钻石：青色菱形
      ctx.fillStyle = '#7ae8f2'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 7); ctx.lineTo(c.x + 6, c.y); ctx.lineTo(c.x, c.y + 7); ctx.lineTo(c.x - 6, c.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0fbff'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 7); ctx.lineTo(c.x + 3, c.y - 1); ctx.lineTo(c.x - 3, c.y - 1); ctx.closePath(); ctx.fill();
      continue;
    }
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(c.x - 1.5, c.y - 1.5, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // ➹ 箭（双方）：飞行小箭+拖尾（灵魂系青色发光，火箭橙色，激光=青白光束）
  for (const a of earrows) {
    if (a.laser) {   // 💠 激光弹：青白光束+白芯
      const ang = Math.atan2(a.vy, a.vx);
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
      ctx.strokeStyle = '#7ae8f2'; ctx.globalAlpha = 0.85; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.restore();
    } else if (a.ghastBall) {   // 🔥 恶魂火球（被打回去后金亮）
      ctx.fillStyle = a.returned ? '#ffd24a' : '#ff7a2a'; ctx.beginPath(); ctx.arc(a.x, a.y, 9, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(a.x, a.y, 4.5, 0, 6.3); ctx.fill();
    } else if (a.wskull) {   // 💙 蓝色凋灵骷髅头
      ctx.fillStyle = '#4a6aff'; ctx.beginPath(); ctx.arc(a.x, a.y, 7, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#cfe0ff'; ctx.fillRect(a.x - 4, a.y - 2, 3, 3); ctx.fillRect(a.x + 1, a.y - 2, 3, 3);
    } else a.soul ? drawArrow(a, '#4ac8c0', '#8ff2ea') : a.volt ? drawArrow(a, '#8a8a1a', '#ffe84a') : drawArrow(a, '#8a6a38', '#f0e6b0');
  }
  for (const a of parrows) {
    if (a.wave) {   // 🌪️ 法师剑风：月牙气浪
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(a.vy, a.vx));
      ctx.globalAlpha = Math.min(1, a.t * 3); ctx.strokeStyle = '#a8e8ff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 14, -0.9, 0.9); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 10, -0.9, 0.9); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    } else if (a.magic) {   // 🪄 魔法弹：彩色光球+白芯
      ctx.globalAlpha = 0.9; ctx.fillStyle = a.mcolor || '#ff9a3d';
      ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    } else if (a.bullet) {   // 🔫 子弹：黄白小光钉
      const angB = Math.atan2(a.vy, a.vx);
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(angB);
      ctx.fillStyle = '#ffe84a'; ctx.fillRect(-8, -1.5, 12, 3);
      ctx.fillStyle = '#fff'; ctx.fillRect(-2, -1, 6, 2); ctx.restore();
    } else a.soul ? drawArrow(a, '#4ac8c0', '#8ff2ea') : a.burn ? drawArrow(a, '#5a3a1a', '#ff7a2a') : a.volt ? drawArrow(a, '#8a8a1a', '#ffe84a') : a.voidz ? drawArrow(a, '#3a2a52', '#b48af2') : drawArrow(a, '#8a6a38', '#a8e8ff');
  }
  // 🏹 骷髅王巨箭：大号箭+红羽
  for (const ga of garrows) { ctx.save(); ctx.translate(ga.x, ga.y); ctx.rotate(ga.ang); ctx.scale(2.4, 2.4); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-8, -1, 14, 2); ctx.fillStyle = '#e8e8e8'; ctx.fillRect(6, -2, 4, 4); ctx.fillStyle = '#e84a4a'; ctx.fillRect(-10, -3, 4, 2); ctx.fillRect(-10, 1, 4, 2); ctx.restore(); }
  // 玩家（无敌时一闪一闪）
  const blink = player.inv > 0 && Math.floor(player.inv * 12) % 2 === 0;
  if (pvpFoe) {   // 📡 PVP 幻影对手：红色描边小人+名牌+血条（掉线的半透明）
    const f = pvpFoe, fb = f.moving ? Math.abs(Math.sin(f.walkT * 9)) * 2 : 0;
    const fside = Math.abs(Math.cos(f.dir)) > Math.abs(Math.sin(f.dir));
    const fspr = fside ? MAN_SIDE : (Math.sin(f.dir) < 0 ? MAN_UP : MAN_DOWN);
    ctx.globalAlpha = f.stale ? 0.35 : 1;
    drawSprite(ctx, fspr, f.x - 12, f.y - 16 - fb, 2, fside && Math.cos(f.dir) < 0);
    ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 2; ctx.strokeRect(f.x - 12, f.y - 16 - fb, 24, 32);   // 红框标记=对手
    ctx.globalAlpha = 1;
    if (f.swing) { ctx.strokeStyle = '#ffb0b0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y - 4, 26, 0, 6.3); ctx.stroke(); }
    ctx.fillStyle = '#ff8080'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText((pvpSide === 1 ? '挑战者' : '房主') + (f.stale ? '（掉线中…）' : ''), f.x, f.y - 42); ctx.textAlign = 'left';
    ctx.fillStyle = '#0008'; ctx.fillRect(f.x - 16, f.y - 38, 32, 4);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(f.x - 16, f.y - 38, 32 * Math.max(0, f.hearts) / (f.maxHearts || 5), 4);
    if (f.holdFish) Sky.drawHeldFish(f.x, f.y, f.holdFish, f.dir || 0);   // 🐟 对面手里拿着什么鱼，我看得见
  }
  if (!blink) {
    const dirH = Math.cos(player.dir), dirV = Math.sin(player.dir);
    const side = Math.abs(dirH) > Math.abs(dirV);
    const spr = side ? MAN_SIDE : (dirV < 0 ? MAN_UP : MAN_DOWN), flip = side && dirH < 0;
    const bob = player.moving ? Math.abs(Math.sin(player.walkT * 9)) * 2 : 0;
    if (gameOver) {   // 💀 死亡动画：缓缓倒下+淡出
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - deathT / 1.15);
      ctx.translate(Math.round(player.x), Math.round(player.y - 6)); ctx.rotate(Math.min(1.5, deathT * 2.6));
      drawSprite(ctx, spr, -12, -10, 2, flip); ctx.restore(); ctx.globalAlpha = 1;
    } else if (playerFlyT > 0) {   // 🦅 被顶飞：抛物线飞起+影子留在原地
      const ph = 1 - playerFlyT / 0.9, flyH = Math.sin(ph * Math.PI) * 46;
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(player.x, player.y + 2, 10, 4, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(Math.round(player.x), Math.round(player.y - flyH)); ctx.rotate(ph * 5);
      drawSprite(ctx, spr, -12, -16, 2, flip); ctx.restore();
    } else if (hurtT > 0) {   // 💥 受击后仰：往后一仰
      ctx.save(); ctx.translate(Math.round(player.x), Math.round(player.y)); ctx.rotate(-0.38 * (hurtT / 0.28));
      drawSprite(ctx, spr, -12, -16 - bob, 2, flip); ctx.restore();
    } else if (sittingBench) TownArt.drawSeated(player.x, player.y, sittingBench.face);   // 🪑 真坐姿
    else drawSprite(ctx, spr, player.x - 12, player.y - 16 - bob, 2, flip);
    if (player.atkT > 0) {   // ⚔️ 攻击动作（回旋镖=真一圈扩散环；寒冰弓=更大的弧）
      const t = 1 - player.atkT / ATTACK.swing;
      ctx.strokeStyle = player.swingColor || 'rgba(255,255,255,.9)';
      if (player.swingCircle) {   // 🪃 一整圈攻击图案：圆环从小扩到最大
        ctx.globalAlpha = 1 - t * 0.6; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(player.x, player.y - 4, 12 + t * (player.swingRange - 12), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(player.x, player.y - 4, 6 + t * (player.swingRange - 18), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        const a0 = player.dir + swingDir * (-0.9 + t * 1.8), rr = player.swingRange || 26;   // ↔️ 弧光跟着左右交替
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(player.x, player.y - 4, rr, Math.min(a0 - 0.35, a0 + 0.35), Math.max(a0 - 0.35, a0 + 0.35)); ctx.stroke();
        ctx.fillStyle = '#d8d8e8'; ctx.fillRect(player.x + Math.cos(a0) * rr - 3, player.y - 4 + Math.sin(a0) * rr - 3, 7, 7);
      }
    }
    /* 🗡️ 手里的武器看得见：像素真刀真枪，跟手转向，攻击时挥起来（远程=举弓瞄准；近战=左右交替挥） */
    if (player.weapon && WEAPON_CANVAS[player.weapon] && !sittingBench && !gameOver && hurtT <= 0) {
      const wkey = (player.atkT > 0 && lastSwingKey) ? lastSwingKey : player.weapon;   // ⚔️ 战士：画正在挥的那只手
      const fxw = WEAPON_FX[wkey] || {}, isRanged = fxw.bow || fxw.staff || fxw.gun;
      const wa = player.atkT > 0 ? (isRanged ? player.dir : player.dir + swingDir * (-0.9 + (1 - player.atkT / ATTACK.swing) * 1.8)) : player.dir + 0.55;   // 🏹 远程=举弓瞄准；⚔️ 近战=左右交替挥
      const wx = player.x + Math.cos(wa) * 16, wy = player.y - 4 + Math.sin(wa) * 16;
      ctx.save(); ctx.translate(wx, wy); ctx.rotate(wa + Math.PI / 2);
      ctx.drawImage(WEAPON_CANVAS[wkey], -8, -18);
      ctx.restore();
    }
    if (player.job === 'warrior' && player.offhand && player.offhand !== player.weapon && WEAPON_CANVAS[player.offhand] && !sittingBench && !gameOver && hurtT <= 0) {
      ctx.save(); ctx.translate(Math.round(player.x), Math.round(player.y - 6)); ctx.scale(-1, 1); ctx.rotate(-0.55);   // 🤚 副手挂左边待命
      ctx.drawImage(WEAPON_CANVAS[player.offhand], -8, -18); ctx.restore();
    }
    if (blockT > 0) {   // 🛡️ 格挡护盾：蓝色光罩包住全身
      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#7ab8ff';
      ctx.beginPath(); ctx.arc(player.x, player.y - 8, 22, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.strokeStyle = '#7ab8ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(player.x, player.y - 8, 22, 0, 6.3); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    }
    if (player.bearT > 0) {   // 🐻 熊形态：棕光罩身+头顶熊耳朵
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.arc(player.x, player.y - 6, 21, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#6a3f1a'; ctx.beginPath(); ctx.arc(player.x - 8, player.y - 24, 5, 0, 6.3); ctx.arc(player.x + 8, player.y - 24, 5, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#a06a3a'; ctx.beginPath(); ctx.arc(player.x - 8, player.y - 24, 2.2, 0, 6.3); ctx.arc(player.x + 8, player.y - 24, 2.2, 0, 6.3); ctx.fill();
    }
    if (player.shieldT > 0) {   // 🛡️ 魔法护盾：青色光圈环绕
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(performance.now() / 200); ctx.strokeStyle = '#7af2ff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(player.x, player.y - 8, 24, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;
    }
    /* 🔵 蓝条在桃心下面（桃心是 emoji 画的，蓝条是细线） */
    ctx.fillStyle = '#0008'; ctx.fillRect(player.x - 15, player.y - 24, 30, 3);
    ctx.fillStyle = '#4a8af2'; ctx.fillRect(player.x - 15, player.y - 24, 30 * Math.min(1, (player.mana != null ? player.mana : 100) / (player.maxMana || 100)), 3);
    if (player.holdFish) Sky.drawHeldFish(player.x, player.y, player.holdFish, player.dir);   // 🐟 手里拿着的鱼
    if (skyMode && fishState && bobber) Sky.drawFishing();   // 🎣 甩竿钓鱼中
    /* 🛡️ 穿在身上的盔甲看得见：胸甲/帽子/皇冠 */
    const bobA = bob;
    if (player.owned.gold_armor || player.armor) {   // 胸甲
      ctx.fillStyle = player.owned.gold_armor ? 'rgba(255,210,74,.75)' : 'rgba(170,180,192,.75)';
      ctx.fillRect(player.x - 8, player.y - 4 - bobA, 16, 9);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(player.x - 8, player.y + 3 - bobA, 16, 2);
      ctx.fillRect(player.x - 5, player.y - 2 - bobA, 2, 2); ctx.fillRect(player.x + 3, player.y - 2 - bobA, 2, 2);
    }
    if (player.owned.crown) {   // 👑 皇冠
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(player.x - 8, player.y - 16 - bobA, 16, 4);
      ctx.fillRect(player.x - 8, player.y - 19 - bobA, 3, 3); ctx.fillRect(player.x - 1.5, player.y - 20 - bobA, 3, 4); ctx.fillRect(player.x + 5, player.y - 19 - bobA, 3, 3);
    } else if (player.owned.hat) {   // 🎩 皮帽子
      ctx.fillStyle = '#8a5a2a'; ctx.fillRect(player.x - 9, player.y - 15 - bobA, 18, 4);
      ctx.fillRect(player.x - 6, player.y - 19 - bobA, 12, 4);
    }
    if (player.critT > 0) { ctx.fillStyle = '#ffe84a'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('暴击!', player.x - 16, player.y - 24); }
    if (player.frozenT > 0) {   // ❄️ 被骷髅王冻住：蓝色冰壳
      ctx.fillStyle = 'rgba(140,210,255,.5)'; ctx.fillRect(player.x - 14, player.y - 20, 28, 36);
      ctx.fillStyle = '#c8f4ff'; ctx.font = '12px sans-serif'; ctx.fillText('❄️', player.x - 6, player.y - 26);
    }
    /* ❤️ 血条在玩家脑袋上，跟着玩家动（半心也能画） */
    const maxH = player.maxHearts || PLAYER.hearts, hw = 13, hx0 = player.x - maxH * hw / 2;
    ctx.font = '12px sans-serif';
    for (let i = 0; i < maxH; i++) {
      const hx = hx0 + i * hw, hy = player.y - 30;
      if (player.hearts >= i + 1) { ctx.globalAlpha = 1; ctx.fillText('❤️', hx, hy); }
      else if (player.hearts >= i + 0.5) { ctx.globalAlpha = 0.25; ctx.fillText('❤️', hx, hy);
        ctx.globalAlpha = 1; ctx.save(); ctx.beginPath(); ctx.rect(hx, hy - 14, 7, 16); ctx.clip(); ctx.fillText('❤️', hx, hy); ctx.restore(); }
      else { ctx.globalAlpha = 0.25; ctx.fillText('❤️', hx, hy); }
    }
    ctx.globalAlpha = 1;
  }
  // 粒子
  for (const pt of parts) { ctx.globalAlpha = Math.min(1, pt.t * 2); ctx.fillStyle = pt.c; ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4); }
  ctx.globalAlpha = 1;
  if (slamFx) {   // 💥 砸地冲击波：黄土环炸开
    const p = 1 - slamFx.t / 0.4;
    ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#c8a86a'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(slamFx.x, slamFx.y, 20 + p * BOSS.slamR, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 血心已搬到玩家头顶（跟着玩家动，不挡 BOSS 血条）
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.font = '22px sans-serif';
  // 装备栏小图标（武器+已买装备，最多摆 10 个）
  const TBLH = shopNow();
  let ei = 0;
  if (player.weapon && TBLH[player.weapon]) { ctx.globalAlpha = 1; ctx.fillText(TBLH[player.weapon].icon, 10 + ei * 26, 58); ei++; }
  for (const k in player.owned) { if (TBLH[k] && TBLH[k].kind === 'gear' && ei < 10) { ctx.globalAlpha = 1; ctx.fillText(TBLH[k].icon, 10 + ei * 26, 58); ei++; } }
  ctx.globalAlpha = 1;
  // 👹 BOSS 血条（顶部居中大红条）
  const bb = zombies.find(z => z.boss && !z.dead && !z.fake);
  if (bb) {
    const bw = Math.min(420, VW * 0.62);
    ctx.fillStyle = '#0009'; ctx.fillRect(VW / 2 - bw / 2 - 3, 12, bw + 6, 22);
    ctx.fillStyle = '#7a1a1a'; ctx.fillRect(VW / 2 - bw / 2, 15, bw, 16);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(VW / 2 - bw / 2, 15, bw * Math.max(0, bb.hp / (bb.maxHp || BOSS.hp)), 16);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('👹 BOSS ' + Math.max(0, Math.ceil(bb.hp)) + ' / ' + (bb.maxHp || BOSS.hp), VW / 2, 28); ctx.textAlign = 'left';
  }
  // 📣 横幅（BOSS 出场/击杀播报）
  if (banner.t > 0) {
    ctx.globalAlpha = Math.min(1, banner.t); ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.strokeText(banner.txt, VW / 2, VH * 0.24);
    ctx.fillText(banner.txt, VW / 2, VH * 0.24);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
  // 🗺️ 小地图（左上角；转屏时内容跟着转，和视野方向一致）
  const mm = mapCtx; mm.clearRect(0, 0, 112, 112);
  mm.fillStyle = 'rgba(0,0,0,.55)'; mm.fillRect(0, 0, 112, 112);
  const msc = 112 / WORLD.w;
  mm.save();
  if (rotated) { mm.translate(56, 56); mm.rotate(-Math.PI / 2); mm.translate(-56, -56); }   // 🔄 转屏联动
  if (townMode) { mm.fillStyle = '#9a9aa2'; mm.fillRect(920 * msc, 1560 * msc, 560 * msc, 560 * msc); mm.fillStyle = '#4ab8f0'; mm.beginPath(); mm.arc(1200 * msc, 1840 * msc, 2.5, 0, 6.3); mm.fill(); }   // ⛲ 广场灰块+喷泉蓝点
  for (const s of mapShops) { mm.fillStyle = '#ffd24a'; mm.fillRect(s.x * msc - 2, s.y * msc - 2, 4, 4); }   // 商店金方块
  if (portal) { mm.fillStyle = '#b48af2'; mm.beginPath(); mm.arc(portal.x * msc, portal.y * msc, 2.5, 0, 6.3); mm.fill(); }   // 山洞紫点
  for (const z of zombies) { if (z.dead) continue; if (z.boss) { mm.fillStyle = '#ff2a2a'; mm.fillRect(z.x * msc - 2, z.y * msc - 2, 4, 4); } else { mm.fillStyle = '#e88a8a'; mm.fillRect(z.x * msc - 0.75, z.y * msc - 0.75, 1.5, 1.5); } }
  mm.fillStyle = '#ffd24a'; for (const pt of pets) mm.fillRect(pt.x * msc - 0.75, pt.y * msc - 0.75, 1.5, 1.5);   // 宠物黄点
  mm.fillStyle = '#7ec850'; mm.beginPath(); mm.arc(player.x * msc, player.y * msc, 2.6, 0, 6.3); mm.fill();   // 我=绿点
  mm.strokeStyle = '#fff'; mm.lineWidth = 1; mm.beginPath(); mm.moveTo(player.x * msc, player.y * msc); mm.lineTo(player.x * msc + Math.cos(player.dir) * 6, player.y * msc + Math.sin(player.dir) * 6); mm.stroke();   // 朝向小尾巴
  mm.restore();
  mm.strokeStyle = 'rgba(255,255,255,.45)'; mm.lineWidth = 2; mm.strokeRect(1, 1, 110, 110);
}
/* 测试挂钩（别删，E2E 要用） */
window.G = { get player() { return player; }, get zombies() { return zombies; }, get kills() { return kills; }, get gameOver() { return gameOver; }, get paused() { return paused; }, get autoOn() { return autoOn; }, get holdAtk() { return holdAtk; }, get level() { return level; }, get earrows() { return earrows; }, get parrows() { return parrows; }, get garrows() { return garrows; }, get meteors() { return meteors; }, get puddles() { return puddles; }, doAttack, reset, keys, update, toggleShop, buyFromShop, spawnBoss, spawnEnemy,
  setKills: v => { kills = v; updateScore(); }, setLevel: v => { level = v; updateScore(); renderSkills(); }, setAuto: v => { autoOn = v; autoBtn.classList.toggle('on', v); if (v) autoT = 0; }, setHold: v => { holdAtk = v; if (v) autoT = 0; },
  get skillShots() { return skillShots; }, get clouds() { return clouds; }, get fxLines() { return fxLines; }, get netOrbs() { return netOrbs; }, get shocks() { return shocks; },
  get pets() { return pets; }, get dexCounts() { return dexCounts; }, get coins() { return coins; }, get portal() { return portal; }, addPet, toggleDex, toggleBag, get skillSlots() { return skillSlots; }, get chest() { return chest; }, goNextLevel, openChest,
  get townMode() { return townMode; }, get storage() { return storage; }, get ownedHouse() { return ownedHouse; }, get inRoom() { return inRoom; }, get faintDone() { return faintDone; }, enterTown, exitTown, startFaint, buyHouse,
  enterDungeon: Dgn.enterDungeon, exitDungeon: Dgn.exitDungeon, spawnGoblin: Dgn.spawnGoblin, spawnDgnKing: Dgn.spawnDgnKing, swapJob, applyJob, dgnDie: Dgn.dgnDie,   // 🌲⇄ 副本+双职业测试钩
  get dungeonMode() { return dungeonMode; }, get dgnKills() { return dgnKills; }, get dgnKingSpawned() { return dgnKingSpawned; }, get minions() { return minions; }, get turrets() { return turrets; },
  fishGo: Sky.fishGo, eatFish: Sky.eatFish, openFishShop: Sky.openFishShop, sellAllFish: Sky.sellAllFish, inArena, enterSky: enterPvp,   // ☁️ 天空城测试钩
  get skyMode() { return skyMode; }, get fishState() { return fishState; }, get bobber() { return bobber; }, setFishT(t) { fishT = t; }, get hitstopT() { return hitstopT; },   // 💥 顿帧测试钩
  castSkill, renderSkills, ownedSkills, spawnStorm: () => { const z = makeStorm(player.x + 150, player.y, Math.random); zombies.push(z); }, spawnVoid: () => { const z = makeVoid(player.x + 150, player.y, Math.random); zombies.push(z); } };
reset(); if (loadGame()) setBanner('💾 存档已读取，接着玩！');
showHome();   // 🏠 开机先进主页选存档
addEventListener('pointerdown', startMusic, { once: true });   // 🎵 第一次点屏幕时开播（浏览器规矩）
addEventListener('keydown', startMusic, { once: true });
requestAnimationFrame(loop);
