# AGENTS.md — fireworks-v2

## What this is

A **pure vanilla HTML/CSS/JS** fireworks explosion simulator. No build tools, no frameworks, no package.json.

## File map

| File | Role |
|------|------|
| `index.html` | Page shell: full-screen Canvas, HUD bar, right-side selection panel. Scripts loaded in dependency order. |
| `styles.css` | Dark cinematic HUD theme (Orbitron + Noto Sans SC), CRT scanline, card UI, responsive (768px / 480px) |
| `airplanes.js` | Background airplane system (14 planes, debris, blast physics). Exports `window.AirplaneSystem`. |
| `sound.js` | Web Audio API procedural SFX for all 8 firework types. Exports `window.SoundEngine`. AudioContext lazy-init on first user gesture. |
| `fireworks.js` | Canvas 2D particle engine + 8 distinct firework burst implementations. Exports `window.FireworksEngine`. |
| `app.js` | Selection UI, detonation sequencer, bootstrap init, keyboard shortcuts (1-8 toggle, Space detonate) |

## Run it

Open `index.html` directly in a modern browser. No server required, but if serving:

```bash
python -m http.server 8080
# or any static file server
```

## Architecture notes

- **Canvas-based**: All rendering is Canvas 2D, no WebGL. Particle system uses object pooling (max 12,000).
- **Fade trail effect**: `ctx.fillStyle = 'rgba(6, 8, 15, 0.15)'` each frame creates motion blur without clearing.
- **Screen flash**: `screenFlash` variable overlays white on burst for impact.
- **Rocket + burst pattern**: Most types launch a `createRocket()` that ascends with trail sparks, then calls `onBurst()` at apex.
- **Multi-select → sequenced detonation**: `app.js` converts selected Set to array, fires each with type-specific delay (`getDelayForType`).
- **Cards are generated**: `app.js` builds `.firework-card` elements from `FIREWORK_TYPES` dynamically — do not hardcode them in HTML.
- **Engine export**: `fireworks.js` exposes `window.FireworksEngine = { FIREWORK_TYPES, launchFirework, startAnimation, resizeCanvas, getParticleCount }` for `app.js` to consume.
- **Global API**: `window.FireworksEngine` exposes `launchFirework`, `startAnimation`, `resizeCanvas`, `FIREWORK_TYPES`.
- **Keyboard shortcuts**: `1-8` toggles selection, `Space` detonates, click canvas (with none selected) launches a normal firework.

### Script load order (critical)

Scripts in `index.html` must load in this exact order:

```
airplanes.js → sound.js → fireworks.js → app.js
```

- `fireworks.js` uses `window.AirplaneSystem` (soft dep — guarded by `if`) and `window.SoundEngine`
- `app.js` hard-depends on `window.FireworksEngine` — must always be **last**
- No `defer`/`async` attributes — all execute synchronously

### Module pattern

- `airplanes.js`, `sound.js`, `app.js` — all wrapped in `(function () { 'use strict'; })()` IIFEs
- `fireworks.js` is the **sole exception** — runs at top level (no IIFE). Its internal state (`particles`, `rockets`, `pool`, `screenFlash`, `animationId`) leaks to global scope.
- New modules MUST use IIFE and export a single `window.X` namespace object (PascalCase)

### Bootstrap (app.js init)

No `DOMContentLoaded` or `window.onload` — `app.js` is the last `<script>` in `<body>`, so the DOM is ready when it runs. Init sequence:

1. `engine.resizeCanvas()` — sizes canvas, propagates to `AirplaneSystem.resize()`
2. `engine.startAnimation()` — starts rAF loop; auto-spawns 14 planes via `AirplaneSystem.spawnAll()` if none exist
3. `SoundEngine.init()` is lazily called on first detonate click (browser autoplay policy — AudioContext must be created on user gesture)

### CI / Deploy

`.github/workflows/static.yml` — GitHub Pages auto-deploy on push to `master`. Uploads entire repo root as static content. No build step.

## Adding a new firework type

1. Define in `FIREWORK_TYPES` in `fireworks.js` (name, badge, desc, accent, rank).
2. Implement `burstYourType(x, y)` in `fireworks.js`.
3. Add case in `launchFirework()` switch.
4. Add to `typeOrder` array in `app.js`.
5. Add `playYourType()` to `sound.js` and export it on `window.SoundEngine`.
6. Add keyboard shortcut key to app.js handler (keys 1-8 currently mapped).

## Style conventions

- CSS uses custom properties (`--c-*`, `--sp-*`, `--fs-*`).
- Firework accent colors per type (e.g. `--c-tsar: #ff6b35`).
- Cards use `--card-accent` and `--toggle-color` inline styles set in `app.js`.
- Orbitron for display text (English labels), Noto Sans SC for body (Chinese).

## Constraints

- **No TypeScript** — plain JS only.
- **No external JS libraries** — Canvas API and vanilla DOM only.
- **No tests** — manual browser verification.
- **One commit per feature** — each functional change should be a separate, focused git commit.
- Google Fonts CDN used for typography (requires network on first load).
