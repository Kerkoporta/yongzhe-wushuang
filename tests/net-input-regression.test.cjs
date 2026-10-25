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
