import test from 'node:test';
import assert from 'node:assert/strict';
import { World, STEP, neutral, box, overlap, distance } from '../src/world.js';
import { ControllerState, Inputs, bindControllers, missingControllers } from '../src/input.js';

const nova = { slot: 0, kit: 'nova', device: 'keyboard1' };
const echo = { slot: 1, kit: 'echo', device: 'keyboard2' };
const tank = { slot: 2, kit: 'tank', device: 'simulated' };
function grounded(room = 'movement', party = [nova]) {
  const world = new World(room, party);
  for (let i = 0; i < 12; i++) world.step(STEP);
  return world;
}
function pad(index = 0, id = 'test controller') {
  return { index, id, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })) };
}
function press(controller, button, pressed = true) { controller.buttons[button] = { pressed, value: pressed ? 1 : 0 }; }

test('joining preserves the encounter, checkpoint, timer, repair and existing player resources', () => {
  const world = grounded('skyport'), p = world.players[0];
  p.hp = 37; p.skillCooldown = 3; p.airDash = false; p.jumps = 0;
  world.level.enemies[0].alive = false;
  world.checkpointReached = true; world.level.checkpoint = { x: 1770, y: 720 };
  world.checkpointSnapshot = world.level.enemies.map(e => ({ ...e }));
  world.repair = 1.4; world.stats.hits = 7;
  const { level, time, checkpointSnapshot, initialEnemies } = world;
  world.updateParty([nova, echo]);
  assert.equal(world.level, level); assert.equal(world.time, time);
  assert.equal(world.checkpointSnapshot, checkpointSnapshot); assert.equal(world.checkpointReached, true);
  assert.equal(world.initialEnemies, initialEnemies); assert.equal(world.repair, 1.4); assert.equal(world.stats.hits, 7);
  assert.equal(world.players[0], p); assert.equal(p.hp, 37); assert.equal(p.skillCooldown, 3); assert.equal(p.airDash, false); assert.equal(p.jumps, 0);
  const joined = world.players[1];
  assert.equal(joined.grounded, true); assert.ok(distance(p, joined) <= 144);
  assert.ok(!world.level.platforms.some(r => overlap(box(joined), r)));
  assert.equal(world.stats.joins, 1); assert.equal(world.partyChanges[0].type, 'join');
});

test('departing P1 leaves stable P2/P3 ownership and removes only the departing player’s shots', () => {
  const world = grounded('combat', [nova, echo, tank]);
  const second = world.players[1], third = world.players[2];
  world.shoot(world.players[0]); world.shoot(second);
  second.hp = 29; second.skillCooldown = 2;
  world.level.enemies[0].lastPlayer = 0;
  world.updateParty([{ ...echo, device: 'keyboard1' }, tank]);
  assert.deepEqual(world.players.map(p => p.id), [1, 2]);
  assert.equal(world.players[0], second); assert.equal(world.players[1], third);
  assert.equal(second.device, 'keyboard1'); assert.equal(second.hp, 29); assert.equal(second.skillCooldown, 2);
  assert.deepEqual(world.bullets.map(b => b.owner), [1]); assert.equal(world.level.enemies[0].lastPlayer, null);
  assert.equal(world.stats.departures, 1); assert.equal(world.stats.deviceChanges, 1);
  assert.doesNotThrow(() => world.step(STEP, [neutral(), neutral()]));
});

test('a rejected squad change does not partially remove players, rebind devices or reset progress', () => {
  const world = grounded('combat', [nova, echo]), players = [...world.players], party = world.party;
  const before = JSON.stringify({ stats: world.stats, enemies: world.level.enemies, time: world.time });
  assert.throws(() => world.updateParty([{ ...nova, device: 'pad0' }, { ...echo, kit: 'support' }]), /Restart with this squad/);
  assert.equal(world.party, party); assert.deepEqual(world.players, players);
  assert.equal(world.players[0].device, 'keyboard1'); assert.equal(world.benchPlayers.size, 0);
  assert.equal(JSON.stringify({ stats: world.stats, enemies: world.level.enemies, time: world.time }), before);
});

test('joining waits for a grounded teammate and rejects unsafe enemy or projectile proximity', () => {
  const world = grounded('combat');
  world.players[0].grounded = false;
  assert.throws(() => world.updateParty([nova, echo]), /Land on a clear platform/);
  world.players[0].grounded = true; world.level.enemies[0].x = world.players[0].x;
  assert.throws(() => world.updateParty([nova, echo]), /Land on a clear platform/);
  world.level.enemies = [];
  world.bullets = [-100, 0, 100].map(dx => ({ x: world.players[0].x + dx, y: 690, owner: null, life: 1 }));
  assert.throws(() => world.updateParty([nova, echo]), /Land on a clear platform/);
  assert.equal(world.players.length, 1); assert.equal(world.stats.joins, 0);
});

test('a newcomer fits on the same platform without passing through a wall', () => {
  const world = grounded();
  world.level.platforms.push({ x: 110, y: 560, w: 20, h: 160 });
  world.updateParty([nova, echo]);
  assert.ok(world.players[1].x > 130);
  assert.ok(!world.level.platforms.some(r => overlap(box(world.players[1]), r)));
});

test('joining cannot activate a checkpoint or reach beacon just beyond the surviving player', () => {
  const world = grounded(); world.players[0].x = 1710;
  assert.throws(() => world.updateParty([nova, echo]), /Land on a clear platform/);
  assert.equal(world.checkpointReached, false);
  const ascent = grounded('ascent');
  Object.assign(ascent.players[0], { x: 850, y: 440, grounded: true });
  ascent.updateParty([nova, echo]);
  assert.ok(ascent.players.every(p => distance(p, ascent.level.exit) >= 85));
  ascent.step(STEP); assert.equal(ascent.won, false);
});

test('leaving and rejoining retains health, downed state, cooldowns and spent air resources', () => {
  const world = grounded('movement', [nova, echo]), p = world.players[1];
  Object.assign(p, { hp: 0, downed: true, skillCooldown: 4, jumps: 0, airDash: false });
  world.updateParty([nova]); world.updateParty([nova, echo]);
  assert.equal(world.players[1], p); assert.equal(p.hp, 0); assert.equal(p.downed, true);
  assert.equal(p.skillCooldown, 4); assert.equal(p.jumps, 0); assert.equal(p.airDash, false);
  assert.equal(world.partyChanges.at(-1).returning, true);
});

test('a departed slot cannot change character or reset its state without an explicit restart', () => {
  const world = grounded('movement', [nova, echo]);
  world.players[1].hp = 12; world.updateParty([nova]);
  assert.throws(() => world.updateParty([nova, { ...echo, kit: 'support' }]), /Restart with this squad/);
  world.setParty([nova, { ...echo, kit: 'support' }]);
  assert.equal(world.players[1].kit, 'support'); assert.equal(world.players[1].hp, 90);
  assert.equal(world.time, 0); assert.equal(world.benchPlayers.size, 0);
});

test('fresh joins cannot bypass defeat or a completed room', () => {
  for (const state of ['won', 'defeated']) {
    const world = grounded(); world[state] = true;
    assert.throws(() => world.updateParty([nova, echo]), /attempt has ended/);
    assert.equal(world[state], true);
  }
  const downed = grounded(); downed.players[0].downed = true;
  assert.throws(() => downed.updateParty([nova, echo]), /Land on a clear platform/);
});

test('checkpoint retry retains current slots and the enemies saved at the checkpoint', () => {
  const world = grounded('combat', [nova, echo]);
  world.level.enemies[0].alive = false;
  Object.assign(world.players[0], { x: 1775, y: 720, grounded: true });
  world.step(STEP); assert.equal(world.checkpointReached, true);
  world.updateParty([{ ...echo, device: 'keyboard1' }]); world.reset('combat', true);
  assert.deepEqual(world.players.map(p => p.id), [1]);
  assert.equal(world.level.enemies[0].alive, false); assert.equal(world.stats.departures, 1);
  assert.equal(world.partyChanges.length, 2);
});

test('invalid slots and duplicate real devices are rejected at the world boundary', () => {
  assert.throws(() => new World('movement', [nova, { ...echo, slot: 0 }]), /different player slots/);
  assert.throws(() => new World('movement', [nova, { ...echo, device: 'keyboard1' }]), /different device/);
  assert.throws(() => new World('movement', [{ ...nova, device: 'unknown' }]), /supported input/);
  assert.throws(() => new World('movement', [{ ...nova, slot: 4 }]), /different player slots/);
});

test('controller connection checks identify missing, replaced and unsupported devices by player slot', () => {
  const controller = pad(), party = [{ ...echo, device: 'pad0' }];
  const ids = bindControllers(party, [controller]);
  assert.deepEqual(missingControllers(party, [controller], ids), []);
  assert.deepEqual(missingControllers(party, [], ids), [{ slot: 1, reason: 'disconnected' }]);
  assert.deepEqual(missingControllers(party, [pad(0, 'different controller')], ids), [{ slot: 1, reason: 'replaced' }]);
  controller.connected = false;
  assert.throws(() => bindControllers(party, [controller]), /P2/);
  controller.connected = true; controller.mapping = '';
  assert.throws(() => bindControllers(party, [controller]), /P2/);
  assert.equal(ids.get('pad0'), 'test controller');
});

test('held gameplay buttons stay suppressed after a pause until each button is released', () => {
  const state = new ControllerState(), controller = pad();
  press(controller, 0); press(controller, 7); state.clear([controller]);
  let sample = state.sample(controller, { x: 1, y: 0 }).input;
  assert.equal(sample.jump, false); assert.equal(sample.fire, false);
  press(controller, 5);
  sample = state.sample(controller, { x: 1, y: 0 }).input;
  assert.equal(sample.melee, true); assert.equal(sample.jump, false); assert.equal(sample.fire, false);
  press(controller, 0, false); press(controller, 7, false); state.sample(controller, { x: 1, y: 0 });
  press(controller, 0); press(controller, 7);
  sample = state.sample(controller, { x: 1, y: 0 }).input;
  assert.equal(sample.jump, true); assert.equal(sample.fire, true);
  assert.equal(state.sample(controller, { x: 1, y: 0 }).input.jump, false);
});

test('controller edge history is separate for players and replacement devices', () => {
  const state = new ControllerState(), a = pad(0, 'A'), b = pad(1, 'B'), replacement = pad(0, 'C');
  for (const p of [a, b, replacement]) press(p, 1);
  assert.equal(state.sample(a).input.dash, true); assert.equal(state.sample(a).input.dash, false);
  assert.equal(state.sample(b).input.dash, true); assert.equal(state.sample(replacement).input.dash, true);
});

test('controller Start cannot resume through an open dialog or a replaced device', () => {
  const input = Object.create(Inputs.prototype), controller = pad();
  input.pads = () => [controller]; input.systemPrevious = new Map();
  let pauses = 0; input.onPause = () => pauses++;
  const party = [{ ...nova, device: 'pad0' }], ids = bindControllers(party, [controller]);
  press(controller, 9); input.pollSystemButtons(party, ids, false);
  input.pollSystemButtons(party, ids, true); assert.equal(pauses, 0);
  press(controller, 9, false); input.pollSystemButtons(party, ids);
  press(controller, 9); input.pollSystemButtons(party, ids); assert.equal(pauses, 1);
  press(controller, 9, false); input.pollSystemButtons(party, ids);
  controller.id = 'replacement'; press(controller, 9); input.pollSystemButtons(party, ids);
  assert.equal(pauses, 1);
});

test('separate downed episodes do not accumulate into an immediate party defeat', () => {
  const world = grounded(), p = world.players[0];
  p.downed = true; world.step(.6);
  p.downed = false; world.step(STEP);
  p.downed = true; world.step(.3);
  assert.equal(world.defeated, false); assert.equal(world.defeatTimer, .3);
});
