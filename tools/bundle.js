// Une todo en un solo archivo: dist/gresca.html
// Sirve para publicarlo como artifact en claude.ai o para pasarlo como archivo único.
//   node tools/bundle.js
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((f) => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(root, f), "utf8")).join("\n");
const body = html
  .slice(html.indexOf("<body>") + 6, html.indexOf("</body>"))
  .replace(/\s*<script src="js\/[^"]+"><\/script>/g, "")
  .trim();
const out = `<title>Gresca Arcade</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee&family=Chakra+Petch:wght@400;600;700&display=swap">
<style>
${css}</style>
${body}
<script>
${js}</script>
`;
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/gresca.html"), out);
console.log("dist/gresca.html", (out.length / 1024).toFixed(0) + " KB,", scripts.length, "scripts");
