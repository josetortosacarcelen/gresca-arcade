const ed = { img: null, zoom: 1, ox: 0, oy: 0, style: "comic", face: null, editing: null };
const cropC = $("crop"),
  cropX = cropC.getContext("2d");
function openEditor(def, template) {
  ed.editing = def;
  ed.img = null;
  ed.zoom = 1;
  ed.ox = 0;
  ed.oy = 0;
  ed.style = "comic";
  ed.face = def && def.faceImg ? def.faceImg : null;
  const base = def || template;
  $("edTitle").textContent = def ? "Editar luchador" : "Nuevo luchador";
  $("edName").value = def ? def.name : "";
  $("cGi").value = base ? base.gi : "#e6e1f5";
  $("cGlove").value = base ? base.glove : "#e8323a";
  $("cEnergy").value = base ? base.energy : "#41e3ff";
  $("cSkin").value = base ? base.skin : "#e3a97f";
  $("edBand").checked = base ? base.band : true;
  $("edOutfit").value = (base && base.outfit) || "gi";
  $("edBuild").value = (base && base.build) || "normal";
  $("edNick").value = def ? def.title || "" : "";
  $("edQuote").value = def ? def.quote || "" : "";
  $("edSpecial").value = def ? def.special || "" : "";
  $("edProj").value = (base && base.proj) || "energia";
  $("edStage").value = (base && base.stage) || "bar";
  $("zoom").value = 1;
  $("edErr").hidden = true;
  $("edDelete").hidden = !def;
  setStyleBtns();
  drawCrop();
  show("editor");
}
function setStyleBtns() {
  document
    .querySelectorAll("#styleSeg button")
    .forEach((b) => b.setAttribute("aria-pressed", b.dataset.s === ed.style));
}
document.querySelectorAll("#styleSeg button").forEach((b) =>
  b.addEventListener("click", () => {
    ed.style = b.dataset.s;
    setStyleBtns();
    regenFace();
  }),
);
function drawCropTo(ctx, w, h) {
  const im = ed.img;
  if (!im) return;
  const base = Math.max(w / im.width, h / im.height) * ed.zoom;
  const s = base * (w / 240);
  ctx.save();
  ctx.fillStyle = "#120d24";
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2 + ed.ox * (w / 240), h / 2 + ed.oy * (w / 240));
  ctx.drawImage(
    im,
    ((-im.width * base * (w / 240)) / 2) * 1,
    (-im.height * base * (w / 240)) / 2,
    im.width * base * (w / 240),
    im.height * base * (w / 240),
  );
  ctx.restore();
}
function drawCrop() {
  const c = cropX;
  c.fillStyle = "#120d24";
  c.fillRect(0, 0, 240, 288);
  $("dropHint").hidden = !!ed.img;
  if (ed.img) {
    drawCropTo(c, 240, 288);
    c.save();
    c.fillStyle = "#0e0a1caa";
    c.beginPath();
    c.rect(0, 0, 240, 288);
    c.ellipse(120, 144, 112, 136, 0, 0, Math.PI * 2, true);
    c.fill("evenodd");
    c.strokeStyle = "#ffc93c";
    c.lineWidth = 3;
    c.setLineDash([8, 6]);
    c.beginPath();
    c.ellipse(120, 144, 112, 136, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  } else if (ed.face) {
    c.drawImage(ed.face, 40, 48, 160, 192);
  }
}
let regenT = 0;
function regenFace() {
  clearTimeout(regenT);
  regenT = setTimeout(() => {
    if (!ed.img) return;
    const raw = makeCanvas(160, 192);
    const rx = raw.getContext("2d");
    // map the 240x288 crop ellipse (112x136 radii) onto the 160x192 face canvas
    const k = 160 / 224;
    rx.save();
    rx.translate(80, 96);
    rx.scale(k, k);
    rx.translate(-120, -144);
    drawCropTo(rx, 240, 288);
    rx.restore();
    ed.face = stylize(raw, ed.style);
  }, 60);
}
function sampleSkin() {
  const raw = makeCanvas(160, 192),
    rx = raw.getContext("2d");
  const k = 160 / 224;
  rx.save();
  rx.translate(80, 96);
  rx.scale(k, k);
  rx.translate(-120, -144);
  drawCropTo(rx, 240, 288);
  rx.restore();
  const d = rx.getImageData(45, 105, 70, 40).data;
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
    n++;
  }
  $("cSkin").value = rgbToHex(r / n, g / n, b / n);
}
function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showEdErr("Ese archivo no es una imagen. Prueba con una foto JPG o PNG.");
    return;
  }
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    ed.img = im;
    ed.zoom = 1;
    ed.ox = 0;
    ed.oy = 0;
    $("zoom").value = 1;
    drawCrop();
    regenFace();
    setTimeout(sampleSkin, 80);
    $("edErr").hidden = true;
  };
  im.onerror = () => showEdErr("No se pudo leer la foto. Prueba con otra imagen JPG o PNG.");
  im.src = url;
}
$("faceFile").addEventListener("change", (e) => loadFile(e.target.files[0]));
const cropBox = $("cropBox");
cropBox.addEventListener("dragover", (e) => e.preventDefault());
cropBox.addEventListener("drop", (e) => {
  e.preventDefault();
  loadFile(e.dataTransfer.files[0]);
});
let drag = null;
cropBox.addEventListener("pointerdown", (e) => {
  if (!ed.img) {
    $("faceFile").click();
    return;
  }
  drag = { x: e.clientX, y: e.clientY, ox: ed.ox, oy: ed.oy };
  cropBox.setPointerCapture(e.pointerId);
});
cropBox.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const sc = 240 / cropBox.clientWidth;
  ed.ox = drag.ox + (e.clientX - drag.x) * sc;
  ed.oy = drag.oy + (e.clientY - drag.y) * sc;
  drawCrop();
  regenFace();
});
cropBox.addEventListener("pointerup", () => (drag = null));
cropBox.addEventListener("pointercancel", () => (drag = null));
cropBox.addEventListener(
  "wheel",
  (e) => {
    if (!ed.img) return;
    e.preventDefault();
    ed.zoom = clamp(ed.zoom * (e.deltaY < 0 ? 1.06 : 0.94), 0.3, 4);
    $("zoom").value = ed.zoom;
    drawCrop();
    regenFace();
  },
  { passive: false },
);
$("zoom").addEventListener("input", (e) => {
  ed.zoom = +e.target.value;
  drawCrop();
  regenFace();
});
function edDef() {
  return {
    name: $("edName").value.trim() || "Sin nombre",
    gi: $("cGi").value,
    glove: $("cGlove").value,
    energy: $("cEnergy").value,
    skin: $("cSkin").value,
    band: $("edBand").checked,
    outfit: $("edOutfit").value,
    build: $("edBuild").value,
    title: $("edNick").value.trim(),
    quote: $("edQuote").value.trim(),
    special: $("edSpecial").value.trim().toUpperCase(),
    proj: $("edProj").value,
    stage: $("edStage").value,
    faceImg: ed.face,
  };
}
const pv = { f: null };
function drawEdPreview(ts) {
  const cv = $("edPreview"),
    c = cv.getContext("2d");
  const d = edDef();
  if (!pv.f) pv.f = new Fighter(d, 0);
  const f = pv.f;
  f.def = d;
  f.x = W / 2;
  f.y = GROUND;
  f.facing = 1;
  const t = Math.floor(ts / 16.67);
  const cyc = t % 240;
  f.vis = cyc < 150 ? "idle" : cyc < 180 ? "sp" : cyc < 210 ? "sk" : "fb";
  f.anim = cyc < 150 ? cyc : cyc < 180 ? cyc - 150 : cyc < 210 ? cyc - 180 : cyc - 210;
  c.fillStyle = "#120d24";
  c.fillRect(0, 0, 340, 340);
  const g = c.createRadialGradient(170, 200, 10, 170, 200, 200);
  g.addColorStop(0, "#3a2366");
  g.addColorStop(1, "#120d24");
  c.fillStyle = g;
  c.fillRect(0, 0, 340, 340);
  c.fillStyle = "#00000055";
  c.beginPath();
  c.ellipse(170, 320, 70, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.translate(170 - W / 2, 318 - GROUND);
  drawFighter(c, f, t);
  c.restore();
}
function showEdErr(t) {
  $("edErr").textContent = t;
  $("edErr").hidden = false;
}
$("edSave").addEventListener("click", async () => {
  const d = edDef();
  if (!$("edName").value.trim()) {
    showEdErr("Ponle un nombre al luchador.");
    $("edName").focus();
    return;
  }
  if (!ed.face) {
    showEdErr("Falta la foto. Pulsa «Elegir foto…» y sube una cara de frente.");
    return;
  }
  let face;
  try {
    const fc = makeCanvas(160, 192);
    fc.getContext("2d").drawImage(ed.face, 0, 0, 160, 192);
    face = fc.toDataURL("image/webp", 0.86);
    if (!face.startsWith("data:image/webp")) face = fc.toDataURL("image/jpeg", 0.88);
  } catch (e) {
    showEdErr("No se pudo procesar la foto. Prueba con otra imagen.");
    return;
  }
  const body = {
    name: d.name.slice(0, 14),
    gi: d.gi,
    glove: d.glove,
    energy: d.energy,
    skin: d.skin,
    band: d.band,
    outfit: d.outfit,
    build: d.build,
    title: d.title.slice(0, 28),
    quote: d.quote.slice(0, 80),
    special: d.special.slice(0, 14),
    proj: d.proj,
    stage: d.stage,
    face,
    updated: Date.now(),
  };
  $("edSave").disabled = true;
  try {
    await saveFighter(ed.editing, body);
    show("roster");
  } catch (e) {
    showEdErr("No se pudo guardar: " + (e && e.message ? e.message : "error desconocido") + ". Inténtalo otra vez.");
  }
  $("edSave").disabled = false;
});
let delArm = false;
$("edDelete").addEventListener("click", async () => {
  if (!ed.editing) return;
  if (!delArm) {
    delArm = true;
    $("edDelete").textContent = "¿Seguro? Pulsa otra vez";
    setTimeout(() => {
      delArm = false;
      $("edDelete").textContent = "Borrar";
    }, 3000);
    return;
  }
  delArm = false;
  $("edDelete").textContent = "Borrar";
  try {
    await deleteFighter(ed.editing);
    show("roster");
  } catch (e) {
    showEdErr("No se pudo borrar. Inténtalo otra vez.");
  }
});
