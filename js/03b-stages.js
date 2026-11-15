// Escenarios y pintado en baja resolución (look 16 bits).
// Cada luchador tiene su escenario: se pelea "en casa" del rival (jugador 2).
const STAGES = {
  bar: { name: "Calle del Bar", crowd: "#0e0718" },
  playa: { name: "El Chiringuito", crowd: "#5b3a22" },
  plaza: { name: "Plaza en Fiestas", crowd: "#1a0f1f" },
  azotea: { name: "La Azotea", crowd: null },
};
let STAGECACHE = {};
let PIXEL = true;
const LOW = makeCanvas(W / 2, H / 2),
  LOWX = LOW.getContext("2d");
// Pinta con fn(ctx). En modo píxel dibuja a media resolución y amplía sin suavizar.
function paint(out, fn) {
  if (!PIXEL) {
    out.imageSmoothingEnabled = true;
    fn(out);
    return;
  }
  LOWX.save();
  LOWX.setTransform(0.5, 0, 0, 0.5, 0, 0);
  LOWX.clearRect(0, 0, W, H);
  fn(LOWX);
  LOWX.restore();
  out.imageSmoothingEnabled = false;
  out.drawImage(LOW, 0, 0, W, H);
}
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
function buildStagePlaya() {
  const c = makeCanvas(W, H),
    x = c.getContext("2d"),
    r = seeded(11);
  const sky = x.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, "#2aa7ee");
  sky.addColorStop(1, "#bfeaff");
  x.fillStyle = sky;
  x.fillRect(0, 0, W, 330);
  // sun
  x.fillStyle = "#fff6c2";
  x.beginPath();
  x.arc(790, 90, 54, 0, 7);
  x.fill();
  x.fillStyle = "#ffffff55";
  x.beginPath();
  x.arc(790, 90, 80, 0, 7);
  x.fill();
  // clouds
  x.fillStyle = "#ffffffdd";
  for (const [cx, cy, s] of [
    [140, 80, 1],
    [430, 50, 0.7],
    [620, 130, 0.9],
  ]) {
    for (let i = 0; i < 5; i++) {
      x.beginPath();
      x.ellipse(cx + i * 26 * s, cy + (i % 2) * 8, 34 * s, 20 * s, 0, 0, 7);
      x.fill();
    }
  }
  // sea
  const sea = x.createLinearGradient(0, 300, 0, 420);
  sea.addColorStop(0, "#0d6fb8");
  sea.addColorStop(1, "#35c3d6");
  x.fillStyle = sea;
  x.fillRect(0, 300, W, 130);
  // island
  x.fillStyle = "#2f7d5b";
  x.beginPath();
  x.ellipse(560, 302, 120, 26, 0, Math.PI, 0);
  x.fill();
  // sand
  const sand = x.createLinearGradient(0, 410, 0, H);
  sand.addColorStop(0, "#f3d9a0");
  sand.addColorStop(1, "#d9a760");
  x.fillStyle = sand;
  x.fillRect(0, 410, W, H - 410);
  x.fillStyle = "#c9955244";
  for (let i = 0; i < 90; i++) x.fillRect(r() * W, 420 + r() * 110, 10 + r() * 14, 3);
  // chiringuito
  x.fillStyle = "#8a5a2b";
  x.fillRect(40, 260, 250, 170);
  x.fillStyle = "#6b4320";
  for (let i = 0; i < 9; i++) x.fillRect(40 + i * 28, 260, 4, 170);
  x.fillStyle = "#2b1a10";
  x.fillRect(70, 300, 190, 70);
  x.fillStyle = "#d9b24a";
  x.beginPath();
  x.moveTo(10, 268);
  x.lineTo(165, 180);
  x.lineTo(320, 268);
  x.closePath();
  x.fill();
  x.strokeStyle = "#a8812c";
  x.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    x.beginPath();
    x.moveTo(165, 182);
    x.lineTo(20 + i * 26, 268);
    x.stroke();
  }
  x.fillStyle = "#fff3d0";
  x.fillRect(80, 276, 170, 22);
  x.fillStyle = "#c2372b";
  x.font = "16px Bungee, Impact, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("CHIRINGUITO", 165, 288);
  // bottles on the bar
  for (let i = 0; i < 7; i++) {
    x.fillStyle = ["#3fae5a", "#d9b24a", "#c2372b"][i % 3];
    x.fillRect(84 + i * 25, 340, 8, 26);
    x.fillRect(86 + i * 25, 332, 4, 10);
  }
  // palm
  x.strokeStyle = "#7a4f28";
  x.lineWidth = 18;
  x.lineCap = "round";
  x.beginPath();
  x.moveTo(850, 440);
  x.quadraticCurveTo(820, 300, 870, 190);
  x.stroke();
  x.strokeStyle = "#2f9a4f";
  x.lineWidth = 14;
  for (const [dx, dy] of [
    [-110, 30],
    [-80, -40],
    [0, -70],
    [70, -40],
    [100, 30],
    [-40, 60],
    [50, 60],
  ]) {
    x.beginPath();
    x.moveTo(870, 190);
    x.quadraticCurveTo(870 + dx * 0.5, 190 + dy - 30, 870 + dx, 190 + dy);
    x.stroke();
  }
  // parasols
  for (const [px, col] of [
    [440, "#e8443a"],
    [640, "#f2b632"],
  ]) {
    x.strokeStyle = "#f5f5f5";
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(px, 330);
    x.lineTo(px, 440);
    x.stroke();
    for (let i = 0; i < 6; i++) {
      x.fillStyle = i % 2 ? "#ffffff" : col;
      x.beginPath();
      x.moveTo(px, 318);
      x.arc(px, 350, 70, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
      x.closePath();
      x.fill();
    }
  }
  x.fillStyle = "#ffffff33";
  x.fillRect(0, GROUND, W, 3);
  return c;
}
function buildStagePlaza() {
  const c = makeCanvas(W, H),
    x = c.getContext("2d"),
    r = seeded(23);
  const sky = x.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#161033");
  sky.addColorStop(0.6, "#5a2a6b");
  sky.addColorStop(1, "#e2733f");
  x.fillStyle = sky;
  x.fillRect(0, 0, W, GROUND);
  x.fillStyle = "#ffffffcc";
  for (let i = 0; i < 60; i++) x.fillRect(r() * W, r() * 220, 2, 2);
  // church
  x.fillStyle = "#cdb892";
  x.fillRect(400, 170, 160, 300);
  x.fillStyle = "#b39a70";
  x.fillRect(400, 170, 40, 300);
  x.fillStyle = "#cdb892";
  x.fillRect(450, 70, 60, 110);
  x.fillStyle = "#8a3a2a";
  x.beginPath();
  x.moveTo(440, 72);
  x.lineTo(480, 20);
  x.lineTo(520, 72);
  x.closePath();
  x.fill();
  x.fillStyle = "#2a1a22";
  x.beginPath();
  x.arc(480, 125, 16, Math.PI, 0);
  x.rect(464, 125, 32, 26);
  x.fill();
  x.fillStyle = "#d9b24a";
  x.beginPath();
  x.arc(480, 138, 9, 0, 7);
  x.fill();
  x.fillStyle = "#3b2418";
  x.beginPath();
  x.arc(480, 400, 30, Math.PI, 0);
  x.rect(450, 400, 60, 78);
  x.fill();
  x.fillStyle = "#f6e9a8";
  x.beginPath();
  x.arc(480, 250, 22, 0, 7);
  x.fill();
  // houses
  let hx = -20;
  const cols = ["#f1ead9", "#e8c98a", "#f1ead9", "#d9a66a", "#efe2c4"];
  let i = 0;
  while (hx < W) {
    const w = 110 + r() * 60,
      h = 170 + r() * 70;
    if (hx + w < 395 || hx > 565) {
      x.fillStyle = cols[i % cols.length];
      x.fillRect(hx, GROUND - h, w, h);
      x.fillStyle = "#00000022";
      x.fillRect(hx, GROUND - h, 14, h);
      x.fillStyle = "#a8472f";
      x.fillRect(hx - 6, GROUND - h - 16, w + 12, 18);
      for (let wy = GROUND - h + 26; wy < GROUND - 70; wy += 62)
        for (let wx = hx + 20; wx < hx + w - 34; wx += 46) {
          x.fillStyle = r() < 0.6 ? "#ffd27a" : "#2a2238";
          x.fillRect(wx, wy, 24, 34);
          x.fillStyle = "#3f7a4a";
          x.fillRect(wx - 3, wy + 34, 30, 5);
          x.fillStyle = "#d9463f";
          x.fillRect(wx + 2, wy + 28, 6, 6);
          x.fillRect(wx + 14, wy + 28, 6, 6);
        }
      x.fillStyle = "#4a2d1c";
      x.fillRect(hx + w / 2 - 14, GROUND - 56, 28, 56);
    }
    hx += w + 4;
    i++;
  }
  // cobblestones
  const st = x.createLinearGradient(0, GROUND, 0, H);
  st.addColorStop(0, "#6f6577");
  st.addColorStop(1, "#2c2536");
  x.fillStyle = st;
  x.fillRect(0, GROUND, W, H - GROUND);
  x.strokeStyle = "#00000033";
  x.lineWidth = 2;
  for (let y = GROUND + 12; y < H; y += 14)
    for (let sx = (y % 28 ? 0 : 20) - 20; sx < W; sx += 40) {
      x.strokeRect(sx, y, 40, 14);
    }
  x.fillStyle = "#ffffff22";
  x.fillRect(0, GROUND, W, 3);
  return c;
}
function buildStageAzotea() {
  const c = makeCanvas(W, H),
    x = c.getContext("2d"),
    r = seeded(5);
  const sky = x.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, "#3a4fa8");
  sky.addColorStop(0.55, "#f08a8a");
  sky.addColorStop(1, "#ffd9a0");
  x.fillStyle = sky;
  x.fillRect(0, 0, W, 420);
  x.fillStyle = "#fff1c9";
  x.beginPath();
  x.arc(250, 380, 70, 0, 7);
  x.fill();
  x.fillStyle = "#ffffff99";
  for (const [cx, cy] of [
    [600, 110],
    [120, 160],
    [820, 200],
  ])
    for (let i = 0; i < 4; i++) {
      x.beginPath();
      x.ellipse(cx + i * 30, cy + (i % 2) * 6, 40, 14, 0, 0, 7);
      x.fill();
    }
  // skyline
  for (const [col, base, hmin, hvar] of [
    ["#8a6f9e", 400, 60, 120],
    ["#5a4775", 410, 40, 90],
  ]) {
    let bx = -10;
    while (bx < W) {
      const w = 40 + r() * 70,
        h = hmin + r() * hvar;
      x.fillStyle = col;
      x.fillRect(bx, base - h, w, h + 40);
      x.fillStyle = "#ffe9a866";
      for (let wy = base - h + 10; wy < base - 10; wy += 18)
        for (let wx = bx + 8; wx < bx + w - 10; wx += 16) if (r() < 0.3) x.fillRect(wx, wy, 7, 9);
      bx += w + 3;
    }
  }
  // parapet
  x.fillStyle = "#b9a58f";
  x.fillRect(0, 392, W, 86);
  x.fillStyle = "#d8c8b2";
  x.fillRect(0, 384, W, 14);
  x.fillStyle = "#00000022";
  for (let i = 0; i < W; i += 64) x.fillRect(i, 398, 2, 80);
  // water tank + antenna + ac units
  x.fillStyle = "#4b3f5a";
  x.fillRect(96, 300, 8, 92);
  x.fillRect(176, 300, 8, 92);
  x.fillStyle = "#7a8aa0";
  x.fillRect(80, 220, 120, 86);
  x.fillStyle = "#5d6c80";
  x.fillRect(80, 220, 24, 86);
  x.fillStyle = "#93a3b8";
  x.beginPath();
  x.ellipse(140, 220, 60, 12, 0, 0, 7);
  x.fill();
  x.strokeStyle = "#2a2238";
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(830, 392);
  x.lineTo(830, 190);
  for (let k = 0; k < 4; k++) {
    x.moveTo(800 + k * 4, 210 + k * 22);
    x.lineTo(860 - k * 4, 210 + k * 22);
  }
  x.stroke();
  x.fillStyle = "#cfd6de";
  x.fillRect(640, 340, 90, 52);
  x.fillStyle = "#8f99a6";
  x.beginPath();
  x.arc(685, 366, 18, 0, 7);
  x.fill();
  // tiles
  const fl = x.createLinearGradient(0, GROUND, 0, H);
  fl.addColorStop(0, "#c7694a");
  fl.addColorStop(1, "#7a3a2c");
  x.fillStyle = fl;
  x.fillRect(0, GROUND, W, H - GROUND);
  x.strokeStyle = "#00000030";
  x.lineWidth = 2;
  for (let k = -20; k <= 20; k++) {
    x.beginPath();
    x.moveTo(W / 2 + k * 40, GROUND);
    x.lineTo(W / 2 + k * 120, H);
    x.stroke();
  }
  for (const y of [GROUND + 14, GROUND + 34]) {
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(W, y);
    x.stroke();
  }
  x.fillStyle = "#ffffff33";
  x.fillRect(0, GROUND, W, 3);
  return c;
}
function drawCrowd(c, frame, col) {
  c.fillStyle = col;
  c.strokeStyle = col;
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
      c.stroke();
    }
  }
}
function drawStage(c, frame, id = "bar") {
  if (id === "bar" || !STAGES[id]) return drawStageBar(c, frame);
  if (!STAGECACHE[id])
    STAGECACHE[id] = id === "playa" ? buildStagePlaya() : id === "plaza" ? buildStagePlaza() : buildStageAzotea();
  c.drawImage(STAGECACHE[id], 0, 0);
  if (id === "playa") {
    c.strokeStyle = "#ffffffaa";
    c.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const y = 316 + i * 18,
        off = Math.sin(frame * 0.04 + i) * 30;
      c.beginPath();
      for (let sx = -60; sx < W + 60; sx += 120) {
        c.moveTo(sx + off + i * 37, y);
        c.lineTo(sx + off + i * 37 + 50, y);
      }
      c.stroke();
    }
    c.fillStyle = "#ffffffcc";
    c.fillRect(0, 406 + Math.sin(frame * 0.05) * 3, W, 5);
    drawCrowd(c, frame, STAGES.playa.crowd);
  }
  if (id === "plaza") {
    const cols = ["#e8443a", "#f2b632", "#3fae5a", "#41a8e3", "#f5f5f5"];
    for (const [y0, sag] of [
      [60, 50],
      [110, 60],
    ]) {
      c.strokeStyle = "#1a0f1f";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, y0);
      c.quadraticCurveTo(W / 2, y0 + sag * 2, W, y0);
      c.stroke();
      for (let i = 1; i < 32; i++) {
        const t = i / 32,
          px = t * W,
          py = y0 + sag * 2 * 2 * t * (1 - t) + 0,
          sw = Math.sin(frame * 0.08 + i) * 2;
        c.fillStyle = cols[(i + (y0 > 80 ? 2 : 0)) % cols.length];
        c.beginPath();
        c.moveTo(px - 9, py);
        c.lineTo(px + 9, py);
        c.lineTo(px + sw, py + 20);
        c.closePath();
        c.fill();
      }
    }
    for (let i = 0; i < 24; i++) {
      const t = (i + 0.5) / 24,
        px = t * W,
        py = 150 + 80 * 2 * t * (1 - t),
        on = (i + Math.floor(frame / 20)) % 3 !== 0;
      c.fillStyle = on ? "#ffe48a" : "#6b5a3a";
      c.shadowColor = on ? "#ffd23f" : "transparent";
      c.shadowBlur = on ? 12 : 0;
      c.beginPath();
      c.arc(px, py, 5, 0, 7);
      c.fill();
    }
    c.shadowBlur = 0;
    drawCrowd(c, frame, STAGES.plaza.crowd);
  }
  if (id === "azotea") {
    // clothesline
    c.strokeStyle = "#2a2238";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(300, 250);
    c.quadraticCurveTo(450, 275, 600, 250);
    c.stroke();
    const cl = ["#f5f5f5", "#e8443a", "#41a8e3", "#f2b632", "#f5f5f5"];
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5,
        px = 300 + t * 300,
        py = 250 + 50 * t * (1 - t),
        sw = Math.sin(frame * 0.05 + i * 1.3) * 5;
      c.fillStyle = cl[i];
      c.beginPath();
      c.moveTo(px - 18, py);
      c.lineTo(px + 18, py);
      c.lineTo(px + 16 + sw, py + (i % 2 ? 60 : 44));
      c.lineTo(px - 16 + sw, py + (i % 2 ? 60 : 44));
      c.closePath();
      c.fill();
    }
    // birds
    c.strokeStyle = "#2a2238";
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const bx = ((frame * (0.6 + i * 0.2) + i * 300) % (W + 100)) - 50,
        by = 90 + i * 34 + Math.sin(frame * 0.05 + i) * 8,
        fl = Math.sin(frame * 0.3 + i) * 6;
      c.beginPath();
      c.moveTo(bx - 10, by - fl);
      c.lineTo(bx, by);
      c.lineTo(bx + 10, by - fl);
      c.stroke();
    }
  }
}
