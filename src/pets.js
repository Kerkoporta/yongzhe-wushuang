'use strict';
/* ================= 🐾 宠物伙伴（继承！过关不收回；最多 3 只出战） ================= */
const ALLPETS = {};
for (const lv of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) for (const [k, n, i, p, dmg, cd, range, spec] of PETS[lv]) ALLPETS[k] = { name: n, icon: i, price: p, dmg, cd, range, spec };
/* 🐾 宠物血量（v58 恩泽定的）：按价格定血 3~5；会被怪咬（咬一口=怪咬人的伤害）；过关/无尽过波复活 */
function petMaxHp(key) { const pr = (ALLPETS[key] && ALLPETS[key].price) || 0; return pr >= 300 ? 5 : pr >= 100 ? 4 : 3; }
function revivePets() {
  let n = 0;
  for (const p of pets) if (p.dead) { p.dead = false; p.hp = petMaxHp(p.key); p.x = player.x; p.y = player.y; burst(p.x, p.y - 6, '#8fe87a', 8); n++; }
  if (n) setTimeout(() => setBanner(`🐾 ${n} 只倒下的伙伴满血复活啦！`), 600);
}
function addPet(key) {
  const d = ALLPETS[key]; if (!d) return;
  if (pets.some(p => p.key === key)) { setBanner('🐾 ' + d.name + ' 已经在你身边啦！'); return; }
  if (pets.length >= petMax()) { setBanner('🎒 宠物位满啦，' + d.name + ' 在背包里等你召唤'); return; }
  setBanner('🐾 ' + d.name + ' 出战！');
  pets.push({ key, name: d.name, icon: d.icon, dmg: d.dmg, cd: d.cd, range: d.range, spec: d.spec, x: player.x, y: player.y, atkT: 0, wagT: Math.random() * 9, animT: 0, state: 'wander', face: 1, restT: 0, hp: petMaxHp(key), dead: false, invT: 0 });   // 🐾 出生就带齐动画+血量字段
  beep(600, 900, 0.12, 'sine', 0.12);
}
/* ================= 🐾 像素宠物工坊（程序生成像素模型：游荡/奔跑/攻击三种动画） ================= */
function pxR(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
const PET_DRAW = {
  /* 🐕 四足族：狗/狼/狐/猫/熊/豹/马/鹿/松鼠（耳朵/尾巴/吻长参数化） */
  quad(g, p, mode, ph, o) {
    const run = mode === 'run', atk = mode === 'atk';
    const bob = mode === 'wander' ? ph : 0, bx = atk ? 2 : 0;
    if (o.tail === 'big') { pxR(g, 2 - (run ? ph : 0), 6 + bob, 5, 8, p.d); pxR(g, 2, 5 + bob, 4, 3, p.l); }
    else if (o.tail === 'curl') { pxR(g, 3, 8 + bob - ph, 2, 5, p.d); pxR(g, 4, 7 + bob - ph, 2, 2, p.d); }
    else if (o.tail === 'thin') pxR(g, 5, 10 + bob - (run ? ph * 2 : 0), 3, 2, p.d);
    else if (o.tail === 'puff') pxR(g, 5, 11 + bob, 3, 3, p.l);
    pxR(g, 7, 10 + bob, o.w || 10, o.h || 6, p.b);
    if (o.belly !== false) pxR(g, 8, 13 + bob, (o.w || 10) - 3, 3, p.l);
    if (o.spots) { pxR(g, 9, 11 + bob, 1, 1, p.d); pxR(g, 12, 12 + bob, 1, 1, p.d); pxR(g, 14, 11 + bob, 1, 1, p.d); }
    const l1 = run ? ph * 2 : 0, l2 = run ? (1 - ph) * 2 : 0;
    pxR(g, 8 + l1, 16 + bob, 2, 4 - bob, p.d); pxR(g, 13 + l2, 16 + bob, 2, 4 - bob, p.d);
    const hx = 16 + bx, hy = 6 + bob - (atk ? 1 : 0);
    pxR(g, hx, hy, 6, 6, p.b);
    if (o.ear === 'point') { pxR(g, hx + 1, hy - 2, 2, 2, p.d); pxR(g, hx + 4, hy - 2, 2, 2, p.d); }
    else if (o.ear === 'round') { pxR(g, hx, hy - 2, 3, 3, p.d); pxR(g, hx + 4, hy - 2, 3, 3, p.d); }
    else if (o.ear === 'long') { pxR(g, hx + 1, hy - 5 - ph, 2, 5, p.b); pxR(g, hx + 3, hy - 5 + ph, 2, 5, p.d); }
    if (o.antler) { pxR(g, hx, hy - 4, 1, 4, p.a); pxR(g, hx + 5, hy - 4, 1, 4, p.a); pxR(g, hx - 1, hy - 4, 3, 1, p.a); pxR(g, hx + 4, hy - 4, 3, 1, p.a); }
    if (o.mane) pxR(g, hx - 2, hy - 1, 2, 6, p.a);
    pxR(g, hx + 5, hy + 3, o.snout || 2, 2, p.d);
    if (atk) pxR(g, hx + 5, hy + 4, o.snout || 2, 1, '#a83a3a');   // 张嘴咬
    pxR(g, hx + 4, hy + 2, 1, 1, '#1a1a1a');
  },
  dog(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'thin', snout: 2 }); },
  wolf(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'thin', snout: 3, w: 11 }); },
  fox(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'big', snout: 3 }); },
  cat(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'curl', snout: 1, w: 9 }); },
  bear(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'round', tail: 'none', snout: 2, w: 12, h: 7 }); },
  leopard(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'thin', snout: 1, spots: 1 }); },
  horse(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'thin', snout: 3, w: 12, h: 7, mane: 1, belly: false }); },
  deer(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'puff', snout: 2, antler: 1 }); },
  squirrel(g, p, m, ph) { PET_DRAW.quad(g, p, m, ph, { ear: 'point', tail: 'big', snout: 1, w: 8 }); },
  /* 🐰 兔：蹦跳 */
  rabbit(g, p, mode, ph) {
    const hop = mode === 'run' ? ph * 2 : (mode === 'wander' ? ph : 0), atk = mode === 'atk';
    pxR(g, 5, 12, 3, 3, p.l);   // 绒尾
    pxR(g, 7, 10 - hop, 9, 7, p.b); pxR(g, 8, 13 - hop, 6, 4, p.l);
    pxR(g, 8, 17 - (mode === 'run' ? (1 - ph) * 2 : 0), 3, 3, p.d); pxR(g, 12, 17 - (mode === 'run' ? ph * 2 : 0), 3, 3, p.d);   // 弹簧腿
    const hx = 15 + (atk ? 2 : 0), hy = 6 - hop;
    pxR(g, hx, hy, 6, 6, p.b);
    pxR(g, hx + 1, hy - 5 - (mode !== 'wander' ? ph : 0), 2, 5, p.b); pxR(g, hx + 3, hy - 4 + (mode !== 'wander' ? ph : 0), 2, 4, p.d);   // 长耳
    pxR(g, hx + 5, hy + 3, 2, 2, p.l); if (atk) pxR(g, hx + 5, hy + 4, 2, 1, '#a83a3a');
    pxR(g, hx + 4, hy + 2, 1, 1, '#1a1a1a');
  },
  /* 🦔 刺猬：尖刺 dome */
  hedgehog(g, p, mode, ph) {
    const bob = mode === 'wander' ? ph : 0, atk = mode === 'atk';
    for (let i = 0; i < 6; i++) pxR(g, 6 + i * 2, 8 + bob - (i % 2), 1, 3, p.d);   // 尖刺
    pxR(g, 6, 11 + bob, 12, 6, p.d); pxR(g, 7, 13 + bob, 10, 4, p.b);
    pxR(g, 8, 17 + bob, 2, 3 - bob, p.b); pxR(g, 13, 17 + bob, 2, 3 - bob, p.b);
    const hx = 17 + (atk ? 2 : 0);
    pxR(g, hx, 12 + bob, 4, 4, p.b); pxR(g, hx + 3, 14 + bob, 2, 1, p.d);
    pxR(g, hx + 2, 13 + bob, 1, 1, '#1a1a1a');
  },
  /* 🐦 鸟族：鸡/猫头鹰/鸟/鸦/凤凰（耳羽/长尾巴参数化） */
  bird(g, p, mode, ph, o) {
    o = o || {};   // 直接当造型用时给默认
    const atk = mode === 'atk', run = mode === 'run';
    const bob = mode === 'wander' ? ph : 0, flap = mode !== 'wander' ? ph : 0, bx = atk ? 2 : 0;
    if (o.tailLong) { pxR(g, 4, 14 + bob + flap, 4, 2, p.a); pxR(g, 3, 16 + bob - flap, 4, 2, p.a); pxR(g, 5, 12 + bob, 4, 2, p.d); }
    else pxR(g, 6, 12 + bob, 4, 2, p.d);
    pxR(g, 9, 8 + bob, 8, 8, p.b); pxR(g, 11, 12 + bob, 4, 4, p.l);
    pxR(g, 8, flap ? 6 + bob : 11 + bob, 5, 4, p.d);   // 扇翅
    const hx = 13 + bx, hy = 4 + bob;
    pxR(g, hx, hy, 6, 6, p.b);
    if (o.tuft) { pxR(g, hx, hy - 2, 2, 2, p.d); pxR(g, hx + 4, hy - 2, 2, 2, p.d); }
    if (o.crest) pxR(g, hx + 2, hy - 3, 2, 3, p.a);
    pxR(g, hx + 6, hy + 3, 3, atk ? 2 : 1, p.a);
    if (o.bigEye) { pxR(g, hx + 1, hy + 1, 2, 2, '#fff'); pxR(g, hx + 4, hy + 1, 2, 2, '#fff'); pxR(g, hx + 2, hy + 2, 1, 1, '#1a1a1a'); pxR(g, hx + 4, hy + 2, 1, 1, '#1a1a1a'); }
    else pxR(g, hx + 3, hy + 2, 1, 1, '#1a1a1a');
    pxR(g, 11, 17, 2, 3 - bob, p.a); pxR(g, 14, 17, 2, 3 - bob, p.a);
  },
  chick(g, p, m, ph) { PET_DRAW.bird(g, p, m, ph, {}); },
  owl(g, p, m, ph) { PET_DRAW.bird(g, p, m, ph, { tuft: 1, bigEye: 1 }); },
  crow(g, p, m, ph) { PET_DRAW.bird(g, p, m, ph, {}); },
  phoenix(g, p, m, ph) { PET_DRAW.bird(g, p, m, ph, { tailLong: 1, crest: 1 }); },
  /* 🐧 企鹅：直立摇摆 */
  penguin(g, p, mode, ph) {
    const wob = mode !== 'atk' ? ph : 0, atk = mode === 'atk';
    pxR(g, 8, 17, 3, 3, p.a); pxR(g, 13, 17, 3, 3, p.a);
    pxR(g, 8 + wob, 5, 8, 13, p.b); pxR(g, 10 + wob, 8, 4, 9, p.l);
    pxR(g, 7 + wob, 9 + ph, 2, 5, p.d); pxR(g, 15 + wob, 9 + (1 - ph), 2, 5, p.d);   // 鳍翅
    pxR(g, 9 + wob + (atk ? 1 : 0), 3, 6, 5, p.b);
    pxR(g, 12 + wob + (atk ? 1 : 0), 5, 1, 1, '#1a1a1a'); pxR(g, 14 + wob + (atk ? 1 : 0), 6, 3, atk ? 2 : 1, p.a);
  },
  /* 🦇 蝙蝠：大翅膀扇动 */
  bat(g, p, mode, ph) {
    const flap = mode === 'wander' ? ph * 2 : ph * 4, atk = mode === 'atk';
    pxR(g, 3, 8 - flap, 6, 3, p.d); pxR(g, 2, 10 - flap, 5, 3, p.d);   // 左翅
    pxR(g, 15, 8 - flap, 6, 3, p.d); pxR(g, 17, 10 - flap, 5, 3, p.d); // 右翅
    pxR(g, 9, 8, 6, 6, p.b);
    pxR(g, 10 + (atk ? 1 : 0), 5, 4, 4, p.b);
    pxR(g, 10, 3, 1, 2, p.d); pxR(g, 13, 3, 1, 2, p.d);   // 耳
    pxR(g, 11 + (atk ? 1 : 0), 6, 1, 1, '#ff4a4a');
    if (atk) pxR(g, 12 + 1, 8, 2, 1, '#fff');   // 獠牙
  },
  /* 🐝 蜂：条纹+抖翅 */
  bee(g, p, mode, ph) {
    const atk = mode === 'atk', bx = atk ? 2 : 0;
    pxR(g, 9, 5 - ph, 4, 3, '#ffffffaa'); pxR(g, 13, 5 - (1 - ph), 4, 3, '#ffffffaa');   // 翅膀
    pxR(g, 7, 9, 11, 6, p.b);
    pxR(g, 10, 9, 2, 6, p.d); pxR(g, 14, 9, 2, 6, p.d);   // 条纹
    pxR(g, 5, 11, 2, 2, p.d);   // 尾刺
    pxR(g, 17 + bx, 10, 4, 4, p.b);
    pxR(g, 19 + bx, 11, 1, 1, '#1a1a1a');
  },
  /* 🕷️ 蜘蛛：八腿交替 */
  spider(g, p, mode, ph) {
    const atk = mode === 'atk';
    for (let i = 0; i < 4; i++) {   // 八条腿（相位交替）
      const lp = (i % 2 === ph % 2 && mode !== 'wander') ? 1 : 0;
      pxR(g, 4, 6 + i * 3, 4, 1, p.d); pxR(g, 4 - lp, 6 + i * 3 - 1, 1, 3, p.d);
      pxR(g, 16, 6 + i * 3, 4, 1, p.d); pxR(g, 20 + lp, 6 + i * 3 - 1, 1, 3, p.d);
    }
    pxR(g, 8, 8, 8, 8, p.b);
    pxR(g, 15 + (atk ? 1 : 0), 10, 5, 5, p.d);
    pxR(g, 16 + (atk ? 1 : 0), 11, 1, 1, '#ff4a4a'); pxR(g, 18 + (atk ? 1 : 0), 11, 1, 1, '#ff4a4a');
  },
  /* 🦂 蝎子：钳子+翘尾刺 */
  scorpion(g, p, mode, ph) {
    const atk = mode === 'atk';
    pxR(g, 7, 12, 10, 4, p.b);
    pxR(g, 8, 16, 2, 3, p.d); pxR(g, 13, 16, 2, 3, p.d);
    pxR(g, 17, 11, 3, 2, p.d); pxR(g, 19, 10 - (atk ? 1 : 0), 3, 3, p.d);   // 钳
    if (atk) { pxR(g, 6, 5, 2, 7, p.d); pxR(g, 6, 4, 3, 2, p.a); }   // 尾刺扎下
    else { pxR(g, 4, 7, 2, 6, p.d); pxR(g, 3, 5 + ph, 3, 2, p.a); }   // 翘尾
    pxR(g, 18, 12, 1, 1, '#1a1a1a');
  },
  /* 🐍 蛇：S 形滑行吐信 */
  snake(g, p, mode, ph) {
    const atk = mode === 'atk';
    pxR(g, 4, 14, 5, 3, p.d); pxR(g, 8, 11 + ph, 5, 3, p.b); pxR(g, 12, 14, 4, 3, p.d);   // S 身
    pxR(g, 8, 12 + ph, 4, 1, p.l);
    const hx = 15 + (atk ? 3 : 0);
    pxR(g, hx, 11, 5, 5, p.b);
    pxR(g, hx + 3, 12, 1, 1, '#1a1a1a');
    if (atk || ph) pxR(g, hx + 5, 13, 3, 1, '#ff4a4a');   // 吐信
  },
  /* 🦎 蜥蜴/海豹：长身+腿 */
  lizard(g, p, mode, ph) {
    const run = mode === 'run', atk = mode === 'atk';
    pxR(g, 3, 11 + (run ? ph : 0), 5, 2, p.d);   // 尾
    pxR(g, 7, 10, 10, 5, p.b); pxR(g, 8, 13, 8, 2, p.l);
    pxR(g, 8 + (run ? ph : 0), 15, 2, 3, p.d); pxR(g, 13 + (run ? 1 - ph : 0), 15, 2, 3, p.d);
    const hx = 16 + (atk ? 2 : 0);
    pxR(g, hx, 9, 5, 4, p.b);
    pxR(g, hx + 3, 10, 1, 1, '#1a1a1a');
    if (atk) pxR(g, hx + 5, 11, 3, 1, '#ff9a4a');   // 吐舌
  },
  seal(g, p, mode, ph) {
    const bob = mode === 'wander' ? ph : 0;
    pxR(g, 3, 13 + bob - (mode === 'run' ? ph : 0), 4, 3, p.d);   // 尾鳍
    pxR(g, 6, 10 + bob, 12, 7, p.b); pxR(g, 7, 13 + bob, 10, 4, p.l);
    pxR(g, 9, 16 + bob, 3, 2, p.d);   // 前鳍
    pxR(g, 15, 6 + bob - (mode === 'atk' ? 1 : 0), 6, 6, p.b);
    pxR(g, 19, 8 + bob, 1, 1, '#1a1a1a'); pxR(g, 20, 10 + bob, 2, 1, p.d);
  },
  /* 🐢 龟：壳+探头 */
  turtle(g, p, mode, ph) {
    const atk = mode === 'atk', run = mode === 'run';
    pxR(g, 7, 9, 11, 7, p.d); pxR(g, 8, 10, 9, 5, p.a);   // 壳
    pxR(g, 10, 11, 2, 2, p.b); pxR(g, 13, 12, 2, 2, p.b);   // 壳纹
    pxR(g, 8 + (run ? ph : 0), 16, 2, 3, p.b); pxR(g, 14 + (run ? 1 - ph : 0), 16, 2, 3, p.b);
    pxR(g, 5, 13, 2, 2, p.b);   // 尾
    pxR(g, 17 + (atk ? 2 : 0), 10, 4, 4, p.b);   // 头（攻击时伸更长）
    pxR(g, 19 + (atk ? 2 : 0), 11, 1, 1, '#1a1a1a');
  },
  /* 👻 幽灵系：漂浮波浪尾（小幽灵/小雷神/终焉之影） */
  ghost(g, p, mode, ph) {
    const bob = ph, atk = mode === 'atk';
    pxR(g, 7, 5 + bob, 10, 9, p.b);
    for (let i = 0; i < 4; i++) pxR(g, 7 + i * 3, 14 + bob - ((i + ph) % 2), 2, 3, p.b);   // 波浪裙摆
    pxR(g, 7, 4 + bob, 10, 3, p.b);
    pxR(g, 10 + (atk ? 1 : 0), 8 + bob, 2, 2, '#1a1a1a'); pxR(g, 14 + (atk ? 1 : 0), 8 + bob, 2, 2, '#1a1a1a');
    if (atk) pxR(g, 12, 11 + bob, 3, 2, '#a83a3a'); else pxR(g, 12, 11 + bob, 3, 1, '#1a1a1a');
    pxR(g, 6, 7 + bob, 2, 4, p.b); pxR(g, 16, 7 + bob + (atk ? 1 : 0), 2, 4, p.b);   // 小手
  },
  /* 🐸 青蛙：大眼+弹跳 */
  frog(g, p, mode, ph) {
    const hop = mode === 'run' ? ph * 3 : 0, atk = mode === 'atk';
    pxR(g, 5, 16 - (mode === 'run' ? (1 - ph) * 2 : 0), 4, 4, p.d);   // 后腿
    pxR(g, 7, 11 - hop, 11, 6, p.b); pxR(g, 8, 14 - hop, 9, 3, p.l);
    pxR(g, 9, 6 - hop, 3, 4, p.b); pxR(g, 14, 6 - hop, 3, 4, p.b);   // 眼座
    pxR(g, 10, 7 - hop, 1, 2, '#1a1a1a'); pxR(g, 15, 7 - hop, 1, 2, '#1a1a1a');
    if (atk) pxR(g, 18, 12 - hop, 5, 1, '#ff6a6a');   // 长舌弹出
    else pxR(g, 14, 13 - hop, 3, 1, p.d);
    pxR(g, 10, 17, 3, 3, p.d);
  },
  /* 🐉 龙：有翼有角大个子（独占 24×20 全幅） */
  dragon(g, p, mode, ph) {
    const run = mode === 'run', atk = mode === 'atk', bob = mode === 'wander' ? ph : 0;
    pxR(g, 1, 10 + bob - (run ? ph : 0), 6, 3, p.d); pxR(g, 0, 9 + bob, 2, 2, p.d);   // 尾+尾鳍
    pxR(g, 5, 8 + bob, 11, 8, p.b); pxR(g, 6, 13 + bob, 9, 3, p.l);
    pxR(g, 6, 4 + bob - (mode !== 'wander' ? ph * 2 : 0), 8, 5, p.d); pxR(g, 8, 6 + bob - (mode !== 'wander' ? ph * 2 : 0), 5, 3, p.a);   // 翅膀
    pxR(g, 7 + (run ? ph : 0), 16 + bob, 2, 4 - bob, p.d); pxR(g, 12 + (run ? 1 - ph : 0), 16 + bob, 2, 4 - bob, p.d);
    const hx = 15 + (atk ? 2 : 0), hy = 5 + bob - (atk ? 1 : 0);
    pxR(g, hx, hy, 7, 6, p.b);
    pxR(g, hx + 1, hy - 2, 2, 2, p.a); pxR(g, hx + 4, hy - 2, 2, 2, p.a);   // 角
    pxR(g, hx + 6, hy + 3, 3, 2, p.d);   // 吻
    if (atk) { pxR(g, hx + 8, hy + 3, 3, 1, p.a); pxR(g, hx + 9, hy + 4, 2, 1, '#ff7a2a'); }   // 喷息
    pxR(g, hx + 4, hy + 2, 1, 1, '#1a1a1a');
  },
};
/* 🎨 70 只宠物配色表（sp=造型，b=主色，d=深色，l=浅色，a=点缀） */
const PET_PAL = {
  pet1_chick: { sp: 'chick', b: '#ffd24a', d: '#d8a02a', l: '#fff0b8', a: '#ff9a2a' },
  pet1_dog: { sp: 'dog', b: '#c8985a', d: '#8a6238', l: '#ecd0a0', a: '#8a6238' },
  pet1_hedgehog: { sp: 'hedgehog', b: '#c8a06a', d: '#6a4a2a', l: '#ecd0a0', a: '#6a4a2a' },
  pet1_frog: { sp: 'frog', b: '#6ac84a', d: '#3a8a2a', l: '#d8f0b8', a: '#3a8a2a' },
  pet1_cat: { sp: 'cat', b: '#e8a85a', d: '#b87838', l: '#f8e0b8', a: '#b87838' },
  pet1_rabbit: { sp: 'rabbit', b: '#c8b8a8', d: '#9a8a7a', l: '#f0e8e0', a: '#9a8a7a' },
  pet1_squirrel: { sp: 'squirrel', b: '#b87838', d: '#8a5428', l: '#f0d0a8', a: '#8a5428' },
  pet1_bee: { sp: 'bee', b: '#ffd24a', d: '#3a3a3a', l: '#fff0b8', a: '#ff9a2a' },
  pet1_turtle: { sp: 'turtle', b: '#5a9a4a', d: '#6a4a2a', l: '#d8f0b8', a: '#8a6a3a' },
  pet1_wolf: { sp: 'wolf', b: '#8a8a9a', d: '#5a5a6a', l: '#c8c8d8', a: '#5a5a6a' },
  pet2_snowrabbit: { sp: 'rabbit', b: '#f0f0f0', d: '#c0c0d0', l: '#ffffff', a: '#c0c0d0' },
  pet2_penguin: { sp: 'penguin', b: '#3a4a5a', d: '#22303c', l: '#f0f4f8', a: '#ff9a2a' },
  pet2_snowfox: { sp: 'fox', b: '#eef4f8', d: '#a8bcc8', l: '#ffffff', a: '#a8bcc8' },
  pet2_owl: { sp: 'owl', b: '#d8d8e0', d: '#a0a0b0', l: '#f4f4f8', a: '#e8b82a' },
  pet2_bear: { sp: 'bear', b: '#eef4f8', d: '#b0c0cc', l: '#ffffff', a: '#b0c0cc' },
  pet2_seal: { sp: 'seal', b: '#c0d4e4', d: '#8aa4bc', l: '#eef6fc', a: '#8aa4bc' },
  pet2_deer: { sp: 'deer', b: '#b89a7a', d: '#8a705a', l: '#e8d8c0', a: '#e8dcc8' },
  pet2_icewolf: { sp: 'wolf', b: '#b0d4e4', d: '#7aa8c0', l: '#e4f4fc', a: '#7aa8c0' },
  pet2_leopard: { sp: 'leopard', b: '#e4e8ec', d: '#7a8a9a', l: '#f8fafc', a: '#7a8a9a' },
  pet2_icedragon: { sp: 'dragon', b: '#8ad4e4', d: '#4a94b0', l: '#e0f4fc', a: '#c0ecf8' },
  pet3_bat: { sp: 'bat', b: '#4a3a5c', d: '#2a2038', l: '#6a5480', a: '#2a2038' },
  pet3_blackcat: { sp: 'cat', b: '#3c3c48', d: '#1c1c24', l: '#5c5c6c', a: '#e8b82a' },
  pet3_crow: { sp: 'crow', b: '#2c2c38', d: '#14141c', l: '#484858', a: '#5a5a6a' },
  pet3_scorpion: { sp: 'scorpion', b: '#5c3c4c', d: '#3a2430', l: '#7c5468', a: '#e84a6a' },
  pet3_spider: { sp: 'spider', b: '#3c2c3c', d: '#241a24', l: '#584458', a: '#241a24' },
  pet3_ghostlet: { sp: 'ghost', b: '#d0d0ec', d: '#9c9cc8', l: '#f4f4ff', a: '#9c9cc8' },
  pet3_snake: { sp: 'snake', b: '#5c4c6c', d: '#3a3048', l: '#8474a0', a: '#3a3048' },
  pet3_hound: { sp: 'dog', b: '#4c3c3c', d: '#2a2020', l: '#6c5454', a: '#e84a4a' },
  pet3_skullbird: { sp: 'crow', b: '#e0d8c8', d: '#a89c88', l: '#f8f4e8', a: '#8a7c68' },
  pet3_wraithwolf: { sp: 'wolf', b: '#5c6c8c', d: '#3a4868', l: '#8ca0c0', a: '#8fe8ea' },
  pet4_salamander: { sp: 'lizard', b: '#e85c2c', d: '#b03a18', l: '#f8a86a', a: '#ffd24a' },
  pet4_firefox: { sp: 'fox', b: '#e87a2a', d: '#b04a18', l: '#f8c88a', a: '#ffd24a' },
  pet4_lavaturtle: { sp: 'turtle', b: '#6c4c3c', d: '#382420', l: '#a87c5c', a: '#ff7a2a' },
  pet4_firehawk: { sp: 'bird', b: '#d84a2a', d: '#a02818', l: '#f89878', a: '#ffd24a' },
  pet4_flamehorse: { sp: 'horse', b: '#c04c2c', d: '#882818', l: '#e88a5c', a: '#ffb03d' },
  pet4_lavadog: { sp: 'dog', b: '#7c4c3c', d: '#4a2820', l: '#a8785c', a: '#ff7a2a' },
  pet4_firebee: { sp: 'bee', b: '#ff9a2a', d: '#38181a', l: '#ffd88a', a: '#ff4a2a' },
  pet4_flamecat: { sp: 'cat', b: '#d86c3c', d: '#a04420', l: '#f8b88a', a: '#ffd24a' },
  pet4_phoenix: { sp: 'phoenix', b: '#ff8a2a', d: '#c85018', l: '#ffd88a', a: '#ffe84a' },
  pet4_firedragon: { sp: 'dragon', b: '#c83c2c', d: '#882014', l: '#ffb03d', a: '#ff7a2a' },
  pet5_thunderbird: { sp: 'bird', b: '#4a8af2', d: '#2a56b8', l: '#a8ccf8', a: '#ffe84a' },
  pet5_eel: { sp: 'snake', b: '#4c6c9c', d: '#2a4468', l: '#ffe84a', a: '#2a4468' },
  pet5_voltfox: { sp: 'fox', b: '#8ab8f2', d: '#5688c8', l: '#d8e8fc', a: '#ffe84a' },
  pet5_stormcat: { sp: 'cat', b: '#6a8ab8', d: '#466292', l: '#b0c8e8', a: '#ffe84a' },
  pet5_thunderbear: { sp: 'bear', b: '#7a6c9c', d: '#544878', l: '#b0a4cc', a: '#ffe84a' },
  pet5_sparkrabbit: { sp: 'rabbit', b: '#b8c8f0', d: '#889ad8', l: '#e8f0ff', a: '#ffe84a' },
  pet5_voltbee: { sp: 'bee', b: '#ffe84a', d: '#3a3a3a', l: '#fff8b8', a: '#4a8af2' },
  pet5_stormeagle: { sp: 'bird', b: '#5c7cc8', d: '#38539c', l: '#acc0ec', a: '#ffe84a' },
  pet5_minithor: { sp: 'ghost', b: '#ffe84a', d: '#d8a82a', l: '#fff8b8', a: '#4a8af2' },
  pet5_thunderdragon: { sp: 'dragon', b: '#5c8ce8', d: '#3856b8', l: '#ffe84a', a: '#ffe84a' },
  pet6_voidcat: { sp: 'cat', b: '#3a2c4c', d: '#221830', l: '#584470', a: '#8a5ac8' },
  pet6_shadowbat: { sp: 'bat', b: '#2c1c38', d: '#180e22', l: '#48305c', a: '#8a5ac8' },
  pet6_voidwolf: { sp: 'wolf', b: '#4a3a5e', d: '#2c2238', l: '#6c5488', a: '#b48af2' },
  pet6_starabbit: { sp: 'rabbit', b: '#8c7cb8', d: '#645592', l: '#e8e0ff', a: '#ffd8f2' },
  pet6_darkcrow: { sp: 'crow', b: '#1e1626', d: '#100a16', l: '#382a48', a: '#8a5ac8' },
  pet6_voidbear: { sp: 'bear', b: '#3e2e4e', d: '#281e36', l: '#5c4870', a: '#b48af2' },
  pet6_shadowsnake: { sp: 'snake', b: '#4e3a5e', d: '#322344', l: '#8a5ac8', a: '#322344' },
  pet6_voidowl: { sp: 'owl', b: '#5c4a78', d: '#3c3052', l: '#b48af2', a: '#e8d8ff' },
  pet6_voiddragon: { sp: 'dragon', b: '#5c3c78', d: '#38244e', l: '#8a5ac8', a: '#b48af2' },
  pet6_endshadow: { sp: 'ghost', b: '#2c1c3c', d: '#180e24', l: '#4c3264', a: '#b48af2' },
  pet7_crystalbee: { sp: 'bee', b: '#8cd8e8', d: '#38889c', l: '#e0f8ff', a: '#ffb8f2' },
  pet7_gemturtle: { sp: 'turtle', b: '#6ab8c8', d: '#408896', l: '#c8f0f8', a: '#e0f8ff' },
  pet7_prismbird: { sp: 'bird', b: '#a8e8f0', d: '#68b4c4', l: '#e8fcff', a: '#ffb8f2' },
  pet7_crystalfox: { sp: 'fox', b: '#b8ecf4', d: '#84c4d4', l: '#ffffff', a: '#ffb8f2' },
  pet7_diamonddog: { sp: 'dog', b: '#c8f0f8', d: '#90ccd8', l: '#ffffff', a: '#e0f8ff' },
  pet7_gembat: { sp: 'bat', b: '#7ac8dc', d: '#4894a8', l: '#c0ecf8', a: '#ffb8f2' },
  pet7_leopard: { sp: 'leopard', b: '#c8ecf4', d: '#64aec4', l: '#f0fcff', a: '#64aec4' },
  pet7_lightdeer: { sp: 'deer', b: '#d8f4f0', d: '#9ccccc', l: '#ffffff', a: '#fff8d8' },
  pet7_crystaldragon: { sp: 'dragon', b: '#8ce0e8', d: '#48a4b4', l: '#e0fcff', a: '#ffb8f2' },
  pet7_prismphoenix: { sp: 'phoenix', b: '#a8f0f8', d: '#68bcd0', l: '#ffffff', a: '#ffb8e8' },
};
const PET_FRAME_CACHE = {};
function petArt(key) {
  if (PET_FRAME_CACHE[key]) return PET_FRAME_CACHE[key];
  const p = PET_PAL[key] || { sp: 'dog', b: '#c8985a', d: '#8a6238', l: '#ecd0a0', a: '#8a6238' };
  const mk = (mode, ph) => { const c = document.createElement('canvas'); c.width = 24; c.height = 20; PET_DRAW[p.sp](c.getContext('2d'), p, mode, ph); return c; };
  return PET_FRAME_CACHE[key] = { wander: [mk('wander', 0), mk('wander', 1)], run: [mk('run', 0), mk('run', 1)], atk: [mk('atk', 0), mk('atk', 1)] };
}
function petsTick(dt) {
  for (let i = 0; i < pets.length; i++) {
    const pt = pets[i];
    if (pt.dead) continue;   // 💔 倒下的趴着不动
    pt.wagT += dt; pt.atkT = Math.max(0, pt.atkT - dt); pt.animT = (pt.animT || 0) + dt;
    let tgt = null, bd = 220;
    for (const z of zombies) { if (z.dead) continue; const dd = Math.hypot(z.x - player.x, z.y - player.y); if (dd < bd) { bd = dd; tgt = z; } }
    if (tgt) {
      const dx = tgt.x - pt.x, dy = tgt.y - pt.y, d = Math.hypot(dx, dy) || 1;
      const reach = pt.range + (tgt.r || 10);
      pt.face = dx < -0.5 ? -1 : dx > 0.5 ? 1 : (pt.face || 1);
      if (d > reach) { pt.x += dx / d * 145 * dt; pt.y += dy / d * 145 * dt; if (pt.animT > 0.3) pt.state = 'run'; }
      else if (pt.atkT <= 0) {
        pt.atkT = pt.cd; pt.state = 'atk'; pt.animT = 0;   // 🗡️ 攻击动画 0.3 秒
        let dmg = pt.dmg;
        if (pt.spec === 'crit' && Math.random() < 0.25) dmg *= 2;
        tgt.hp -= dmg; tgt.flash = 0.12;
        burst(tgt.x, tgt.y - 6, '#ffd24a', 3);
        if (pt.spec === 'knock') { const kd = Math.hypot(tgt.x - player.x, tgt.y - player.y) || 1; tgt.x = Math.max(16, Math.min(WORLD.w - 16, tgt.x + (tgt.x - player.x) / kd * 40)); tgt.y = Math.max(16, Math.min(WORLD.h - 16, tgt.y + (tgt.y - player.y) / kd * 40)); }
        if (pt.spec === 'slow') tgt.slowT = Math.max(tgt.slowT || 0, 1.2);
        if (pt.spec === 'dot') { tgt.burnT = 2; tgt.burnAcc = 0; }
        if (tgt.hp <= 0) killZombie(tgt);
        beep(500 + i * 120, 700, 0.05, 'square', 0.04);
      } else if (pt.animT > 0.3) pt.state = 'wander';
    } else {
      /* 🏞️ 没怪：在主人身边 4×4 格（±64px）里随机游荡；主人跑远（>140）就狂奔追 */
      const pd = Math.hypot(player.x - pt.x, player.y - pt.y);
      if (pd > 140) { pt.wanderX = player.x + (Math.random() - 0.5) * 40; pt.wanderY = player.y + (Math.random() - 0.5) * 40; pt.restT = 0; }
      else if (pt.wanderX == null || (Math.abs(pt.x - pt.wanderX) < 4 && Math.abs(pt.y - pt.wanderY) < 4)) {
        pt.restT = (pt.restT == null ? 0 : pt.restT) - dt;
        if (pt.restT <= 0) { pt.wanderX = player.x + (Math.random() - 0.5) * 128; pt.wanderY = player.y + (Math.random() - 0.5) * 128; pt.restT = 1 + Math.random() * 2; }   // 歇 1~3 秒再溜达
      }
      const dx = pt.wanderX - pt.x, dy = pt.wanderY - pt.y, d = Math.hypot(dx, dy) || 1;
      if (d > 4) {
        const sp = pd > 140 ? 150 : 55;   // 追主人=奔跑，游荡=慢慢走
        pt.x += dx / d * sp * dt; pt.y += dy / d * sp * dt;
        pt.face = dx < -0.5 ? -1 : dx > 0.5 ? 1 : (pt.face || 1);
        pt.state = pd > 140 ? 'run' : 'wander';
      } else pt.state = 'wander';
      pt.x = Math.max(16, Math.min(WORLD.w - 16, pt.x)); pt.y = Math.max(16, Math.min(WORLD.h - 16, pt.y));
    }
    /* 🧟 怪也会咬宠物（v58）：咬一口=它咬人的伤害；被咬后半秒不再挨咬；血空倒地，下关复活 */
    pt.invT = Math.max(0, (pt.invT || 0) - dt);
    if (!townMode && pt.invT <= 0) for (const z of zombies) {
      if (z.dead || z.fake) continue;
      if (Math.hypot(z.x - pt.x, z.y - pt.y) < (z.r || 10) + 8) {
        const bite = z.boss ? 1 : (z.skel || z.crystal || z.storm ? 0.5 : 1);
        pt.hp -= bite; pt.invT = 0.5; pt.flash = 0.15;
        burst(pt.x, pt.y - 6, '#e84a4a', 5); beep(300, 150, 0.1, 'sawtooth', 0.08);
        if (pt.hp <= 0) { pt.hp = 0; pt.dead = true; setBanner('💔 ' + pt.name + ' 被打倒了……下一关复活！'); burst(pt.x, pt.y, '#9a9a9a', 10); }
        break;
      }
    }
  }
}
/* 🥷 刺客传送：到箭落点→落地无敌 0.5s→自动切最强近战（没有就发职业匕首）→一刀×2→砍完或 2 秒换回弓 */
function doAssassinTp() {
  if (!(player.job === 'assassin' && tpWindowT > 0 && tpLand)) return;
  player.x = tpLand.x; player.y = tpLand.y; tpWindowT = 0; tpLand = null;
  player.inv = Math.max(player.inv, 0.5);
  prevBow = player.weapon;
  let best = null, bestD = -1;
  for (const k in player.bought) {
    if (ALLKIND[k] !== 'weapon') continue;
    const fxk = WEAPON_FX[k] || {};
    if (fxk.bow || fxk.staff || fxk.gun) continue;   // 只挑近战
    const dps = (fxk.dmg || 1) * T(k);
    if (dps > bestD) { bestD = dps; best = k; }
  }
  if (!best) {   // 没有近战武器：发职业匕首
    if (!player.bought.assassin_dagger) { player.bought.assassin_dagger = { t: 0, w: 0 }; player.owned.assassin_dagger = true; }
    best = 'assassin_dagger';
  }
  player.weapon = best; assassinStrike = true; assassinSwapT = 2;
  burst(player.x, player.y, '#b48af2', 14); setBanner('⚡ 传送！落地一刀×2！'); beep(300, 900, 0.15, 'square', 0.16);
  saveGame();
}
document.getElementById('tpBtn').onclick = doAssassinTp;
/* 🛡️ 坦克格挡：0.5 秒举盾免疫一切（站桩），冷却 2 秒 */
function doBlock() {
  if (player.job !== 'tank' || blockCd > 0 || blockT > 0 || gameOver || paused) return;
  blockT = 0.5; blockCd = 2;
  setBanner('🛡️ 格挡！'); beep(200, 420, 0.15, 'square', 0.16);
}
document.getElementById('blockBtn').onclick = doBlock;
document.getElementById('jobSwap').onclick = () => swapJob();   // ⇄ 左上角：主副职业一键切换（箭头包一层：swapJob 在后面的文件里，点的时候才去找它）
/* 🐻 德鲁伊变熊：6 秒熊形态（攻×2.5、受伤减半），冷却 25 秒 */
let bearCd = 0;
function doBear() {
  if (player.job !== 'druid' || bearCd > 0 || player.bearT > 0 || gameOver || paused) return;
  player.bearT = 6; bearCd = 25;
  setBanner('🐻 变熊！6 秒内攻×2.5、受伤减半！'); beep(180, 420, 0.3, 'sawtooth', 0.2);
  burst(player.x, player.y, '#a06a3a', 16);
}
document.getElementById('bearBtn').onclick = doBear;
/* 🥷 刺客（v54）：状态组 */
let tpWindowT = 0, tpLand = null, prevBow = null, assassinStrike = false, assassinSwapT = 0;
/* 🐺 召唤师（v59）：狼群。8 秒补一只、上限 3、每只 6 血；怪咬狼一口 2 血；仇恨=谁打怪怪咬谁 */
let wolves = [], wolfT = 0;
function spawnWolf() {
  wolves.push({ x: player.x + (Math.random() - 0.5) * 40, y: player.y + (Math.random() - 0.5) * 40, hp: 6, atkT: 0, invT: 0, face: 1, animT: 0 });
  burst(player.x, player.y - 10, '#b48af2', 10); setBanner('🐺 狼来了！（' + wolves.length + '/3）'); beep(400, 700, 0.12, 'sine', 0.12);
}
function wolvesTick(dt) {
  if (player.job === 'summoner' && !townMode && !gameOver && !paused && wolves.length < 3) {   // 8 秒自动补员
    wolfT -= dt; if (wolfT <= 0) { wolfT = 8; spawnWolf(); }
  }
  for (let i = wolves.length - 1; i >= 0; i--) {
    const w = wolves[i];
    if (!w) continue;   // 防御：稀疏数组不炸
    if (townMode) continue;
    w.animT += dt; w.atkT = Math.max(0, w.atkT - dt); w.invT = Math.max(0, w.invT - dt);
    let tgt = null, bd = 300;
    for (const z of zombies) { if (z.dead || z.fake) continue; const dd = Math.hypot(z.x - w.x, z.y - w.y); if (dd < bd) { bd = dd; tgt = z; } }
    if (tgt) {
      const dx = tgt.x - w.x, dy = tgt.y - w.y, d = Math.hypot(dx, dy) || 1;
      w.face = dx < 0 ? -1 : 1;
      if (d > (tgt.r || 10) + 10) { w.x += dx / d * 150 * dt; w.y += dy / d * 150 * dt; }
      else if (w.atkT <= 0) {
        w.atkT = 1; tgt.hp -= 1.5; tgt.flash = 0.12; tgt.aggroW = w;   // 🐺 咬一口 1.5 血，怪转头找狼算账
        burst(tgt.x, tgt.y - 6, '#b48af2', 3); beep(500, 650, 0.05, 'square', 0.04);
        if (tgt.hp <= 0) killZombie(tgt);
      }
    } else {
      const dx = player.x - w.x, dy = player.y - w.y, d = Math.hypot(dx, dy) || 1;
      if (d > 50) { w.x += dx / d * 140 * dt; w.y += dy / d * 140 * dt; w.face = dx < 0 ? -1 : 1; }
    }
    if (w.invT <= 0) for (const z of zombies) {   // 仇恨在这只狼身上的怪咬它：一口 2 血
      if (z.dead || z.fake || z.aggroW !== w) continue;
      if (Math.hypot(z.x - w.x, z.y - w.y) < (z.r || 10) + 10) {
        w.hp -= 2; w.invT = 0.5; burst(w.x, w.y - 6, '#e84a4a', 5); beep(280, 140, 0.1, 'sawtooth', 0.08);
        if (w.hp <= 0) { wolves.splice(i, 1); setBanner('💔 一只狼被打死了……8 秒后补员'); burst(w.x, w.y, '#9a9a9a', 10); wolfT = Math.max(wolfT, 0.01); }
        break;
      }
    }
  }
}
/* ☠️ 死灵骷髅小弟：10 秒寿命，追怪咬一口 1 血（杀怪 30% 拉起来，上限 3 只） */
function minionsTick(dt) {
  for (let i = minions.length - 1; i >= 0; i--) {
    const mn = minions[i];
    if (!mn) continue;
    mn.t -= dt; mn.cd = Math.max(0, (mn.cd || 0) - dt); mn.animT = (mn.animT || 0) + dt;
    if (mn.t <= 0 || townMode) { burst(mn.x, mn.y, '#c8f4ff', 6); minions.splice(i, 1); continue; }   // 时间到化成光
    let tgt = null, bd = 320;
    for (const z of zombies) { if (z.dead || z.fake) continue; const dd = Math.hypot(z.x - mn.x, z.y - mn.y); if (dd < bd) { bd = dd; tgt = z; } }
    if (tgt) {
      const dx = tgt.x - mn.x, dy = tgt.y - mn.y, d = Math.hypot(dx, dy) || 1;
      mn.face = dx < 0 ? -1 : 1;
      if (d > (tgt.r || 10) + 8) { mn.x += dx / d * 160 * dt; mn.y += dy / d * 160 * dt; }
      else if (mn.cd <= 0) { mn.cd = 0.9; tgt.hp -= (mn.dmg || 1); tgt.flash = 0.12; burst(tgt.x, tgt.y - 6, mn.clone ? '#b8b8ff' : '#c8f4ff', 3); beep(600, 800, 0.04, 'square', 0.03); if (tgt.hp <= 0) killZombie(tgt); }   // 👥 分身用武器一半攻击力
    } else {
      const dx = player.x - mn.x, dy = player.y - mn.y, d = Math.hypot(dx, dy) || 1;
      if (d > 60) { mn.x += dx / d * 150 * dt; mn.y += dy / d * 150 * dt; mn.face = dx < 0 ? -1 : 1; }
    }
  }
}
