"use strict";

// Motion QA for the game-style motion layer (gxAfterRender in app/app.js, "Motion layer" in app/game.css).
// Verifies triggers, finite timing, end states and reduced-motion behavior with headless Edge, and records
// a video, trace and timed screenshots per case. Usage: node scripts/qa-motion.cjs [outputDir]
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/current-motion");
fs.mkdirSync(outputDir, { recursive: true });

// Every motion class is removed by a 1.7 s safety timer, so no animation may end later than that.
const CLEANUP_MS = 1700;
const REDUCED_MAX_MS = 200;

const expectedChecks = [
  "home entry animates on load",
  "home entry animations are finite and end before cleanup",
  "home entry ends with content fully visible",
  "answer pick pops only the chosen choice",
  "answer pick does not replay the page entry",
  "next question slides in the question column",
  "next question does not replay the page entry",
  "pause opens its modal with an entry animation",
  "exam motion ends with no running animations",
  "reduced motion home uses short fades only",
  "reduced motion home ends with content fully visible",
  "reduced motion next question uses short fades only",
  "no runtime errors"
];

function fingerprint() {
  const hash = crypto.createHash("sha256");
  ["app/index.html", "app/app.js", "app/game.css"].forEach((file) => hash.update(fs.readFileSync(path.resolve(file))));
  return hash.digest("hex").slice(0, 16);
}

// Snapshot of every animation: end time includes delay, so a staggered item is judged by when it finishes.
const readAnimations = (page) => page.evaluate(() => document.getAnimations().map((animation) => {
  const timing = animation.effect?.getComputedTiming?.() || {};
  const target = animation.effect?.target;
  return {
    name: animation.animationName || "",
    playState: animation.playState,
    duration: Number(timing.duration) || 0,
    endTime: Number(timing.endTime) || 0,
    iterations: timing.iterations,
    target: target ? `${target.tagName.toLowerCase()}.${String(target.className?.baseVal ?? target.className).trim().split(/\s+/).slice(0, 3).join(".")}` : ""
  };
}));

let browser;
(async () => {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const report = { createdAt: new Date().toISOString(), baseUrl, browser: "Microsoft Edge (headless)", buildFingerprint: fingerprint(), expected: expectedChecks.length, checks: [], screenshots: [], runtimeErrors: [] };
  const executed = new Set();
  const check = (name, passed, details = "") => {
    if (!expectedChecks.includes(name)) throw new Error(`Unexpected check: ${name}`);
    if (executed.has(name)) throw new Error(`Duplicate check: ${name}`);
    executed.add(name);
    report.checks.push({ name, passed: Boolean(passed), details: typeof details === "string" ? details : JSON.stringify(details) });
  };

  async function openCase(name, reducedMotion, fixture) {
    // Timing evidence is the trace (screenshot frames) plus timed screenshots; video would need Playwright's ffmpeg download.
    const context = await browser.newContext({ viewport: { width: 1536, height: 736 }, deviceScaleFactor: 1, reducedMotion });
    await context.tracing.start({ screenshots: true, snapshots: false, sources: false });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => report.runtimeErrors.push(`${name}: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") report.runtimeErrors.push(`${name}: ${message.text()}`); });
    const shot = async (label) => {
      const file = `${name}-${label}.png`;
      await page.screenshot({ path: path.join(outputDir, file) });
      report.screenshots.push({ case: name, label, file });
    };
    const close = async () => {
      await context.tracing.stop({ path: path.join(outputDir, `${name}.zip`) });
      await context.close();
    };
    await page.goto(`${baseUrl}?fixture=${fixture}&qa=motion`, { waitUntil: "domcontentloaded" });
    return { page, shot, close };
  }
  const visibleHome = (page) => page.evaluate(() => [...document.querySelectorAll(".gx-home > *")].every((node) => Number(getComputedStyle(node).opacity) === 1 && !/matrix\(.*\)/.test(getComputedStyle(node).transform.replace("matrix(1, 0, 0, 1, 0, 0)", ""))));
  const entering = (page) => page.evaluate(() => Boolean(document.querySelector(".gx.is-entering")));
  const running = (animations) => animations.filter((animation) => animation.playState === "running");

  // Normal motion: Home entry.
  {
    const { page, shot, close } = await openCase("normal-home", "no-preference", "dashboard");
    await page.locator(".gx-home").waitFor();
    await page.waitForTimeout(60);
    const start = await readAnimations(page);
    await shot("060ms");
    check("home entry animates on load", start.length > 0 && await entering(page), `${start.length} animations`);
    const late = start.filter((animation) => !Number.isFinite(animation.endTime) || animation.endTime > CLEANUP_MS || !Number.isFinite(animation.iterations) || animation.iterations > 2);
    check("home entry animations are finite and end before cleanup", late.length === 0, late.slice(0, 5));
    await page.waitForTimeout(240);
    await shot("300ms");
    await page.waitForTimeout(CLEANUP_MS + 100);
    await shot("2100ms");
    check("home entry ends with content fully visible", !(await entering(page)) && running(await readAnimations(page)).length === 0 && await visibleHome(page));
    await close();
  }

  // Normal motion: exam interactions.
  {
    const { page, shot, close } = await openCase("normal-exam", "no-preference", "exam-collapsed");
    await page.locator(".gx-qcol .gx-choice").first().waitFor();
    await page.waitForTimeout(CLEANUP_MS + 100);
    await page.locator(".gx-qcol .gx-choice[data-choice]").nth(1).click();
    await page.waitForTimeout(40);
    const popping = await page.locator(".gx-choice.is-popping").count();
    const pickAnimations = running(await readAnimations(page));
    await shot("pick-040ms");
    check("answer pick pops only the chosen choice", popping === 1 && pickAnimations.length > 0 && pickAnimations.every((animation) => /gx-choice|gx-key/.test(animation.target)), pickAnimations.map((animation) => animation.target));
    check("answer pick does not replay the page entry", !(await entering(page)));
    await page.waitForTimeout(400);
    const before = await page.locator("#app .gx-qnum").innerText();
    await page.getByRole("button", { name: /^Next$/i }).click();
    await page.waitForTimeout(60);
    await shot("next-060ms");
    const after = await page.locator("#app .gx-qnum").innerText();
    check("next question slides in the question column", before !== after && await page.locator(".gx-qcol.is-next").count() === 1, `${before} -> ${after}`);
    check("next question does not replay the page entry", !(await entering(page)));
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /^Pause$/i }).click();
    await page.waitForTimeout(60);
    await shot("pause-060ms");
    check("pause opens its modal with an entry animation", await page.locator(".gx-backdrop.is-entering").count() === 1 && running(await readAnimations(page)).some((animation) => /gx-modal|gx-backdrop/.test(animation.target)));
    await page.waitForTimeout(CLEANUP_MS + 100);
    await shot("pause-settled");
    check("exam motion ends with no running animations", running(await readAnimations(page)).length === 0);
    await close();
  }

  // Reduced motion.
  {
    const { page, shot, close } = await openCase("reduced-home", "reduce", "dashboard");
    await page.locator(".gx-home").waitFor();
    await page.waitForTimeout(40);
    const start = await readAnimations(page);
    await shot("040ms");
    const tooLong = start.filter((animation) => animation.duration > REDUCED_MAX_MS || (animation.name && animation.name !== "gx-fade"));
    check("reduced motion home uses short fades only", tooLong.length === 0, tooLong.slice(0, 5));
    await page.waitForTimeout(CLEANUP_MS + 100);
    check("reduced motion home ends with content fully visible", running(await readAnimations(page)).length === 0 && await visibleHome(page));
    await close();
  }
  {
    const { page, shot, close } = await openCase("reduced-exam", "reduce", "exam-collapsed");
    await page.locator(".gx-qcol .gx-choice").first().waitFor();
    await page.waitForTimeout(CLEANUP_MS + 100);
    await page.locator(".gx-qcol .gx-choice[data-choice]").first().click();
    await page.getByRole("button", { name: /^Next$/i }).click();
    await page.waitForTimeout(40);
    await shot("next-040ms");
    const tooLong = (await readAnimations(page)).filter((animation) => animation.duration > REDUCED_MAX_MS || (animation.name && animation.name !== "gx-fade"));
    check("reduced motion next question uses short fades only", tooLong.length === 0, tooLong.slice(0, 5));
    await close();
  }

  check("no runtime errors", report.runtimeErrors.length === 0, report.runtimeErrors.slice(0, 5));
  expectedChecks.filter((name) => !executed.has(name)).forEach((name) => report.checks.push({ name, passed: false, details: "unexecuted" }));
  report.passed = report.checks.filter((item) => item.passed).length;
  report.failed = report.checks.length - report.passed;
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outputDir, "manifest.md"), `# Motion QA\n\n- Build: \`${report.buildFingerprint}\`\n- Viewport: 1536x736, headless Edge\n- Expected: ${report.expected}\n- Passed: ${report.passed}\n- Failed: ${report.failed}\n\n${report.checks.map((item) => `- [${item.passed ? "x" : " "}] ${item.name}${item.details && item.details !== "[]" ? `: ${item.details}` : ""}`).join("\n")}\n`);
  await browser.close();
  process.stdout.write(`motion QA: ${report.passed}/${report.expected} passed\n`);
  if (report.failed) process.exitCode = 1;
})().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
  if (browser) await browser.close().catch(() => {});
});
