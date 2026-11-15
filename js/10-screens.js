let screen = "home",
  active = null,
  mode = null,
  paused = false,
  demo = null;
const $ = (id) => document.getElementById(id);
function show(s) {
  screen = s;
  for (const el of document.querySelectorAll(".screen[id^=scr-]")) el.hidden = el.id !== "scr-" + s;
  if (s !== "fight") {
    paused = false;
  }
  if (s === "home" && !demo) startDemo();
  if (s === "select" || s === "roster") refreshCards();
  scrollTo({ top: 0 });
}
document.querySelectorAll("[data-go]").forEach((b) =>
  b.addEventListener("click", () => {
    SFX.play("ui");
    show(b.dataset.go);
  }),
);
$("logo").addEventListener("click", () => {
  leaveFight();
  show("home");
});
$("logo").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    leaveFight();
    show("home");
  }
});
$("soundBtn").addEventListener("click", () => {
  SFX.on = !SFX.on;
  $("soundBtn").textContent = "Sonido: " + (SFX.on ? "sí" : "no");
  $("soundBtn").setAttribute("aria-pressed", SFX.on);
  if (SFX.on) {
    SFX.init();
    SFX.play("ui");
  } else {
    MUSIC.stop();
    try {
      speechSynthesis.cancel();
    } catch (e) {}
  }
});
document.addEventListener("pointerdown", () => SFX.init(), { once: false, capture: true });

function startDemo() {
  const N = BUILTIN.length,
    a = BUILTIN[(Math.random() * N) | 0];
  let b = BUILTIN[(Math.random() * N) | 0];
  if (b === a) b = BUILTIN[(BUILTIN.indexOf(a) + 1) % N];
  demo = new Match({
    canvas: $("demo"),
    defs: [a, b],
    demo: true,
    ctrl: [makeAI(2), makeAI(1)],
    onEnd: () => {
      setTimeout(() => {
        demo = null;
        if (screen === "home") startDemo();
      }, 1500);
    },
  });
  demo.phase = "fight";
}

// ---- select
let selMode = "cpu",
  pick = [null, null],
  selSlot = 0;
function portrait(cv, d) {
  const c = cv.getContext("2d");
  c.clearRect(0, 0, cv.width, cv.height);
  if (!d) return;
  const s = cv.width / 128;
  c.fillStyle = d.gi;
  c.beginPath();
  c.arc(64 * s, 64 * s, 62 * s, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#00000033";
  c.beginPath();
  c.arc(64 * s, 64 * s, 62 * s, 0, Math.PI * 2);
  c.fill();
  drawHead(c, d, 64 * s, 66 * s, 1.25 * s);
}
function cardEl(d, opts = {}) {
  const b = document.createElement("button");
  b.className = "card";
  b.type = "button";
  const cv = makeCanvas(128, 128);
  portrait(cv, d);
  b.appendChild(cv);
  const n = document.createElement("div");
  n.className = "nm";
  n.textContent = d.name;
  n.style.color = d.gi === "#ece8f7" ? "#fff" : shadeColor(d.gi, 0.35);
  b.appendChild(n);
  if (opts.tag) {
    const t = document.createElement("div");
    t.className = "tag";
    t.textContent = opts.tag;
    b.appendChild(t);
  }
  return b;
}
function refreshCards() {
  if (screen === "select") {
    const g = $("selCards");
    g.replaceChildren();
    for (const d of ROSTER) {
      const b = cardEl(d, { tag: d.builtin ? "De serie" : "Personalizado" });
      if (pick[0] === d.id) b.classList.add("p1");
      if (pick[1] === d.id) b.classList.add("p2");
      if (pick[0] === d.id) {
        const s = document.createElement("span");
        s.className = "badge b1";
        s.textContent = "J1";
        b.appendChild(s);
      }
      if (pick[1] === d.id) {
        const s = document.createElement("span");
        s.className = "badge b2";
        s.textContent = selMode === "cpu" ? "CPU" : "J2";
        b.appendChild(s);
      }
      b.addEventListener("click", () => {
        SFX.play("ui");
        pick[selSlot] = d.id;
        if (selSlot === 0 && selMode !== "arcade") selSlot = 1;
        updSlots();
        refreshCards();
      });
      g.appendChild(b);
    }
    updSlots();
  }
  if (screen === "roster") {
    const g = $("rosterCards");
    g.replaceChildren();
    const add = document.createElement("button");
    add.className = "card add";
    add.type = "button";
    add.innerHTML = '<b>+</b><span class="nm">Nuevo luchador</span><span class="tag">Con tu foto</span>';
    add.addEventListener("click", () => openEditor(null));
    g.appendChild(add);
    for (const d of ROSTER) {
      const b = cardEl(d, {
        tag: d.builtin ? "De serie" : d.src === "db" ? "Compartido con la sala" : "Solo en este navegador",
      });
      b.addEventListener("click", () => (d.builtin ? openEditor(null, d) : openEditor(d)));
      g.appendChild(b);
    }
  }
  if (screen === "online") renderLobby();
}
function updSlots() {
  [0, 1].forEach((i) => {
    const el = $("slot" + (i + 1)),
      d = pick[i] ? byId(pick[i]) : null;
    portrait(el.querySelector("canvas"), d);
    el.querySelector(".nm").textContent = d ? d.name : "Elige…";
    el.querySelector(".ttl").textContent = d ? d.title || "" : "";
    el.classList.toggle("active", selSlot === i);
  });
}
$("slot1").addEventListener("click", () => {
  selSlot = 0;
  updSlots();
});
$("slot2").addEventListener("click", () => {
  selSlot = 1;
  updSlots();
});
function openSelect(m) {
  selMode = m;
  pick = [null, null];
  selSlot = 0;
  $("slot2who").textContent = m === "cpu" ? "CPU" : "Jugador 2";
  $("diffWrap").hidden = m !== "cpu";
  $("slot2").hidden = $("vsX").hidden = m === "arcade";
  $("fightBtn").textContent = m === "arcade" ? "¡Empezar!" : "¡A pelear!";
  $("selTitle").textContent =
    m === "arcade"
      ? "Modo arcade: elige tu luchador"
      : m === "cpu"
        ? "Combate libre: elige luchadores"
        : "2 jugadores: elige luchadores";
  show("select");
}
$("goCpu").addEventListener("click", () => {
  SFX.play("ui");
  openSelect("cpu");
});
$("goArcade").addEventListener("click", () => {
  SFX.play("ui");
  openSelect("arcade");
});
$("gfxBtn").addEventListener("click", () => {
  PIXEL = !PIXEL;
  $("gfxBtn").textContent = "Gráficos: " + (PIXEL ? "píxel" : "HD");
});
$("game").addEventListener("click", skipScene);
$("goLocal").addEventListener("click", () => {
  SFX.play("ui");
  openSelect("local");
});
$("goRoster").addEventListener("click", () => {
  SFX.play("ui");
  show("roster");
});
$("randBtn").addEventListener("click", () => {
  const r = () => ROSTER[(Math.random() * ROSTER.length) | 0].id;
  if (selMode === "arcade") pick = [r(), null];
  else {
    pick = [pick[0] || r(), r()];
    selSlot = 1;
  }
  refreshCards();
});
$("fightBtn").addEventListener("click", () => {
  SFX.init();
  const r = () => ROSTER[(Math.random() * ROSTER.length) | 0].id;
  if (!pick[0]) pick[0] = r();
  if (selMode === "arcade") return startArcade(byId(pick[0]));
  if (!pick[1]) pick[1] = r();
  const lvl = +$("diff").value;
  const defs = [byId(pick[0]), byId(pick[1])];
  if (selMode === "cpu") startFight("cpu", defs, [p1Local, makeAI(lvl)], ["TÚ", "CPU"]);
  else
    startFight(
      "local",
      defs,
      [() => orIn(fromKeys(KEYS1), touchIn, padIn(0)), () => orIn(fromKeys(KEYS2), padIn(1))],
      ["J1", "J2"],
    );
});

// ---- fight
// En local, cada combate va precedido de una pantalla de VS. Online empieza directo.
function startFight(m, defs, ctrl, labels, extra = {}) {
  mode = m;
  paused = false;
  scene = null;
  $("endBtns").hidden = true;
  $("endBtns").replaceChildren();
  const stage = defs[1].stage || "bar";
  const begin = () => {
    active = new Match({
      canvas: $("game"),
      defs,
      ctrl,
      labels,
      stage,
      remote: m === "guest",
      onEnd: (w) => onMatchEnd(w),
    });
    MUSIC.start(Object.keys(STAGES).indexOf(stage));
  };
  $("fightHint").textContent =
    m === "local"
      ? "J1: WASD + F G H · J2: flechas + K L Ñ · Esc pausa"
      : m === "guest" || m === "host"
        ? "Online · WASD o flechas + F G H / K L Ñ"
        : "WASD o flechas · F G H o K L Ñ · Esc pausa";
  $("pauseBtn").hidden = m === "host" || m === "guest";
  if (m === "host" || m === "guest") begin();
  else {
    active = null;
    MUSIC.stop();
    SFX.play("round");
    say(defs[0].name + " contra " + defs[1].name);
    runScene("vs", { defs, stage, label: extra.vsLabel || "" }, 190, begin);
    lastFight = { m, defs, ctrl, labels, extra };
  }
  show("fight");
}
let lastFight = null;
function endButtons(list) {
  const box = $("endBtns");
  box.replaceChildren();
  for (const [t, fn, pri] of list) {
    const b = document.createElement("button");
    b.textContent = t;
    if (pri) b.className = "primary";
    b.addEventListener("click", fn);
    box.appendChild(b);
  }
  box.hidden = false;
}
const toMenu = () => {
  leaveFight();
  show("home");
};
function onMatchEnd(w) {
  if (mode === "host" || mode === "guest") {
    setTimeout(() => {
      if (mode === "host") net.backToLobby();
    }, 5000);
    return;
  }
  const m = active;
  setTimeout(() => {
    if (active !== m || !m) return;
    MUSIC.stop();
    const winner = w >= 0 ? m.f[w].def : null,
      loser = w >= 0 ? m.f[1 - w].def : null;
    const rematch = () => startFight(lastFight.m, lastFight.defs, lastFight.ctrl, lastFight.labels, lastFight.extra);
    if (mode === "arcade") {
      if (w === 0) {
        const last = arcade.i === arcade.queue.length - 1;
        say("Gana " + winner.name);
        runScene("win", { winner, loser });
        endButtons([
          last
            ? [
                "Ver el final",
                () => {
                  $("endBtns").hidden = true;
                  say("¡Leyenda del barrio!");
                  runScene("ending", { winner, count: arcade.queue.length });
                  endButtons([["Volver al menú", toMenu, true]]);
                },
                true,
              ]
            : [
                "Siguiente rival",
                () => {
                  arcade.i++;
                  arcadeFight();
                },
                true,
              ],
          ["Menú", toMenu],
        ]);
      } else {
        say("¿Continuar?");
        runScene("continue", { winner, loser: arcade.me }, 600, toMenu);
        endButtons([
          [
            "Continuar",
            () => {
              arcade.continues++;
              arcadeFight();
            },
            true,
          ],
          ["Rendirse", toMenu],
        ]);
      }
      return;
    }
    if (winner) say("Gana " + winner.name);
    runScene("win", { winner, loser });
    endButtons([
      ["Revancha", rematch, true],
      ["Cambiar luchadores", () => openSelect(mode)],
      ["Menú", toMenu],
    ]);
  }, 1600);
}
function togglePause() {
  if (!active || scene || mode === "host" || mode === "guest" || active.phase === "end") return;
  paused = !paused;
  if (paused)
    endButtons([
      ["Continuar", () => togglePause(), true],
      [
        "Salir al menú",
        () => {
          leaveFight();
          show("home");
        },
      ],
    ]);
  else $("endBtns").hidden = true;
}
$("pauseBtn").addEventListener("click", togglePause);
function leaveFight() {
  if (mode === "host" || mode === "guest") net.leave();
  active = null;
  mode = null;
  paused = false;
  scene = null;
  MUSIC.stop();
  $("endBtns").hidden = true;
}
const coarse = matchMedia("(pointer:coarse)").matches;
let touchOn = coarse;
function updTouch() {
  $("touch").classList.toggle("on", touchOn);
  $("touchBtn").textContent = touchOn ? "Ocultar controles táctiles" : "Controles táctiles";
}
$("touchBtn").addEventListener("click", () => {
  touchOn = !touchOn;
  updTouch();
});
updTouch();
