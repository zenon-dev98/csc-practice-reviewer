// Audit capture: every signed-in screen at phone and desktop, with geometry metrics for overflow, tap targets and tiny text.
const path = require("path");
const fs = require("fs");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));
const BASE = "http://127.0.0.1:4174/index.html";
const OUT = path.join(__dirname, process.argv[2] || "before");
fs.mkdirSync(OUT, { recursive: true });
const SCREENS = [
  "dashboard", "setup", "practice", "mistakes", "flagged", "flagged-empty", "progress", "progress-empty", "results", "results-fail",
  "results-practice", "review", "profile-modal", "pause", "submit", "timeout", "practice-exam",
  "paper-setup", "paper-exam", "paper-scan", "paper-review", "paper-results",
  "exam&question=v01-q001", "exam&question=v01-q121", "exam&question=v15-q065", "exam&question=v14-q135", "exam&question=v01-q139",
  "exam&question=v14-q091", "exam&question=v17-q078", "exam&question=v16-q163", "exam&question=v17-q163", "exam&question=v20-q159", "exam&question=v18-q154"
];
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const report = [];
  for (const [vp, size] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1536, height: 736 }]]) {
    const p = await b.newPage({ viewport: size, deviceScaleFactor: 1, hasTouch: vp === "phone", isMobile: vp === "phone" });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    for (const s of SCREENS) {
      errors.length = 0;
      await p.goto(`${BASE}?fixture=${s}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(1500);
      const m = await p.evaluate((vw) => {
        const root = document.querySelector(".gx") || document.scrollingElement;
        const out = { overflowX: Math.max(root.scrollWidth - root.clientWidth, document.documentElement.scrollWidth - innerWidth), wide: [], small: [], tiny: [] };
        for (const el of document.querySelectorAll("#app *")) {
          const r = el.getBoundingClientRect();
          if (!r.width || getComputedStyle(el).visibility === "hidden") continue;
          let clipped = false;
          for (let a = el.parentElement; a && a.id !== "app"; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (ox !== "visible") { clipped = true; break; } }
          if (r.right > vw + 1 && !clipped) out.wide.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} r=${Math.round(r.right)}`);
          if (el.matches("button, a[href], input, select, [role=button]") && (r.width < 24 || r.height < 24)) out.small.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 20)}"`);
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 12 && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) out.tiny.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} ${fs}px "${el.textContent.trim().slice(0, 20)}"`);
        }
        out.wide = out.wide.slice(0, 6); out.small = [...new Set(out.small)].slice(0, 8); out.tiny = [...new Set(out.tiny)].slice(0, 6);
        out.usesGx = Boolean(document.querySelector(".gx"));
        out.scrollH = root.scrollHeight;
        return out;
      }, size.width);
      const name = `${vp}-${s.replace("exam&question=", "q-")}`;
      await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
      report.push({ name, ...m, errors: errors.slice(0, 2) });
    }
    await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(OUT, "metrics.json"), JSON.stringify(report, null, 1));
  for (const r of report) {
    const flags = [r.overflowX > 1 && `overflowX ${r.overflowX}`, r.wide.length && `wide ${r.wide.join(" ; ")}`, r.small.length && `small ${r.small.join(" ; ")}`, r.tiny.length && `tiny ${r.tiny.join(" ; ")}`, r.errors.length && `ERR ${r.errors}`, !r.usesGx && "legacy-ui"].filter(Boolean);
    console.log(`${r.name}${flags.length ? "\n   " + flags.join("\n   ") : "  ok"}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
