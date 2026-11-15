const keys = new Set();
const KEYS1 = { l: ["KeyA"], r: ["KeyD"], u: ["KeyW"], d: ["KeyS"], p: ["KeyF"], k: ["KeyG"], s: ["KeyH"] };
const KEYS2 = {
  l: ["ArrowLeft"],
  r: ["ArrowRight"],
  u: ["ArrowUp"],
  d: ["ArrowDown"],
  p: ["KeyK", "Numpad1"],
  k: ["KeyL", "Numpad2"],
  s: ["Semicolon", "Numpad3"],
};
const BTN = ["l", "r", "u", "d", "p", "k", "s"];
const fromKeys = (m) => {
  const o = {};
  for (const b of BTN) o[b] = m[b].some((k) => keys.has(k));
  return o;
};
const touchIn = {};
function padIn(i) {
  const gp = (navigator.getGamepads ? navigator.getGamepads() : [])[i];
  const o = {};
  if (!gp) return o;
  const B = (n) => gp.buttons[n] && gp.buttons[n].pressed;
  o.l = gp.axes[0] < -0.5 || B(14);
  o.r = gp.axes[0] > 0.5 || B(15);
  o.u = gp.axes[1] < -0.6 || B(12);
  o.d = gp.axes[1] > 0.6 || B(13);
  o.p = B(2) || B(3);
  o.k = B(0) || B(4);
  o.s = B(1) || B(5);
  return o;
}
const orIn = (...a) => {
  const o = {};
  for (const b of BTN) o[b] = a.some((x) => x && x[b]);
  return o;
};
const toBits = (o) => BTN.reduce((n, b, i) => n | (o[b] ? 1 << i : 0), 0);
const fromBits = (n) => {
  const o = {};
  BTN.forEach((b, i) => (o[b] = !!(n & (1 << i))));
  return o;
};
addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) return;
  keys.add(e.code);
  if (screen === "fight" && (e.code.startsWith("Arrow") || e.code === "Space")) e.preventDefault();
  if (screen === "fight" && scene && (e.code === "Enter" || e.code === "Space" || e.code === "KeyF")) skipScene();
  if (screen === "fight" && (e.code === "Escape" || e.code === "KeyP")) togglePause();
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
document.querySelectorAll("#touch button").forEach((b) => {
  const k = b.dataset.k;
  const on = (e) => {
    e.preventDefault();
    touchIn[k] = true;
    b.classList.add("on");
    SFX.init();
  };
  const off = (e) => {
    touchIn[k] = false;
    b.classList.remove("on");
  };
  b.addEventListener("pointerdown", on);
  b.addEventListener("pointerup", off);
  b.addEventListener("pointercancel", off);
  b.addEventListener("pointerleave", off);
  b.addEventListener("contextmenu", (e) => e.preventDefault());
});
const p1Local = () => orIn(fromKeys(KEYS1), fromKeys(KEYS2), touchIn, padIn(0));
