'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function makeElement(id = '') {
  return {
    id,
    tagName: 'DIV',
    style: {},
    textContent: '',
    innerHTML: '',
    classList: { toggle() {} },
    addEventListener() {},
    appendChild() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 88, height: 88 }; },
    setPointerCapture() {},
    closest() { return null; }
  };
}

function makeBrowserContext() {
  const elements = new Map();
  const listeners = new Map();
  const timeouts = new Map();
  let nextTimeout = 1;
  const document = {
    body: makeElement('body'),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    createElement() { return makeElement(); },
    querySelectorAll() { return []; }
  };
  const context = {
    console,
    document,
    navigator: { getGamepads: () => [] },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setTimeout(fn, delay) { const id = nextTimeout++; timeouts.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    __runTimeouts() { const pending = [...timeouts.values()]; timeouts.clear(); for (const timer of pending) timer.fn(); },
    __timeoutCount() { return timeouts.size; },
    innerWidth: 800,
    innerHeight: 600,
    addEventListener(type, fn, options) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ fn, once: !!(options && options.once) });
    },
    __fire(type, event = {}) {
      const entries = [...(listeners.get(type) || [])];
      for (const entry of entries) {
        entry.fn(event);
        if (entry.once) {
          const current = listeners.get(type);
          current.splice(current.indexOf(entry), 1);
        }
      }
    },
    __element: document.getElementById
  };
  context.window = context;
  return vm.createContext(context);
}

function load(context, relativePath) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

test('typing a multiplayer room code must not hide touch controls or cast skills', () => {
  const context = makeBrowserContext();
  let skillCalls = 0;
  Object.assign(context, {
    settings: { sens: 100 },
    rotated: false,
    doAttack() {},
    ctxGo() {},
    castSkillByIndex() { skillCalls++; },
    reset() {},
    showHome() {},
    setBanner() {}
  });
  load(context, 'src/input.js');

  context.__fire('touchstart', { target: context.document.body });
  const codeInput = context.document.getElementById('pvpNetCode');
  codeInput.tagName = 'INPUT';
  context.__fire('keydown', { key: '1', target: codeInput, preventDefault() {} });

  assert.deepEqual(
    {
      joystick: context.document.getElementById('joy').style.display,
      attack: context.document.getElementById('atkBtn').style.display,
      skillCalls
    },
    { joystick: 'flex', attack: 'flex', skillCalls: 0 }
  );
});

test('a later touch restores controls after hardware keyboard play', () => {
  const context = makeBrowserContext();
  Object.assign(context, {
    settings: { sens: 100 },
    rotated: false,
    doAttack() {},
    ctxGo() {},
    castSkillByIndex() {},
    reset() {},
    showHome() {},
    setBanner() {}
  });
  load(context, 'src/input.js');

  context.__fire('touchstart', { target: context.document.body });
  context.__fire('keydown', { key: 'd', target: context.document.body, preventDefault() {} });
  assert.equal(context.document.getElementById('joy').style.display, 'none');

  context.__fire('touchstart', { target: context.document.body });
  assert.equal(context.document.getElementById('joy').style.display, 'flex');
  assert.equal(context.document.getElementById('atkBtn').style.display, 'flex');
});

test('gamepad disconnect during its intro must release the pause and dismiss the card', () => {
  const context = makeBrowserContext();
  Object.assign(context, { setBanner() {}, beep() {}, paused: false });
  load(context, 'src/gamepad.js');

  context.__fire('gamepadconnected', {});
  assert.equal(context.paused, true);
  context.__fire('gamepaddisconnected', {});

  assert.deepEqual(
    {
      paused: context.paused,
      introRemaining: vm.runInContext('padIntroT', context),
      help: context.document.getElementById('padHelp').style.display
    },
    { paused: false, introRemaining: 0, help: 'none' }
  );
});

test('gamepad intro countdown must finish even if the browser exposes no gamepad', () => {
  const context = makeBrowserContext();
  Object.assign(context, { setBanner() {}, beep() {}, paused: false });
  load(context, 'src/gamepad.js');

  context.__fire('gamepadconnected', {});
  vm.runInContext('for (let i = 0; i < 101; i++) padTick(0.05)', context);

  assert.deepEqual(
    {
      paused: context.paused,
      introRemaining: vm.runInContext('padIntroT', context),
      help: context.document.getElementById('padHelp').style.display
    },
    { paused: false, introRemaining: 0, help: 'none' }
  );
});

test('coop heartbeat must continue while gameplay is paused', () => {
  const context = makeBrowserContext();
  const sent = [];
  Object.assign(context, {
    setBanner() {},
    beep() {},
    player: { x: 1240, y: 1200, hearts: 5, maxHearts: 5, weapon: null, dir: 0, moving: false, walkT: 0, atkT: 0, skin: {} },
    padTick() {},
    draw() {},
    paused: true,
    gameOver: false,
    overRecorded: false,
    towerMode: false
  });
  load(context, 'src/net.js');
  context.__sent = sent;
  vm.runInContext(`
    coopMode = 'client'; coopSide = 2; coopId = 'net1234'; coopT = 0;
    netReady = true; netTopic = 'zfcoop/room1234';
    netClient = { publish(topic, payload) { __sent.push(JSON.parse(payload)); } };
  `, context);
  load(context, 'src/main.js');

  vm.runInContext('loop(50)', context);

  assert.equal(sent.filter(message => message.type === 'state').length, 1);
});

test('a recovered coop connection must cancel its pending forced exit', () => {
  const context = makeBrowserContext();
  Object.assign(context, { setBanner() {}, beep() {}, updateScore() {}, saveGame() {} });
  load(context, 'src/net.js');
  vm.runInContext(`
    coopMode = 'client'; coopSide = 2; coopId = 'net1234';
    netReady = true; netSeen = true; netTopic = 'zfcoop/room1234';
    netClient = { publish() {} }; pvpFoe = null;
  `, context);
  const freshState = `{ type: 'state', side: 1, x: 1160, y: 1200, hearts: 5, maxHearts: 5, when: Date.now() }`;

  vm.runInContext(`coopOnMsg(${freshState})`, context);
  vm.runInContext('pvpFoe.when = Date.now() - 4000; coopRead()', context);
  assert.equal(vm.runInContext('pvpFoe.stale', context), true);
  assert.equal(context.__timeoutCount(), 1);

  vm.runInContext(`coopOnMsg(${freshState})`, context);
  assert.equal(vm.runInContext('pvpFoe.stale', context), false);
  context.__runTimeouts();

  assert.equal(vm.runInContext('coopMode', context), 'client');
});

test('every networked monster factory must assign a unique id', () => {
  const context = makeBrowserContext();
  load(context, 'logic.js');
  const enemies = vm.runInContext(`[
    makeBoss(0, 0),
    makeSkeleton(0, 0, () => 0.5),
    makeGhost(0, 0, () => 0.5),
    makeLava(0, 0, () => 0.5),
    makeStorm(0, 0, () => 0.5),
    makeVoid(0, 0, () => 0.5),
    makeCrystal(0, 0, () => 0.5),
    makeMirror(0, 0, {}, () => 0.5)
  ]`, context);
  const ids = enemies.map(enemy => enemy.id);
  assert.ok(ids.every(id => id !== undefined && id !== null), `missing ids: ${JSON.stringify(ids)}`);
  assert.equal(new Set(ids).size, ids.length);
});

test('coop snapshots must backfill unique ids for inline monsters and clones', () => {
  const context = makeBrowserContext();
  Object.assign(context, { setBanner() {}, beep() {}, updateScore() {}, kills: 0 });
  load(context, 'src/net.js');
  context.__snaps = [];
  vm.runInContext(`
    coopMode = 'host'; coopWave = 7; _id = 1000;
    zombies = [
      { x: 100, y: 100, hp: 1, maxHp: 1, boss: true, crystalBoss: true, fake: true, dead: false },
      { x: 160, y: 100, hp: 1, maxHp: 1, boss: true, crystalBoss: true, fake: true, dead: false }
    ];
    netSendCoop = o => __snaps.push(o); coopSendSnap();
  `, context);
  const ids = context.__snaps[0].zs.map(z => z.i);
  assert.ok(ids.every(id => id !== undefined && id !== null));
  assert.equal(new Set(ids).size, 2);
});

test('boss snapshots must preserve current hp max hp and boss type on the client', () => {
  const context = makeBrowserContext();
  Object.assign(context, { setBanner() {}, beep() {}, updateScore() {}, kills: 0 });
  load(context, 'src/net.js');
  context.__snaps = [];
  vm.runInContext(`
    coopMode = 'host'; coopWave = 9;
    zombies = [{ id: 77, x: 500, y: 600, hp: 95, maxHp: 10000, boss: true, ender: true, kind: 'boss9', dead: false, flash: 0 }];
    netSendCoop = o => __snaps.push(o);
    coopSendSnap();
  `, context);
  vm.runInContext(`
    coopMode = 'client'; zombies = [];
    coopClientHandleSnap(__snaps[0]);
    __snaps[0].zs[0].hp = 73;
    coopClientHandleSnap(__snaps[0]);
  `, context);

  const boss = vm.runInContext('zombies[0]', context);
  assert.deepEqual(
    { id: boss.id, hp: boss.hp, maxHp: boss.maxHp, ender: boss.ender },
    { id: 77, hp: 73, maxHp: 10000, ender: true }
  );
});

test('coop snapshots must restore every monster visual type instead of defaulting to zombies', () => {
  const cases = [
    ['skeleton', 'skel'], ['ghost', 'ghost'], ['lava', 'lava'], ['storm', 'storm'],
    ['voidw', 'voidw'], ['crystal', 'crystal'], ['wskeleton', 'ws'], ['creeper', 'creep'],
    ['slime', 'slime'], ['bat', 'bat'], ['mirror', 'mirror'], ['goblin', 'goblin'],
    ['boss2', 'skelBoss'], ['boss3', 'ghostBoss'], ['boss4', 'lavaBoss'], ['boss5', 'stormBoss'],
    ['boss6', 'voidBoss'], ['boss7', 'crystalBoss'], ['boss8', 'wither'], ['boss9', 'ender'],
    ['boss10', 'titan'], ['boss11', 'ghast'], ['boss12', 'warden'], ['boss13', 'mirrorKing']
  ];
  const hostZombies = cases.map(([kind, flag], index) => ({
    id: index + 1, x: 100 + index * 20, y: 200, hp: 10, maxHp: 10,
    boss: kind.startsWith('boss'), kind, [flag]: true, dead: false, flash: 0,
    ...(kind === 'slime' ? { size: 2, r: 14 } : {}),
    ...(kind === 'skeleton' ? { elite: true, affix: 'king' } : {})
  }));
  const context = makeBrowserContext();
  Object.assign(context, { setBanner() {}, beep() {}, updateScore() {}, kills: 0 });
  load(context, 'src/net.js');
  context.__snaps = [];
  context.__hostZombies = hostZombies;
  vm.runInContext(`
    coopMode = 'host'; coopWave = 1; zombies = __hostZombies;
    netSendCoop = o => __snaps.push(o); coopSendSnap();
    coopMode = 'client'; zombies = []; coopClientHandleSnap(__snaps[0]);
  `, context);

  for (const [kind, flag] of cases) {
    const id = cases.findIndex(entry => entry[0] === kind) + 1;
    assert.equal(vm.runInContext(`zombies[${id - 1}].${flag}`, context), true, `${kind} must keep ${flag}`);
  }
  const slime = vm.runInContext(`zombies[${cases.findIndex(entry => entry[0] === 'slime')}]`, context);
  assert.deepEqual({ size: slime.size, r: slime.r }, { size: 2, r: 14 });
  const elite = vm.runInContext('zombies[0]', context);
  assert.deepEqual({ elite: elite.elite, affix: elite.affix }, { elite: true, affix: 'king' });
});
