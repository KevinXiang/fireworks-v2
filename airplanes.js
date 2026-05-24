/* ============================================
   AIRPLANE SYSTEM — Free-flight planes + blast physics
   ============================================ */

(function () {
  'use strict';

  const PLANE_COUNT = 14;
  const planes = [];
  let canvasW = 0;
  let canvasH = 0;

  // ---- Airplane ---
  function createPlane() {
    const goingRight = Math.random() > 0.5;
    return {
      x: goingRight ? -80 : canvasW + 80,
      y: canvasH * randomRange(0.12, 0.55),  // across various altitudes
      vx: goingRight ? randomRange(0.6, 2.0) : -randomRange(0.6, 2.0),
      vy: 0,
      angle: goingRight ? 0 : Math.PI,       // face travel direction
      angularVel: 0,
      cruiseSpeed: randomRange(0.6, 2.0),
      direction: goingRight ? 1 : -1,
      altitude: 0,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: randomRange(0.1, 0.4),
      bobFreq: randomRange(0.005, 0.015),
      scale: randomRange(0.5, 1.0),
      stunned: false,
      stunTimer: 0,
      trail: [],
      trailMax: 12,
      color: randomPlaneColor(),
    };
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomPlaneColor() {
    const colors = [
      { body: '#e8ecf4', wing: '#c0c8d8', accent: '#ff4444' },  // 白身红尾
      { body: '#d0d8e8', wing: '#a8b4c8', accent: '#4488ff' },  // 银身蓝尾
      { body: '#e0e4ec', wing: '#b0bcc8', accent: '#ffaa00' },  // 银身金尾
      { body: '#c8d0dc', wing: '#98a4b4', accent: '#44cc66' },  // 灰身绿尾
      { body: '#dcdce4', wing: '#a8b0c0', accent: '#ff6644' },  // 浅灰橙尾
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function spawnAll() {
    planes.length = 0;
    for (let i = 0; i < PLANE_COUNT; i++) {
      planes.push(createPlane());
    }
  }

  // ---- Update ---
  function update() {
    for (let i = planes.length - 1; i >= 0; i--) {
      const p = planes[i];

      // Trail
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > p.trailMax) p.trail.shift();

      // Stunned recovery
      if (p.stunned) {
        p.stunTimer -= 0.016;
        if (p.stunTimer <= 0) {
          p.stunned = false;
        }
        // Gradually stabilize
        p.angularVel *= 0.96;
        p.vy *= 0.97;
        // Steer back toward horizon
        const targetAngle = p.direction > 0 ? 0 : Math.PI;
        p.angle += (targetAngle - p.angle) * 0.02 + p.angularVel;
      } else {
        // Normal flight: steady direction + gentle bobbing
        p.bobPhase += p.bobFreq;
        p.angle = p.direction > 0 ? 0 : Math.PI;
        p.vy = Math.sin(p.bobPhase) * p.bobAmp * 0.3;
        p.vx = p.cruiseSpeed * p.direction;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Edge wrap: respawn on opposite side
      const margin = 100;
      if (p.x > canvasW + margin && p.direction > 0) {
        p.x = -margin;
        p.y = canvasH * randomRange(0.1, 0.55);
        p.bobPhase = Math.random() * Math.PI * 2;
        p.color = randomPlaneColor();
      } else if (p.x < -margin && p.direction < 0) {
        p.x = canvasW + margin;
        p.y = canvasH * randomRange(0.1, 0.55);
        p.bobPhase = Math.random() * Math.PI * 2;
        p.color = randomPlaneColor();
      }

      // Keep in bounds vertically
      p.y = Math.max(20, Math.min(canvasH * 0.6, p.y));
    }
  }

  // ---- Blast effect ---
  function applyBlast(bx, by, radius, force) {
    for (const p of planes) {
      const dx = p.x - bx;
      const dy = p.y - by;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Closer = stronger push
        const power = (1 - dist / radius) * force;
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * power;
        p.vy += Math.sin(angle) * power - power * 0.3; // upward bias

        // Spin based on hit angle and power
        p.angularVel = (Math.random() - 0.5) * power * 0.15;
        p.angle += (Math.random() - 0.5) * power * 0.1;

        p.stunned = true;
        p.stunTimer = randomRange(1.5, 3.5);

        // Engine trail burst
        for (let i = 0; i < 8; i++) {
          p.trail.push({
            x: p.x + randomRange(-5, 5),
            y: p.y + randomRange(-3, 3),
          });
        }
      }
    }
  }

  // ---- Render ---
  function drawPlane(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.scale(p.scale, p.scale);

    const alpha = p.stunned ? 0.85 : 1;
    ctx.globalAlpha = alpha;

    // Fuselage
    ctx.fillStyle = p.color.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose cone
    ctx.fillStyle = p.color.accent;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(8, -2);
    ctx.lineTo(12, 0);
    ctx.lineTo(8, 2);
    ctx.closePath();
    ctx.fill();

    // Main wings (swept)
    ctx.fillStyle = p.color.wing;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-6, -10);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-4, 1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-8, 10);
    ctx.lineTo(-4, -1);
    ctx.closePath();
    ctx.fill();

    // Tail fin
    ctx.fillStyle = p.color.accent;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();

    // Tail horizontal stabilizer
    ctx.fillStyle = p.color.wing;
    ctx.fillRect(-13, -1, 5, 2);

    // Cockpit window
    ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(4, 0, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Engine trail
    if (p.trail.length > 1) {
      for (let i = 1; i < p.trail.length; i++) {
        const t = p.trail[i];
        const prevT = p.trail[i - 1];
        const trailAlpha = (i / p.trail.length) * 0.5;
        ctx.strokeStyle = `rgba(200, 210, 230, ${trailAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prevT.x, prevT.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function render(ctx) {
    for (const p of planes) {
      drawPlane(ctx, p);
    }
  }

  function resize(w, h) {
    canvasW = w;
    canvasH = h;
  }

  // ---- Export ----
  window.AirplaneSystem = {
    spawnAll,
    update,
    render,
    applyBlast,
    resize,
    getCount: () => planes.length,
  };

})();
