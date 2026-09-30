import { KITS, clamp } from './world.js';

function polygon(ctx, points, fill, stroke) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function line(ctx, ax, ay, bx, by, color, width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
}
function circle(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

export class Renderer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.width = 1; this.height = 1; this.camera = null; this.effects = true; }
  resize() {
    const rect = this.canvas.getBoundingClientRect(), ratio = Math.min(2, window.devicePixelRatio || 1);
    this.width = rect.width; this.height = rect.height; this.ratio = ratio;
    this.canvas.width = Math.round(rect.width * ratio); this.canvas.height = Math.round(rect.height * ratio);
  }
  toWorld(x, y) {
    const c = this.camera || { x: 600, y: 500, zoom: 1 };
    return { x: (x - this.width / 2) / c.zoom + c.x, y: (y - this.height / 2) / c.zoom + c.y };
  }
  draw(world, dt) {
    const ctx = this.ctx, w = this.width, h = this.height;
    const target = world.cameraTarget(w, h);
    if (!this.camera) this.camera = { ...target };
    const blend = Math.min(1, dt * 5);
    for (const key of ['x', 'y', 'zoom']) this.camera[key] += (target[key] - this.camera[key]) * blend;
    const c = this.camera;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.background(ctx, w, h, c, world.time);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(c.zoom, c.zoom); ctx.translate(-c.x, -c.y);
    this.environment(ctx, world);
    for (const e of world.level.enemies) if (e.alive) this.enemy(ctx, e, world.time);
    for (const p of world.players) this.player(ctx, p, world.time);
    for (const b of world.bullets) this.bullet(ctx, b);
    if (this.effects) for (const e of world.effects) this.effect(ctx, e);
    this.objective(ctx, world);
    ctx.restore();
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * .25, w / 2, h / 2, w * .7);
    vignette.addColorStop(0, '#06192600'); vignette.addColorStop(1, '#06192650'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
  }
  background(ctx, w, h, camera, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#335965'); sky.addColorStop(.48, '#78a3ae'); sky.addColorStop(1, '#bdc9bd');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const sunX = w * .78 - camera.x * .015, sunY = h * .24 + camera.y * .018;
    const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 220);
    halo.addColorStop(0, '#ffdba54c'); halo.addColorStop(1, '#ffdba500'); ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    circle(ctx, sunX, sunY, 51, '#f1d8ac'); circle(ctx, sunX - 19, sunY - 13, 49, '#496875');
    line(ctx, sunX - 120, sunY + 25, sunX + 110, sunY - 25, '#dfd8b75c', 2);
    for (let layer = 0; layer < 3; layer++) {
      const depth = .06 + layer * .07;
      const color = ['#618e9c', '#436c7c', '#315666'][layer];
      const base = h * (.75 + layer * .07) + camera.y * .04;
      const shift = camera.x * depth % 250;
      for (let i = -2; i < Math.ceil(w / 125) + 3; i++) {
        const seed = Math.abs(Math.sin(i * 13.73 + layer * 2.7));
        const x = i * 125 - shift, height = 45 + seed * (130 + layer * 45), width = 60 + seed * 45;
        polygon(ctx, [[x, base], [x, base - height + 12], [x + width * .28, base - height], [x + width, base - height], [x + width, base]], color);
        if (seed > .55) {
          line(ctx, x + width * .5, base - height, x + width * .5, base - height - 55, color, 3);
          circle(ctx, x + width * .5, base - height - 58, 2, '#add8dd');
        }
        for (let row = 0; row < 4; row++) line(ctx, x + 12, base - height + 20 + row * 24, x + width - 12, base - height + 20 + row * 24, '#abd2d022', 2);
      }
    }
    // Elevated transit lines and distant vessels establish a working city.
    ctx.globalAlpha = .6;
    line(ctx, 0, h * .65, w, h * .61, '#a7c1c3', 4);
    const shipX = (time * 18 - camera.x * .04) % (w + 200);
    polygon(ctx, [[shipX - 70, h * .38], [shipX + 30, h * .38], [shipX + 55, h * .39], [shipX + 15, h * .405], [shipX - 55, h * .405]], '#bad1d5');
    line(ctx, shipX - 95, h * .4, shipX - 62, h * .4, '#a0eafa', 2);
    ctx.globalAlpha = 1;
    const haze = ctx.createLinearGradient(0, h * .6, 0, h); haze.addColorStop(0, '#adc9c600'); haze.addColorStop(1, '#0d33465c'); ctx.fillStyle = haze; ctx.fillRect(0, 0, w, h);
  }
  environment(ctx, world) {
    const floorGradient = ctx.createLinearGradient(0, 700, 0, 1000);
    floorGradient.addColorStop(0, '#1d3f51'); floorGradient.addColorStop(1, '#0b202f');
    for (const r of world.level.platforms) {
      ctx.fillStyle = r.h > 100 ? floorGradient : '#234b60'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#c7d9db'; ctx.fillRect(r.x, r.y, r.w, 5);
      ctx.fillStyle = '#5c98aa'; ctx.fillRect(r.x, r.y + 5, r.w, 7);
      line(ctx, r.x, r.y + 14, r.x + r.w, r.y + 14, '#8de3eb', 2);
      if (r.w > 60) {
        for (let x = r.x + 25; x < r.x + r.w - 20; x += 95) {
          line(ctx, x, r.y + 20, x + 38, r.y + Math.min(r.h - 6, 75), '#52738466', 3);
          line(ctx, x + 38, r.y + Math.min(r.h - 6, 75), x + 75, r.y + 20, '#52738466', 3);
        }
        for (const x of [r.x + 8, r.x + r.w - 23]) { ctx.fillStyle = '#f9c388'; ctx.fillRect(x, r.y + 6, 15, 4); }
      } else {
        for (let y = r.y + 30; y < r.y + r.h; y += 45) line(ctx, r.x + 4, y, r.x + r.w - 4, y, '#7cb4c3', 2);
      }
    }
    ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    for (const m of world.level.markers) {
      ctx.fillStyle = '#cae1e7b0'; ctx.fillText(m.text, m.x, m.y);
      line(ctx, m.x, m.y + 8, m.x, m.y + 23, '#bddae456');
    }
    if (world.level.room !== 'ascent') {
      const x = 1740;
      polygon(ctx, [[x, 720], [x, 653], [x + 6, 648], [x + 6, 720]], '#d4e6e2');
      polygon(ctx, [[x + 6, 650], [x + 38, 650], [x + 32, 673], [x + 6, 673]], world.checkpointReached ? '#8ee3b9' : '#719baa');
    }
  }
  player(ctx, p, time) {
    const kit = KITS[p.kit], floor = p.y, height = p.h, moving = Math.abs(p.vx) > 20 && p.grounded;
    const swing = moving ? Math.sin(time * 17) * 8 : Math.sin(time * 3) * 1.5;
    ctx.save(); ctx.translate(p.x, floor); ctx.scale(p.face, 1);
    if (p.invulnerable > 0 && Math.floor(time * 16) % 2) ctx.globalAlpha = .55;
    if (p.downed) { ctx.rotate(-Math.PI / 2); ctx.translate(22, -16); }
    const crouchScale = height / 60; ctx.scale(1, crouchScale);
    const armor = p.kit === 'echo' ? '#e9e7df' : p.kit === 'nova' ? '#d5e8ef' : p.kit === 'tank' ? '#a0caba' : '#d9d1e6';
    const dark = p.kit === 'echo' ? '#26333a' : '#21475e';
    if (p.dashTime > 0) {
      ctx.globalAlpha *= .5; polygon(ctx, [[-12, -49], [-90, -43], [-105, -31], [-9, -24]], kit.color); ctx.globalAlpha = 1;
    }
    if (p.kit === 'echo') {
      polygon(ctx, [[-3, -49], [-20, -44], [-43 - Math.abs(p.vx) * .04, -38 + Math.sin(time * 9) * 7], [-35, -29], [-12, -37], [3, -40]], '#e8b155');
      line(ctx, -15, -40, -37, -34, '#ffe0a0', 2);
    }
    // Articulated limbs are placeholders, drawn separately from the collision body.
    line(ctx, -6, -25, -9 - swing * .55, -12, dark, 10);
    line(ctx, -9 - swing * .55, -12, -8 + swing, -3, armor, 8);
    line(ctx, 6, -25, 10 + swing * .5, -13, dark, 10);
    line(ctx, 10 + swing * .5, -13, 10 - swing, -3, armor, 8);
    line(ctx, -11 + swing, -2, -1 + swing, -2, dark, 5);
    line(ctx, 7 - swing, -2, 19 - swing, -2, dark, 5);
    polygon(ctx, [[-15, -45], [-8, -49], [10, -49], [16, -41], [10, -26], [-10, -26]], armor);
    polygon(ctx, [[-9, -45], [9, -45], [12, -35], [6, -30], [-6, -30], [-11, -37]], p.kit === 'echo' ? '#293940' : kit.color);
    line(ctx, -11, -28, 11, -28, '#263b46', 5);
    ctx.fillStyle = kit.accent; ctx.fillRect(-3, -30, 6, 4);
    line(ctx, -14, -42, -18, -29, dark, 7);
    line(ctx, -18, -29, -14, -22, armor, 7);
    if (p.kit === 'echo') {
      circle(ctx, 1, -56, 9, '#bc957d');
      polygon(ctx, [[-8, -58], [-7, -65], [4, -67], [11, -60], [4, -61], [-4, -59]], '#2b323c');
      line(ctx, -9, -48, 9, -48, '#f3c27a', 4);
      line(ctx, 5, -55, 10, -55, '#f4ddbf', 1);
    } else {
      polygon(ctx, [[-8, -63], [6, -65], [12, -58], [8, -51], [-7, -51], [-11, -57]], armor);
      polygon(ctx, [[-4, -60], [11, -58], [8, -54], [-3, -55]], kit.accent);
      line(ctx, -10, -58, -10, -52, kit.color, 3);
    }
    ctx.save(); ctx.translate(12, -38); ctx.rotate(Math.atan2(p.aimY, p.aimX * p.face));
    line(ctx, 0, 0, 17, 1, dark, 8);
    polygon(ctx, [[7, -5], [26, -5], [31, -1], [27, 5], [7, 5]], armor);
    line(ctx, 22, -2, 32, -2, kit.accent, 3);
    if (p.charge > .15) { ctx.globalAlpha = .6; circle(ctx, 31, 0, 4 + p.charge * 8, kit.accent); }
    ctx.restore();
    if (p.attack) {
      ctx.strokeStyle = kit.accent; ctx.lineWidth = p.kit === 'echo' ? 4 : 3; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.arc(10, -32, p.attack.reach * .75, -.9 + p.attack.elapsed * 2, .8 + p.attack.elapsed * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (p.guard > 0 || p.brace > 0) {
      ctx.strokeStyle = p.guardAge <= .07 ? '#fff5ba' : kit.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -32, 41, -1.4, 1.4); ctx.stroke();
    }
    ctx.restore();
    if (p.downed) {
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffa09b'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('HOLD INTERACT TO REVIVE', p.x, p.y - 45);
      ctx.fillStyle = '#f1d9bd'; ctx.fillRect(p.x - 25, p.y - 35, p.revive / 1.5 * 50, 3);
    } else {
      ctx.fillStyle = kit.color; ctx.font = 'bold 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('P' + (p.id + 1), p.x, p.y - p.h - 19);
      polygon(ctx, [[p.x - 3, p.y - p.h - 14], [p.x + 3, p.y - p.h - 14], [p.x, p.y - p.h - 10]], kit.color);
      if (p.device === 'simulated') { ctx.font = '7px sans-serif'; ctx.fillText('SIM', p.x, p.y - p.h - 30); }
    }
    if (p.id === 0 && !p.downed) {
      const x = p.x + p.aimX * 120, y = p.y - 34 + p.aimY * 120;
      ctx.globalAlpha = .5; circle(ctx, x, y, 2, kit.color); line(ctx, x - 7, y, x - 3, y, kit.color); line(ctx, x + 3, y, x + 7, y, kit.color); ctx.globalAlpha = 1;
    }
  }
  enemy(ctx, e, time) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
    const fill = e.flash > 0 ? '#effaff' : e.stagger > 0 ? '#849da5' : '#35414b';
    if (e.type === 'turret') {
      polygon(ctx, [[-24, 0], [-19, -27], [-12, -50], [12, -50], [24, -27], [27, 0]], fill, '#90a5af');
      circle(ctx, 0, -33, 12, '#b1babb'); circle(ctx, 6, -34, 5, '#ffd49a');
      line(ctx, 10, -33, 29, -33, '#d1dcda', 8);
    } else if (e.type === 'elite') {
      polygon(ctx, [[-34, -65], [-20, -86], [17, -86], [35, -65], [28, -20], [20, 0], [-23, 0]], fill, '#d6c29c');
      polygon(ctx, [[-19, -65], [20, -65], [27, -51], [17, -29], [-17, -29], [-26, -51]], '#818b8f');
      circle(ctx, 2, -49, 14, '#ecbd75'); circle(ctx, 2, -49, 8, '#424b51');
      line(ctx, -36, -62, -40, -22, '#c6ced0', 12); line(ctx, 36, -62, 43, -22, '#c6ced0', 12);
    } else {
      line(ctx, -8, -20, -13, -3, '#263b46', 10); line(ctx, 8, -20, 15, -3, '#263b46', 10);
      polygon(ctx, [[-19, -42], [-10, -57], [14, -57], [24, -39], [14, -20], [-13, -20]], fill, '#a6b7bc');
      line(ctx, -5, -47, 14, -47, '#ffc79b', 4);
      if (e.type === 'shield') polygon(ctx, [[18, -55], [35, -43], [35, -14], [20, -7], [15, -31]], '#b2c4cd', '#e7f0ec');
      else line(ctx, 17, -32, 36, -13, '#d9c0a5', 5);
    }
    ctx.restore();
    const width = e.type === 'elite' ? 65 : 38;
    ctx.fillStyle = '#173441'; ctx.fillRect(e.x - width / 2, e.y - e.h - 15, width, 3);
    ctx.fillStyle = '#e4ac82'; ctx.fillRect(e.x - width / 2, e.y - e.h - 15, width * clamp(e.hp / e.maxHp, 0, 1), 3);
    if (e.windup > 0) {
      const y = e.y - e.h - 40, danger = e.attackKind === 'unblockable';
      ctx.strokeStyle = danger ? '#ff8e88' : '#ffe4a1'; ctx.lineWidth = 2.5;
      if (danger) { line(ctx, e.x - 7, y - 7, e.x + 7, y + 7, '#ff8e88', 3); line(ctx, e.x + 7, y - 7, e.x - 7, y + 7, '#ff8e88', 3); }
      else polygon(ctx, [[e.x, y - 9], [e.x + 9, y], [e.x, y + 9], [e.x - 9, y]], '#ffd78422', '#ffe4a1');
      ctx.beginPath(); ctx.arc(e.x, y, 15, -Math.PI / 2, -Math.PI / 2 + (1 - e.windup / .7) * Math.PI * 2); ctx.stroke();
    }
    if (e.stagger > .4) { ctx.fillStyle = '#a8e9ee'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('OPEN', e.x, e.y - e.h - 26); }
  }
  bullet(ctx, b) {
    line(ctx, b.x - b.vx * .018, b.y - b.vy * .018, b.x, b.y, b.color, b.radius * .8);
    circle(ctx, b.x, b.y, b.radius, b.color);
    if (b.kind === 'unblockable') { line(ctx, b.x - 4, b.y - 4, b.x + 4, b.y + 4, '#612c37', 2); line(ctx, b.x + 4, b.y - 4, b.x - 4, b.y + 4, '#612c37', 2); }
  }
  effect(ctx, e) {
    const t = 1 - e.life / e.maxLife;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.strokeStyle = e.color; ctx.fillStyle = e.color;
    if (e.type === 'text') { ctx.textAlign = 'center'; ctx.font = 'bold 10px "Segoe UI", sans-serif'; ctx.fillText(e.text, e.x, e.y - t * 25); }
    else if (e.type === 'pulse') { ctx.lineWidth = 4 * (1 - t) + 1; ctx.beginPath(); ctx.arc(e.x, e.y, 30 + t * 125, e.angle - 1.4, e.angle + 1.4); ctx.stroke(); }
    else if (e.type === 'parry') { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 20 + t * 70, 0, Math.PI * 2); ctx.stroke(); }
    else if (e.type === 'tether') { polygon(ctx, [[e.x, e.y - 18], [e.x + 18, e.y], [e.x, e.y + 18], [e.x - 18, e.y]], null, e.color); }
    else {
      const count = e.type === 'burst' ? 9 : 4;
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2 + e.x, r = t * (e.type === 'burst' ? 55 : 25);
        line(ctx, e.x + Math.cos(angle) * r, e.y + Math.sin(angle) * r, e.x + Math.cos(angle) * (r + 7), e.y + Math.sin(angle) * (r + 7), e.color, 2);
      }
    }
    ctx.restore();
  }
  objective(ctx, world) {
    const pos = world.level.objective === 'repair' ? world.level.console : world.level.exit;
    const lit = world.level.objective === 'reach' || world.level.enemies.every(e => !e.alive);
    ctx.fillStyle = '#2c5064'; ctx.fillRect(pos.x - 18, pos.y - 58, 36, 58);
    polygon(ctx, [[pos.x - 22, pos.y - 56], [pos.x + 22, pos.y - 56], [pos.x + 16, pos.y - 74], [pos.x - 16, pos.y - 74]], '#d0dcd7');
    ctx.fillStyle = lit ? '#9de4c5' : '#6c8f9c'; ctx.fillRect(pos.x - 11, pos.y - 53, 22, 13);
    line(ctx, pos.x, pos.y - 76, pos.x, pos.y - 108, lit ? '#acedd3' : '#759eaf', 2);
    const y = pos.y - 125;
    polygon(ctx, [[pos.x, y - 12], [pos.x + 10, y], [pos.x, y + 12], [pos.x - 10, y]], lit ? '#b2e8cf' : '#7495a2');
    ctx.textAlign = 'center'; ctx.font = '9px sans-serif'; ctx.fillStyle = '#d0e8ed';
    ctx.fillText(world.level.objective === 'repair' ? lit ? 'HOLD INTERACT TO RESTORE' : 'CLEAR THREATS TO RESTORE' : 'REACH THE BEACON', pos.x, pos.y - 152);
    if (world.repair > 0) { ctx.fillStyle = '#092937'; ctx.fillRect(pos.x - 45, pos.y - 165, 90, 4); ctx.fillStyle = '#a4edc8'; ctx.fillRect(pos.x - 45, pos.y - 165, world.repair / 3 * 90, 4); }
  }
}
