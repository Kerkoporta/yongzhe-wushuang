'use strict';
/* ================= 🎡 小镇游乐场（十项，恩泽点的） ================= */
const ATTRACT = [
  { id: 'whack', icon: '🔨', name: '打地鼠', x: 1545, y: 1620 }, { id: 'arch', icon: '🏹', name: '射箭靶场', x: 1545, y: 1700 },
  { id: 'fish', icon: '🎣', name: '钓鱼池', x: 1545, y: 1780 }, { id: 'wheel', icon: '🎡', name: '幸运转盘', x: 1545, y: 1860 },
  { id: 'claw', icon: '🧸', name: '抓娃娃机', x: 1545, y: 1940 }, { id: 'run', icon: '🏃', name: '环镇跑酷', x: 1545, y: 2020 },
  { id: 'cups', icon: '🎁', name: '猜宝箱', x: 855, y: 1620 }, { id: 'hoops', icon: '🏀', name: '投篮机', x: 855, y: 1700 },
  { id: 'arena', icon: '⚔️', name: '擂台赛', x: 855, y: 1780 }, { id: 'maze', icon: '🌳', name: '迷宫寻宝', x: 855, y: 1860 },
];
function nearPlay() { for (let i = 0; i < ATTRACT.length; i++) if (Math.hypot(player.x - ATTRACT[i].x, player.y - ATTRACT[i].y) < 56) return i; return -1; }
const playEl = document.getElementById('play'), playCv = document.getElementById('playCv');
let playId = null, playSt = null, playRAF = 0, playLast = 0;
function playReward(gold, dia) {   // 🎁 游乐项目发奖
  if (gold) { player.gold += gold; updateGold(); }
  if (dia) { player.diamonds = (player.diamonds || 0) + dia; updateDia(); }
  saveGame();
}
function ptTxt(c, s, x, y, size, color) { c.fillStyle = color || '#fff'; c.font = 'bold ' + size + 'px sans-serif'; c.textAlign = 'center'; c.fillText(s, x, y); c.textAlign = 'left'; }
function ptHud(c, s) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, 360, 30); ptTxt(c, s, 180, 21, 16, '#ffd24a'); }
function ptEnd(c, s, s2) { c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(0, 120, 360, 120); ptTxt(c, s, 180, 175, 22, '#ffd24a'); ptTxt(c, s2, 180, 208, 14, '#bfe8ff'); }
const MINIS = {
  /* 1. 🔨 打地鼠（僵尸版）：30 秒，1 只=2 金币 */
  whack: { name: '🔨 打地鼠（僵尸版）', hint: '30 秒！僵尸头冒出来就点它，1 只 = 2 金币',
    init: () => ({ t: 30, score: 0, moles: [], sp: 0, done: 0 }),
    tick(s, dt, c) {
      s.t -= dt; s.sp -= dt;
      if (s.sp <= 0 && s.moles.length < 3 && s.t > 0) { s.sp = 0.75; s.moles.push({ i: Math.floor(Math.random() * 9), t: 0.95 }); }
      for (const m of s.moles) m.t -= dt;
      s.moles = s.moles.filter(m => m.t > 0);
      c.clearRect(0, 0, 360, 360); c.fillStyle = '#1e3316'; c.fillRect(0, 30, 360, 330);
      for (let i = 0; i < 9; i++) { const hx = 62 + (i % 3) * 118, hy = 78 + Math.floor(i / 3) * 105;
        c.fillStyle = '#241a10'; c.beginPath(); c.ellipse(hx, hy + 16, 40, 15, 0, 0, 6.3); c.fill();
        const m = s.moles.find(m2 => m2.i === i);
        if (m) { const pop = Math.min(1, (0.95 - m.t) * 6) * Math.min(1, m.t * 6); c.globalAlpha = Math.max(0.25, pop); c.font = '42px sans-serif'; c.textAlign = 'center'; c.fillText('🧟', hx, hy + 14); c.globalAlpha = 1; c.textAlign = 'left'; }
      }
      ptHud(c, '⏱️ ' + Math.ceil(Math.max(0, s.t)) + ' 秒    🔨 打到 ' + s.score + ' 只');
      if (s.t <= 0 && !s.done) { s.done = 1; playReward(s.score * 2, 0); ptEnd(c, '🔨 打到 ' + s.score + ' 只！', '+' + s.score * 2 + ' 金币已入账'); }
    },
    tap(s, x, y) { if (s.t <= 0) return;
      for (let i = 0; i < 9; i++) { const hx = 62 + (i % 3) * 118, hy = 78 + Math.floor(i / 3) * 105;
        if (Math.hypot(x - hx, y - hy) < 46 && s.moles.some(m => m.i === i)) { s.moles = s.moles.filter(m => m.i !== i); s.score++; beep(700, 1100, 0.06, 'square', 0.1); break; } } } },
  /* 2. 🏹 射箭靶场：10 支箭，外环 5/中环 10/靶心 20 金币 */
  arch: { name: '🏹 射箭靶场', hint: '点屏幕从底下射箭！10 支箭：外环 5 金、中环 10 金、靶心 20 金',
    init: () => ({ arrows: 10, score: 0, ts: [{ y: 85, x: 180, v: 75 }, { y: 175, x: 180, v: -100 }, { y: 265, x: 180, v: 125 }], shots: [], done: 0 }),
    tick(s, dt, c) {
      for (const t of s.ts) { t.x += t.v * dt; if (t.x < 45 || t.x > 315) t.v *= -1; }
      for (const sh of s.shots) { sh.y -= 460 * dt;
        for (const t of s.ts) { const d = Math.hypot(sh.x - t.x, sh.y - t.y);
          if (d < 36 && !sh.hit) { sh.hit = 1; const g = d < 11 ? 20 : d < 22 ? 10 : 5; s.score += g; sh.dead = 1; beep(g === 20 ? 1200 : 800, g === 20 ? 1800 : 1100, 0.09, 'square', 0.12); break; } }
      }
      s.shots = s.shots.filter(sh => !sh.dead && sh.y > -10);
      c.clearRect(0, 0, 360, 360); c.fillStyle = '#12222e'; c.fillRect(0, 30, 360, 330);
      for (const t of s.ts) { c.fillStyle = '#fff'; c.beginPath(); c.arc(t.x, t.y, 36, 0, 6.3); c.fill(); c.fillStyle = '#e84a4a'; c.beginPath(); c.arc(t.x, t.y, 22, 0, 6.3); c.fill(); c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(t.x, t.y, 11, 0, 6.3); c.fill(); }
      c.fillStyle = '#bfe8ff'; for (const sh of s.shots) { c.fillRect(sh.x - 2, sh.y - 12, 4, 20); }
      ptHud(c, '🏹 箭剩 ' + s.arrows + ' 支    💰 ' + s.score);
      if (s.arrows <= 0 && !s.shots.length && !s.done) { s.done = 1; playReward(s.score, 0); ptEnd(c, '🏹 总分 ' + s.score + '！', '+' + s.score + ' 金币已入账'); }
    },
    tap(s, x) { if (s.arrows > 0 && !s.done) { s.arrows--; s.shots.push({ x, y: 350 }); beep(500, 900, 0.06, 'square', 0.08); } } },
  /* 3. 🎣 钓鱼：3 杆，光标点进绿区：10/30/80 金+2💎 */
  fish: { name: '🎣 钓鱼', hint: '3 杆！光标摆进绿色区域就点：小鱼 10 金、大鱼 30 金、正中间黄金鱼 80 金+2💎',
    init: () => ({ casts: 3, pos: 0.2, dir: 1, zone: 0.3 + Math.random() * 0.4, res: '', resT: 0, total: 0, dia: 0, done: 0 }),
    tick(s, dt, c) {
      s.pos += s.dir * dt * 0.85; if (s.pos > 1 || s.pos < 0) { s.dir *= -1; s.pos = Math.max(0, Math.min(1, s.pos)); }
      if (s.resT > 0) s.resT -= dt;
      c.clearRect(0, 0, 360, 360); c.fillStyle = '#0e2a44'; c.fillRect(0, 30, 360, 330);
      c.font = '60px sans-serif'; c.textAlign = 'center'; c.fillText('🐟', 180, 120); c.textAlign = 'left';
      const zx = 40 + (s.zone - 0.09) * 280, zw = 0.18 * 280;
      c.fillStyle = '#3a5a3a'; c.fillRect(40, 200, 280, 26);
      c.fillStyle = '#5ac85a'; c.fillRect(zx, 200, zw, 26);
      c.fillStyle = '#ffd24a'; c.fillRect(40 + (s.zone - 0.018) * 280, 200, 0.036 * 280, 26);
      c.fillStyle = '#fff'; c.fillRect(40 + s.pos * 280 - 3, 192, 6, 42);
      ptHud(c, '🎣 还剩 ' + s.casts + ' 杆');
      if (s.resT > 0) ptTxt(c, s.res, 180, 290, 20, '#ffd24a');
      if (s.casts <= 0 && s.resT <= 0 && !s.done) { s.done = 1; playReward(s.total, s.dia); ptEnd(c, '🎣 收获 ' + s.total + ' 金币' + (s.dia ? ' + ' + s.dia + '💎' : ''), '已入账'); }
    },
    tap(s) { if (s.casts <= 0 || s.resT > 0) return;
      const off = Math.abs(s.pos - s.zone); s.casts--;
      if (off < 0.022) { s.res = '🌟 黄金鱼！+80 金 +2💎'; s.total += 80; s.dia += 2; beep(900, 1600, 0.2, 'sine', 0.16); }
      else if (off < 0.09) { s.res = '🐟 大鱼！+30 金'; s.total += 30; beep(700, 1200, 0.15, 'sine', 0.12); }
      else if (off < 0.18) { s.res = '🐠 小鱼 +10 金'; s.total += 10; beep(500, 900, 0.12, 'sine', 0.1); }
      else { s.res = '💨 鱼跑了……'; beep(300, 150, 0.15, 'sine', 0.1); }
      s.zone = 0.15 + Math.random() * 0.7; s.resT = 1.1; } },
  /* 4. 🎡 幸运转盘：50 金一次，大奖 8💎 */
  wheel: { name: '🎡 幸运转盘', hint: '50 金币转一次！停下指着啥拿啥，大奖 8💎',
    init: () => { if (player.gold < 50) return { broke: 1 }; player.gold -= 50; updateGold(); return { a: 0, v: 8 + Math.random() * 3, ws: [20, 60, 0, 100, 3, 40, 200, 8], done: 0, msg: '' }; },
    tick(s, dt, c) {
      c.clearRect(0, 0, 360, 360);
      if (s.broke) { ptEnd(c, '💰 金币不够 50！', '去打怪攒钱再来'); s.done = 1; return; }
      if (!s.done) { s.a += s.v * dt; s.v *= (1 - dt * 0.42); if (s.v < 0.12) { s.v = 0; s.done = 1;
        const idx = Math.floor(((2 * Math.PI - s.a % (2 * Math.PI)) / (2 * Math.PI)) * 8 + 0.5) % 8;   // 指针在顶上
        const w = s.ws[idx];
        if (idx === 4) { playReward(0, 3); } else if (idx === 7) { playReward(0, 8); } else if (w > 0) playReward(w, 0);
        s.msg = idx === 4 ? '🎉 3💎！' : idx === 7 ? '🎉🎉 大奖 8💎！' : w > 0 ? '🎉 +' + w + ' 金币' : '😝 谢谢惠顾';
        beep(800, 1600, 0.3, 'sine', 0.16); } }
      for (let i = 0; i < 8; i++) { const a0 = s.a + i * Math.PI / 4;
        c.fillStyle = ['#c84a4a', '#4a8ac8', '#c8a83a', '#5ac85a'][i % 4];
        c.beginPath(); c.moveTo(180, 190); c.arc(180, 190, 130, a0, a0 + Math.PI / 4); c.closePath(); c.fill();
        const lb = s.ws[i] === 3 || s.ws[i] === 8 ? '💎' + s.ws[i] : s.ws[i] === 0 ? '😝' : '💰' + s.ws[i];
        c.save(); c.translate(180, 190); c.rotate(a0 + Math.PI / 8); c.textAlign = 'center'; c.font = 'bold 15px sans-serif'; c.fillStyle = '#fff'; c.fillText(lb, 92, 5); c.restore(); }
      c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(180, 190, 16, 0, 6.3); c.fill();
      c.font = '22px sans-serif'; c.textAlign = 'center'; c.fillText('▼', 180, 42); c.textAlign = 'left';
      if (s.done) ptEnd(c, s.msg, '点一下画面再转一次（50 金）');
    },
    tap() { if (playSt && playSt.done) { closePlay(); openPlay('wheel'); } } },
  /* 5. 🧸 抓娃娃机：30 金一次，爪子摇摆，点屏幕下爪 */
  claw: { name: '🧸 抓娃娃机', hint: '30 金币一次！爪子自己左右摆，对准奖品点屏幕下爪',
    init: () => { if (player.gold < 30) return { broke: 1 }; player.gold -= 30; updateGold();
      return { cx: 180, cd: 1, st: 'sway', cy: 70, prizes: [{ x: 55, e: '🐤', g: 20 }, { x: 115, e: '🧸', g: 50 }, { x: 180, e: '🦄', g: 100 }, { x: 245, e: '💎', d: 5 }, { x: 305, e: '🥚', g: 35 }], got: null, done: 0 }; },
    tick(s, dt, c) {
      c.clearRect(0, 0, 360, 360);
      if (s.broke) { ptEnd(c, '💰 金币不够 30！', '去打怪攒钱再来'); s.done = 1; return; }
      if (s.st === 'sway') { s.cx += s.cd * 165 * dt; if (s.cx < 40 || s.cx > 320) s.cd *= -1; }
      else if (s.st === 'drop') { s.cy += 230 * dt; if (s.cy >= 285) { s.cy = 285;
        const p = s.prizes.find(p2 => Math.abs(p2.x - s.cx) < 20);
        if (p) { s.got = p; s.prizes = s.prizes.filter(p2 => p2 !== p); beep(800, 1400, 0.2, 'sine', 0.14); } else beep(300, 150, 0.12, 'sine', 0.1);
        s.st = 'rise'; } }
      else if (s.st === 'rise') { s.cy -= 230 * dt; if (s.cy <= 70) { s.cy = 70; s.done = 1;
        if (s.got) { playReward(s.got.g || 0, s.got.d || 0); } } }
      c.fillStyle = '#2a1a3a'; c.fillRect(0, 30, 360, 330);
      for (const p of s.prizes) { c.font = '34px sans-serif'; c.textAlign = 'center'; c.fillText(p.e, p.x, 310); c.textAlign = 'left'; }
      c.strokeStyle = '#c8ccd4'; c.lineWidth = 3; c.beginPath(); c.moveTo(s.cx, 30); c.lineTo(s.cx, s.cy); c.stroke();
      c.font = '26px sans-serif'; c.textAlign = 'center'; c.fillText('🦾', s.cx, s.cy + 12); c.textAlign = 'left';
      if (s.got && s.st === 'rise') { c.font = '30px sans-serif'; c.textAlign = 'center'; c.fillText(s.got.e, s.cx, s.cy + 44); c.textAlign = 'left'; }
      if (s.done) ptEnd(c, s.got ? '🎉 夹到 ' + s.got.e + '！' + (s.got.d ? '+' + s.got.d + '💎' : '+' + s.got.g + ' 金币') : '😝 空爪……', '点一下画面再玩一次（30 金）');
    },
    tap(s) { if (s.broke) return; if (s.st === 'sway') s.st = 'drop'; else if (s.done) { closePlay(); openPlay('claw'); } } },
  /* 6. 🎁 猜宝箱：押 50，盯💎进哪个箱子，猜中拿回 100 */
  cups: { name: '🎁 猜宝箱', hint: '押 50 金币！盯紧💎进了哪个箱子，换完位置点它——猜中拿回 100！',
    init: () => { if (player.gold < 50) return { broke: 1 }; player.gold -= 50; updateGold();
      return { gem: Math.floor(Math.random() * 3), xs: [70, 180, 290], pos: [70, 180, 290], phase: 'show', pt: 1.4, swaps: 6, from: null, st: 0, done: 0, pick: -1, win: false }; },
    tick(s, dt, c) {
      c.clearRect(0, 0, 360, 360);
      if (s.broke) { ptEnd(c, '💰 金币不够 50！', '去打怪攒钱再来'); s.done = 1; return; }
      c.fillStyle = '#2e2416'; c.fillRect(0, 30, 360, 330);
      s.pt -= dt;
      if (s.phase === 'show' && s.pt <= 0) { s.phase = 'mix'; s.st = 0; s.from = null; }
      else if (s.phase === 'mix' && s.pt <= 0) {
        if (s.swaps > 0) { s.swaps--; let i = Math.floor(Math.random() * 3), j = Math.floor(Math.random() * 3); while (j === i) j = Math.floor(Math.random() * 3);
          s.from = [i, j]; const t = s.xs[i]; s.xs[i] = s.xs[j]; s.xs[j] = t; s.pt = 0.5; s.st = 0; beep(400, 600, 0.05, 'square', 0.06); }
        else s.phase = 'pick'; }
      if (s.from) { s.st = Math.min(1, s.st + dt / 0.5); for (let i = 0; i < 3; i++) s.pos[i] += (s.xs[i] - s.pos[i]) * Math.min(1, dt * 12); }
      for (let i = 0; i < 3; i++) { const cy = 190 + (s.phase === 'show' && i === s.gem ? -14 : 0);
        if (s.phase === 'show' && i === s.gem) { c.font = '26px sans-serif'; c.textAlign = 'center'; c.fillText('💎', s.pos[i], cy - 46); c.textAlign = 'left'; }
        c.font = '52px sans-serif'; c.textAlign = 'center'; c.fillText(s.pick === i ? (s.win ? '🎉' : '💨') : '📦', s.pos[i], cy); c.textAlign = 'left'; }
      ptHud(c, s.phase === 'show' ? '👀 看清💎在哪！' : s.phase === 'mix' ? '🌀 换位中……' : '👉 点一个箱子！');
      if (s.done) ptEnd(c, s.win ? '🎉 猜中啦！+100 金币' : '😝 猜错了，50 金没了', '点「不玩了」退出');
    },
    tap(s, x, y) { if (s.broke || s.phase !== 'pick' || s.done) return;
      let bi = -1; for (let i = 0; i < 3; i++) if (Math.hypot(x - s.pos[i], y - 190) < 46) bi = i;
      if (bi < 0) return;
      s.pick = bi; s.win = s.xs[bi] === [70, 180, 290][s.gem];
      s.done = 1; if (s.win) playReward(100, 0);
      beep(s.win ? 900 : 300, s.win ? 1600 : 150, 0.25, 'sine', 0.15); } },
  /* 7. 🏀 投篮机：30 秒拖甩投篮，1 分=3 金币 */
  hoops: { name: '🏀 投篮机', hint: '按住篮球往后拉再松手！30 秒，进 1 球 = 3 金币',
    init: () => ({ t: 30, score: 0, ball: { x: 80, y: 300, vx: 0, vy: 0, fly: 0, scored: 0 }, drag: null, hoopY: 130, hd: 1, done: 0 }),
    tick(s, dt, c) {
      s.t -= dt; s.hoopY += s.hd * 75 * dt; if (s.hoopY < 70 || s.hoopY > 230) s.hd *= -1;
      const b = s.ball;
      if (b.fly) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 640 * dt;
        if (b.vy > 0 && b.x > 266 && b.x < 314 && Math.abs(b.y - s.hoopY) < 10 && !b.scored) { b.scored = 1; s.score++; beep(900, 1400, 0.12, 'square', 0.12); }
        if (b.y > 370 || b.x > 380 || b.x < -20) { b.x = 80; b.y = 300; b.vx = b.vy = 0; b.fly = 0; b.scored = 0; } }
      c.clearRect(0, 0, 360, 360); c.fillStyle = '#1a2a1a'; c.fillRect(0, 30, 360, 330);
      c.fillStyle = '#c88a4a'; c.fillRect(296, s.hoopY - 30, 8, 60);
      c.strokeStyle = '#e84a4a'; c.lineWidth = 5; c.beginPath(); c.moveTo(266, s.hoopY); c.lineTo(314, s.hoopY); c.stroke();
      c.font = '30px sans-serif'; c.textAlign = 'center'; c.fillText('🏀', b.x, b.y); c.textAlign = 'left';
      if (s.drag) { c.strokeStyle = '#ffd24a88'; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(s.drag.x, s.drag.y); c.stroke(); }
      ptHud(c, '⏱️ ' + Math.ceil(Math.max(0, s.t)) + ' 秒    🏀 ' + s.score + ' 球');
      if (s.t <= 0 && !s.done) { s.done = 1; playReward(s.score * 3, 0); ptEnd(c, '🏀 进 ' + s.score + ' 球！', '+' + s.score * 3 + ' 金币已入账'); }
    },
    down(s, x, y) { const b = s.ball; if (s.t > 0 && !b.fly && Math.hypot(x - b.x, y - b.y) < 40) s.drag = { x, y }; },
    move(s, x, y) { if (s.drag) s.drag = { x, y }; },
    up(s, x, y) { if (!s.drag) return; const b = s.ball; b.vx = (b.x - x) * 3.4; b.vy = (b.y - y) * 3.4; b.fly = 1; s.drag = null; beep(500, 800, 0.06, 'sine', 0.08); } },
};
function openPlay(id) {
  const g = MINIS[id]; if (!g) return;
  playId = id; paused = true;
  document.getElementById('playTitle').textContent = g.name;
  document.getElementById('playHint').textContent = g.hint;
  playSt = g.init() || {};
  playEl.style.display = 'flex'; beep(600, 900, 0.1, 'sine', 0.1);
  playLast = performance.now(); cancelAnimationFrame(playRAF);
  const loop = (t) => { if (!playId) return; const dt = Math.min(0.05, (t - playLast) / 1000); playLast = t; try { g.tick(playSt, dt, playCv.getContext('2d')); } catch (e) {} playRAF = requestAnimationFrame(loop); };
  playRAF = requestAnimationFrame(loop);
}
function closePlay() { playId = null; playSt = null; cancelAnimationFrame(playRAF); playEl.style.display = 'none'; if (!gameOver) paused = false; }
document.getElementById('playClose').onclick = closePlay;
function playXY(e) { const r2 = playCv.getBoundingClientRect(); return [(e.clientX - r2.left) * 360 / r2.width, (e.clientY - r2.top) * 360 / r2.height]; }
playCv.addEventListener('pointerdown', e => { if (!playId) return; e.preventDefault(); const [x, y] = playXY(e); const g = MINIS[playId]; if (g.down) g.down(playSt, x, y); else if (g.tap) g.tap(playSt, x, y); });
playCv.addEventListener('pointermove', e => { if (!playId) return; const [x, y] = playXY(e); const g = MINIS[playId]; if (g.move) g.move(playSt, x, y); });
playCv.addEventListener('pointerup', e => { if (!playId) return; const [x, y] = playXY(e); const g = MINIS[playId]; if (g.up) g.up(playSt, x, y); });
/* 8. 🏃 环镇跑酷：8 面旗子接力，75 秒跑完 +5💎 */
let runOn = false, runCp = 0, runT = 0;
const RUN_CPS = [[1200, 1620], [1760, 1840], [1200, 2130], [640, 1840], [250, 1200], [1200, 300], [2150, 1200], [1200, 1840]];
function startRun() { runOn = true; runCp = 0; runT = 75; setBanner('🏃 跑酷开始！跟着发光旗子跑，75 秒内跑完 8 站 +5💎！'); beep(600, 900, 0.2, 'square', 0.14); }
function runTick(dt) {
  if (!runOn) return;
  runT -= dt;
  if (runT <= 0) { runOn = false; setBanner('⏱️ 超时啦！跑了 ' + runCp + ' 站，安慰奖 ' + runCp * 25 + ' 金币'); playReward(runCp * 25, 0); return; }
  const cp = RUN_CPS[runCp];
  if (Math.hypot(player.x - cp[0], player.y - cp[1]) < 36) {
    runCp++; playReward(25, 0); beep(900, 1400, 0.1, 'square', 0.12);
    if (runCp >= RUN_CPS.length) { runOn = false; setBanner('🏁 跑完全程！大奖 +5💎！'); playReward(0, 5); beep(900, 1800, 0.4, 'sine', 0.18); }
    else setBanner('🚩 第 ' + runCp + ' 站！还剩 ' + (RUN_CPS.length - runCp) + ' 站');
  }
}
/* 9. ⚔️ 擂台赛：三波训练假人，全胜 100 金 + 5💎（输了有安慰奖，不死） */
let arenaOn = false, arenaWave = 0, arenaT = 0;
function startArena() { arenaOn = true; arenaWave = 0; arenaT = 1.2; player.x = 1200; player.y = 1840; setBanner('⚔️ 擂台赛！三波假人：打赢一波比一波硬，全胜 100 金+5💎'); beep(500, 800, 0.25, 'square', 0.15); }
function arenaTick(dt) {
  if (!arenaOn) return;
  if (gameOver) {   // 🤕 擂台不玩命：倒下=被抬下擂台
    gameOver = false; document.getElementById('over').style.display = 'none';
    player.hearts = 3; arenaOn = false; zombies = zombies.filter(z => !z.dummy);
    setBanner('🤕 被假人打下擂台啦！安慰奖 20 金币，回家练练再来'); playReward(20, 0); saveGame(); return;
  }
  arenaT -= dt;
  if (arenaT <= 0 && !zombies.some(z => z.dummy && !z.dead)) {
    arenaWave++;
    if (arenaWave > 3) { arenaOn = false; setBanner('🏆 擂台全胜！100 金币 + 5💎 到手！'); playReward(100, 5); beep(900, 1800, 0.5, 'sine', 0.2); return; }
    const n = 2 + arenaWave, hp = 2 + arenaWave * 2;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2;
      zombies.push({ id: _id++, x: 1200 + Math.cos(a) * 180, y: 1840 + Math.sin(a) * 180, hp, r: 11, dummy: true, dead: false, flash: 0, walkT: Math.random() * 9, kind: null }); }
    setBanner('⚔️ 第 ' + arenaWave + ' 波：' + n + ' 个假人（' + hp + ' 血）'); beep(600, 1000, 0.2, 'square', 0.14);
    arenaT = 0.5;
  }
}
/* 10. 🌳 迷宫寻宝（镇西北树篱迷宫）：中心宝箱 100 金 + 5💎，每趟小镇补一次 */
const MAZE_WALLS = [
  { x: 150, y: 150, w: 600, h: 24 }, { x: 150, y: 150, w: 24, h: 600 }, { x: 726, y: 150, w: 24, h: 600 },
  { x: 150, y: 726, w: 250, h: 24 }, { x: 480, y: 726, w: 270, h: 24 },   // 外墙，入口在底边中间
  { x: 300, y: 300, w: 120, h: 24 }, { x: 480, y: 300, w: 120, h: 24 },   // 内墙顶，缺口在中间
  { x: 300, y: 300, w: 24, h: 300 }, { x: 576, y: 300, w: 24, h: 300 }, { x: 300, y: 576, w: 300, h: 24 },
];
let mazeChest = false;
function mazeTick() {
  if (!townMode || inRoom) return;
  for (const w of MAZE_WALLS) {   // 🌳 树篱挡路：最小穿透推出
    const nx = Math.max(w.x, Math.min(w.x + w.w, player.x)), ny = Math.max(w.y, Math.min(w.y + w.h, player.y));
    if (Math.hypot(player.x - nx, player.y - ny) < 12) {
      const pushL = Math.abs(player.x - (w.x - 12)), pushR = Math.abs(player.x - (w.x + w.w + 12)), pushU = Math.abs(player.y - (w.y - 12)), pushD = Math.abs(player.y - (w.y + w.h + 12));
      const m = Math.min(pushL, pushR, pushU, pushD);
      if (m === pushL) player.x = w.x - 12; else if (m === pushR) player.x = w.x + w.w + 12; else if (m === pushU) player.y = w.y - 12; else player.y = w.y + w.h + 12;
    }
  }
  if (mazeChest && Math.hypot(player.x - 450, player.y - 480) < 40) {
    mazeChest = false; playReward(100, 5);
    setBanner('🎁 迷宫宝箱！100 金币 + 5💎！下次来小镇还会补货');
    for (let i = 0; i < 16; i++) burst(450 + (Math.random() - 0.5) * 80, 480 + (Math.random() - 0.5) * 80, ['#ffd24a', '#7ae8f2'][i % 2]);
    beep(700, 1400, 0.4, 'sine', 0.18); saveGame();
  }
}
function startPlay(i) {
  const a = ATTRACT[i]; if (!a) return;
  if (a.id === 'run') { startRun(); return; }
  if (a.id === 'arena') { startArena(); return; }
  if (a.id === 'maze') { setBanner('🌳 迷宫在小镇西北角！从南边缺口进去，中心有宝箱（100 金+5💎）'); return; }
  openPlay(a.id);
}
