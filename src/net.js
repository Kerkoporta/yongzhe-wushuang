'use strict';
/* ================= 🌐 联机大厅 PVP（恩泽设计：存档直通，0.1 秒一存——同一台设备开两个窗口就能对战，不用网络！） ================= */
const PVP_ROOMS_KEY = 'zf_pvp_rooms_v1';
let pvpMode = null, pvpSide = 0, pvpFoe = null, pvpT = 0, pvpHitSeq = 0, pvpHits = [], pvpSeen = 0, pvpPreHearts = 0;
let dungeonMode = false, dgnKills = 0, dgnKingSpawned = false, dgnExit = null;   // 🌲 副本状态
/* ☁️ 天空城（联机大厅进来）：南边钓鱼区、北边鱼商人、中间 PVP 区——只有进 PVP 区才开打 */
let skyMode = false, fishState = null, fishT = 0, bobber = null, foeKo = false;
const SKY_POND = { x: 1200, y: 1520, rx: 230, ry: 100 };   // 🎣 钓鱼池（南）
const SKY_SHOP = { x: 1200, y: 700 };   // 🐟 鱼商人（北）
const SKY_ARENA = { x: 1200, y: 1100, r: 210 };   // ⚔️ PVP 区（中）
function inArena(x, y) { return Math.hypot(x - SKY_ARENA.x, y - SKY_ARENA.y) < SKY_ARENA.r; }   // 在不在 PVP 圈里
function nearPond() { const dx = (player.x - SKY_POND.x) / (SKY_POND.rx + 60), dy = (player.y - SKY_POND.y) / (SKY_POND.ry + 60); return dx * dx + dy * dy < 1.35; }   // 站池边才能钓
let minions = [], turrets = [];   // ☠️ 骷髅小弟 + 🧲 工程师炮塔
let clericT = 2, chronoT = 20, freezeAllT = 0, turretT = 6;   // 🌟 职业被动计时器（牧师/时空/工程师）
function pvpRooms() { try { return JSON.parse(localStorage.getItem(PVP_ROOMS_KEY)) || []; } catch (e) { return []; } }
function pvpSaveRooms(rs) { try { localStorage.setItem(PVP_ROOMS_KEY, JSON.stringify(rs)); } catch (e) {} }
function pvpRoomKey(id) { return 'zf_pvp_room_' + id; }
function pvpReadRoom(id) { try { return JSON.parse(localStorage.getItem(pvpRoomKey(id)) || 'null'); } catch (e) { return null; } }
function pvpWriteRoom(id, st) { try { localStorage.setItem(pvpRoomKey(id), JSON.stringify(st)); } catch (e) {} }
function openLobby() { renderLobby(); document.getElementById('pvpLob').style.display = 'flex'; }
function renderLobby() {
  const rs = pvpRooms().filter(r => Date.now() - r.created < 3600e3);   // 一小时的房间才作数
  let h = '<div class="htxt" style="margin-bottom:6px">📡 本地联机：<b>同一台设备再开一个游戏窗口</b>，一个创建房间、一个踢馆，就能双人 PVP！（存档直通，不用网络）</div>';
  if (pvpMode) h += `<div class="slot"><div class="inf">⚔️ 我在擂台 #${pvpMode}（${pvpSide === 1 ? '房主' : '挑战者'}）</div><button data-pvp="leave">🚪 离开</button></div>`;
  for (const r of rs) {
    const st = pvpReadRoom(r.id);
    const full = st && st.p2, closed = st && st.winner;
    h += `<div class="slot"><div class="inf">⚔️ 擂台 #${r.id}${closed ? '（已分出胜负）' : full ? '（对战进行中）' : '（虚位以待）'}</div>${!full && !closed && !pvpMode ? `<button data-pvp="join:${r.id}">⚔️ 踢馆</button>` : ''}</div>`;
  }
  if (!rs.length) h += '<div class="htxt">还没有房间，点下面创建一个！</div>';
  if (!pvpMode) h += '<button data-pvp="create" style="margin-top:8px;width:100%;padding:11px;border:0;border-radius:12px;background:#7ec850;color:#14300e;font-weight:bold;cursor:pointer">➕ 创建 PVP 房间</button>';
  document.getElementById('pvpList').innerHTML = h;
  for (const b of document.querySelectorAll('#pvpList [data-pvp]')) b.onclick = () => {
    const a = b.dataset.pvp;
    if (a === 'create') createPvpRoom();
    else if (a === 'leave') { leavePvp(); openLobby(); return; }
    else if (a.startsWith('join:')) joinPvpRoom(+a.slice(5));
    renderLobby();
  };
}
function createPvpRoom() { const id = Date.now() % 100000; const rs = pvpRooms(); rs.push({ id, created: Date.now() }); pvpSaveRooms(rs); pvpWriteRoom(id, { p1: true, p2: false, winner: 0 }); enterPvp(id, 1); }
function joinPvpRoom(id) { const st = pvpReadRoom(id); if (!st || st.p2) { setBanner('😅 这个房间满了'); return; } st.p2 = true; pvpWriteRoom(id, st); enterPvp(id, 2); }
function enterPvp(id, side) {
  pvpPreHearts = player.hearts; pvpMode = id; pvpSide = side; pvpSeen = 0; pvpHits = []; pvpHitSeq = 0; foeKo = false;
  townMode = false; inRoom = false; towerMode = false; sittingBench = null; dungeonMode = false; dgnExit = null;
  skyMode = true; fishState = null; bobber = null;   // ☁️ 联机=天空城：钓鱼+卖鱼+PVP 区
  zombies = []; earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; chest = null;
  player.x = side === 1 ? 1060 : 1340; player.y = 1800; player.hearts = player.maxHearts;
  closeHome(); document.getElementById('pvpLob').style.display = 'none'; paused = false; homeOpen = false;
  setBanner('☁️ 天空城到啦！南边 🎣钓鱼区 抛杆钓四种鱼，北边 🐟鱼商人 卖鱼换钱，中间 ⚔️PVP 区——只有进圈才开打！');
  updateScore(); beep(600, 1200, 0.3, 'square', 0.18);
}
function leavePvp() {
  if (!pvpMode) return;
  const st = pvpReadRoom(pvpMode); if (st && !st.winner) { st.winner = -1; pvpWriteRoom(pvpMode, st); }   // 逃跑算弃权
  if (netReady) netSend({ type: 'leave' });   // 🌍 联网：跟对面说一声我走了
  pvpMode = null; pvpFoe = null; skyMode = false; fishState = null; bobber = null; player.hearts = pvpPreHearts; zombies = [];
  document.getElementById('fishBtn').style.display = 'none';
  setBanner('🚪 离开了天空城'); updateScore(); saveGame();
}

function pvpWrite() {   // 📡 0.1 秒一存：我的状态直接写进"游戏代码"（对面窗口读它看到我）
  if (!pvpMode) return;
  try { localStorage.setItem(pvpRoomKey(pvpMode) + '_p' + pvpSide, JSON.stringify({ x: Math.round(player.x), y: Math.round(player.y), hearts: player.hearts, maxHearts: player.maxHearts, weapon: player.weapon, dir: player.dir, moving: player.moving, walkT: player.walkT, swing: player.atkT > 0, holdFish: player.holdFish || null, skin: player.skin, hits: pvpHits.slice(-5), when: Date.now() })); } catch (e) {}
}
function pvpRead() {   // 📡 读对面的存档 → 幻影对手出现在我的战场
  if (!pvpMode) { pvpFoe = null; return; }
  let f = null;
  try { f = JSON.parse(localStorage.getItem(pvpRoomKey(pvpMode) + '_p' + (pvpSide === 1 ? 2 : 1)) || 'null'); } catch (e) {}
  if (!f) { pvpFoe = null; return; }
  f.stale = Date.now() - f.when > 3000;   // 3 秒没更新=对面掉线/没开打
  pvpFoe = f;
  for (const hit of (f.hits || [])) {   // 对面挥中我的记录：扣我的血（☁️天空城：只有两人都在 PVP 圈里才算）
    if (hit.s > pvpSeen) { pvpSeen = hit.s;
      const okZone = !skyMode || (inArena(player.x, player.y) && inArena(f.x, f.y));
      if (okZone && player.inv <= 0) { player.hearts -= hit.d; player.inv = 0.5; player.sinceHurt = 0; player.regenT = 0; burst(player.x, player.y, '#ff5a5a', 10); beep(300, 120, 0.15, 'sawtooth', 0.15); } }
  }
  if (f.hearts <= 0 && !foeKo) { foeKo = true; playReward(200, 10); setBanner('🏆 擂台胜利！+200 金 +10💎——对手回城门口复活了，还能再战'); beep(700, 1400, 0.3, 'square', 0.16); }   // ⚔️ 对面倒了=这局我赢
  if (f.hearts > 0) foeKo = false;   // 对面复活了，下一局重新算
  const st = pvpReadRoom(pvpMode);
  if (st && st.winner === -1) { st.winner = 0; pvpWriteRoom(pvpMode, st); setBanner('😴 对面离开了天空城，城里就剩你啦'); }   // 对面走了：消费掉信号继续逛
}
/* 🌍 联网 PVP：公共 MQTT 中转站（实测通了，~300ms）——两台设备真联机 */
let netClient = null, netTopic = null, netReady = false, netWon = false;
function mqttLoad() {
  return new Promise((res, rej) => {
    if (window.mqtt) return res();
    const srcs = ['mqtt.min.js', 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js', 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js'];   // 🌍 先读游戏自带的联机模块（和游戏同一个服务器，肯定不卡），不行再换外地 CDN
    let i = 0;
    const tryNext = () => {
      if (window.mqtt) return res();
      if (i >= srcs.length) return rej(new Error('联机模块加载失败'));
      const s = document.createElement('script'); s.src = srcs[i++];
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; try { s.remove(); } catch (e) {} tryNext(); } }, 8000);   // 8 秒没动静就换下一个源
      s.onload = () => { if (!done) { done = true; clearTimeout(t); res(); } };
      s.onerror = () => { if (!done) { done = true; clearTimeout(t); tryNext(); } };
      document.head.appendChild(s);
    };
    tryNext();
  });
}
let netSeen = false;   // 👀 联网版：看到对手的第一条消息没
async function netStart(code, side) {
  try {
    setBanner('🌍 第一步：加载联机模块……（第一次约几秒，别慌）');
    await mqttLoad();
    setBanner('🌍 第二步：连接中转站……');
    if (!netClient) {
      netClient = window.mqtt.connect('wss://broker.emqx.io:8084/mqtt', { connectTimeout: 9000, reconnectPeriod: 2000 });
      await new Promise((res, rej) => { netClient.on('connect', res); netClient.on('error', rej); setTimeout(() => rej(new Error('连接超时')), 9000); });
    }
    netTopic = 'zfpvp/room' + code;
    netClient.removeAllListeners('message');
    netClient.subscribe(netTopic, { qos: 0 });
    netClient.on('message', (t, m) => { if (t !== netTopic) return; try { const o = JSON.parse(m.toString()); if (o.side === pvpSide) return; netOnMsg(o); } catch (e) {} });
    netReady = true; netWon = false; netSeen = false;
    enterPvp('net' + code, side);   // 复用 PVP 流程
    if (side === 1) setBanner('🌍 房间开好！密码【' + code + '】发给小伙伴，等他踢馆！（他进场你会看到提示）');
    else setBanner('🌍 踢馆成功！等第一条对手消息……');
  } catch (e) {
    if (netClient) { try { netClient.end(true); } catch (e2) {} netClient = null; }   // 😵 失败的连接整个扔掉，下次重新建（旧码留坏连接，再点永远连不上）
    setBanner('😵 联网失败：' + e.message + '（可以玩同设备本地模式）'); beep(300, 150, 0.2, 'square', 0.12);
  }
}
function netSend(o) { if (netReady && netClient) { try { o.side = pvpSide; netClient.publish(netTopic, JSON.stringify(o), { qos: 0 }); } catch (e) {} } }
function netOnMsg(o) {   // 📡 对面消息进游戏
  if (!pvpMode) return;
  if (o.type === 'win' || o.type === 'leave') { setBanner('😴 对面离开了天空城，城里就剩你啦'); return; }
  pvpFoe = o; pvpFoe.stale = false;
  if (!netSeen) { netSeen = true; setBanner('👀 看到对手了！一起逛天空城吧'); beep(700, 1200, 0.2, 'sine', 0.15); }   // 👀 第一条对手消息：人出现了
  for (const hit of (o.hits || [])) {   // 对面挥中我：扣血（☁️只有两人都在 PVP 圈里才算）
    if (hit.s > pvpSeen) { pvpSeen = hit.s;
      const okZone = !skyMode || (inArena(player.x, player.y) && inArena(o.x, o.y));
      if (okZone && player.inv <= 0) { player.hearts -= hit.d; player.inv = 0.5; player.sinceHurt = 0; player.regenT = 0; burst(player.x, player.y, '#ff5a5a', 10); beep(300, 120, 0.15, 'sawtooth', 0.15); } }
  }
  if (o.hearts <= 0 && !foeKo) { foeKo = true; playReward(200, 10); setBanner('🏆 擂台胜利！+200 金币 +10💎——对手回城门口复活了'); beep(700, 1400, 0.3, 'square', 0.16); }
  if (o.hearts > 0) foeKo = false;
}
/* 双通道：联网走中转站，本地走 localStorage */
const _pvpWriteRaw = pvpWrite;
pvpWrite = function () {
  if (!pvpMode) return;
  if (netReady) {
    netSend({ type: 'state', x: Math.round(player.x), y: Math.round(player.y), hearts: player.hearts, maxHearts: player.maxHearts, weapon: player.weapon, dir: player.dir, moving: player.moving, walkT: player.walkT, swing: player.atkT > 0, holdFish: player.holdFish || null, hits: pvpHits.slice(-5), when: Date.now() });
    return;
  }
  _pvpWriteRaw();
};
const _pvpReadRaw = pvpRead;
pvpRead = function () {
  if (!pvpMode) { pvpFoe = null; return; }
  if (netReady) { if (pvpFoe && Date.now() - (pvpFoe.when || 0) > 3000) pvpFoe.stale = true; return; }   // 联网版消息驱动，这里只管掉线检测
  _pvpReadRaw();
};
const _leavePvpRaw = leavePvp;
leavePvp = function () { if (pvpMode && netReady) { netSend({ type: 'leave' }); netReady = false; } _leavePvpRaw(); };
document.getElementById('pvpNetCreate').onclick = () => { const code = String(1000 + Math.floor(Math.random() * 9000)); netStart(code, 1); };
document.getElementById('pvpNetJoin').onclick = () => { const code = (document.getElementById('pvpNetCode').value || '').trim(); if (!/^\d{4}$/.test(code)) { setBanner('😅 密码是 4 位数字！'); return; } netStart(code, 2); };
