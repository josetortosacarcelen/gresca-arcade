function makeAI(level) {
  const ai = { t: 0, hold: {} },
    react = [22, 13, 6][level],
    skill = [0.3, 0.55, 0.82][level];
  return (me, opp, M) => {
    const inp = {};
    if (ai.t > 0) {
      ai.t--;
      return Object.assign(inp, ai.hold);
    }
    ai.t = react + ((Math.random() * react) | 0);
    ai.hold = {};
    const dx = opp.x - me.x,
      dist = Math.abs(dx),
      tw = Math.sign(dx) || 1,
      F = tw > 0 ? "r" : "l",
      B = tw > 0 ? "l" : "r",
      r = Math.random();
    const mine = M.proj.some((p) => p.owner === me.side);
    const incoming = M.proj.find(
      (p) => p.owner !== me.side && Math.sign(me.x - p.x) === p.dir && Math.abs(me.x - p.x) < 330,
    );
    if (me.state === "jump") {
      if (dist < 170 && r < skill + 0.2) inp[r < 0.5 ? "k" : "p"] = 1;
      return inp;
    }
    if (me.state !== "idle" && me.state !== "walk" && me.state !== "walkb" && me.state !== "crouch") {
      ai.t = 2;
      return inp;
    }
    if (incoming) {
      if (r < skill * 0.55) {
        inp.u = 1;
        inp[F] = 1;
        ai.t = 3;
      } else if (r < skill) {
        ai.hold = { [B]: 1 };
        ai.t = Math.max(ai.t, 14);
      } else if (!mine && r < skill + 0.15) inp.s = 1;
      return Object.assign(inp, ai.hold);
    }
    if (!opp.grounded && opp.state !== "kd" && dist < 210 && opp.vy > -6 && r < skill * 0.75) {
      inp.d = 1;
      inp.s = 1;
      return inp;
    }
    if (opp.state === "attack" && opp.atk && !opp.atk.proj && dist < 200 && r < skill * 0.85) {
      ai.hold = { [B]: 1, d: opp.atk.lvl === "low" ? 1 : 0 };
      ai.t = Math.max(ai.t, 12);
      return Object.assign(inp, ai.hold);
    }
    if (me.meter >= 100 && dist > 180 && r < 0.6) {
      inp.s = 1;
      return inp;
    }
    if (dist > 420) {
      if (r < 0.32 && !mine) inp.s = 1;
      else ai.hold = { [F]: 1 };
      return Object.assign(inp, ai.hold);
    }
    if (dist > 165) {
      if (r < 0.16 && !mine) inp.s = 1;
      else if (r < 0.3) {
        inp.u = 1;
        inp[F] = 1;
      } else if (r < 0.85) ai.hold = { [F]: 1 };
      else ai.hold = { [B]: 1 };
      return Object.assign(inp, ai.hold);
    }
    if (r < 0.28) inp.p = 1;
    else if (r < 0.48) inp.k = 1;
    else if (r < 0.6) {
      inp.d = 1;
      inp.k = 1;
      ai.hold = { d: 1 };
    } else if (r < 0.7) {
      inp.d = 1;
      inp.p = 1;
      ai.hold = { d: 1 };
    } else if (r < 0.84) ai.hold = { [B]: 1 };
    else {
      ai.hold = { [B]: 1, d: 1 };
    }
    return Object.assign(inp, ai.hold);
  };
}
