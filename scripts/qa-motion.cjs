"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/current-motion");
fs.mkdirSync(outputDir, { recursive: true });

function buildFingerprint() {
  const hash = crypto.createHash("sha256");
  ["app/index.html", "app/app.js", "app/cockpit-theme.css", "app/v5-production.css"].forEach((file) => hash.update(fs.readFileSync(path.resolve(file))));
  return hash.digest("hex").slice(0, 16);
}

async function inspectMotion(page) {
  return page.evaluate(() => {
    const purposeful = [...document.querySelectorAll("[data-motion-purpose]")].map((node) => ({
      purpose: node.dataset.motionPurpose,
      tag: node.tagName,
      className: typeof node.className === "string" ? node.className : ""
    }));
    const animations = document.getAnimations({ subtree: true }).map((animation) => {
      const timing = animation.effect?.getTiming?.() || {};
      return {
        playState: animation.playState,
        duration: Number(timing.duration) || 0,
        iterations: Number(timing.iterations) || 0,
        targetPurpose: animation.effect?.target?.dataset?.motionPurpose || ""
      };
    });
    return { purposeful, animations };
  });
}

async function assertNoExamPageEntry(page, action) {
  const count = await page.evaluate(() => document.getAnimations({ subtree: true }).filter((animation) => animation.effect?.target?.dataset?.motionPurpose === "page-enter").length);
  if (count) throw new Error(`${action} replayed ${count} full-page entry animation(s)`);
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const report = {
    baseUrl,
    createdAt: new Date().toISOString(),
    browser: "Microsoft Edge",
    buildFingerprint: buildFingerprint(),
    expectedCases: 4,
    cases: [],
    errors: [],
    verdict: "failed"
  };

  async function runCase(name, reducedMotion, fixture, interact, forbiddenPurposes = []) {
    const context = await browser.newContext({
      viewport: { width: 1672, height: 942 },
      deviceScaleFactor: 1,
      reducedMotion,
      recordVideo: { dir: outputDir, size: { width: 1672, height: 942 } }
    });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); });
    let error = "";
    try {
      await page.goto(`${baseUrl}?fixture=${encodeURIComponent(fixture)}&qa=motion`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await interact(page);
      await page.waitForTimeout(140);
    } catch (caseError) {
      error = caseError.message;
    }
    const metrics = error ? { purposeful: [], animations: [] } : await inspectMotion(page);
    const traceFile = `${name}.zip`;
    const screenshotFile = `${name}.png`;
    if (!error) await page.screenshot({ path: path.join(outputDir, screenshotFile) });
    await context.tracing.stop({ path: path.join(outputDir, traceFile) });
    const video = page.video();
    await context.close();
    let videoFile = "";
    if (video) {
      const source = await video.path();
      videoFile = `${name}.webm`;
      const destination = path.join(outputDir, videoFile);
      if (fs.existsSync(destination)) fs.unlinkSync(destination);
      fs.renameSync(source, destination);
    }

    const missingPurpose = metrics.purposeful.length === 0;
    const endless = metrics.animations.filter((animation) => !Number.isFinite(animation.iterations) || animation.iterations > 1);
    const runningReduced = reducedMotion === "reduce"
      ? metrics.animations.filter((animation) => animation.playState === "running" && animation.duration > 1)
      : [];
    const forbidden = metrics.animations.filter((animation) => forbiddenPurposes.includes(animation.targetPurpose));
    const passed = !error && !runtimeErrors.length && !missingPurpose && !endless.length && !runningReduced.length && !forbidden.length;
    const entry = { name, reducedMotion, fixture, screenshotFile, traceFile, videoFile, metrics, runtimeErrors, forbidden, error, passed };
    report.cases.push(entry);
    if (!passed) report.errors.push(entry);
  }

  await runCase("normal-page-transition", "no-preference", "dashboard", async (page) => {
    await page.locator(".signed-primary-nav [data-action='practice-page']").click();
  });
  await runCase("normal-answer-and-modal", "no-preference", "exam-collapsed", async (page) => {
    await page.locator("[data-choice]").first().click();
    await assertNoExamPageEntry(page, "Answer selection");
    await page.locator("[data-action='toggle-flag']").click();
    await assertNoExamPageEntry(page, "Flag for Review");
    await page.locator("[data-action='clear-answer']").click();
    await assertNoExamPageEntry(page, "Clear Answer");
    await page.locator("[data-choice]").first().click();
    await page.locator("[data-action='next-question']").click();
    await assertNoExamPageEntry(page, "Next");
    await page.locator("[data-action='previous-question']").click();
    await assertNoExamPageEntry(page, "Previous");
    await page.locator("[data-action='skip-question']").click();
    await assertNoExamPageEntry(page, "Skip");
    await page.locator("[data-action='pause-exam']").click();
    await assertNoExamPageEntry(page, "Pause");
  }, ["page-enter"]);
  await runCase("reduced-page-transition", "reduce", "dashboard", async (page) => {
    await page.locator(".signed-primary-nav [data-action='practice-page']").click();
  });
  await runCase("reduced-answer-and-modal", "reduce", "exam-collapsed", async (page) => {
    await page.locator("[data-choice]").first().click();
    await page.locator("[data-action='pause-exam']").click();
  });

  await browser.close();
  report.coverage = { expected: report.expectedCases, executed: report.cases.length, missing: report.expectedCases - report.cases.length };
  if (report.coverage.missing) report.errors.push({ coverage: report.coverage });
  report.verdict = report.errors.length ? "failed" : "passed";
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify({ buildFingerprint: report.buildFingerprint, coverage: report.coverage, verdict: report.verdict, failures: report.errors.length }, null, 2)}\n`);
  if (report.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
