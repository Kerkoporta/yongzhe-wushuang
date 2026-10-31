'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {gameContext}=require('./helpers/game-context.cjs');

test('skin selector accepts normal/stickman, keeps colors and rejects unknown forms',()=>{
 const c=gameContext();c.run("closeHome();player.skin.b='#e84a4a';selectSkinModel('stickman');");
 assert.equal(c.run('player.skin.model'),'stickman');assert.equal(c.run('player.skin.b'),'#e84a4a');
 c.run("selectSkinModel('not-a-skin');");assert.equal(c.run('player.skin.model'),'stickman');
 c.run("selectSkinModel('normal');");assert.equal(c.run('player.skin.model'),'normal');assert.equal(c.run('player.skin.b'),'#e84a4a');
});

test('stickman has distinct front back left right poses with a real alternating gait',()=>{
 const c=gameContext();const pose=(dir,moving,walkT)=>JSON.parse(c.run(`JSON.stringify(stickmanPose({dir:${dir},moving:${moving},walkT:${walkT}}))`));
 const dirs=[Math.PI/2,-Math.PI/2,Math.PI,0];
 assert.deepEqual(dirs.map(dir=>pose(dir,true,.1).facing),['down','up','left','right']);
 for(const dir of dirs){assert.notDeepEqual(pose(dir,true,.1).paths,pose(dir,true,.4).paths);assert.deepEqual(pose(dir,false,.1),pose(dir,false,.4));}
 assert.notDeepEqual(pose(Math.PI/2,true,.1),pose(-Math.PI/2,true,.1));
});

test('stickman attacks move arms and torso in every facing direction',()=>{
 const c=gameContext();
 for(const dir of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const snapshot=expr=>JSON.parse(c.run(`JSON.stringify(stickmanPose({dir:${dir},${expr}}))`));
  assert.notDeepEqual(snapshot('atkT:0').hand,snapshot('atkT:ATTACK.swing*.8').hand);
  assert.notDeepEqual(snapshot('atkT:ATTACK.swing*.8').paths,snapshot('atkT:ATTACK.swing*.2').paths);
 }
});

test('actual player rendering receives walking and attack timing; seated stays stickman',()=>{
 const c=gameContext();c.run(`closeHome();zombies=[];player.skin.model='stickman';player.inv=0;player.moving=true;player.dir=Math.PI;player.walkT=.4;var poses=[];var rawStick=drawStickman;drawStickman=(...args)=>{poses.push(args[4]);rawStick(...args)};draw();`);
 assert.equal(c.run('poses[poses.length-1].moving'),true);assert.equal(c.run('poses[poses.length-1].dir'),Math.PI);
 c.run('player.cd=0;doAttack();draw();');assert.ok(c.run('poses[poses.length-1].atkT>0'));
 c.run('TownArt.drawSeated(1200,1200,1,player.skin);');assert.equal(c.run('poses[poses.length-1].seated'),true);
});

test('model saves round-trip and legacy color-only or unknown skins become normal',()=>{
 const c=gameContext();c.run(`closeHome();player.skin.model='stickman';var savedSkin=JSON.parse(JSON.stringify(packSave()));applySave(savedSkin);`);assert.equal(c.run('player.skin.model'),'stickman');
 c.run("savedSkin.skin={b:'#e84a4a'};applySave(savedSkin);");assert.equal(c.run('player.skin.model'),'normal');assert.equal(c.run('player.skin.b'),'#e84a4a');
 c.run("savedSkin.skin.model='unknown';applySave(savedSkin);");assert.equal(c.run('player.skin.model'),'normal');
});

test('coop state carries stickman model and attack phase without touching stats',()=>{
 const c=gameContext();c.run(`closeHome();coopMode='client';coopId='skin';player.skin.model='stickman';player.atkT=ATTACK.swing*.75;swingDir=-1;var packet=coopStatePacket();`);
 assert.equal(c.run('packet.skin.model'),'stickman');assert.equal(c.run('packet.atkT'),c.run('player.atkT'));assert.equal(c.run('packet.swingDir'),-1);
 c.run(`coopMode='host';coopOnMsg({...packet,type:'state',when:Date.now()});`);assert.equal(c.run('pvpFoe.skin.model'),'stickman');
});
