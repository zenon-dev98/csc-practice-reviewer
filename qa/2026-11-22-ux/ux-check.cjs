// UX regression check across question types, phone and desktop, headless Edge against the local server.
const path = require("path");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));
const BASE = "http://127.0.0.1:4174/index.html";
const OUT = path.join(__dirname, "ux");
require("fs").mkdirSync(OUT, { recursive: true });
const TYPES = {
  plain: "v01-q001", longprompt: "v09-q056", analogy: "v01-q121", ordering: "v15-q065", orderingEn: "v01-q067",
  figure: "v01-q139", figAnalogy: "v14-q135", sequence: "v14-q091", symbol: "v01-q131", passage: "v17-q078",
  filipinoPassage: "v19-q075", barTable: "v20-q159", table: "v16-q163", line: "v17-q163", gi: "v03-q008"
};
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  for (const [vp, size] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1536, height: 736 }]]) {
    const p = await b.newPage({ viewport: size, deviceScaleFactor: 1 });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    for (const [type, id] of Object.entries(TYPES)) {
      await p.goto(`${BASE}?fixture=exam&question=${id}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(1900);
      const m = await p.evaluate(() => {
        const meta = document.querySelector(".gx-meta"), flag = document.querySelector(".gx-meta .is-flag"), pill = document.querySelector(".gx-meta .gx-pill");
        const tw = document.querySelector(".gx-tablewrap");
        const prompt = document.querySelector(".gx-prompt, .gx-lead");
        return {
          metaH: meta?.getBoundingClientRect().height, flagTop: flag?.getBoundingClientRect().top, pillTop: pill?.getBoundingClientRect().top,
          tableOverflow: tw ? tw.scrollWidth - tw.clientWidth : 0, pageOverflowX: document.querySelector(".gx").scrollWidth - document.querySelector(".gx").clientWidth,
          promptTop: prompt ? Math.round(prompt.getBoundingClientRect().top) : null
        };
      });
      check(`${vp} ${type}: header one line`, m.metaH <= 44 && Math.abs(m.flagTop - m.pillTop) < 12, JSON.stringify(m));
      check(`${vp} ${type}: no sideways table scroll`, m.tableOverflow <= 1, `overflow ${m.tableOverflow}`);
      check(`${vp} ${type}: no page sideways scroll`, m.pageOverflowX <= 1, `overflow ${m.pageOverflowX}`);
      results.push({ name: `${vp} ${type}: prompt top`, ok: true, detail: String(m.promptTop) });
      await p.screenshot({ path: path.join(OUT, `${vp}-${type}.png`), fullPage: false });
    }
    // Scroll keeps its place when a choice is tapped on a long stacked screen.
    await p.goto(`${BASE}?fixture=exam&question=v17-q078`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1900);
    await p.evaluate(() => { document.querySelector(".gx").scrollTop = 400; const s = document.querySelector(".gx-stim"); if (s) s.scrollTop = 120; });
    const before = await p.evaluate(() => ({ page: document.querySelector(".gx").scrollTop, stim: document.querySelector(".gx-stim")?.scrollTop || 0 }));
    await p.locator(".gx-qcol .gx-choice[data-choice]").nth(2).click();
    const after = await p.evaluate(() => ({ page: document.querySelector(".gx").scrollTop, stim: document.querySelector(".gx-stim")?.scrollTop || 0 }));
    check(`${vp}: tapping a choice keeps page and passage scroll`, Math.abs(before.page - after.page) <= 2 && Math.abs(before.stim - after.stim) <= 2, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
    // Pause is immediate.
    const t0 = Date.now();
    await p.getByRole("button", { name: /^Pause$/i }).click();
    await p.locator(".gx-modal").first().waitFor({ timeout: 3000 });
    check(`${vp}: pause modal appears immediately`, Date.now() - t0 < 400, `${Date.now() - t0} ms`);
    await p.screenshot({ path: path.join(OUT, `${vp}-paused.png`) });
    // Question map sheet on phone fills the width.
    if (vp === "phone") {
      for (const id of ["v01-q001", "v17-q078"]) {
        await p.goto(`${BASE}?fixture=exam&question=${id}`, { waitUntil: "networkidle" });
        await p.waitForTimeout(1900);
        await p.locator(".gx-nav-toggle").click();
        const r = await p.evaluate(() => { const e = document.querySelector(".gx-rail.is-open").getBoundingClientRect(); return { left: e.left, right: e.right, bottom: e.bottom, top: e.top }; });
        check(`phone map sheet full width (${id})`, r.left <= 1 && r.right >= 389 && r.bottom >= 843, JSON.stringify(r));
        await p.screenshot({ path: path.join(OUT, `phone-map-${id}.png`) });
      }
    }
    check(`${vp}: no runtime errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
    await p.close();
  }
  await b.close();
  for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}${r.detail ? "  " + r.detail : ""}`);
  console.log(`${results.filter((r) => !r.ok).length} failing of ${results.length}`);
})().catch((e) => { console.error(e); process.exit(1); });
