'use strict';
/* ================= 画面 ================= */
/* 👹 BOSS 画法：举臂预警圈、陀螺旋转、受击闪白 */
function drawBoss(z) {
  if (z.warden) {   // 👿 坚守者：深绿巨汉+双角+胸口发光核心，蓄力时核心爆亮
    const wx = Math.round(z.x), wy = Math.round(z.y - 30);
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(z.x, z.y + 8, 34, 10, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    const bob = Math.sin(z.walkT * 2.2) * 3;
    ctx.fillStyle = '#1e3a38'; ctx.fillRect(wx - 30, wy - 26 + bob, 60, 56);   // 身躯
    ctx.fillStyle = '#162826'; ctx.fillRect(wx - 34, wy - 20 + bob, 10, 40); ctx.fillRect(wx + 24, wy - 20 + bob, 10, 40);   // 双臂
    ctx.strokeStyle = '#2a4a44'; ctx.lineWidth = 6;   // 双角
    ctx.beginPath(); ctx.moveTo(wx - 18, wy - 26 + bob); ctx.quadraticCurveTo(wx - 30, wy - 44 + bob, wx - 24, wy - 52 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx + 18, wy - 26 + bob); ctx.quadraticCurveTo(wx + 30, wy - 44 + bob, wx + 24, wy - 52 + bob); ctx.stroke();
    const core = z.chargeT != null ? 0.6 + Math.random() * 0.4 : 0.3 + Math.sin(z.walkT * 2) * 0.15;   // 胸口核心（蓄力爆亮）
    ctx.fillStyle = `rgba(122,232,242,${core})`; ctx.beginPath(); ctx.arc(wx, wy + 2 + bob, 11, 0, 6.3); ctx.fill();
    if (z.chargeT != null) { ctx.strokeStyle = `rgba(122,232,242,${core})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy + 2 + bob, 18 + Math.sin(z.walkT * 20) * 4, 0, 6.3); ctx.stroke(); }
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(wx - 34, wy - 30 + bob, 68, 64); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0008'; ctx.fillRect(wx - 30, wy - 36, 60, 5);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(wx - 30, wy - 36, 60 * (z.hp / z.maxHp), 5);
    return;
  }
  if (z.ghast) {   // 👻 恶魂：白色大幽灵+九条触手，喷火球时张嘴红眼
    const gx = Math.round(z.x), gy = Math.round(z.y - 40 - Math.sin(z.walkT * 1.6) * 7);
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(z.x, z.y + 8, 34, 10, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 5;   // 九条触手（波浪摆动）
    for (let i = 0; i < 9; i++) {
      const tx2 = gx - 28 + i * 7, wob = Math.sin(z.walkT * 3 + i * 1.3) * 4;
      ctx.beginPath(); ctx.moveTo(tx2, gy + 20); ctx.quadraticCurveTo(tx2 + wob, gy + 34, tx2 + wob * 0.5, gy + 44); ctx.stroke();
    }
    ctx.fillStyle = '#f2f2f8'; ctx.fillRect(gx - 32, gy - 24, 64, 46);   // 大白身体
    ctx.fillStyle = '#dcdce6'; ctx.fillRect(gx - 32, gy - 24, 64, 8);   // 头顶高光
    const gmouth = z.mouthT > 0;
    ctx.fillStyle = gmouth ? '#c82a2a' : '#3a3440';   // 张嘴=红，闭嘴=灰
    if (gmouth) { ctx.fillRect(gx - 8, gy + 4, 16, 12); ctx.fillStyle = '#7a1010'; ctx.fillRect(gx - 5, gy + 7, 10, 6); }
    else ctx.fillRect(gx - 8, gy + 8, 16, 3);
    ctx.fillStyle = gmouth ? '#c82a2a' : '#3a3440';   // 眼睛（喷火时变红）
    ctx.fillRect(gx - 20, gy - 12, 8, gmouth ? 8 : 3); ctx.fillRect(gx + 12, gy - 12, 8, gmouth ? 8 : 3);
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(gx - 36, gy - 28, 72, 56); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0008'; ctx.fillRect(gx - 30, gy - 36, 60, 5);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(gx - 30, gy - 36, 60 * (z.hp / z.maxHp), 5);
    return;
  }
  if (z.dgnKing) {   // 👑 哥布林王：巨型哥布林+王冠+手臂缠鞭（鞭子横扫一鞭 5 血！）
    const kx = Math.round(z.x), ky = Math.round(z.y);
    if (z.whip) {   // 鞭子预警：红色扇形红区（150°，跑出红区就没事）
      ctx.save(); ctx.globalAlpha = 0.26 + 0.16 * Math.sin(z.walkT * 16); ctx.fillStyle = '#ff4a3a';
      ctx.beginPath(); ctx.moveTo(z.x, z.y - 20); ctx.arc(z.x, z.y - 20, 170, z.whip.ang - Math.PI * 5 / 12, z.whip.ang + Math.PI * 5 / 12); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(kx, ky + 4, 30, 10, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    drawGoblin(kx, ky, 2.6, { walkT: z.walkT, face: player.x < z.x ? -1 : 1, clubA: z.whip ? -1.4 : undefined });   // 甩鞭时手臂举高
    const wA = z.whip ? z.whip.ang : (z.whipFx > 0 ? z.whipFxA : Math.atan2(player.y - z.y, player.x - z.x));   // 鞭子：右臂甩出
    const wLen = z.whipFx > 0 ? 150 : (z.whip ? 60 : 30);
    ctx.strokeStyle = '#5a3f1a'; ctx.lineWidth = z.whipFx > 0 ? 5 : 4; ctx.beginPath();
    ctx.moveTo(kx + 18, ky - 36); ctx.quadraticCurveTo(kx + Math.cos(wA) * wLen * 0.6, ky - 36 + Math.sin(wA) * wLen * 0.6 - 12, kx + Math.cos(wA) * wLen, ky - 20 + Math.sin(wA) * wLen);
    ctx.stroke();
    if (z.whipFx > 0) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kx + 18, ky - 36); ctx.quadraticCurveTo(kx + Math.cos(wA) * wLen * 0.6, ky - 36 + Math.sin(wA) * wLen * 0.6 - 12, kx + Math.cos(wA) * wLen, ky - 20 + Math.sin(wA) * wLen); ctx.stroke(); }   // 鞭影金线
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(kx - 12, ky - 92, 24, 6); ctx.fillRect(kx - 12, ky - 98, 4, 8); ctx.fillRect(kx - 3, ky - 100, 6, 10); ctx.fillRect(kx + 8, ky - 98, 4, 8);   // 👑 王冠
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(kx - 26, ky - 84, 52, 88); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0008'; ctx.fillRect(kx - 30, ky - 110, 60, 6);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(kx - 30, ky - 110, 60 * (z.hp / z.maxHp), 6);
    return;
  }
  if (z.titan) {   // 🧨 泰坦苦力怕：巨型绿色苦力怕（四条腿+苦脸）
    const tx = Math.round(z.x), ty = Math.round(z.y - 26);
    if (z.tnts) for (const t of z.tnts) {   // TNT 块：红盒白条纹+引线火花+预警圈
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t.t * 12); ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(t.x, t.y, 65 * (t.t / 2.5), 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#c8302a'; ctx.fillRect(t.x - 10, t.y - 12, 20, 20);
      ctx.fillStyle = '#f0e6d0'; ctx.fillRect(t.x - 10, t.y - 4, 20, 6);
      ctx.fillStyle = '#5a1a14'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TNT', t.x, t.y + 1); ctx.textAlign = 'left';
      if (Math.floor(t.t * 8) % 2 === 0) { ctx.fillStyle = '#ffe84a'; ctx.fillRect(t.x - 1, t.y - 17, 3, 5); }   // 火花闪
    }
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(tx, z.y + 4, 26, 9, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    drawCreeper(tx, z.y + 2, 2.3, { walkT: z.walkT });   // 🧨 泰坦苦力怕：MC 同款迷彩高绿柱（放大版）
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(tx - 10, z.y - 66, 20, 6); ctx.fillRect(tx - 10, z.y - 72, 4, 8); ctx.fillRect(tx - 2, z.y - 74, 4, 10); ctx.fillRect(tx + 6, z.y - 72, 4, 8);   // 👑 泰坦的王冠
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(tx - 22, ty - 44, 44, 60); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0008'; ctx.fillRect(tx - 28, ty - 52, 56, 5);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(tx - 28, ty - 52, 56 * (z.hp / z.maxHp), 5);
    return;
  }
  if (z.ender) {   // 🐉 末影龙：黑龙盘旋（大翅膀扇动+长尾巴+紫眼睛）
    const ex = Math.round(z.x), ey = Math.round(z.y - 46 - Math.sin(z.walkT * 2) * 8);
    if (z.diveWarn != null) {   // 俯冲预警红线
      ctx.save(); ctx.globalAlpha = 0.3 + 0.25 * Math.sin(z.walkT * 14); ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 60;
      ctx.beginPath(); ctx.moveTo(z.x, z.y - 30); ctx.lineTo(z.x + z.warnDx * Math.max(320, 420), z.y - 30 + z.warnDy * Math.max(320, 420)); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
    }
    const eface = z.dive ? Math.sign(z.dive.vx) || 1 : Math.sign(player.x - z.x) || 1;
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(z.x, z.y + 8, 46, 14, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;   // 影子
    ctx.save(); ctx.translate(ex, ey); ctx.scale(eface, 1);
    const flap = Math.sin(z.walkT * 6) * 0.55;   // 翅膀扇动
    ctx.fillStyle = '#14101e';
    ctx.save(); ctx.rotate(-0.5 - flap); ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-64, -34); ctx.lineTo(-52, 2); ctx.closePath(); ctx.fill(); ctx.restore();   // 后翅
    ctx.save(); ctx.rotate(-0.2 + flap * 0.5); ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(-46, -44); ctx.lineTo(-30, -2); ctx.closePath(); ctx.fill(); ctx.restore();   // 前翅
    ctx.strokeStyle = '#14101e'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-34, 4); ctx.quadraticCurveTo(-58, 10, -74, 22 + Math.sin(z.walkT * 3) * 6); ctx.stroke();   // 尾巴
    ctx.fillStyle = '#14101e'; ctx.beginPath(); ctx.ellipse(0, 0, 38, 15, 0, 0, 6.3); ctx.fill();   // 身体
    ctx.fillStyle = '#3a3454'; ctx.beginPath(); ctx.ellipse(0, 4, 30, 8, 0, 0, 6.3); ctx.fill();   // 灰腹
    ctx.strokeStyle = '#14101e'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(26, -4); ctx.quadraticCurveTo(38, -14, 44, -22); ctx.stroke();   // 脖子
    ctx.fillStyle = '#14101e'; ctx.fillRect(36, -34, 22, 14);   // 头
    ctx.fillStyle = '#8a8578'; ctx.fillRect(40, -40, 4, 8); ctx.fillRect(50, -40, 4, 8);   // 龙角
    ctx.fillStyle = '#b48af2'; ctx.fillRect(50, -29, 5, 4);   // 紫眼睛
    if (z.breathT != null && z.breathT < 1.2) {   // 龙息蓄力：嘴前紫光
      ctx.globalAlpha = 0.5 + Math.sin(z.walkT * 16) * 0.3; ctx.fillStyle = '#b48af2'; ctx.beginPath(); ctx.arc(62, -24, 8, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (z.breaths) for (const br of z.breaths) {   // 💜 龙息弹：紫色气团
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#b48af2'; ctx.beginPath(); ctx.arc(br.x, br.y, 8, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#e0ccff'; ctx.beginPath(); ctx.arc(br.x, br.y, 4, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(z.x - 70, z.y - 90, 140, 90); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 50, z.y - 104, 100, 7);
    ctx.fillStyle = '#b48af2'; ctx.fillRect(z.x - 50, z.y - 104, 100 * (z.hp / z.maxHp), 7);   // 一万血大紫条
    return;
  }
  if (z.wither) {   // 💀 凋灵：三头黑骨架+蓝色幽光+冲锋红线预警
    const wx = Math.round(z.x), wy = Math.round(z.y - 30), wbob = Math.sin(z.walkT * 2) * 4;
    if (z.chargeWarn != null) {   // 冲锋预警：3 格宽的红色走廊
      ctx.save(); ctx.globalAlpha = 0.3 + 0.25 * Math.sin(z.walkT * 14); ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 96;
      ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.x + z.warnDx * 320, z.y + z.warnDy * 320); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
    }
    ctx.save(); ctx.translate(wx, wy + wbob);
    if (z.charge) ctx.translate(Math.sin(z.walkT * 40) * 2, 0);   // 冲锋抖动
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#4a6aff'; ctx.beginPath(); ctx.arc(0, -8, 60, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;   // 蓝色幽光
    ctx.fillStyle = '#16121a'; ctx.fillRect(-22, -6, 44, 26);   // 肋骨架
    ctx.fillStyle = '#3a3440'; ctx.fillRect(-22, 0, 44, 3); ctx.fillRect(-22, 7, 44, 3); ctx.fillRect(-22, 14, 44, 3);
    ctx.fillStyle = '#16121a'; ctx.fillRect(-4, 20, 8, 12);   // 脊椎尾
    const whead = (hx, hy, s) => {   // 黑色骷髅头+蓝眼窝
      ctx.fillStyle = '#16121a'; ctx.fillRect(hx - 8 * s, hy - 8 * s, 16 * s, 14 * s);
      ctx.fillStyle = '#7ab8ff'; ctx.fillRect(hx - 5 * s, hy - 4 * s, 4 * s, 3 * s); ctx.fillRect(hx + 1 * s, hy - 4 * s, 4 * s, 3 * s);
      ctx.fillStyle = '#16121a'; ctx.fillRect(hx - 2 * s, hy + 3 * s, 4 * s, 3 * s);
    };
    whead(0, -22, 1.3); whead(-26, -10, 0.9); whead(26, -10, 0.9);   // 中间大头+两侧小头
    ctx.restore();
    if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(z.x - 40, z.y - 80, 80, 80); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0008'; ctx.fillRect(z.x - 30, z.y - 86, 60, 6);
    ctx.fillStyle = '#e84a4a'; ctx.fillRect(z.x - 30, z.y - 86, 60 * (z.hp / z.maxHp), 6);
    return;
  }
  const hop = Math.abs(Math.sin(z.walkT * 6)) * 3;
  if (z.state === 'windup') {   // 💥 预警圈：红圈越缩越紧
    const p = 1 - z.stateT / BOSS.slamWind;
    ctx.globalAlpha = 0.25 + p * 0.45; ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(z.x, z.y, BOSS.slamR, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.12 + p * 0.2; ctx.fillStyle = '#ff4a3a';
    ctx.beginPath(); ctx.arc(z.x, z.y, BOSS.slamR * p, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.save();
  const bcv = z.voidBoss ? BOSS_VOID_CANVAS : z.stormBoss ? BOSS_STORM_CANVAS : z.lavaBoss ? BOSS_LAVA_CANVAS : z.ghostBoss ? BOSS_GHOST_CANVAS : z.skelBoss ? BOSS_SKEL_CANVAS : z.crystalBoss ? BOSS_CRYSTAL_CANVAS : BOSS_CANVAS;
  if (z.ghostBoss) ctx.globalAlpha = 0.92;   // 👻 鬼王半透明
  if (z.hidden) {   // 🕳️ 相位轰炸：本体隐身，只剩虚空旋涡
    ctx.strokeStyle = '#b48af2'; ctx.lineWidth = 4; ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(z.x, z.y, 18 + i * 14 + Math.sin(z.walkT * 6) * 5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore(); return;
  }
  if (z.stormBoss || z.voidBoss || z.lavaBoss) {   // ✨ BOSS 光环：多层圆代替 shadowBlur（iPad 上 shadowBlur 是帧率炸弹，全部拆除）
    const glowC = z.stormBoss ? '#ffe84a' : z.voidBoss ? '#8a5ac8' : '#ff7a2a';
    ctx.globalAlpha = 0.22; ctx.fillStyle = glowC; ctx.beginPath(); ctx.arc(z.x, z.y - 40, 78, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.14; ctx.beginPath(); ctx.arc(z.x, z.y - 40, 98, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (z.state === 'charge') {   // 🔥 冲锋：拉长火焰
    ctx.fillStyle = 'rgba(255,122,42,.4)'; ctx.beginPath(); ctx.ellipse(z.x - z.chargeDx * 60, z.y - 40 - z.chargeDy * 60, 70, 40, Math.atan2(z.chargeDy, z.chargeDx), 0, Math.PI * 2); ctx.fill();
  }
  if (z.state === 'drain') {   // ⛓️ 夺魂锁链：青色锁链连着玩家
    ctx.strokeStyle = 'rgba(143,242,234,.85)'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(z.x, z.y - 40); ctx.lineTo(player.x, player.y - 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#8ff2ea'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('⛓️ 夺魂中！', z.x - 40, z.y - 100);
  }
  if (z.state === 'spin') {   // 🌀 陀螺：整个转起来
    ctx.translate(z.x, z.y - 80); ctx.rotate(z.spinA);
    ctx.drawImage(bcv, -60, -92);
    ctx.strokeStyle = 'rgba(190,240,255,.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 12, z.r + 8, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.drawImage(bcv, z.x - 60, z.y - 92 - hop);
  }
  ctx.restore();
  if (z.flash > 0) { ctx.globalAlpha = Math.min(1, z.flash * 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(z.x - 60, z.y - 92, 120, 172); ctx.globalAlpha = 1; }
}
/* ➹ 画一支箭：木杆+羽尾，按飞行方向旋转 */
function drawArrow(a, shaft, feather) {
  const ang = Math.atan2(a.vy, a.vx);
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
  ctx.fillStyle = shaft; ctx.fillRect(-8, -1, 14, 2);
  ctx.fillStyle = '#c8ccd4'; ctx.fillRect(6, -2, 4, 4);
  ctx.fillStyle = feather; ctx.fillRect(-10, -3, 4, 2); ctx.fillRect(-10, 1, 4, 2);
  ctx.restore();
}
/* ☁️ 柔雾团预渲染（每种颜色一张径向渐变贴图，画雾又快又柔） */
const BLOB_CACHE = {};
function softBlob(color) {
  if (BLOB_CACHE[color]) return BLOB_CACHE[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, color); grad.addColorStop(0.55, color); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  BLOB_CACHE[color] = c; return c;
}
/* 🗺️ 地面棋盘图案：80×80 小贴图 repeat（内存忽略不计；2400×2400 大画布烘焙会把 iPad 内存压垮——人物消失+卡死的病根） */
const GROUND_CACHE = {};
function groundPattern() {
  if (GROUND_CACHE[level]) return GROUND_CACHE[level];
  const LV = LEVELS[level];
  const c = document.createElement('canvas'); c.width = c.height = 80;
  const g = c.getContext('2d');
  g.fillStyle = LV.grassA; g.fillRect(0, 0, 80, 80);
  g.fillStyle = LV.grassB; g.fillRect(40, 0, 40, 40); g.fillRect(0, 40, 40, 40);
  GROUND_CACHE[level] = ctx.createPattern(c, 'repeat');
  return GROUND_CACHE[level];
}
/* ☁️ 天空城（收进 Sky 对象，不占全局） */
const Sky = {
/* ================= ☁️ 天空城：钓鱼/鱼商人/手持鱼 ================= */
fishTick(dt) {   // 🎣 钓鱼状态机：抛杆(甩竿0.5秒)→等鱼(2~6秒)→咬钩(1秒窗口收杆)→得手/跑了
  if (fishState === 'casting') { fishT -= dt; if (fishT <= 0) { fishState = 'waiting'; fishT = 2 + Math.random() * 4; } }
  else if (fishState === 'waiting') { fishT -= dt; if (fishT <= 0) { fishState = 'bite'; fishT = 1.0; beep(1000, 1400, 0.15, 'square', 0.18); } }
  else if (fishState === 'bite') { fishT -= dt; if (fishT <= 0) { fishState = null; bobber = null; setBanner('💨 鱼跑了……浮漂一沉就点「收杆」！'); } }
},

fishGo() {   // 🎣 抛杆/收杆一体钮
  if (!skyMode || gameOver || paused) return;
  if (!fishState) {   // 抛杆！浮漂甩进池子
    fishState = 'casting'; fishT = 0.5;
    bobber = { x: SKY_POND.x + (Math.random() - 0.5) * 200, y: SKY_POND.y + (Math.random() - 0.5) * 60 };
    player.dir = Math.atan2(bobber.y - player.y, bobber.x - player.x);   // 面朝池子甩竿
    beep(500, 900, 0.15, 'sine', 0.1);
  } else if (fishState === 'bite') {   // ❗咬钩了！收杆中鱼
    const r = Math.random();
    const key = r < 0.4 ? 'fish_tropical' : r < 0.7 ? 'fish_salmon' : r < 0.9 ? 'fish_tuna' : 'fish_puffer';   // 热带鱼40/三文鱼30/金枪鱼20/河豚10
    player.items[key] = (player.items[key] || 0) + 1;
    setBanner(FISH[key].icon + ' 钓到「' + FISH[key].name + '」啦！北边鱼商人 ' + FISH[key].price + ' 金收，或者拿着吃掉回 2 血');
    burst(bobber.x, bobber.y, '#7ec8ff', 14); beep(700, 1400, 0.2, 'sine', 0.16);
    fishState = null; bobber = null; saveGame();
  } else { fishState = null; bobber = null; setBanner('🎣 提前收杆了（鱼还没上钩）'); }   // 手痒收早了
},

eatFish() {   // 😋 吃掉手里的鱼：回 2 血
  const k = player.holdFish;
  if (!k || (player.items[k] || 0) <= 0) { player.holdFish = null; return; }
  player.items[k]--; if (player.items[k] <= 0) delete player.items[k];
  player.holdFish = null;
  player.hearts = Math.min(player.maxHearts, player.hearts + 2);
  burst(player.x, player.y - 8, '#7aff8a', 12); beep(500, 800, 0.15, 'sine', 0.14);
  setBanner('😋 吃掉了「' + FISH[k].name + '」，回 2 血！'); saveGame();
},

openFishShop() { Sky.renderFishShop(); document.getElementById('fishShop').style.display = 'flex'; },

renderFishShop() {   // 🐟 鱼商人面板：四种鱼明码标价
  const el = document.getElementById('fishShopList'); let h = '';
  for (const k in FISH) {
    const n = (player.items || {})[k] || 0;
    h += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)"><span style="font-size:22px">${FISH[k].icon}</span><span style="flex:1">${FISH[k].name} ×${n}（每条 ${FISH[k].price} 金）</span>` + (n > 0 ? `<button data-fish="${k}">卖 1 条</button>` : '<span style="opacity:.4">没有</span>') + '</div>';
  }
  el.innerHTML = h;
  el.querySelectorAll('button[data-fish]').forEach(b => b.onclick = () => Sky.sellFish(b.dataset.fish));
},

sellFish(k) {   // 卖 1 条
  if ((player.items[k] || 0) <= 0) return;
  player.items[k]--; if (player.items[k] <= 0) { delete player.items[k]; if (player.holdFish === k) player.holdFish = null; }
  player.gold += FISH[k].price; updateGold(); saveGame(); Sky.renderFishShop();
  setBanner('💰 卖掉 1 条' + FISH[k].name + '，+' + FISH[k].price + ' 金！'); beep(800, 1200, 0.1, 'square', 0.12);
},

sellAllFish() {   // 全卖
  let n = 0, g = 0;
  for (const k in FISH) { const c = (player.items[k] || 0); if (c > 0) { n += c; g += c * FISH[k].price; delete player.items[k]; if (player.holdFish === k) player.holdFish = null; } }
  if (!n) { setBanner('🎒 背包里没有鱼'); return; }
  player.gold += g; updateGold(); saveGame(); Sky.renderFishShop();
  setBanner('💰 一口气卖了 ' + n + ' 条鱼，+' + g + ' 金！'); beep(700, 1300, 0.2, 'square', 0.15);
},

drawHeldFish(x, y, key, dir) {   // 🐟 手里的鱼：四种鱼四种样子（联网对面也看得见）
  const flip = Math.cos(dir || 0) < 0 ? -1 : 1;
  const fx = x + flip * 18, fy = y - 12 + Math.sin(performance.now() / 250) * 1.5;   // 手边晃悠
  ctx.save(); ctx.translate(fx, fy); ctx.scale(flip, 1);
  if (key === 'fish_tropical') {   // 🐠 热带鱼：橙白条纹
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-3, -4, 3, 8); ctx.fillRect(2, -4, 2, 8);
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(14, -4); ctx.lineTo(14, 4); ctx.fill();
  } else if (key === 'fish_salmon') {   // 🐟 三文鱼：粉橙
    ctx.fillStyle = '#f28a6a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#e86a4a'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(16, -5); ctx.lineTo(16, 5); ctx.fill();
  } else if (key === 'fish_tuna') {   // 🦈 金枪鱼：蓝银大鱼
    ctx.fillStyle = '#3a6ab8'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#c8d8e8'; ctx.beginPath(); ctx.ellipse(0, 2, 12, 3, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#3a6ab8'; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(20, -5); ctx.lineTo(20, 5); ctx.fill();
  } else if (key === 'fish_puffer') {   // 🐡 河豚：圆滚滚带刺
    ctx.fillStyle = '#d8c84a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#a8982a'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 10.5, Math.sin(a) * 10.5); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -2, 2.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-3, -2, 1, 0, 6.3); ctx.fill();
  }
  ctx.restore();
},

drawFishing() {   // 🎣 鱼竿+线+浮漂（抛杆弧线/等鱼轻晃/咬钩猛沉）
  const hx = player.x + 14, hy = player.y - 10;
  const tx = hx + Math.cos(player.dir) * 26, ty = hy - 20;
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();   // 竿
  const midX = (tx + bobber.x) / 2, midY = Math.min(ty, bobber.y) - 50;
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(midX, midY, bobber.x, bobber.y - 4); ctx.stroke();   // 线
  const dip = fishState === 'bite' ? 5 + Math.sin(performance.now() / 60) * 2 : Math.sin(performance.now() / 300) * 2;   // 咬钩猛沉
  ctx.fillStyle = '#e84a4a'; ctx.beginPath(); ctx.arc(bobber.x, bobber.y + dip, 5, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bobber.x, bobber.y + dip - 3, 3, 3.2, 6.3); ctx.fill();
  if (fishState === 'bite') {
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('❗', bobber.x, bobber.y - 20); ctx.textAlign = 'left';
    ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(bobber.x, bobber.y + 4, 18, 7, 0, 0, 6.3); ctx.stroke();
  }
},

drawSkyCity() {   // ☁️ 天空城全景：蓝天+飘云+云岛+钓鱼池+PVP 擂台+鱼商人+回冒险门
  const g = ctx.createLinearGradient(0, 0, 0, WORLD.h);
  g.addColorStop(0, '#5aa8e8'); g.addColorStop(1, '#bfe6ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  for (let i = 0; i < 8; i++) {   // 远处慢悠悠飘云
    const cx = (i * 620 + performance.now() / 60) % (WORLD.w + 400) - 200, cy = 80 + (i % 4) * 110;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath(); ctx.ellipse(cx, cy, 120, 34, 0, 0, 6.3); ctx.ellipse(cx + 70, cy + 12, 80, 26, 0, 0, 6.3); ctx.ellipse(cx - 75, cy + 14, 70, 22, 0, 0, 6.3); ctx.fill();
  }
  ctx.fillStyle = '#a8c4dd'; ctx.beginPath(); ctx.ellipse(1200, 1290, 830, 720, 0, 0, 6.3); ctx.fill();   // 云岛底影
  ctx.fillStyle = '#f6f2e6'; ctx.beginPath(); ctx.ellipse(1200, 1255, 800, 700, 0, 0, 6.3); ctx.fill();   // 云岛台面
  ctx.fillStyle = '#e8f4ff';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; ctx.beginPath(); ctx.ellipse(1200 + Math.cos(a) * 640, 1255 + Math.sin(a) * 545, 90, 40, 0, 0, 6.3); ctx.fill(); }   // 台面云边
  /* 🎣 钓鱼池（南） */
  ctx.fillStyle = '#8a7a5a'; ctx.beginPath(); ctx.ellipse(SKY_POND.x, SKY_POND.y + 10, SKY_POND.rx + 18, SKY_POND.ry + 16, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#3a8ac8'; ctx.beginPath(); ctx.ellipse(SKY_POND.x, SKY_POND.y, SKY_POND.rx, SKY_POND.ry, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#5ab0e8'; ctx.beginPath(); ctx.ellipse(SKY_POND.x, SKY_POND.y - 10, SKY_POND.rx - 45, SKY_POND.ry - 28, 0, 0, 6.3); ctx.fill();
  for (let i = 0; i < 3; i++) { const rr = (performance.now() / 22 + i * 55) % 170; ctx.strokeStyle = 'rgba(255,255,255,' + Math.max(0, 0.55 - rr / 320) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(SKY_POND.x + (i - 1) * 80, SKY_POND.y, rr, rr * 0.38, 0, 0, 6.3); ctx.stroke(); }   // 涟漪
  ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎣', SKY_POND.x, SKY_POND.y - SKY_POND.ry - 44);
  ctx.fillStyle = '#5a4a2a'; ctx.font = 'bold 17px sans-serif'; ctx.fillText('钓 鱼 区', SKY_POND.x, SKY_POND.y - SKY_POND.ry - 20); ctx.textAlign = 'left';
  /* ⚔️ PVP 区（中）：红金擂台圈 */
  ctx.fillStyle = '#ead9b8'; ctx.beginPath(); ctx.arc(SKY_ARENA.x, SKY_ARENA.y, SKY_ARENA.r, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#c8382a'; ctx.lineWidth = 8; ctx.setLineDash([26, 16]); ctx.beginPath(); ctx.arc(SKY_ARENA.x, SKY_ARENA.y, SKY_ARENA.r, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {   // 四角金顶柱
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(SKY_ARENA.x + sx * SKY_ARENA.r * 0.72 - 7, SKY_ARENA.y + sy * SKY_ARENA.r * 0.72 - 7, 14, 14);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(SKY_ARENA.x + sx * SKY_ARENA.r * 0.72 - 7, SKY_ARENA.y + sy * SKY_ARENA.r * 0.72 - 12, 14, 5);
  }
  ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#c8382a'; ctx.fillText('⚔️ PVP 区（进圈才开打）', SKY_ARENA.x, SKY_ARENA.y - SKY_ARENA.r - 14); ctx.textAlign = 'left';
  /* 🐟 鱼商人（北）：红白条纹棚+鱼箱+老板 */
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(SKY_SHOP.x - 70, SKY_SHOP.y - 10, 140, 50);
  for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e84a4a'; ctx.fillRect(SKY_SHOP.x - 80 + i * 23, SKY_SHOP.y - 52, 23, 24); }
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(SKY_SHOP.x - 80, SKY_SHOP.y - 28, 161, 8);
  ctx.fillStyle = '#5ab0e8'; ctx.fillRect(SKY_SHOP.x - 55, SKY_SHOP.y + 4, 44, 26); ctx.fillStyle = '#7ec8ff'; ctx.fillRect(SKY_SHOP.x - 48, SKY_SHOP.y + 8, 30, 18);
  ctx.font = '26px sans-serif'; ctx.fillText('🐟', SKY_SHOP.x + 22, SKY_SHOP.y + 28);
  ctx.font = '30px sans-serif'; ctx.fillText('🧍‍♂️', SKY_SHOP.x - 14, SKY_SHOP.y - 54);
  ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#3a2a1a'; ctx.fillText('鱼商人（收鱼）', SKY_SHOP.x, SKY_SHOP.y + 64); ctx.textAlign = 'left';
  /* 🚪 回冒险的门（西南角） */
  ctx.fillStyle = '#8fd8ff'; ctx.beginPath(); ctx.ellipse(640, 1820, 40, 54, 0, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(640, 1820, 40, 54, 0, 0, 6.3); ctx.stroke();
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#2a4a6a'; ctx.fillText('回冒险', 640, 1898); ctx.textAlign = 'left';
}
};










