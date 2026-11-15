"use strict";
const W = 960,
  H = 540,
  GROUND = 478,
  GRAV = 0.9,
  JUMPV = 17.5,
  MAXHP = 1000;
const MOVES = {
  sp: { st: 4, act: 3, rec: 8, dmg: 45, hs: 14, bs: 9, push: 6, box: [40, -215, 74, 34], lvl: "mid" },
  sk: { st: 7, act: 4, rec: 15, dmg: 80, hs: 18, bs: 12, push: 9, box: [40, -150, 92, 40], lvl: "mid" },
  cp: { st: 4, act: 3, rec: 8, dmg: 35, hs: 12, bs: 8, push: 5, box: [38, -160, 86, 30], lvl: "mid" },
  ck: { st: 8, act: 4, rec: 18, dmg: 70, hs: 0, bs: 12, push: 10, box: [30, -38, 106, 34], lvl: "low", kd: true },
  jp: { st: 4, act: 8, rec: 2, dmg: 55, hs: 15, bs: 10, push: 5, box: [20, -150, 70, 56], lvl: "high", air: true },
  jk: { st: 5, act: 10, rec: 2, dmg: 75, hs: 17, bs: 11, push: 6, box: [15, -110, 88, 56], lvl: "high", air: true },
  up: {
    st: 3,
    act: 12,
    rec: 24,
    dmg: 120,
    hs: 0,
    bs: 14,
    push: 6,
    box: [5, -290, 66, 190],
    lvl: "mid",
    kd: true,
    inv: 9,
    rise: true,
  },
  fb: { st: 12, act: 1, rec: 20, proj: true },
  su: { st: 10, act: 1, rec: 28, proj: true, big: true },
};
const CROUCHY = new Set(["crouch", "cp", "ck", "cblock", "chit"]);
const VIS = [
  "idle",
  "walk",
  "walkb",
  "crouch",
  "jump",
  "sp",
  "sk",
  "cp",
  "ck",
  "jp",
  "jk",
  "up",
  "fb",
  "su",
  "hit",
  "chit",
  "block",
  "cblock",
  "kd",
  "ko",
  "win",
];
const STATES = ["idle", "walk", "walkb", "crouch", "jump", "attack", "hit", "block", "kd", "ko"];
const ATKS = ["sp", "sk", "cp", "ck", "jp", "jk", "up", "fb", "su"];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const mix2 = (A, B, t) => [mix(A[0], B[0], t), mix(A[1], B[1], t)];
