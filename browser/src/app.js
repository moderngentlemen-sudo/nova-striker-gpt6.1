import { World, KITS, STEP, ROOMS, clamp } from './world.js';
import { Renderer } from './render.js';
import { Inputs, bindControllers, missingControllers } from './input.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), renderer = new Renderer(canvas), inputs = new Inputs(canvas, renderer);
let selected = 'nova', world = new World(), paused = true, started = false, accumulator = 0, lastTime = performance.now(), hudTime = 0;
let toastTime = 0, audio = null, sound = false, assistance = false, disconnected = false;
const frames = [];
let controllerIds = new Map();
const metrics = { frameCount: 0, frameTimes: [], longFrames: 0 };

function toast(text) { $('toast').textContent = text; $('toast').style.opacity = '1'; toastTime = 2.5; }
function soundEvent(type) {
  if (!sound || !audio) return;
  const tones = { shot: [520,.035], jump: [260,.065], dash: [150,.07], hit: [100,.07], parry: [860,.13], burst: [80,.11], tether: [420,.1] };
  if (!tones[type]) return;
  const oscillator = audio.createOscillator(), gain = audio.createGain(), [frequency, duration] = tones[type];
  oscillator.type = type === 'parry' ? 'sine' : 'triangle'; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
}
function running() { return started && !paused && !disconnected && !world.won && !world.defeated && !document.querySelector('dialog[open]'); }
function syncInput() {
  const enabled = running();
  if (!enabled || enabled !== inputs.enabled) {
    inputs.clear();
    for (const p of world.players) { p.fireHeld = false; p.charge = 0; p.jumpBuffer = 0; p.meleeBuffer = 0; }
  }
  inputs.enabled = enabled; accumulator = 0;
}
function hideResults() { $('result-overlay').hidden = true; }
function updateRoom() {
  document.querySelectorAll('[data-room]').forEach(button => button.classList.toggle('active', button.dataset.room === world.level.room));
  $('room-title').textContent = world.level.room.charAt(0).toUpperCase() + world.level.room.slice(1);
  $('room-number').textContent = String(ROOMS.indexOf(world.level.room) + 1).padStart(2, '0');
  renderer.camera = null; updateHud();
}
function setPaused(value, message = '') {
  if (!started || world.won || world.defeated) return;
  if (!value && disconnected) { toast('Reconnect the controller or change the device in Co-op setup.'); return; }
  paused = value; $('pause-overlay').hidden = !value; $('pause-button').innerHTML = value ? 'Resume <span>▶</span>' : 'Pause <span>Ⅱ</span>';
  $('pause-button').setAttribute('aria-label', value ? 'Resume game' : 'Pause game');
  $('pause-title').textContent = disconnected ? 'Controller disconnected.' : 'Take a breath.';
  $('pause-message').textContent = message || 'Your current encounter is paused.';
  syncInput(); if (!value) canvas.focus();
}
function reset(checkpoint = false, other = false) {
  if (other) {
    const first = world.party.find(p => p.device !== 'simulated') || world.party[0];
    first.kit = first.kit === 'nova' ? 'echo' : 'nova'; selected = first.kit;
  }
  world.reset(world.level.room, checkpoint); renderer.camera = null; inputs.clear();
  hideResults(); $('pause-overlay').hidden = true; paused = false; started = true;
  $('pause-button').innerHTML = 'Pause <span>Ⅱ</span>'; updateRoom(); syncInput(); canvas.focus();
  $('pause-button').setAttribute('aria-label', 'Pause game');
}
function deploy() {
  world = new World(world.level.room, [{ kit: selected, device: 'keyboard1' }]);
  started = true; paused = false; $('welcome').hidden = true; syncInput(); updateRoom(); canvas.focus();
  toast(selected === 'nova' ? 'Click to fire. Hold and release for a charged shot.' : 'Close the distance. Chain melee attacks and counter.');
}
$('deploy-button').addEventListener('click', deploy);
document.querySelectorAll('[data-kit]').forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.kit;
  document.querySelectorAll('[data-kit]').forEach(pick => pick.classList.toggle('selected', pick === button));
  $('deploy-button').innerHTML = 'Deploy ' + KITS[selected].name + ' <span>→</span>';
  world = new World(world.level.room, [{ kit: selected, device: 'keyboard1' }]); renderer.camera = null; updateHud();
}));
document.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => {
  world.reset(button.dataset.room); renderer.camera = null; hideResults(); updateRoom();
  if (started) { paused = false; $('pause-overlay').hidden = true; syncInput(); canvas.focus(); }
}));
inputs.onPause = () => { if (started) setPaused(!paused); };
inputs.onRetry = () => reset(true);
$('pause-button').addEventListener('click', inputs.onPause);
$('resume-button').addEventListener('click', () => {
  if (disconnected) { toast('Reconnect the controller or change the device in Co-op setup.'); return; }
  setPaused(false);
});
$('retry-button').addEventListener('click', () => reset(true));
$('switch-button').addEventListener('click', () => reset(false, true));
$('replay-button').addEventListener('click', () => reset());
$('result-switch').addEventListener('click', () => reset(false, true));
window.addEventListener('blur', () => { if (running()) setPaused(true, 'Paused when the browser lost focus.'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && running()) setPaused(true, 'Paused while the tab was hidden.'); });
window.addEventListener('keydown', event => { if (event.code === 'Enter' && !started && !document.querySelector('dialog[open]')) deploy(); });

function openDialog(dialog) { inputs.clear(); dialog.showModal(); syncInput(); }
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => { syncInput(); if (running()) canvas.focus(); }));
$('help-button').addEventListener('click', () => openDialog($('help-dialog')));
$('sound-toggle').addEventListener('change', event => {
  sound = event.target.checked;
  if (sound) { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); }
});
$('effects-toggle').addEventListener('change', event => { renderer.effects = event.target.checked; });
$('assist-toggle').addEventListener('change', event => { assistance = event.target.checked; });
$('shoulder-toggle').addEventListener('change', event => { inputs.shoulderPreset = event.target.checked; inputs.clear(); });
$('telemetry-button').addEventListener('click', () => { $('telemetry').hidden = !$('telemetry').hidden; updateHud(); });

function buildParty(party = world.party) {
  const pads = inputs.pads().filter(pad => pad.mapping === 'standard');
  $('party-slots').replaceChildren();
  for (let i = 0; i < 4; i++) {
    const entry = party.find((p, index) => (p.slot ?? index) === i);
    const reserved = world.players.find(p => p.id === i) || world.benchPlayers.get(i);
    const row = document.createElement('div'); row.className = 'party-slot';
    const label = document.createElement('label'); label.textContent = 'P' + (i + 1); label.htmlFor = 'device-' + i;
    const kit = document.createElement('select'); kit.id = 'kit-' + i; kit.setAttribute('aria-label', 'Player ' + (i + 1) + ' character');
    for (const [value, definition] of Object.entries(KITS)) { const option = document.createElement('option'); option.value = value; option.textContent = definition.name; kit.append(option); }
    kit.value = entry?.kit || reserved?.kit || Object.keys(KITS)[i];
    const device = document.createElement('select'); device.id = 'device-' + i; device.setAttribute('aria-label', 'Player ' + (i + 1) + ' device');
    const choices = [['off','Not playing'],['keyboard1','Keyboard 1 + mouse'],['keyboard2','Keyboard 2'],['simulated','Simulated ally'], ...pads.map(pad => ['pad' + pad.index, 'Controller ' + (pad.index + 1)])];
    for (const [value, text] of choices) { const option = document.createElement('option'); option.value = value; option.textContent = text; device.append(option); }
    const existing = entry?.device || 'off';
    if (!choices.some(([value]) => value === existing)) {
      const option = document.createElement('option'); option.value = existing; option.textContent = 'Disconnected controller'; device.append(option);
    }
    device.value = existing;
    row.append(label, kit, device); $('party-slots').append(row);
  }
  $('party-error').textContent = '';
  $('device-note').textContent = pads.length ? pads.length + ' standard controller(s) detected. Keyboard 2 uses IJKL, U/O/P/H/Y/N/M.' : 'No standard controllers detected. Press a controller button, then Refresh devices. Keyboard 2 uses IJKL, U/O/P/H/Y/N/M.';
  $('apply-party').textContent = started ? 'Apply squad changes →' : 'Deploy squad →';
  $('party-note').textContent = started ? 'Apply preserves this encounter. Keep each occupied slot’s character to retain health, cooldowns and downed state. Returning slots keep their state. Character changes require a room restart.' : 'Choose each player’s character and input device, then deploy together.';
}
function partyDraft() {
  return Array.from({ length: 4 }, (_, slot) => ({ slot, kit: $('kit-' + slot).value, device: $('device-' + slot).value }));
}
function openParty() {
  setPaused(true, 'Your encounter is held while you update the squad.');
  buildParty(); openDialog($('party-dialog'));
}
$('party-button').addEventListener('click', openParty);
$('pause-party-button').addEventListener('click', openParty);
$('refresh-devices').addEventListener('click', () => buildParty(partyDraft()));
for (const event of ['gamepadconnected', 'gamepaddisconnected']) window.addEventListener(event, () => {
  if ($('party-dialog').open) buildParty(partyDraft());
});
$('stress-button').addEventListener('click', () => buildParty(partyDraft().map(p => p.device === 'off' ? { ...p, device: 'simulated' } : p)));
$('solo-button').addEventListener('click', () => {
  const first = partyDraft().find(p => p.device !== 'off' && p.device !== 'simulated') || world.party.find(p => p.device !== 'simulated');
  buildParty(first ? [first] : [{ slot: 0, kit: selected, device: 'keyboard1' }]);
});
function applyParty(restart = false) {
  const party = partyDraft().filter(p => p.device !== 'off');
  const actual = party.filter(p => p.device !== 'simulated').map(p => p.device);
  if (!actual.length) { $('party-error').textContent = 'Assign at least one keyboard or controller player.'; return; }
  if (new Set(actual).size !== actual.length) { $('party-error').textContent = 'Each real player needs a different device.'; return; }
  const fresh = restart || !started;
  try {
    const nextControllers = bindControllers(party, inputs.pads());
    if (fresh) world.setParty(party); else world.updateParty(party);
    controllerIds = nextControllers;
  } catch (error) { $('party-error').textContent = error.message; return; }
  disconnected = false; started = true; $('welcome').hidden = true;
  if (fresh) {
    paused = false; hideResults(); $('pause-overlay').hidden = true; updateRoom();
    $('pause-button').innerHTML = 'Pause <span>Ⅱ</span>'; $('pause-button').setAttribute('aria-label', 'Pause game');
  } else {
    paused = true; updateHud();
    setPaused(true, 'Squad updated. Your encounter progress is preserved. Release held buttons, then resume when everyone is ready.');
  }
  inputs.clear(); $('party-dialog').close(); syncInput();
  if (running()) canvas.focus();
  toast(fresh ? 'Squad deployed. A new room attempt has started.' : 'Squad updated. Resume when everyone is ready.');
}
$('apply-party').addEventListener('click', () => applyParty());
$('restart-party').addEventListener('click', () => applyParty(true));
function checkConnections() {
  const missing = missingControllers(world.party, inputs.pads(), controllerIds);
  if (missing.length && started) {
    const message = missing.map(p => 'P' + (p.slot + 1) + (p.reason === 'replaced' ? ' has a different controller' : ' controller disconnected')).join('; ') + '. Reconnect, reassign, or remove the affected player in Co-op setup. Your progress is preserved.';
    if (!disconnected || !paused || $('pause-message').textContent !== message) { disconnected = true; setPaused(true, message); }
  } else if (!missing.length && disconnected) { disconnected = false; inputs.clear(); $('pause-title').textContent = 'Controller reconnected.'; $('pause-message').textContent = 'Release held buttons, then resume when everyone is ready.'; }
}

function updateHud() {
  const hud = $('player-hud');
  if (hud.children.length !== world.players.length) {
    hud.replaceChildren();
    for (const p of world.players) {
      const card = document.createElement('div'); card.className = 'player-card'; card.style.setProperty('--player-color', KITS[p.kit].color);
      card.innerHTML = '<strong></strong><small></small><div class="health"><i></i></div><div class="skill-status"><span></span><b></b></div>'; hud.append(card);
    }
  }
  world.players.forEach((p, i) => {
    const card = hud.children[i], kit = KITS[p.kit];
    card.style.setProperty('--player-color', kit.color);
    card.querySelector('strong').textContent = kit.name;
    card.querySelector('small').textContent = 'P' + (p.id + 1) + (p.device === 'simulated' ? ' · SIM' : '');
    card.querySelector('.health i').style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
    card.querySelector('.skill-status span').textContent = p.downed ? 'Awaiting revive' : kit.skill;
    card.querySelector('.skill-status b').textContent = p.downed ? 'DOWN' : p.skillCooldown > 0 ? p.skillCooldown.toFixed(1) + 's' : 'READY';
  });
  const threats = world.level.enemies.filter(e => e.alive).length;
  $('threat-count').textContent = world.level.objective === 'reach' ? 'TRAVERSAL TEST' : threats + ' SIGNAL' + (threats === 1 ? '' : 'S');
  $('party-count').textContent = world.players.length + ' PLAYER' + (world.players.length === 1 ? '' : 'S');
  $('objective').textContent = world.level.objective === 'reach' ? 'Reach the beacon. Find your own route.' : world.level.objective === 'clear' ? 'Clear the room. Read the threat cues.' : threats > 0 ? 'Clear the threats. Restore the relay.' : 'Relay ready. Hold interact nearby to restore.';
  if (!$('telemetry').hidden) {
    $('telemetry').replaceChildren();
    const lines = ['ROOM ' + world.level.room.toUpperCase() + ' · ' + world.time.toFixed(1) + 's',
      'THREATS ' + threats + ' · SHOTS ' + world.stats.shots + ' · HITS ' + world.stats.hits,
      'PARRIES ' + world.stats.parries + ' · PERFECT ' + world.stats.perfectParries + ' · SYNC ' + world.stats.syncs,
      'FALLS ' + world.stats.falls + ' · REGROUPS ' + world.stats.recoveries + ' · REVIVES ' + world.stats.revives,
      'SESSION JOINS ' + world.stats.joins + ' · DEPARTURES ' + world.stats.departures + ' · DEVICE CHANGES ' + world.stats.deviceChanges,
      'LAST INPUT ' + inputs.lastAction,
      ...world.players.map(p => 'P' + (p.id + 1) + ' ' + p.kit.toUpperCase() + ' · HP ' + Math.round(p.hp) + ' · X ' + Math.round(p.x) + ' Y ' + Math.round(p.y) + (p.grounded ? ' GROUNDED' : ' AIR'))];
    lines.forEach(text => { const line = document.createElement('div'); line.textContent = text; $('telemetry').append(line); });
  }
}
function showResult() {
  if (!$('result-overlay').hidden) return;
  paused = true; syncInput(); $('result-overlay').hidden = false;
  $('result-title').textContent = world.defeated ? 'Regroup. Try again.' : world.level.objective === 'repair' ? 'Transit restored.' : world.level.objective === 'clear' ? 'Room secured.' : 'Beacon reached.';
  $('result-description').textContent = world.defeated ? 'A different angle or a better-timed counter may create the opening you need.' : 'The next attempt is a chance to change your route, timing, or character.';
  $('result-stats').innerHTML = '<div><strong>' + Math.floor(world.time) + 's</strong><small>SIMULATION</small></div><div><strong>' + world.stats.perfectParries + '</strong><small>PERFECT PARRIES</small></div><div><strong>' + world.stats.syncs + '</strong><small>SYNC ACTIONS</small></div>';
}
$('export-button').addEventListener('click', () => {
  const sorted = [...metrics.frameTimes].sort((a, b) => a - b);
  const percentile = value => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))].toFixed(2)) : null;
  const report = { prototype: 'Nova Striker browser lab 0.2', createdAt: new Date().toISOString(), room: world.level.room, elapsedSeconds: Number(world.time.toFixed(2)),
    party: world.party.map(p => ({ slot: p.slot, kit: p.kit, device: p.device })), simulatedPlayers: world.party.filter(p => p.device === 'simulated').length,
    partyChanges: world.partyChanges, partyChangeScope: 'Last 100 changes in this room attempt, including checkpoint retries. Slots are zero-based. Enemy composition is fixed at room start; attack scheduling follows the active party.',
    results: { won: world.won, defeated: world.defeated, ...world.stats }, viewport: { width: Math.round(renderer.width), height: Math.round(renderer.height) },
    rendering: { scope: 'Active gameplay across this browser session, including earlier rooms', sampledFrames: sorted.length, medianMs: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), longFrames: metrics.longFrames },
    limitations: ['Physical four-controller testing and human game-feel validation have not been established by this report.', 'Frame intervals include browser scheduling; these are not GPU or controller-to-photon measurements.'] };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'nova-striker-playtest.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Playtest report exported.');
});

new ResizeObserver(() => renderer.resize()).observe(canvas);
renderer.resize(); updateRoom();
function frame(timestamp) {
  const raw = (timestamp - lastTime) / 1000, dt = Math.min(.05, Math.max(0, raw)); lastTime = timestamp;
  frames.push(raw); if (frames.length > 60) frames.shift();
  checkConnections(); inputs.pollSystemButtons(world.party, controllerIds, !disconnected && !document.querySelector('dialog[open]'));
  if (running()) {
    metrics.frameCount++;
    if (metrics.frameTimes.length < 72000) metrics.frameTimes.push(raw * 1000);
    if (raw * 1000 > 33.3) metrics.longFrames++;
    accumulator += dt;
    while (accumulator >= STEP && running()) {
      const commands = world.players.map(p => inputs.sample(p, world, assistance));
      world.step(STEP, commands); world.recoverSpread(renderer.camera, renderer.width, renderer.height, STEP);
      for (const event of world.events) { soundEvent(event.type); if (event.type === 'text' && /CHECKPOINT|REGROUPED|REVIVED/.test(event.text)) toast(event.text); }
      inputs.endStep(); accumulator -= STEP;
    }
  } else accumulator = 0;
  renderer.draw(world, dt);
  hudTime += dt; toastTime -= dt;
  if (toastTime <= 0) $('toast').style.opacity = '0';
  if (hudTime >= .1) {
    updateHud(); hudTime = 0;
    const average = frames.reduce((sum, value) => sum + value, 0) / (frames.length || 1);
    $('fps').textContent = average > 0 ? Math.round(1 / average) + ' FPS' : '— FPS';
  }
  if (world.won || world.defeated) showResult();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
