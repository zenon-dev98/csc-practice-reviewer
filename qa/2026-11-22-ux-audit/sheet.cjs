// Contact sheets: tiles screenshots N per sheet so a whole pass can be eyeballed quickly.
const path = require("path"), fs = require("fs");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));
const dir = path.join(__dirname, process.argv[2]), prefix = process.argv[3], per = Number(process.argv[4] || 8);
(async () => {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".png"));
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  for (let i = 0; i < files.length; i += per) {
    const set = files.slice(i, i + per);
    const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${prefix === "desktop" ? 2 : 4},1fr);gap:6px;font:12px sans-serif">${set.map((f) => `<figure style="margin:0"><figcaption>${f}</figcaption><img style="width:100%" src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString("base64")}"></figure>`).join("")}</body>`;
    await p.setContent(html);
    await p.screenshot({ path: path.join(dir, `_sheet-${prefix}-${i / per + 1}.png`), fullPage: true });
  }
  await b.close();
})();
