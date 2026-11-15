// Prueba rápida: carga el juego en Chromium sin ventana, juega combates CPU vs CPU,
// recorre el modo arcade y abre el editor. Sale con código 1 si hay errores.
//   node tools/smoke.js
const path = require("path");
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  console.error("Falta Playwright: npm i -D playwright && npx playwright install chromium");
  process.exit(2);
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
  await page.goto("file://" + path.join(__dirname, "..", "index.html"));
  await page.waitForTimeout(800);

  // 1. Combates completos CPU vs CPU con todos los luchadores de serie
  const results = await page.evaluate(() => {
    const out = [];
    for (let k = 0; k < BUILTIN.length; k++) {
      const c = makeCanvas(960, 540);
      let ended = null;
      const m = new Match({
        canvas: c,
        defs: [BUILTIN[k], BUILTIN[(k + 1) % BUILTIN.length]],
        ctrl: [makeAI(2), makeAI(1)],
        onEnd: (w) => (ended = w),
      });
      let i = 0;
      for (; i < 60 * 60 * 8 && ended === null; i++) {
        m.step();
        if (i % 11 === 0) m.render();
      }
      out.push({ a: BUILTIN[k].id, frames: i, ended, packBytes: JSON.stringify(m.pack()).length });
    }
    return out;
  });
  for (const r of results) {
    const ok = r.ended !== null && r.packBytes < 3500;
    console.log(`${ok ? "ok  " : "FAIL"} combate ${r.a}: ${r.frames} frames, ganador ${r.ended}, estado online ${r.packBytes} B`);
    if (!ok) errors.push("combate sin terminar o estado online demasiado grande: " + r.a);
  }

  // 2. Modo arcade: VS -> combate -> victoria -> siguiente rival
  await page.click("#goArcade");
  await page.click("#fightBtn");
  await page.waitForTimeout(3600);
  const inFight = await page.evaluate(() => !!active && !scene);
  console.log(`${inFight ? "ok  " : "FAIL"} arcade: pantalla VS y comienzo del combate`);
  if (!inFight) errors.push("el arcade no llegó al combate");
  await page.evaluate(() => {
    active.phase = "fight";
    active.wins = [1, 0];
    active.f[1].hp = 1;
    active.resolveHit(active.f[0], active.f[1], MOVES.sk, false, 500, 300, 1);
  });
  await page.waitForTimeout(6000);
  const btns = await page.evaluate(() => [...document.querySelectorAll("#endBtns button")].map((b) => b.textContent));
  const winOk = btns.includes("Siguiente rival") || btns.includes("Ver el final");
  console.log(`${winOk ? "ok  " : "FAIL"} arcade: pantalla de victoria (${btns.join(", ")})`);
  if (!winOk) errors.push("no apareció la pantalla de victoria del arcade");

  // 3. Editor
  await page.evaluate(() => {
    leaveFight();
    openEditor(null);
  });
  await page.waitForTimeout(300);
  console.log("ok   editor abierto");

  await browser.close();
  if (errors.length) {
    console.error("\nERRORES:\n" + errors.join("\n"));
    process.exit(1);
  }
  console.log("\nTodo bien.");
})();
