"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/t0024-cockpit-sweep");
const states = [
  "loading", "config", "fatal", "create", "create-loading", "select", "signin-loading",
  "forgot-password", "forgot-error", "forgot-success", "dashboard", "dashboard-empty", "setup", "exam",
  "exam-collapsed", "graph", "chart-modal", "pause", "submit", "timeout", "practice",
  "mistakes", "mistakes-empty", "flagged", "flagged-empty", "recent", "progress", "progress-empty",
  "results", "results-fail", "results-practice", "review", "review-empty", "profile-modal", "password-expanded",
  "delete-account", "delete-attempt"
];
const desktopViewports = [
  { width: 1672, height: 942, label: "logical" },
  { width: 1904, height: 913, label: "1904x913" },
  { width: 1536, height: 816, label: "1536x816" },
  { width: 1536, height: 736, label: "edge-1536x736" },
  { width: 1366, height: 768, label: "1366x768" }
];
const mobileViewports = [
  { width: 390, height: 844, label: "390x844" },
  { width: 412, height: 915, label: "412x915" }
];
const viewports = [...desktopViewports, ...mobileViewports];
const selectedStates = process.env.CSC_QA_STATES ? process.env.CSC_QA_STATES.split(",").map((value) => value.trim()).filter(Boolean) : states;
const selectedViewports = process.env.CSC_QA_VIEWPORTS
  ? viewports.filter((viewport) => process.env.CSC_QA_VIEWPORTS.split(",").includes(viewport.label))
  : desktopViewports;

fs.mkdirSync(outputDir, { recursive: true });

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const report = { baseUrl, createdAt: new Date().toISOString(), browser: "Microsoft Edge", entries: [], errors: [] };

  for (const viewport of selectedViewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") pageErrors.push(`console: ${message.text()}`); });

    for (const state of selectedStates) {
      pageErrors.length = 0;
      await page.goto(`${baseUrl}?fixture=${encodeURIComponent(state)}&qa=t0024`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      const metrics = await page.evaluate(() => {
        const frame = document.querySelector(".cockpit-frame");
        const frameRect = frame?.getBoundingClientRect();
        const allowedScroll = new Set(["exam-nav", "review-sidebar", "review-content-scroll", "review-main", "question-panel", "attempt-table", "mistake-list", "review-queue", "chart-modal", "command-drawer", "choices"]);
        const overflow = Array.from(document.querySelectorAll("button, input, select, textarea, .card, .question-group, .question-panel, .stimulus-panel"))
          .filter((node) => {
            const style = getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden") return false;
            // The active nav underline deliberately crosses the button box into
            // the parent rail; its label and glyph remain contained.
            if (node.matches(".signed-primary-nav button")) return false;
            if (Array.from(node.classList).some((name) => allowedScroll.has(name)) || node.closest(".chart-modal")) return false;
            return node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2;
          })
          .slice(0, 20)
          .map((node) => ({ selector: `${node.tagName.toLowerCase()}.${Array.from(node.classList).join(".")}`, client: [node.clientWidth, node.clientHeight], scroll: [node.scrollWidth, node.scrollHeight], text: (node.textContent || "").trim().slice(0, 80) }));
        const visualDefects = [];
        const isOwnedByScrollContainer = (node) => {
          for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            const ownsVerticalOverflow = /auto|scroll/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight + 2;
            const ownsHorizontalOverflow = /auto|scroll/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth + 2;
            if (ownsVerticalOverflow || ownsHorizontalOverflow) return true;
          }
          return false;
        };
        const visibleContentBottom = Array.from(document.body.querySelectorAll("*"))
          .filter((node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && !isOwnedByScrollContainer(node);
          })
          .reduce((bottom, node) => Math.max(bottom, node.getBoundingClientRect().bottom + scrollY), 0);
        const reachableDocumentBottom = document.scrollingElement?.scrollHeight || document.documentElement.scrollHeight;
        if (innerWidth < 1100 && visibleContentBottom > reachableDocumentBottom + 2) {
          visualDefects.push(`mobile content bottom ${Math.ceil(visibleContentBottom)} exceeds reachable document bottom ${reachableDocumentBottom}`);
        }
        document.querySelectorAll(".setup-facts .instrument-cell").forEach((cell, index) => {
          const value = cell.querySelector("strong")?.getBoundingClientRect();
          const label = cell.querySelector(":scope > span:not(.instrument-icon)")?.getBoundingClientRect();
          const overlaps = value && label
            && value.left < label.right && value.right > label.left
            && value.top < label.bottom && value.bottom > label.top;
          if (overlaps) visualDefects.push(`setup fact ${index + 1} label/value collision`);
        });
        document.querySelectorAll(".mistake-table-head").forEach((head) => {
          if (getComputedStyle(head).display === "none") return;
          const bounds = head.getBoundingClientRect();
          Array.from(head.children).forEach((label) => {
            const rect = label.getBoundingClientRect();
            if (rect.top - bounds.top < 8 || bounds.bottom - rect.bottom < 8) visualDefects.push(`mistake heading '${label.textContent.trim()}' lacks vertical clearance`);
          });
        });
        return {
          viewport: [innerWidth, innerHeight],
          body: [document.body.scrollWidth, document.body.scrollHeight],
          document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
          frame: frameRect ? { x: frameRect.x, y: frameRect.y, width: frameRect.width, height: frameRect.height } : null,
          scale: getComputedStyle(document.getElementById("app")).getPropertyValue("--cockpit-scale").trim(),
          view: document.getElementById("app")?.dataset.view,
          overflow,
          activeAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
          visualDefects,
          visibleContentBottom,
          reachableDocumentBottom
        };
      });
      const file = `${safeName(state)}-${viewport.label}.png`;
      await page.screenshot({ path: path.join(outputDir, file), fullPage: process.env.CSC_QA_FULL_PAGE === "1" });
      const entry = { state, viewport, file, metrics, errors: [...pageErrors] };
      report.entries.push(entry);
      const documentOverflow = metrics.body[0] > viewport.width || (viewport.width >= 1100 && metrics.body[1] > viewport.height);
      if (pageErrors.length || documentOverflow || metrics.activeAnimations || metrics.visualDefects.length) report.errors.push(entry);
    }
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  const summary = {
    screenshots: report.entries.length,
    consoleOrDocumentFailures: report.errors.length,
    elementOverflowSamples: report.entries.reduce((sum, entry) => sum + entry.metrics.overflow.length, 0),
    visualDefects: report.entries.reduce((sum, entry) => sum + entry.metrics.visualDefects.length, 0),
    activeAnimations: report.entries.reduce((sum, entry) => sum + entry.metrics.activeAnimations, 0)
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (report.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
