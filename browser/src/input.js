import { neutral, normalize, clamp } from './world.js';

export function controllerInput(pad, previous = [], aim = { x: 1, y: 0 }, shoulderPreset = false) {
  const value = i => pad.buttons[i]?.value || (pad.buttons[i]?.pressed ? 1 : 0);
  const down = i => value(i) > .35;
  const edge = i => down(i) && !previous[i];
  const deadzone = value => Math.abs(value || 0) > .18 ? value : 0;
  const ax = deadzone(pad.axes[2]), ay = deadzone(pad.axes[3]);
  const direction = ax || ay ? normalize(ax, ay) : aim;
  return { input: { move: deadzone(pad.axes[0]), vertical: deadzone(pad.axes[1]), aimX: direction.x, aimY: direction.y,
    jump: edge(shoulderPreset ? 6 : 0), dash: edge(shoulderPreset ? 4 : 1), fire: down(7), melee: edge(5), parry: edge(shoulderPreset ? 0 : 4), skill: edge(3), interact: down(2), crouch: deadzone(pad.axes[1]) > .65 },
    buttons: pad.buttons.map((_, i) => down(i)), pause: edge(9) };
}

export class Inputs {
  constructor(canvas, renderer) {
    this.canvas = canvas; this.renderer = renderer; this.held = new Set(); this.edges = new Set(); this.mouse = { x: 0, y: 0, active: false, fire: false, tap: false, melee: false };
    this.enabled = false; this.padPrevious = new Map(); this.systemPrevious = new Map(); this.shoulderPreset = false; this.lastAction = 'Waiting for input'; this.onPause = () => {}; this.onRetry = () => {};
    window.addEventListener('keydown', event => {
      this.lastAction = (event.code || 'NO CODE') + ' / ' + event.key;
      if (event.repeat) return;
      if (event.code === 'Escape' && !document.querySelector('dialog[open]')) { event.preventDefault(); this.onPause(); return; }
      if (!this.enabled || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
      const allowed = ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyQ','KeyE','KeyF','KeyR','KeyI','KeyJ','KeyK','KeyL','KeyU','KeyO','KeyP','KeyH','KeyY','KeyN','KeyM'];
      if (allowed.includes(event.code)) {
        event.preventDefault(); if (!this.held.has(event.code)) this.edges.add(event.code); this.held.add(event.code);
        if (event.code === 'KeyR') this.onRetry();
      }
    });
    window.addEventListener('keyup', event => this.held.delete(event.code));
    canvas.addEventListener('pointermove', event => {
      const rect = canvas.getBoundingClientRect(); this.mouse.x = event.clientX - rect.left; this.mouse.y = event.clientY - rect.top; this.mouse.active = true;
    });
    canvas.addEventListener('pointerdown', event => {
      if (!this.enabled) return;
      canvas.focus(); event.preventDefault();
      if (event.button === 0) { this.mouse.fire = true; this.mouse.tap = true; }
      if (event.button === 2) this.mouse.melee = true;
    });
    window.addEventListener('pointerup', event => { if (event.button === 0) this.mouse.fire = false; });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('blur', () => this.clear());
  }
  clear() { this.held.clear(); this.edges.clear(); this.mouse.fire = false; this.mouse.tap = false; this.mouse.melee = false; this.padPrevious.clear(); }
  endStep() { this.edges.clear(); this.mouse.tap = false; this.mouse.melee = false; }
  pads() { try { return Array.from(navigator.getGamepads?.() || []).filter(Boolean); } catch { return []; } }
  pollSystemButtons(party) {
    for (const pad of this.pads()) {
      const pressed = Boolean(pad.buttons[9]?.pressed);
      if (party.some(p => p.device === 'pad' + pad.index) && pressed && !this.systemPrevious.get(pad.index)) this.onPause();
      this.systemPrevious.set(pad.index, pressed);
    }
  }
  assist(p, world, aim) {
    const target = world.level.enemies.filter(e => e.alive && Math.hypot(e.x - p.x, e.y - p.y) < 500 && world.visible(p.x, p.y - 34, e.x, e.y - 30)).map(e => {
      const direction = normalize(e.x - p.x, e.y - 30 - (p.y - 34));
      return { direction, alignment: direction.x * aim.x + direction.y * aim.y };
    }).sort((a, b) => b.alignment - a.alignment)[0];
    return target?.alignment > .98 ? normalize(aim.x * .75 + target.direction.x * .25, aim.y * .75 + target.direction.y * .25) : aim;
  }
  sample(p, world, assistance = false) {
    if (p.device === 'simulated') return this.simulated(p, world);
    if (p.device.startsWith('pad')) {
      const index = Number(p.device.slice(3)), pad = this.pads().find(pad => pad.index === index);
      if (!pad) return neutral();
      const sample = controllerInput(pad, this.padPrevious.get(index), { x: p.aimX, y: p.aimY }, this.shoulderPreset);
      this.padPrevious.set(index, sample.buttons);
      if (assistance) {
        const aim = this.assist(p, world, { x: sample.input.aimX, y: sample.input.aimY }); sample.input.aimX = aim.x; sample.input.aimY = aim.y;
      }
      return sample.input;
    }
    const one = p.device === 'keyboard1';
    const held = key => this.held.has(key), edge = key => this.edges.has(key);
    const input = neutral();
    input.move = Number(held(one ? 'KeyD' : 'KeyL')) - Number(held(one ? 'KeyA' : 'KeyJ'));
    input.vertical = Number(held(one ? 'KeyS' : 'KeyK')) - Number(held(one ? 'KeyW' : 'KeyI'));
    input.jump = edge(one ? 'Space' : 'KeyU'); input.dash = one ? edge('ShiftLeft') || edge('ShiftRight') : edge('KeyO');
    input.parry = edge(one ? 'KeyQ' : 'KeyY'); input.skill = edge(one ? 'KeyE' : 'KeyN'); input.interact = held(one ? 'KeyF' : 'KeyM');
    input.melee = one ? this.mouse.melee : edge('KeyH'); input.fire = one ? this.mouse.fire || this.mouse.tap : held('KeyP') || edge('KeyP'); input.crouch = input.vertical > .5;
    let aim = { x: p.aimX, y: p.aimY };
    if (one && this.mouse.active) {
      const pos = this.renderer.toWorld(this.mouse.x, this.mouse.y);
      aim = normalize(pos.x - p.x, pos.y - p.y + 34);
    } else if (input.move || input.vertical) aim = normalize(input.move || p.face, input.vertical);
    if (assistance) aim = this.assist(p, world, aim);
    input.aimX = aim.x; input.aimY = aim.y;
    return input;
  }
  simulated(p, world) {
    const leader = world.players.find(player => player.device !== 'simulated' && !player.downed) || world.players[0];
    const nearest = world.level.enemies.filter(e => e.alive).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const input = neutral(), spacing = leader.x - p.id * 60, delta = spacing - p.x;
    input.move = Math.abs(delta) > 65 ? Math.sign(delta) : 0;
    const aim = nearest && Math.abs(nearest.x - p.x) < 500 ? normalize(nearest.x - p.x, nearest.y - 30 - (p.y - 34)) : { x: leader.face, y: 0 };
    input.aimX = aim.x; input.aimY = aim.y;
    const tick = Math.floor(world.time * 120);
    input.jump = p.grounded && (p.wall !== 0 || leader.y < p.y - 80 || (!world.level.platforms.some(r => p.x + input.move * 65 > r.x && p.x + input.move * 65 < r.x + r.w && Math.abs(r.y - p.y) < 5) && input.move !== 0));
    input.fire = Boolean(nearest) && tick % 55 < 12;
    input.melee = Boolean(nearest) && Math.abs(nearest.x - p.x) < 110 && tick % 37 === p.id;
    input.skill = Boolean(nearest) && tick % 220 === p.id;
    input.interact = world.players.some(ally => ally.downed && Math.hypot(ally.x - p.x, ally.y - p.y) < 80);
    return input;
  }
}
