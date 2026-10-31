/**
 * Web Audio API Procedural Tactical Sound Synthesizer
 * 100% procedural - zero external audio files, zero 404s.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public enabled: boolean = true;
  public volume: number = 0.8;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  // Persian Splash Screen Atmospheric Intro Chime
  public playIntroChime() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    // Harmonic Persian scale / meditative resonant strings (D minor / Bayat-e Esfahan vibe)
    const freqs = [146.83, 220.00, 261.63, 293.66, 370.00, 440.00];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0, t + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.12 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.12 + 2.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 3.0);
    });
  }

  // Gunshots
  public playGunshot(type: 'm4a1' | 'ak47' | 'sniper' | 'pistol') {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    if (type === 'sniper') {
      // Deafening heavy supersonic boom + sub bass rumble
      // 1. Noise transient (gunpowder explosive crack)
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.frequency.exponentialRampToValueAtTime(150, t + 0.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);

      // 2. Sub bass punch
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(160, t);
      sub.frequency.exponentialRampToValueAtTime(32, t + 0.4);

      subGain.gain.setValueAtTime(1.0, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.6);

      // 3. Bolt-action mechanical slide sound scheduled 0.35s later
      setTimeout(() => this.playBoltCycle(), 350);

    } else if (type === 'ak47') {
      // Heavy 7.62mm explosive crack + metallic receiver slap
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3500, t);
      filter.frequency.exponentialRampToValueAtTime(220, t + 0.3);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.1, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);

      // Low punch
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(130, t);
      sub.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      subGain.gain.setValueAtTime(0.8, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.26);

    } else if (type === 'm4a1') {
      // 5.56mm rapid suppressed/tactical rifle crack
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.Q.value = 1.2;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.95, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
      oscGain.gain.setValueAtTime(0.6, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);

    } else {
      // Tactical Pistol 9mm / .50 AE snappy pop
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      oscGain.gain.setValueAtTime(0.5, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  // Bolt-action sniper mechanical cycle sound
  public playBoltCycle() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    // Bolt pull up & back
    [0, 0.12, 0.26].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 800 : idx === 1 ? 450 : 920, t + delay);
      osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 300 : idx === 1 ? 600 : 250, t + delay + 0.06);

      gain.gain.setValueAtTime(0.3, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });
  }

  // Sniper Hold-Breath Heartbeat sound
  public playHeartbeat() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Hitmarker "Tick" (authentic tactical shooter hit confirm)
  public playHitmarker(headshot: boolean = false) {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (headshot) {
      // Distinct metallic "DING!"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.18);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    } else {
      // Crisp "Tick"
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.04);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + (headshot ? 0.25 : 0.06));
  }

  // Shell Casing Bounce Sound
  public playCasingBounce() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const pitch = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Bullet Impact on Wall
  public playImpactWall() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Reload Sequence (Mag Out, Mag In, Slide Rack)
  public playReload() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    // Mag out (t + 0.1)
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const cur = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, cur);
      osc.frequency.exponentialRampToValueAtTime(200, cur + 0.12);
      g.gain.setValueAtTime(0.25, cur);
      g.gain.exponentialRampToValueAtTime(0.001, cur + 0.14);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(cur);
      osc.stop(cur + 0.15);
    }, 150);

    // Mag slap in (t + 0.7)
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const cur = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, cur);
      osc.frequency.exponentialRampToValueAtTime(150, cur + 0.08);
      g.gain.setValueAtTime(0.4, cur);
      g.gain.exponentialRampToValueAtTime(0.001, cur + 0.1);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(cur);
      osc.stop(cur + 0.11);
    }, 700);

    // Slide chamber (t + 1.2)
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const cur = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, cur);
      osc.frequency.exponentialRampToValueAtTime(350, cur + 0.1);
      g.gain.setValueAtTime(0.35, cur);
      g.gain.exponentialRampToValueAtTime(0.001, cur + 0.12);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(cur);
      osc.stop(cur + 0.13);
    }, 1150);
  }

  // Tactical footsteps
  public playFootstep(material: 'dust' | 'metal' | 'concrete' = 'dust') {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (material === 'metal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.07);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Jump leap / Land thud
  public playJump() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.12);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playLand() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Radio callout squelch
  public playRadioBeep() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.setValueAtTime(1750, t + 0.04);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const soundEngine = new SoundEngine();
