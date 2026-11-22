// Light-theme spot check of the screens this audit changed (phone).
const path = require("path");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));
const KEY = process.argv[2];
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.addInitScript((k) => localStorage.setItem(k, "light"), KEY);
  for (const s of ["review", "progress", "timeout", "results-practice"]) {
    await p.goto(`http://127.0.0.1:4174/index.html?fixture=${s}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(__dirname, "pick", `phone-light-${s}.png`) });
  }
  await b.close();
})();
