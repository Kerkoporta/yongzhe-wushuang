'use strict';
/* ================= 🎮 手柄模式：摇杆=走路，A=攻击/确认，B=设置；面板开着时摇杆变金属鼠标 ================= */
let padOn = false, padPrev = {}, padIntroT = 0;
function showPadIntro() {   // 🎮 连接/重连介绍卡：全场暂停 5 秒看键位
  padIntroT = 5;
  document.getElementById('padHelp').style.display = 'flex';
  paused = true;
  setBanner('🎮 手柄连上啦！');
  beep(520, 880, 0.18, 'sine', 0.14);
}
const vMouse = { x: 200, y: 200, show: false };
const METAL_CURSOR = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#c9cdd6"/><stop offset="0.55" stop-color="#878c98"/><stop offset="0.75" stop-color="#b8beca"/><stop offset="1" stop-color="#eef1f6"/></linearGradient></defs>
<path d="M5 2 L25 14 L16 15.4 L20.5 25 L17 26.6 L12.6 16.8 L6 22 Z" fill="url(#m)" stroke="#3c4048" stroke-width="1.3"/>
<path d="M7.4 5.6 L20.5 13.2 L13.8 14.2 Z" fill="#ffffff" opacity="0.6"/>
</svg>`);   // 🖱️ 金属质感光标：银灰渐变+高光面+深色描边
const padCursorEl = document.createElement('div');
padCursorEl.style.cssText = 'position:fixed;z-index:999;pointer-events:none;width:30px;height:30px;display:none;background:url(' + METAL_CURSOR + ') no-repeat center/contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))';
document.body.appendChild(padCursorEl);
function anyPanelOpen() {   // 有 DOM 面板开着=鼠标模式
  for (const id of ['home', 'bag', 'gear', 'shop', 'skin', 'sandbox', 'over', 'store', 'faint', 'pvpLob', 'chest', 'help', 'fishShop']) {
    const el = document.getElementById(id); if (el && el.style.display === 'flex') return true;
  }
  return false;
}
function padTick(dt) {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null; for (const g of gps) if (g && g.connected) { gp = g; break; }
  if (!gp) { if (padOn) { padOn = false; padCursorEl.style.display = 'none'; setBanner('🎮 手柄断开了，重插会再教你一次键位'); } return; }
  if (!padOn) { padOn = true; showPadIntro(); }   // 首次连接 or 断后重连：都播 5 秒键位卡
  if (padIntroT > 0) {   // ⏳ 介绍卡倒计时：到点自动开打（别的面板开着就不抢暂停）
    padIntroT -= dt;
    if (padIntroT <= 0) { document.getElementById('padHelp').style.display = 'none'; if (!anyPanelOpen()) paused = false; }
    return;
  }
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, dead = 0.18;
  const mx = Math.abs(ax) > dead ? ax : 0, my = Math.abs(ay) > dead ? ay : 0;
  const pressed = i => { const now = gp.buttons[i] && gp.buttons[i].pressed; const was = padPrev[i]; padPrev[i] = now; return now && !was; };
  const aHit = pressed(0), bHit = pressed(1), xHit = pressed(2), yHit = pressed(3);   // 🎮 标准键位：A下 B右 X左 Y上（⚠️ pressed 有副作用，一键只算一次）
  if (anyPanelOpen()) {   // 🖱️ 鼠标模式：摇杆移光标，A=点，B=关面板
    vMouse.show = true;
    vMouse.x = Math.max(0, Math.min(innerWidth, vMouse.x + mx * 520 * dt));
    vMouse.y = Math.max(0, Math.min(innerHeight, vMouse.y + my * 520 * dt));
    padCursorEl.style.display = 'block';
    padCursorEl.style.left = (vMouse.x - 5) + 'px'; padCursorEl.style.top = (vMouse.y - 2) + 'px';
    if (aHit) { const el = document.elementFromPoint(vMouse.x, vMouse.y); if (el) { el.click(); beep(700, 1000, 0.05, 'sine', 0.08); } }
    if (bHit) {   // B=关当前面板（设置/背包/商店通吃）
      const gear = document.getElementById('gear'), bag = document.getElementById('bag');
      if (bag && bag.style.display === 'flex') { bagPickMode = null; toggleBag(false); }
      else if (gear && gear.style.display === 'flex') toggleGear(false);
    }
    holdAtk = false;
  } else {   // 🚶 走路模式
    if (vMouse.show) { vMouse.show = false; padCursorEl.style.display = 'none'; }
    joyVec.x = mx; joyVec.y = my;   // 摇杆直接喂给移动
    if (xHit) { doAttack(false); }   // ❌ X=攻击：点一下打一下
    if (yHit) {   // 🅨 Y=自动攻击开关（和屏幕 AUTO 钮同一个开关）
      autoOn = !autoOn; autoBtn.classList.toggle('on', autoOn); if (autoOn) autoT = 0;
      setBanner(autoOn ? '⚔️ 自动攻击：开！' : '⚔️ 自动攻击：关'); beep(autoOn ? 700 : 400, autoOn ? 1100 : 300, 0.1, 'sine', 0.1);
    }
    if (bHit) toggleGear();   // 🅑 B=设置面板
    if (xHit && gp.vibrationActuator && gp.vibrationActuator.playEffect) { try { gp.vibrationActuator.playEffect('dual-rumble', { duration: 60, strongMagnitude: 0.4, weakMagnitude: 0.2 }); } catch (e) {} }   // 攻击小震动
  }
}
