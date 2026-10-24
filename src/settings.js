'use strict';
/* ================= 🔧 游戏设置（平衡无损：只调手感/视听，不碰数值） ================= */
const SETTINGS_KEY = 'yzw_settings_v1';
const SETTING_DEFAULT = { shake: true, lefty: false, perf: false, musicVol: 80, sfxVol: 90, sens: 100 };
let settings = Object.assign({}, SETTING_DEFAULT);
function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); if (s) settings = Object.assign({}, SETTING_DEFAULT, s); } catch (e) {}
  applySettings();
}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {} }
function applySettings() {   // 设置变了立刻生效
  document.body.classList.toggle('lefty', !!settings.lefty);   // 🙃 左撇子：摇杆右置攻击左置
  if (typeof musicGain !== 'undefined' && musicGain) musicGain.gain.value = 0.8 * (settings.musicVol / 100);   // 🎵 音乐音量
}
function setToggle(key, on) { settings[key] = !!on; saveSettings(); applySettings(); beep(on ? 700 : 400, on ? 1000 : 300, 0.06, 'sine', 0.08); renderSettings(); }
function setSlider(key, v) { settings[key] = +v; saveSettings(); applySettings(); }
function renderSettings() {   // 设置区块渲染（gear 面板里）
  const box = document.getElementById('cfgBox'); if (!box) return;
  const sw = (key, label, desc) => `<div class="cfgRow"><div class="cfgTxt"><b>${label}</b><span>${desc}</span></div><button class="sw ${settings[key] ? 'on' : ''}" data-cfg="${key}" role="switch" aria-checked="${settings[key]}"><i></i></button></div>`;
  const sl = (key, label, min, max, unit) => `<div class="cfgRow"><div class="cfgTxt"><b>${label}</b><span id="cfgV_${key}">${settings[key]}${unit}</span></div><input type="range" class="cfgSl" data-cfgS="${key}" min="${min}" max="${max}" value="${settings[key]}"></div>`;
  box.innerHTML = '<div class="hsec" style="margin-top:2px">🔧 游戏设置（不影响数值平衡）</div>'
    + sw('shake', '💥 震屏', '打中/被砸时屏幕一抖')
    + sw('lefty', '🙃 左撇子模式', '摇杆挪右边，攻击钮挪左边')
    + sw('perf', '⚡ 性能模式', '粒子特效减半，老设备更流畅')
    + sl('musicVol', '🎵 音乐音量', 0, 100, '%')
    + sl('sfxVol', '🔔 音效音量', 0, 100, '%')
    + sl('sens', '🕹️ 摇杆灵敏度', 50, 150, '%');
  for (const b of box.querySelectorAll('button.sw')) b.onclick = () => setToggle(b.dataset.cfg, !settings[b.dataset.cfg]);
  for (const s of box.querySelectorAll('input.cfgSl')) s.oninput = () => { setSlider(s.dataset.cfgs, s.value); const lbl = document.getElementById('cfgV_' + s.dataset.cfgs); if (lbl) lbl.textContent = s.value + '%'; };
}
