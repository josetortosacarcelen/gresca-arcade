const LEN = { thigh: 58, shin: 56, torso: 82, upper: 44, fore: 42 };
let STAGE = null;
function buildStageBar() {
  const c = makeCanvas(W, H),
    x = c.getContext("2d");
  const sky = x.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#1d0f3d");
  sky.addColorStop(0.55, "#7a2a6b");
  sky.addColorStop(0.85, "#ff7a3d");
  sky.addColorStop(1, "#ffc06a");
  x.fillStyle = sky;
  x.fillRect(0, 0, W, GROUND);
  // sun
  const sg = x.createRadialGradient(480, 330, 10, 480, 330, 190);
  sg.addColorStop(0, "#ffe9a8");
  sg.addColorStop(0.4, "#ffb15a");
  sg.addColorStop(1, "#ff7a3d00");
  x.fillStyle = sg;
  x.beginPath();
  x.arc(480, 330, 190, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#ffd27a";
  x.beginPath();
  x.arc(480, 330, 90, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#ff9a4a";
  for (let i = 0; i < 6; i++) {
    x.fillRect(380, 300 + i * 14, 200, 3 + i);
  }
  // far skyline
  let seed = 7;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  x.fillStyle = "#3a1a4d";
  for (let bx = 0; bx < W; ) {
    const bw = 30 + r() * 60,
      bh = 80 + r() * 150;
    x.fillRect(bx, GROUND - 60 - bh, bw, bh + 60);
    bx += bw + 2;
  }
  // near buildings with windows
  for (let bx = -10; bx < W; ) {
    const bw = 70 + r() * 90,
      bh = 120 + r() * 170,
      top = GROUND - bh;
    x.fillStyle = "#24123a";
    x.fillRect(bx, top, bw, bh);
    x.fillStyle = "#1a0d2c";
    x.fillRect(bx, top, bw, 6);
    for (let wy = top + 16; wy < GROUND - 30; wy += 22)
      for (let wx = bx + 10; wx < bx + bw - 14; wx += 18) {
        if (r() < 0.45) {
          x.fillStyle = r() < 0.5 ? "#ffd27a" : "#ff9f5a";
          x.globalAlpha = 0.55 + r() * 0.4;
          x.fillRect(wx, wy, 8, 11);
          x.globalAlpha = 1;
        }
      }
    bx += bw + 6 + r() * 14;
  }
  // street
  const st = x.createLinearGradient(0, GROUND, 0, H);
  st.addColorStop(0, "#3b2a52");
  st.addColorStop(1, "#140c22");
  x.fillStyle = st;
  x.fillRect(0, GROUND, W, H - GROUND);
  x.strokeStyle = "#ffffff18";
  x.lineWidth = 2;
  for (let i = -20; i <= 20; i++) {
    x.beginPath();
    x.moveTo(W / 2 + i * 30, GROUND);
    x.lineTo(W / 2 + i * 110, H);
    x.stroke();
  }
  x.fillStyle = "#ffc93c55";
  for (let i = 0; i < W; i += 80) x.fillRect(i, GROUND + 30, 40, 4);
  x.fillStyle = "#ffffff22";
  x.fillRect(0, GROUND, W, 3);
  return c;
}
function drawStageBar(c, frame) {
  if (!STAGE) STAGE = buildStageBar();
  c.drawImage(STAGE, 0, 0);
  // neon sign
  const on = Math.floor(frame / 90) % 7 !== 3;
  c.save();
  c.font = "34px Bungee, Impact, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.shadowColor = on ? "#ff3fb4" : "transparent";
  c.shadowBlur = on ? 22 : 0;
  c.fillStyle = on ? "#ffb3e6" : "#5a3058";
  c.fillText("GRESCA", 170, 120);
  c.shadowColor = on ? "#41e3ff" : "transparent";
  c.fillStyle = on ? "#c4f6ff" : "#2c4a58";
  c.font = "16px Bungee, Impact, sans-serif";
  c.fillText("· BAR · 24H ·", 170, 152);
  c.restore();
  // crowd silhouettes
  c.fillStyle = "#0e0718";
  for (let i = 0; i < 14; i++) {
    const cx = 30 + i * 70 + (i % 2) * 18,
      b = Math.abs(Math.sin(frame * 0.06 + i * 1.7)) * 5,
      y = GROUND - 6 - b;
    c.beginPath();
    c.arc(cx, y - 52, 13, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(cx, y - 14, 20, 30, 0, Math.PI, 0);
    c.fill();
    c.fillRect(cx - 20, y - 14, 40, 14);
    if (i % 3 === 0) {
      c.beginPath();
      c.moveTo(cx + 12, y - 36);
      c.lineTo(cx + 22, y - 62 - b * 2);
      c.lineWidth = 7;
      c.strokeStyle = "#0e0718";
      c.stroke();
    }
  }
}
function pose(f) {
  const t = f.anim,
    v = f.vis,
    S = Math.sin;
  const guardF = [1.05, 2.75],
    guardB = [0.75, 2.55];
  const P = {
    lean: 0.08,
    legs: [
      [0.45, 0.06],
      [-0.42, -0.14],
    ],
    arms: [guardF, guardB],
    rot: 0,
  };
  const ext = (id) => {
    const m = MOVES[id];
    if (t <= m.st) return (t / m.st) * 0.7;
    if (t <= m.st + m.act) return 1;
    return Math.max(0, 1 - (t - m.st - m.act) / m.rec);
  };
  const crouchLegs = [
      [1.3, -0.1],
      [-0.1, -1.3],
    ],
    jumpLegs = [
      [1.4, -0.4],
      [0.6, -1.1],
    ];
  switch (v) {
    case "idle": {
      const b = S(t * 0.1);
      P.arms = [
        [1.05 + b * 0.05, 2.75 - b * 0.08],
        [0.75 + b * 0.05, 2.55],
      ];
      P.legs = [
        [0.45, 0.06 + b * 0.04],
        [-0.42, -0.14],
      ];
      P.bobY = b * 2.5;
      P.lean = 0.08 + b * 0.015;
      break;
    }
    case "walk":
    case "walkb": {
      const p = t * 0.2 * (v === "walk" ? 1 : -1),
        s = S(p);
      P.legs = [
        [0.14 + 0.36 * s, 0.14 + 0.36 * s - 0.25 - 0.2 * Math.max(0, S(p + 1.5))],
        [0.14 - 0.36 * s, 0.14 - 0.36 * s - 0.25 - 0.2 * Math.max(0, S(p + 1.5 + Math.PI))],
      ];
      P.lean = 0.12;
      P.bobY = Math.abs(s) * 3;
      break;
    }
    case "crouch":
      P.legs = crouchLegs;
      P.lean = 0.35;
      break;
    case "jump":
      P.legs = jumpLegs;
      P.arms = [
        [1.6, 2.4],
        [1.0, 2.2],
      ];
      P.lean = 0.15;
      break;
    case "sp": {
      const e = ext("sp");
      P.arms = [mix2(guardF, [1.57, 1.57], e), [0.45, 2.6]];
      P.lean = 0.08 + 0.18 * e;
      P.legs = [
        [0.52, 0.08],
        [-0.5, -0.18],
      ];
      break;
    }
    case "sk": {
      const e = ext("sk");
      P.legs = [mix2([0.45, 0.06], [1.62, 1.66], e), [-0.22, -0.08]];
      P.lean = 0.08 - 0.45 * e;
      P.arms = [
        [0.9, 2.6],
        [-0.3, 1.5],
      ];
      break;
    }
    case "cp": {
      const e = ext("cp");
      P.legs = crouchLegs;
      P.lean = 0.35 + 0.1 * e;
      P.arms = [mix2(guardF, [1.7, 1.62], e), guardB];
      break;
    }
    case "ck": {
      const e = ext("ck");
      P.legs = [mix2([1.3, -0.1], [1.52, 1.56], e), [-0.1, -1.3]];
      P.lean = 0.3 + 0.35 * e;
      P.arms = [
        [0.5, 1.1],
        [-0.2, 0.5],
      ];
      break;
    }
    case "jp": {
      const e = ext("jp");
      P.legs = jumpLegs;
      P.arms = [mix2(guardF, [1.15, 1.0], e), [0.7, 2.3]];
      P.lean = 0.25;
      break;
    }
    case "jk": {
      const e = ext("jk");
      P.legs = [mix2([1.4, -0.4], [1.05, 0.95], e), [0.45, -1.25]];
      P.lean = -0.15 * e;
      P.arms = [
        [1.0, 2.5],
        [-0.2, 1.4],
      ];
      break;
    }
    case "up": {
      const e = ext("up");
      P.arms = [mix2(guardF, [2.95, 3.08], Math.min(1, e * 1.2)), [0.3, 1.3]];
      P.legs =
        e > 0.5
          ? [
              [1.35, 0.25],
              [-0.08, -0.04],
            ]
          : [
              [0.55, 0.1],
              [-0.42, -0.15],
            ];
      P.lean = -0.08;
      break;
    }
    case "fb":
    case "su": {
      const e = ext(v);
      P.arms = [mix2(guardF, [1.5, 1.62], e), mix2(guardB, [1.4, 1.58], e)];
      P.lean = 0.08 + 0.22 * e;
      P.legs = [
        [0.6, 0.1],
        [-0.58, -0.22],
      ];
      break;
    }
    case "hit": {
      const k = Math.max(0, 1 - t / 14);
      P.lean = -0.45 * k - 0.05;
      P.arms = [
        [-0.3, 0.7],
        [-0.5, 0.4],
      ];
      P.legs = [
        [0.32, 0.1],
        [-0.48, -0.1],
      ];
      break;
    }
    case "chit":
      P.legs = crouchLegs;
      P.lean = -0.1;
      P.arms = [
        [-0.2, 0.8],
        [-0.4, 0.5],
      ];
      break;
    case "block":
      P.arms = [
        [1.3, 3.0],
        [1.05, 3.08],
      ];
      P.lean = -0.14;
      P.legs = [
        [0.48, 0.06],
        [-0.48, -0.12],
      ];
      break;
    case "cblock":
      P.legs = crouchLegs;
      P.arms = [
        [1.3, 3.0],
        [1.05, 3.08],
      ];
      P.lean = 0.15;
      break;
    case "kd":
    case "ko": {
      P.legs = [
        [0.5, 0.3],
        [-0.1, 0.2],
      ];
      P.arms = [
        [-0.6, 0.4],
        [-1.1, -0.4],
      ];
      P.lean = 0;
      const air = !f.grounded && f.y < GROUND - 2;
      P.rot = -(air ? Math.min(1.2, t / 12) : 1.5);
      P.lying = !air;
      if (v === "kd" && f.lie > 36) {
        const g = (f.lie - 36) / 12;
        P.rot = -1.5 * (1 - g);
        P.legs = crouchLegs;
      }
      break;
    }
    case "win": {
      const b = Math.abs(S(t * 0.12));
      P.arms = [
        [3.0 - 0.1 * b, 3.05],
        [0.6, 2.5],
      ];
      P.legs = [
        [0.45, 0.05],
        [-0.45, -0.12],
      ];
      P.bobY = b * 5;
      break;
    }
  }
  return P;
}
/* ---- arcade body renderer: heavy 90s-fighter anatomy, 3-tone cel shading, ink outline ---- */
const INK = "#120a18";
const OUTFITS = {
  gi: { label: "Kimono", torso: "jacket", legs: "wide", feet: "bare", hands: "wrap" },
  tank: { label: "Camiseta y cargo", torso: "tank", legs: "cargo", feet: "boots", hands: "wrap", boot: "#3b2a20" },
  boxer: { label: "Boxeador", torso: "bare", legs: "shorts", feet: "boots", hands: "gloves", boot: "#2a2230" },
  lucha: { label: "Luchador", torso: "bare", legs: "trunks", feet: "boots", hands: "band", boot: "acc" },
  calle: { label: "Callejero", torso: "vest", legs: "cargo", feet: "boots", hands: "wrap", boot: "#e8e4da" },
  traje: { label: "Traje de combate", torso: "suit", legs: "tight", feet: "boots", hands: "wrap", boot: "acc" },
  uniforme: { label: "Uniforme", torso: "coat", legs: "cargo", feet: "boots", hands: "fist", boot: "#1a1622" },
};
const BUILDS = {
  normal: { w: 1, sh: 1, h: 1 },
  heavy: { w: 1.3, sh: 1.24, h: 1.07 },
  slim: { w: 0.82, sh: 0.86, h: 0.98 },
};
function cap(A, B, wA, wB, bulge = 0, at = 0.42) {
  const dx = B[0] - A[0],
    dy = B[1] - A[1],
    L = Math.hypot(dx, dy) || 1,
    n = [-dy / L, dx / L],
    d = Math.atan2(dy, dx);
  const M = [A[0] + dx * at, A[1] + dy * at],
    wm = mix(wA, wB, at) / 2 + bulge;
  const p = new Path2D();
  p.moveTo(A[0] + (n[0] * wA) / 2, A[1] + (n[1] * wA) / 2);
  p.quadraticCurveTo(M[0] + n[0] * wm * 1.25, M[1] + n[1] * wm * 1.25, B[0] + (n[0] * wB) / 2, B[1] + (n[1] * wB) / 2);
  p.arc(B[0], B[1], wB / 2, d + Math.PI / 2, d - Math.PI / 2, true);
  p.quadraticCurveTo(M[0] - n[0] * wm * 1.25, M[1] - n[1] * wm * 1.25, A[0] - (n[0] * wA) / 2, A[1] - (n[1] * wA) / 2);
  p.arc(A[0], A[1], wA / 2, d - Math.PI / 2, d + Math.PI / 2, true);
  p.closePath();
  return { p, A, B, n, M, w: (wA + wB) / 2 };
}
// parts: [cap, base, shade, highlight] drawn as one inked group. Light comes from the front-top.
function ink(c, parts, lw = 6) {
  c.lineJoin = "round";
  c.strokeStyle = INK;
  c.lineWidth = lw;
  for (const q of parts) c.stroke(q[0].p);
  for (const [k, col, sh, hl] of parts) {
    c.fillStyle = col;
    c.fill(k.p);
    if (!sh && !hl) continue;
    c.save();
    c.clip(k.p);
    const { A, B, n, w } = k;
    if (sh) {
      c.fillStyle = sh;
      const o = w * 0.08,
        e = 80,
        L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1,
        tx = ((B[0] - A[0]) / L) * w,
        ty = ((B[1] - A[1]) / L) * w,
        a = [A[0] - tx, A[1] - ty],
        b = [B[0] + tx, B[1] + ty];
      c.beginPath();
      c.moveTo(a[0] + n[0] * o, a[1] + n[1] * o);
      c.lineTo(b[0] + n[0] * o, b[1] + n[1] * o);
      c.lineTo(b[0] + n[0] * e, b[1] + n[1] * e);
      c.lineTo(a[0] + n[0] * e, a[1] + n[1] * e);
      c.fill();
    }
    if (hl) {
      c.strokeStyle = hl;
      c.lineWidth = Math.max(2.5, w * 0.14);
      c.lineCap = "round";
      const o = -w * 0.27,
        a = along(A, B, 0.18),
        b = along(A, B, 0.7);
      c.beginPath();
      c.moveTo(a[0] + n[0] * o, a[1] + n[1] * o);
      c.lineTo(b[0] + n[0] * o, b[1] + n[1] * o);
      c.stroke();
    }
    c.restore();
  }
}
const along = (A, B, t) => [mix(A[0], B[0], t), mix(A[1], B[1], t)];
function camo(c, k, base, seed) {
  c.save();
  c.clip(k.p);
  const cols = [shadeColor(base, -0.3), shadeColor(base, 0.2), shadeColor(base, -0.5)];
  for (let i = 0; i < 7; i++) {
    const t = ((seed * 7 + i * 37) % 100) / 100,
      s = ((seed * 13 + i * 53) % 100) / 100;
    const P = along(k.A, k.B, t);
    c.fillStyle = cols[i % 3];
    c.beginPath();
    c.ellipse(P[0] + k.n[0] * (s - 0.5) * 22, P[1] + k.n[1] * (s - 0.5) * 22, 10, 5, t * 3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
function drawFighter(c, f, frame, scale = 1) {
  const d = f.def,
    P = pose(f),
    white = f.flash > 0 && f.flash % 2 === 0,
    O = OUTFITS[d.outfit] || OUTFITS.gi,
    Bd = BUILDS[d.build] || BUILDS.normal,
    bw = Bd.w,
    sx = Bd.sh;
  const tn = (hex, back) => {
    if (white) return ["#ffffff", null, null];
    const b = back ? shadeColor(hex, -0.2) : hex;
    return [b, shadeColor(b, -0.34), back ? null : shadeColor(hex, 0.3)];
  };
  const one = (hex) => (white ? "#ffffff" : hex);
  const K = (A, B, wA, wB, bu = 0, at) => cap(A, B, wA * bw, wB * bw, bu * bw, at);
  const line = (col, w, fn) => {
    if (white) return;
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = "round";
    c.beginPath();
    fn();
    c.stroke();
  };
  const skinLine = shadeColor(d.skin, -0.5),
    clothLine = shadeColor(d.gi, -0.55);
  const bootHex = O.boot === "acc" ? d.glove : O.boot || "#3b2a20";
  c.save();
  c.translate(f.x, f.y);
  c.scale(f.facing * scale * Bd.h, scale * Bd.h);
  if (f.inv > 0 && f.inv < 500 && frame % 6 < 3) c.globalAlpha = 0.55;
  const legs = P.legs.map(([a, b]) => {
    const k = [Math.sin(a) * LEN.thigh, Math.cos(a) * LEN.thigh];
    return { k, ft: [k[0] + Math.sin(b) * LEN.shin, k[1] + Math.cos(b) * LEN.shin] };
  });
  let hipY = -Math.max(legs[0].ft[1], legs[1].ft[1]) - 10 - (P.bobY || 0) * 0.3;
  if (P.rot) {
    c.translate(P.lying ? -10 : 0, P.lying ? -20 : -70);
    c.rotate(P.rot);
    c.translate(0, P.lying ? 0 : 70);
    if (P.lying) hipY = -62;
  }
  const lean = P.lean,
    cs = Math.cos(lean),
    sn = Math.sin(lean);
  const T = (x, y) => [x * cs - y * sn, hipY + x * sn + y * cs];
  const shF = T(25 * sx, -LEN.torso + 9),
    shB = T(-23 * sx, -LEN.torso + 9);
  const armPts = (A, s) => {
    const e = [s[0] + Math.sin(A[0]) * LEN.upper, s[1] + Math.cos(A[0]) * LEN.upper];
    return { s, e, h: [e[0] + Math.sin(A[1]) * LEN.fore, e[1] + Math.cos(A[1]) * LEN.fore] };
  };
  const legPts = (L, front) => {
    const s = [(front ? 10 : -10) * sx, hipY];
    return { s, k: [s[0] + L.k[0], s[1] + L.k[1]], ft: [s[0] + L.ft[0], s[1] + L.ft[1]] };
  };
  const drawLeg = (l, back) => {
    const bareLeg = O.legs === "shorts" || O.legs === "trunks";
    const foot =
      O.feet === "bare"
        ? K([l.ft[0] - 3, l.ft[1] + 3], [l.ft[0] + 25, l.ft[1] + 5], 18, 12)
        : K([l.ft[0] - 5, l.ft[1] + 2], [l.ft[0] + 27, l.ft[1] + 4], 22, 16);
    if (O.legs === "wide") {
      const q = along(l.k, l.ft, 0.8),
        ank = K(l.k, l.ft, 15, 13);
      ink(c, [
        [ank, ...tn(d.skin, back)],
        [foot, ...tn(d.skin, back)],
      ]);
      const thigh = K(l.s, l.k, 40, 33, 4),
        shin = K(l.k, q, 31, 37, 0, 0.6);
      ink(c, [
        [thigh, ...tn(d.gi, back)],
        [shin, ...tn(d.gi, back)],
      ]);
      line(clothLine, 2.2, () => {
        const a = along(l.k, q, 0.15),
          b = along(l.s, l.k, 0.5);
        c.moveTo(a[0] - 9, a[1] - 2);
        c.quadraticCurveTo(a[0], a[1] + 7, a[0] + 10, a[1] - 3);
        c.moveTo(b[0] - 10, b[1]);
        c.quadraticCurveTo(b[0] - 2, b[1] + 8, b[0] + 4, b[1] + 14);
        c.moveTo(q[0] - 12, q[1] + 3);
        c.lineTo(q[0] - 7, q[1] - 4);
        c.lineTo(q[0] - 2, q[1] + 4);
        c.lineTo(q[0] + 4, q[1] - 4);
        c.lineTo(q[0] + 10, q[1] + 3);
      });
      return;
    }
    const thigh =
      O.legs === "tight" ? K(l.s, l.k, 32, 22, 5) : bareLeg ? K(l.s, l.k, 35, 23, 7, 0.4) : K(l.s, l.k, 36, 27, 3);
    const shin =
      O.legs === "tight"
        ? K(l.k, l.ft, 23, 14, 5, 0.3)
        : bareLeg
          ? K(l.k, l.ft, 24, 14, 7, 0.3)
          : K(l.k, l.ft, 27, 23, 2);
    const legHex = bareLeg ? d.skin : d.gi,
      footHex = O.feet === "bare" ? d.skin : bootHex;
    ink(c, [
      [thigh, ...tn(legHex, back)],
      [shin, ...tn(legHex, back)],
      [foot, ...tn(footHex, back)],
    ]);
    if (d.outfit === "tank" && !white) {
      const b = back ? shadeColor(d.gi, -0.2) : d.gi;
      camo(c, thigh, b, 1);
      camo(c, shin, b, 2);
    }
    if (bareLeg) {
      line(skinLine, 2.2, () => {
        c.arc(l.k[0] + 2, l.k[1], 7 * bw, 0.3, 2.6);
        const a = along(l.s, l.k, 0.35),
          b = along(l.s, l.k, 0.8);
        c.moveTo(a[0] + 4, a[1]);
        c.quadraticCurveTo(a[0] + 9, (a[1] + b[1]) / 2, b[0] + 3, b[1]);
      });
      const top = O.legs === "shorts" ? K(l.s, along(l.s, l.k, 0.55), 42, 38) : K(l.s, along(l.s, l.k, 0.2), 38, 36);
      ink(c, [[top, ...tn(d.gi, back)]]);
      if (O.legs === "shorts")
        line(one(d.glove), 4, () => {
          const a = along(l.s, l.k, 0.1),
            b = along(l.s, l.k, 0.5);
          c.moveTo(a[0] + 13 * bw, a[1]);
          c.lineTo(b[0] + 13 * bw, b[1]);
        });
    } else
      line(clothLine, 2.2, () => {
        const a = along(l.k, l.ft, 0.08);
        c.moveTo(a[0] - 8, a[1] - 3);
        c.quadraticCurveTo(a[0], a[1] + 5, a[0] + 9, a[1] - 4);
      });
    if (O.feet === "boots") {
      const hi = O.legs === "tight" ? 0.3 : bareLeg ? 0.42 : 0.6;
      const top = along(l.k, l.ft, hi);
      const bt = K(top, l.ft, bareLeg ? 21 : 26, 21);
      ink(c, [
        [bt, ...tn(bootHex, back)],
        [foot, ...tn(bootHex, back)],
      ]);
      line(shadeColor(bootHex, -0.5), 2, () => {
        for (let i = 1; i < 4; i++) {
          const q = along(top, l.ft, i / 4);
          c.moveTo(q[0] - 1, q[1]);
          c.lineTo(q[0] + 8, q[1] - 1);
        }
      });
      const cuff = K(top, along(top, l.ft, 0.12), bareLeg ? 23 : 28, bareLeg ? 23 : 28);
      ink(c, [[cuff, ...tn(O.legs === "tight" || O.boot === "acc" ? shadeColor(bootHex, 0.35) : bootHex, back)]], 4);
    }
  };
  const drawArm = (a, back) => {
    const coat = O.torso === "coat",
      armHex = coat ? d.gi : d.skin;
    const upper = K(a.s, a.e, 33, 22, 6, 0.5),
      fore = K(a.e, a.h, 27, 17, 5, 0.3);
    ink(c, [
      [upper, ...tn(armHex, back)],
      [fore, ...tn(armHex, back)],
    ]);
    if (!coat)
      line(skinLine, 2.2, () => {
        const q = along(a.s, a.e, 0.5),
          r = along(a.e, a.h, 0.25);
        c.moveTo(q[0] - upper.n[0] * 3, q[1] - upper.n[1] * 3);
        c.quadraticCurveTo(
          q[0] + upper.n[0] * 6,
          q[1] + upper.n[1] * 6,
          a.e[0] + upper.n[0] * 5,
          a.e[1] + upper.n[1] * 5,
        );
        c.moveTo(r[0] + fore.n[0] * 2, r[1] + fore.n[1] * 2);
        const r2 = along(a.e, a.h, 0.7);
        c.lineTo(r2[0] + fore.n[0] * 3, r2[1] + fore.n[1] * 3);
      });
    else
      line(clothLine, 2.2, () => {
        c.moveTo(a.e[0] - 6, a.e[1] - 5);
        c.quadraticCurveTo(a.e[0], a.e[1] + 3, a.e[0] + 7, a.e[1] - 3);
      });
    if (O.torso === "jacket") {
      const end = along(a.s, a.e, 0.42),
        sl = K(a.s, end, 37, 33);
      ink(c, [[sl, ...tn(d.gi, back)]]);
      const n = sl.n,
        dir = [(a.e[0] - a.s[0]) / LEN.upper, (a.e[1] - a.s[1]) / LEN.upper];
      c.fillStyle = one(back ? shadeColor(d.gi, -0.2) : d.gi);
      c.strokeStyle = INK;
      c.lineWidth = 2.5;
      c.lineJoin = "round";
      for (let i = -1; i <= 1; i++) {
        const b = [end[0] + n[0] * i * 10 * bw + dir[0] * 12, end[1] + n[1] * i * 10 * bw + dir[1] * 12];
        c.beginPath();
        c.moveTo(b[0] - n[0] * 6, b[1] - n[1] * 6);
        c.lineTo(b[0] + dir[0] * 11, b[1] + dir[1] * 11);
        c.lineTo(b[0] + n[0] * 6, b[1] + n[1] * 6);
        c.fill();
        c.stroke();
      }
    }
    if (coat) {
      const cf = K(along(a.e, a.h, 0.68), along(a.e, a.h, 0.95), 21, 20);
      ink(c, [[cf, ...tn(d.glove, back)]]);
    }
    const hd = a.h;
    if (O.hands === "gloves") {
      const cuff = K(along(a.e, a.h, 0.62), along(a.e, a.h, 0.86), 22, 24),
        g = K([hd[0] - 4, hd[1] - 2], [hd[0] + 8, hd[1] + 2], 34, 34);
      ink(c, [
        [cuff, ...tn("#f1ece4", back)],
        [g, ...tn(d.glove, back)],
      ]);
      if (!white) {
        c.fillStyle = "#ffffff66";
        c.beginPath();
        c.ellipse(hd[0] + 3, hd[1] - 9, 8, 4, 0, 0, Math.PI * 2);
        c.fill();
      }
      return;
    }
    if (O.hands === "wrap" || O.hands === "band") {
      const w =
        O.hands === "wrap"
          ? K(along(a.e, a.h, 0.5), along(a.e, a.h, 0.94), 21, 19)
          : K(along(a.e, a.h, 0.6), along(a.e, a.h, 0.86), 22, 21);
      ink(c, [[w, ...tn(d.glove, back)]]);
      if (O.hands === "wrap")
        line(shadeColor(d.glove, -0.45), 1.8, () => {
          for (let i = 0; i < 3; i++) {
            const q = along(a.e, a.h, 0.58 + i * 0.12);
            c.moveTo(q[0] - w.n[0] * 8, q[1] - w.n[1] * 8);
            c.lineTo(q[0] + w.n[0] * 8 + 3, q[1] + w.n[1] * 8 + 3);
          }
        });
    }
    const fist = K([hd[0] - 4, hd[1]], [hd[0] + 7, hd[1] + 1], 27, 25);
    ink(c, [[fist, ...tn(O.hands === "fist" && coat ? d.glove : d.skin, back)]]);
    line(INK, 1.8, () => {
      c.moveTo(hd[0] + 5, hd[1] - 10);
      c.lineTo(hd[0] + 5, hd[1] + 9);
      c.moveTo(hd[0] + 5, hd[1] - 3);
      c.lineTo(hd[0] + 13, hd[1] - 3);
      c.moveTo(hd[0] + 5, hd[1] + 3);
      c.lineTo(hd[0] + 13, hd[1] + 3);
    });
  };
  const A0 = armPts(P.arms[0], shF),
    A1 = armPts(P.arms[1], shB),
    L0 = legPts(legs[0], true),
    L1 = legPts(legs[1], false);
  drawLeg(L1, true);
  drawArm(A1, true);
  // ---- torso (torso-local frame)
  c.save();
  c.translate(0, hipY);
  c.rotate(lean);
  const tl = -LEN.torso,
    X = (v) => v * sx,
    tor = new Path2D();
  tor.moveTo(X(-21), 7);
  tor.lineTo(X(21), 7);
  tor.quadraticCurveTo(X(25), -24, X(23), tl * 0.42);
  tor.quadraticCurveTo(X(43), tl * 0.72, X(37), tl + 5);
  tor.quadraticCurveTo(X(18), tl - 7, 0, tl - 5);
  tor.quadraticCurveTo(X(-18), tl - 7, X(-37), tl + 5);
  tor.quadraticCurveTo(X(-43), tl * 0.72, X(-23), tl * 0.42);
  tor.quadraticCurveTo(X(-25), -24, X(-21), 7);
  tor.closePath();
  const bareT = O.torso === "bare" || O.torso === "vest",
    clothTop = O.torso === "jacket" || O.torso === "coat" || O.torso === "suit";
  const [tc, ts, th] = tn(bareT ? d.skin : d.gi, false),
    [sc, ss, sh2] = tn(d.skin, false);
  // neck + trapezius
  const neck = new Path2D();
  neck.moveTo(X(-30), tl + 6);
  neck.quadraticCurveTo(X(-12), tl - 6, -9, tl - 20);
  neck.lineTo(10, tl - 20);
  neck.quadraticCurveTo(X(13), tl - 6, X(31), tl + 6);
  neck.closePath();
  c.lineJoin = "round";
  c.strokeStyle = INK;
  c.lineWidth = 6;
  c.stroke(neck);
  c.fillStyle = O.torso === "coat" ? tc : sc;
  c.fill(neck);
  if (ss) {
    c.save();
    c.clip(neck);
    c.fillStyle = O.torso === "coat" ? ts : ss;
    c.fillRect(-60, tl - 30, 56, 60);
    c.restore();
  }
  c.stroke(tor);
  c.fillStyle = tc;
  c.fill(tor);
  c.save();
  c.clip(tor);
  if (ts) {
    c.fillStyle = ts;
    c.beginPath();
    c.moveTo(-70, tl - 20);
    c.lineTo(X(-14), tl - 20);
    c.quadraticCurveTo(X(-4), tl * 0.5, X(-12), 12);
    c.lineTo(-70, 12);
    c.fill();
  }
  if (th) {
    c.fillStyle = th;
    c.globalAlpha = 0.55;
    c.beginPath();
    c.ellipse(X(16), tl + 20, X(9), 7, -0.3, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
  const pecs = () =>
    line(INK, 2.6, () => {
      c.moveTo(X(-31), tl + 22);
      c.quadraticCurveTo(X(-16), tl + 40, -1, tl + 30);
      c.moveTo(X(31), tl + 22);
      c.quadraticCurveTo(X(16), tl + 40, 1, tl + 30);
      c.moveTo(0, tl + 6);
      c.lineTo(0, tl + 30);
    });
  const abs = () =>
    line(skinLine, 2.2, () => {
      c.moveTo(0, tl + 32);
      c.lineTo(0, -8);
      for (const y of [tl * 0.52, tl * 0.37, tl * 0.22]) {
        c.moveTo(X(-13), y);
        c.quadraticCurveTo(X(-6), y + 4, -1, y);
        c.moveTo(X(13), y);
        c.quadraticCurveTo(X(6), y + 4, 1, y);
      }
      c.moveTo(X(-20), tl * 0.5);
      c.lineTo(X(-15), tl * 0.45);
      c.moveTo(X(-21), tl * 0.38);
      c.lineTo(X(-16), tl * 0.33);
      c.moveTo(X(20), tl * 0.5);
      c.lineTo(X(15), tl * 0.45);
      c.moveTo(X(21), tl * 0.38);
      c.lineTo(X(16), tl * 0.33);
    });
  if (O.torso === "jacket") {
    c.fillStyle = sc;
    c.beginPath();
    c.moveTo(X(-19), tl - 6);
    c.lineTo(X(19), tl - 6);
    c.lineTo(4, tl * 0.36);
    c.lineTo(-4, tl * 0.36);
    c.closePath();
    c.fill();
    if (ss) {
      c.fillStyle = ss;
      c.beginPath();
      c.moveTo(X(-19), tl - 6);
      c.lineTo(-2, tl - 6);
      c.lineTo(-2, tl * 0.4);
      c.lineTo(-4, tl * 0.36);
      c.closePath();
      c.fill();
    }
    line(INK, 2.6, () => {
      c.moveTo(X(-15), tl + 24);
      c.quadraticCurveTo(X(-8), tl + 36, -1, tl + 30);
      c.moveTo(X(15), tl + 24);
      c.quadraticCurveTo(X(8), tl + 36, 1, tl + 30);
      c.moveTo(0, tl + 8);
      c.lineTo(0, tl * 0.42);
    });
    line(INK, 3.2, () => {
      c.moveTo(X(-21), tl - 6);
      c.lineTo(-4, tl * 0.36);
      c.lineTo(X(-12), 2);
      c.moveTo(X(21), tl - 6);
      c.lineTo(4, tl * 0.36);
    });
    line(shadeColor(d.gi, 0.4), 3, () => {
      c.moveTo(X(-16), tl - 3);
      c.lineTo(-2, tl * 0.39);
      c.moveTo(X(16), tl - 3);
      c.lineTo(2, tl * 0.39);
    });
  }
  if (O.torso === "tank") {
    c.fillStyle = sc;
    c.beginPath();
    c.moveTo(-60, tl - 14);
    c.lineTo(60, tl - 14);
    c.lineTo(60, tl + 10);
    c.lineTo(X(30), tl + 12);
    c.quadraticCurveTo(0, tl + 34, X(-30), tl + 12);
    c.lineTo(-60, tl + 10);
    c.closePath();
    c.fill();
    c.fillStyle = sc;
    c.fillRect(X(30), tl, 40, tl * -0.4);
    c.fillRect(X(-30) - 40, tl, 40, tl * -0.4);
    if (ss) {
      c.fillStyle = ss;
      c.fillRect(-60, tl - 14, 60 + X(-12), 28);
    }
    line(INK, 3, () => {
      c.moveTo(X(-30), tl + 11);
      c.quadraticCurveTo(0, tl + 35, X(30), tl + 11);
      c.moveTo(X(30), tl + 11);
      c.quadraticCurveTo(X(26), tl * 0.7, X(34), tl * 0.55);
      c.moveTo(X(-30), tl + 11);
      c.quadraticCurveTo(X(-26), tl * 0.7, X(-34), tl * 0.55);
    });
    line(shadeColor(d.gi, -0.5), 2.2, () => {
      c.moveTo(X(-18), tl + 36);
      c.quadraticCurveTo(X(-9), tl + 44, -1, tl + 38);
      c.moveTo(X(18), tl + 36);
      c.quadraticCurveTo(X(9), tl + 44, 1, tl + 38);
    });
    if (!white) {
      c.strokeStyle = "#c9c9d4";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-9, tl + 2);
      c.quadraticCurveTo(0, tl + 30, 9, tl + 2);
      c.stroke();
      c.fillStyle = "#c9c9d4";
      c.fillRect(-3, tl + 24, 6, 9);
    }
  }
  if (bareT) {
    pecs();
    abs();
  }
  if (O.torso === "vest") {
    for (const s of [-1, 1]) {
      const v = new Path2D();
      v.moveTo(s * 60, tl - 20);
      v.lineTo(s * X(13), tl - 8);
      v.quadraticCurveTo(s * X(17), tl * 0.5, s * X(9), 12);
      v.lineTo(s * 60, 12);
      v.closePath();
      const [vc, vs] = tn(d.gi, s < 0);
      c.fillStyle = vc;
      c.fill(v);
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.stroke(v);
    }
    line(shadeColor(d.gi, 0.4), 2.5, () => {
      c.moveTo(X(17), tl - 2);
      c.quadraticCurveTo(X(20), tl * 0.5, X(13), 4);
    });
  }
  if (O.torso === "suit") {
    line(clothLine, 2.4, () => {
      c.moveTo(X(-28), tl + 24);
      c.quadraticCurveTo(X(-14), tl + 38, -1, tl + 30);
      c.moveTo(X(28), tl + 24);
      c.quadraticCurveTo(X(14), tl + 38, 1, tl + 30);
      c.moveTo(0, tl + 30);
      c.lineTo(0, -8);
      c.moveTo(X(-11), tl * 0.4);
      c.lineTo(X(11), tl * 0.4);
    });
    c.fillStyle = one(d.glove);
    c.beginPath();
    c.moveTo(X(-30), tl + 2);
    c.lineTo(X(-17), tl - 2);
    c.lineTo(X(24), tl * 0.32);
    c.lineTo(X(24), tl * 0.16);
    c.closePath();
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2.5;
    c.stroke();
    c.fillStyle = sc;
    c.beginPath();
    c.ellipse(0, tl - 4, X(13), 8, 0, 0, Math.PI);
    c.fill();
    c.stroke();
  }
  if (O.torso === "coat") {
    c.fillStyle = one(d.glove);
    c.fillRect(-3, tl, 6, -tl);
    if (!white)
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(X(10), tl + 18 + i * 16, 3, 0, Math.PI * 2);
        c.arc(X(-10), tl + 18 + i * 16, 3, 0, Math.PI * 2);
        c.fill();
      }
    c.fillStyle = ts || tc;
    c.beginPath();
    c.moveTo(X(-16), tl - 6);
    c.lineTo(0, tl + 14);
    c.lineTo(X(16), tl - 6);
    c.lineTo(X(11), tl - 14);
    c.lineTo(X(-11), tl - 14);
    c.closePath();
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.stroke();
  }
  c.restore();
  // belt / waistband
  {
    const bc =
      O.torso === "jacket"
        ? "#1d1526"
        : O.torso === "tank" || O.torso === "vest"
          ? "#2a2018"
          : O.torso === "bare"
            ? d.gi
            : d.glove;
    c.fillStyle = one(bc);
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath();
    c.rect(X(-24), -8, X(48), 13);
    c.fill();
    c.stroke();
    if (O.torso === "jacket") {
      c.beginPath();
      c.moveTo(-5, 0);
      c.lineTo(-15, 30);
      c.lineTo(-7, 32);
      c.lineTo(2, 3);
      c.moveTo(3, 0);
      c.lineTo(11, 28);
      c.lineTo(18, 26);
      c.lineTo(9, 0);
      c.fill();
      c.stroke();
      c.beginPath();
      c.rect(-6, -7, 12, 11);
      c.fill();
      c.stroke();
    } else if (O.torso === "bare") {
      c.fillStyle = one(d.glove);
      c.fillRect(X(-24) + 2, -4, X(48) - 4, 4);
    } else {
      c.fillStyle = one("#d8c27a");
      c.fillRect(-6, -7, 12, 11);
      c.strokeRect(-6, -7, 12, 11);
    }
  }
  c.restore();
  drawLeg(L0, false);
  const head = T(sn * 4, -LEN.torso - 32);
  drawHead(c, d, head[0] + 3, head[1] - 2, 0.8 / Math.sqrt(Bd.h), frame, white);
  drawArm(A0, false);
  const dF = K(shF, along(shF, A0.e, 0.3), 32, 28, 2);
  ink(c, [[dF, ...tn(clothTop && O.torso !== "suit" ? d.gi : d.skin, false)]]);
  if (O.torso === "coat") {
    c.fillStyle = one(d.glove);
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(shF[0], shF[1] - 6, 19 * bw, 8, lean, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  c.restore();
}
function drawHead(c, d, x, y, s, frame = 0, white = false) {
  const rx = 36 * s,
    ry = 42 * s;
  c.save();
  c.translate(x, y);
  c.fillStyle = "#140b20";
  c.beginPath();
  c.ellipse(0, 0, rx + 4 * s, ry + 4 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.beginPath();
  c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  c.clip();
  if (d.faceImg) {
    c.drawImage(d.faceImg, -rx, -ry, rx * 2, ry * 2);
  } else {
    c.fillStyle = d.skin;
    c.fillRect(-rx, -ry, rx * 2, ry * 2);
    c.fillStyle = "#00000044";
    c.font = `${30 * s}px Bungee, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("?", 0, 0);
  }
  if (white) {
    c.fillStyle = "#ffffffcc";
    c.fillRect(-rx, -ry, rx * 2, ry * 2);
  }
  if (d.band) {
    c.fillStyle = d.glove;
    c.fillRect(-rx, -ry * 0.62, rx * 2, ry * 0.2);
    c.fillStyle = "#00000033";
    c.fillRect(-rx, -ry * 0.62 + ry * 0.15, rx * 2, ry * 0.05);
  }
  c.restore();
  if (d.band) {
    const w = Math.sin(frame * 0.2);
    c.strokeStyle = "#140b20";
    c.lineWidth = 11 * s;
    c.lineCap = "round";
    const tail = (dy, ph) => {
      c.beginPath();
      c.moveTo(-rx * 0.9, -ry * 0.52);
      c.quadraticCurveTo(-rx * 1.5, -ry * 0.5 + dy + w * 6 * s * ph, -rx * 2.1, -ry * 0.3 + dy + w * 10 * s * ph);
      c.stroke();
    };
    tail(0, 1);
    tail(10 * s, -1);
    c.strokeStyle = d.glove;
    c.lineWidth = 6 * s;
    tail(0, 1);
    tail(10 * s, -1);
  }
  c.restore();
}
function drawHeadAt(c, d, x, y, s, flip = 1) {
  c.save();
  c.translate(x, y);
  c.scale(flip, 1);
  drawHead(c, d, 0, 0, s);
  c.restore();
}
function drawPart(c, p) {
  if (p.k === "text") {
    c.globalAlpha = Math.min(1, p.life / 12);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "30px Bungee, Impact, sans-serif";
    c.lineJoin = "round";
    c.lineWidth = 8;
    c.strokeStyle = "#120a18";
    c.strokeText(p.txt, p.x, p.y);
    c.fillStyle = p.c;
    c.fillText(p.txt, p.x, p.y);
    c.globalAlpha = 1;
    return;
  }
  const a = Math.max(0, p.life / p.max);
  c.globalAlpha = a;
  if (p.k === "spark") {
    c.strokeStyle = p.c;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
    c.stroke();
  } else if (p.k === "ring") {
    c.strokeStyle = p.c;
    c.lineWidth = 4 * a + 1;
    c.beginPath();
    c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    c.stroke();
  } else if (p.k === "dust") {
    c.fillStyle = p.c;
    c.beginPath();
    c.arc(p.x, p.y, p.r * (1.5 - a * 0.5), 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}
