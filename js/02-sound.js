const SFX = {
  ctx: null,
  on: true,
  noise: null,
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.6, this.ctx.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    } catch (e) {
      this.ctx = null;
    }
  },
  env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  },
  tone(type, f1, f2, dur, vol, delay = 0) {
    const c = this.ctx,
      t = c.currentTime + delay,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  hiss(dur, vol, freq, q = 1, type = "lowpass", delay = 0) {
    const c = this.ctx,
      t = c.currentTime + delay,
      s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = this.noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    this.env(g, t, 0.004, vol, dur);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
    s.stop(t + dur + 0.05);
  },
  play(k) {
    if (!this.on || !this.ctx) return;
    try {
      switch (k) {
        case "hit":
          this.hiss(0.12, 0.5, 1400);
          this.tone("sine", 160, 45, 0.16, 0.6);
          break;
        case "heavy":
          this.hiss(0.2, 0.7, 900);
          this.tone("sine", 120, 35, 0.25, 0.8);
          this.tone("square", 80, 40, 0.12, 0.15);
          break;
        case "block":
          this.tone("square", 900, 500, 0.05, 0.12);
          this.hiss(0.06, 0.25, 3000, 1, "highpass");
          break;
        case "whoosh":
          this.hiss(0.1, 0.12, 1800, 3, "bandpass");
          break;
        case "jump":
          this.tone("sine", 260, 520, 0.09, 0.12);
          break;
        case "fb":
          this.tone("sawtooth", 220, 660, 0.22, 0.12);
          this.hiss(0.3, 0.15, 1200, 2, "bandpass");
          break;
        case "super":
          this.tone("sawtooth", 110, 880, 0.45, 0.18);
          this.tone("square", 220, 1760, 0.4, 0.06, 0.05);
          this.hiss(0.5, 0.25, 900, 1);
          break;
        case "up":
          this.tone("triangle", 300, 1100, 0.2, 0.2);
          this.hiss(0.15, 0.15, 2500, 2, "bandpass");
          break;
        case "ko":
          this.tone("sine", 420, 50, 0.9, 0.6);
          this.hiss(0.6, 0.5, 500);
          this.tone("square", 110, 55, 0.5, 0.12, 0.05);
          break;
        case "round":
          this.tone("triangle", 523, 523, 0.18, 0.25);
          this.tone("triangle", 784, 784, 0.35, 0.25, 0.18);
          break;
        case "fight":
          this.tone("square", 392, 392, 0.08, 0.12);
          this.tone("square", 784, 784, 0.3, 0.14, 0.09);
          this.hiss(0.25, 0.2, 4000, 1, "highpass", 0.09);
          break;
        case "land":
          this.hiss(0.06, 0.12, 400);
          break;
        case "ui":
          this.tone("square", 660, 990, 0.05, 0.06);
          break;
      }
    } catch (e) {}
  },
};
