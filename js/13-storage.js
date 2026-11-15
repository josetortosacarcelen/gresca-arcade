let db = null;
const LS = "gresca.fighters.v1";
function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS) || "[]");
  } catch (e) {
    return [];
  }
}
function writeLocal(a) {
  try {
    localStorage.setItem(LS, JSON.stringify(a));
    return true;
  } catch (e) {
    return false;
  }
}
let localList = readLocal().map((r) => sanitizeDef("l_" + r.key, r, "local"));
let dbList = [];
function mergeCustoms() {
  customs = [...dbList, ...localList];
  rebuildRoster();
}
mergeCustoms();
async function saveFighter(existing, body) {
  if ((existing && existing.src === "local") || (!existing && !db)) {
    const arr = readLocal();
    const key = existing ? existing.id.slice(2) : Date.now().toString(36);
    const i = arr.findIndex((r) => r.key === key);
    const row = { key, ...body };
    if (i >= 0) arr[i] = row;
    else arr.push(row);
    if (!writeLocal(arr)) throw new Error("el navegador no permite guardar");
    localList = arr.map((r) => sanitizeDef("l_" + r.key, r, "local"));
    mergeCustoms();
    return;
  }
  const id = existing ? existing.id.slice(2) : "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await db.collection("fighters").doc(id).set(body);
}
async function deleteFighter(def) {
  if (def.src === "local") {
    const arr = readLocal().filter((r) => "l_" + r.key !== def.id);
    writeLocal(arr);
    localList = arr.map((r) => sanitizeDef("l_" + r.key, r, "local"));
    mergeCustoms();
    return;
  }
  await db.collection("fighters").doc(def.id.slice(2)).delete();
}
(async () => {
  const C = window.claude;
  if (!C || !C.use) {
    $("rosterNote").textContent =
      "Sube una foto de frente y el juego la convierte en una cara de luchador estilo arcade. En esta vista los luchadores se guardan solo en este navegador.";
    return;
  }
  try {
    db = await C.use("db");
  } catch (e) {
    db = null;
  }
  if (!db) {
    $("rosterNote").textContent =
      "Sube una foto de frente y el juego la convierte en una cara de luchador estilo arcade. En esta vista los luchadores se guardan solo en este navegador.";
    return;
  }
  $("rosterNote").textContent =
    "Sube una foto de frente y el juego la convierte en una cara de luchador estilo arcade. Los luchadores que guardes aquí los verán todos tus amigos.";
  const cache = new Map();
  db.collection("fighters").onSnapshot(
    (snap) => {
      dbList = snap.docs.map((d) => {
        const raw = d.data() || {};
        const key = d.id + ":" + raw.updated;
        if (cache.has(key)) return cache.get(key);
        const def = sanitizeDef("c_" + d.id, raw, "db");
        cache.set(key, def);
        return def;
      });
      mergeCustoms();
    },
    () => {},
  );
})();
