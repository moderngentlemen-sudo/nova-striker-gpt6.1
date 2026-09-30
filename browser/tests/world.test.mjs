import test from 'node:test';
import assert from 'node:assert/strict';
import { World, STEP, neutral, segmentHitsRect } from '../src/world.js';
import { controllerInput } from '../src/input.js';

function advance(world, seconds, commands = () => []) {
  for (let i = 0; i < Math.ceil(seconds / STEP); i++) world.step(STEP, commands(i));
}
function grounded(room = 'movement', party) {
  const world = new World(room, party); advance(world, .1); return world;
}
function shot(p, kind = 'parry') {
  return { x: p.x + 25, y: p.y - 30, vx: -900, vy: 0, radius: 5, owner: null, damage: 20, life: 2, color: '#fff', kind };
}

test('party is bounded to one to four valid characters', () => {
  assert.throws(() => new World('movement', []), RangeError);
  assert.throws(() => new World('movement', [{ kit: 'unknown', device: 'keyboard1' }]), RangeError);
  assert.throws(() => new World('movement', Array.from({ length: 5 }, () => ({ kit: 'nova', device: 'simulated' }))), RangeError);
});
test('standing and running preserve floor collision', () => {
  const world = grounded(), p = world.players[0];
  assert.equal(p.y, 720); assert.equal(p.grounded, true);
  advance(world, .5, () => [{ ...neutral(), move: 1 }]);
  assert.ok(p.x > 260); assert.equal(p.y, 720);
});
test('two jumps work but a third airborne input does not refill them', () => {
  const world = grounded(), p = world.players[0];
  world.step(STEP, [{ ...neutral(), jump: true }]); advance(world, .06);
  world.step(STEP, [{ ...neutral(), jump: true }]); advance(world, .03);
  assert.equal(p.jumps, 0);
  const before = p.vy;
  world.step(STEP, [{ ...neutral(), jump: true }]);
  assert.ok(p.vy > before); assert.equal(p.jumps, 0);
});
test('a wall stops travel and supports a wall jump', () => {
  const world = grounded(), p = world.players[0];
  p.x = 1133; p.y = 670; p.grounded = false;
  advance(world, .1, () => [{ ...neutral(), move: 1 }]);
  assert.ok(p.x <= 1134); assert.equal(p.wall, 1);
  world.step(STEP, [{ ...neutral(), jump: true, move: 1 }]);
  assert.ok(p.vx < 0); assert.ok(p.vy < 0);
});
test('standing under a low ceiling keeps the crouched collision body', () => {
  const world = grounded(), p = world.players[0];
  world.level.platforms.push({ x: 120, y: 655, w: 100, h: 25 }); p.h = 36;
  world.step(STEP, [neutral()]);
  assert.equal(p.h, 36); assert.equal(p.y, 720);
});
test('Velocity Break spends the same air dash and grants no invulnerability', () => {
  const world = grounded(), p = world.players[0];
  p.y = 450; p.grounded = false;
  world.step(STEP, [{ ...neutral(), dash: true, move: 1 }]);
  assert.equal(p.airDash, false); assert.ok(p.dashTime > 0);
  world.step(STEP, [{ ...neutral(), dash: true }]);
  assert.equal(p.dashTime, 0); assert.equal(p.airDash, false); assert.equal(p.invulnerable, 0);
  advance(world, .07); p.dashCooldown = 0;
  world.step(STEP, [{ ...neutral(), dash: true }]);
  assert.equal(p.dashTime, 0);
});
test('Nova charged fire exceeds Echo ranged output without erasing their other actions', () => {
  const nova = grounded(), echo = grounded('movement', [{ kit: 'echo', device: 'keyboard1' }]);
  for (const world of [nova, echo]) {
    advance(world, .5, () => [{ ...neutral(), fire: true }]); world.step(STEP, [neutral()]);
  }
  assert.ok(nova.bullets.some(b => b.damage === 42));
  assert.ok(echo.bullets.every(b => b.damage <= 20));
  assert.equal(nova.stats.shots, 2); assert.equal(echo.stats.shots, 2);
});
test('Bulwark Pulse clears front ordinary threats but preserves piercing and friendly shots', () => {
  const world = grounded(), p = world.players[0];
  const base = { x: p.x + 60, y: p.y - 30, life: 2, vx: 0, vy: 0 };
  world.bullets = [{ ...base, owner: null, kind: 'parry' }, { ...base, owner: null, kind: 'unblockable' }, { ...base, owner: 0, kind: 'friendly' }, { ...base, x: p.x - 60, owner: null, kind: 'parry' }];
  p.pendingSkill = { kit: 'nova' }; world.resolveSkill(p);
  assert.equal(world.bullets.length, 3);
  assert.ok(world.bullets.some(b => b.kind === 'unblockable'));
  assert.ok(world.bullets.some(b => b.owner === 0));
  assert.ok(world.bullets.some(b => b.x < p.x));
});
test('perfect parry reflects a projectile and preserves health', () => {
  const world = grounded(), p = world.players[0];
  p.guard = .16; p.guardAge = .02; world.bullets.push(shot(p));
  world.step(STEP, [neutral()]);
  assert.equal(p.hp, 100); assert.equal(world.stats.perfectParries, 1);
  assert.equal(world.bullets[0].owner, 0); assert.ok(world.bullets[0].vx > 0);
});
test('unblockable projectile defeats parry rather than silently becoming reflectable', () => {
  const world = grounded(), p = world.players[0];
  p.guard = .16; p.guardAge = 0; world.bullets.push(shot(p, 'unblockable'));
  world.step(STEP, [neutral()]);
  assert.equal(p.hp, 80); assert.equal(world.stats.parries, 0);
});
test('swept projectile collision recognizes a wall even across a long step', () => {
  const wall = { x: 50, y: 10, w: 10, h: 100 };
  assert.equal(segmentHitsRect(0, 50, 150, 50, wall), true);
  assert.equal(segmentHitsRect(0, 0, 150, 0, wall), false);
});
test('Echo pursuit needs a target and respects solid terrain', () => {
  const world = grounded('combat', [{ kit: 'echo', device: 'keyboard1' }]), p = world.players[0], e = world.level.enemies[0];
  e.type = 'walker'; e.x = p.x + 140; e.y = 720; e.timer = 100;
  world.level.enemies = [e]; world.beginSkill(p);
  assert.equal(p.pendingSkill.target, e);
  p.pendingSkill = null; p.skillCooldown = 0;
  world.level.platforms.push({ x: p.x + 55, y: 590, w: 25, h: 130 });
  world.beginSkill(p);
  assert.equal(p.pendingSkill, null); assert.ok(p.recovery > 0);
});
test('Support recovery is equally available to the solo character', () => {
  const world = grounded('movement', [{ kit: 'support', device: 'keyboard1' }]), p = world.players[0];
  p.hp = 30; world.beginSkill(p); advance(world, .12);
  assert.equal(p.hp, 58); assert.ok(p.skillCooldown > 8);
});
test('four actors receive independent movement commands and do not collide with teammates', () => {
  const world = grounded('movement', ['nova','echo','tank','support'].map(kit => ({ kit, device: 'simulated' })));
  const xs = world.players.map(p => p.x);
  advance(world, .2, () => [1,0,-1,0].map(move => ({ ...neutral(), move })));
  assert.ok(world.players[0].x > xs[0]);
  assert.equal(world.players[1].x, xs[1]);
  assert.ok(world.players[2].x < xs[2]);
  assert.equal(world.players[3].x, xs[3]);
});
test('camera zoom is bounded and regrouping preserves health and cooldowns', () => {
  const world = grounded('movement', [{ kit: 'nova', device: 'keyboard1' }, { kit: 'echo', device: 'keyboard2' }]), p = world.players[1];
  p.x = 2450; p.hp = 31; p.skillCooldown = 3; p.airDash = false;
  const camera = world.cameraTarget(800, 500);
  assert.ok(camera.zoom >= .8);
  world.recoverSpread(camera, 800, 500, 1.2);
  assert.ok(p.x < 400); assert.equal(p.hp, 31); assert.equal(p.skillCooldown, 3); assert.equal(p.airDash, false);
  assert.equal(world.stats.recoveries, 1); assert.equal(world.checkpointReached, false);
});
test('holding interact revives a teammate without reviving an entire party automatically', () => {
  const world = grounded('movement', [{ kit: 'nova', device: 'keyboard1' }, { kit: 'echo', device: 'keyboard2' }]), down = world.players[1];
  down.hp = 0; down.downed = true;
  advance(world, 1.6, () => [{ ...neutral(), interact: true }, neutral()]);
  assert.equal(down.downed, false); assert.equal(down.hp, 40); assert.equal(world.stats.revives, 1);
});
test('a downed body falling out of the room remains recoverable', () => {
  const world = grounded(), p = world.players[0];
  p.downed = true; p.hp = 0; p.y = 1500; world.step(STEP);
  assert.equal(p.y, world.level.checkpoint.y); assert.equal(p.downed, true);
});
test('party defeat is explicit and checkpoint retry restores a playable character', () => {
  const world = grounded(), p = world.players[0]; p.hp = 0; p.downed = true;
  advance(world, 1); assert.equal(world.defeated, true);
  world.reset('movement', true); assert.equal(world.players[0].hp, 100); assert.equal(world.defeated, false);
});
test('checkpoint retry preserves enemies already cleared at the checkpoint', () => {
  const world = grounded('combat'), p = world.players[0];
  world.level.enemies[0].alive = false; p.x = 1775; p.y = 720; p.grounded = true;
  world.step(STEP, [neutral()]); assert.equal(world.checkpointReached, true);
  world.reset('combat', true);
  assert.equal(world.level.enemies[0].alive, false); assert.equal(world.players[0].x, 1770);
});
test('solo can finish repair and traversal objectives without simultaneous inputs', () => {
  const world = grounded('skyport'), p = world.players[0];
  world.level.enemies.forEach(e => { e.alive = false; });
  p.x = world.level.console.x; p.y = world.level.console.y; p.grounded = true;
  advance(world, 3.2, () => [{ ...neutral(), interact: true }]); assert.equal(world.won, true);
  const movement = grounded(); movement.players[0].x = movement.level.exit.x; movement.step(STEP);
  assert.equal(movement.won, true);
});
test('controller edges are per-device and held buttons do not repeatedly jump or dash', () => {
  const pad = { axes: [.5, 0, 0, -1], buttons: Array.from({ length: 16 }, () => ({ value: 0, pressed: false })) };
  pad.buttons[0] = { value: 1, pressed: true }; pad.buttons[7] = { value: 1, pressed: true };
  const first = controllerInput(pad), second = controllerInput(pad, first.buttons), otherDevice = controllerInput(pad);
  assert.equal(first.input.jump, true); assert.equal(second.input.jump, false); assert.equal(otherDevice.input.jump, true);
  assert.equal(first.input.fire, true); assert.equal(first.input.aimY, -1);
});
test('extended four-player simulation remains finite and bounded', () => {
  const world = new World('skyport', ['nova','echo','tank','support'].map(kit => ({ kit, device: 'simulated' })));
  advance(world, 35, tick => world.players.map((p, i) => ({ ...neutral(), move: Math.sin(tick * .004 + i) > 0 ? 1 : -1, jump: tick % 140 === i, dash: tick % 240 === i, fire: tick % 50 < 20, melee: tick % 45 === i, skill: tick % 800 === i })));
  for (const p of world.players) { assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); assert.ok(p.x >= 0 && p.x <= world.level.width); }
  assert.ok(world.bullets.length < 100); assert.ok(world.effects.length < 160);
});
