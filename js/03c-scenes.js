// Pantallas entre combates (VS, victoria, continuar, final), modo arcade, locutor y proyectiles con tema.
let scene = null; // {kind, t, data, dur, after}
function runScene(kind, data, dur, after) {
  scene = { kind, t: 0, data, dur, after };
}
function skipScene() {
  if (scene && scene.dur && scene.t > 30) scene.t = scene.dur;
}
function tickScene() {
  if (!scene) return;
  scene.t++;
  if (scene.dur && scene.t >= scene.dur) {
    const s = scene;
    scene = null;
    if (s.after) s.after();
  }
}
// ---- locutor (voz del navegador, si está disponible)
function say(text) {
  if (!SFX.on) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 1.05;
    u.pitch = 0.6;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}
// ---- proyectiles
const PROJ = {
  energia: "Bola de energía",
  chancla: "Chancla",
  cana: "Jarra de cerveza",
  balon: "Balón",
  jamon: "Jamón",
  movil: "Móvil",
};
function drawProj(c, p, frame, def) {
  const type = def && PROJ[def.proj] ? def.proj : "energia",
    col = (def && def.energy) || p.c || "#41e3ff",
    r = p.big ? 40 : 22;
  c.save();
  c.translate(p.x, p.y);
  for (let i = 1; i <= 5; i++) {
    c.globalAlpha = (0.12 * (6 - i)) / 5;
    c.fillStyle = col;
    c.beginPath();
    c.arc(-p.dir * i * 14, Math.sin(frame * 0.5 + i) * 3, r * (1 - i * 0.12), 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  if (type === "energia") {
    const g = c.createRadialGradient(0, 0, 2, 0, 0, r * 1.5);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, col);
    g.addColorStop(1, col + "00");
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#ffffffcc";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, r * 0.7, frame * 0.3, frame * 0.3 + Math.PI * 1.2);
    c.stroke();
    c.restore();
    return;
  }
  const s = r / 22;
  c.scale(s * p.dir, s);
  if (type !== "cana") c.rotate(frame * 0.35);
  else c.rotate(Math.sin(frame * 0.3) * 0.25);
  c.lineJoin = "round";
  c.strokeStyle = "#120a18";
  c.lineWidth = 4;
  if (type === "chancla") {
    c.fillStyle = (def && def.glove) || "#e8443a";
    c.beginPath();
    c.ellipse(0, 0, 26, 12, 0, 0, 7);
    c.fill();
    c.stroke();
    c.strokeStyle = "#120a18";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(14, 0);
    c.lineTo(-2, -9);
    c.moveTo(14, 0);
    c.lineTo(-2, 9);
    c.stroke();
  } else if (type === "cana") {
    c.fillStyle = "#f2b632";
    c.beginPath();
    c.rect(-14, -16, 26, 36);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(14, 2, 10, -1.3, 1.3);
    c.stroke();
    c.fillStyle = "#fffdf2";
    c.beginPath();
    c.ellipse(-1, -18, 17, 9, 0, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#ffffff88";
    c.fillRect(-9, -8, 5, 22);
  } else if (type === "balon") {
    c.fillStyle = "#f8f8f8";
    c.beginPath();
    c.arc(0, 0, 20, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#120a18";
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      c.beginPath();
      c.arc(Math.cos(a) * 13, Math.sin(a) * 13, 5, 0, 7);
      c.fill();
    }
    c.beginPath();
    c.arc(0, 0, 6, 0, 7);
    c.fill();
  } else if (type === "jamon") {
    c.strokeStyle = "#f3ead8";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(10, 0);
    c.lineTo(34, 0);
    c.stroke();
    c.strokeStyle = "#120a18";
    c.lineWidth = 4;
    c.fillStyle = "#b5443a";
    c.beginPath();
    c.ellipse(-6, 0, 24, 15, 0, 0, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#f0c9a0";
    c.beginPath();
    c.ellipse(-12, -3, 10, 6, 0, 0, 7);
    c.fill();
    c.fillStyle = "#1a1210";
    c.fillRect(30, -5, 8, 10);
  } else if (type === "movil") {
    c.fillStyle = "#1d1a26";
    c.beginPath();
    c.rect(-13, -22, 26, 44);
    c.fill();
    c.stroke();
    c.fillStyle = col;
    c.fillRect(-9, -17, 18, 30);
    c.fillStyle = "#ffffffaa";
    c.fillRect(-6, -13, 12, 3);
    c.fillRect(-6, -7, 8, 3);
  }
  c.restore();
}
// ---- retratos grandes
function drawBeaten(c, s) {
  const rx = 36 * s,
    ry = 42 * s;
  c.fillStyle = "#5a2a8acc";
  c.beginPath();
  c.ellipse(-rx * 0.4, -ry * 0.1, rx * 0.3, ry * 0.2, 0, 0, 7);
  c.fill();
  c.fillStyle = "#b03a4a88";
  c.beginPath();
  c.ellipse(rx * 0.45, ry * 0.35, rx * 0.28, ry * 0.2, 0, 0, 7);
  c.fill();
  c.save();
  c.translate(rx * 0.35, -ry * 0.5);
  c.rotate(-0.5);
  c.fillStyle = "#f0d2a8";
  c.strokeStyle = "#120a18";
  c.lineWidth = Math.max(2, s);
  c.fillRect(-rx * 0.3, -ry * 0.07, rx * 0.6, ry * 0.14);
  c.strokeRect(-rx * 0.3, -ry * 0.07, rx * 0.6, ry * 0.14);
  c.restore();
  c.fillStyle = "#e86a6a";
  c.strokeStyle = "#120a18";
  c.lineWidth = Math.max(2, s * 1.2);
  c.beginPath();
  c.arc(-rx * 0.2, -ry * 1.02, rx * 0.22, 0, 7);
  c.fill();
  c.stroke();
}
function bigHead(c, d, x, y, s, flip = 1, beaten = false, tilt = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.scale(flip, 1);
  // hombros
  const O = OUTFITS[d.outfit] || OUTFITS.gi,
    bare = O.torso === "bare" || O.torso === "tank" || O.torso === "vest";
  c.fillStyle = "#120a18";
  c.beginPath();
  c.ellipse(0, 78 * s, 82 * s, 44 * s, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = bare ? d.skin : d.gi;
  c.beginPath();
  c.ellipse(0, 78 * s, 77 * s, 40 * s, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = shadeColor(bare ? d.skin : d.gi, -0.3);
  c.beginPath();
  c.ellipse(-30 * s, 78 * s, 47 * s, 40 * s, 0, Math.PI, Math.PI * 1.5);
  c.lineTo(-30 * s, 78 * s);
  c.fill();
  c.fillStyle = shadeColor(d.skin, -0.25);
  c.fillRect(-13 * s, 30 * s, 26 * s, 22 * s);
  drawHead(c, d, 0, 0, s);
  if (beaten) drawBeaten(c, s);
  c.restore();
}
function wrapText(c, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    if (c.measureText(line + w).width > maxW && line) {
      c.fillText(line.trim(), x, y);
      y += lh;
      line = "";
    }
    line += w + " ";
  }
  c.fillText(line.trim(), x, y);
}
function outlined(c, t, x, y, size, fill, lw = 8) {
  c.font = size + "px Bungee, Impact, sans-serif";
  c.lineJoin = "round";
  c.lineWidth = lw;
  c.strokeStyle = "#120a18";
  c.strokeText(t, x, y);
  c.fillStyle = fill;
  c.fillText(t, x, y);
}
function drawScene(c) {
  const s = scene,
    t = s.t,
    D = s.data;
  c.textAlign = "center";
  c.textBaseline = "middle";
  if (s.kind === "vs") {
    const [a, b] = D.defs,
      k = Math.min(1, t / 22),
      e = 1 - Math.pow(1 - k, 3);
    c.fillStyle = shadeColor(a.gi, -0.45);
    c.fillRect(0, 0, W, H);
    c.fillStyle = shadeColor(b.gi, -0.45);
    c.beginPath();
    c.moveTo(W / 2 + 90, 0);
    c.lineTo(W, 0);
    c.lineTo(W, H);
    c.lineTo(W / 2 - 90, H);
    c.closePath();
    c.fill();
    // speed lines
    c.strokeStyle = "#ffffff14";
    c.lineWidth = 6;
    for (let i = 0; i < 14; i++) {
      const y = ((i * 53 + t * 9) % (H + 80)) - 40;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y - 60);
      c.stroke();
    }
    bigHead(c, a, mix(-200, 235, e), 215, 3.1, 1);
    bigHead(c, b, mix(W + 200, W - 235, e), 215, 3.1, -1);
    c.fillStyle = "#120a18ee";
    c.fillRect(0, 392, W, 148);
    c.fillStyle = "#ffc93c";
    c.fillRect(0, 388, W, 5);
    outlined(c, a.name.toUpperCase(), 235, 428, 40, "#fff");
    outlined(c, b.name.toUpperCase(), W - 235, 428, 40, "#fff");
    c.font = "600 17px 'Chakra Petch', sans-serif";
    c.fillStyle = "#ffc93c";
    c.fillText(a.title || "", 235, 464);
    c.fillText(b.title || "", W - 235, 464);
    c.fillStyle = "#ffffffaa";
    c.font = "14px Bungee, Impact, sans-serif";
    c.fillText("ESCENARIO · " + (STAGES[D.stage] || STAGES.bar).name.toUpperCase(), W / 2, 512);
    if (D.label) {
      outlined(c, D.label, W / 2, 40, 22, "#ffc93c", 6);
    }
    if (t > 16) {
      const z = 1 + Math.max(0, 1 - (t - 16) / 10) * 1.6,
        sh = t < 40 ? rnd(-3, 3) : 0;
      c.save();
      c.translate(W / 2 + sh, 215 + sh);
      c.scale(z, z);
      outlined(c, "VS", 0, 0, 130, "#ff5a36", 16);
      c.restore();
    }
    if (t < 8) {
      c.fillStyle = `rgba(255,255,255,${1 - t / 8})`;
      c.fillRect(0, 0, W, H);
    }
  }
  if (s.kind === "win" || s.kind === "continue" || s.kind === "ending") {
    const win = D.winner,
      lose = D.loser,
      col = win ? win.gi : "#3a2366";
    c.fillStyle = shadeColor(col, -0.6);
    c.fillRect(0, 0, W, H);
    c.save();
    c.translate(s.kind === "win" ? 250 : W / 2, 240);
    c.rotate(t * 0.004);
    c.fillStyle = shadeColor(col, -0.4);
    for (let i = 0; i < 12; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, 1000, (i * Math.PI) / 6, (i * Math.PI) / 6 + Math.PI / 12);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  if (s.kind === "win") {
    const win = D.winner,
      lose = D.loser;
    if (!win) {
      outlined(c, "EMPATE", W / 2, 200, 90, "#ffc93c", 14);
      return;
    }
    bigHead(c, lose, 735, 250, 2.1, -1, true, 0.18 + Math.sin(t * 0.05) * 0.04);
    bigHead(c, win, 250, 215 - Math.abs(Math.sin(t * 0.08)) * 8, 3.2, 1);
    outlined(c, "GANA " + win.name.toUpperCase(), W / 2, 44, 46, "#ffc93c", 10);
    c.font = "600 18px 'Chakra Petch', sans-serif";
    c.fillStyle = "#ffffffcc";
    c.fillText(lose.name + " ha quedado así", 735, 366);
    // bocadillo
    c.fillStyle = "#120a18f2";
    c.strokeStyle = "#ffc93c";
    c.lineWidth = 4;
    c.beginPath();
    c.rect(40, 388, W - 80, 92);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(210, 390);
    c.lineTo(240, 360);
    c.lineTo(270, 390);
    c.fillStyle = "#120a18";
    c.fill();
    c.stroke();
    c.fillStyle = "#120a18";
    c.fillRect(213, 389, 54, 6);
    const q = "«" + (win.quote || "¡Otro día más, otra victoria más!") + "»";
    c.font = "600 24px 'Chakra Petch', sans-serif";
    c.fillStyle = "#fff";
    c.textAlign = "left";
    wrapText(c, q.slice(0, Math.floor(t / 1.5)), 66, 420, W - 132, 32);
  }
  if (s.kind === "continue") {
    const n = Math.max(0, 9 - Math.floor(t / 60));
    bigHead(c, D.winner ? D.loser : D.loser, W / 2, 190, 2.4, 1, true, Math.sin(t * 0.06) * 0.08);
    outlined(c, "¿CONTINUAR?", W / 2, 60, 56, "#ffc93c", 12);
    const z = 1 + (1 - (t % 60) / 60) * 0.25;
    c.save();
    c.translate(W / 2, 440);
    c.scale(z, z);
    outlined(c, String(n), 0, 0, 110, "#ff5a36", 14);
    c.restore();
  }
  if (s.kind === "ending") {
    const me = D.winner;
    for (let i = 0; i < 70; i++) {
      const px = (i * 137.5) % W,
        py = ((i * 71 + t * (2 + (i % 5))) % (H + 40)) - 20;
      c.fillStyle = ["#e8443a", "#f2b632", "#3fae5a", "#41a8e3", "#f5f5f5"][i % 5];
      c.save();
      c.translate(px + Math.sin(t * 0.05 + i) * 12, py);
      c.rotate(t * 0.1 + i);
      c.fillRect(-6, -3, 12, 6);
      c.restore();
    }
    const by = 235 - Math.abs(Math.sin(t * 0.08)) * 10;
    bigHead(c, me, W / 2, by, 3, 1);
    // corona
    c.fillStyle = "#ffc93c";
    c.strokeStyle = "#120a18";
    c.lineWidth = 6;
    c.lineJoin = "round";
    c.beginPath();
    const cy = by - 130;
    c.moveTo(W / 2 - 80, cy);
    c.lineTo(W / 2 - 92, cy - 70);
    c.lineTo(W / 2 - 44, cy - 34);
    c.lineTo(W / 2, cy - 88);
    c.lineTo(W / 2 + 44, cy - 34);
    c.lineTo(W / 2 + 92, cy - 70);
    c.lineTo(W / 2 + 80, cy);
    c.closePath();
    c.fill();
    c.stroke();
    outlined(c, "¡" + me.name.toUpperCase() + ", LEYENDA DEL BARRIO!", W / 2, 420, 34, "#ffc93c", 9);
    c.font = "600 20px 'Chakra Petch', sans-serif";
    c.fillStyle = "#fff";
    c.fillText("Has tumbado a " + D.count + " rivales seguidos. Nadie te tose en la plaza.", W / 2, 466);
  }
}
// ---- modo arcade: una escalera de rivales, cada vez más duros
const arcade = { me: null, queue: [], i: 0, continues: 0 };
function startArcade(def) {
  const others = ROSTER.filter((d) => d.id !== def.id);
  for (let i = others.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [others[i], others[j]] = [others[j], others[i]];
  }
  const q = others.slice(0, 7);
  const bi = q.findIndex((d) => d.build === "heavy");
  if (bi >= 0) q.push(q.splice(bi, 1)[0]); // el jefe final es un corpulento
  arcade.me = def;
  arcade.queue = q;
  arcade.i = 0;
  arcade.continues = 0;
  arcadeFight();
}
function arcadeFight() {
  const n = arcade.queue.length,
    i = arcade.i,
    opp = arcade.queue[i],
    last = i === n - 1;
  const lvl = i < 2 ? 0 : i < n - 2 ? 1 : 2;
  startFight("arcade", [arcade.me, opp], [p1Local, makeAI(lvl)], ["TÚ", last ? "JEFE FINAL" : "RIVAL " + (i + 1)], {
    vsLabel: last ? "COMBATE FINAL" : "COMBATE " + (i + 1) + " DE " + n,
  });
}
