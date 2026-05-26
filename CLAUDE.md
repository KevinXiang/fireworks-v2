# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See [AGENTS.md](AGENTS.md) for the full architecture doc, file map, and pattern reference. This file covers what's missing from AGENTS.md and session-critical reminders.

## Running the app

Open `index.html` directly in a browser. For a local server:

```bash
node server.js   # runs on http://localhost:8765 (hardcoded, edit if moved)
# or
python -m http.server 8080
```

## CI / Deploy

Push to `master` → GitHub Actions deploys entire repo root to GitHub Pages (`.github/workflows/static.yml`). No build step, no dependencies.

## `server.js` note

The Node server in `server.js` has a hardcoded absolute path (`E:\0-projects\ai-games\fireworks-v2`). Update it if the repo moves or is cloned to a different location. Prefer `python -m http.server` for portability.

## Session reminders

- **No package.json, no npm, no build tools** — do not run `npm install` or add dependencies.
- **No TypeScript** — plain JS only. Do not add type annotations or tsconfig.
- **No tests** — verify changes by opening `index.html` in a browser.
- **One commit per feature** — each functional change should be a separate, focused commit.
- **`fireworks.js` is the only non-IIFE module** — its internal state leaks to global scope. Keep new modules wrapped in `(function () { 'use strict'; })()` IIFEs exporting a single `window.X` namespace.
- Script load order in `index.html` is critical: `airplanes.js → sound.js → fireworks.js → app.js`. `app.js` must always be last.
