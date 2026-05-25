/* ============================================
   SOUND ENGINE — Web Audio API procedural SFX
   ============================================ */

(function () {
  'use strict';

  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ---- Shared utilities ----

  function noiseBurst(opts = {}) {
    const ctx = getCtx();
    const duration = opts.duration || 0.5;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const decayExp = opts.decayExp || 3;

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decayExp);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'lowpass';
    filter.frequency.value = opts.filterFreq || 500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }

  function oscTone(opts = {}) {
    const ctx = getCtx();
    const freq = opts.freq || 100;
    const duration = opts.duration || 0.3;
    const type = opts.type || 'sine';

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (opts.freqEnd) {
      osc.frequency.linearRampToValueAtTime(opts.freqEnd, ctx.currentTime + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume || 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function delayed(fn, delay) {
    setTimeout(fn, delay);
  }

  // ---- Per-type sound effects ----

  function playAtomic() {
    // Deep rumble: low noise + sub bass
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Sub-bass oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(35, now);
    osc.frequency.linearRampToValueAtTime(20, now + 2.0);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.5);

    // Low rumble noise
    noiseBurst({ duration: 2.5, decayExp: 1.5, filterFreq: 150, volume: 0.6 });

    // Secondary rumbles
    delayed(() => noiseBurst({ duration: 1.5, decayExp: 2, filterFreq: 200, volume: 0.3 }), 600);
    delayed(() => noiseBurst({ duration: 1.0, decayExp: 2.5, filterFreq: 250, volume: 0.2 }), 1200);
  }

  function playHydrogen() {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // First crack
    noiseBurst({ duration: 0.6, decayExp: 2, filterType: 'highpass', filterFreq: 800, volume: 0.5 });
    oscTone({ freq: 200, freqEnd: 50, duration: 0.4, type: 'sawtooth', volume: 0.15 });

    // Second crack (200ms later)
    delayed(() => {
      noiseBurst({ duration: 0.5, decayExp: 2, filterType: 'highpass', filterFreq: 1000, volume: 0.45 });
      oscTone({ freq: 250, freqEnd: 80, duration: 0.3, type: 'sawtooth', volume: 0.12 });
    }, 200);

    // Sustained high hiss
    delayed(() => {
      noiseBurst({ duration: 1.5, decayExp: 1.8, filterType: 'bandpass', filterFreq: 2000, volume: 0.2 });
    }, 400);

    // Deep after-rumble
    delayed(() => {
      noiseBurst({ duration: 1.0, decayExp: 2, filterFreq: 300, volume: 0.25 });
    }, 1000);
  }

  function playTsar() {
    // Artillery barrage: 5 overlapping booms
    noiseBurst({ duration: 0.5, decayExp: 3, filterFreq: 400, volume: 0.4 });
    oscTone({ freq: 80, freqEnd: 30, duration: 0.5, volume: 0.2 });

    delayed(() => {
      noiseBurst({ duration: 0.4, decayExp: 3, filterFreq: 350, volume: 0.35 });
      oscTone({ freq: 70, freqEnd: 25, duration: 0.4, volume: 0.18 });
    }, 200);

    delayed(() => {
      noiseBurst({ duration: 0.45, decayExp: 2.5, filterFreq: 380, volume: 0.35 });
      oscTone({ freq: 75, freqEnd: 28, duration: 0.45, volume: 0.18 });
    }, 450);

    delayed(() => {
      noiseBurst({ duration: 0.35, decayExp: 3, filterFreq: 320, volume: 0.3 });
      oscTone({ freq: 65, freqEnd: 20, duration: 0.35, volume: 0.15 });
    }, 750);

    delayed(() => {
      noiseBurst({ duration: 0.3, decayExp: 3, filterFreq: 300, volume: 0.25 });
    }, 1100);
  }

  function playDaxi() {
    // Heavy cannon: single deep thud
    noiseBurst({ duration: 0.7, decayExp: 2, filterFreq: 100, volume: 0.6 });

    // Strong bass pulse
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(15, now + 0.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);

    // Reverb-like tail
    delayed(() => {
      noiseBurst({ duration: 0.4, decayExp: 3, filterFreq: 120, volume: 0.2 });
    }, 300);
  }

  function playCarrier() {
    // Rocket whooshes: rising filter on noise
    for (let i = 0; i < 7; i++) {
      delayed(() => {
        const ctx = getCtx();
        const now = ctx.currentTime;
        const dur = 0.25;

        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(1500, now + dur);
        filter.Q.value = 3;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(now);

        // Small pop on burst
        delayed(() => {
          noiseBurst({ duration: 0.15, decayExp: 4, filterFreq: 600, volume: 0.15 });
        }, 600);
      }, i * 100);
    }
  }

  function playTomahawk() {
    // Whistling ascent
    oscTone({ freq: 400, freqEnd: 1200, duration: 0.8, type: 'sine', volume: 0.1 });

    // Rapid cracks on burst
    for (let i = 0; i < 4; i++) {
      delayed(() => {
        noiseBurst({ duration: 0.12, decayExp: 5, filterType: 'highpass', filterFreq: 1200, volume: 0.2 });
        oscTone({ freq: 300, freqEnd: 80, duration: 0.1, type: 'square', volume: 0.08 });
      }, 600 + i * 150);
    }
  }

  function playGatling() {
    // Rapid-fire pops
    for (let i = 0; i < 30; i++) {
      delayed(() => {
        noiseBurst({ duration: 0.04, decayExp: 6, filterType: 'highpass', filterFreq: 2000, volume: 0.06 });
      }, i * 50);
    }
  }

  function playNormal() {
    // Standard firework pop
    noiseBurst({ duration: 0.2, decayExp: 4, filterFreq: 600, volume: 0.2 });
    oscTone({ freq: 200, freqEnd: 60, duration: 0.2, type: 'sine', volume: 0.1 });
  }

  function playArmageddon() {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Fade-in sub rumble (0~1s)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(18, now);
    sub.frequency.linearRampToValueAtTime(8, now + 3.0);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.7, now + 1.0);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 3.5);

    // Main blast at 1s
    delayed(() => {
      // Massive noise blast
      noiseBurst({ duration: 2.0, decayExp: 1.5, filterFreq: 80, volume: 0.8 });
      // Secondary burst
      delayed(() => noiseBurst({ duration: 1.5, decayExp: 2, filterFreq: 120, volume: 0.5 }), 400);
      // High crackle
      delayed(() => noiseBurst({ duration: 0.8, decayExp: 3, filterType: 'highpass', filterFreq: 600, volume: 0.3 }), 800);
    }, 1000);

    // Long after-rumble
    delayed(() => {
      noiseBurst({ duration: 3.0, decayExp: 1.2, filterFreq: 60, volume: 0.4 });
    }, 2000);
  }

  // ---- Export ----
  window.SoundEngine = {
    playAtomic,
    playHydrogen,
    playTsar,
    playDaxi,
    playCarrier,
    playTomahawk,
    playGatling,
    playNormal,
    playArmageddon,
    // Resume audio context (call on first user interaction)
    init() { getCtx(); },
  };

})();
