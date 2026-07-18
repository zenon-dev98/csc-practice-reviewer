"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/t0024-cockpit-sweep");
const states = [
  "loading", "config", "fatal", "create", "create-loading", "select", "signin-loading",
  "forgot-password", "forgot-error", "forgot-success", "dashboard", "dashboard-empty", "setup", "exam",
  "exam-collapsed", "graph", "passage", "data-table", "metric-bars", "line-chart", "series-line", "series-bars",
  "long-prompt", "long-choices", "chart-modal", "passage-modal", "table-modal", "line-modal", "pause", "submit", "timeout", "practice",
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
const referenceRoot = path.resolve("states", "v5");
const referenceContract = JSON.parse(fs.readFileSync(path.join(referenceRoot, "reference-contract.json"), "utf8"));
const referenceByState = new Map();
for (const contract of referenceContract.contracts) {
  for (const state of contract.states) {
    if (referenceByState.has(state)) throw new Error(`Duplicate V5 reference contract for '${state}'`);
    referenceByState.set(state, contract);
  }
}
const missingStateContracts = states.filter((state) => !referenceByState.has(state));
if (missingStateContracts.length) throw new Error(`Missing V5 reference contracts: ${missingStateContracts.join(", ")}`);
for (const contract of referenceContract.contracts) {
  const referencePath = path.resolve(referenceRoot, contract.reference);
  if (!fs.existsSync(referencePath)) throw new Error(`Missing reference image for '${contract.id}': ${referencePath}`);
}
const selectedStates = process.env.CSC_QA_STATES ? process.env.CSC_QA_STATES.split(",").map((value) => value.trim()).filter(Boolean) : states;
const selectedViewports = process.env.CSC_QA_VIEWPORTS
  ? viewports.filter((viewport) => process.env.CSC_QA_VIEWPORTS.split(",").includes(viewport.label))
  : desktopViewports;
const unknownSelectedStates = selectedStates.filter((state) => !states.includes(state));
if (unknownSelectedStates.length) throw new Error(`Unknown QA states: ${unknownSelectedStates.join(", ")}`);
if (!selectedViewports.length) throw new Error("No recognized QA viewports were selected");

fs.mkdirSync(outputDir, { recursive: true });

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

function buildMetadata() {
  const files = ["app/index.html", "app/app.js", "app/cockpit-theme.css", "app/v5-production.css"];
  const hash = crypto.createHash("sha256");
  files.forEach((file) => hash.update(fs.readFileSync(path.resolve(file))));
  const html = fs.readFileSync(path.resolve("app/index.html"), "utf8");
  return {
    fingerprint: hash.digest("hex").slice(0, 16),
    cacheKeys: Array.from(html.matchAll(/[?&]v=([^"&]+)/g), (match) => match[1]),
    files
  };
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const report = { baseUrl, createdAt: new Date().toISOString(), browser: "Microsoft Edge", build: buildMetadata(), referenceVersion: referenceContract.version, entries: [], errors: [] };

  for (const viewport of selectedViewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") pageErrors.push(`console: ${message.text()}`); });

    for (const state of selectedStates) {
      pageErrors.length = 0;
      const stateContract = referenceByState.get(state);
      if (!stateContract) throw new Error(`Selected state '${state}' has no reference contract`);
      await page.goto(`${baseUrl}?fixture=${encodeURIComponent(state)}&qa=t0024`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      const metrics = await page.evaluate((contract) => {
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
        const missingAnchors = (contract.anchors || []).filter((selector) => !document.querySelector(selector));
        missingAnchors.forEach((selector) => visualDefects.push(`missing required reference anchor '${selector}'`));
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
          const bounds = cell.getBoundingClientRect();
          const value = cell.querySelector("strong")?.getBoundingClientRect();
          const label = cell.querySelector(":scope > span:not(.instrument-icon)")?.getBoundingClientRect();
          const overlaps = value && label
            && value.left < label.right && value.right > label.left
            && value.top < label.bottom && value.bottom > label.top;
          if (overlaps) visualDefects.push(`setup fact ${index + 1} label/value collision`);
          Array.from(cell.children).forEach((child) => {
            const rect = child.getBoundingClientRect();
            if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1) {
              visualDefects.push(`setup fact ${index + 1} '${child.textContent.trim() || child.className}' escapes its cell`);
            }
          });
          if (value) {
            const lineHeight = parseFloat(getComputedStyle(cell.querySelector("strong")).lineHeight);
            if (Number.isFinite(lineHeight) && value.height > lineHeight * 1.25) visualDefects.push(`setup fact ${index + 1} value wraps`);
          }
        });
        document.querySelectorAll(".mistake-table-head").forEach((head) => {
          if (getComputedStyle(head).display === "none") return;
          const bounds = head.getBoundingClientRect();
          Array.from(head.children).forEach((label) => {
            const rect = label.getBoundingClientRect();
            if (rect.top - bounds.top < 8 || bounds.bottom - rect.bottom < 8) visualDefects.push(`mistake heading '${label.textContent.trim()}' lacks vertical clearance`);
          });
        });
        document.querySelectorAll(".grouped-chart-svg").forEach((svg, chartIndex) => {
          const plotTop = Number(svg.dataset.plotTop);
          const plotBottom = Number(svg.dataset.plotBottom);
          const bars = Array.from(svg.querySelectorAll(".chart-bar"));
          if (!bars.length) visualDefects.push(`grouped chart ${chartIndex + 1} has no bars`);
          bars.forEach((bar, barIndex) => {
            const y = Number(bar.getAttribute("y"));
            const height = Number(bar.getAttribute("height"));
            if (![y, height, plotTop, plotBottom].every(Number.isFinite)) {
              visualDefects.push(`grouped chart ${chartIndex + 1} bar ${barIndex + 1} has invalid geometry`);
            } else if (Math.abs(y + height - plotBottom) > 0.5) {
              visualDefects.push(`grouped chart ${chartIndex + 1} bar ${barIndex + 1} is detached from zero baseline`);
            } else if (y < plotTop - 0.5 || y > plotBottom + 0.5) {
              visualDefects.push(`grouped chart ${chartIndex + 1} bar ${barIndex + 1} is outside the plot`);
            }
          });
          const zeroLine = svg.querySelector('.chart-grid[data-value="0"] line');
          if (!zeroLine || Math.abs(Number(zeroLine.getAttribute("y1")) - plotBottom) > 0.5) {
            visualDefects.push(`grouped chart ${chartIndex + 1} zero gridline does not match the bar baseline`);
          }
          const viewport = svg.closest(".grouped-chart-viewport");
          if (innerWidth >= 1100 && viewport && viewport.scrollWidth > viewport.clientWidth + 2) {
            visualDefects.push(`grouped chart ${chartIndex + 1} overflows its desktop viewport`);
          }
        });
        document.querySelectorAll(".stimulus-panel").forEach((panel, panelIndex) => {
          const kind = panel.dataset.stimulusKind;
          const head = panel.querySelector(".stimulus-head")?.getBoundingClientRect();
          const content = panel.querySelector(".stimulus-content")?.getBoundingClientRect();
          const footer = panel.querySelector(".linked-items")?.getBoundingClientRect();
          const bounds = panel.getBoundingClientRect();
          if (!head || !content || !footer) {
            visualDefects.push(`stimulus panel ${panelIndex + 1} is missing a structural region`);
          } else {
            if (head.bottom > content.top + 1) visualDefects.push(`stimulus panel ${panelIndex + 1} header overlaps content`);
            if (content.bottom > footer.top + 1) visualDefects.push(`stimulus panel ${panelIndex + 1} content overlaps linked items`);
            if (innerWidth >= 1100 && [head, content, footer].some((rect) => rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) {
              visualDefects.push(`stimulus panel ${panelIndex + 1} has content outside its frame`);
            }
          }
          const copy = panel.textContent.toLowerCase();
          const expected = { passage: ".passage-copy", table: ".data-table-wrap", line: ".line-chart-svg", bars: ".metric-series", "grouped-bars": ".grouped-chart-svg" }[kind];
          if (expected && !panel.querySelector(expected)) visualDefects.push(`stimulus panel ${panelIndex + 1} ${kind} visual is missing`);
          const expanded = Boolean(panel.closest(".chart-modal"));
          if (kind === "passage" && (copy.includes("same chart") || (!expanded && !copy.includes("open passage")))) visualDefects.push(`stimulus panel ${panelIndex + 1} uses incorrect passage copy`);
          if (kind === "table" && (copy.includes("same chart") || (!expanded && !copy.includes("open table")))) visualDefects.push(`stimulus panel ${panelIndex + 1} uses incorrect table copy`);
          if (kind === "line" && !expanded && !copy.includes("open graph")) visualDefects.push(`stimulus panel ${panelIndex + 1} uses incorrect graph copy`);
        });
        document.querySelectorAll(".hub-run-panel").forEach((panel, index) => {
          const bounds = panel.getBoundingClientRect();
          const ring = panel.querySelector(".hub-ring")?.getBoundingClientRect();
          const resume = panel.querySelector(".hub-resume-button")?.getBoundingClientRect();
          if (innerWidth >= 1100 && ring && Math.abs((ring.top - bounds.top) - (bounds.bottom - ring.bottom)) > 3) {
            visualDefects.push(`hub run panel ${index + 1} completion ring is not vertically balanced`);
          }
          if (innerWidth >= 1100 && resume) {
            const bottomInset = Math.round(bounds.bottom - resume.bottom);
            if (bottomInset < 18 || bottomInset > 30) visualDefects.push(`hub run panel ${index + 1} resume action bottom inset is ${bottomInset}px`);
          }
        });
        document.querySelectorAll(".choice").forEach((choice, index) => {
          if (innerWidth >= 1100) return;
          const letter = choice.querySelector(".choice-letter")?.getBoundingClientRect();
          const label = choice.querySelector("strong")?.getBoundingClientRect();
          const radio = choice.querySelector(".choice-radio")?.getBoundingClientRect();
          if (letter && label && radio && (Math.abs((letter.top + letter.bottom) / 2 - (radio.top + radio.bottom) / 2) > 3 || radio.left < label.right)) {
            visualDefects.push(`mobile choice ${index + 1} marker alignment is invalid`);
          }
        });
        if (innerWidth < 1100) {
          document.querySelectorAll(".exam-body").forEach((body, index) => {
            const style = getComputedStyle(body);
            if (/hidden/.test(style.overflowY) && body.scrollHeight > body.clientHeight + 2) visualDefects.push(`mobile exam body ${index + 1} clips question content`);
          });
        }
        const scaleValue = parseFloat(getComputedStyle(document.getElementById("app")).getPropertyValue("--cockpit-scale")) || 1;
        const physicalScale = innerWidth >= 1100 ? scaleValue : 1;
        const visible = (node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };
        const typeRules = [
          [".brand strong", 16, "brand"],
          [".brand span", 11, "brand subtitle"],
          [".page-head h1, .hub-hero h1, .auth-form-card h1, .modal-heading h2", 30, "page title"],
          ["label", 12, "field label"],
          ["button:not(.question-chip):not(.icon-only):not(.mobile-bottom-nav button)", 13, "button label"],
          [".question-prompt", 18, "question prompt"],
          [".choice strong", 15, "answer choice"],
          [".hub-mode small, .hub-record small, .allocation-copy small, .result-insight small, .mistake-table-head, .table-head", 11, "supporting copy"]
        ];
        typeRules.forEach(([selector, minimum, role]) => {
          document.querySelectorAll(selector).forEach((node) => {
            if (!visible(node)) return;
            const physicalSize = parseFloat(getComputedStyle(node).fontSize) * physicalScale;
            if (physicalSize + 0.1 < minimum) visualDefects.push(`${role} '${(node.textContent || "").trim().slice(0, 42)}' is ${physicalSize.toFixed(1)}px physical; minimum ${minimum}px`);
          });
        });
        const controlMinimum = innerWidth < 1100 ? 44 : 34;
        document.querySelectorAll("button:not(.question-chip):not(.icon-only):not(.signed-primary-nav button):not(.mobile-bottom-nav button)").forEach((button) => {
          if (!visible(button)) return;
          const height = button.getBoundingClientRect().height;
          if (height + 0.1 < controlMinimum) visualDefects.push(`control '${(button.textContent || button.getAttribute("aria-label") || "").trim().slice(0, 42)}' is ${height.toFixed(1)}px high; minimum ${controlMinimum}px`);
        });
        (contract.anchors || []).forEach((selector) => {
          const node = document.querySelector(selector);
          if (!node || !visible(node) || !node.matches(".card, .hub-panel, .v3-panel, .question-panel, [role='dialog'], .auth-form-card")) return;
          const style = getComputedStyle(node);
          const borders = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(parseFloat);
          if (borders.some((width) => !Number.isFinite(width) || width < 0.5)) visualDefects.push(`primary frame '${selector}' does not have continuous four-side border ownership`);
        });
        if (contract.scrollOwner) {
          const owner = document.querySelector(contract.scrollOwner);
          if (!owner) visualDefects.push(`missing declared scroll owner '${contract.scrollOwner}'`);
          else if (owner.scrollHeight > owner.clientHeight + 2 && !/auto|scroll/.test(getComputedStyle(owner).overflowY)) visualDefects.push(`declared scroll owner '${contract.scrollOwner}' cannot vertically scroll its content`);
        }
        return {
          viewport: [innerWidth, innerHeight],
          body: [document.body.scrollWidth, document.body.scrollHeight],
          document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
          frame: frameRect ? { x: frameRect.x, y: frameRect.y, width: frameRect.width, height: frameRect.height } : null,
          scale: getComputedStyle(document.getElementById("app")).getPropertyValue("--cockpit-scale").trim(),
          view: document.getElementById("app")?.dataset.view,
          overflow,
          runningAnimationsUnderReducedMotion: document.getAnimations().filter((animation) => animation.playState === "running").length,
          visualDefects,
          visibleContentBottom,
          reachableDocumentBottom
        };
      }, stateContract);
      const file = `${safeName(state)}-${viewport.label}.png`;
      await page.screenshot({ path: path.join(outputDir, file), fullPage: process.env.CSC_QA_FULL_PAGE === "1" });
      const entry = { state, viewport, file, reference: stateContract.reference, referenceApproval: stateContract.approval, contractId: stateContract.id, metrics, errors: [...pageErrors] };
      report.entries.push(entry);
      const documentOverflow = metrics.body[0] > viewport.width || (viewport.width >= 1100 && metrics.body[1] > viewport.height);
      if (pageErrors.length || documentOverflow || metrics.runningAnimationsUnderReducedMotion || metrics.visualDefects.length) report.errors.push(entry);
    }
    await context.close();
  }

  await browser.close();
  const expectedScreenshots = selectedStates.length * selectedViewports.length;
  report.coverage = {
    expectedStates: selectedStates.length,
    coveredStates: new Set(report.entries.map((entry) => entry.state)).size,
    expectedViewports: selectedViewports.length,
    coveredViewports: new Set(report.entries.map((entry) => entry.viewport.label)).size,
    expectedScreenshots,
    capturedScreenshots: report.entries.length,
    missingScreenshots: expectedScreenshots - report.entries.length,
    draftReferenceEntries: report.entries.filter((entry) => entry.referenceApproval !== "approved").length
  };
  if (report.coverage.missingScreenshots) report.errors.push({ coverage: report.coverage });
  report.verdicts = {
    automatedGeometry: report.errors.length || report.coverage.missingScreenshots ? "failed" : "passed",
    opticalParity: "pending_manual_reference_comparison",
    functional: "not_run",
    reachability: "not_run",
    liveDeployment: /^https:\/\//i.test(baseUrl) ? (report.errors.length ? "failed" : "pending_external_edge_smoke") : "not_run"
  };
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  const summary = {
    build: report.build,
    screenshots: `${report.entries.length}/${expectedScreenshots}`,
    consoleOrDocumentFailures: report.errors.length,
    elementOverflowSamples: report.entries.reduce((sum, entry) => sum + entry.metrics.overflow.length, 0),
    visualDefects: report.entries.reduce((sum, entry) => sum + entry.metrics.visualDefects.length, 0),
    runningAnimationsUnderReducedMotion: report.entries.reduce((sum, entry) => sum + entry.metrics.runningAnimationsUnderReducedMotion, 0),
    verdicts: report.verdicts
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (report.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
