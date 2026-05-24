/* ============================================
   APP.JS — Selection UI, Detonation Control
   ============================================ */

(function () {
  'use strict';

  const engine = window.FireworksEngine;
  const TYPES = engine.FIREWORK_TYPES;

  // ---- State ----
  const selected = new Set();
  let isDetonating = false;

  // ---- DOM References ----
  const cardGrid = document.getElementById('card-grid');
  const detonateBtn = document.getElementById('detonate-btn');
  const selectedCountEl = document.getElementById('selected-count');
  const panelToggle = document.getElementById('panel-toggle');
  const selectionPanel = document.getElementById('selection-panel');

  // ---- Build Cards ----
  const typeOrder = ['tsar', 'daxi', 'carrier', 'tomahawk', 'gatling', 'normal'];

  typeOrder.forEach((key) => {
    const type = TYPES[key];
    const card = document.createElement('div');
    card.className = 'firework-card';
    card.dataset.typeId = type.id;
    card.style.setProperty('--card-accent', type.accent);
    card.style.setProperty('--toggle-color', type.accent);

    card.innerHTML = `
      <div class="firework-card__top">
        <span class="firework-card__rank">${type.rank}</span>
        <div class="firework-card__info">
          <div class="firework-card__name">${type.name}</div>
          <span class="firework-card__badge">${type.badge}</span>
        </div>
        <button class="firework-card__toggle" aria-label="选择${type.name}" role="switch" aria-checked="false"></button>
      </div>
      <div class="firework-card__desc">${type.desc}</div>
    `;

    // Click handler on entire card
    card.addEventListener('click', (e) => {
      // Don't toggle if clicking the toggle button itself (it'll bubble)
      toggleSelection(type.id);
    });

    // Keyboard accessibility
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSelection(type.id);
      }
    });

    cardGrid.appendChild(card);
  });

  // ---- Selection Logic ----
  function toggleSelection(typeId) {
    if (isDetonating) return;

    if (selected.has(typeId)) {
      selected.delete(typeId);
    } else {
      selected.add(typeId);
    }

    updateCardUI(typeId);
    updateDetonateButton();
  }

  function updateCardUI(typeId) {
    const card = cardGrid.querySelector(`[data-type-id="${typeId}"]`);
    if (!card) return;

    const isSelected = selected.has(typeId);
    const toggle = card.querySelector('.firework-card__toggle');

    card.classList.toggle('selected', isSelected);
    toggle.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  }

  function updateDetonateButton() {
    const count = selected.size;
    selectedCountEl.textContent = count;
    detonateBtn.disabled = count === 0 || isDetonating;
  }

  // ---- Detonation ----
  detonateBtn.addEventListener('click', () => {
    if (isDetonating || selected.size === 0) return;
    detonate();
  });

  function detonate() {
    isDetonating = true;
    detonateBtn.disabled = true;
    detonateBtn.classList.add('dooking');

    const canvas = document.getElementById('fireworks-canvas');
    const w = canvas.width;
    const h = canvas.height;

    // Convert selected to array and create launch sequence
    const sequence = Array.from(selected);
    let launchIndex = 0;

    function launchNext() {
      if (launchIndex >= sequence.length) {
        // All launched, wait for particles to finish then re-enable
        setTimeout(() => {
          isDetonating = false;
          detonateBtn.classList.remove('dooking');
          updateDetonateButton();
        }, 1000);
        return;
      }

      const typeId = sequence[launchIndex];
      engine.launchFirework(typeId, w, h);
      launchIndex++;

      // Stagger launches
      const delay = getDelayForType(typeId);
      setTimeout(launchNext, delay);
    }

    launchNext();
  }

  function getDelayForType(typeId) {
    switch (typeId) {
      case 'tsar': return 4500;      // Tsar is massive, give it room
      case 'daxi': return 3000;       // Heavy blast
      case 'carrier': return 3500;    // Fan volley takes time
      case 'tomahawk': return 3000;   // Chain explosions
      case 'gatling': return 4000;    // Continuous stream
      case 'normal': return 2000;     // Quick standard burst
      default: return 2500;
    }
  }

  // ---- Panel Toggle (mobile) ----
  panelToggle.addEventListener('click', () => {
    selectionPanel.classList.toggle('collapsed');
  });

  // ---- Canvas Resize ----
  function handleResize() {
    engine.resizeCanvas();
  }

  window.addEventListener('resize', handleResize);

  // ---- Init ----
  engine.resizeCanvas();
  engine.startAnimation();

  // ---- Click on canvas to launch random firework ----
  const canvas = document.getElementById('fireworks-canvas');
  canvas.addEventListener('click', (e) => {
    if (isDetonating) return;
    if (selected.size > 0) return;

    // Free mode: click to launch a normal firework
    engine.launchFirework('normal', canvas.width, canvas.height);
  });

  // ---- Keyboard shortcut: Space to detonate ----
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && selected.size > 0 && !isDetonating) {
      e.preventDefault();
      detonate();
    }
    // Number keys 1-6 to toggle selection
    const numKey = parseInt(e.key);
    if (numKey >= 1 && numKey <= 6 && !isDetonating) {
      const typeId = typeOrder[numKey - 1];
      toggleSelection(typeId);
    }
  });

})();