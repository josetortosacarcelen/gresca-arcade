const net = {
  room: null,
  nr: null,
  code: null,
  me: null,
  ready: false,
  fighter: null,
  lastM: null,
  hostSeen: false,
  inBits: -1,
  inT: 0,
  stT: 0,
  matchId: null,
  async init() {
    if (this.room !== null && this.room !== undefined) return this.room;
    const C = window.claude;
    try {
      this.room = C && C.use ? await C.use("room") : null;
    } catch (e) {
      this.room = null;
    }
    return this.room;
  },
  peersInGame() {
    if (!this.nr) return [];
    return this.nr
      .peers()
      .filter((p) => p.presence && p.presence.g)
      .slice()
      .sort((a, b) => (a.peer < b.peer ? -1 : a.peer > b.peer ? 1 : 0));
  },
  roles() {
    const ps = this.peersInGame();
    return { host: ps[0] || null, guest: ps[1] || null, spect: ps.slice(2), mine: ps.findIndex((p) => p.sameTab) };
  },
  async join(code) {
    const room = await this.init();
    if (!room) {
      $("onUnavailable").hidden = false;
      return;
    }
    try {
      this.nr = await room.join("gresca-" + code.toLowerCase());
    } catch (e) {
      onErr(
        e && e.code === "not_permitted"
          ? "No tienes permiso para salas online en este juego. Pide al creador que te invite."
          : "No se pudo entrar en la sala. Inténtalo de nuevo en unos segundos.",
      );
      return;
    }
    this.code = code;
    this.ready = false;
    this.fighter = this.fighter || ROSTER[0].id;
    await this.nr.presence({
      g: 1,
      nm: ($("nick").value.trim() || "Jugador").slice(0, 14),
      f: this.fighter,
      rdy: false,
      ph: "lobby",
    });
    this.nr.onPeers(() => this.onPeers());
    $("onJoin").hidden = true;
    $("onLobby").hidden = false;
    $("lobbyCode").textContent = code;
    renderLobby();
  },
  async leave() {
    const nr = this.nr;
    this.nr = null;
    this.code = null;
    if (nr) {
      try {
        await nr.leave();
      } catch (e) {}
    }
    $("onJoin").hidden = false;
    $("onLobby").hidden = true;
  },
  set(p) {
    if (this.nr) this.nr.presence(p).catch(() => {});
  },
  onPeers() {
    if (screen === "online") renderLobby();
    const R = this.roles();
    // guest/spectator follows host
    if (R.mine > 0 && R.host) {
      const hp = R.host.presence;
      if (hp.ph === "fight" && hp.m && hp.m !== this.lastM && screen !== "fight") {
        this.lastM = hp.m;
        this.startAsGuest(R);
      }
      if (hp.ph === "lobby" && screen === "fight" && mode === "guest") {
        this.toLobby();
      }
    }
    if (R.mine === 0 && mode === "host" && screen === "fight" && !R.guest) {
      this.backToLobby("Tu rival se ha ido.");
    }
    if (mode === "guest" && screen === "fight" && (!R.host || R.mine === 0)) {
      this.toLobby("El anfitrión se ha ido.");
    }
    // host auto-start
    if (
      R.mine === 0 &&
      R.guest &&
      screen === "online" &&
      R.host.presence.rdy &&
      R.guest.presence.rdy &&
      R.host.presence.ph !== "fight"
    )
      this.startAsHost(R);
  },
  startAsHost(R) {
    const m = "m" + Date.now().toString(36);
    this.matchId = m;
    const defs = [byId(R.host.presence.f), byId(R.guest.presence.f)];
    const guestPeer = R.guest.peer;
    this.set({ ph: "fight", m, f1: defs[0].id, f2: defs[1].id, s: null });
    startFight(
      "host",
      defs,
      [
        p1Local,
        () => {
          const g = this.nr && this.nr.peers().find((p) => p.peer === guestPeer);
          return g && typeof g.presence.in === "number" ? fromBits(g.presence.in) : {};
        },
      ],
      [nickOf(R.host), nickOf(R.guest)],
    );
  },
  startAsGuest(R) {
    const hp = R.host.presence;
    const defs = [byId(hp.f1), byId(hp.f2)];
    const amGuest = R.mine === 1;
    startFight("guest", defs, [null, null], [nickOf(R.host), R.guest ? nickOf(R.guest) : "J2"]);
    this.isPlayer = amGuest;
    this.inBits = -1;
  },
  hostTick() {
    this.stT++;
    if (this.stT % 2 === 0 && active) this.set({ s: active.pack() });
  },
  guestTick() {
    if (!this.nr) return;
    const R = this.roles();
    if (R.host && R.host.presence.s) active.apply(R.host.presence.s);
    if (this.isPlayer) {
      const b = toBits(p1Local());
      this.inT++;
      if (b !== this.inBits || this.inT % 15 === 0) {
        this.inBits = b;
        this.set({ in: b });
      }
    }
  },
  backToLobby(msg) {
    this.set({ ph: "lobby", rdy: false, s: null, m: null });
    this.ready = false;
    active = null;
    mode = null;
    show("online");
    $("onLobby").hidden = false;
    $("onJoin").hidden = true;
    renderLobby(msg);
  },
  toLobby(msg) {
    this.set({ rdy: false, in: 0 });
    this.ready = false;
    active = null;
    mode = null;
    show("online");
    renderLobby(msg);
  },
};
function nickOf(p) {
  return (p && p.presence && typeof p.presence.nm === "string" ? p.presence.nm : "Jugador").slice(0, 14);
}
function onErr(t) {
  $("onErr").textContent = t;
  $("onErr").hidden = false;
}
function renderLobby(msg) {
  if (!net.nr) return;
  const R = net.roles(),
    box = $("lobbyPlayers");
  box.replaceChildren();
  const ps = net.peersInGame();
  ps.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "pl";
    const cv = makeCanvas(104, 104);
    portrait(cv, byId(p.presence.f));
    el.appendChild(cv);
    const tx = document.createElement("div");
    tx.style.minWidth = "0";
    tx.style.flex = "1";
    const w = document.createElement("div");
    w.className = "who";
    w.textContent = (i === 0 ? "Jugador 1" : i === 1 ? "Jugador 2" : "Espectador") + (p.sameTab ? " · tú" : "");
    const n = document.createElement("div");
    n.className = "nm";
    n.textContent = nickOf(p) + " · " + byId(p.presence.f).name;
    tx.append(w, n);
    el.appendChild(tx);
    if (i < 2) {
      const pl = document.createElement("span");
      pl.className = "pill" + (p.presence.rdy ? " ok" : "");
      pl.textContent = p.presence.rdy ? "Listo" : "Eligiendo";
      el.appendChild(pl);
    }
    box.appendChild(el);
  });
  const g = $("lobbyCards");
  g.replaceChildren();
  for (const d of ROSTER) {
    const b = cardEl(d);
    if (net.fighter === d.id) b.classList.add("p1");
    b.addEventListener("click", () => {
      net.fighter = d.id;
      net.set({ f: d.id });
      SFX.play("ui");
      renderLobby();
    });
    g.appendChild(b);
  }
  const amPlayer = R.mine === 0 || R.mine === 1;
  $("readyBtn").hidden = !amPlayer;
  $("readyBtn").textContent = net.ready ? "Cancelar listo" : "Estoy listo";
  $("lobbyNote").textContent =
    msg ||
    (ps.length < 2
      ? "Esperando a otro jugador… Pásale el código de la sala."
      : !amPlayer
        ? "La sala está llena: verás el combate como espectador."
        : R.host.presence.rdy && R.guest.presence.rdy
          ? "¡Empieza el combate!"
          : "Cuando los dos pulséis «Estoy listo», empieza el combate.");
}
$("goOnline").addEventListener("click", async () => {
  SFX.play("ui");
  show("online");
  $("onErr").hidden = true;
  try {
    $("nick").value = $("nick").value || localStorage.getItem("gresca.nick") || "";
  } catch (e) {}
  const r = await net.init();
  $("onUnavailable").hidden = !!r;
  $("onJoin").hidden = !r || !!net.nr;
  $("onLobby").hidden = !net.nr;
  if (net.nr) renderLobby();
});
$("onBack").addEventListener("click", () => {
  net.leave();
  show("home");
});
function rememberNick() {
  try {
    localStorage.setItem("gresca.nick", $("nick").value.trim());
  } catch (e) {}
}
$("newRoom").addEventListener("click", () => {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 4; i++) c += A[(Math.random() * A.length) | 0];
  $("roomCode").value = c;
  rememberNick();
  net.join(c);
});
$("joinRoom").addEventListener("click", () => {
  const c = $("roomCode")
    .value.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (c.length < 3) {
    onErr("Escribe el código de la sala (4 letras) o crea una sala nueva.");
    return;
  }
  $("onErr").hidden = true;
  rememberNick();
  net.join(c);
});
$("leaveRoom").addEventListener("click", () => net.leave());
$("readyBtn").addEventListener("click", () => {
  net.ready = !net.ready;
  net.set({ rdy: net.ready, f: net.fighter });
  SFX.play("ui");
  renderLobby();
});
$("copyCode").addEventListener("click", () => {
  const t = net.code || "",
    b = $("copyCode"),
    done = (x) => {
      b.textContent = x;
      setTimeout(() => (b.textContent = "Copiar código"), 1800);
    };
  try {
    navigator.clipboard.writeText(t).then(
      () => done("Copiado"),
      () => done("Código: " + t),
    );
  } catch (e) {
    done("Código: " + t);
  }
});
