'use strict';
/* ================= 像素小人 & 僵尸（字符串画出来的，MC 风） ================= */
const PAL = { k:'#1a1a1a', s:'#e8b88a', h:'#5a3a1a', b:'#3a6ee8', B:'#2a4ab8', p:'#3a3a4a', a:'#1a1a1a', g:'#5aa83c', G:'#3f7a2a', d:'#2f5a1f', t:'#3a7a8a', w:'#f2f2f2', r:'#e84a4a',
  c:'#c8ccd4', e:'#eef1f6', u:'#8a6a38', i:'#7ae8f2', I:'#a8f2ff', f:'#ff9a3d', F:'#ffd24a', m:'#c8c8d8', y:'#ffe84a', n:'#d8b87a', o:'#8fd8ff', W:'#eaf8ff', R:'#a03a2a', K:'#4a90c8', S:'#e8e8e8', v:'#b48af2', V:'#d0b0ff',
  q:'#f0e6b0', Q:'#d8c884', D:'#b8a860', E:'#c8bfa0', C:'#a89878', Y:'#8ff2ea', N:'#4ac8c0', J:'#ff7a2a', j:'#a83810', O:'#ffd24a' };
/* 🗡️ 九把武器的像素真身（8×10，尖朝上，拿在手里专用） */
const WEP_SWORD = ['...XX...','...Xx...','...XX...','...XX...','...XX...','...XX...','..uuuu..','...hh...','...hh...','...hh...'];
const WEAPON_SPRITES = {
  iron_sword: WEP_SWORD.map(r => r.replace(/X/g, 'c').replace('x', 'e')),
  diamond_sword: WEP_SWORD.map(r => r.replace(/X/g, 'i').replace('x', 'I')),
  sword: WEP_SWORD.map(r => r.replace(/X/g, 'W').replace('x', 'o')),   // 光影剑：白刃蓝辉
  stick: ['...uu...','...uu...','...uk...','...uu...','...uu...','...ku...','...uu...','...uu...','...uu...','...uu...'],
  fire_rod: ['...FF...','..FfFF..','...FF...','...RR...','...RR...','...RR...','...RR...','...RR...','...RR...','...RR...'],
  mjolnir: ['.mmmmmm.','.mmmmmm.','.mymmmm.','.mmmmmm.','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  ice_bow: ['....KK..','...K..S.','..K...S.','.K....S.','.K....S.','.K....S.','..K...S.','...K..S.','....KK..','........'],
  boomerang: ['...nnn..','..nn.n..','..n.....','.nn.....','.n......','.n......','........','........','........','........'],
  gold_axe: ['...FFF..','..FF.F..','..FFF...','...h....','...h....','...h....','...h....','...h....','...h....','...h....'],
  spear: ['...cc...','...cc...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  stone_sword: WEP_SWORD.map(r => r.replace(/X/g, 'm').replace('x', 'e')),
  poison_blade: WEP_SWORD.map(r => r.replace(/X/g, 'g').replace('x', 'd')),
  fire_greatsword: ['..ffff..','..fFFf..','..ffff..','..ffff..','..ffff..','..ffff..','.uuuuuu.','...hh...','...hh...','...hh...'],
  frost_blade: WEP_SWORD.map(r => r.replace(/X/g, 'I').replace('x', 'i')),
  dual_daggers: ['..c..c..','..c..c..','..c..c..','..c..c..','..u..u..','..h..h..','..h..h..','........','........','........'],
  lightning_staff: ['...yy...','..yFFy..','...yy...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  war_hammer: ['mmmmmmmm','mmmmmmmm','mmymmymm','mmmmmmmm','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  phantom_dagger: ['...vv...','...vV...','...vv...','...vv...','..uuu...','...h....','...h....','........','........','........'],
  holy_sword: ['...ww...','...wF...','...ww...','...ww...','...ww...','...ww...','..FFFF..','...hh...','...hh...','...hh...'],
  /* ❄️ 雪原 20 把像素造型 */
  ice_spike: ['...ii...','...ii...','...i....','...i....','...i....','...i....','...i....','...i....','...i....','...i....'],
  bone_sword: WEP_SWORD.map(r => r.replace(/X/g, 'q').replace('x', 'e')),
  snow_staff: ['...ww...','..wSSw..','...ww...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  frost_fang: ['....II..','...I.I..','...I....','..I.....','..I.....','.I......','.I......','........','........','........'],
  ice_crystal_sword: WEP_SWORD.map(r => r.replace(/X/g, 'I').replace('x', 'W')),
  bone_boomerang: ['...qqq..','..qq.q..','..q.....','.qq.....','.q......','.q......','........','........','........','........'],
  frost_bow: ['....II..','...I..S.','..I...S.','.I....S.','.I....S.','.I....S.','..I...S.','...I..S.','....II..','........'],
  ice_dual: ['..i..i..','..i..i..','..i..i..','..i..i..','..u..u..','..h..h..','..h..h..','........','........','........'],
  white_spear: ['...ww...','...ww...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  frost_axe: ['...III..','..II.I..','..III...','...h....','...h....','...h....','...h....','...h....','...h....','...h....'],
  snow_dagger: ['...ww...','...wW...','...ww...','...ww...','..uuu...','...h....','...h....','........','........','........'],
  ice_staff: ['...ii...','..iIIi..','...ii...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  avalanche_hammer: ['.SSSSSS.','.SSSSSS.','.SySSSS.','.SSSSSS.','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  bone_greatsword: ['..qqqq..','..qeeq..','..qqqq..','..qqqq..','..qqqq..','..qqqq..','.uuuuuu.','...hh...','...hh...','...hh...'],
  aurora_sword: ['...gg...','...gG...','...ig...','...ig...','...gi...','...gi...','..uuuu..','...hh...','...hh...','...hh...'],
  ice_dragon: ['...ii...','..iIi...','...ii...','...RR...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  yeti_totem: ['..kkkk..','..kqqk..','..kkkk..','..qqqq..','..kkkk..','..kqqk..','..kkkk..','..qqqq..','..kkkk..','........'],
  frost_warhammer: ['IIIIIIII','IIIIIIII','IIiIIiII','IIIIIIII','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  ice_breaker: ['..IIII..','..I..I..','..IIII..','...h....','...h....','...h....','...h....','...h....','...h....','...h....'],
  eternal_winter: ['...bb...','...bI...','...bb...','...bI...','...bb...','...bI...','..uuuu..','...hh...','...hh...','...hh...'],
  /* 👻 地狱 20 把像素造型 */
  soul_dagger: ['...YY...','...YN...','...YY...','...YY...','..NNN...','...h....','...h....','........','........','........'],
  chain_sickle: ['...cc...','..c.c...','.c..c...','.c......','.m......','.m......','.m......','..m.....','..m.....','..m.....'],
  ghost_claw: ['.Y.Y.Y..','.Y.Y.Y..','.Y.Y.Y..','..YYY...','..NNN...','...h....','...h....','........','........','........'],
  soul_bell: ['...yy...','..yyyy..','..yyyy..','..yFFy..','...yy...','...F....','...uu...','...uu...','...uu...','...uu...'],
  ghostfire_staff: ['...NN...','..NffN..','...NN...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  wraith_sword: WEP_SWORD.map(r => r.replace(/X/g, 'v').replace('x', 'V')),
  hell_trident: ['.Y.Y.Y..','.Y.Y.Y..','.YYYY...','...Y....','...u....','...u....','...u....','...u....','...u....','...u....'],
  soul_eater: ['...YY...','...Yv...','...YY...','...YY...','...YY...','...YY...','..uuuu..','...hh...','...hh...','...hh...'],
  ghost_bow: ['....YY..','...Y..N.','..Y...N.','.Y....N.','.Y....N.','.Y....N.','..Y...N.','...Y..N.','....YY..','........'],
  samsara_blade: WEP_SWORD.map(r => r.replace(/X/g, 'V').replace('x', 'v')),
  banshee_staff: ['...YY...','..YNNY..','...YY...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  ghost_dual: ['..Y..Y..','..Y..Y..','..Y..Y..','..Y..Y..','..N..N..','..h..h..','..h..h..','........','........','........'],
  grudge_axe: ['...VVV..','..VV.V..','..VVV...','...h....','...h....','...h....','...h....','...h....','...h....','...h....'],
  soul_chain: ['.c..c...','..c.c...','...c....','..c.c...','.c..c...','...c....','..c.c...','.c..c...','........','........'],
  soul_breaker: ['...YY...','...YY...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  reaper_scythe: ['..SSSS..','.SS..S..','.S......','.m......','.m......','.m......','.m......','..m.....','..m.....','..m.....'],
  hellfire_blade: WEP_SWORD.map(r => r.replace(/X/g, 'f').replace('x', 'F')),
  phantom_soul: WEP_SWORD.map(r => r.replace(/X/g, 'v').replace('x', 'Y')),
  night_sword: WEP_SWORD.map(r => r.replace(/X/g, 'k').replace('x', 'm')),
  final_judge: ['...yy...','...yY...','...yy...','...yY...','...yy...','...yY...','..uuuu..','...hh...','...hh...','...hh...'],
  /* 💀🐉🧨 新三关 20 把像素造型 */
  wskel_sword: WEP_SWORD.map(r => r.replace(/X/g, 'm').replace('x', 'k')),
  coal_dagger: ['...kk...','...km...','...kk...','...kk...','..uuu...','...h....','...h....','........','........','........'],
  dark_bow: ['....vv..','...v..k.','..v...k.','.v....k.','.v....k.','.v....k.','..v...k.','...v..k.','....vv..','........'],
  bone_scythe: ['..qqqq..','.qq..q..','.q......','.Q......','.Q......','.Q......','.Q......','..Q.....','..Q.....','..Q.....'],
  wither_blade: WEP_SWORD.map(r => r.replace(/X/g, 'k').replace('x', 'm')),
  wither_staff: ['...KK...','..KvvK..','...KK...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  netherite_sword: WEP_SWORD.map(r => r.replace(/X/g, 'k').replace('x', 'R')),
  purpur_sword: WEP_SWORD.map(r => r.replace(/X/g, 'v').replace('x', 'V')),
  void_bow: ['....vv..','...v..V.','..v...V.','.v....V.','.v....V.','.v....V.','..v...V.','...v..V.','....vv..','........'],
  ender_pearl_blade: WEP_SWORD.map(r => r.replace(/X/g, 'V').replace('x', 'v')),
  end_staff: ['...vv...','..vVVv..','...vv...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  shulker_gun: ['...VV...','...VV...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  dragon_breath_blade: ['..vvvv..','..vVVv..','..vvvv..','..vvvv..','..vvvv..','..vvvv..','.uuuuuu.','...hh...','...hh...','...hh...'],
  dragon_fang: ['....WW..','...W.W..','...W....','..W.....','..W.....','.W......','.W......','........','........','........'],
  powder_dagger: ['...mm...','...me...','...mm...','...mm...','..uuu...','...h....','...h....','........','........','........'],
  tnt_stick: ['...RR...','...RR...','...Rk...','...RR...','...RR...','...kR...','...RR...','...RR...','...RR...','...RR...'],
  blast_bow: ['....ff..','...f..F.','..f...F.','.f....F.','.f....F.','.f....F.','..f...F.','...f..F.','....ff..','........'],
  fuse_blade: WEP_SWORD.map(r => r.replace(/X/g, 'y').replace('x', 'F')),
  creeper_hammer: ['gggggggg','gggggggg','ggdggdgg','gggggggg','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  titan_fist: ['dddddddd','dddddddd','ddgddgdd','dddddddd','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  /* 🌋 火山 20 把像素造型 */
  fire_sword: WEP_SWORD.map(r => r.replace(/X/g, 'f').replace('x', 'F')),
  flame_knife: ['...ff...','...fF...','...ff...','...ff...','..uuu...','...h....','...h....','........','........','........'],
  lava_hammer: ['JJJJJJJJ','JJJJJJJJ','JJjJJjJJ','JJJJJJJJ','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  fire_whip: ['.f......','..f.....','...f....','....f...','.....f..','....f...','...f....','..f.....','.f......','........'],
  obsidian_sword: WEP_SWORD.map(r => r.replace(/X/g, 'k').replace('x', 'p')),
  magma_boomerang: ['...JJJ..','..JJ.J..','..J.....','.JJ.....','.J......','.J......','........','........','........','........'],
  lava_bow: ['....JJ..','...J..f.','..J...f.','.J....f.','.J....f.','.J....f.','..J...f.','...J..f.','....JJ..','........'],
  ash_dual: ['..m..m..','..m..m..','..m..m..','..m..m..','..u..u..','..h..h..','..h..h..','........','........','........'],
  red_spear: ['...ff...','...fF...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  magma_staff: ['...JJ...','..JO O..'.replace(' ','J').replace(' ','J'),'...JJ...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  volcano_axe: ['...JJJ..','..JJ.J..','..JJJ...','...h....','...h....','...h....','...h....','...h....','...h....','...h....'],
  sulfur_dagger: ['...yy...','...yY...','...yy...','...yy...','..uuu...','...h....','...h....','........','........','........'],
  dragon_breath: ['...ff...','..fFF...','...ff...','...RR...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  inferno_sword: WEP_SWORD.map(r => r.replace(/X/g, 'J').replace('x', 'f')),
  magma_heart_blade: ['...JJ...','...JO...','...JJ...','...JO...','...JJ...','...JO...','..uuuu..','...hh...','...hh...','...hh...'],
  sky_hammer: ['JJJJJJJJ','JJJJJJJJ','JJOJJJJO','JJJJJJJJ','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  burst_hammer: ['.JJJJJJ.','.JJJJJJ.','.JfJJfJ.','.JJJJJJ.','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  corona_sword: ['...yy...','...yO...','...yy...','...yO...','...yy...','...yO...','..uuuu..','...hh...','...hh...','...hh...'],
  doom_fire_sword: WEP_SWORD.map(r => r.replace(/X/g, 'J').replace('x', 'O')),
  eternal_forge: ['...OO...','...OJ...','...OO...','...OJ...','...OO...','...OJ...','..uuuu..','...hh...','...hh...','...hh...'],
  /* ⛈️ 雷域武器 20 把 */
  spark_knife: ['...yy...','...yY...','...yy...','...yy...','..uuuu..','...hh...','...hh...','........','........','........'],
  thunder_sword: WEP_SWORD.map(r => r.replace(/X/g, 'y').replace('x', 'W')),
  gale_dagger: ['...WW...','...Ww...','...WW...','..uuuu..','...hh...','...hh...','........','........','........','........'],
  storm_spear: ['...yy...','...yY...','...yy...','...yy...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  volt_dual: ['..y..y..','..Y..Y..','..y..y..','..u..u..','..h..h..','..h..h..','........','........','........','........'],
  cloud_boomerang: ['.wwwww..','.W...W..','.W...W..','.W...W..','.wwwww..','........','........','........','........','........'],
  thunder_bow: ['..yyy...','.y..y...','y...y...','.y..y...','..yyy...','...y....','...y....','...y....','........','........'],
  sky_axe: ['..WWyy..','.WWWWy..','.WyyW...','..uWy...','..u.....','..u.....','..u.....','..u.....','........','........'],
  storm_staff: ['...yy...','..yWWy..','..yWWy..','...yy...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  lightning_blade: ['...yy...','..yy....','...yy...','..yy....','..uuuu..','...hh...','...hh...','...hh...','...hh...','...hh...'],
  volt_rifle: ['........','.yyyyyy.','.yWWWWy.','.yyyyyy.','..hh....','..hh....','........','........','........','........'],
  tempest_hammer: ['.WWWW...','.WWWW...','.yyyy...','...u....','...u....','...u....','...u....','...u....','........','........'],
  thunder_greatsword: ['...yy...','..yWWy..','..yWWy..','...yy...','...yy...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  cloud_sword: ['...ww...','..wWWw..','...ww...','...ww...','...ww...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  volt_chain_sword: ['.y.y.y..','..yWy...','.y.y.y..','..yWy...','..uuuu..','...hh...','...hh...','...hh...','...hh...','...hh...'],
  storm_caller: ['..yyyy..','.yWWWWy.','..yyyy..','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  sky_splitter: ['...WW...','..WyyW..','..WyyW..','...WW...','...WW...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  heaven_bow: ['..WWW...','.W..W...','W...W...','.W..W...','..WWW...','...W....','...W....','...W....','........','........'],
  thunder_god_hammer: ['.yyyy...','.yWWy...','.yyyy...','...u....','...u....','...u....','...u....','...u....','........','........'],
  final_storm: ['...yy...','..yWWy..','.yWWWWy.','..yWWy..','...yy...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  /* 🕳️ 虚空武器 20 把 */
  void_dagger: ['...vv...','...vV...','...vv...','..uuuu..','...hh...','...hh...','........','........','........','........'],
  dark_sword: WEP_SWORD.map(r => r.replace(/X/g, 'v').replace('x', 'k')),
  rift_blade: ['...vv...','..vVv...','...vv...','...vv...','..uuuu..','...hh...','...hh...','...hh...','...hh...','...hh...'],
  void_dual: ['..v..v..','..V..V..','..v..v..','..u..u..','..h..h..','..h..h..','........','........','........','........'],
  star_boomerang: ['.vvvvv..','.V...V..','.V...V..','.V...V..','.vvvvv..','........','........','........','........','........'],
  void_bow: ['..vvv...','.v..v...','v...v...','.v..v...','..vvv...','...v....','...v....','...v....','........','........'],
  dark_spear: ['...vv...','...vV...','...vv...','...vv...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  gravity_hammer: ['.vvvv...','.vVVv...','.vvvv...','...u....','...u....','...u....','...u....','...u....','........','........'],
  star_staff: ['...WW...','..WvvW..','..WvvW..','...WW...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  eclipse_sword: ['...vv...','..vkKv..','..vkKv..','...vv...','...vv...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  oblivion_dagger: ['...kk...','...kv...','...kk...','..uuuu..','...hh...','...hh...','........','........','........','........'],
  nebula_blade: ['...vv...','..vWv...','..vWv...','...vv...','..uuuu..','...hh...','...hh...','...hh...','...hh...','...hh...'],
  cosmic_axe: ['..vvWW..','.vvvWW..','.vWWv...','..uW....','..u.....','..u.....','..u.....','..u.....','........','........'],
  void_scythe: ['..vvvv..','.vv.....','.vv.....','..u.....','..u.....','..u.....','..u.....','..u.....','........','........'],
  void_chain: ['.v.v.v..','..vVv...','.v.v.v..','..vVv...','..uuuu..','...hh...','...hh...','...hh...','...hh...','...hh...'],
  star_bow: ['..WWW...','.W..W...','W...W...','.W..W...','..WWW...','...v....','...v....','...v....','........','........'],
  abyss_sword: ['...kk...','..kvvk..','..kvvk..','...kk...','...kk...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  dimension_blade: ['...vv...','..vKKv..','...vv...','...vv...','...vv...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  chaos_sword: ['..v.v...','.v.v.v..','..vVv...','.v.v.v..','...vv...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  final_void: ['...vv...','..vKKv..','.vKKKKv.','..vKKv..','...vv...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  /* 💎 水晶武器 20 把 */
  crystal_blade: WEP_SWORD.map(r => r.replace(/X/g, 'i').replace('x', 'W')),
  shard_dagger: ['...ii...','...iI...','...ii...','...ii...','..uuuu..','...hh...','...hh...','........','........','........'],
  prism_sword: WEP_SWORD.map(r => r.replace(/X/g, 'W').replace('x', 'i')),
  crystal_bow: ['....II..','...I..S.','..I...S.','.I....S.','.I....S.','.I....S.','..I...S.','...I..S.','....II..','........'],
  refraction_spear: ['...ii...','...iI...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  crystal_hammer: ['.iiiiii.','.iIiiIi.','.iiiiii.','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  diamond_edge: WEP_SWORD.map(r => r.replace(/X/g, 'W').replace('x', 'e')),
  laser_pen: ['........','.iiiiii.','.iWWWWi.','.iiiiii.','..hh....','..hh....','........','........','........','........'],
  rainbow_prism: WEP_SWORD.map(r => r.replace(/X/g, 'o').replace('x', 'i')),
  crystal_staff: ['...ii...','..iWWi..','...ii...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  light_blade: ['...WW...','..WW....','...WW...','..WW....','..uuuu..','...hh...','...hh...','...hh...','...hh...','...hh...'],
  star_shard_hammer: ['.IiIiIi.','.iWiWiI.','.IiIiIi.','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...','...hh...'],
  aurora_sword: WEP_SWORD.map(r => r.replace(/X/g, 'Y').replace('x', 'W')),
  crystalized_bow: ['....ii..','...i..Y.','..i...Y.','.i....Y.','.i....Y.','.i....Y.','..i...Y.','...i..Y.','....ii..','........'],
  mirror_boomerang: ['.iiiii..','.I...I..','.I...I..','.I...I..','.iiiii..','........','........','........','........','........'],
  holy_crystal_lance: ['...WW...','...Wi...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...','...uu...'],
  amethyst_sword: WEP_SWORD.map(r => r.replace(/X/g, 'V').replace('x', 'v')),
  prism_greatsword: ['..iiii..','..iIIi..','..iiii..','..iiii..','..iiii..','..iiii..','.uuuuuu.','...hh...','...hh...','...hh...'],
  cavern_lord: ['...ii...','..iWWi..','.iWWWWi.','..iWWi..','...ii...','..uuuu..','...hh...','...hh...','...hh...','...hh...'],
  glow_pick: ['...ii...','..iIi...','..uIi...','..u.i...','..u....','..u....','..u....','..u....','........','........'],
};
/* 👻 鬼魂（第三关）：青色半透明飘浮小鬼，和僵尸骷髅长得完全不一样 */
const GHOST_DOWN = [
'....YY....','..YYYYYY..','.YYYYYYYY.','.YYkYYkYY.','.YYYYYYYY.','.YYYYYYYY.','YYYYYYYYYY','YYYYYYYYYY','YYnYYnYYnY','Yn.Yn.Yn..','..n..n....','....n.....'];
/* 🌋 岩浆怪（第四关）：黑红外壳+喷亮的橙心，一蹦一停 */
const LAVA_DOWN = [
'....jj....','..jjJJjj..','.jJJJJJJj.','.jJkJJkJj.','.jJJJJJJj.','jJJJOOJJJj','jJJOOOOJJj','jJJOOOOJJj','jJJJOOJJJj','.jJJJJJJj.','..jj..jj..','........'];
const MAN_DOWN = [
'..hhhhhhhh..','.hhhhhhhhhh.','.hssssssssh.','.ssssssssss.','.skssssssks.','.ssssssssss.','..ssssssss..','..bbbbbbbb..','.bbbbbbbbbb.','.sbBbbbbBbs.','.sbbbbbbbb s'.replace(' ','.'),'..bbbbbbbb..','..pppppppp..','..ppp..ppp..','..pp....pp..','..aa....aa..'];
const MAN_UP = [
'..hhhhhhhh..','.hhhhhhhhhh.','.hhhhhhhhhh.','.hhhhhhhhhh.','.hhhhhhhhhh.','.hhhhhhhhhh.','..hhhhhhhh..','..bbbbbbbb..','.bbbbbbbbbb.','.sbBbbbbBbs.','.sbbbbbbbbs.','..bbbbbbbb..','..pppppppp..','..ppp..ppp..','..pp....pp..','..aa....aa..'];
const MAN_SIDE = [
'...hhhhhhh..','..hhhhhhhh..','..hssssssh..','..ssssssss..','..ssskssss..','..ssssssss..','...ssssss...','...bbbbbb...','..bbbbbbb...','..sBbbbbb...','..sbbbbbb...','...bbbbbb...','...pppppp...','...ppp.ppp..','...pp...pp..','...aa...aa..'];
const ZOM_DOWN = [
'..gggggggg..','.gggggggggg.','.gGggggggGg.','.gggggggggg.','.gkggggggkg.','.ggggddggg.','..gggggggg..','..tttttttt..','.tttttttttt.','.gtTttttTtg.','.gttttttttg.','..tttttttt..','..dddddddd..','..ddd..ddd..','..dd....dd..','..kk....kk..'];
const ZOM_SIDE = [
'...ggggggg..','..gggggggg..','..gGggggg...','..gggggggg..','..gggkgggg..','..ggggddg...','...gggggg...','..ttttttt...','.ttttttttt..','.gtttttttg..','.gttttttg...','..ttttttt...','...dddddd...','...ddd.ddd..','...dd...dd..','...kk...kk..'];
/* 💀 骷髅（黄偏白的骨头色）：僵尸同款骨架换个皮 */
const SKEL_MAP = { g: 'q', G: 'Q', d: 'D', t: 'E', T: 'C' };
const skelize = spr => spr.map(row => row.split('').map(ch => SKEL_MAP[ch] || ch).join(''));
const SKEL_DOWN = skelize(ZOM_DOWN), SKEL_SIDE = skelize(ZOM_SIDE);
function drawSprite(ctx, spr, x, y, px, flip) {
  for (let r = 0; r < spr.length; r++) for (let c = 0; c < spr[r].length; c++) {
    const ch = spr[r][flip ? spr[r].length - 1 - c : c];
    if (ch === '.') continue;
    ctx.fillStyle = PAL[ch] || '#f0f';
    ctx.fillRect(x + c * px, y + r * px, px, px);
  }
}
/* 🎨 玩家专用绘制：皮肤调色板覆盖（捏人系统——skin={h头发 s皮肤 b衣服 p裤子 a鞋子}，B=衣服暗纹自动加深） */
function darkenHex(hex) {   // 颜色加深 30%（衣服暗纹）
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.round(v * 0.7));
  return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function drawPlayerSpr(ctx, spr, x, y, px, flip, skin) {
  const sk = skin || {};
  for (let r = 0; r < spr.length; r++) for (let c = 0; c < spr[r].length; c++) {
    const ch = spr[r][flip ? spr[r].length - 1 - c : c];
    if (ch === '.') continue;
    ctx.fillStyle = ch === 'B' ? (sk.B || darkenHex(sk.b || PAL.b)) : (sk[ch] || PAL[ch] || '#f0f');
    ctx.fillRect(x + c * px, y + r * px, px, px);
  }
}
/* 👹 BOSS 预渲染：10 倍僵尸大（120×160），头顶红角；第二关=骷髅王 */
const BOSS_CANVAS = document.createElement('canvas'); BOSS_CANVAS.width = 120; BOSS_CANVAS.height = 172;
const BOSS_SKEL_CANVAS = document.createElement('canvas'); BOSS_SKEL_CANVAS.width = 120; BOSS_SKEL_CANVAS.height = 172;
function paintBoss(bctx, spr) {
  drawSprite(bctx, spr, 0, 12, 10, false);
  bctx.fillStyle = '#c03a3a';   // 红角
  bctx.fillRect(20, 0, 16, 16); bctx.fillRect(52, 0, 16, 20); bctx.fillRect(84, 0, 16, 16);
}
paintBoss(BOSS_CANVAS.getContext('2d'), ZOM_DOWN);
paintBoss(BOSS_SKEL_CANVAS.getContext('2d'), SKEL_DOWN);
/* 👻 鬼王预渲染：青色大鬼+幽冥紫冠 */
const BOSS_GHOST_CANVAS = document.createElement('canvas'); BOSS_GHOST_CANVAS.width = 120; BOSS_GHOST_CANVAS.height = 172;
{
  const gctx = BOSS_GHOST_CANVAS.getContext('2d');
  drawSprite(gctx, GHOST_DOWN, 10, 32, 10, false);
  gctx.fillStyle = '#8a5ac8'; gctx.fillRect(35, 8, 50, 14); gctx.fillRect(40, 0, 8, 12); gctx.fillRect(56, -2, 8, 14); gctx.fillRect(72, 0, 8, 12);   // 👑 幽冥冠
  gctx.fillStyle = '#8ff2ea'; gctx.fillRect(54, 10, 12, 8);
}
/* 🌋 熔岩魔王预渲染：大号岩浆怪+黑曜王冠 */
const BOSS_LAVA_CANVAS = document.createElement('canvas'); BOSS_LAVA_CANVAS.width = 120; BOSS_LAVA_CANVAS.height = 172;
{
  const lctx = BOSS_LAVA_CANVAS.getContext('2d');
  drawSprite(lctx, LAVA_DOWN, 10, 32, 10, false);
  lctx.fillStyle = '#2a2a2a'; lctx.fillRect(35, 8, 50, 14); lctx.fillRect(40, 0, 8, 12); lctx.fillRect(56, -2, 8, 14); lctx.fillRect(72, 0, 8, 12);
  lctx.fillStyle = '#ff7a2a'; lctx.fillRect(54, 10, 12, 8);   // 王冠上的熔岩宝石
}
/* ⛈️ 雷云精（白云+闪电+眼睛） */
const STORM_DOWN = [
  '....ww....',
  '..wwwwww..',
  '.wWWWWWWw.',
  '.WWkWWkWW.',
  '.WWWWWWWW.',
  '.WWyWWyWW.',
  '..WWyyWW..',
  '...WWWW...',
  '....yy....',
  '...y..y...',
  '..........',
  '..........',
];
/* 🕳️ 虚空行者（暗紫细高个+白眼） */
const VOID_DOWN = [
  '...vvvv...',
  '..vVVVVv..',
  '..VkVVkV..',
  '..vVVVVv..',
  '..vVVVVv..',
  '...VVVV...',
  '...vVVv...',
  '..vVvvVv..',
  '..vV..Vv..',
  '..vV..Vv..',
  '..v....v..',
  '..v....v..',
  '...v..v...',
  '..........',
];
/* ⛈️ 雷霆法王预渲染：大号雷云精+雷电王冠 */
const BOSS_STORM_CANVAS = document.createElement('canvas'); BOSS_STORM_CANVAS.width = 120; BOSS_STORM_CANVAS.height = 172;
{
  const sctx = BOSS_STORM_CANVAS.getContext('2d');
  drawSprite(sctx, STORM_DOWN, 10, 32, 10, false);
  sctx.fillStyle = '#e8c23d'; sctx.fillRect(35, 8, 50, 14); sctx.fillRect(40, 0, 8, 12); sctx.fillRect(56, -2, 8, 14); sctx.fillRect(72, 0, 8, 12);
  sctx.fillStyle = '#ffe84a'; sctx.fillRect(54, 10, 12, 8);   // 王冠上的雷电宝石
}
/* 🕳️ 虚空主宰预渲染：大号虚空行者+星辰王冠 */
const BOSS_VOID_CANVAS = document.createElement('canvas'); BOSS_VOID_CANVAS.width = 120; BOSS_VOID_CANVAS.height = 172;
{
  const vctx = BOSS_VOID_CANVAS.getContext('2d');
  drawSprite(vctx, VOID_DOWN, 10, 32, 10, false);
  vctx.fillStyle = '#4a3a72'; vctx.fillRect(35, 8, 50, 14); vctx.fillRect(40, 0, 8, 12); vctx.fillRect(56, -2, 8, 14); vctx.fillRect(72, 0, 8, 12);
  vctx.fillStyle = '#ffffff'; vctx.fillRect(54, 10, 12, 8);   // 王冠上的星辰宝石
}
/* 💠 激光怪（晶亮小飞虫，黑眼水晶身） */
const CRYSTAL_DOWN = [
  '..........',
  '..i....i..',
  '..Ii..iI..',
  '...IiiI...',
  '..IiIIiI..',
  '..IkIIkI..',
  '..IiIIiI..',
  '...IiiI...',
  '..i.ii.i..',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
/* 💎 水晶魔王预渲染：大号激光怪+水晶王冠 */
const BOSS_CRYSTAL_CANVAS = document.createElement('canvas'); BOSS_CRYSTAL_CANVAS.width = 120; BOSS_CRYSTAL_CANVAS.height = 172;
{
  const cctx = BOSS_CRYSTAL_CANVAS.getContext('2d');
  drawSprite(cctx, CRYSTAL_DOWN, 10, 32, 10, false);
  cctx.fillStyle = '#a8f2ff'; cctx.fillRect(35, 8, 50, 14); cctx.fillRect(40, 0, 8, 12); cctx.fillRect(56, -2, 8, 14); cctx.fillRect(72, 0, 8, 12);
  cctx.fillStyle = '#ffffff'; cctx.fillRect(54, 10, 12, 8);   // 王冠上的大水晶
}
/* 武器预渲染成离屏小画布（旋转不失真；光影剑带蓝辉光） */
const WEAPON_CANVAS = {};
for (const key in WEAPON_SPRITES) {
  const oc = document.createElement('canvas'); oc.width = 16; oc.height = 20;
  const octx = oc.getContext('2d');
  if (key === 'sword') { octx.shadowColor = '#8fd8ff'; octx.shadowBlur = 5; }
  drawSprite(octx, WEAPON_SPRITES[key], 0, 0, 2, false);
  WEAPON_CANVAS[key] = oc;
}
WEAPON_CANVAS.assassin_dagger = WEAPON_CANVAS.stone_sword;   // 🥷 职业匕首先用石剑贴图
WEAPON_CANVAS.wood_sword = WEAPON_CANVAS.stone_sword;   // ⚔️ 木剑也先用石剑贴图
