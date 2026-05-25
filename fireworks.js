/* ============================================
   FIREWORKS ENGINE — Particle Physics & Types
   ============================================ */

// ---- Particle Pool for performance ----
const MAX_PARTICLES = 12000;
const pool = [];
let activeCount = 0;

function acquireParticle() {
  if (pool.length > 0) return pool.pop();
  if (activeCount < MAX_PARTICLES) {
    activeCount++;
    return {};
  }
  return null; // hard cap
}

function releaseParticle(p) {
  p.alive = false;
  pool.push(p);
}

// ---- Core Particle ----
function createParticle(x, y, vx, vy, opts = {}) {
  const p = acquireParticle();
  if (!p) return null;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.ax = opts.ax || 0;
  p.ay = opts.ay || 0; // gravity added globally
  p.gravity = opts.gravity !== undefined ? opts.gravity : 0.06;
  p.drag = opts.drag !== undefined ? opts.drag : 0.98;
  p.life = opts.life || 1;
  p.decay = opts.decay || 0.012;
  p.size = opts.size || 2;
  p.sizeEnd = opts.sizeEnd !== undefined ? opts.sizeEnd : 0;
  p.color = opts.color || { r: 255, g: 200, b: 100 };
  p.colorEnd = opts.colorEnd || null;
  p.alpha = opts.alpha !== undefined ? opts.alpha : 1;
  p.alphaEnd = opts.alphaEnd !== undefined ? opts.alphaEnd : 0;
  p.alive = true;
  p.trail = opts.trail || false;
  p.trailLength = opts.trailLength || 5;
  p.trailHistory = [];
  p.shrink = opts.shrink || false;
  p.flicker = opts.flicker || false;
  p.spark = opts.spark || false;
  p.sparkChance = opts.sparkChance || 0;
  return p;
}

// ---- Color Utilities ----
function lerpColor(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

function rgba(c, a) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomColor(colors) {
  return colors[Math.floor(Math.random() * colors.length)];
}

// ---- Firework Type Definitions ----
const FIREWORK_TYPES = {
  atomic: {
    id: 'atomic',
    name: '原子弹',
    badge: 'TIER-SSX · 核子',
    desc: '蘑菇云升腾——炽白火柱冲天，冲击波环横扫，核火球翻涌。余晖辐射持久不散。',
    accent: '#ff4500',
    icon: 'bomb',
    rank: 0,
    blastRadius: 450,
    blastForce: 30,
  },
  hydrogen: {
    id: 'hydrogen',
    name: '氢弹',
    badge: 'TIER-SSX · 热核',
    desc: '双闪热核——超高空炽白火球膨胀，多重冲击波涟漪。蓝紫辐射纹，大气扭曲效果。',
    accent: '#7b2fff',
    icon: 'explosion',
    rank: 0,
    blastRadius: 500,
    blastForce: 35,
  },
  tsar: {
    id: 'tsar',
    name: '沙皇5000/沙皇9000',
    badge: 'TIER-S · 超重型',
    desc: '密集级联空爆，屏幕级覆盖，多波次重叠爆炸——如炮兵弹幕。白黄核心配红橙绽放。',
    accent: '#ff6b35',
    icon: 'stars',
    rank: 1,
    blastRadius: 350,
    blastForce: 20,
  },
  daxi: {
    id: 'daxi',
    name: '大西炮',
    badge: 'TIER-A · 重炮',
    desc: '低空重型炮击，深沉轰鸣感，强烈白色闪光，冲击波环。大型单次爆发，厚重粒子急坠。',
    accent: '#f5f5dc',
    icon: 'flare',
    rank: 2,
    blastRadius: 250,
    blastForce: 18,
  },
  carrier: {
    id: 'carrier',
    name: '航母系列',
    badge: 'TIER-B · 舰载',
    desc: '扇形齐射，多层覆盖，广域扩散——如舰队火力平台。多枚火箭同时扇形发射。',
    accent: '#00e5a0',
    icon: 'rocket_launch',
    rank: 3,
    blastRadius: 200,
    blastForce: 10,
  },
  tomahawk: {
    id: 'tomahawk',
    name: '战斧系列',
    badge: 'TIER-B · 精确打击',
    desc: '高速上升，速射连爆，啸声尾迹——如导弹齐射。长升空尾迹后链式爆炸。',
    accent: '#ff3366',
    icon: 'rocket',
    rank: 4,
    blastRadius: 180,
    blastForce: 12,
  },
  gatling: {
    id: 'gatling',
    name: '大型加特林',
    badge: 'TIER-C · 速射',
    desc: '连续火力流，快速扫射喷发——如机枪扫射。极高射速，扫射弧线粒子流。',
    accent: '#ffd700',
    icon: 'bolt',
    rank: 5,
    blastRadius: 100,
    blastForce: 5,
  },
  normal: {
    id: 'normal',
    name: '普通礼花',
    badge: 'TIER-D · 标准',
    desc: '标准空中绽放，规则花形——经典圆形对称烟花爆炸，多彩花瓣。',
    accent: '#a78bfa',
    icon: 'festival',
    rank: 6,
    blastRadius: 80,
    blastForce: 3,
  },
};

// ---- Rocket (ascending phase) ----
function createRocket(x, targetY, opts = {}) {
  return {
    x,
    y: opts.startY || 0,
    targetY,
    vx: opts.vx || 0,
    vy: opts.vy || -(randomInRange(8, 14)),
    trail: [],
    trailMax: opts.trailMax || 12,
    color: opts.color || { r: 255, g: 200, b: 100 },
    alive: true,
    type: opts.type || 'normal',
    onBurst: opts.onBurst || null,
    sparkTimer: 0,
  };
}

function updateRocket(r) {
  r.trail.push({ x: r.x, y: r.y });
  if (r.trail.length > r.trailMax) r.trail.shift();

  r.x += r.vx;
  r.y += r.vy;
  r.vy += 0.04; // slight gravity on rocket

  // Emit trail sparks
  r.sparkTimer++;
  if (r.sparkTimer % 2 === 0) {
    const p = createParticle(
      r.x + randomInRange(-2, 2),
      r.y,
      randomInRange(-0.3, 0.3),
      randomInRange(0.5, 1.5),
      {
        life: 0.6,
        decay: 0.04,
        size: 1.5,
        sizeEnd: 0,
        color: r.color,
        gravity: 0.02,
        drag: 0.96,
      }
    );
    if (p) particles.push(p);
  }

  // Check if reached target
  if (r.vy >= 0 || r.y <= r.targetY) {
    r.alive = false;
    if (r.onBurst) r.onBurst(r.x, r.y);
  }
}

function drawRocket(ctx, r) {
  // Draw trail
  for (let i = 0; i < r.trail.length; i++) {
    const t = r.trail[i];
    const alpha = (i / r.trail.length) * 0.6;
    const size = (i / r.trail.length) * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fillStyle = rgba(r.color, alpha);
    ctx.fill();
  }
  // Draw head
  ctx.beginPath();
  ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = rgba({ r: 255, g: 255, b: 240 }, 0.9);
  ctx.fill();
}

// ---- Global State ----
let particles = [];
let rockets = [];
let screenFlash = 0;

// ---- Blast helper for airplanes ----
function applyAirplaneBlast(x, y, typeId) {
  if (!window.AirplaneSystem) return;
  const type = FIREWORK_TYPES[typeId];
  if (type && type.blastRadius) {
    const destroy = (typeId === 'atomic' || typeId === 'hydrogen');
    window.AirplaneSystem.applyBlast(x, y, type.blastRadius, type.blastForce, destroy);
  }
}

// ---- Burst Implementations ----

// 沙皇5000/9000: Dense cascading airbursts, multiple waves
function burstTsar(x, y) {
  if (window.SoundEngine) window.SoundEngine.playTsar();
  applyAirplaneBlast(x, y, 'tsar');
  const colors = [
    { r: 255, g: 107, b: 53 },   // orange
    { r: 255, g: 220, b: 50 },    // yellow
    { r: 255, g: 80, b: 30 },     // red-orange
    { r: 255, g: 255, b: 200 },   // white-yellow
    { r: 255, g: 50, b: 20 },     // deep red
  ];

  // Wave 1: Massive primary burst
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(1, 12);
    const c = randomColor(colors);
    const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      life: 1,
      decay: randomInRange(0.003, 0.008),
      size: randomInRange(1.5, 4),
      sizeEnd: 0.5,
      color: c,
      colorEnd: { r: 80, g: 20, b: 5 },
      gravity: 0.03,
      drag: 0.98,
      trail: true,
      trailLength: 5,
    });
    if (p) particles.push(p);
  }

  // Wave 2: Delayed secondary bursts (via rockets)
  for (let w = 0; w < 4; w++) {
    setTimeout(() => {
      const ox = x + randomInRange(-150, 150);
      const oy = y + randomInRange(-80, 80);
      for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomInRange(1, 9);
        const c = randomColor(colors);
        const p = createParticle(ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed, {
          life: 1,
          decay: randomInRange(0.004, 0.010),
          size: randomInRange(1.5, 3.5),
          sizeEnd: 0.3,
          color: c,
          colorEnd: { r: 60, g: 10, b: 0 },
          gravity: 0.04,
          drag: 0.98,
          trail: true,
          trailLength: 4,
        });
        if (p) particles.push(p);
      }
    }, 400 + w * 350);
  }

  // Wave 3: Final cascade crackle
  for (let w = 0; w < 3; w++) {
    setTimeout(() => {
      const ox = x + randomInRange(-200, 200);
      const oy = y + randomInRange(-120, 60);
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomInRange(0.5, 5);
        const p = createParticle(ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed, {
          life: 1,
          decay: randomInRange(0.005, 0.012),
          size: randomInRange(1, 2.5),
          sizeEnd: 0,
          color: { r: 255, g: 255, b: 220 },
          colorEnd: { r: 255, g: 150, b: 50 },
          gravity: 0.05,
          drag: 0.98,
          flicker: true,
        });
        if (p) particles.push(p);
      }
    }, 1200 + w * 500);
  }

  screenFlash = 0.5;
}

// 大西炮: Low-altitude heavy cannon blast, shockwave ring
function burstDaxi(x, y) {
  if (window.SoundEngine) window.SoundEngine.playDaxi();
  applyAirplaneBlast(x, y, 'daxi');
  // Shockwave ring
  for (let i = 0; i < 150; i++) {
    const angle = (i / 150) * Math.PI * 2;
    const speed = randomInRange(6, 10);
    const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      life: 1,
      decay: randomInRange(0.008, 0.012),
      size: randomInRange(3, 5),
      sizeEnd: 1,
      color: { r: 255, g: 255, b: 255 },
      colorEnd: { r: 200, g: 200, b: 180 },
      gravity: 0.01,
      drag: 0.985,
      trail: true,
      trailLength: 8,
    });
    if (p) particles.push(p);
  }

  // Heavy falling particles
  for (let i = 0; i < 280; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(1, 7);
    const isCore = Math.random() < 0.3;
    const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - randomInRange(0, 3), {
      life: 1,
      decay: randomInRange(0.003, 0.006),
      size: isCore ? randomInRange(3, 6) : randomInRange(1.5, 3),
      sizeEnd: isCore ? 2 : 0.5,
      color: isCore ? { r: 255, g: 255, b: 240 } : { r: 255, g: 220, b: 150 },
      colorEnd: isCore ? { r: 200, g: 180, b: 120 } : { r: 120, g: 80, b: 30 },
      gravity: 0.10, // heavy fall
      drag: 0.98,
      trail: true,
      trailLength: isCore ? 6 : 4,
    });
    if (p) particles.push(p);
  }

  // Ground-level ember spray
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI; // upward half only
    const speed = randomInRange(2, 8);
    const p = createParticle(x, y, Math.cos(angle) * speed, -Math.abs(Math.sin(angle) * speed), {
      life: 1,
      decay: randomInRange(0.005, 0.012),
      size: randomInRange(1, 2.5),
      sizeEnd: 0,
      color: { r: 255, g: 180, b: 50 },
      colorEnd: { r: 100, g: 30, b: 0 },
      gravity: 0.12,
      drag: 0.97,
      flicker: true,
    });
    if (p) particles.push(p);
  }

  screenFlash = 0.6; // intense flash
}

// 航母系列: Fan-shaped volley, multiple rockets
function burstCarrier(startX, startY, canvasW, canvasH) {
  if (window.SoundEngine) window.SoundEngine.playCarrier();
  applyAirplaneBlast(startX, startY, 'carrier');
  const colors = [
    { r: 0, g: 229, b: 160 },   // green
    { r: 50, g: 255, b: 200 },  // mint
    { r: 0, g: 200, b: 255 },   // cyan
    { r: 100, g: 255, b: 150 }, // lime
    { r: 200, g: 255, b: 220 }, // pale green
  ];

  const visibleW = getVisibleWidth(canvasW);
  const h = canvasH;

  // Launch 7-9 rockets in a fan pattern
  const count = 7 + Math.floor(Math.random() * 3);
  const spread = visibleW * 0.6;
  const baseX = visibleW * 0.15;

  for (let i = 0; i < count; i++) {
    const delay = i * 80; // staggered launch
    setTimeout(() => {
      const rocketX = baseX + (spread / count) * i + randomInRange(-20, 20);
      const targetY = h * randomInRange(0.2, 0.35);
      const c = randomColor(colors);

      const r = createRocket(rocketX, targetY, {
        startY: h,
        vx: randomInRange(-0.5, 0.5),
        vy: -(randomInRange(10, 15)),
        color: c,
        trailMax: 15,
        onBurst: (bx, by) => {
          // Each rocket bursts into a medium flower
          for (let j = 0; j < 100; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = randomInRange(1, 6);
            const p = createParticle(bx, by, Math.cos(angle) * speed, Math.sin(angle) * speed, {
              life: 1,
              decay: randomInRange(0.004, 0.010),
              size: randomInRange(1.5, 3),
              sizeEnd: 0.5,
              color: c,
              colorEnd: { r: Math.floor(c.r * 0.3), g: Math.floor(c.g * 0.3), b: Math.floor(c.b * 0.3) },
              gravity: 0.03,
              drag: 0.98,
              trail: true,
              trailLength: 4,
            });
            if (p) particles.push(p);
          }
        },
      });
      rockets.push(r);
    }, delay);
  }
}

// 战斧系列: High-speed ascent, chain explosions
function burstTomahawk(startX, startY, canvasW, canvasH) {
  if (window.SoundEngine) window.SoundEngine.playTomahawk();
  applyAirplaneBlast(startX, startY, 'tomahawk');
  const colors = [
    { r: 255, g: 51, b: 102 },   // hot pink
    { r: 255, g: 100, b: 50 },   // orange-red
    { r: 255, g: 150, b: 80 },   // salmon
    { r: 255, g: 200, b: 100 },  // warm yellow
  ];

  const h = canvasH;

  // Launch 5 rockets in rapid succession
  const count = 5;
  for (let i = 0; i < count; i++) {
    const delay = i * 120;
    setTimeout(() => {
      const rocketX = startX + randomInRange(-60, 60);
      const targetY = h * randomInRange(0.2, 0.35);

      const r = createRocket(rocketX, targetY, {
        startY: h,
        vx: randomInRange(-0.3, 0.3),
        vy: -(randomInRange(14, 18)), // very fast
        color: { r: 255, g: 100, b: 50 },
        trailMax: 20,
        onBurst: (bx, by) => {
          // Chain explosions: 3 bursts in quick succession
          for (let chain = 0; chain < 3; chain++) {
            setTimeout(() => {
              const ox = bx + randomInRange(-30, 30) * chain;
              const oy = by + randomInRange(-20, 20) * chain;
              const burstSize = 80 - chain * 15;
              for (let j = 0; j < burstSize; j++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = randomInRange(1, 5 + chain);
                const c = randomColor(colors);
                const p = createParticle(ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed, {
                  life: 1,
                  decay: randomInRange(0.006, 0.014),
                  size: randomInRange(1, 2.5),
                  sizeEnd: 0,
                  color: c,
                  colorEnd: { r: 80, g: 10, b: 20 },
                  gravity: 0.04,
                  drag: 0.98,
                  trail: true,
                  trailLength: 3,
                });
                if (p) particles.push(p);
              }
            }, chain * 150);
          }
        },
      });
      rockets.push(r);
    }, delay);
  }
}

// 大型加特林: Continuous sweeping stream
function burstGatling(startX, startY, canvasW, canvasH) {
  if (window.SoundEngine) window.SoundEngine.playGatling();
  applyAirplaneBlast(startX, startY, 'gatling');
  const colors = [
    { r: 255, g: 215, b: 0 },    // gold
    { r: 255, g: 180, b: 0 },    // dark gold
    { r: 255, g: 240, b: 100 },  // light gold
    { r: 255, g: 255, b: 200 },  // pale yellow
  ];

  const w = getVisibleWidth(canvasW);
  const h = canvasH;

  // Sweeping arc: emit particles in a sweeping pattern over time
  const totalDuration = 3000; // 3 seconds of continuous fire
  const emitRate = 4; // particles per frame-equivalent
  const sweepStart = -0.4; // radians offset from vertical
  const sweepEnd = 0.4;
  const totalFrames = Math.floor(totalDuration / 16);
  let frame = 0;

  const interval = setInterval(() => {
    if (frame >= totalFrames) {
      clearInterval(interval);
      return;
    }

    const progress = frame / totalFrames;
    const sweepAngle = sweepStart + (sweepEnd - sweepStart) * progress;
    const baseAngle = -Math.PI / 2 + sweepAngle;

    for (let i = 0; i < emitRate; i++) {
      const angle = baseAngle + randomInRange(-0.08, 0.08);
      const speed = randomInRange(8, 14);
      const c = randomColor(colors);
      const p = createParticle(
        startX + randomInRange(-5, 5),
        h - randomInRange(0, 20),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        {
          life: 1,
          decay: randomInRange(0.004, 0.009),
          size: randomInRange(1.5, 3),
          sizeEnd: 0.5,
          color: c,
          colorEnd: { r: 100, g: 60, b: 0 },
          gravity: 0.06,
          drag: 0.98,
          trail: true,
          trailLength: 7,
        }
      );
      if (p) particles.push(p);
    }

    frame++;
  }, 16);
}

// 普通礼花: Classic round symmetrical burst
function burstNormal(x, y) {
  if (window.SoundEngine) window.SoundEngine.playNormal();
  applyAirplaneBlast(x, y, 'normal');
  const palettes = [
    [{ r: 255, g: 100, b: 100 }, { r: 255, g: 150, b: 150 }], // red
    [{ r: 100, g: 200, b: 255 }, { r: 150, g: 220, b: 255 }], // blue
    [{ r: 255, g: 200, b: 50 }, { r: 255, g: 230, b: 100 }],  // gold
    [{ r: 200, g: 100, b: 255 }, { r: 230, g: 150, b: 255 }], // purple
    [{ r: 100, g: 255, b: 150 }, { r: 150, g: 255, b: 200 }], // green
    [{ r: 255, g: 150, b: 200 }, { r: 255, g: 200, b: 230 }], // pink
  ];

  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  const petalCount = 8 + Math.floor(Math.random() * 6); // 8-13 petals

  // Symmetrical petals
  for (let i = 0; i < petalCount; i++) {
    const baseAngle = (i / petalCount) * Math.PI * 2;
    const petalParticles = 16 + Math.floor(Math.random() * 10);

    for (let j = 0; j < petalParticles; j++) {
      const angle = baseAngle + randomInRange(-0.15, 0.15);
      const speed = randomInRange(2, 7);
      const c = Math.random() < 0.7 ? palette[0] : palette[1];
      const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
        life: 1,
        decay: randomInRange(0.004, 0.009),
        size: randomInRange(1.5, 3),
        sizeEnd: 0.3,
        color: c,
        colorEnd: { r: Math.floor(c.r * 0.2), g: Math.floor(c.g * 0.2), b: Math.floor(c.b * 0.2) },
        gravity: 0.03,
        drag: 0.98,
        trail: true,
        trailLength: 4,
      });
      if (p) particles.push(p);
    }
  }

  // Center glow
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(0.5, 2);
    const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      life: 1,
      decay: randomInRange(0.012, 0.025),
      size: randomInRange(2, 4),
      sizeEnd: 0,
      color: { r: 255, g: 255, b: 240 },
      colorEnd: palette[0],
      gravity: 0.02,
      drag: 0.97,
    });
    if (p) particles.push(p);
  }
}

// ---- 原子弹: Mushroom cloud ----
function burstAtomic(x, y) {
  screenFlash = 1.0; // 最强白闪
  if (window.SoundEngine) window.SoundEngine.playAtomic();
  applyAirplaneBlast(x, y, 'atomic');

  // 阶段1: 大火球 (0~2s)
  for (let i = 0; i < 600; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(1, 8);
    const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      life: 1,
      decay: randomInRange(0.003, 0.006),
      size: randomInRange(2, 6),
      sizeEnd: 0.3,
      color: { r: 255, g: 255, b: 240 },
      colorEnd: { r: 255, g: 80, b: 10 },
      gravity: randomInRange(0.02, 0.05),
      drag: 0.985,
      trail: true,
      trailLength: 4,
    });
    if (p) particles.push(p);
  }

  // 阶段2: 蘑菇云烟柱 (0.5~3s)
  for (let w = 0; w < 3; w++) {
    setTimeout(() => {
      const stemX = x + randomInRange(-15, 15);
      for (let i = 0; i < 200; i++) {
        const p = createParticle(
          stemX + randomInRange(-10, 10),
          y + randomInRange(0, 20),
          randomInRange(-0.5, 0.5),
          -(randomInRange(1, 4)),
          {
            life: 1,
            decay: randomInRange(0.002, 0.005),
            size: randomInRange(2, 5),
            sizeEnd: 1,
            color: { r: 80, g: 40, b: 20 },
            colorEnd: { r: 40, g: 20, b: 10 },
            gravity: -0.02,
            drag: 0.99,
            trail: true,
            trailLength: 6,
          }
        );
        if (p) particles.push(p);
      }
    }, 500 + w * 800);
  }

  // 阶段3: 蘑菇冠翻滚 (1~4s)
  for (let w = 0; w < 4; w++) {
    setTimeout(() => {
      const capY = y - randomInRange(40, 120);
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI;
        const speed = randomInRange(1, 5);
        const p = createParticle(
          x + randomInRange(-30, 30),
          capY + randomInRange(-10, 10),
          Math.cos(angle) * speed * randomInRange(0.5, 1.5),
          -(Math.abs(Math.sin(angle) * speed * 0.5)),
          {
            life: 1,
            decay: randomInRange(0.002, 0.005),
            size: randomInRange(3, 7),
            sizeEnd: 0.5,
            color: { r: 120, g: 60, b: 30 },
            colorEnd: { r: 60, g: 30, b: 15 },
            gravity: 0.01,
            drag: 0.985,
            trail: true,
            trailLength: 5,
            flicker: true,
          }
        );
        if (p) particles.push(p);
      }
    }, 1000 + w * 600);
  }

  // 阶段4: 冲击波环
  for (let ring = 0; ring < 3; ring++) {
    setTimeout(() => {
      for (let i = 0; i < 150; i++) {
        const angle = (i / 150) * Math.PI * 2;
        const speed = 3 + ring * 2;
        const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
          life: 1,
          decay: randomInRange(0.006, 0.012),
          size: randomInRange(2, 4),
          sizeEnd: 0.5,
          color: { r: 255, g: 200, b: 120 },
          colorEnd: { r: 150, g: 80, b: 20 },
          gravity: 0.03,
          drag: 0.98,
          trail: true,
          trailLength: 4,
        });
        if (p) particles.push(p);
      }
      // 地面反射
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI;
        const p = createParticle(x, y, Math.cos(angle) * randomInRange(2, 6), -Math.abs(randomInRange(-1, 1)), {
          life: 1,
          decay: randomInRange(0.008, 0.015),
          size: randomInRange(1, 3),
          sizeEnd: 0,
          color: { r: 255, g: 150, b: 50 },
          colorEnd: { r: 80, g: 20, b: 0 },
          gravity: 0.08,
          drag: 0.97,
          flicker: true,
        });
        if (p) particles.push(p);
      }
    }, 800 + ring * 700);
  }

  // 阶段5: 余辉烟尘 (3~6s)
  for (let w = 0; w < 3; w++) {
    setTimeout(() => {
      for (let i = 0; i < 100; i++) {
        const p = createParticle(
          x + randomInRange(-60, 60),
          y + randomInRange(-40, 40),
          randomInRange(-0.3, 0.3),
          randomInRange(-0.2, 0.5),
          {
            life: 1,
            decay: randomInRange(0.0015, 0.003),
            size: randomInRange(2, 5),
            sizeEnd: 1,
            color: { r: 60, g: 20, b: 10 },
            colorEnd: { r: 30, g: 10, b: 5 },
            gravity: 0.005,
            drag: 0.99,
            trail: true,
            trailLength: 8,
            flicker: true,
          }
        );
        if (p) particles.push(p);
      }
    }, 2500 + w * 800);
  }
}

// ---- 氢弹: Thermonuclear ----
function burstHydrogen(x, y) {
  // 双闪
  screenFlash = 1.0;
  setTimeout(() => { screenFlash = 0.8; }, 200);
  if (window.SoundEngine) window.SoundEngine.playHydrogen();
  applyAirplaneBlast(x, y, 'hydrogen');

  // 阶段1: 巨型火球 (0~2s)
  for (let i = 0; i < 800; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(1, 10);
    const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      life: 1,
      decay: randomInRange(0.002, 0.005),
      size: randomInRange(2, 7),
      sizeEnd: 0.3,
      color: { r: 255, g: 255, b: 255 },
      colorEnd: { r: 120, g: 80, b: 255 },
      gravity: randomInRange(0.01, 0.04),
      drag: 0.985,
      trail: true,
      trailLength: 5,
    });
    if (p) particles.push(p);
  }

  // 阶段2: 多重冲击波 (0.5~4s)
  for (let ring = 0; ring < 4; ring++) {
    setTimeout(() => {
      for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI * 2;
        const speed = 4 + ring * 3;
        const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
          life: 1,
          decay: randomInRange(0.004, 0.008),
          size: randomInRange(2, 5),
          sizeEnd: 0.5,
          color: { r: 200, g: 200, b: 255 },
          colorEnd: { r: 80, g: 40, b: 150 },
          gravity: 0.02,
          drag: 0.98,
          trail: true,
          trailLength: 5,
        });
        if (p) particles.push(p);
      }
    }, 500 + ring * 700);
  }

  // 阶段3: 辐射纹 (1~3s)
  for (let w = 0; w < 3; w++) {
    setTimeout(() => {
      for (let i = 0; i < 150; i++) {
        const baseAngle = (i / 16) * Math.PI * 2;
        const angle = baseAngle + randomInRange(-0.06, 0.06);
        const speed = randomInRange(3, 9);
        const p = createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
          life: 1,
          decay: randomInRange(0.004, 0.008),
          size: randomInRange(1, 3),
          sizeEnd: 0,
          color: { r: 180, g: 140, b: 255 },
          colorEnd: { r: 50, g: 20, b: 80 },
          gravity: 0.02,
          drag: 0.985,
          trail: true,
          trailLength: 4,
        });
        if (p) particles.push(p);
      }
    }, 800 + w * 600);
  }

  // 阶段4: 大气扭曲 (2~5s) - 闪烁蓝紫微粒
  for (let w = 0; w < 5; w++) {
    setTimeout(() => {
      for (let i = 0; i < 80; i++) {
        const p = createParticle(
          x + randomInRange(-50, 50),
          y + randomInRange(-30, 30),
          randomInRange(-0.5, 0.5),
          randomInRange(-0.5, 0.5),
          {
            life: 1,
            decay: randomInRange(0.003, 0.007),
            size: randomInRange(1, 2.5),
            sizeEnd: 0,
            color: { r: 150, g: 200, b: 255 },
            colorEnd: { r: 80, g: 60, b: 200 },
            gravity: 0.005,
            drag: 0.99,
            flicker: true,
          }
        );
        if (p) particles.push(p);
      }
    }, 2000 + w * 500);
  }

  // 阶段5: 持久光斑余辉 (3~6s)
  for (let w = 0; w < 3; w++) {
    setTimeout(() => {
      for (let i = 0; i < 120; i++) {
        const p = createParticle(
          x + randomInRange(-40, 40),
          y + randomInRange(-30, 30),
          randomInRange(-0.2, 0.2),
          randomInRange(-0.3, 0.1),
          {
            life: 1,
            decay: randomInRange(0.001, 0.003),
            size: randomInRange(2, 6),
            sizeEnd: 0.5,
            color: { r: 255, g: 255, b: 250 },
            colorEnd: { r: 100, g: 60, b: 200 },
            gravity: 0.003,
            drag: 0.99,
            trail: true,
            trailLength: 6,
            flicker: true,
          }
        );
        if (p) particles.push(p);
      }
    }, 3000 + w * 800);
  }
}

// ---- Visible area helper (exclude right-side panel on desktop) ----
function getVisibleWidth(canvasW) {
  const panelWidth = window.innerWidth > 768 ? 380 : 0;
  return Math.max(canvasW - panelWidth, canvasW * 0.6);
}

// ---- Launch Functions (rocket + burst) ----
function launchFirework(typeId, canvasW, canvasH) {
  const visibleW = getVisibleWidth(canvasW);
  const cx = visibleW * randomInRange(0.15, 0.85);
  const targetY = canvasH * randomInRange(0.2, 0.35);

  switch (typeId) {
    case 'atomic': {
      // Atomic: mushroom cloud, medium altitude
      const midY = canvasH * randomInRange(0.3, 0.45);
      const r = createRocket(cx, midY, {
        startY: canvasH,
        vy: -(randomInRange(6, 9)),
        color: { r: 255, g: 120, b: 30 },
        trailMax: 12,
        onBurst: (bx, by) => burstAtomic(bx, by),
      });
      rockets.push(r);
      break;
    }
    case 'hydrogen': {
      // Hydrogen: thermonuclear, high altitude
      const highY = canvasH * randomInRange(0.12, 0.22);
      const r = createRocket(cx, highY, {
        startY: canvasH,
        vy: -(randomInRange(8, 11)),
        color: { r: 180, g: 140, b: 255 },
        trailMax: 14,
        onBurst: (bx, by) => burstHydrogen(bx, by),
      });
      rockets.push(r);
      break;
    }
    case 'tsar': {
      // Tsar launches a single rocket that triggers massive multi-wave burst
      const r = createRocket(cx, targetY, {
        startY: canvasH,
        vy: -(randomInRange(10, 13)),
        color: { r: 255, g: 200, b: 80 },
        trailMax: 18,
        onBurst: (bx, by) => burstTsar(bx, by),
      });
      rockets.push(r);
      break;
    }
    case 'daxi': {
      // Daxi: low altitude, heavy blast
      const lowY = canvasH * randomInRange(0.45, 0.6);
      const r = createRocket(cx, lowY, {
        startY: canvasH,
        vy: -(randomInRange(7, 10)),
        color: { r: 255, g: 255, b: 220 },
        trailMax: 10,
        onBurst: (bx, by) => burstDaxi(bx, by),
      });
      rockets.push(r);
      break;
    }
    case 'carrier': {
      burstCarrier(cx, canvasH, canvasW, canvasH);
      break;
    }
    case 'tomahawk': {
      burstTomahawk(cx, canvasH, canvasW, canvasH);
      break;
    }
    case 'gatling': {
      burstGatling(cx, canvasH, canvasW, canvasH);
      break;
    }
    case 'normal': {
      const r = createRocket(cx, targetY, {
        startY: canvasH,
        vy: -(randomInRange(9, 12)),
        color: { r: 200, g: 200, b: 255 },
        trailMax: 10,
        onBurst: (bx, by) => burstNormal(bx, by),
      });
      rockets.push(r);
      break;
    }
  }
}

// ---- Update & Render ----
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (!p.alive) {
      particles.splice(i, 1);
      continue;
    }

    // Store trail position
    if (p.trail) {
      p.trailHistory.push({ x: p.x, y: p.y });
      if (p.trailHistory.length > p.trailLength) p.trailHistory.shift();
    }

    // Physics
    p.vx += p.ax;
    p.vy += p.gravity;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.x += p.vx;
    p.y += p.vy;

    // Life
    p.life -= p.decay;
    if (p.life <= 0) {
      p.alive = false;
      releaseParticle(p);
      particles.splice(i, 1);
      continue;
    }

    // Flicker
    if (p.flicker && Math.random() < 0.1) {
      p.alpha = p.life * randomInRange(0.3, 1);
    } else {
      const t = 1 - p.life;
      p.alpha = p.alphaEnd + (1 - p.alphaEnd) * (1 - t);
    }

    // Size interpolation
    if (p.shrink) {
      p.size = p.size * (1 - p.decay * 2);
    }

    // Spark emission
    if (p.spark && Math.random() < p.sparkChance) {
      const sp = createParticle(p.x, p.y, randomInRange(-0.5, 0.5), randomInRange(-0.5, 0.5), {
        life: 0.5,
        decay: 0.05,
        size: 1,
        sizeEnd: 0,
        color: p.color,
        gravity: 0.05,
        drag: 0.95,
      });
      if (sp) particles.push(sp);
    }
  }
}

function updateRockets() {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    if (!r.alive) {
      rockets.splice(i, 1);
      continue;
    }
    updateRocket(r);
  }
}

function renderParticles(ctx) {
  for (const p of particles) {
    if (!p.alive) continue;

    const t = 1 - p.life;
    const currentColor = p.colorEnd ? lerpColor(p.color, p.colorEnd, t) : p.color;
    const currentSize = p.sizeEnd !== undefined ? p.size + (p.sizeEnd - p.size) * t : p.size;
    const currentAlpha = Math.max(0, Math.min(1, p.alpha));

    // Draw trail
    if (p.trail && p.trailHistory.length > 1) {
      for (let j = 0; j < p.trailHistory.length; j++) {
        const th = p.trailHistory[j];
        const trailAlpha = (j / p.trailHistory.length) * currentAlpha * 0.5;
        const trailSize = currentSize * (j / p.trailHistory.length) * 0.7;
        ctx.beginPath();
        ctx.arc(th.x, th.y, Math.max(0.5, trailSize), 0, Math.PI * 2);
        ctx.fillStyle = rgba(currentColor, trailAlpha);
        ctx.fill();
      }
    }

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
    ctx.fillStyle = rgba(currentColor, currentAlpha);
    ctx.fill();

    // Glow for larger particles
    if (currentSize > 2) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize * 2, 0, Math.PI * 2);
      ctx.fillStyle = rgba(currentColor, currentAlpha * 0.15);
      ctx.fill();
    }
  }
}

function renderRockets(ctx) {
  for (const r of rockets) {
    if (!r.alive) continue;
    drawRocket(ctx, r);
  }
}

function renderScreenFlash(ctx, w, h) {
  if (screenFlash > 0.01) {
    ctx.fillStyle = `rgba(255, 255, 240, ${screenFlash})`;
    ctx.fillRect(0, 0, w, h);
    screenFlash *= 0.85;
    if (screenFlash < 0.01) screenFlash = 0;
  }
}

// ---- Main Animation Loop ----
let animationId = null;
let lastTime = 0;
let frameCount = 0;
let fpsTime = 0;
let currentFps = 60;

function animate(timestamp) {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // FPS calculation
  frameCount++;
  if (timestamp - fpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    fpsTime = timestamp;
    const fpsEl = document.getElementById('fps-display');
    if (fpsEl) fpsEl.textContent = currentFps;
  }

  // Fade effect (trail)
  ctx.fillStyle = 'rgba(6, 8, 15, 0.15)';
  ctx.fillRect(0, 0, w, h);

  // Update
  updateRockets();
  updateParticles();
  if (window.AirplaneSystem) window.AirplaneSystem.update();

  // Render
  if (window.AirplaneSystem) window.AirplaneSystem.render(ctx);
  renderRockets(ctx);
  renderParticles(ctx);
  renderScreenFlash(ctx, w, h);

  // Update particle count display
  const countEl = document.getElementById('particle-count');
  if (countEl) countEl.textContent = particles.length;

  animationId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (!animationId) {
    if (window.AirplaneSystem && window.AirplaneSystem.getCount() === 0) {
      window.AirplaneSystem.spawnAll();
    }
    animationId = requestAnimationFrame(animate);
  }
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function resizeCanvas() {
  const canvas = document.getElementById('fireworks-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (window.AirplaneSystem) window.AirplaneSystem.resize(canvas.width, canvas.height);
}

// Export for app.js
window.FireworksEngine = {
  FIREWORK_TYPES,
  launchFirework,
  startAnimation,
  stopAnimation,
  resizeCanvas,
  getParticleCount: () => particles.length,
};