'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/homebrew/lib/node_modules/agent-browser/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/skin-v97');
fs.mkdirSync(out,{recursive:true});
(async()=>{let browser,server;const checks=[],errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Users/clawopen/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const context=await browser.newContext({viewport:{width:1000,height:800}}),a=await context.newPage(),b=await context.newPage();
 for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});await p.goto(url);await p.waitForFunction(()=>window.G);await p.evaluate(()=>{closeHome();zombies=[];spawnT=9999;bossAt=999999;player.inv=0;portal=null;});}
 await a.locator('#gearBtn').click();await a.locator('#gearSkin').click();
 assert.equal(await a.evaluate(()=>paused),true);
 assert.deepEqual(await a.locator('[data-skin-model]').allTextContents(),['普通皮肤','火柴人皮肤']);
 const pos=await a.evaluate(()=>({selector:document.getElementById('skinModels').getBoundingClientRect().top,preview:document.getElementById('skinCv').getBoundingClientRect().top,display:getComputedStyle(document.getElementById('skin')).display,html:document.getElementById('skin').innerHTML.slice(0,200)}));if(!(pos.selector<pos.preview)){console.log(pos);await a.screenshot({path:path.join(out,'failure.png')});}assert.ok(pos.selector<pos.preview);
 await a.locator('[data-skin-model="stickman"]').click();assert.equal(await a.evaluate(()=>player.skin.model),'stickman');
 for(const dir of ['down','up','left','right','attack']){await a.locator(`[data-skin-preview="${dir}"]`).click();assert.equal(await a.evaluate(()=>skinPreviewAction),dir);}
 await a.screenshot({path:path.join(out,'skin-menu.png')});
 const sheet=await a.evaluate(()=>{
  const c=document.createElement('canvas');c.width=800;c.height=540;const g=c.getContext('2d');g.fillStyle='#192523';g.fillRect(0,0,c.width,c.height);g.fillStyle='#ffe099';g.font='bold 23px sans-serif';g.fillText('火柴人 · 四向行走与攻击',24,32);
  const dirs=[Math.PI/2,-Math.PI/2,Math.PI,0],labels=['前走','后走','左走','右走'];
  for(let col=0;col<4;col++){
   g.fillStyle='#fff';g.font='18px sans-serif';g.fillText(labels[col],col*200+77,64);
   for(let row=0;row<3;row++){const x=col*200+64,y=80+row*120;drawStickman(g,x,y,6,{dir:dirs[col],moving:row<2,walkT:row===0?.1:.4,atkT:row===2?ATTACK.swing*.45:0});g.fillStyle='#bed0c6';g.font='12px sans-serif';g.fillText(row===2?'攻击动作':`行走帧 ${row+1}`,col*200+75,y+113);}
  }
  g.fillStyle='#bed0c6';g.font='14px sans-serif';g.fillText('圆头 + 关节线条；前后区别、左右朝向、腿部交替与挥手动作。',24,505);return c.toDataURL('image/png');
 });fs.writeFileSync(path.join(out,'preview.png'),Buffer.from(sheet.split(',')[1],'base64'));
 checks.push('设置→捏人换装；顶部普通/火柴人顺序；五种动作预览按钮');
 await a.locator('#skinDone').click();assert.equal(await a.evaluate(()=>paused),false);
 await a.reload();await a.waitForFunction(()=>window.G);assert.equal(await a.evaluate(()=>player.skin.model),'stickman');
 await a.evaluate(()=>{closeHome();zombies=[];spawnT=9999;bossAt=999999;player.inv=0;portal=null;window.__skinRenderStates=[];var rawStick=drawStickman;drawStickman=(...args)=>{window.__skinRenderStates.push(args[4]);if(window.__skinRenderStates.length>200)window.__skinRenderStates.shift();rawStick(...args)};});
 for(const [key,axis,sign,facing]of [['s','y',1,'down'],['w','y',-1,'up'],['a','x',-1,'left'],['d','x',1,'right']]){
  await a.keyboard.down(key);const r=await a.evaluate(({axis,sign})=>{player.x=1200;player.y=1200;zombies=[];const before=player[axis];for(let i=0;i<12;i++)update(.016);draw();const anim=window.__skinRenderStates.at(-1);return {moved:(player[axis]-before)*sign,face:stickmanPose(anim).facing,moving:anim.moving};},{axis,sign});await a.keyboard.up(key);assert.ok(r.moved>0);assert.equal(r.face,facing);assert.ok(r.moving);
 }
 const attack=await a.evaluate(()=>{player.weapon='stone_sword';player.bought.stone_sword={t:0,w:0};player.cd=0;player.atkT=0;player.dir=0;doAttack();draw();return window.__skinRenderStates.at(-1);});assert.ok(attack.atkT>0);assert.equal(attack.armed,true);
 checks.push('真实键盘四向输入产生正确位移与四向骨架；装备武器后攻击动作；刷新保留形态');
 await a.evaluate(()=>{player.skin.b='#e84a4a';toggleGear(true);});await a.locator('#gearSkin').click();await a.locator('[data-skin-model="normal"]').click();assert.equal(await a.evaluate(()=>player.skin.b),'#e84a4a');await a.locator('[data-skin-model="stickman"]').click();await a.locator('#skinDone').click();
 await a.evaluate(()=>{enterCoop('skin-dual',1);zombies=[];spawnT=9999;bossAt=999999;});await b.evaluate(()=>{enterCoop('skin-dual',2);zombies=[];});
 await a.evaluate(()=>{paused=true;player.skin.model='stickman';player.moving=true;player.walkT=.4;player.dir=Math.PI;player.atkT=ATTACK.swing*.6;coopWrite();});
 await b.waitForFunction(()=>pvpFoe?.skin?.model==='stickman');const peer=await b.evaluate(()=>{var peerAnim;var original=drawStickman;drawStickman=(...args)=>{peerAnim=args[4];original(...args)};draw();drawStickman=original;return {face:stickmanPose(peerAnim).facing,model:pvpFoe.skin.model,moving:peerAnim.moving,atkT:peerAnim.atkT};});assert.equal(peer.face,'left');assert.equal(peer.model,'stickman');assert.equal(peer.moving,true);assert.ok(peer.atkT>0);
 checks.push('同源双客户端合作同步火柴人模型、方向和走路状态');
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:700});await mobile.goto(url);await mobile.waitForFunction(()=>window.G);await mobile.evaluate(()=>openSkin());await mobile.locator('[data-skin-model="stickman"]').click();await mobile.locator('#skinDone').click();await mobile.evaluate(()=>{closeHome();toggleRotate();openSkin();});await mobile.locator('[data-skin-model="normal"]').click();await mobile.screenshot({path:path.join(out,'rotated-menu.png')});await mobile.locator('#skinDone').click();assert.equal(await mobile.evaluate(()=>paused),false);checks.push('390×700 小屏及90度转屏可选皮肤、可滚动关闭，无永久暂停');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',checks,errors},null,2));console.log(checks.join('\n'));
}catch(e){fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'failed',checks,errors,error:e.stack},null,2));console.error(e);process.exitCode=1;}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})();
