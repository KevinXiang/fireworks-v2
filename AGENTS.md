# AGENTS.md — fireworks-v2

## What this is

A **pure vanilla HTML/CSS/JS** fireworks explosion simulator. No build tools, no frameworks, no package.json.

## File map

| File | Role |
|------|------|
| `index.html` | Page shell: full-screen Canvas, HUD bar, right-side selection panel |
| `styles.css` | Dark cinematic HUD theme (Orbitron + Noto Sans SC), CRT scanline, card UI, responsive |
| `fireworks.js` | Canvas 2D particle engine + 6 distinct firework burst implementations |
| `app.js` | Selection logic, detonation sequencer, keyboard shortcuts (1-6 toggle, Space detonate) |

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
- **Keyboard shortcuts**: `1-6` toggles selection, `Space` detonates, click canvas (with none selected) launches a normal firework.

## Adding a new firework type

1. Define in `FIREWORK_TYPES` in `fireworks.js` (name, badge, desc, accent, rank).
2. Implement `burstYourType(x, y)` in `fireworks.js`.
3. Add case in `launchFirework()` switch.
4. Add to `typeOrder` array in `app.js`.

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
