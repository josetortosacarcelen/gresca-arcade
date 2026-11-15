const BUILTIN = [
  {
    id: "rayo",
    name: "Rayo",
    outfit: "traje",
    build: "normal",
    gi: "#1f6fe0",
    glove: "#ffd23f",
    energy: "#41e3ff",
    skin: "#e9b48a",
    band: false,
    face: { hair: "#1c1420", hairStyle: "short" },
  },
  {
    id: "brasa",
    name: "Brasa",
    outfit: "gi",
    build: "normal",
    gi: "#2f2d3a",
    glove: "#ff5a1f",
    energy: "#ff8a1f",
    skin: "#c98a5e",
    band: true,
    face: { hair: "#d8322a", hairStyle: "spiky" },
  },
  {
    id: "jade",
    name: "Jade",
    outfit: "uniforme",
    build: "slim",
    gi: "#2f6b4f",
    glove: "#e8c35a",
    energy: "#7dffb0",
    skin: "#f1c8a4",
    band: false,
    face: { hair: "#2a1a12", hairStyle: "long" },
  },
  {
    id: "trueno",
    name: "Trueno",
    outfit: "boxer",
    build: "heavy",
    gi: "#6a2fd1",
    glove: "#d9342b",
    energy: "#d38bff",
    skin: "#8d5a3b",
    band: false,
    face: { hair: "#1a1210", hairStyle: "bald", beard: true },
  },
  {
    id: "coloso",
    name: "Coloso",
    outfit: "lucha",
    build: "heavy",
    gi: "#c23a2e",
    glove: "#f2b632",
    energy: "#ffe14a",
    skin: "#d9a27b",
    band: false,
    face: { hair: "#5a3a22", hairStyle: "short", beard: true },
  },
  {
    id: "fusil",
    name: "Fusil",
    outfit: "tank",
    build: "normal",
    gi: "#5d6b3a",
    glove: "#2a2018",
    energy: "#b6ff5a",
    skin: "#e0ac86",
    band: true,
    face: { hair: "#e6c75a", hairStyle: "spiky" },
  },
  {
    id: "sombra",
    name: "Sombra",
    outfit: "calle",
    build: "slim",
    gi: "#7a1f3d",
    glove: "#f4f4f4",
    energy: "#ff4fd8",
    skin: "#b07a55",
    band: false,
    face: { hair: "#101014", hairStyle: "long" },
  },
  {
    id: "tigre",
    name: "Tigre",
    outfit: "gi",
    build: "heavy",
    gi: "#e8a21a",
    glove: "#1d1526",
    energy: "#ff5a36",
    skin: "#a86f48",
    band: false,
    face: { hair: "#1a1210", hairStyle: "bald" },
  },
];
for (const b of BUILTIN) {
  b.builtin = true;
  b.faceImg = drawCartoonFace({ skin: b.skin, ...b.face });
}
// Personalidad de cada luchador: apodo, frase de victoria, grito del especial, proyectil y escenario.
const LORE = {
  rayo: {
    title: "El Relámpago del Barrio",
    quote: "Ni me has visto venir. Normal.",
    special: "¡CHISPAZO!",
    proj: "energia",
    stage: "azotea",
  },
  brasa: {
    title: "El Dragón de la Barbacoa",
    quote: "¿Hace calor aquí o soy yo?",
    special: "¡JAMONAZO!",
    proj: "jamon",
    stage: "plaza",
  },
  jade: {
    title: "La Comandante",
    quote: "Firmes. Y recoge tus dientes al salir.",
    special: "¡TE LLAMO!",
    proj: "movil",
    stage: "azotea",
  },
  trueno: {
    title: "El Martillo del Gimnasio",
    quote: "Hoy tocaba pierna... y tu cara.",
    special: "¡PELOTAZO!",
    proj: "balon",
    stage: "bar",
  },
  coloso: {
    title: "El Rey del Tardeo",
    quote: "Otra ronda. La pagas tú.",
    special: "¡CAÑAZO!",
    proj: "cana",
    stage: "playa",
  },
  fusil: {
    title: "El Sargento de la Urba",
    quote: "Misión cumplida. A las ocho, diana.",
    special: "¡FUEGO!",
    proj: "energia",
    stage: "azotea",
  },
  sombra: {
    title: "La Sombra del Portal",
    quote: "Esto te pasa por no saludar en el ascensor.",
    special: "¡CHANCLAZO!",
    proj: "chancla",
    stage: "bar",
  },
  tigre: {
    title: "El Maestro del Chiringuito",
    quote: "La paciencia es un arte. Los guantazos también.",
    special: "¡ZARPAZO!",
    proj: "energia",
    stage: "playa",
  },
};
for (const b of BUILTIN) Object.assign(b, LORE[b.id]);
let customs = []; // from db or local
let ROSTER = [...BUILTIN];
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
function sanitizeDef(id, raw, src) {
  const d = {
    id,
    src,
    name: String(raw.name || "Sin nombre").slice(0, 14),
    gi: isHex(raw.gi) ? raw.gi : "#e6e1f5",
    glove: isHex(raw.glove) ? raw.glove : "#e8323a",
    energy: isHex(raw.energy) ? raw.energy : "#41e3ff",
    skin: isHex(raw.skin) ? raw.skin : "#e3a97f",
    band: raw.band !== false,
    outfit: OUTFITS[raw.outfit] ? raw.outfit : "gi",
    build: BUILDS[raw.build] ? raw.build : "normal",
    title: String(raw.title || "").slice(0, 28),
    quote: String(raw.quote || "").slice(0, 80),
    special: String(raw.special || "")
      .slice(0, 14)
      .toUpperCase(),
    proj: PROJ[raw.proj] ? raw.proj : "energia",
    stage: STAGES[raw.stage] ? raw.stage : "bar",
    faceData: null,
    faceImg: null,
  };
  if (
    typeof raw.face === "string" &&
    /^data:image\/(png|jpeg|webp);base64,/.test(raw.face) &&
    raw.face.length < 300000
  ) {
    d.faceData = raw.face;
    const im = new Image();
    im.onload = () => {
      d.faceImg = im;
      refreshCards();
    };
    im.src = raw.face;
  }
  return d;
}
function rebuildRoster() {
  ROSTER = [...BUILTIN, ...customs];
  refreshCards();
}
const byId = (id) => ROSTER.find((d) => d.id === id) || BUILTIN[0];
