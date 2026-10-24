'use strict';
/* ================= 输入：键盘 + 触屏摇杆 + 攻击钮 ================= */
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === ' ') { doAttack(); e.preventDefault(); } if (e.key.toLowerCase() === 'b') ctxGo(); if (/^[1-9]$/.test(e.key)) castSkillByIndex(+e.key - 1); showTouch(false); });   // B：情境动作（宝箱/进店/坐长椅）
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
const joy = document.getElementById('joy'), knob = document.getElementById('joyKnob'), atkBtn = document.getElementById('atkBtn'), autoBtn = document.getElementById('autoBtn');
let joyVec = { x: 0, y: 0 }, joyId = null, joyC = { x: 0, y: 0 };
let autoOn = false, holdAtk = false, autoT = 0;   // ⚔️ 自动攻击开关 / 按住连打（都是 0.2 秒一刀）
function showTouch(on) { joy.style.display = atkBtn.style.display = autoBtn.style.display = on ? 'flex' : 'none'; document.getElementById('tip').style.display = on ? 'none' : 'block'; }
addEventListener('touchstart', () => showTouch(true), { once: true, passive: true });
joy.addEventListener('pointerdown', e => { joyId = e.pointerId; const r = joy.getBoundingClientRect(); joyC = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; try { joy.setPointerCapture(e.pointerId); } catch (_) {} });
joy.addEventListener('pointermove', e => { if (e.pointerId !== joyId) return;
  let dx = (e.clientX - joyC.x) / 46, dy = (e.clientY - joyC.y) / 46;
  const d = Math.hypot(dx, dy); if (d > 1) { dx /= d; dy /= d; }
  joyVec = { x: dx, y: dy };
  let kx = dx, ky = dy;
  if (rotated) { const t = kx; kx = ky; ky = -t; }   // 🔄 摇杆球跟着画面反向转，球永远贴在手指下（之前球歪了 90° 害人误判方向）
  knob.style.transform = `translate(${kx * 34}px,${ky * 34}px)`; });
function joyEnd(e) { if (e.pointerId === joyId) { joyId = null; joyVec = { x: 0, y: 0 }; knob.style.transform = ''; } }
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
atkBtn.addEventListener('pointerdown', e => { e.preventDefault(); holdAtk = true; doAttack(); });
function atkEnd() { holdAtk = false; }
atkBtn.addEventListener('pointerup', atkEnd); atkBtn.addEventListener('pointercancel', atkEnd); atkBtn.addEventListener('pointerleave', atkEnd);
autoBtn.addEventListener('pointerdown', e => { e.preventDefault(); autoOn = !autoOn; autoBtn.classList.toggle('on', autoOn); if (autoOn) autoT = 0; });
document.getElementById('again').onclick = reset;
document.getElementById('overHome').onclick = () => { reset(); document.getElementById('over').style.display = 'none'; showHome(); };   // 💀 死亡回主页：人已重置到第一关——这时（自动/手动）存的档只能是第一关，死亡不再白嫖进度

/* 💀 击杀结算（打死的/烧死的/雷劈的/反伤死的都算你的，每只只结一次）：得分+掉金币+吸血 */
function killZombie(z) {
  if (z.counted) return; z.counted = true; z.dead = true; kills++;
  shakeT = Math.max(shakeT, z.boss ? 0.4 : 0.16);   // 💥 击杀震屏：BOSS 倒地震得更狠
  if (z.fake) {   // 💎 水晶魔王假身：碎掉不给钱、不进图鉴
    burst(z.x, z.y - 40, '#a8f2ff', 20); setBanner('💥 假身碎了！'); beep(800, 200, 0.2, 'square', 0.12);
    return;
  }
  if (z.kind) { dexCounts[z.kind] = (dexCounts[z.kind] || 0) + 1; }   // 📖 图鉴计数
  if (player.job === 'necro' && !z.boss && !z.fake && Math.random() < 0.3 && minions.length < 3) { minions.push({ x: z.x, y: z.y, t: 10, cd: 0 }); burst(z.x, z.y, '#c8f4ff', 8); }   // ☠️ 死灵：30% 复活成骷髅小弟
  if (dungeonMode && z.goblin) { dgnKills++; updateScore(); }   // 🌲 副本计数（头顶标签跟着跳）
  if (z.slime && z.size > 0) {   // 🟢 史莱姆分裂：大→2 中，中→2 小
    for (let i = 0; i < 2; i++) zombies.push(makeSlime(z.x + (Math.random() - 0.5) * 24, z.y + (Math.random() - 0.5) * 24, z.size - 1));
    burst(z.x, z.y, '#7ec850', 10); beep(500, 700, 0.08, 'sine', 0.08);
  }
  if (towerMode && !z.fake) {   // 💎 试炼塔掉钻石：小怪掉「波数」颗（第 1 波僵尸=1 颗，越高波越多），BOSS 掉 10×波数
    coins.push({ x: z.x + (Math.random() - 0.5) * 20, y: z.y + (Math.random() - 0.5) * 20, v: z.boss ? endlessWave * 10 : endlessWave, t: 90, gem: true });
  }
  if (towerMode && !z.boss) {   // 🗼 试炼塔：数 20 只小怪出 BOSS
    waveKills++;
    if (waveKills >= 20 && !zombies.some(b2 => b2.boss && !b2.dead && !b2.fake)) { spawnBoss(); updateScore(); }
  }
  /* 🌋 岩浆怪死亡小爆炸：55px 内半心（跑得快就躲得过） */
  if (z.lava && !gameOver && !(player.tpT > 0) && Math.hypot(player.x - z.x, player.y - z.y) < 55) {
    burst(z.x, z.y, '#ff7a2a', 20); beep(150, 60, 0.25, 'sawtooth', 0.18);
    if (player.inv <= 0) {
      const dmg = rollDmg(0.5);
      if (dmg > 0) {
        player.hearts -= dmg; player.inv = 0.6; player.sinceHurt = 0;
        burst(player.x, player.y, '#e84a4a', 8);
        if (player.hearts <= 0) { if (!angelSave()) { player.hearts = 0; gameOver = true; document.getElementById('over').style.display = 'flex'; document.getElementById('overScore').textContent = `你击败了 ${kills} 只怪物！`; } }   // 💀 死亡不存档
      }
    }
  }
  let g;
  if (z.boss) {   // 👹 BOSS 赏金 50 起、每关+25（越难的 BOSS 越值钱）；第一关 BOSS 死了→进入第二关！
    g = 50 + (level - 1) * 25; shakeT = 0.5;
    for (let i = 0; i < 26; i++) burst(z.x + (Math.random() - 0.5) * 100, z.y + (Math.random() - 0.5) * 100, ['#ffd24a', '#7ec850', '#ff8a5a'][i % 3]);
    if (z.dgnKing) {   // 🌲 副本通关：哥布林王倒下！发奖励，2.5 秒后传送回小镇
      g = 0;
      player.gold += 300; player.diamonds = (player.diamonds || 0) + 10; updateGold();
      for (let i = 0; i < 40; i++) burst(z.x + (Math.random() - 0.5) * 220, z.y + (Math.random() - 0.5) * 220, ['#ffd24a', '#7ec850', '#7ae8f2'][i % 3]);
      setBanner('👑 哥布林王倒下了！副本通关！+300 金 +10💎');
      beep(600, 1200, 0.6, 'sine', 0.2); setTimeout(() => beep(800, 1600, 0.6, 'sine', 0.2), 250);
      dgnExit = 2.5;   // 2.5 秒后凯旋回镇
    } else if (towerMode) {   // 🗼 试炼塔：BOSS 倒下→下一波/下一遍+商店刷新+宝箱
      g = 0;
      endlessBossDown(z);
      chest = { x: z.x, y: z.y, taken: false };
      setBanner('🌀 BOSS 倒下！宝箱掉下来啦，走过去打开！');
    } else if (level < 12) {   // 🎁 普通关：掉宝箱，开完问要不要进下一关
      pendingNext = 'level'; chest = { x: z.x, y: z.y, taken: false };
      setBanner('👑 BOSS 倒下！宝箱掉下来了，走过去打开！');
      saveGame();
    } else {   // 👿 第十二关坚守者倒了：主线通关！掉宝箱，开完进小镇（试炼塔等你）
      player.gold += 800; updateGold();
      for (let i = 0; i < 40; i++) burst(player.x + (Math.random() - 0.5) * 300, player.y + (Math.random() - 0.5) * 300, ['#ffd24a', '#4a6aff', '#a8f2ff', '#7ec850'][i % 4]);
      pendingNext = 'town'; chest = { x: z.x, y: z.y, taken: false };
      setBanner('👿 坚守者倒下了！主线通关！宝箱掉下来了，走过去打开！');
      beep(600, 1200, 0.6, 'sine', 0.2); setTimeout(() => beep(800, 1600, 0.6, 'sine', 0.2), 250);
      saveGame();
    }
  } else {
    g = lootBounty(z, Math.random);   // 💰 僵尸 1~4，骷髅 3~6
    if (player.owned.magnet) g *= 2;                // 🧲 磁铁金币×2
    if (player.owned.book) g = Math.ceil(g * 1.5);  // 📖 经验之书×1.5
    if (player.owned.ice_necklace) g = Math.ceil(g * 1.5);   // 📿 冰晶项链×1.5
    if (player.owned.soul_pearl) g = Math.ceil(g * 1.5);     // 🔮 聚魂珠×1.5
    if (player.owned.lava_magnet_stone) g = Math.ceil(g * 1.5);   // 🧲 熔岩吸石×1.5
    if (player.owned.volt_pearl || player.owned.dark_pearl) g = Math.ceil(g * 1.5);   // 🔮 聚雷珠/暗物质珠×1.5
    if (player.owned.soul_stone) g += 1;                     // 🪨 魂吸石+1
    if (player.owned.fire_orb) g += 2;                       // 🔮 火灵珠+2
    if (player.owned.thunder_orb || player.owned.dimension_pearl) g += 2;   // 🔮 雷灵珠/次元珠+2
    if (player.owned.telescope) g += 1;             // 🔭 望远镜金币+1
    if (z.elite) g *= 10;   // ✨ 金色精英怪：十倍赏金！
    g = Math.round(g * modMul('goldMul')) + modVal('goldAdd');   // 💎 水晶装备金币加成
  }
  if (player.job === 'rogue') g *= 2;   // 🃏 盗贼：金币双倍
  if (player.job === 'lucky') g = Math.round(g * 1.25);   // 🍀 幸运星：金币+25%
  player.gold += g;
  if (player.owned.vampire) player.hearts = Math.min(player.maxHearts, player.hearts + 0.5);   // 🧛 吸血
  if (player.owned.soul_ring && Math.random() < 0.15) player.hearts = Math.min(player.maxHearts, player.hearts + 0.5);   // 💍 摄魂
  if ((WEAPON_FX[player.weapon] || {}).holy) player.hearts = Math.min(player.maxHearts, player.hearts + 0.5);   // ✨🗿 圣剑/图腾回血
  updateScore(); updateGold();
  burst(z.x, z.y, '#5aa83c', 18); burst(z.x, z.y - 8, '#ffd24a', 6 + Math.min(10, g * 2));
  beep(320, 60, 0.22, 'sawtooth', 0.12);
  setTimeout(() => beep(700 + Math.min(6, g) * 80, 1100, 0.12, 'sine', 0.1), 100);
}
/* ⚔️ 战士（v56）：双持状态；🛡️ 坦克（v57）：格挡状态 */
let warriorHand = false, lastSwingKey = null, blockT = 0, blockCd = 0;
const weapFam = k => { const f = WEAPON_FX[k] || {}; return f.bow ? 'bow' : f.staff ? 'staff' : f.gun ? 'gun' : 'melee'; };   // 武器家族：近战/弓/法杖/枪
function skillMax() { return (player.job === 'tank' ? 4 : 5) + (player.slots ? player.slots.skill : 0); }   // 🛡️ 坦克代价：技能位 5→4；💎 钻石商店可加格
function petMax() { return 3 + (player.slots ? player.slots.pet : 0); }   // 🐾 宠物位：默认 3，钻石商店可加
function offMax() { return (player.job === 'warrior' ? 1 : 0) + (player.slots ? player.slots.off : 0); }   // ⚔️ 副手位：战士自带 1，钻石商店人人可加
function doAttack(fromAuto) {
  if (gameOver || paused || player.tpT > 0 || player.frozenT > 0 || blockT > 0) return;   // 🗡️残影/❄️冻结/🛡️举盾中不能出手
  let handKey = player.weapon;
  const hands = [player.weapon, player.offhand, ...(player.offhands2 || [])].filter(Boolean);   // ⚔️ 主手+全部副手轮流砍（💎 副手槽人人可开）
  const canCycle = hands.length > 1 && hands.every(k => weapFam(k) !== 'staff');   // 法杖不参与轮转
  if (canCycle) { window.__handI = ((window.__handI == null ? -1 : window.__handI) + 1) % hands.length; handKey = hands[window.__handI]; }
  const dualOk = player.job === 'warrior' && !!player.offhand && weapFam(player.offhand) === weapFam(player.weapon) && weapFam(player.weapon) !== 'staff';   // 双持：同类型才行，法杖不行
  lastSwingKey = handKey;
  const fx = WEAPON_FX[handKey] || {};
  if (!fromAuto) {   // 手动点：走武器冷却；自动/按住：外面 0.2 秒一刀管着
    if (player.cd > 0) return;
    player.cd = ATTACK.cd * (fx.cdMul || 1) * (player.cdMulGear || 1) * (dualOk ? 0.5 : 1);   // 🔨🧤 攻速加成；⚔️ 双持轮流=攻速翻倍
  }
  player.atkCount = (player.atkCount || 0) + 1;
  player.atkT = ATTACK.swing; swingDir = -swingDir;   // ↔️ 左右交替挥剑（恩泽点的：先左到右，再右到左）
  let dmg = (fx.dmg || 1) * T(handKey) + (player.dmgAdd || 0);   // 🌈 按出手的那只手算伤害
  if (player.powerT > 0) dmg *= 1.5;   // 💪 力量药水
  if (player.job === 'warrior' && fx.staff) dmg *= 0.9;   // ⚔️ 战士拿法杖只能发挥九成
  if (assassinStrike) dmg *= 2;   // 🥷 刺客落地一刀：×2
  if (player.job === 'mage') dmg *= 1.15;   // 🔮 法师附魔：所有武器 +15%
  if (player.job === 'berserker') dmg *= 1 + Math.max(0, 1 - player.hearts / player.maxHearts);   // 🩸 狂战士：血越少攻越高（最高+100%）
  if (player.job === 'ranger' && !fx.bow && !fx.staff && !fx.gun) dmg *= 0.7;   // 🏹 游侠：近战 -30%
  if (player.job === 'cleric') dmg *= 0.85;   // 💚 牧师输出低
  if (player.job === 'chrono') dmg *= 0.9;   // ⏳ 时空术士 -10%
  if (player.job === 'lucky') dmg *= 0.95;   // 🍀 幸运星 -5%
  if (player.job === 'alchemist') dmg *= 0.8;   // ⚗️ 炼金术士武器弱
  if (player.bearT > 0) dmg *= 2.5;   // 🐻 熊形态
  if (player.job === 'lucky' && Math.random() < 0.25) { dmg *= 3; burst(player.x, player.y - 20, '#ffd24a', 10); beep(1200, 1800, 0.08, 'square', 0.1); }   // 🍀 暴击 ×3！
  if (player.job === 'mage' && fx.staff) dmg *= 1.15;   // 🔮 法杖火球再 +15%
  if (player.owned.berserk && player.hearts <= 2) dmg *= 1.5;   // 💢 狂暴
  if (player.owned.hellhound && player.hearts <= 2) dmg *= 1.5; // 🦷 犬牙
  if (player.owned.magma_tattoo && player.hearts <= 2) dmg *= 1.5;   // 🐉 纹身
  if (player.owned.volt_box && player.hearts <= 2) dmg *= 1.5;   // 🔋 高压电匣
  if (player.owned.oblivion_tattoo && player.hearts <= 2) dmg *= 1.5;   // 🐉 湮灭纹身
  if (modVal('rage') && player.hearts <= 2) dmg *= modVal('rage');   // 💎 晶化纹身
  if (player.owned.clover && Math.random() < 0.15) { dmg *= 3; player.critT = 0.3; }   // 🍀 暴击×3
  const opts = { dmg };
  if (player.owned.avalanche_belt || player.owned.soul_belt || player.owned.volcano_belt || player.owned.storm_belt || player.owned.star_belt) opts.kbMul = 1.5;   // 🎽 腰带击退+50%
  opts.kbMul = (opts.kbMul || 1) * modMul('knock');   // 💎 晶簇腰带击退
  /* 🏹 弓类（寒冰弓/极寒弓）：不挥弧，自动瞄准最近的怪，射一支直线箭（射出后直线飞） */
  if (fx.bow) {
    if ((player.bowCd || 0) > 0) return;   // 🏹 弓 1 秒一支（自动/快点点都一样）
    player.bowCd = 1;
    let tgt = null, best = 1e9;
    for (const z of zombies) { if (z.dead) continue; const d = Math.hypot(z.x - player.x, z.y - player.y); if (d < best) { best = d; tgt = z; } }
    const ang = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.dir;
    if (player.job === 'ranger') dmg *= 1.2;   // 🏹 游侠：箭更痛 +20%
    parrows.push({ x: player.x + Math.cos(ang) * 14, y: player.y - 6 + Math.sin(ang) * 14, vx: Math.cos(ang) * 380, vy: Math.sin(ang) * 380, t: 0.42, dmg, freeze: fx.freezeDur !== 0, freezeDur: fx.freezeDur || 1.5, soul: fx.bow === 'soul', burn: fx.bow === 'fire', volt: fx.bow === 'volt', voidz: fx.bow === 'void' });
    if (player.job === 'assassin') parrows[parrows.length - 1].asTp = true;   // 🥷 刺客的箭=传送信标
    if (player.job === 'mage') parrows[parrows.length - 1].mageBurn = true;   // 🔮 法师的箭带燃烧
    if (player.job === 'ranger') {   // 🏹 游侠：双箭齐发，两支都能穿透
      parrows[parrows.length - 1].pierce = true; parrows[parrows.length - 1].hitIds = {};
      const a2 = ang + 0.1;
      parrows.push({ x: player.x + Math.cos(a2) * 14, y: player.y - 6 + Math.sin(a2) * 14, vx: Math.cos(a2) * 380, vy: Math.sin(a2) * 380, t: 0.42, dmg, freeze: fx.freezeDur !== 0, freezeDur: fx.freezeDur || 1.5, soul: fx.bow === 'soul', burn: fx.bow === 'fire', volt: fx.bow === 'volt', voidz: fx.bow === 'void', pierce: true, hitIds: {} });
    }
    player.dir = ang; player.swingColor = fx.color; player.swingRange = 26; player.swingCircle = false;
    beep(880, 440, 0.09, 'square', 0.1);
    return;
  }
  /* 🪄 法杖类（远程速射：0.5 秒一发魔法弹，单发伤害×0.6）/ 🔫 枪类（远程重炮：1.5 秒一发，单发伤害×2）；弓类中速中伤（1 秒一发） */
  if (fx.staff || fx.gun) {
    if ((player.bowCd || 0) > 0) return;
    player.bowCd = fx.staff ? 0.5 : 1.5;
    let tgt = null, best = 1e9;
    for (const z of zombies) { if (z.dead) continue; const d = Math.hypot(z.x - player.x, z.y - player.y); if (d < best) { best = d; tgt = z; } }
    const ang = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.dir;
    const spd = fx.gun ? 560 : 320;
    parrows.push({ x: player.x + Math.cos(ang) * 14, y: player.y - 6 + Math.sin(ang) * 14, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, t: fx.gun ? 0.29 : 0.5, dmg: dmg * (fx.staff ? 0.6 : 2), magic: !!fx.staff, bullet: !!fx.gun, mcolor: fx.color, burn: !!fx.burn, volt: !!fx.zapPct });
    if (player.job === 'mage') parrows[parrows.length - 1].mageBurn = true;   // 🔮 法师的法弹/子弹也带燃烧
    player.dir = ang; player.swingColor = fx.color; player.swingRange = 26; player.swingCircle = false;
    beep(fx.gun ? 220 : 990, fx.gun ? 110 : 660, fx.gun ? 0.14 : 0.07, 'square', fx.gun ? 0.16 : 0.09);
    return;
  }
  /* 🔱 木矛：自动戳向周围 120 内最近的怪（360° 不用转身）；周围没怪才挥弧 */
  if (handKey === 'spear') {
    let tgt = null, best = 120;
    for (const z of zombies) { if (z.dead) continue; const d = Math.hypot(z.x - player.x, z.y - player.y); if (d < best) { best = d; tgt = z; } }
    if (tgt) {
      const ang = Math.atan2(tgt.y - player.y, tgt.x - player.x); player.dir = ang;
      player.swingColor = fx.color; player.swingRange = 40; player.swingCircle = false;
      tgt.hp -= dmg; tgt.flash = 0.12;
      const dd = Math.hypot(tgt.x - player.x, tgt.y - player.y) || 1, skb = 26 * (tgt.boss ? 0.15 : 1);
      tgt.x = Math.max(20, Math.min(WORLD.w - 20, tgt.x + (tgt.x - player.x) / dd * skb));
      tgt.y = Math.max(20, Math.min(WORLD.h - 20, tgt.y + (tgt.y - player.y) / dd * skb));
      burst(tgt.x, tgt.y, '#8fd05a', 8); beep(600, 300, 0.08, 'square', 0.1);
      hitstopT = Math.max(hitstopT, 0.05); shakeT = Math.max(shakeT, 0.12);   // 💥 戳中也有顿帧小套餐
      if (tgt.hp <= 0) killZombie(tgt);
      return;
    }
  }
  if (dualOk && weapFam(handKey) === 'melee') opts.arc = Math.PI * 5 / 3;   // ⚔️ 双剑专属：300° 大扇形（后方 60° 盲区）
  if (fx.tp) opts.teleport = Math.random;
  if (fx.rangeMul) opts.rangeMul = fx.rangeMul;
  if (fx.circle) opts.arc = Math.PI * 2;
  if (fx.kbMul) opts.kbMul = (opts.kbMul || 1) * fx.kbMul;
  const preX = player.x, preY = player.y;   // 🗡️ 光影剑：记下原点，0.5 秒后闪回
  const hits = attackHit(player, zombies, opts);
  if (hits.length) {   // 💥 打击感组合拳：顿帧+震屏+金火花+闪白加长+低沉打击音
    const big = player.critT > 0 || hits.length >= 3;   // 暴击或一扫一片=重击
    hitstopT = Math.max(hitstopT, big ? 0.09 : 0.05);
    shakeT = Math.max(shakeT, big ? 0.22 : 0.14);
    for (const z of hits) { z.flash = big ? 0.2 : 0.16; burst(z.x, z.y - 6, big ? '#ff9a3d' : '#ffd75e', big ? 10 : 6); }
    beep(150, 60, 0.09, 'square', 0.14);   // 🔊 砰！
  }
  for (const z of hits) z.aggroW = null;   // 🐺 你出手，怪就冲你来（仇恨归位）
  if (player.job === 'cleric') for (const z of hits) { if (['zombie', 'skeleton', 'ghost', 'wither', 'bat'].includes(z.kind) && !z.dead) { z.hp -= dmg; z.flash = 0.15; if (z.hp <= 0) killZombie(z); } }   // 💚 牧师：对亡灵×2
  if (player.job === 'rogue') for (const z of hits) { if (z.aggroW && z.aggroW.hp > 0 && !z.dead) { z.hp -= dmg * 1.5; z.flash = 0.15; burst(z.x, z.y, '#ffd24a', 6); if (z.hp <= 0) killZombie(z); } }   // 🃏 盗贼背刺：怪没看你=×2.5
  deflectGhastBalls(player.x, player.y, 50);   // ⚾ 近战也能把恶魂火球抽回去
  if (pvpFoe && !pvpFoe.stale && (!skyMode || inArena(player.x, player.y)) && Math.hypot(pvpFoe.x - player.x, pvpFoe.y - player.y) < (opts.arc ? 52 : 46)) { pvpHits.push({ s: ++pvpHitSeq, d: dmg }); pvpWrite(); burst(pvpFoe.x, pvpFoe.y, '#ffb0b0', 8); }   // 📡 PVP：砍中对面幻影→写进我的存档（天空城里只有我在 PVP 圈里才砍得到）
  if (assassinStrike) {   // 🥷 落地一刀已挥出：×2 用完，换回弓
    assassinStrike = false; assassinSwapT = 0;
    if (prevBow) { player.weapon = prevBow; prevBow = null; setBanner('🏹 一击得手，换回弓！'); }
  }
  if (player.job === 'mage') {   // 🌪️ 法师剑风：挥剑放出 4 格剑气，碰到的怪掉 1 血（穿透，一只只刮一次）
    parrows.push({ wave: true, x: player.x + Math.cos(player.dir) * 20, y: player.y - 6 + Math.sin(player.dir) * 20, vx: Math.cos(player.dir) * 300, vy: Math.sin(player.dir) * 300, t: 0.43, dmg: 1, hitIds: {} });
  }
  if (fx.doublePct && Math.random() < fx.doublePct) {   // 👻 幻影匕首：幻影再砍一刀
    const hits2 = attackHit(player, zombies, opts);
    for (const z of hits2) if (!hits.includes(z)) hits.push(z);
  }
  player.swingColor = fx.color;
  player.swingCircle = !!fx.circle;   // 🪃 回旋镖：画一整圈
  player.swingRange = fx.circle ? ATTACK.range + ZOMBIE.r : (fx.rangeMul ? 44 : 26);
  beep(500, 180, 0.09, 'square', 0.08);
  if (hits.length) { beep(220, 90, 0.1, 'square', 0.12);
    let tpProc = false;
    for (const z of hits) {
      burst(z.x, z.y, '#8fd05a', 8);
      if (z.tp) { tpProc = true; burst(player.x, player.y, '#8fd8ff', 16); beep(900, 1500, 0.16, 'sine', 0.12); }   // 🗡️ 瞬移蓝光
      if (fx.burn && !z.dead) { z.burnT = 2; z.burnAcc = 0; }                                        // 🔥 点燃
      if (fx.poison && !z.dead) { z.poiT = fx.poison; z.poiAcc = 0; z.poiColor = null; }                     // 🐍 中毒
      if (fx.frostbite && !z.dead) { z.poiT = fx.frostbite; z.poiAcc = 0; z.poiColor = '#7ac8ff'; }          // 🐉 冻伤（蓝色毒）
      if (fx.freeze && !z.dead) { z.freezeT = 1.5; burst(z.x, z.y, '#a8e8ff', 8); }                  // 🏹 冰冻
      if (fx.freezePct && !z.dead && Math.random() < fx.freezePct) { z.freezeT = Math.max(z.freezeT || 0, fx.freezeDur || 1); burst(z.x, z.y, '#c8f4ff', 8); }   // ❄️ 概率冰冻
      if (player.owned.ice_ring && !z.dead && Math.random() < 0.1) { z.freezeT = Math.max(z.freezeT || 0, 1); burst(z.x, z.y, '#c8f4ff', 6); }   // 💍 冰霜指环
      if (player.owned.sulfur_ring && !z.dead && Math.random() < 0.1) { z.burnT = 2; z.burnAcc = 0; }   // 💍 硫磺戒指点燃
      if (player.owned.flame_ring && !z.dead && Math.random() < 0.15) { z.hp -= 2; burst(z.x, z.y, '#ff9a3d', 8); }   // ⭕ 烈焰之环追加火伤
      if (player.owned.volt_ring && !z.dead && Math.random() < 0.1) { z.hp -= 2; z.zapT = 0.12; burst(z.x, z.y, '#ffe84a', 6); }   // 💍 电光戒指
      if ((player.owned.void_ring || player.owned.gravity_ring) && !z.dead && Math.random() < 0.1) { z.hp -= 2; burst(z.x, z.y, '#b48af2', 6); }   // 💍 虚无/引力戒指
      if (modVal('ringDmg') && !z.dead && Math.random() < 0.1) { z.hp -= modVal('ringDmg'); burst(z.x, z.y, '#d0f2ff', 6); }   // 💎 光棱戒指
      if (fx.zap && !z.dead && Math.random() < 0.25) { z.hp = 0; z.zapT = 0.25; burst(z.x, z.y - 10, '#ffe84a', 20); beep(1200, 200, 0.18, 'sawtooth', 0.14); }   // ⚡ 雷劈
      if (fx.zapPct && !z.dead && Math.random() < fx.zapPct) { z.hp -= 2; z.zapT = 0.15; burst(z.x, z.y - 10, '#fff29a', 10); }   // 🪄 追加电击
      if (z.hp <= 0) killZombie(z);
    }
    if (tpProc && !(player.tpT > 0)) {   // 🗡️ 光影剑：0.5 秒无敌残影，然后闪回原点
      player.tpT = 0.5; player.tpRx = preX; player.tpRy = preY;
      player.inv = Math.max(player.inv, 0.55);
    }
  }
}
function burst(x, y, color, n) { if (parts.length > 240) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 90;
  parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, t: 0.5 + Math.random() * 0.3, c: color }); } }
function dotBurst(x, y, color) { if (parts.length > 240) return; for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, s = 30 + Math.random() * 60;
  parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t: 0.35 + Math.random() * 0.2, c: color }); } }   // 🩸 持续伤害专用小粒子（防卡）
