class Fighter {
  constructor(def, side) {
    this.def = def;
    this.side = side;
    this.wins = 0;
    this.meter = 0;
    this.reset();
  }
  reset() {
    const s = this.side;
    this.x = s ? 660 : 300;
    this.y = GROUND;
    this.vx = 0;
    this.vy = 0;
    this.facing = s ? -1 : 1;
    this.hp = MAXHP;
    this.hpShow = MAXHP;
    this.state = "idle";
    this.vis = "idle";
    this.anim = 0;
    this.atk = null;
    this.atkId = null;
    this.stun = 0;
    this.inv = 0;
    this.flash = 0;
    this.prev = {};
    this.holdBack = false;
    this.crouching = false;
    this.airUsed = false;
    this.lie = 0;
    this.combo = 0;
    this.comboT = 0;
    this.atkHit = false;
  }
  get grounded() {
    return this.y >= GROUND - 0.01;
  }
  setState(s, vis, keep) {
    if (keep && this.state === s && this.vis === (vis || s)) return;
    this.state = s;
    this.vis = vis || s;
    this.anim = 0;
  }
  startAtk(id, M) {
    const m = MOVES[id];
    this.state = "attack";
    this.vis = id;
    this.atkId = id;
    this.atk = m;
    this.anim = 0;
    this.atkHit = false;
    if (!m.air && !m.rise) this.vx = 0;
    if (m.inv) this.inv = m.inv;
    if (id === "up") M.fx("up", this.x, this.y - 120);
    else if (!m.proj) M.fx("whoosh", this.x, this.y);
  }
  update(inp, opp, M) {
    const pr = this.prev,
      ed = (k) => inp[k] && !pr[k];
    this.prev = { ...inp };
    this.anim++;
    if (this.inv > 0 && this.inv < 500) this.inv--;
    if (this.flash > 0) this.flash--;
    if (this.comboT > 0) this.comboT--;
    let back = this.facing === 1 ? inp.l : inp.r;
    this.holdBack = !!back;
    this.crouching = !!inp.d && this.grounded;
    switch (this.state) {
      case "ko":
        break;
      case "kd":
        if (this.grounded && this.anim > 6) {
          this.vx *= 0.8;
          this.lie++;
          if (this.lie > 48) {
            this.setState("idle");
            this.inv = 24;
            this.lie = 0;
          }
        }
        break;
      case "hit":
      case "block":
        this.stun--;
        this.vx *= 0.84;
        if (this.stun <= 0 && this.grounded) {
          this.setState(this.crouching ? "crouch" : "idle");
        }
        break;
      case "attack":
        this.updAttack(M);
        break;
      default:
        this.neutral(inp, ed, opp, M);
    }
    // physics
    if (!this.grounded || this.vy < 0) this.vy += GRAV;
    this.y += this.vy;
    this.x += this.vx;
    if (this.y >= GROUND) {
      const wasAir = this.vy > 0;
      this.y = GROUND;
      if (wasAir) {
        this.vy = 0;
        if (this.state === "jump") {
          this.setState("idle");
          this.vx = 0;
          M.fx("land", this.x, this.y);
        } else if (this.state === "attack" && (this.atk.air || this.atk.rise) && this.anim > 2) {
          this.setState("idle");
          this.vx = 0;
          this.airUsed = false;
          M.fx("land", this.x, this.y);
        } else if (this.state === "kd" || this.state === "ko") {
          M.fx("land", this.x, this.y);
          this.vx *= 0.5;
        }
      }
    }
    this.x = clamp(this.x, 40, W - 40);
    if (this.state !== "attack" || !this.atk || !this.atk.air)
      if (this.grounded && this.state !== "jump") this.airUsed = false;
  }
  neutral(inp, ed, opp, M) {
    if (this.vis === "win") {
      this.vx = 0;
      return;
    }
    if (this.grounded) {
      const dir = Math.sign(opp.x - this.x) || this.facing;
      this.facing = dir;
      const fwd = dir === 1 ? inp.r : inp.l,
        back = dir === 1 ? inp.l : inp.r;
      this.holdBack = !!back;
      const cr = !!inp.d;
      if (ed("s")) {
        if (cr) return this.startAtk("up", M);
        if (this.meter >= 100) {
          this.meter = 0;
          return this.startAtk("su", M);
        }
        if (!M.proj.some((p) => p.owner === this.side)) return this.startAtk("fb", M);
      }
      if (ed("p")) return this.startAtk(cr ? "cp" : "sp", M);
      if (ed("k")) return this.startAtk(cr ? "ck" : "sk", M);
      if (inp.u) {
        this.vy = -JUMPV;
        this.vx = (fwd ? 1 : back ? -1 : 0) * dir * 4.6;
        this.setState("jump");
        this.airUsed = false;
        M.fx("jump", this.x, this.y);
        return;
      }
      if (cr) {
        this.vx = 0;
        this.setState("crouch", null, true);
      } else if (fwd) {
        this.vx = dir * 4.2;
        this.setState("walk", null, true);
      } else if (back) {
        this.vx = -dir * 3.4;
        this.setState("walkb", null, true);
      } else {
        this.vx = 0;
        this.setState("idle", null, true);
      }
    } else if (!this.airUsed && (ed("p") || ed("k"))) {
      this.airUsed = true;
      const id = ed("p") ? "jp" : "jk";
      const vx = this.vx,
        vy = this.vy;
      this.startAtk(id, M);
      this.vx = vx;
      this.vy = vy;
    }
  }
  updAttack(M) {
    const m = this.atk,
      t = this.anim;
    if (m.rise && t === m.st) {
      this.vy = -15.5;
      this.vx = this.facing * 2.4;
    }
    if (m.proj && t === m.st) M.spawnProj(this, !!m.big);
    if (m.air || m.rise) return; // ends on landing
    if (t >= m.st + m.act + m.rec) {
      this.setState(CROUCHY.has(this.atkId) ? "crouch" : "idle");
      this.atk = null;
    }
  }
  active() {
    const m = this.atk;
    return this.state === "attack" && m && !m.proj && !this.atkHit && this.anim > m.st && this.anim <= m.st + m.act;
  }
  hitbox() {
    const [bx, by, bw, bh] = this.atk.box;
    return [this.facing === 1 ? this.x + bx : this.x - bx - bw, this.y + by, bw, bh];
  }
  hurtbox() {
    if (CROUCHY.has(this.vis)) return [this.x - 38, this.y - 175, 76, 175];
    if (!this.grounded) return [this.x - 34, this.y - 245, 68, 205];
    return [this.x - 36, this.y - 262, 72, 262];
  }
  canBlock() {
    return this.grounded && ["idle", "walk", "walkb", "crouch", "block"].includes(this.state);
  }
}
const overlap = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
