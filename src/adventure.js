'use strict';
/* 第十四关、采集制作、房内装修：沿用单页状态、Canvas 和原生 DOM。 */
let resourceMaps = {}, travelReturn = null, furniturePick = null;
let miningT = 0, gatherSendT = 0, combatSignature = '', remoteGatherClock = 0;
function currentResources() {
  if (townMode || skyMode || inRoom) return [];
  const key = currentMapId();
  if (coopMode === 'client') return resourceMaps[key] || [];
  if (!resourceMaps[key]) {
    const blocked = [...mapShops.map(s=>({x:s.x,y:s.y,r:100})), ...(deco||[]).map(d=>({x:d.x,y:d.y,r:30})), {x:1200,y:1200,r:90}];
    if(portal) blocked.push({...portal,r:90});
    if(dungeonMode)blocked.push({...DGN_GATE,r:120});
    resourceMaps[key] = generateResources(key, level, WORLD.w, WORLD.h, blocked);
  }
  return resourceMaps[key];
}
function receiveResources(rs) { resourceMaps[currentMapId()] = rs.map(r=>({...r})); }
function nearestResource(p=player) {
  return currentResources().find(r=>!r.done && Math.hypot(r.x-p.x,r.y-p.y)<58 && Math.abs(Math.atan2(Math.sin(Math.atan2(r.y-p.y,r.x-p.x)-p.dir),Math.cos(Math.atan2(r.y-p.y,r.x-p.x)-p.dir)))<1.5);
}
function rewardGather(r,p,seconds,hit) {
  const n = gatherResource(r,p,seconds,hit);
  if (n) { burst(r.x,r.y,'#b8e8a8',12);setBanner(`采到 ${MATERIALS[r.kind].name} ×${n}`); saveGame(); }
  return n;
}
function gatherAttack() {
  const r=nearestResource(); if(!r)return;
  if(r.kind==='iron') { miningT=.3; return; }
  if(coopMode==='client') { netSendCoop({type:'gather',id:r.id,hit:true}); return; }
  rewardGather(r,player,0,true); if(coopMode==='host')coopSendSnap(true);
}
function hostGather(o) {
  if(coopMode!=='host'||!sameMap(o)||!pvpFoe||!sameMap(pvpFoe))return;
  const r=currentResources().find(r=>r.id===o.id);if(!r||r.done||Math.hypot(r.x-pvpFoe.x,r.y-pvpFoe.y)>60)return;
  const now=performance.now(),elapsed=Math.min(.25,Math.max(0,(now-remoteGatherClock)/1000));
  if (now-remoteGatherClock<150) return;
  remoteGatherClock=now;
  const pocket={items:{}};const n=rewardGather(r,pocket,r.kind==='iron'?elapsed:0,!!o.hit);
  if(n) netSendCoop({type:'resourceReward',id:r.id,kind:r.kind,n});
  coopSendSnap(true);
}
function receiveResourceReward(o) {
  player.items=player.items||{};
  player.resourceReceipts=player.resourceReceipts||{};
  if(player.resourceReceipts[o.id]||!MATERIALS[o.kind])return;
  player.resourceReceipts[o.id]=true;player.items[o.kind]=(player.items[o.kind]||0)+o.n;
  setBanner(`采到 ${MATERIALS[o.kind].name} ×${o.n}`); saveGame();
}
function adventureTick(dt) {
  miningT=Math.max(0,miningT-dt);gatherSendT-=dt;
  for(const r of currentResources())r.anim=Math.max(0,(r.anim||0)-dt);
  const r=nearestResource();
  if(r&&r.kind==='iron'&&!gameOver&&!(player.frozenT>0)&&!(player.tpT>0)&&blockT<=0&&!(coopMode==='client'&&coopDownT>0)&&(miningT>0||holdAtk||autoOn)) {
    r.anim=.2;
    if(coopMode==='client') { if(gatherSendT<=0){gatherSendT=.2;netSendCoop({type:'gather',id:r.id});} }
    else {const n=rewardGather(r,player,dt,false);if(n&&coopMode==='host')coopSendSnap(true);}
  }
  for(const f of Object.values(player.furniture||{}))f.active=Math.max(0,(f.active||0)-dt);
}
function updatePiglin(z,dt) {
  const target=coopTarget(z), hits=piglinTick(z,target,dt);
  for(const h of hits) {
    const affected=h.cast?[player,...(coopMode==='host'&&pvpFoe&&sameMap(pvpFoe)&&!pvpFoe.down?[pvpFoe]:[])].filter(p=>insideSword(h.cast,p)):[target];
    for(const p of affected) {
      if(p!==player){if(p===pvpFoe)netSendCoop({type:'hurtYou',dmg:h.damage});else p.hp=Math.max(0,p.hp-h.damage);continue;}
      if(player.inv>0||player.tpT>0)continue;
      player.hearts-=rollDmg(h.damage);player.inv=.8;player.sinceHurt=0;player.regenT=0;
      burst(player.x,player.y,'#ffd24a',12);shakeT=.25;
      if(player.hearts<=0&&!angelSave()){gameOver=true;document.getElementById('overScore').textContent='猪灵堡垒：击败 '+kills+' 只怪物';if(coopMode==='host'){netSendCoop({type:'fail',msg:'房主倒下了，合作挑战结束'});setTimeout(()=>{leaveCoop();openLobby();},2000);}}
    }
  }
}
function flushCombat() {
  if(coopMode!=='host')return;
  const signature=currentMapId()+zombies.map(z=>`${z.id}:${z.hp}:${z.dead}:${z.axeWind!=null}:${(z.swordCasts||[]).map(c=>c.id+':'+c.landed).join(',')}`).join('|');
  if(signature!==combatSignature){combatSignature=signature;coopSendSnap(true);}
}
function drawGoldBlade(x,y,angle,scale=1,axe=false) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  ctx.fillStyle='#80502a';ctx.fillRect(-2,0,4,15);ctx.fillStyle='#ffd24a';
  if(axe){ctx.fillRect(-10,-12,20,9);ctx.fillRect(-12,-10,5,14);ctx.fillRect(7,-10,5,14);}
  else {ctx.fillRect(-3,-30,6,31);ctx.fillRect(-7,-2,14,4);ctx.fillStyle='#fff0a8';ctx.fillRect(-1,-27,2,26);}
  ctx.restore();
}
function drawPiglin(z) {
  const s=z.piglinKing?3.2:1.4,bob=Math.abs(Math.sin(z.walkT*6))*2;
  // 使用人物同款逐块头/身/摆腿语言；肉脸与金甲分别着色，武器另画。
  ctx.save();ctx.translate(Math.round(z.x),Math.round(z.y-bob));ctx.scale(s,s);
  ctx.fillStyle=z.flash>0?'#fff':'#d8a830';ctx.fillRect(-6,-14,12,10);ctx.fillRect(-9,-14,3,12);ctx.fillRect(6,-14,3,12);
  ctx.fillStyle='#f0b8a0';ctx.fillRect(-6,-25,12,11);ctx.fillRect(-9,-25,3,6);ctx.fillRect(6,-25,3,6);
  ctx.fillStyle='#b8766a';ctx.fillRect(-3,-19,6,4);ctx.fillStyle='#222';ctx.fillRect(-4,-23,2,2);ctx.fillRect(2,-23,2,2);
  ctx.fillStyle='#91652a';const step=Math.sin(z.walkT*8)*2;ctx.fillRect(-6,-4,5,7+step);ctx.fillRect(1,-4,5,7-step);
  ctx.restore();
  drawGoldBlade(z.x+10*s,z.y-10*s,z.axeWind!=null?-1.4:z.axeFx>0?1.4:.35,s*.75,!z.piglinKing);
  if(z.axeWind!=null){ctx.strokeStyle='#ff7050';ctx.lineWidth=3;ctx.strokeRect(z.x-48,z.y-48,96,96);}
  ctx.fillStyle='#0008';ctx.fillRect(z.x-18*s,z.y-31*s,36*s,4);ctx.fillStyle='#ef5a4a';ctx.fillRect(z.x-18*s,z.y-31*s,36*s*Math.max(0,z.hp/z.maxHp),4);
  for(const c of z.swordCasts||[]) {
    const size=c.size;ctx.save();ctx.globalAlpha=c.landed?.5:.22+.12*Math.sin(performance.now()/80);ctx.fillStyle=c.landed?'#ffe84a':'#ff543a';ctx.fillRect(c.x-size/2,c.y-size/2,size,size);ctx.restore();
    ctx.strokeStyle='#ffd24a';ctx.lineWidth=2;ctx.strokeRect(c.x-size/2,c.y-size/2,size,size);
    if(!c.landed){ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.fillText(`${c.kind==='swordRain'?'万剑归宗 · 25剑':'大剑'} ${Math.max(0,c.remaining).toFixed(1)}s`,c.x-size/2,c.y-size/2-8);}
    const falling=c.landed?0:Math.min(180,Math.max(0,c.remaining)*160);
    for(const blade of c.swords)drawGoldBlade(c.x+blade.dx,c.y+blade.dy-falling,Math.PI, c.kind==='greatSword'?3:1);
  }
}
function drawAdventureWorld() {
  if(level===14&&!townMode&&!skyMode&&!dungeonMode){
    ctx.fillStyle='#8a632b';for(let x=80;x<WORLD.w;x+=160){ctx.fillRect(x,55,70,25);ctx.fillRect(x,WORLD.h-80,70,25);}
    ctx.strokeStyle='#b8903a';ctx.lineWidth=2;for(let x=0;x<WORLD.w;x+=80)for(let y=0;y<WORLD.h;y+=80)ctx.strokeRect(x,y,80,80);
  }
  for(const r of currentResources())if(!r.done){
    const d=MATERIALS[r.kind],wob=r.anim>0?Math.sin(performance.now()/35)*3:0;
    ctx.fillStyle=r.kind==='iron'?'#667888':r.kind==='soul_grass'?'#69d8b8':'#8a9a4a';
    if(r.kind==='iron'){ctx.fillRect(r.x-12+wob,r.y-12,24,20);ctx.fillStyle='#c8d8e8';ctx.fillRect(r.x-7+wob,r.y-9,6,6);ctx.fillRect(r.x+3+wob,r.y-3,5,5);}
    else{ctx.fillRect(r.x-2+wob,r.y-19,4,21);ctx.fillRect(r.x-12+wob,r.y-15,11,5);ctx.fillRect(r.x+2+wob,r.y-10,11,5);}
    if(Math.hypot(player.x-r.x,player.y-r.y)<100){ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText(d.name+(r.kind==='iron'?' · 按住攻击 '+r.progress.toFixed(1)+'/4秒':' · 攻击 '+r.hits+'/'+(r.kind==='soul_grass'?1:3)),r.x-40,r.y-28);}
    if(r.anim>0){ctx.fillStyle='#ffd24a';ctx.fillRect(r.x+12+wob,r.y-18,4,4);}
  }
  if(townMode&&inRoom)for(const [k,f] of Object.entries(player.furniture||{})){
    const d=FURNITURE[k];if(!d)continue;const active=f.active>0,t=performance.now()/130;
    ctx.save();ctx.translate(f.x,f.y);if(active){ctx.rotate(Math.sin(t+(f.phase||0))*.15);ctx.translate(0,Math.sin(t)*4);}
    ctx.fillStyle=d.color;ctx.fillRect(-14,-16,28,24);ctx.fillStyle='#5a3a22';ctx.fillRect(-12,8,4,5);ctx.fillRect(8,8,4,5);
    ctx.font='22px sans-serif';ctx.textAlign='center';ctx.fillText(d.icon,0,2);ctx.restore();ctx.textAlign='left';
    if(active){ctx.strokeStyle=d.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,22+Math.sin(t)*5,0,6.3);ctx.stroke();}
  }
  if(furniturePick&&inRoom){ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.fillText('点房内空地摆放：'+FURNITURE[furniturePick].name,1000,1440);}
}
function makePanel(id,title){const el=document.createElement('div');el.id=id;el.className='adventurePanel';el.innerHTML=`<div class="adventureCard"><h2>${title}</h2><div id="${id}List" class="adventureList"></div><p id="${id}Status" role="status"></p><button id="${id}Close">返回游戏</button></div>`;document.getElementById('rot').appendChild(el);document.getElementById(id+'Close').onclick=()=>{el.style.display='none';paused=false;};return el;}
const craftPanel=makePanel('craft','⚒️ 制作与炼药'),decoratePanel=makePanel('decorate','🏠 安居 · 装修目录');
function renderCraft(){let h='';for(const station of [false,true]){h+=`<h3>${station?'⚗️ 炼药（需要制药台）':'⚒️ 合成'}</h3>`;for(const [k,r] of Object.entries(RECIPES)){if(!!r.station!==station)continue;const d=ALLITEMS[k];const ready=(!r.station||player.bought.alchemy_table)&&Object.entries(r.cost).every(([m,n])=>(player.items[m]||0)>=n)&&!(r.kind!=='use'&&player.bought[k]);h+=`<div class="shopIt"><div>${d.icon} ${d.name}<div class="ds">${Object.entries(r.cost).map(([m,n])=>MATERIALS[m].name+' '+(player.items[m]||0)+'/'+n).join(' · ')}<br>${r.station&&!player.bought.alchemy_table?'🔒 尚未拥有制药台':ready?'可以制作':player.bought[k]&&r.kind!=='use'?'已拥有':'材料不足'}</div></div><button data-craft="${k}" ${ready?'':'disabled'}>制作</button></div>`;}}document.getElementById('craftList').innerHTML=h;document.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>{const result=craftResult(player,b.dataset.craft);document.getElementById('craftStatus').textContent=result.message+' · '+ALLITEMS[b.dataset.craft].name;if(result.ok){applyGear();saveGame();renderCraft();}});}
function openCraft(){toggleGear(false);paused=true;renderCraft();craftPanel.style.display='flex';}
function renderDecorate(){document.getElementById('decorateList').innerHTML=Object.entries(FURNITURE).map(([k,d])=>`<div class="shopIt"><div>${d.icon} ${d.name}<div class="ds">${d.price} 金币 · 点击有动画</div></div><button data-furniture="${k}">${(player.furniture||{})[k]?'摆放':`购买 ${d.price}金`}</button></div>`).join('');document.querySelectorAll('[data-furniture]').forEach(b=>b.onclick=()=>buyFurniture(b.dataset.furniture));}
function openDecorate(){toggleShop(false);paused=true;renderDecorate();decoratePanel.style.display='flex';}
function buyFurniture(key){if(!ownedHouse){document.getElementById('decorateStatus').textContent='请先向安居购买房屋';return false;}let result={ok:true};if(!(player.furniture||{})[key])result=purchaseFurniture(player,key);document.getElementById('decorateStatus').textContent=result.message||'已选中家具';if(!result.ok)return false;updateGold();saveGame();furniturePick=key;decoratePanel.style.display='none';townMode=true;skyMode=false;inRoom=true;paused=false;player.x=1200;player.y=1350;setBanner('点击房内空地摆放；点已有家具互动，设置→装修可重摆');return true;}
// 真实指针坐标与游戏旋转/缩放/相机使用同一换算。
cv.addEventListener('pointerdown',e=>{
  if(!townMode||!inRoom||paused)return;
  const rect=cv.getBoundingClientRect(),Z=ZOOMS[zoomLv];let sx=e.clientX-rect.left,sy=e.clientY-rect.top;
  if(rotated){sx=e.clientY;sy=innerWidth-e.clientX;}
  const x=sx/Z+Math.max(0,Math.min(WORLD.w-VW/Z,player.x-VW/Z/2)),y=sy/Z+Math.max(0,Math.min(WORLD.h-VH/Z,player.y-VH/Z/2));
  if(furniturePick){if(placeFurniture(player,furniturePick,x,y)){setBanner('家具摆好了！');furniturePick=null;saveGame();}else setBanner('请点房内空地，避开门、床、柜子和其他家具');return;}
  for(const [k,f] of Object.entries(player.furniture||{}))if(Math.hypot(f.x-x,f.y-y)<24){setBanner(FURNITURE[k].interact(f));beep(350+f.phase*40,800,.15,'sine',.1);saveGame();return;}
});
function beginTravel(destination){
  toggleGear(false);
  if(!travelReturn && !townMode && !skyMode){saveGame();travelReturn={...packSave(),travelReturn:null};}
  if(destination==='town')enterTown();
  else {skyMode=true;townMode=false;dungeonMode=false;inRoom=false;towerMode=false;paused=false;fishState=null;bobber=null;zombies=[];earrows=[];parrows=[];garrows=[];meteors=[];puddles=[];skillShots=[];clouds=[];fxLines=[];shocks=[];portal=null;mapShops=[];chest=null;player.x=1200;player.y=1800;applyGear();updateScore();setBanner('☁️ 天空城：南边钓鱼，北边卖鱼；设置→返回冒险');saveGame();}
  if(coopMode)coopWrite();if(pvpMode)pvpWrite();
}
function returnTravel(){
  toggleGear(false);
  if(travelReturn){const s=travelReturn;const housing={ownedHouse,storage};const activeSkills=skillSlots.slice(),activePets=pets.map(p=>p.key);const carried={gold:player.gold,items:player.items,bought:player.bought,owned:player.owned,furniture:player.furniture,diamonds:player.diamonds,weapon:player.weapon,resourceReceipts:player.resourceReceipts};travelReturn=null;applySave({...s,travelReturn:null});Object.assign(player,carried);ownedHouse=housing.ownedHouse;storage=housing.storage;skillSlots=activeSkills;pets=[];for(const k of activePets)addPet(k);renderSkills();applyGear();player.hearts=Math.min(player.hearts,player.maxHearts);}
  else {skyMode=false;exitTown();}
  paused=false;saveGame();if(coopMode)coopWrite();if(pvpMode)pvpWrite();
}
for(const [id,label,fn] of [['gearSky','☁️ 进入天空城',()=>beginTravel('sky')],['gearCraft','⚒️ 制作',openCraft],['gearDecorate','🪑 装修',()=>{toggleGear(false);openDecorate();}],['gearReturn','⚔️ 返回冒险',returnTravel]]){const b=document.createElement('button');b.id=id;b.textContent=label;b.onclick=fn;document.getElementById('gearCard').appendChild(b);}
document.getElementById('gearTown').textContent='🏡 进入小镇';document.getElementById('gearTown').onclick=()=>beginTravel('town');document.getElementById('gearFight').onclick=returnTravel;
document.querySelectorAll('[data-anchor]').forEach(b=>b.onclick=()=>{const target=document.getElementById('bag-'+b.dataset.anchor);if(target)target.scrollIntoView({block:'start',behavior:'instant'});});
for(const [k,fx] of Object.entries({...FORT_WEAPONS,iron_axe:WEAPON_FX.iron_axe})) {
  const c=document.createElement('canvas');c.width=20;c.height=40;const g=c.getContext('2d');
  g.fillStyle='#80502a';g.fillRect(8,27,4,12);g.fillStyle=fx.color;g.fillRect(fx.bow?3:7,2,fx.bow?4:6,27);g.fillRect(3,25,14,4);
  if(fx.kbMul){g.fillRect(1,4,18,10);}if(fx.staff){g.fillRect(3,1,14,10);}if(fx.gun){g.fillRect(1,4,18,22);}WEAPON_CANVAS[k]=c;
}
DEX_LIST.push(['piglin','🐷','猪灵','金斧前摇0.65秒，3秒一次，3伤'],['boss14','⚔️','猪灵剑神','1000血；大剑与25剑雨']);
const renderDexOriginal=renderDex;
renderDex=function(){renderDexOriginal();dexList.innerHTML+='<div class="shopSec">猪灵堡垒收藏 · 80 件</div>'+Object.entries(SHOP14).map(([k,d])=>`<div class="slot"><div class="inf">${d.icon} ${d.name} · ${player.bought[k]?'已收藏':'未收藏'}<br>${d.desc}</div></div>`).join('');};

// 输入事件中就提交挥击/血量，不等周期快照或下一帧。
const attackWithCombat = doAttack;
doAttack = function (...args) {
  try { return attackWithCombat(...args); }
  finally { if(coopMode==='host')flushCombat();if(coopMode)coopWrite();if(pvpMode)pvpWrite(); }
};
