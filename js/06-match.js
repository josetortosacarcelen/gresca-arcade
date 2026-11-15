class Match {
  constructor(o) {
    this.canvas = o.canvas;
    this.ctx = o.canvas.getContext("2d");
    this.demo = !!o.demo;
    this.remote = !!o.remote;
    this.sound = !o.demo;
    this.ctrl = o.ctrl || [() => ({}), () => ({})];
    this.onEnd = o.onEnd || (() => {});
    this.labels = o.labels || ["J1", "J2"];
    this.f = [new Fighter(o.defs[0], 0), new Fighter(o.defs[1], 1)];
    this.wins = [0, 0];
    this.round = 1;
    this.proj = [];
    this.parts = [];
    this.events = [];
    this.evId = 0;
    this.seenEv = 0;
    this.frame = 0;
    this.stop = 0;
    this.shake = 0;
    this.projId = 0;
    this.stage = o.stage || (o.defs[1] && o.defs[1].stage) || "bar";
    this.newRound();
  }
  newRound() {
    for (const f of this.f) f.reset();
    this.timer = 99;
    this.tick = 0;
    this.phase = "intro";
    this.pt = 0;
    this.proj = [];
    this.winner = -1;
    if (this.round === 1) for (const f of this.f) f.meter = 0;
  }
  fx(type, x, y) {
    this.evId++;
    this.events.push([this.evId, type, Math.round(x), Math.round(y)]);
    if (this.events.length > 12) this.events.shift();
    this.doFx(type, x, y);
  }
  doFx(type, x, y) {
    const snd = this.sound;
    if (type === "hit" || type === "heavy") {
      for (let i = 0; i < (type === "heavy" ? 18 : 11); i++) {
        const a = rnd(0, Math.PI * 2),
          s = rnd(3, type === "heavy" ? 13 : 9);
        this.parts.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: rnd(10, 20),
          max: 20,
          c: i % 3 ? "#fff3b0" : "#ff7a3a",
          k: "spark",
        });
      }
      this.parts.push({ x, y, r: 6, life: 10, max: 10, c: "#fff", k: "ring" });
      this.shake = type === "heavy" ? 10 : 5;
    }
    if (type === "block") {
      this.parts.push({ x, y, r: 8, life: 12, max: 12, c: "#7fe9ff", k: "ring" });
      for (let i = 0; i < 6; i++) {
        const a = rnd(0, Math.PI * 2);
        this.parts.push({
          x,
          y,
          vx: Math.cos(a) * 4,
          vy: Math.sin(a) * 4,
          life: 10,
          max: 10,
          c: "#bff4ff",
          k: "spark",
        });
      }
    }
    if (type === "land" || type === "jump") {
      for (let i = 0; i < 6; i++)
        this.parts.push({
          x: x + rnd(-24, 24),
          y: GROUND - 2,
          vx: rnd(-2, 2),
          vy: rnd(-1.6, -0.3),
          life: 18,
          max: 18,
          c: "#c9b6ff55",
          k: "dust",
          r: rnd(5, 10),
        });
    }
    if (type === "ko") {
      this.shake = 16;
      this.parts.push({ x, y, r: 10, life: 24, max: 24, c: "#fff", k: "ring" });
    }
    if (type === "super") {
      this.flashScreen = 14;
    }
    if (type === "fb" || type === "super") {
      // grito del especial sobre el luchador que lo lanza
      const f = Math.abs(this.f[0].x - x) <= Math.abs(this.f[1].x - x) ? this.f[0] : this.f[1];
      const txt = type === "super" ? "¡SÚPER " + (f.def.special || "").replace(/[¡!]/g, "") + "!" : f.def.special;
      if (txt)
        this.parts.push({
          k: "text",
          txt,
          x: clamp(f.x, 150, W - 150),
          y: y - 110,
          vx: 0,
          vy: -3,
          life: 50,
          max: 50,
          c: f.def.energy,
        });
    }
    if (snd && !this.demo) {
      if (type === "round")
        say(this.round >= 3 && this.wins[0] === 1 && this.wins[1] === 1 ? "Ronda final" : "Ronda " + this.round);
      if (type === "fight") say("¡A pelear!");
      if (type === "ko") say("¡Ka o!");
    }
    if (snd) SFX.play(type === "land" ? "land" : type);
  }
  spawnProj(f, big) {
    this.projId++;
    this.proj.push({
      id: this.projId,
      x: f.x + f.facing * 80,
      y: f.y - 190,
      dir: f.facing,
      owner: f.side,
      big,
      age: 0,
      c: f.def.energy,
    });
    this.fx(big ? "super" : "fb", f.x, f.y - 190);
  }
  input(i) {
    if (this.phase !== "fight") return {};
    const c = this.ctrl[i];
    return c ? c(this.f[i], this.f[1 - i], this) || {} : {};
  }
  step() {
    this.frame++;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life--;
      if (p.vx !== undefined) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      if (p.k === "ring") p.r += 4;
      if (p.life <= 0) this.parts.splice(i, 1);
    }
    if (this.shake > 0) this.shake *= 0.85;
    if (this.shake < 0.5) this.shake = 0;
    if (this.flashScreen > 0) this.flashScreen--;
    if (this.stop > 0) {
      this.stop--;
      return;
    }
    const slow = this.phase === "ko" && this.pt < 60 && this.frame % 3 !== 0;
    this.pt++;
    if (slow) return;
    const [a, b] = this.f;
    const ia = this.input(0),
      ib = this.input(1);
    a.update(ia, b, this);
    b.update(ib, a, this);
    // push apart
    const dx = b.x - a.x;
    if (
      Math.abs(dx) < 70 &&
      Math.abs(a.y - b.y) < 160 &&
      a.state !== "kd" &&
      b.state !== "kd" &&
      a.state !== "ko" &&
      b.state !== "ko"
    ) {
      const push = (70 - Math.abs(dx)) / 2,
        s = Math.sign(dx) || 1;
      a.x -= push * s;
      b.x += push * s;
      if (a.x < 40) {
        b.x += 40 - a.x;
        a.x = 40;
      }
      if (b.x > W - 40) {
        a.x -= b.x - (W - 40);
        b.x = W - 40;
      }
      if (b.x < 40) {
        a.x += 40 - b.x;
        b.x = 40;
      }
      if (a.x > W - 40) {
        b.x -= a.x - (W - 40);
        a.x = W - 40;
      }
    }
    // melee
    if (this.phase === "fight" || this.phase === "ko")
      for (let i = 0; i < 2; i++) {
        const f = this.f[i],
          o = this.f[1 - i];
        if (f.active() && o.inv <= 0 && o.state !== "ko" && o.state !== "kd") {
          const hb = f.hitbox(),
            hu = o.hurtbox();
          if (overlap(hb, hu)) {
            f.atkHit = true;
            const x = (Math.max(hb[0], hu[0]) + Math.min(hb[0] + hb[2], hu[0] + hu[2])) / 2,
              y = (Math.max(hb[1], hu[1]) + Math.min(hb[1] + hb[3], hu[1] + hu[3])) / 2;
            this.resolveHit(f, o, f.atk, false, x, y, Math.sign(o.x - f.x) || f.facing);
          }
        }
      }
    // projectiles
    for (const p of this.proj) {
      p.x += p.dir * (p.big ? 8.5 : 7.5);
      p.age++;
    }
    for (let i = 0; i < this.proj.length; i++)
      for (let j = i + 1; j < this.proj.length; j++) {
        const p = this.proj[i],
          q = this.proj[j];
        if (
          p.owner !== q.owner &&
          !p.dead &&
          !q.dead &&
          Math.abs(p.x - q.x) < (p.big || q.big ? 70 : 44) &&
          Math.abs(p.y - q.y) < 70
        ) {
          if (p.big && !q.big) q.dead = 1;
          else if (q.big && !p.big) p.dead = 1;
          else {
            p.dead = q.dead = 1;
          }
          this.fx("block", (p.x + q.x) / 2, p.y);
        }
      }
    for (const p of this.proj) {
      if (p.dead) continue;
      const o = this.f[1 - p.owner],
        s = p.big ? 80 : 46,
        box = [p.x - s / 2, p.y - s / 2, s, s];
      if (this.phase !== "intro" && o.inv <= 0 && o.state !== "ko" && o.state !== "kd" && overlap(box, o.hurtbox())) {
        p.dead = 1;
        this.resolveHit(
          this.f[p.owner],
          o,
          p.big
            ? { dmg: 230, hs: 22, bs: 16, push: 8, lvl: "mid", kd: true, big: true }
            : { dmg: 90, hs: 18, bs: 13, push: 7, lvl: "mid" },
          true,
          p.x + (p.dir * s) / 3,
          p.y,
          p.dir,
        );
      }
      if (p.x < -80 || p.x > W + 80) p.dead = 1;
    }
    this.proj = this.proj.filter((p) => !p.dead);
    // facing for neutral grounded fighters
    // timer & phases
    if (this.phase === "intro") {
      if (this.pt === 1) this.fx("round", 480, 200);
      if (this.pt === 62) this.fx("fight", 480, 200);
      if (this.pt >= 100) {
        this.phase = "fight";
        this.pt = 0;
      }
    } else if (this.phase === "fight") {
      this.tick++;
      if (this.tick % 60 === 0 && this.timer > 0) {
        this.timer--;
        if (this.timer === 0) {
          this.phase = "time";
          this.pt = 0;
          const w = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
          this.winner = w;
          if (w >= 0) this.wins[w]++;
        }
      }
    } else if (this.phase === "ko" || this.phase === "time") {
      if (this.pt === 80 && this.winner >= 0) {
        const wf = this.f[this.winner];
        if (wf.state !== "ko") {
          wf.setState("idle", "win");
          wf.vx = 0;
        }
      }
      if (this.pt >= 190) {
        if (this.wins[0] >= 2 || this.wins[1] >= 2 || this.round >= 5) {
          this.phase = "end";
          this.pt = 0;
          this.matchWinner = this.wins[0] === this.wins[1] ? -1 : this.wins[0] > this.wins[1] ? 0 : 1;
          this.onEnd(this.matchWinner);
        } else {
          this.round++;
          this.newRound();
        }
      }
    } else if (this.phase === "end") {
      if (this.matchWinner >= 0) {
        const wf = this.f[this.matchWinner];
        if (wf.vis !== "win" && wf.state !== "ko") {
          wf.setState("idle", "win");
        }
      }
    }
    for (const f of this.f) {
      if (f.vis === "win" && f.state === "idle") {
        /* keep pose */ f.state = "idle";
      }
    }
    for (const f of this.f) f.hpShow = f.hpShow > f.hp ? Math.max(f.hp, f.hpShow - 6) : f.hp;
  }
  resolveHit(att, def, m, isProj, x, y, dir) {
    const blocking =
      def.canBlock() && def.holdBack && (m.lvl === "low" ? def.crouching : m.lvl === "high" ? !def.crouching : true);
    if (blocking) {
      def.state = "block";
      def.vis = def.crouching ? "cblock" : "block";
      def.anim = 0;
      def.stun = m.bs;
      def.vx = dir * m.push * 0.9;
      if (isProj) def.hp -= Math.round(m.dmg * 0.15);
      def.meter = Math.min(100, def.meter + 4);
      if (!isProj && (def.x <= 42 || def.x >= W - 42)) att.vx = -dir * m.push * 0.8;
      this.stop = 3;
      this.fx("block", x, y);
      if (def.hp <= 0) this.ko(att, def, dir);
      return;
    }
    const wasHit = def.state === "hit";
    att.combo = wasHit && att.comboT > 0 ? att.combo + 1 : 1;
    att.comboT = 40;
    const dmg = Math.round(m.dmg * Math.max(0.45, 1 - 0.12 * (att.combo - 1)));
    def.hp -= dmg;
    def.flash = 6;
    att.meter = Math.min(100, att.meter + (isProj ? 6 : 10));
    def.meter = Math.min(100, def.meter + 5);
    if (!isProj && (def.x <= 42 || def.x >= W - 42)) att.vx = -dir * m.push * 0.8;
    this.stop = m.big ? 9 : dmg > 70 ? 7 : 5;
    this.fx(dmg >= 80 ? "heavy" : "hit", x, y);
    if (def.hp <= 0) {
      def.hp = 0;
      return this.ko(att, def, dir);
    }
    if (m.kd || !def.grounded) {
      def.state = "kd";
      def.vis = "kd";
      def.anim = 0;
      def.vy = -9;
      def.vx = dir * 5;
      def.inv = 999;
      def.lie = 0;
      def.atk = null;
    } else {
      const c = def.crouching && def.state !== "attack";
      def.state = "hit";
      def.vis = c ? "chit" : "hit";
      def.anim = 0;
      def.stun = m.hs;
      def.vx = dir * m.push;
      def.atk = null;
    }
  }
  ko(att, def, dir) {
    def.hp = 0;
    def.state = "ko";
    def.vis = "ko";
    def.anim = 0;
    def.vy = -11;
    def.vx = dir * 6;
    def.inv = 999;
    def.atk = null;
    if (this.phase === "fight") {
      this.phase = "ko";
      this.pt = 0;
      this.winner = att.side;
      this.wins[att.side]++;
    }
    this.fx("ko", def.x, def.y - 150);
  }

  /* ---------- network state ---------- */
  pack() {
    const F = (f) => [
      Math.round(f.x),
      Math.round(f.y),
      f.facing,
      VIS.indexOf(f.vis),
      f.anim,
      f.hp,
      Math.round(f.meter),
      f.flash,
      f.inv > 0 && f.inv < 500 ? 1 : 0,
      f.combo,
      f.comboT,
    ];
    return {
      fr: this.frame,
      tm: this.timer,
      rd: this.round,
      ph: this.phase,
      pt: this.pt,
      wn: this.wins,
      w: this.winner,
      mw: this.matchWinner ?? -1,
      f: [F(this.f[0]), F(this.f[1])],
      pr: this.proj.map((p) => [Math.round(p.x), Math.round(p.y), p.dir, p.big ? 1 : 0, p.owner, p.age]),
      ev: this.events.slice(-8),
    };
  }
  apply(s) {
    if (!s || !s.f) return;
    this.timer = s.tm;
    this.round = s.rd;
    this.phase = s.ph;
    this.pt = s.pt;
    this.wins = s.wn;
    this.winner = s.w;
    this.matchWinner = s.mw;
    s.f.forEach((a, i) => {
      const f = this.f[i];
      f.x = a[0];
      f.y = a[1];
      f.facing = a[2];
      const v = VIS[a[3]] || "idle";
      f.vis = v;
      f.anim = a[4];
      f.hp = a[5];
      f.meter = a[6];
      f.flash = a[7];
      f.inv = a[8] ? 10 : 0;
      f.combo = a[9];
      f.comboT = a[10];
      f.state = v === "kd" ? "kd" : v === "ko" ? "ko" : "idle";
    });
    this.proj = s.pr.map((p) => ({
      x: p[0],
      y: p[1],
      dir: p[2],
      big: !!p[3],
      owner: p[4],
      age: p[5],
      c: this.f[p[4]].def.energy,
    }));
    for (const e of s.ev || []) {
      if (e[0] > this.seenEv) {
        this.seenEv = e[0];
        this.doFx(e[1], e[2], e[3]);
      }
    }
  }
  remoteStep() {
    this.frame++;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life--;
      if (p.vx !== undefined) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      if (p.k === "ring") p.r += 4;
      if (p.life <= 0) this.parts.splice(i, 1);
    }
    if (this.shake > 0) this.shake *= 0.85;
    if (this.shake < 0.5) this.shake = 0;
    if (this.flashScreen > 0) this.flashScreen--;
    for (const f of this.f) f.hpShow = f.hpShow > f.hp ? Math.max(f.hp, f.hpShow - 6) : f.hp;
  }

  /* ---------- render ---------- */
  render() {
    paint(this.ctx, (c) => this.draw(c));
  }
  draw(c) {
    c.save();
    if (this.shake) c.translate(rnd(-this.shake, this.shake), rnd(-this.shake, this.shake) * 0.6);
    drawStage(c, this.frame, this.stage);
    for (const f of this.f) {
      c.fillStyle = "#00000055";
      const sc = clamp(1 - (GROUND - f.y) / 300, 0.4, 1);
      c.beginPath();
      c.ellipse(f.x, GROUND + 4, 60 * sc, 11 * sc, 0, 0, Math.PI * 2);
      c.fill();
    }
    const order = this.f[0].state === "attack" ? [1, 0] : [0, 1];
    for (const i of order) drawFighter(c, this.f[i], this.frame);
    for (const p of this.proj) drawProj(c, p, this.frame, this.f[p.owner].def);
    for (const p of this.parts) drawPart(c, p);
    c.restore();
    if (this.flashScreen) {
      c.fillStyle = `rgba(255,255,255,${this.flashScreen / 30})`;
      c.fillRect(0, 0, W, H);
    }
    if (!this.demo) this.hud(c);
    else {
      c.fillStyle = "#0e0a1c66";
      c.fillRect(0, 0, W, H);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = "96px Bungee, Impact, sans-serif";
      c.lineWidth = 14;
      c.strokeStyle = "#120d24";
      c.strokeText("GRESCA", W / 2, H / 2 - 40);
      c.fillStyle = "#ffc93c";
      c.fillText("GRESCA", W / 2, H / 2 - 40);
      c.font = "20px Bungee, Impact, sans-serif";
      c.fillStyle = "#fff";
      c.lineWidth = 6;
      c.strokeText("ELIGE UN MODO PARA EMPEZAR", W / 2, H / 2 + 36);
      c.fillText("ELIGE UN MODO PARA EMPEZAR", W / 2, H / 2 + 36);
    }
  }
  hud(c) {
    const [a, b] = this.f;
    // bars
    const bar = (f, x, flip) => {
      const w = 350,
        h = 24,
        y = 34;
      c.fillStyle = "#120d24";
      c.fillRect(x - 4, y - 4, w + 8, h + 8);
      c.fillStyle = "#5a1020";
      c.fillRect(x, y, w, h);
      const ws = (w * f.hpShow) / MAXHP,
        wh = (w * Math.max(0, f.hp)) / MAXHP;
      c.fillStyle = "#ff4b4b";
      c.fillRect(flip ? x + w - ws : x, y, ws, h);
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, "#fff27a");
      g.addColorStop(1, f.hp < 300 ? "#ff9f1a" : "#ffc93c");
      c.fillStyle = g;
      c.fillRect(flip ? x + w - wh : x, y, wh, h);
      c.strokeStyle = "#fff";
      c.lineWidth = 2;
      c.strokeRect(x, y, w, h);
      // portrait
      const px = flip ? x + w + 44 : x - 44;
      drawHeadAt(c, f.def, px, y + 12, 0.62, flip ? -1 : 1);
      c.font = "16px Bungee, Impact, sans-serif";
      c.textAlign = flip ? "right" : "left";
      c.textBaseline = "top";
      c.lineWidth = 4;
      c.strokeStyle = "#120d24";
      c.fillStyle = "#fff";
      const nm = f.def.name.toUpperCase();
      c.strokeText(nm, flip ? x + w : x, y + h + 8);
      c.fillText(nm, flip ? x + w : x, y + h + 8);
      // wins
      for (let i = 0; i < 2; i++) {
        const cx = flip ? x + 12 + i * 22 : x + w - 12 - i * 22;
        c.beginPath();
        c.arc(cx, y + h + 18, 7, 0, Math.PI * 2);
        c.fillStyle = this.wins[f.side] > i ? "#ffc93c" : "#120d24";
        c.fill();
        c.strokeStyle = "#fff";
        c.lineWidth = 2;
        c.stroke();
      }
      // meter
      const mw = 230,
        my = H - 34,
        mx = flip ? W - 40 - mw : 40;
      c.fillStyle = "#120d24";
      c.fillRect(mx - 3, my - 3, mw + 6, 18);
      c.fillStyle = f.meter >= 100 ? (this.frame % 20 < 10 ? "#41e3ff" : "#fff") : "#2f7fbf";
      const mwid = (mw * f.meter) / 100;
      c.fillRect(flip ? mx + mw - mwid : mx, my, mwid, 12);
      c.strokeStyle = "#ffffffaa";
      c.lineWidth = 1.5;
      c.strokeRect(mx, my, mw, 12);
      c.font = "12px Bungee, Impact, sans-serif";
      c.textBaseline = "bottom";
      c.fillStyle = f.meter >= 100 ? "#41e3ff" : "#ffffffaa";
      c.fillText(f.meter >= 100 ? "¡SÚPER LISTO!" : "SÚPER", flip ? mx + mw : mx, my - 5);
      // combo
      if (f.combo >= 2 && f.comboT > 0) {
        c.font = "30px Bungee, Impact, sans-serif";
        c.textAlign = flip ? "right" : "left";
        c.textBaseline = "middle";
        const tx = flip ? W - 40 : 40;
        c.lineWidth = 6;
        c.strokeStyle = "#120d24";
        c.fillStyle = "#ffc93c";
        c.strokeText(f.combo + " GOLPES", tx, 150);
        c.fillText(f.combo + " GOLPES", tx, 150);
      }
    };
    bar(a, 84, false);
    bar(b, W - 84 - 350, true);
    // timer
    c.fillStyle = "#120d24";
    c.fillRect(W / 2 - 36, 24, 72, 54);
    c.strokeStyle = "#ffc93c";
    c.lineWidth = 3;
    c.strokeRect(W / 2 - 36, 24, 72, 54);
    c.font = "36px Bungee, Impact, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = this.timer <= 10 ? "#ff5a36" : "#fff";
    c.fillText(String(this.timer).padStart(2, "0"), W / 2, 53);
    // player labels
    c.font = '12px "Chakra Petch", sans-serif';
    c.fillStyle = "#ffffffbb";
    c.textBaseline = "top";
    c.textAlign = "left";
    c.fillText(this.labels[0], 84, 12);
    c.textAlign = "right";
    c.fillText(this.labels[1], W - 84, 12);
    // big texts
    const big = (t, col, sz = 72, y = H / 2 - 30) => {
      c.font = sz + "px Bungee, Impact, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineWidth = 12;
      c.strokeStyle = "#120d24";
      c.strokeText(t, W / 2, y);
      c.fillStyle = col;
      c.fillText(t, W / 2, y);
    };
    if (this.phase === "intro") {
      if (this.pt < 60)
        big(
          this.round >= 3 && this.wins[0] === 1 && this.wins[1] === 1 ? "RONDA FINAL" : "RONDA " + this.round,
          "#ffc93c",
        );
      else big("¡A PELEAR!", "#ff5a36", 86);
    }
    if (this.phase === "ko" && this.pt < 150) big("K.O.", "#ff5a36", 120);
    if (this.phase === "time" && this.pt < 150) big(this.winner < 0 ? "EMPATE" : "¡TIEMPO!", "#ffc93c", 90);
    if ((this.phase === "ko" || this.phase === "time") && this.pt >= 100 && this.winner >= 0) {
      big(this.f[this.winner].def.name.toUpperCase() + " GANA", "#fff", 44, H / 2 + 50);
    }
    if (this.phase === "end") {
      big(this.matchWinner < 0 ? "EMPATE" : this.f[this.matchWinner].def.name.toUpperCase(), "#ffc93c", 64, H / 2 - 70);
      if (this.matchWinner >= 0) big("¡GANA EL COMBATE!", "#fff", 34, H / 2);
    }
  }
}
