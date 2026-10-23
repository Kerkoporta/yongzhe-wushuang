'use strict';
/* ================= 🎵 音乐（原创燃系芯片战歌，WebAudio 现场合成，零版权；每关一首） ================= */
/* 音符=MIDI 数（0=休止），每步 110ms 快节奏，16 步循环。lead=主旋律 bass=低音炮 */
const SONGS = {
  1: { lead: [69, 72, 76, 81, 79, 76, 74, 76, 69, 72, 76, 81, 84, 81, 79, 76],   // 🌱 草原战歌：冲锋
       bass: [45, 45, 45, 45, 48, 48, 50, 50, 45, 45, 45, 45, 43, 43, 50, 50] },
  2: { lead: [76, 79, 83, 79, 81, 79, 76, 74, 76, 79, 83, 86, 84, 83, 79, 76],     // ❄️ 雪原战歌：冰锋
       bass: [40, 40, 40, 40, 43, 43, 45, 45, 40, 40, 40, 40, 38, 38, 43, 43] },
  3: { lead: [74, 74, 77, 74, 73, 74, 77, 80, 74, 74, 77, 74, 82, 80, 77, 74],     // 👻 地狱战歌：暗黑重拍
       bass: [38, 38, 38, 38, 41, 41, 38, 38, 38, 38, 38, 38, 36, 36, 43, 43] },
  4: { lead: [64, 65, 67, 71, 70, 67, 65, 64, 64, 65, 67, 71, 76, 74, 71, 70],     // 🌋 火山战歌：最燃
       bass: [40, 40, 40, 40, 40, 40, 41, 41, 40, 40, 40, 40, 43, 43, 41, 41] },
  5: { lead: [76, 79, 81, 84, 83, 81, 79, 76, 76, 79, 81, 84, 88, 84, 83, 81],       // ⛈️ 雷域战歌：万雷奔腾
       bass: [45, 45, 45, 45, 48, 48, 50, 50, 45, 45, 45, 45, 43, 43, 50, 50] },
  6: { lead: [69, 70, 72, 76, 75, 72, 70, 69, 69, 70, 72, 76, 81, 79, 76, 75],       // 🕳️ 虚空战歌：湮灭进行曲
       bass: [33, 33, 33, 33, 36, 36, 38, 38, 33, 33, 33, 33, 31, 31, 38, 38] },
  7: { lead: [81, 84, 88, 84, 86, 84, 81, 78, 81, 84, 88, 91, 89, 88, 84, 81],       // 💎 洞窟战歌：晶光闪烁
       bass: [45, 45, 45, 45, 41, 41, 43, 43, 45, 45, 45, 45, 48, 48, 43, 43] },
  8: { lead: [74, 77, 81, 77, 79, 77, 74, 71, 74, 77, 81, 84, 82, 81, 77, 74],       // 🌀 无尽战歌：轮回之音
       bass: [38, 38, 38, 38, 41, 41, 43, 43, 38, 38, 38, 38, 46, 46, 43, 43] },
};
let musicOn = true, musicTimer = null, musicStep = 0, musicGain = null;
function musicFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function musicNote(freq, t0, dur, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + dur + 0.02);
}
function musicDrum(f0, f1, t0, dur, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + dur + 0.01);
}
function musicTick() {
  if (!musicOn || !AC || AC.state !== 'running') return;
  const song = SONGS[level] || SONGS[1], step = musicStep % 16, t0 = AC.currentTime + 0.03;
  const L = song.lead[step], B = song.bass[step];
  if (L) musicNote(musicFreq(L), t0, 0.1, 'square', 0.055);
  if (L && step % 2 === 0) musicNote(musicFreq(L - 12), t0, 0.1, 'square', 0.03);   // 低八度加厚
  if (B) musicNote(musicFreq(B), t0, 0.1, 'sawtooth', 0.06);                        // 低音炮锯齿
  if (step % 4 === 0) musicDrum(150, 55, t0, 0.1, 'sine', 0.14);                    // 🥁 底鼓 咚
  if (step === 4 || step === 12) musicDrum(1400, 300, t0, 0.06, 'square', 0.05);    // 🥁 军鼓 啪
  if (step % 2 === 1) musicDrum(7000, 5000, t0, 0.02, 'square', 0.012);             // 🥁 踩镲 呲
  musicStep++;
}
function startMusic() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    if (!musicGain) { musicGain = AC.createGain(); musicGain.gain.value = 0.8; musicGain.connect(AC.destination); }
    if (!musicTimer) musicTimer = setInterval(musicTick, 110);
  } catch (e) {}
}
function toggleMusic() {
  musicOn = !musicOn;
  document.getElementById('gearMusic').textContent = musicOn ? '🎵 音乐：开' : '🔇 音乐：关';
  if (musicOn) startMusic();
  saveGame();
}
document.getElementById('gearMusic').onclick = () => { toggleMusic(); };
