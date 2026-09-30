export const STEP = 1 / 120;
export const KITS = {
  nova: { name: 'Nova', role: 'Sentinel', color: '#68caff', accent: '#ffc16f', hp: 100, speed: 320, skill: 'Bulwark Pulse', cooldown: 6 },
  echo: { name: 'Echo', role: 'Pursuit', color: '#ffd077', accent: '#ff9f42', hp: 100, speed: 350, skill: 'Pursuit Tether', cooldown: 5 },
  tank: { name: 'Tank rig', role: 'Test role', color: '#98e7c1', accent: '#49c8a0', hp: 140, speed: 285, skill: 'Impact Brace', cooldown: 7 },
  support: { name: 'Support rig', role: 'Test role', color: '#d7b1ff', accent: '#b78aef', hp: 90, speed: 320, skill: 'Recovery Pulse', cooldown: 9 }
};
export const ROOMS = ['skyport', 'movement', 'combat', 'ascent'];
export const neutral = () => ({ move: 0, vertical: 0, jump: false, dash: false, melee: false, parry: false, skill: false, interact: false, crouch: false, fire: false, aimX: 1, aimY: 0 });
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const normalize = (x, y) => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};
export const box = p => ({ x: p.x - p.w / 2, y: p.y - p.h, w: p.w, h: p.h });
export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const freshStats = () => ({ shots: 0, hits: 0, parries: 0, perfectParries: 0, syncs: 0, recoveries: 0, falls: 0, revives: 0, defeats: 0 });
function validParty(party) {
  if (!Array.isArray(party) || party.length < 1 || party.length > 4 || party.some(p => !KITS[p.kit])) throw new RangeError('Choose one to four valid characters.');
}
export function segmentHitsRect(ax, ay, bx, by, r) {
  let low = 0, high = 1;
  const dx = bx - ax, dy = by - ay;
  for (const [p, q] of [[-dx, ax - r.x], [dx, r.x + r.w - ax], [-dy, ay - r.y], [dy, r.y + r.h - ay]]) {
    if (p === 0) { if (q < 0) return false; }
    else {
      const t = q / p;
      if (p < 0) low = Math.max(low, t); else high = Math.min(high, t);
      if (low > high) return false;
    }
  }
  return true;
}

export function makeLevel(room = 'skyport', count = 1) {
  const level = { room, width: 2520, height: 1020, spawn: { x: 150, y: 720 }, checkpoint: { x: 150, y: 720 }, platforms: [], enemies: [], markers: [], exit: { x: 2360, y: 720 }, console: { x: 2220, y: 720 }, objective: 'repair' };
  const platform = (x, y, w, h = 30) => level.platforms.push({ x, y, w, h });
  const enemy = (type, x, y) => level.enemies.push({ type, x, y, home: x, w: type === 'elite' ? 65 : 40, h: type === 'elite' ? 84 : 54, hp: type === 'elite' ? 170 : type === 'shield' ? 62 : 42, maxHp: type === 'elite' ? 170 : type === 'shield' ? 62 : 42, face: -1, timer: .8 + level.enemies.length * .25, windup: 0, attackKind: 'parry', stagger: 0, flash: 0, lastHit: -100, lastPlayer: null, syncUsed: false, alive: true });
  if (room === 'ascent') {
    level.width = 1280; level.height = 1700;
    level.spawn = { x: 190, y: 1540 }; level.checkpoint = { ...level.spawn };
    level.exit = { x: 970, y: 440 }; level.objective = 'reach';
    platform(0, 1540, 1280, 160);
    for (const [x, y, w] of [[300, 1430, 240], [630, 1320, 220], [870, 1210, 200], [580, 1100, 230], [280, 990, 200], [70, 880, 180], [350, 770, 210], [670, 660, 200], [870, 550, 220], [830, 440, 300]]) platform(x, y, w);
    platform(30, 480, 26, 400); platform(1190, 720, 26, 520);
    level.markers = [{ x: 260, y: 1500, text: 'DOUBLE JUMP' }, { x: 670, y: 1040, text: 'REGROUP SHELF' }, { x: 900, y: 410, text: 'SUMMIT BEACON' }];
    return level;
  }
  platform(0, 720, 690, 300); platform(860, 720, 700, 300); platform(1710, 720, 810, 300);
  platform(320, 610, 190); platform(580, 510, 170); platform(920, 580, 220);
  platform(1270, 600, 210); platform(1530, 500, 160); platform(1830, 605, 200);
  platform(1150, 400, 28, 320);
  level.markers = [{ x: 180, y: 665, text: 'DEPLOYMENT DECK' }, { x: 700, y: 620, text: 'DASH THE GAP' }, { x: 1135, y: 360, text: 'WALL ROUTE' }, { x: 1600, y: 645, text: 'CHECKPOINT' }];
  if (room === 'movement') {
    level.objective = 'reach';
    level.markers.push({ x: 380, y: 575, text: 'JUMP + DOUBLE JUMP' }, { x: 1940, y: 575, text: 'BRAKE YOUR DASH' });
  } else {
    enemy('shield', 560, 720); enemy('turret', 995, 580); enemy('walker', 1340, 720);
    enemy('turret', 1880, 605); enemy('walker', 1980, 720);
    if (room === 'skyport') enemy('elite', 2200, 720);
    for (let i = 1; i < count; i++) enemy(i % 2 ? 'walker' : 'turret', i === 2 ? 1390 : 880 + i * 260, i === 2 ? 600 : 720);
    if (room === 'combat') level.objective = 'clear';
  }
  return level;
}

export function makePlayer(id, kit, device, spawn) {
  return { id, kit, device, x: spawn.x + id * 48, y: spawn.y, w: kit === 'tank' ? 40 : 32, h: 60, vx: 0, vy: 0, aimX: 1, aimY: 0, face: 1,
    hp: KITS[kit].hp, maxHp: KITS[kit].hp, grounded: false, wall: 0, jumps: 2, airDash: true, coyote: 0, jumpBuffer: 0, dashTime: 0, dashCooldown: 0,
    dashX: 1, dashY: 0, dashSpeed: 910, slide: 0, invulnerable: 0, recovery: 0, guard: 0, guardAge: 0, guardCooldown: 0, skillCooldown: 0,
    skillWindup: 0, pendingSkill: null, meleeBuffer: 0, attack: null, combo: 0, comboTimer: 0, charge: 0, fireHeld: false, shotCooldown: 0, downed: false, revive: 0, spread: 0, brace: 0 };
}

export class World {
  constructor(room = 'skyport', party = [{ kit: 'nova', device: 'keyboard1' }]) {
    validParty(party);
    this.events = []; this.time = 0; this.stats = freshStats();
    this.party = party.map(p => ({ ...p })); this.reset(room);
  }
  reset(room = this.level.room, checkpoint = false) {
    const previous = checkpoint ? { ...this.level.checkpoint } : null;
    const snapshot = checkpoint ? this.checkpointSnapshot : null;
    if (!checkpoint) { this.time = 0; this.stats = freshStats(); }
    this.level = makeLevel(room, this.party.length);
    if (previous) this.level.checkpoint = previous;
    if (snapshot) this.level.enemies = snapshot.map(e => ({ ...e }));
    this.players = this.party.map((p, i) => makePlayer(i, p.kit, p.device, this.level.checkpoint));
    this.bullets = []; this.effects = []; this.repair = 0; this.won = false; this.defeated = false; this.defeatTimer = 0; this.checkpointReached = Boolean(previous && snapshot); this.checkpointSnapshot = snapshot; this.events = [];
    this.initialEnemies = this.level.enemies.length;
  }
  setParty(party) { validParty(party); this.party = party.map(p => ({ ...p })); this.reset(); }
  event(type, x, y, text = '', color = '#a4efff') {
    this.events.push({ type, x, y, text, color });
    this.effects.push({ type, x, y, text, color, life: type === 'text' ? 1.05 : .38, maxLife: type === 'text' ? 1.05 : .38 });
  }
  visible(ax, ay, bx, by) { return !this.level.platforms.some(r => segmentHitsRect(ax, ay, bx, by, r)); }
  center(p) { return { x: p.x, y: p.y - p.h / 2 }; }
  damagePlayer(p, damage, direction = 1, unblockable = false) {
    if (p.downed || p.invulnerable > 0) return false;
    if (p.guard > 0 && !unblockable && direction * p.face < 0) {
      this.parry(p, p.guardAge <= .07);
      return false;
    }
    p.hp = Math.max(0, p.hp - damage * (p.brace > 0 ? .4 : 1));
    p.invulnerable = .7; p.recovery = .13; p.attack = null; p.charge = 0; p.dashTime = 0;
    p.vx = direction * 210; p.vy = -180;
    this.event('hit', p.x, p.y - 30, '', '#ff7d7b');
    if (p.hp === 0) {
      p.downed = true; p.vx = 0;
      this.event('text', p.x, p.y - 80, 'DOWNED', '#ff7d7b');
    }
    return true;
  }
  parry(p, perfect) {
    this.stats.parries++;
    if (perfect) this.stats.perfectParries++;
    p.guard = 0; p.recovery = 0;
    if (p.kit === 'echo') p.skillCooldown = Math.max(0, p.skillCooldown - 1);
    this.event('parry', p.x, p.y - 35, '', perfect ? '#fff6bd' : '#7de2ef');
    this.event('text', p.x, p.y - 80, perfect ? 'PERFECT' : 'PARRY', '#fff6bd');
  }
  hitEnemy(e, damage, p, knock = 0, stagger = .25) {
    if (!e.alive) return;
    const front = (p.x - e.x) * e.face > 0;
    if (e.type === 'shield' && front && e.stagger <= 0) {
      damage *= .25;
      this.event('text', e.x, e.y - e.h - 10, 'ARMOR', '#b3d6e5');
    }
    if (e.lastPlayer !== null && e.lastPlayer !== p.id && this.time - e.lastHit < .55 && e.stagger > 0 && !e.syncUsed) {
      e.stagger = Math.max(e.stagger, .7); e.syncUsed = true; this.stats.syncs++;
      this.event('text', e.x, e.y - e.h - 24, 'SYNC', '#9ae8dd');
    }
    e.hp -= damage; e.flash = .12; e.stagger = Math.max(e.stagger, stagger);
    e.lastHit = this.time; e.lastPlayer = p.id;
    const floor = this.level.platforms.find(r => e.x >= r.x && e.x <= r.x + r.w && Math.abs(r.y - e.y) < 3);
    if (floor) e.x = clamp(e.x + knock, floor.x + e.w / 2, floor.x + floor.w - e.w / 2);
    this.stats.hits++;
    this.event('hit', e.x, e.y - e.h / 2, '', KITS[p.kit].color);
    if (e.hp <= 0) { e.alive = false; this.event('burst', e.x, e.y - 30, '', KITS[p.kit].accent); }
  }
  shoot(p, charged = false) {
    if (p.shotCooldown > 0 || p.downed || p.recovery > 0) return;
    const strong = charged && p.kit === 'nova';
    const speed = strong ? 1350 : p.kit === 'echo' ? 1050 : 1150;
    p.shotCooldown = strong ? .3 : p.kit === 'echo' ? .4 : .16;
    this.bullets.push({ x: p.x + p.aimX * 25, y: p.y - 34 + p.aimY * 25, vx: p.aimX * speed, vy: p.aimY * speed,
      radius: strong ? 8 : 4, owner: p.id, damage: strong ? 42 : charged ? 20 : p.kit === 'echo' ? 11 : 14, life: 1.8, color: strong ? '#ffe3aa' : KITS[p.kit].color, pierce: strong ? 1 : 0, hit: [], kind: 'friendly' });
    this.stats.shots++; this.event('shot', p.x + p.aimX * 30, p.y - 34 + p.aimY * 30, '', KITS[p.kit].accent);
  }
  beginAttack(p) {
    p.combo = p.comboTimer > 0 ? p.combo % (p.grounded ? 3 : 2) + 1 : 1;
    p.comboTimer = .65;
    p.attack = { elapsed: 0, hit: [], duration: p.kit === 'echo' ? .28 : .35, active: .07, reach: p.kit === 'echo' ? 112 : p.kit === 'tank' ? 95 : 80 };
    p.meleeBuffer = 0;
    this.event('swing', p.x, p.y - 32, '', KITS[p.kit].accent);
  }
  beginSkill(p) {
    if (p.skillCooldown > 0 || p.recovery > 0 || p.downed) return;
    p.skillCooldown = KITS[p.kit].cooldown;
    p.pendingSkill = { kit: p.kit }; p.skillWindup = p.kit === 'echo' ? .08 : .1;
    if (p.kit === 'echo') {
      const center = this.center(p);
      const target = this.level.enemies.filter(e => {
        const c = this.center(e), dx = c.x - center.x, dy = c.y - center.y, d = Math.hypot(dx, dy);
        return e.alive && (e.type !== 'shield' || e.stagger > 0) && d <= 200 && (dx * p.aimX + dy * p.aimY) / (d || 1) >= Math.SQRT1_2 && this.visible(center.x, center.y, c.x, c.y);
      }).sort((a, b) => distance(center, this.center(a)) - distance(center, this.center(b)))[0];
      if (!target) {
        p.pendingSkill = null; p.skillCooldown = 1; p.recovery = .18;
        this.event('text', p.x, p.y - 85, 'NO EXPOSED TARGET', '#ffc16f');
      } else p.pendingSkill.target = target;
    }
  }
  resolveSkill(p) {
    const skill = p.pendingSkill;
    p.pendingSkill = null;
    if (!skill || p.downed) return;
    if (skill.kit === 'echo') {
      if (!skill.target.alive) return;
      const c = this.center(skill.target), direction = normalize(c.x - p.x, c.y - (p.y - 30));
      p.dashX = direction.x; p.dashY = direction.y; p.dashSpeed = Math.min(1300, distance(this.center(p), c) / .13); p.dashTime = .13;
      p.attack = { elapsed: 0, hit: [], duration: .32, active: .07, reach: 105 };
      this.event('tether', c.x, c.y, '', '#ffbf67');
      return;
    }
    this.effects.push({ type: 'pulse', x: p.x, y: p.y - 30, angle: Math.atan2(p.aimY, p.aimX), color: KITS[p.kit].color, life: .35, maxLife: .35 });
    if (skill.kit === 'support') {
      for (const ally of this.players) if (!ally.downed && distance(p, ally) < 170) ally.hp = Math.min(ally.maxHp, ally.hp + 28);
      this.event('text', p.x, p.y - 85, 'RECOVERY +28', '#d7b1ff');
    } else {
      if (skill.kit === 'tank') p.brace = .8;
      for (const e of this.level.enemies) {
        const dx = e.x - p.x, dy = (e.y - e.h / 2) - (p.y - 30), d = Math.hypot(dx, dy);
        if (e.alive && d < 135 && (skill.kit === 'tank' || dx * p.aimX + dy * p.aimY > 0)) {
          e.stagger = .85; e.windup = 0;
          this.hitEnemy(e, skill.kit === 'tank' ? 24 : 8, p, p.face * 12, .85);
        }
      }
      if (skill.kit === 'nova') this.bullets = this.bullets.filter(b => !(b.owner === null && b.kind !== 'unblockable' && distance({ x: p.x, y: p.y - 30 }, b) < 145 && (b.x - p.x) * p.aimX + (b.y - p.y + 30) * p.aimY > 0));
    }
  }
  moveBody(p, dt) {
    p.wall = 0;
    p.x += p.vx * dt;
    for (const r of this.level.platforms) if (overlap(box(p), r)) {
      if (p.vx > 0) { p.x = r.x - p.w / 2; p.wall = 1; }
      else if (p.vx < 0) { p.x = r.x + r.w + p.w / 2; p.wall = -1; }
      p.vx = 0;
      if (p.dashTime > 0) p.dashTime = 0;
    }
    p.x = clamp(p.x, p.w / 2, this.level.width - p.w / 2);
    p.y += p.vy * dt; p.grounded = false;
    for (const r of this.level.platforms) if (overlap(box(p), r)) {
      if (p.vy >= 0) { p.y = r.y; p.grounded = true; p.jumps = 2; p.airDash = true; }
      else p.y = r.y + r.h + p.h;
      p.vy = 0;
      if (p.dashTime > 0 && Math.abs(p.dashY) > .2) p.dashTime = 0;
    }
  }
  stepPlayer(p, input, dt) {
    const keys = ['dashCooldown', 'invulnerable', 'recovery', 'guardCooldown', 'skillCooldown', 'comboTimer', 'meleeBuffer', 'jumpBuffer', 'brace'];
    for (const key of keys) p[key] = Math.max(0, p[key] - dt);
    if (p.guard > 0) { p.guard = Math.max(0, p.guard - dt); p.guardAge += dt; }
    if (p.skillWindup > 0) { p.skillWindup -= dt; if (p.skillWindup <= 0) this.resolveSkill(p); }
    if (p.downed) {
      p.vy = Math.min(950, p.vy + 1850 * dt); this.moveBody(p, dt);
      if (p.y > this.level.height + 100) { p.x = this.level.checkpoint.x; p.y = this.level.checkpoint.y; p.vx = 0; p.vy = 0; }
      return;
    }
    const aim = normalize(input.aimX, input.aimY);
    p.aimX = aim.x; p.aimY = aim.y;
    if (Math.abs(aim.x) > .15) p.face = Math.sign(aim.x);
    p.coyote = p.grounded ? .1 : Math.max(0, p.coyote - dt);
    if (input.jump) p.jumpBuffer = .1;
    if (p.jumpBuffer > 0 && p.recovery <= 0) {
      if (p.wall || p.coyote > 0 || p.jumps > 0) {
        if (p.wall && !p.grounded) { p.vx = -p.wall * 400; p.recovery = .075; p.jumps = 1; }
        else p.jumps = p.coyote > 0 ? 1 : p.jumps - 1;
        p.vy = -660; p.coyote = 0; p.jumpBuffer = 0; p.grounded = false;
        this.event('jump', p.x, p.y, '', KITS[p.kit].color);
      }
    }
    if (input.dash && p.recovery <= 0 && (!p.attack || p.attack.hit.length > 0)) {
      if (p.dashTime > 0) {
        p.dashTime = 0; p.vx *= .18; p.vy *= .18; p.recovery = .06;
        this.event('text', p.x, p.y - 85, 'VELOCITY BREAK', '#a5eafa');
      } else if (p.dashCooldown <= 0 && (p.grounded || p.airDash)) {
        const d = Math.hypot(input.move, input.vertical) > .2 ? normalize(input.move, input.vertical) : aim;
        p.dashX = d.x; p.dashY = d.y; p.dashSpeed = 910; p.dashTime = .18; p.dashCooldown = .45;
        if (!p.grounded) p.airDash = false;
        if (p.attack?.hit.length > 0) p.attack = null;
        this.event('dash', p.x, p.y - 30, '', KITS[p.kit].color);
      }
    }
    const wantsShort = input.crouch || p.slide > 0;
    if (wantsShort && p.grounded) {
      if (p.h === 60 && Math.abs(p.vx) > 180 && input.crouch) { p.slide = .32; p.slideDirection = Math.sign(p.vx) || p.face; this.event('text', p.x, p.y - 75, 'SLIDE', '#a5eafa'); }
      p.h = 36;
    } else if (p.h !== 60 && !this.level.platforms.some(r => overlap({ x: p.x - p.w / 2, y: p.y - 60, w: p.w, h: 60 }, r))) p.h = 60;
    p.slide = Math.max(0, p.slide - dt);
    if (p.dashTime > 0) {
      p.dashTime = Math.max(0, p.dashTime - dt); p.vx = p.dashX * p.dashSpeed; p.vy = p.dashY * p.dashSpeed;
    } else {
      if (p.recovery <= 0) {
        const target = p.slide > 0 ? p.slideDirection * 540 : input.move * KITS[p.kit].speed * (p.h < 60 ? .45 : 1);
        p.vx += (target - p.vx) * Math.min(1, (p.grounded ? 22 : 12) * dt);
      }
      p.vy = Math.min(950, p.vy + 1850 * dt);
      if (p.wall && p.vy > (input.crouch ? 35 : 145)) p.vy = input.crouch ? 35 : 145;
    }
    this.moveBody(p, dt);
    p.shotCooldown = Math.max(0, p.shotCooldown - dt);
    if (input.fire && !p.fireHeld) this.shoot(p);
    if (input.fire) p.charge = Math.min(.9, p.charge + dt);
    else { if (p.fireHeld && p.charge >= .35) this.shoot(p, true); p.charge = 0; }
    p.fireHeld = input.fire;
    if (input.parry && p.guardCooldown <= 0 && p.recovery <= 0) { p.guard = .16; p.guardAge = 0; p.guardCooldown = .38; }
    if (input.skill) this.beginSkill(p);
    if (input.melee) p.meleeBuffer = .12;
    if (p.meleeBuffer > 0 && !p.attack && p.recovery <= 0) this.beginAttack(p);
    if (p.attack) {
      p.attack.elapsed += dt;
      if (p.attack.elapsed >= p.attack.active && p.attack.elapsed < p.attack.active + .1) {
        for (const e of this.level.enemies) {
          const c = this.center(e), dx = c.x - p.x, dy = c.y - (p.y - 30);
          if (e.alive && !p.attack.hit.includes(e) && Math.hypot(dx, dy) < p.attack.reach && dx * p.aimX + dy * p.aimY > -20) {
            p.attack.hit.push(e);
            this.hitEnemy(e, p.kit === 'echo' ? 22 + p.combo * 3 : p.kit === 'tank' ? 30 : 17, p, p.face * (p.combo === 3 ? 25 : 8), .3);
          }
        }
      }
      if (p.attack.elapsed >= p.attack.duration) p.attack = null;
    }
    if (p.y > this.level.height + 100) {
      this.stats.falls++;
      p.x = this.level.checkpoint.x + p.id * 45; p.y = this.level.checkpoint.y; p.vx = 0; p.vy = 0;
      p.hp = Math.max(0, p.hp - 20); p.invulnerable = .8; if (p.hp === 0) p.downed = true;
      this.event('text', p.x, p.y - 85, 'FALL -20', '#ff9d7e');
    }
    if (this.level.room !== 'ascent' && !this.checkpointReached && p.x > 1710 && p.grounded) {
      this.checkpointReached = true; this.level.checkpoint = { x: 1770, y: 720 };
      this.checkpointSnapshot = this.level.enemies.map(e => ({ ...e }));
      this.event('text', 1770, 645, 'CHECKPOINT', '#b0e9c2');
    }
  }
  stepEnemy(e, dt) {
    if (!e.alive) return;
    e.flash = Math.max(0, e.flash - dt); e.stagger = Math.max(0, e.stagger - dt);
    if (e.stagger > 0) { e.windup = 0; return; }
    if (this.time - e.lastHit > 1) e.syncUsed = false;
    const target = this.players.filter(p => !p.downed).sort((a, b) => distance(e, a) - distance(e, b))[0];
    if (!target) return;
    const dx = target.x - e.x, range = Math.abs(dx), vertical = Math.abs(target.y - e.y);
    e.face = Math.sign(dx) || e.face;
    if ((e.type === 'walker' || e.type === 'shield') && range > 62 && range < 650 && vertical < 90 && e.windup <= 0) {
      const next = e.x + e.face * (e.type === 'walker' ? 90 : 55) * dt;
      const supported = this.level.platforms.some(r => next > r.x + 25 && next < r.x + r.w - 25 && Math.abs(r.y - e.y) < 3);
      if (supported && !this.level.platforms.some(r => overlap({ x: next - e.w / 2, y: e.y - e.h, w: e.w, h: e.h }, r))) e.x = next;
    }
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        if (e.type === 'walker' || e.type === 'shield') {
          if (range < 90 && vertical < 75) {
            const blocked = target.guard > 0 && e.attackKind !== 'unblockable' && target.face !== e.face;
            this.damagePlayer(target, e.type === 'shield' ? 18 : 13, e.face, e.attackKind === 'unblockable');
            if (blocked) e.stagger = .8;
          }
          this.event('swing', e.x + e.face * 35, e.y - 30, '', e.attackKind === 'unblockable' ? '#ff807a' : '#ffe6a1');
        } else {
          const direction = normalize(target.x - e.x, target.y - 35 - (e.y - 38));
          this.bullets.push({ x: e.x + direction.x * 35, y: e.y - 38, vx: direction.x * (e.type === 'elite' ? 460 : 340), vy: direction.y * (e.type === 'elite' ? 460 : 340), owner: null, radius: e.type === 'elite' ? 7 : 5, life: 3.2, damage: e.type === 'elite' ? 20 : 13, kind: e.attackKind, color: e.attackKind === 'unblockable' ? '#ff7b78' : '#ffe098' });
        }
        e.timer = e.type === 'elite' ? 1.25 : 1.7;
      }
      return;
    }
    e.timer -= dt;
    const inRange = e.type === 'walker' || e.type === 'shield' ? range < 85 && vertical < 75 : range < 820 && vertical < 500;
    const slots = 1 + Math.floor(this.players.length / 2);
    if (e.timer <= 0 && inRange && this.level.enemies.filter(enemy => enemy.windup > 0).length < slots) {
      e.attackKind = e.type === 'elite' && Math.floor(this.time) % 3 === 0 ? 'unblockable' : 'parry';
      e.windup = e.type === 'elite' ? .7 : .55;
    }
  }
  stepBullets(dt) {
    for (const b of this.bullets) {
      b.life -= dt;
      const oldX = b.x, oldY = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (this.level.platforms.some(r => segmentHitsRect(oldX, oldY, b.x, b.y, r))) { b.life = 0; this.event('shot', b.x, b.y, '', b.color); continue; }
      if (b.owner === null) {
        for (const p of this.players) {
          if (p.downed || !segmentHitsRect(oldX, oldY, b.x, b.y, { x: p.x - p.w / 2 - b.radius, y: p.y - p.h - b.radius, w: p.w + b.radius * 2, h: p.h + b.radius * 2 })) continue;
          const perfect = p.guardAge <= .07;
          const facing = p.aimX * -b.vx + p.aimY * -b.vy > 0;
          if (p.guard > 0 && facing && b.kind !== 'unblockable') {
            this.parry(p, perfect);
            if (perfect) { b.owner = p.id; b.vx = p.aimX * 950; b.vy = p.aimY * 950; b.kind = 'friendly'; b.color = KITS[p.kit].accent; b.damage = 30; b.hit = []; b.pierce = 0; }
            else b.life = 0;
          } else { this.damagePlayer(p, b.damage, Math.sign(b.vx), b.kind === 'unblockable'); b.life = 0; }
          break;
        }
      } else {
        const p = this.players.find(player => player.id === b.owner);
        for (const e of this.level.enemies) if (e.alive && !(b.hit || []).includes(e) && segmentHitsRect(oldX, oldY, b.x, b.y, box(e))) {
          b.hit.push(e); this.hitEnemy(e, b.damage, p, Math.sign(b.vx) * 5, .12);
          if (b.pierce > 0) b.pierce--; else { b.life = 0; break; }
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
  }
  step(dt, inputs = []) {
    if (this.won) return;
    this.time += dt; this.events = [];
    for (let i = 0; i < this.players.length; i++) this.stepPlayer(this.players[i], inputs[i] || neutral(), dt);
    for (const e of this.level.enemies) this.stepEnemy(e, dt);
    this.stepBullets(dt);
    for (const down of this.players.filter(p => p.downed)) {
      const helper = this.players.find((p, i) => !p.downed && inputs[i]?.interact && distance(p, down) < 90);
      down.revive = helper ? down.revive + dt : Math.max(0, down.revive - dt * 2);
      if (down.revive >= 1.5) {
        down.downed = false; down.hp = down.maxHp * .4; down.revive = 0; down.invulnerable = 1; this.stats.revives++;
        this.event('text', down.x, down.y - 85, 'REVIVED', '#a4e8c1');
      }
    }
    if (this.players.every(p => p.downed)) {
      this.defeatTimer += dt;
      if (this.defeatTimer > .8 && !this.defeated) { this.defeated = true; this.stats.defeats++; }
    }
    const enemiesLeft = this.level.enemies.filter(e => e.alive).length;
    if (this.level.objective === 'repair') {
      const repairer = this.players.find((p, i) => !p.downed && inputs[i]?.interact && distance(p, this.level.console) < 105 && p.invulnerable <= 0);
      if (repairer && enemiesLeft === 0) this.repair = Math.min(3, this.repair + dt);
      if (this.repair >= 3) { this.won = true; this.event('text', this.level.console.x, this.level.console.y - 100, 'TRANSIT RESTORED', '#a4e8c1'); }
    } else if (this.level.objective === 'clear' && enemiesLeft === 0) this.won = true;
    else if (this.level.objective === 'reach' && this.players.some(p => !p.downed && distance(p, this.level.exit) < 85)) this.won = true;
    for (const e of this.effects) e.life -= dt;
    this.effects = this.effects.filter(e => e.life > 0);
  }
  cameraTarget(width, height) {
    const players = this.players;
    const xs = players.map(p => p.x), ys = players.map(p => p.y - 30);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const zoom = clamp(Math.min(width / (maxX - minX + 530), height / (maxY - minY + 400)), .8, 1.15);
    return { x: clamp((minX + maxX) / 2 + 80, width / zoom / 2, Math.max(width / zoom / 2, this.level.width - width / zoom / 2)),
      y: clamp((minY + maxY) / 2 - 95, height / zoom / 2, Math.max(height / zoom / 2, this.level.height - height / zoom / 2)), zoom };
  }
  recoverSpread(camera, width, height, dt) {
    const anchor = this.players.find(p => p.device !== 'simulated' && !p.downed) || this.players[0];
    for (const p of this.players) {
      if (p === anchor) continue;
      const dx = Math.abs(p.x - anchor.x), dy = Math.abs(p.y - anchor.y);
      const outside = dx > width / .8 - 250 || dy > height / .8 - 230;
      p.spread = outside ? p.spread + dt : 0;
      if (p.spread > 1.1) {
        const safe = this.level.platforms.filter(r => r.w > 90).sort((a, b) => Math.hypot(a.x + a.w / 2 - anchor.x, a.y - anchor.y) - Math.hypot(b.x + b.w / 2 - anchor.x, b.y - anchor.y))[0];
        p.x = clamp(anchor.x + (p.id % 2 ? -50 : 50), safe.x + p.w, safe.x + safe.w - p.w); p.y = safe.y;
        p.vx = 0; p.vy = 0; p.dashTime = 0; p.spread = 0; p.attack = null; p.pendingSkill = null; p.skillWindup = 0;
        // Recovery grants no health, resources, cooldown reset, or checkpoint progress.
        p.invulnerable = Math.max(p.invulnerable, .4); p.recovery = .4;
        this.stats.recoveries++; this.event('text', p.x, p.y - 85, 'REGROUPED', '#a4efff');
      }
    }
  }
}
