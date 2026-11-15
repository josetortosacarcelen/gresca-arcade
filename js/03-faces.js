function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
// procedural cartoon face for built-in fighters (160x192)
function drawCartoonFace(o) {
  const c = makeCanvas(160, 192),
    x = c.getContext("2d");
  x.fillStyle = o.skin;
  x.fillRect(0, 0, 160, 192);
  const shade = shadeColor(o.skin, -0.22);
  // jaw shading
  x.fillStyle = shade;
  x.beginPath();
  x.ellipse(80, 190, 80, 40, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = o.skin;
  x.beginPath();
  x.ellipse(80, 100, 70, 82, 0, 0, Math.PI * 2);
  x.fill();
  // hair
  x.fillStyle = o.hair;
  if (o.hairStyle === "short") {
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(160, 0);
    x.lineTo(160, 70);
    x.quadraticCurveTo(130, 30, 90, 48);
    x.quadraticCurveTo(50, 30, 20, 62);
    x.lineTo(0, 90);
    x.closePath();
    x.fill();
  }
  if (o.hairStyle === "spiky") {
    x.beginPath();
    x.moveTo(0, 90);
    for (let i = 0; i <= 8; i++) {
      x.lineTo(i * 20, i % 2 ? 6 : 44);
    }
    x.lineTo(160, 90);
    x.lineTo(160, 0);
    x.lineTo(0, 0);
    x.closePath();
    x.fill();
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(160, 0);
    x.lineTo(160, 60);
    x.lineTo(0, 60);
    x.fill();
    x.beginPath();
    x.moveTo(10, 60);
    for (let i = 0; i <= 7; i++) {
      x.lineTo(10 + i * 20, i % 2 ? 78 : 52);
    }
    x.lineTo(150, 40);
    x.lineTo(10, 40);
    x.fill();
  }
  if (o.hairStyle === "long") {
    x.beginPath();
    x.moveTo(0, 192);
    x.lineTo(0, 0);
    x.lineTo(160, 0);
    x.lineTo(160, 192);
    x.lineTo(140, 192);
    x.quadraticCurveTo(150, 60, 95, 50);
    x.quadraticCurveTo(60, 70, 22, 62);
    x.quadraticCurveTo(10, 120, 22, 192);
    x.closePath();
    x.fill();
  }
  if (o.hairStyle === "bald") {
    x.fillStyle = shadeColor(o.skin, 0.12);
    x.beginPath();
    x.ellipse(60, 28, 26, 10, -0.3, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = o.hair;
  }
  if (o.beard) {
    x.fillStyle = o.hair;
    x.beginPath();
    x.moveTo(30, 120);
    x.quadraticCurveTo(40, 190, 80, 192);
    x.quadraticCurveTo(120, 190, 130, 120);
    x.quadraticCurveTo(122, 150, 80, 150);
    x.quadraticCurveTo(38, 150, 30, 120);
    x.fill();
  }
  // brows
  x.strokeStyle = "#1b1020";
  x.lineCap = "round";
  x.lineWidth = 9;
  x.beginPath();
  x.moveTo(36, 78);
  x.lineTo(70, 90);
  x.moveTo(124, 78);
  x.lineTo(90, 90);
  x.stroke();
  // eyes
  x.fillStyle = "#fff";
  x.lineWidth = 3;
  for (const ex of [56, 104]) {
    x.beginPath();
    x.ellipse(ex, 104, 13, 8, 0, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    x.fillStyle = "#1b1020";
    x.beginPath();
    x.arc(ex + (ex < 80 ? 4 : -4), 105, 4.5, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#fff";
  }
  // nose
  x.strokeStyle = shadeColor(o.skin, -0.4);
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(80, 108);
  x.lineTo(74, 132);
  x.lineTo(84, 134);
  x.stroke();
  // mouth (gritted teeth)
  x.fillStyle = "#fff";
  x.strokeStyle = "#1b1020";
  x.lineWidth = 4;
  x.beginPath();
  x.roundRect ? x.roundRect(58, 148, 44, 14, 4) : x.rect(58, 148, 44, 14);
  x.fill();
  x.stroke();
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(58, 155);
  x.lineTo(102, 155);
  for (let i = 1; i < 4; i++) {
    x.moveTo(58 + i * 11, 148);
    x.lineTo(58 + i * 11, 162);
  }
  x.stroke();
  // ears
  return c;
}
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
}
function shadeColor(h, a) {
  const [r, g, b] = hexToRgb(h);
  return a < 0
    ? rgbToHex(r * (1 + a), g * (1 + a), b * (1 + a))
    : rgbToHex(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a);
}

// Arcade stylisation of a raw 160x192 face crop
function stylize(raw, style) {
  const w = raw.width,
    h = raw.height,
    out = makeCanvas(w, h),
    o = out.getContext("2d");
  if (style === "orig") {
    o.drawImage(raw, 0, 0);
    return out;
  }
  if (style === "pixel") {
    const s = makeCanvas(40, 48),
      sx = s.getContext("2d");
    sx.imageSmoothingEnabled = true;
    sx.drawImage(raw, 0, 0, 40, 48);
    const id = sx.getImageData(0, 0, 40, 48),
      d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      let [r, g, b] = [d[i], d[i + 1], d[i + 2]];
      const l = (r + g + b) / 3;
      r = l + (r - l) * 1.35;
      g = l + (g - l) * 1.35;
      b = l + (b - l) * 1.35;
      d[i] = Math.round(clamp(r, 0, 255) / 42) * 42;
      d[i + 1] = Math.round(clamp(g, 0, 255) / 42) * 42;
      d[i + 2] = Math.round(clamp(b, 0, 255) / 42) * 42;
    }
    sx.putImageData(id, 0, 0);
    o.imageSmoothingEnabled = false;
    o.drawImage(s, 0, 0, w, h);
    return out;
  }
  // comic / cel-shade
  const rx = raw.getContext("2d"),
    src = rx.getImageData(0, 0, w, h).data;
  const blur = new Float32Array(w * h * 3);
  // two-pass box blur radius 2 (smooths skin before banding)
  const tmp = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s0 = 0,
        s1 = 0,
        s2 = 0,
        n = 0;
      for (let k = -2; k <= 2; k++) {
        const xx = clamp(x + k, 0, w - 1),
          j = (y * w + xx) * 4;
        s0 += src[j];
        s1 += src[j + 1];
        s2 += src[j + 2];
        n++;
      }
      const q = (y * w + x) * 3;
      tmp[q] = s0 / n;
      tmp[q + 1] = s1 / n;
      tmp[q + 2] = s2 / n;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s0 = 0,
        s1 = 0,
        s2 = 0,
        n = 0;
      for (let k = -2; k <= 2; k++) {
        const yy = clamp(y + k, 0, h - 1),
          j = (yy * w + x) * 3;
        s0 += tmp[j];
        s1 += tmp[j + 1];
        s2 += tmp[j + 2];
        n++;
      }
      const q = (y * w + x) * 3;
      blur[q] = s0 / n;
      blur[q + 1] = s1 / n;
      blur[q + 2] = s2 / n;
    }
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = 0.299 * blur[i * 3] + 0.587 * blur[i * 3 + 1] + 0.114 * blur[i * 3 + 2];
  const img = o.createImageData(w, h),
    d = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let r = blur[i * 3] / 255,
        g = blur[i * 3 + 1] / 255,
        b = blur[i * 3 + 2] / 255;
      // rgb->hsv
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b),
        dl = mx - mn;
      let hh = 0;
      if (dl > 0) {
        if (mx === r) hh = ((g - b) / dl) % 6;
        else if (mx === g) hh = (b - r) / dl + 2;
        else hh = (r - g) / dl + 4;
      }
      hh *= 60;
      if (hh < 0) hh += 360;
      let s = mx ? dl / mx : 0,
        v = mx;
      s = Math.min(1, s * 1.3 + 0.04);
      v = Math.min(1, Math.pow(v, 0.92) * 1.08);
      const bands = [0.2, 0.42, 0.64, 0.84, 1];
      let vq = bands[bands.length - 1];
      for (const bnd of bands) {
        if (v <= bnd + 0.06) {
          vq = bnd;
          break;
        }
      }
      v = vq;
      // hsv->rgb
      const C = v * s,
        X = C * (1 - Math.abs(((hh / 60) % 2) - 1)),
        m = v - C;
      let rr = 0,
        gg = 0,
        bb = 0;
      if (hh < 60) {
        rr = C;
        gg = X;
      } else if (hh < 120) {
        rr = X;
        gg = C;
      } else if (hh < 180) {
        gg = C;
        bb = X;
      } else if (hh < 240) {
        gg = X;
        bb = C;
      } else if (hh < 300) {
        rr = X;
        bb = C;
      } else {
        rr = C;
        bb = X;
      }
      rr += m;
      gg += m;
      bb += m;
      // sobel edges -> ink
      const at = (xx, yy) => L[clamp(yy, 0, h - 1) * w + clamp(xx, 0, w - 1)];
      const gx =
        -at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1) +
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1);
      const mag = Math.sqrt(gx * gx + gy * gy);
      const ink = clamp((mag - 70) / 90, 0, 0.9);
      const j = i * 4;
      d[j] = mix(rr * 255, 26, ink);
      d[j + 1] = mix(gg * 255, 14, ink);
      d[j + 2] = mix(bb * 255, 34, ink);
      d[j + 3] = 255;
    }
  o.putImageData(img, 0, 0);
  // warm arcade grade
  o.globalCompositeOperation = "soft-light";
  o.fillStyle = "#ff9a5a";
  o.globalAlpha = 0.25;
  o.fillRect(0, 0, w, h);
  o.globalCompositeOperation = "source-over";
  o.globalAlpha = 1;
  return out;
}
