'use strict';
/* ================= 🌐 联机大厅 PVP（恩泽设计：存档直通，0.1 秒一存——同一台设备开两个窗口就能对战，不用网络！） ================= */
const PVP_ROOMS_KEY = 'zf_pvp_rooms_v1';
// 公网实测约 10 包/秒/客户端：房主状态搭快照同包，避免双倍挤占；绝不开 1MHz 定时器。
const NET_INTERVAL = 0.1;
function currentMapId() {
  if (typeof skyMode !== 'undefined' && skyMode) return 'sky';
  if (typeof dungeonMode !== 'undefined' && dungeonMode) return 'dungeon:goblin';
  if (typeof townMode !== 'undefined' && townMode) return typeof inRoom !== 'undefined' && inRoom ? 'town:house' : 'town';
  if (typeof towerMode !== 'undefined' && towerMode) return 'tower:' + endlessRound + ':' + endlessWave;
  if (typeof coopMode !== 'undefined' && coopMode) return 'coop:' + coopId + ':' + coopWave;
  return 'campaign:' + (typeof level !== 'undefined' ? level : 1);
}
function sameMap(f) { return !!f && (!f.mapId || f.mapId === currentMapId()); }
var pvpMode = null, pvpSide = 0, pvpFoe = null, pvpT = 0, pvpHitSeq = 0, pvpHits = [], pvpSeen = 0, pvpPreHearts = 0;
var coopMode = null, coopSide = 0, coopWave = 1, coopWaveKills = 0, coopDownT = 0, coopSnapT = 0, coopT = 0, coopId = null, coopClientInvT = 0;
let coopLeaveTimer = null;
function clearCoopLeaveTimer() { if (coopLeaveTimer) { clearTimeout(coopLeaveTimer); coopLeaveTimer = null; } }
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
function openLobby() { renderLobby(); const el = document.getElementById('pvpLob'); if (el) el.style.display = 'flex'; }
function renderLobby() {
  const rs = pvpRooms().filter(r => Date.now() - r.created < 3600e3);   // 一小时的房间才作数
  let h = '<div class="htxt" style="margin-bottom:6px">📡 本地联机：<b>同一台设备再开一个游戏窗口</b>，一个创建房间、一个踢馆或加入，就能双人 PVP / 合作冒险！（存档直通，不用网络）</div>';
  if (pvpMode) h += `<div class="slot"><div class="inf">⚔️ 我在擂台 #${pvpMode}（${pvpSide === 1 ? '房主' : '挑战者'}）</div><button data-pvp="leave">🚪 离开</button></div>`;
  if (coopMode) h += `<div class="slot"><div class="inf">🤝 合作冒险·房中（${coopMode === 'host' ? '主机' : '客机'}）</div><button data-coop="leave">🚪 离开</button></div>`;
  for (const r of rs) {
    const st = pvpReadRoom(r.id);
    const full = st && st.p2, closed = st && st.winner;
    const isCoop = r.type === 'coop' || (st && st.type === 'coop');
    if (isCoop) {
      h += `<div class="slot"><div class="inf">🤝 合作冒险·房中 #${r.id}${closed ? '（已结束）' : full ? '（游戏中）' : '（虚位以待）'}</div>${!full && !closed && !pvpMode && !coopMode ? `<button data-coop="join:${r.id}">🤝 加入合作</button>` : ''}</div>`;
    } else {
      h += `<div class="slot"><div class="inf">⚔️ 擂台 #${r.id}${closed ? '（已分出胜负）' : full ? '（对战进行中）' : '（虚位以待）'}</div>${!full && !closed && !pvpMode && !coopMode ? `<button data-pvp="join:${r.id}">⚔️ 踢馆</button>` : ''}</div>`;
    }
  }
  if (!rs.length) h += '<div class="htxt">还没有房间，点下面创建一个！</div>';
  if (!pvpMode && !coopMode) {
    h += '<div style="display:flex;gap:8px;margin-top:8px">';
    h += '<button data-pvp="create" style="flex:1;padding:11px;border:0;border-radius:12px;background:#4a6aff;color:#fff;font-weight:bold;cursor:pointer">➕ 创建 PVP 房间</button>';
    h += '<button data-coop="create" style="flex:1;padding:11px;border:0;border-radius:12px;background:#7ec850;color:#14300e;font-weight:bold;cursor:pointer">🤝 合作冒险（建房）</button>';
    h += '</div>';
  }
  const listEl = document.getElementById('pvpList');
  if (!listEl) return;
  listEl.innerHTML = h;
  for (const b of (document.querySelectorAll ? document.querySelectorAll('#pvpList [data-pvp]') : [])) b.onclick = () => {
    const a = b.dataset.pvp;
    if (a === 'create') createPvpRoom();
    else if (a === 'leave') { leavePvp(); openLobby(); return; }
    else if (a.startsWith('join:')) joinPvpRoom(+a.slice(5));
    renderLobby();
  };
  for (const b of (document.querySelectorAll ? document.querySelectorAll('#pvpList [data-coop]') : [])) b.onclick = () => {
    const a = b.dataset.coop;
    if (a === 'create') createCoopRoom();
    else if (a === 'leave') { leaveCoop(); openLobby(); return; }
    else if (a.startsWith('join:')) joinCoopRoom(+a.slice(5));
    renderLobby();
  };
}
function createPvpRoom() { const id = Date.now() % 100000; const rs = pvpRooms(); rs.push({ id, type: 'pvp', created: Date.now() }); pvpSaveRooms(rs); pvpWriteRoom(id, { type: 'pvp', p1: true, p2: false, winner: 0 }); enterPvp(id, 1); }
function joinPvpRoom(id) { const st = pvpReadRoom(id); if (!st || st.p2) { setBanner('😅 这个房间满了'); return; } st.p2 = true; pvpWriteRoom(id, st); enterPvp(id, 2); }
function createCoopRoom() { const id = Date.now() % 100000; const rs = pvpRooms(); rs.push({ id, type: 'coop', created: Date.now() }); pvpSaveRooms(rs); pvpWriteRoom(id, { type: 'coop', p1: true, p2: false, winner: 0 }); enterCoop(id, 1); }
function joinCoopRoom(id) { const st = pvpReadRoom(id); if (!st || st.p2) { setBanner('😅 这个合作房间满了'); return; } st.p2 = true; pvpWriteRoom(id, st); enterCoop(id, 2); }
function enterCoop(id, side) {
  clearCoopLeaveTimer();
  coopId = id; coopSide = side; coopMode = side === 1 ? 'host' : 'client'; pvpSide = side; pvpMode = null;
  skyMode = false; townMode = false; dungeonMode = false; towerMode = false; sandboxMode = false;
  level = 1; coopWave = 1; coopWaveKills = 0; coopDownT = 0; coopSnapT = 0; coopT = 0; coopClientInvT = 0;
  pvpFoe = null; pvpHits = []; pvpHitSeq = 0; foeKo = false;
  zombies = []; earrows = []; parrows = []; garrows = []; meteors = []; puddles = []; skillShots = []; clouds = []; fxLines = []; shocks = []; chest = null; pendingNext = null;
  player.x = side === 1 ? WORLD.w / 2 - 40 : WORLD.w / 2 + 40; player.y = WORLD.h / 2; player.hearts = player.maxHearts;
  closeHome(); const lob = document.getElementById('pvpLob'); if (lob) lob.style.display = 'none'; paused = false; homeOpen = false;
  placeShops(); placePortal(); applyGear(); updateScore();
  setBanner(side === 1 ? '🤝 合作冒险开始！房主权威控制怪物，等队友加入！' : '🤝 合作冒险开始！客机连入房主世界，紧跟冲锋！');
  beep(600, 1200, 0.3, 'square', 0.18);
}
function leaveCoop() {
  clearCoopLeaveTimer();
  if (!coopMode) return;
  if (coopId) { const st = pvpReadRoom(coopId); if (st && !st.winner) { st.winner = -1; pvpWriteRoom(coopId, st); } }
  if (netReady) { netSendCoop({ type: 'leave' }); netReady = false; }
  coopMode = null; coopSide = 0; coopId = null; pvpFoe = null; coopDownT = 0;
  setBanner('🚪 离开了合作冒险'); updateScore(); if (typeof saveGame === 'function') saveGame();
}
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
  try { localStorage.setItem(pvpRoomKey(pvpMode) + '_p' + pvpSide, JSON.stringify({ mapId: currentMapId(), x: Math.round(player.x), y: Math.round(player.y), hearts: player.hearts, maxHearts: player.maxHearts, weapon: player.weapon, skin: player.skin, dir: player.dir, moving: player.moving, walkT: player.walkT, swing: player.atkT > 0, holdFish: player.holdFish || null, hits: pvpHits.slice(-5), when: Date.now() })); } catch (e) {}
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
      const okZone = sameMap(f) && (!skyMode || (inArena(player.x, player.y) && inArena(f.x, f.y)));
      if (okZone && player.inv <= 0) { player.hearts -= hit.d; player.inv = 0.5; player.sinceHurt = 0; player.regenT = 0; burst(player.x, player.y, '#ff5a5a', 10); beep(300, 120, 0.15, 'sawtooth', 0.15); } }
  }
  if (sameMap(f) && f.hearts <= 0 && !foeKo) { foeKo = true; playReward(200, 10); setBanner('🏆 擂台胜利！+200 金 +10💎——对手回城门口复活了，还能再战'); beep(700, 1400, 0.3, 'square', 0.16); }   // ⚔️ 对面倒了=这局我赢
  if (f.hearts > 0) foeKo = false;   // 对面复活了，下一局重新算
  const st = pvpReadRoom(pvpMode);
  if (st && st.winner === -1) { st.winner = 0; pvpWriteRoom(pvpMode, st); setBanner('😴 对面离开了天空城，城里就剩你啦'); }   // 对面走了：消费掉信号继续逛
}
/* 🌍 联网 PVP / 合作：公共 MQTT 中转站（实测通了，~300ms）——两台设备真联机 */
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
async function netStart(code, side, isCoop = false) {
  try {
    setBanner('🌍 第一步：加载联机模块……（第一次约几秒，别慌）');
    await mqttLoad();
    setBanner('🌍 第二步：连接中转站……');
    if (!netClient) {
      netClient = window.mqtt.connect('wss://broker.emqx.io:8084/mqtt', { connectTimeout: 9000, reconnectPeriod: 2000 });
      await new Promise((res, rej) => { netClient.on('connect', res); netClient.on('error', rej); setTimeout(() => rej(new Error('连接超时')), 9000); });
    }
    netTopic = (isCoop ? 'zfcoop/room' : 'zfpvp/room') + code;
    netClient.removeAllListeners('message');
    netClient.subscribe(netTopic, { qos: 0 });
    netClient.on('message', (t, m) => {
      if (t !== netTopic) return;
      try {
        const o = JSON.parse(m.toString());
        if (o.side === (isCoop ? coopSide : pvpSide)) return;
        netIn(o);
      } catch (e) {}
    });
    netReady = true; netWon = false; netSeen = false;
    if (isCoop) {
      enterCoop('net' + code, side);
      if (side === 1) setBanner('🤝 合作房间开好！密码【' + code + '】发给小伙伴，等他加入！');
      else setBanner('🤝 加入成功！等第一条房主消息……');
    } else {
      enterPvp('net' + code, side);
      if (side === 1) setBanner('🌍 房间开好！密码【' + code + '】发给小伙伴，等他踢馆！（他进场你会看到提示）');
      else setBanner('🌍 踢馆成功！等第一条对手消息……');
    }
  } catch (e) {
    if (netClient) { try { netClient.end(true); } catch (e2) {} netClient = null; }   // 😵 失败的连接整个扔掉，下次重新建（旧码留坏连接，再点永远连不上）
    setBanner('😵 联网失败：' + e.message + '（可以玩同设备本地模式）'); beep(300, 150, 0.2, 'square', 0.12);
  }
}
function netSend(o) { if (netReady && netClient) { try { o.side = coopMode ? coopSide : pvpSide; netClient.publish(netTopic, JSON.stringify(o), { qos: 0 }); } catch (e) {} } }
function netOnMsg(o) {   // 📡 PVP 对面消息进游戏
  if (!pvpMode) return;
  if (o.type === 'win' || o.type === 'leave') { setBanner('😴 对面离开了天空城，城里就剩你啦'); return; }
  pvpFoe = o; pvpFoe.stale = false;
  if (!netSeen) { netSeen = true; setBanner('👀 看到对手了！一起逛天空城吧'); beep(700, 1200, 0.2, 'sine', 0.15); }   // 👀 第一条对手消息：人出现了
  for (const hit of (o.hits || [])) {   // 对面挥中我：扣血（☁️只有两人都在 PVP 圈里才算）
    if (hit.s > pvpSeen) { pvpSeen = hit.s;
      const okZone = sameMap(o) && (!skyMode || (inArena(player.x, player.y) && inArena(o.x, o.y)));
      if (okZone && player.inv <= 0) { player.hearts -= hit.d; player.inv = 0.5; player.sinceHurt = 0; player.regenT = 0; burst(player.x, player.y, '#ff5a5a', 10); beep(300, 120, 0.15, 'sawtooth', 0.15); } }
  }
  if (sameMap(o) && o.hearts <= 0 && !foeKo) { foeKo = true; playReward(200, 10); setBanner('🏆 擂台胜利！+200 金币 +10💎——对手回城门口复活了'); beep(700, 1400, 0.3, 'square', 0.16); }
  if (o.hearts > 0) foeKo = false;
}

/* ================= 🤝 合作冒险网络协议与状态同步 ================= */
function netSendCoop(o) {
  if (!o.mapId) o.mapId = currentMapId();
  o.side = coopSide || (coopMode === 'host' ? 1 : 2);
  if (netReady && netClient) {
    try { netClient.publish(netTopic, JSON.stringify(o), { qos: 0 }); } catch (e) {}
    return;
  }
  if (coopId) {
    try {
      const targetSide = o.side === 1 ? 2 : 1;
      localStorage.setItem('zf_coop_' + coopId + '_msg_to_' + targetSide + '_' + o.type, JSON.stringify({ ...o, _ts: Date.now() + Math.random() }));
    } catch (e) {}
  }
}
addEventListener('storage', e => {
  if (!coopMode || !coopId || !e.newValue || !e.key) return;
  if (e.key.startsWith('zf_coop_' + coopId + '_msg_to_' + coopSide + '_')) {
    try { const o=JSON.parse(e.newValue); coopOnMsg(o); } catch (_) {}
  }
});
function coopStatePacket() {
  return {
    type: 'state', mapId: currentMapId(),
    x: Math.round(player.x),
    y: Math.round(player.y),
    hearts: player.hearts,
    maxHearts: player.maxHearts,
    weapon: player.weapon,
    dir: player.dir,
    moving: player.moving,
    walkT: player.walkT,
    swing: player.atkT > 0,
    skin: player.skin,
    down: coopDownT > 0,
    when: Date.now()
  };
}
function coopWrite(fromTick) {
  if (!coopMode) return;
  if (coopMode === 'host') {
    if (!fromTick) coopSendSnap();
    return;   // 周期只发合包；主动调用立即补发，不重复占额度
  }
  netSendCoop(coopStatePacket());
}
let _lastLocalCoopTs = 0;
function coopRead() {
  if (!coopMode) { return; }
  if (pvpFoe && Date.now() - (pvpFoe.when || 0) > 3000) {
    if (!pvpFoe.stale) {
      pvpFoe.stale = true;
      if (coopMode === 'host') setBanner('📢 队友掉线了，变单人继续打');
      else if (coopMode === 'client') {
        setBanner('📢 连接不太稳，正在等房主回来…');
        if (!coopLeaveTimer) {
          const roomId = coopId;
          coopLeaveTimer = setTimeout(() => {
            coopLeaveTimer = null;
            if (coopMode === 'client' && coopId === roomId && pvpFoe && pvpFoe.stale) { leaveCoop(); if (typeof openLobby === 'function') openLobby(); }
          }, 8000);   // 🛟 连续 8 秒真的没恢复才退房；短暂抖动不踢人
        }
      }
    }
  }
  if (netReady) {
    return;
  }
  if (coopId) {
    try {
      const raw = localStorage.getItem('zf_coop_' + coopId + '_msg_to_' + (coopMode === 'host' ? 1 : 2) + '_state');
      if (raw) {
        const msg = JSON.parse(raw);
        if (msg._ts !== _lastLocalCoopTs) {
          _lastLocalCoopTs = msg._ts;
          coopOnMsg(msg);
        }
      }
    } catch (e) {}
  }
}
const COOP_SNAP_FLAGS = ['piglin', 'piglinKing', 'skel', 'ghost', 'lava', 'storm', 'voidw', 'crystal', 'ws', 'creep', 'slime', 'bat', 'mirror', 'goblin', 'skelBoss', 'ghostBoss', 'lavaBoss', 'stormBoss', 'voidBoss', 'crystalBoss', 'wither', 'ender', 'titan', 'ghast', 'warden', 'mirrorKing', 'elite', 'fake'];
function coopSendSnap(force) {
  if (coopMode !== 'host') return;
  const zs = [];
  for (const z of zombies) {
    if (z.dead) continue;
    if (z.id == null) z.id = _id++;   // 🛟 分身/内联怪也必须有自己的 ID，不能全挤在 undefined 上
    zs.push({
      i: z.id, swordCasts: z.swordCasts || [], axeWind: z.axeWind, axeFx: z.axeFx,
      x: Math.round(z.x),
      y: Math.round(z.y),
      hp: Math.round((z.hp || 0) * 10) / 10,
      mhp: z.maxHp || z.hp,
      kind: z.kind || (z.boss ? 'boss' : 'zombie'),
      boss: !!z.boss,
      f: COOP_SNAP_FLAGS.filter(k => z[k]),
      r: z.r || 10,
      size: z.size == null ? null : z.size,
      affix: z.affix || null,
      flash: z.flash > 0 ? 1 : 0
    });
  }
  netSendCoop({
    type: 'snap', mapId: currentMapId(), level: typeof level !== 'undefined' ? level : 1, resources: typeof currentResources === 'function' ? currentResources() : [],
    me: coopStatePacket(),
    wave: coopWave,
    kills: kills,
    zs: zs
  });
}
function coopApplyLook(z, s) {   // 🎨 外观以房主快照为准：kind 是图鉴名，画画还要看这些实际标记
  for (const k of COOP_SNAP_FLAGS) {
    const on = (s.f || []).includes(k);
    if (on) z[k] = true;
    else if (s.f) delete z[k];
  }
  z.swordCasts = s.swordCasts || []; z.axeWind = s.axeWind; z.axeFx = s.axeFx;
  if (s.r != null) z.r = s.r;
  if (s.size !== undefined) z.size = s.size;
  if (s.affix !== undefined) z.affix = s.affix;
}
function coopClientHandleSnap(o) {
  if (coopMode !== 'client') return;
  if (o.mapId && o.mapId !== currentMapId()) {
    const campaignMap = 'coop:' + coopId + ':';
    if (!townMode && !skyMode && !dungeonMode && o.mapId.startsWith(campaignMap) && o.wave) coopWave=o.wave;
    else return;
  }
  if (o.resources && typeof receiveResources === 'function') receiveResources(o.resources);
  if (o.level && typeof level !== 'undefined') level=o.level;
  if (o.wave && o.wave !== coopWave) {
    coopWave = o.wave;
    updateScore();
  }
  if (o.kills != null) {
    kills = o.kills;
    updateScore();
  }
  const snapMap = {};
  for (const s of (o.zs || [])) {
    snapMap[s.i] = s;
    let z = zombies.find(m => m.id === s.i);
    if (z) {
      z.targetX = s.x;
      z.targetY = s.y;
      z.hp = s.hp;
      z.maxHp = s.mhp || z.maxHp || s.hp;
      z.dead = false;
      if (s.flash) z.flash = 0.12;
      z.kind = s.kind;
      z.boss = s.boss;
      coopApplyLook(z, s);
    } else {
      z = {
        id: s.i,
        x: s.x,
        y: s.y,
        targetX: s.x,
        targetY: s.y,
        hp: s.hp,
        maxHp: s.mhp || s.hp || (s.boss ? 100 : 4),
        kind: s.kind,
        boss: s.boss,
        dead: false,
        flash: s.flash ? 0.12 : 0,
        walkT: 0,
        r: s.boss ? 28 : 10
      };
      if (!s.f && s.boss) {   // 老版本房主没有外观数组时，仍按波次兜底
        const w = ((coopWave - 1) % 14) + 1;
        z.skelBoss = w === 2; z.ghostBoss = w === 3; z.lavaBoss = w === 4; z.stormBoss = w === 5; z.voidBoss = w === 6; z.crystalBoss = w === 7;
        z.wither = w === 8; z.ender = w === 9; z.titan = w === 10; z.ghast = w === 11; z.warden = w === 12;
      }
      coopApplyLook(z, s);
      zombies.push(z);
    }
  }
  for (const z of zombies) {
    if (!snapMap[z.id]) z.dead = true;
  }
  zombies = zombies.filter(z => !z.dead);
}
function coopHostHandleHit(ids, dmg) {
  if (coopMode !== 'host' || !ids || !ids.length) return;
  const d = dmg != null ? dmg : 1;
  let anyHit = false;
  for (const id of ids) {
    const z = zombies.find(m => m.id === id && !m.dead);
    if (z) {
      anyHit = true;
      hurtZ(z, d, '#ffd24a');
    }
  }
  if (anyHit) {
    coopSendSnap();
  }
}
function coopOnMsg(o) {
  if (!coopMode) return;
  if (o.type === 'snap' && o.me) coopOnMsg(o.me);   // 房主玩家状态与怪物快照同包到达
  if (o.type === 'leave') {
    if (coopMode === 'host') {
      pvpFoe = null;
      setBanner('📢 队友掉线了，变单人继续打');
    } else {
      setBanner('📢 房主跑了');
      setTimeout(() => { leaveCoop(); openLobby(); }, 1500);
    }
    return;
  }
  if (o.type === 'fail') {
    setBanner(o.msg || '😵 合作挑战失败！');
    setTimeout(() => { leaveCoop(); openLobby(); }, 1500);
    return;
  }
  if (coopMode === 'host') {
    if (o.type === 'state') {
      const wasStale = !!(pvpFoe && pvpFoe.stale);
      clearCoopLeaveTimer();
      pvpFoe = o;
      pvpFoe.stale = false;
      if (!netSeen) { netSeen = true; setBanner('🤝 队友进场了！并肩冲锋！'); beep(700, 1200, 0.2, 'sine', 0.15); }
      else if (wasStale) setBanner('✅ 连接恢复啦！队友回来啦！');
    } else if (o.type === 'gather' && typeof hostGather === 'function') { hostGather(o);
    } else if (o.type === 'hit' && sameMap(o)) {
      coopHostHandleHit(o.ids || o.hits, o.dmg);
    }
  } else if (coopMode === 'client') {
    if (o.type === 'state') {
      const wasStale = !!(pvpFoe && pvpFoe.stale);
      clearCoopLeaveTimer();
      pvpFoe = o;
      pvpFoe.stale = false;
      if (!netSeen) { netSeen = true; setBanner('🤝 已连接房主！并肩冲锋！'); beep(700, 1200, 0.2, 'sine', 0.15); }
      else if (wasStale) setBanner('✅ 连接恢复啦！房主回来啦！');
    } else if (o.type === 'snap') {
      coopClientHandleSnap(o);
    } else if (o.type === 'hurtYou') {
      if (sameMap(o) && player.inv <= 0 && coopDownT <= 0) {
        player.hearts = Math.max(0, player.hearts - (o.dmg || 1));
        player.inv = 0.6; player.sinceHurt = 0; player.regenT = 0;
        burst(player.x, player.y, '#e84a4a', 10);
        beep(300, 120, 0.15, 'sawtooth', 0.12);
        if (player.hearts <= 0) {
          coopDownT = 10;
          setBanner('😵 你倒下了！10 秒后半血复活，房主撑住！');
          coopWrite();
        }
      }
    } else if (o.type === 'resourceReward' && typeof receiveResourceReward === 'function') { receiveResourceReward(o);
    } else if (o.type === 'reward' && sameMap(o)) {
      player.gold += (o.gold || 0);
      if (o.dia) player.diamonds = (player.diamonds || 0) + o.dia;
      updateGold(); updateDia();
      burst(player.x, player.y - 8, '#ffd24a', 6);
    } else if (o.type === 'wave' && !townMode && !skyMode && !dungeonMode) {
      coopWave = o.wave;
      player.hearts = player.maxHearts;
      player.gold += (o.gold || 0);
      if (o.dia) player.diamonds = (player.diamonds || 0) + o.dia;
      updateGold(); updateDia(); updateScore();
      if (o.banner) setBanner(o.banner);
      beep(600, 1200, 0.5, 'sine', 0.2);
    }
  }
}
function netIn(o) {
  if (typeof o === 'string') { try { o = JSON.parse(o); } catch (e) { return; } }
  if (coopMode) coopOnMsg(o);
  else if (pvpMode) netOnMsg(o);
}

/* 双通道：联网走中转站，本地走 localStorage */
const _pvpWriteRaw = pvpWrite;
pvpWrite = function () {
  if (!pvpMode) return;
  if (netReady) {
    netSend({ type: 'state', mapId: currentMapId(), x: Math.round(player.x), y: Math.round(player.y), hearts: player.hearts, maxHearts: player.maxHearts, weapon: player.weapon, skin: player.skin, dir: player.dir, moving: player.moving, walkT: player.walkT, swing: player.atkT > 0, holdFish: player.holdFish || null, hits: pvpHits.slice(-5), when: Date.now() });
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
function netTick(dt) {   // 💓 联机心跳独立于暂停/顿帧：画面停下时，队友也不该被误报掉线
  if (pvpMode) { pvpT -= dt; if (pvpT <= 0) { pvpT = NET_INTERVAL; pvpWrite(); } pvpRead(); }
  if (coopMode) { coopT -= dt; if (coopT <= 0) { coopT = NET_INTERVAL; coopWrite(true); } coopRead(); }
}
const _leavePvpRaw = leavePvp;
leavePvp = function () { if (pvpMode && netReady) { netSend({ type: 'leave' }); netReady = false; } _leavePvpRaw(); };
const pCreateBtn = document.getElementById('pvpNetCreate');
if (pCreateBtn) pCreateBtn.onclick = () => { const code = String(1000 + Math.floor(Math.random() * 9000)); netStart(code, 1, false); };
const pJoinBtn = document.getElementById('pvpNetJoin');
if (pJoinBtn) pJoinBtn.onclick = () => { const code = (document.getElementById('pvpNetCode').value || '').trim(); if (!/^\d{4}$/.test(code)) { setBanner('😅 密码是 4 位数字！'); return; } netStart(code, 2, false); };
const cCreateBtn = document.getElementById('coopNetCreate');
if (cCreateBtn) cCreateBtn.onclick = () => { const code = String(1000 + Math.floor(Math.random() * 9000)); netStart(code, 1, true); };
const cJoinBtn = document.getElementById('coopNetJoin');
if (cJoinBtn) cJoinBtn.onclick = () => { const code = (document.getElementById('pvpNetCode').value || '').trim(); if (!/^\d{4}$/.test(code)) { setBanner('😅 密码是 4 位数字！'); return; } netStart(code, 2, true); };
