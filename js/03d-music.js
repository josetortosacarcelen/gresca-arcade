// Música chiptune generada en el navegador (sin archivos de audio).
const MUSIC = {
  timer: null,
  step: 0,
  next: 0,
  g: null,
  root: 110,
  start(seed = 0) {
    this.stop();
    if (!SFX.on || !SFX.ctx) return;
    const c = SFX.ctx;
    this.g = c.createGain();
    this.g.gain.value = 0.5;
    this.g.connect(c.destination);
    this.root = [110, 98, 123.5, 87.3][seed % 4];
    this.step = 0;
    this.next = c.currentTime + 0.1;
    this.timer = setInterval(() => this.pump(), 50);
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.g) {
      try {
        this.g.gain.setTargetAtTime(0, SFX.ctx.currentTime, 0.05);
        const g = this.g;
        setTimeout(() => g.disconnect(), 400);
      } catch (e) {}
      this.g = null;
    }
  },
  note(type, semis, t, dur, vol) {
    const c = SFX.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = this.root * Math.pow(2, semis / 12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.g);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  hat(t, vol) {
    const c = SFX.ctx,
      s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = SFX.noise;
    f.type = "highpass";
    f.frequency.value = 6000;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    s.connect(f).connect(g).connect(this.g);
    s.start(t);
    s.stop(t + 0.06);
  },
  pump() {
    if (!this.g || !SFX.ctx) return;
    const c = SFX.ctx,
      spb = 0.105;
    while (this.next < c.currentTime + 0.2) {
      const st = this.step % 64,
        bar = (st / 16) | 0,
        s = st % 16,
        t = this.next;
      const chord = [0, 8, 10, 7][bar];
      // bajo
      if ([0, 3, 6, 8, 11, 14].includes(s))
        this.note("square", chord - 12 + (s === 6 || s === 14 ? 7 : 0), t, 0.16, 0.07);
      // arpegio
      const arp = [0, 3, 7, 12, 7, 3, 7, 12, 15, 12, 7, 3, 7, 12, 7, 3][s];
      if (s % 2 === 0 || bar % 2) this.note("triangle", chord + 12 + arp, t, 0.12, 0.09);
      // melodía
      const mel = [12, null, null, 15, null, 12, null, 10, 12, null, null, 19, null, 17, 15, null][s];
      if (mel !== null && this.step >= 64) this.note("square", chord + mel + 12, t, 0.2, 0.035);
      // percusión
      if (s % 2 === 0) this.hat(t, s % 4 === 0 ? 0.05 : 0.025);
      if (s % 8 === 4) this.hat(t, 0.09);
      if (s % 8 === 0) this.note("sine", chord - 24, t, 0.12, 0.16);
      this.next += spb;
      this.step++;
    }
  },
};
