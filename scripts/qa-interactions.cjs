"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/t0024-cockpit-interactions");
fs.mkdirSync(outputDir, { recursive: true });

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

const QA_CASES = {
  auth: {
    checks: ["create password reveal", "reset modal escape", "sign-in fields do not retain credentials", "pointer focus does not highlight auth field", "keyboard focus remains visible on auth field", "enter submits sign-in"],
    screenshots: ["auth-create-primary-hover", "auth-create-password-visible", "auth-create-to-signin", "auth-reset-open", "auth-reset-escape-close", "auth-reset-success", "auth-reset-invalid-email", "auth-signin-pointer-focus-quiet", "auth-signin-keyboard-focus-visible", "auth-signin-enter-submit"]
  },
  dashboard: {
    checks: ["navigation label reveal does not shift header", "navigation label appears on hover", "pointer focus does not highlight account field", "keyboard focus remains visible in account settings", "account audio exposes the approved transport", "account password reveal", "account deletion requires confirmation text", "account deletion enables after exact confirmation", "delete account escape"],
    screenshots: ["dashboard-navigation-label-hover", "dashboard-focused-practice-hover", "dashboard-account-keyboard-focus", "account-settings-open", "account-field-pointer-focus-quiet", "account-field-keyboard-focus-visible", "account-audio-settings-enabled", "account-password-dialog-open", "account-password-visible", "account-settings-closed", "account-delete-confirmation-open", "account-delete-confirmation-armed", "account-delete-confirmation-cancelled"]
  },
  setup: {
    checks: ["setup facts stay contained, single-line, and separated", "setup uses the approved V5 instrument deck", "setup section typography and icons are readable", "purposeful motion contract is present", "setup starts exam"],
    screenshots: ["setup-spacing-and-motion-audit", "setup-options-modified", "setup-start-exam"]
  },
  examControls: {
    checks: ["desktop mobile-close hidden", "next disabled without answer", "next enabled with answer", "pause is static", "submit escape closes", "submit reaches results"],
    screenshots: ["exam-cleared-next-disabled", "exam-answer-selected", "exam-answer-flagged", "exam-next-question", "exam-explicit-skip", "exam-pause-open", "exam-resumed", "exam-submit-open", "exam-review-unanswered", "exam-review-flagged", "exam-submitted-results"]
  },
  examNavigator: {
    gate: "reachability",
    checks: ["collapsed Verbal More is visibly reachable", "expanded Verbal section contains all 60 questions", "expanded Verbal section contains question 21", "expanded Verbal section contains question 51", "expanded Verbal section contains question 80", "Verbal shared stimuli are labeled as reading sets", "navigator opens question 51 by visible wheel path", "navigator opens question 80 by visible wheel path", "navigator returns from question 80 to question 21 by visible wheel path", "Verbal Less is visibly reachable", "Less collapses the Verbal section", "all lower sections remain visibly reachable after Less"],
    screenshots: ["exam-navigator-collapsed-start", "exam-navigator-more-open", "exam-question-51-visible-path", "exam-question-80-visible-path", "exam-question-21-after-80-visible-path", "exam-navigator-before-less", "exam-navigator-after-less", "exam-navigator-lower-sections-reachable"]
  },
  timing: {
    checks: ["per-question time survives visible navigation", "exit returns home without submitting", "exit leaves attempt resumable"],
    screenshots: ["exam-question-time-restored", "exam-save-and-exit-home"]
  },
  stimuli: {
    checks: ["chart modal keeps its visual type", "chart escape closes", "passage modal keeps its visual type", "passage escape closes", "table modal keeps its visual type", "table escape closes", "graph modal keeps its visual type", "graph escape closes"],
    screenshots: ["chart-expanded-modal", "chart-modal-closed", "passage-expanded-modal", "passage-modal-closed", "table-expanded-modal", "table-modal-closed", "graph-expanded-modal", "graph-modal-closed"]
  },
  practice: {
    checks: ["mistake table headings have safe vertical clearance"],
    screenshots: ["practice-customized", "practice-custom-started", "practice-mistakes-tab", "practice-mistake-answer-review", "practice-flagged-tab", "practice-flagged-answer-review"]
  },
  progress: {
    checks: ["progress overflow menu visible", "delete attempt escape"],
    screenshots: ["progress-filter-full", "progress-filter-practice", "progress-filter-all", "progress-row-overflow-open", "progress-delete-attempt-open", "progress-delete-attempt-cancelled"]
  },
  results: {
    checks: [],
    screenshots: ["results-review-answers", "results-practice-weakest", "results-retake-same-version", "practice-results-repeat-drill", "practice-results-change-practice"]
  },
  review: {
    checks: ["review next changes question", "review previous returns question", "review empty disables previous", "review empty disables next"],
    screenshots: ["review-filter-wrong", "review-filter-correct", "review-filter-flagged", "review-filter-all", "review-explanation-scrolled", "review-next-question", "review-previous-question", "review-filter-no-matches"]
  }
};

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
  const context = await browser.newContext({ viewport: { width: 1672, height: 942 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.setDefaultNavigationTimeout(30000);
  const report = { baseUrl, createdAt: new Date().toISOString(), browser: "Microsoft Edge", build: buildMetadata(), screenshots: [], checks: [], tests: [], errors: [] };
  const runtimeErrors = [];
  const seenCheckNames = new Set();
  const seenScreenshotNames = new Set();
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`); });

  async function gotoFixture(name) {
    runtimeErrors.length = 0;
    await page.goto(`${baseUrl}?fixture=${encodeURIComponent(name)}&qa=interactions`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(80);
  }

  async function screenshot(name) {
    if (seenScreenshotNames.has(name)) report.errors.push({ name, error: "duplicate screenshot name" });
    seenScreenshotNames.add(name);
    await page.waitForTimeout(70);
    const file = `${safeName(name)}.png`;
    const metrics = await page.evaluate(() => {
      const frame = document.querySelector(".cockpit-frame")?.getBoundingClientRect();
      return {
        view: document.getElementById("app")?.dataset.view,
        modal: document.querySelector("[role='dialog'],[role='alertdialog']")?.className || null,
        focus: document.activeElement?.outerHTML?.slice(0, 180) || null,
        body: [document.body.scrollWidth, document.body.scrollHeight],
        frame: frame ? [frame.x, frame.y, frame.width, frame.height] : null
      };
    });
    await page.screenshot({ path: path.join(outputDir, file), fullPage: false });
    report.screenshots.push({ name, file, metrics, runtimeErrors: [...runtimeErrors] });
    if (runtimeErrors.length || metrics.body[0] > 1672 || metrics.body[1] > 942) {
      report.errors.push({ name, runtimeErrors: [...runtimeErrors], metrics });
    }
  }

  async function check(name, condition, details = "") {
    if (seenCheckNames.has(name)) {
      report.checks.push({ name, passed: false, details: "duplicate check name" });
      report.errors.push({ name, details: "duplicate check name" });
      return;
    }
    seenCheckNames.add(name);
    const passed = Boolean(await condition());
    report.checks.push({ name, passed, details });
    if (!passed) report.errors.push({ name, details });
  }

  async function test(name, contract, callback) {
    const checkStart = report.checks.length;
    const screenshotStart = report.screenshots.length;
    let callbackError = "";
    try {
      await callback();
    } catch (error) {
      callbackError = error.message;
      report.errors.push({ name, error: error.message, stack: error.stack });
    }
    const checkEntries = report.checks.slice(checkStart);
    const checks = checkEntries.map((entry) => entry.name);
    const screenshots = report.screenshots.slice(screenshotStart).map((entry) => entry.name);
    const missingChecks = contract.checks.filter((entry) => !checks.includes(entry));
    const unexpectedChecks = checks.filter((entry) => !contract.checks.includes(entry));
    const missingScreenshots = contract.screenshots.filter((entry) => !screenshots.includes(entry));
    const unexpectedScreenshots = screenshots.filter((entry) => !contract.screenshots.includes(entry));
    const failedChecks = checkEntries.filter((entry) => !entry.passed).map((entry) => entry.name);
    const coveragePassed = !callbackError && !missingChecks.length && !unexpectedChecks.length && !missingScreenshots.length && !unexpectedScreenshots.length;
    const result = { name, gate: contract.gate || "functional", expectedChecks: contract.checks.length, executedChecks: checks.length, expectedScreenshots: contract.screenshots.length, capturedScreenshots: screenshots.length, missingChecks, unexpectedChecks, missingScreenshots, unexpectedScreenshots, failedChecks, callbackError, coveragePassed };
    report.tests.push(result);
    if (!coveragePassed) report.errors.push({ name, coverage: result });
  }

  async function containedIn(locator, owner, inset = 2) {
    if (await locator.count() !== 1 || await owner.count() !== 1) return false;
    const target = await locator.boundingBox();
    const bounds = await owner.boundingBox();
    return Boolean(target && bounds
      && target.x >= bounds.x + inset
      && target.x + target.width <= bounds.x + bounds.width - inset
      && target.y >= bounds.y + inset
      && target.y + target.height <= bounds.y + bounds.height - inset);
  }

  async function wheelUntilContained(locator, owner, direction, maxSteps = 36) {
    const bounds = await owner.boundingBox();
    if (!bounds) return false;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    for (let step = 0; step <= maxSteps; step += 1) {
      if (await containedIn(locator, owner)) return true;
      await page.mouse.wheel(0, direction * 220);
      await page.waitForTimeout(35);
    }
    return false;
  }

  async function clickContained(locator, owner) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (await containedIn(locator, owner)) {
        const target = await locator.boundingBox();
        if (target) {
          await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
          return;
        }
      }
      await page.waitForTimeout(25);
    }
    throw new Error(`Control is not visibly contained: ${await locator.first().getAttribute("data-action") || await locator.first().textContent()}`);
  }

  await test("auth controls", QA_CASES.auth, async () => {
    await gotoFixture("create");
    await page.locator("[data-action='signup-submit']").hover();
    await screenshot("auth-create-primary-hover");
    await page.locator("input[name='password']").fill("ReviewPass123");
    await page.locator("input[name='confirmPassword']").fill("ReviewPass123");
    await page.locator("[data-action='toggle-password']").first().click();
    await check("create password reveal", async () => await page.locator("input[name='password']").getAttribute("type") === "text");
    await screenshot("auth-create-password-visible");
    await page.locator("[data-action='show-signin']").click();
    await screenshot("auth-create-to-signin");
    await page.locator("input[name='email']").fill("john.smith@email.com");
    await page.locator("[data-action='forgot-password']").click();
    await screenshot("auth-reset-open");
    await page.keyboard.press("Escape");
    await check("reset modal escape", async () => await page.locator("[role='dialog']").count() === 0);
    await screenshot("auth-reset-escape-close");
    await page.locator("[data-action='forgot-password']").click();
    await page.locator("[data-action='send-reset']").click();
    await screenshot("auth-reset-success");
    await gotoFixture("forgot-error");
    await screenshot("auth-reset-invalid-email");
    await gotoFixture("select");
    await check("sign-in fields do not retain credentials", async () =>
      await page.locator("input[name='email']").inputValue() === "" && await page.locator("input[name='password']").inputValue() === "");
    const signInEmail = page.locator("input[name='email']");
    await signInEmail.click();
    await check("pointer focus does not highlight auth field", async () => await signInEmail.evaluate((input) => {
      const app = document.getElementById("app");
      const field = input.closest(".field-with-icon");
      const style = getComputedStyle(field);
      return app?.dataset.inputMode === "pointer" && style.boxShadow === "none" && style.outlineStyle === "none";
    }));
    await screenshot("auth-signin-pointer-focus-quiet");
    await page.keyboard.press("Tab");
    await check("keyboard focus remains visible on auth field", async () => await page.evaluate(() => {
      const app = document.getElementById("app");
      const field = document.activeElement?.closest(".field-with-icon");
      if (!field) return false;
      const style = getComputedStyle(field);
      return app?.dataset.inputMode === "keyboard" && (style.outlineStyle !== "none" || style.borderColor === "rgb(33, 222, 215)");
    }));
    await screenshot("auth-signin-keyboard-focus-visible");
    await page.locator("input[name='email']").fill("john.smith@email.com");
    await page.locator("input[name='password']").fill("ReviewPass123");
    await page.locator("input[name='password']").press("Enter");
    await check("enter submits sign-in", async () => await page.locator(".study-hub").count() === 1);
    await screenshot("auth-signin-enter-submit");
  });

  await test("dashboard and account", QA_CASES.dashboard, async () => {
    await gotoFixture("dashboard");
    const primaryNav = page.locator(".signed-primary-nav button").first();
    const navWidthBefore = await primaryNav.evaluate((node) => node.getBoundingClientRect().width);
    await primaryNav.hover();
    await page.waitForTimeout(220);
    const navWidthAfter = await primaryNav.evaluate((node) => node.getBoundingClientRect().width);
    await check("navigation label reveal does not shift header", async () => Math.abs(navWidthAfter - navWidthBefore) < 1);
    await check("navigation label appears on hover", async () => Number(await primaryNav.locator(".nav-label").evaluate((node) => getComputedStyle(node).opacity)) > 0.9);
    await screenshot("dashboard-navigation-label-hover");
    await page.locator(".hub-mode.practice").hover();
    await screenshot("dashboard-focused-practice-hover");
    await page.locator(".account-button").focus();
    await screenshot("dashboard-account-keyboard-focus");
    await page.locator(".account-button").click();
    await screenshot("account-settings-open");
    const nickname = page.locator(".account-settings-modal input[name='nickname']");
    await nickname.click();
    await check("pointer focus does not highlight account field", async () => await nickname.evaluate((input) => {
      const app = document.getElementById("app");
      const style = getComputedStyle(input);
      return app?.dataset.inputMode === "pointer" && style.boxShadow === "none" && style.outlineStyle === "none";
    }));
    await screenshot("account-field-pointer-focus-quiet");
    await page.keyboard.press("Tab");
    await check("keyboard focus remains visible in account settings", async () => await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return document.getElementById("app")?.dataset.inputMode === "keyboard" && style.outlineStyle !== "none";
    }));
    await screenshot("account-field-keyboard-focus-visible");
    await page.locator("[data-audio-category='classical']").click();
    await page.locator("[data-audio-track]").selectOption({ index: 1 });
    await page.locator("[data-action='toggle-music']").click();
    await page.locator("[data-action='toggle-sfx']").click();
    await page.locator("[data-audio-volume='musicVolume']").fill("0.25");
    await check("account audio exposes the approved transport", async () =>
      await page.locator("[data-action='audio-previous']").count() === 1
      && await page.locator("[data-action='audio-next']").count() === 1
      && await page.locator("[data-action='toggle-audio-shuffle']").count() === 1
      && await page.locator("[data-action='toggle-audio-mute']").count() === 1);
    await screenshot("account-audio-settings-enabled");
    await page.locator("[data-action='open-password']").click();
    await screenshot("account-password-dialog-open");
    await page.locator("input[name='currentPassword']").fill("ReviewPass123");
    await page.locator(".password-change-form [data-action='toggle-password']").first().click();
    await check("account password reveal", async () => await page.locator("input[name='currentPassword']").getAttribute("type") === "text");
    await screenshot("account-password-visible");
    await page.locator(".password-modal .btn.secondary").filter({ hasText: "Cancel" }).click();
    await page.locator(".account-settings-modal [data-action='close-modal']").click();
    await screenshot("account-settings-closed");
    await page.locator(".account-button").click();
    await page.locator("[data-action='delete-profile']").click();
    await screenshot("account-delete-confirmation-open");
    await check("account deletion requires confirmation text", async () => await page.locator("[data-action='confirm-delete-account']").isDisabled());
    await page.locator("[data-delete-confirm]").fill("DELETE");
    await check("account deletion enables after exact confirmation", async () => !(await page.locator("[data-action='confirm-delete-account']").isDisabled()));
    await screenshot("account-delete-confirmation-armed");
    await page.keyboard.press("Escape");
    await check("delete account escape", async () => await page.locator("[role='alertdialog']").count() === 0);
    await screenshot("account-delete-confirmation-cancelled");
  });

  await test("setup controls", QA_CASES.setup, async () => {
    await gotoFixture("setup");
    await check("setup facts stay contained, single-line, and separated", async () => await page.locator(".setup-facts .instrument-cell").evaluateAll((cells) => cells.every((cell) => {
      const bounds = cell.getBoundingClientRect();
      const value = cell.querySelector("strong")?.getBoundingClientRect();
      const valueStyle = getComputedStyle(cell.querySelector("strong"));
      const labelNode = cell.querySelector(":scope > span:not(.instrument-icon)");
      const label = labelNode?.getBoundingClientRect();
      const contained = Array.from(cell.children).every((child) => {
        const rect = child.getBoundingClientRect();
        return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1;
      });
      const lineHeight = parseFloat(valueStyle.lineHeight);
      const singleLine = Number.isFinite(lineHeight) && value.height <= lineHeight * 1.25;
      return value && contained && singleLine && (!labelNode?.textContent.trim() || (label && value.bottom <= label.top + 0.5));
    })));
    await check("setup uses the approved V5 instrument deck", async () => await page.locator(".v5-instrument-deck").evaluate((deck) => {
      const cells = Array.from(deck.querySelectorAll(":scope > .instrument-cell"));
      const facts = cells.map((cell) => [cell.querySelector("strong")?.textContent.trim(), cell.querySelector(":scope > span:not(.instrument-icon)")?.textContent.trim()]);
      const iconsAreProminent = cells.every((cell) => cell.querySelector(".instrument-icon")?.getBoundingClientRect().width >= 64);
      const dividersAreVisible = cells.slice(0, -1).every((cell) => parseFloat(getComputedStyle(cell).borderRightWidth) >= 1);
      return JSON.stringify(facts) === JSON.stringify([["170", "Questions"], ["3h 10m", "Time Limit"], ["Free", "Movement"], ["Pause &", "Resume"]]) && iconsAreProminent && dividersAreVisible;
    }));
    await check("setup section typography and icons are readable", async () => await page.locator(".allocation-card").evaluateAll((cards) => cards.every((card) => {
      const icon = card.querySelector(".section-hud-icon")?.getBoundingClientRect();
      const title = card.querySelector(".allocation-copy strong");
      return icon?.width >= 46 && parseFloat(getComputedStyle(title).fontSize) >= 19;
    })));
    await check("purposeful motion contract is present", async () => await page.locator("[data-motion-purpose]").count() > 0);
    await screenshot("setup-spacing-and-motion-audit");
    const version = page.locator("select[name='versionId']");
    await version.selectOption({ index: Math.min(1, (await version.locator("option").count()) - 1) });
    const shuffle = page.locator("input[name='shuffleQuestions']");
    await shuffle.check({ force: true });
    await screenshot("setup-options-modified");
    await page.locator("[data-action='setup-submit']").click();
    await check("setup starts exam", async () => await page.locator(".exam-shell").count() === 1);
    await screenshot("setup-start-exam");
  });

  await test("exam answer controls", QA_CASES.examControls, async () => {
    await gotoFixture("exam-collapsed");
    await check("desktop mobile-close hidden", async () => !(await page.locator(".mobile-nav-close").isVisible()));
    await page.locator("[data-action='clear-answer']").click();
    await check("next disabled without answer", async () => await page.locator("[data-action='next-question']").isDisabled());
    await screenshot("exam-cleared-next-disabled");
    await page.locator("[data-choice='A']").click();
    await check("next enabled with answer", async () => !(await page.locator("[data-action='next-question']").isDisabled()));
    await screenshot("exam-answer-selected");
    await page.locator("[data-action='toggle-flag']").click();
    await screenshot("exam-answer-flagged");
    await page.locator("[data-action='next-question']").click();
    await screenshot("exam-next-question");
    await page.locator("[data-action='clear-answer']").click();
    await page.locator("[data-action='skip-question']").click();
    await screenshot("exam-explicit-skip");
    await page.locator("[data-action='pause-exam']").click();
    await screenshot("exam-pause-open");
    await page.keyboard.press("Escape");
    await check("pause is static", async () => await page.locator(".pause-modal").count() === 1);
    await page.locator("[data-action='resume-paused']").click();
    await screenshot("exam-resumed");
    await page.locator("[data-action='open-submit']").click();
    await screenshot("exam-submit-open");
    await page.keyboard.press("Escape");
    await check("submit escape closes", async () => await page.locator(".submit-modal").count() === 0);
    await page.locator("[data-action='open-submit']").click();
    await page.locator("[data-action='review-unanswered']").click();
    await screenshot("exam-review-unanswered");
    await page.locator("[data-action='open-submit']").click();
    await page.locator("[data-action='review-flagged']").click();
    await screenshot("exam-review-flagged");
    await page.locator("[data-action='open-submit']").click();
    await page.locator("[data-action='confirm-submit']").click();
    await check("submit reaches results", async () => await page.locator(".results-page").count() === 1);
    await screenshot("exam-submitted-results");
  });

  await test("exam full section navigation", QA_CASES.examNavigator, async () => {
    await gotoFixture("exam-collapsed");
    const nav = page.locator(".exam-nav");
    const verbalGroup = () => page.locator(".exam-nav details.question-group").filter({ has: page.getByText("Verbal Ability", { exact: true }) }).first();
    const moreChip = verbalGroup().getByRole("button", { name: "More", exact: true });
    const moreReachable = await wheelUntilContained(moreChip, nav, 1);
    await check("collapsed Verbal More is visibly reachable", async () => moreReachable);
    await screenshot("exam-navigator-collapsed-start");
    await clickContained(moreChip, nav);
    await page.waitForTimeout(80);
    await check("expanded Verbal section contains all 60 questions", async () => await verbalGroup().locator("[data-goto]").count() === 60);
    await check("expanded Verbal section contains question 21", async () => await verbalGroup().locator("[data-goto='20']").count() === 1);
    await check("expanded Verbal section contains question 51", async () => await verbalGroup().locator("[data-goto='50']").count() === 1);
    await check("expanded Verbal section contains question 80", async () => await verbalGroup().locator("[data-goto='79']").count() === 1);
    await check("Verbal shared stimuli are labeled as reading sets", async () => await verbalGroup().getByText("Reading Set A", { exact: true }).count() === 1);
    await screenshot("exam-navigator-more-open");

    const question51 = verbalGroup().locator("[data-goto='50']");
    const question51Reachable = await wheelUntilContained(question51, nav, 1);
    if (question51Reachable) await clickContained(question51, nav);
    await check("navigator opens question 51 by visible wheel path", async () => question51Reachable && /Item 51\b/i.test(await page.locator(".question-index").innerText()));
    await screenshot("exam-question-51-visible-path");

    const question80 = verbalGroup().locator("[data-goto='79']");
    const question80Reachable = await wheelUntilContained(question80, nav, 1);
    if (question80Reachable) await clickContained(question80, nav);
    await check("navigator opens question 80 by visible wheel path", async () => question80Reachable && /Item 80\b/i.test(await page.locator(".question-index").innerText()));
    await screenshot("exam-question-80-visible-path");

    const question21 = verbalGroup().locator("[data-goto='20']");
    const question21Reachable = await wheelUntilContained(question21, nav, -1);
    if (question21Reachable) await clickContained(question21, nav);
    await check("navigator returns from question 80 to question 21 by visible wheel path", async () => question21Reachable && /Item 21\b/i.test(await page.locator(".question-index").innerText()));
    await screenshot("exam-question-21-after-80-visible-path");

    const lessChip = verbalGroup().getByRole("button", { name: "Less", exact: true });
    const lessReachable = await wheelUntilContained(lessChip, nav, 1);
    await check("Verbal Less is visibly reachable", async () => lessReachable);
    await screenshot("exam-navigator-before-less");
    await clickContained(lessChip, nav);
    await page.waitForTimeout(80);
    await check("Less collapses the Verbal section", async () => await verbalGroup().locator("[data-goto]").count() < 60 && await verbalGroup().getByRole("button", { name: "More", exact: true }).count() === 1);
    await screenshot("exam-navigator-after-less");

    const numericalSummary = page.locator(".exam-nav details.question-group").filter({ has: page.getByText("Numerical Ability", { exact: true }) }).locator("summary");
    const analyticalSummary = page.locator(".exam-nav details.question-group").filter({ has: page.getByText("Analytical Ability", { exact: true }) }).locator("summary");
    const numericalReachable = await wheelUntilContained(numericalSummary, nav, 1);
    const analyticalReachable = await wheelUntilContained(analyticalSummary, nav, 1);
    await check("all lower sections remain visibly reachable after Less", async () => numericalReachable && analyticalReachable);
    await screenshot("exam-navigator-lower-sections-reachable");
  });

  await test("question timing and non-submitting exit", QA_CASES.timing, async () => {
    runtimeErrors.length = 0;
    await page.goto(`${baseUrl}?fixture=exam&qaTiming=1&qa=timing`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const initial = Number(await page.locator(".question-panel").getAttribute("data-question-seconds"));
    await page.waitForTimeout(2250);
    const nav = page.locator(".exam-nav");
    const verbalGroup = page.locator(".exam-nav details.question-group").filter({ has: page.getByText("Verbal Ability", { exact: true }) }).first();
    if (!(await verbalGroup.evaluate((group) => group.open))) {
      const summary = verbalGroup.locator("summary");
      await wheelUntilContained(summary, nav, 1);
      await clickContained(summary, nav);
    }
    const more = verbalGroup.getByRole("button", { name: "More", exact: true });
    if (await more.count()) {
      await wheelUntilContained(more, nav, 1);
      await clickContained(more, nav);
    }
    const nextQuestion = verbalGroup.locator("[data-goto='50']");
    const nextReachable = await wheelUntilContained(nextQuestion, nav, 1);
    if (nextReachable) await clickContained(nextQuestion, nav);
    const nextChanged = /Item 51\b/i.test(await page.locator(".question-index").innerText());
    await page.waitForTimeout(1100);
    const originalQuestion = verbalGroup.locator("[data-goto='42']");
    const originalReachable = await wheelUntilContained(originalQuestion, nav, -1);
    if (originalReachable) await clickContained(originalQuestion, nav);
    const originalChanged = (await page.locator(".question-index").innerText()).includes("43");
    const resumed = Number(await page.locator(".question-panel").getAttribute("data-question-seconds"));
    await check("per-question time survives visible navigation", async () => nextReachable && nextChanged && originalReachable && originalChanged && resumed >= initial + 0.8, `initial=${initial}, resumed=${resumed}, nextReachable=${nextReachable}, nextChanged=${nextChanged}, originalReachable=${originalReachable}, originalChanged=${originalChanged}`);
    await screenshot("exam-question-time-restored");
    await page.locator("[data-action='pause-exam']").click();
    await page.locator(".pause-modal [data-action='save-exit']").click();
    await check("exit returns home without submitting", async () => await page.locator(".study-hub").count() === 1);
    await check("exit leaves attempt resumable", async () => await page.locator("[data-action='resume-exam']").count() === 1);
    await screenshot("exam-save-and-exit-home");
  });

  await test("stimulus modals", QA_CASES.stimuli, async () => {
    for (const [fixture, noun] of [["graph", "chart"], ["passage", "passage"], ["data-table", "table"], ["line-chart", "graph"]]) {
      await gotoFixture(fixture);
      await page.locator("[data-action='open-chart']").click();
      await check(`${noun} modal keeps its visual type`, async () => await page.locator(`.chart-modal [data-stimulus-kind]`).getAttribute("data-stimulus-kind") === ({ chart: "grouped-bars", passage: "passage", table: "table", graph: "line" })[noun]);
      await screenshot(`${noun}-expanded-modal`);
      await page.keyboard.press("Escape");
      await check(`${noun} escape closes`, async () => await page.locator(".chart-modal").count() === 0);
      await screenshot(`${noun}-modal-closed`);
    }
  });

  await test("practice and review tabs", QA_CASES.practice, async () => {
    await gotoFixture("practice");
    await page.locator("input[name='category'][value='Numerical Ability']").check({ force: true });
    await page.locator("input[name='count'][value='30']").evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.locator("input[name='difficulty'][value='hard']").check({ force: true });
    await screenshot("practice-customized");
    await page.locator("[data-action='custom-practice-submit']").click();
    await screenshot("practice-custom-started");
    await gotoFixture("practice");
    await page.locator("[data-practice-review-tab='mistakes']").click();
    await check("mistake table headings have safe vertical clearance", async () => await page.locator(".mistake-table-head").evaluate((head) => {
      const bounds = head.getBoundingClientRect();
      return Array.from(head.children).every((label) => {
        const rect = label.getBoundingClientRect();
        return rect.top - bounds.top >= 12 && bounds.bottom - rect.bottom >= 12;
      });
    }));
    await screenshot("practice-mistakes-tab");
    await page.locator("[data-review-mistakes]").first().click();
    await screenshot("practice-mistake-answer-review");
    await gotoFixture("practice");
    await page.locator("[data-practice-review-tab='flagged']").click();
    await screenshot("practice-flagged-tab");
    await page.locator("[data-open-review]").first().click();
    await screenshot("practice-flagged-answer-review");
  });

  await test("progress filters and row menu", QA_CASES.progress, async () => {
    await gotoFixture("progress");
    for (const filter of ["full", "practice", "all"]) {
      await page.locator(`[data-recent-tab='${filter}']`).click();
      await screenshot(`progress-filter-${filter}`);
    }
    await page.locator("[data-overflow]").first().click();
    await check("progress overflow menu visible", async () => await page.locator(".overflow-menu").isVisible());
    await screenshot("progress-row-overflow-open");
    await page.locator("[data-attempt-delete]").click();
    await screenshot("progress-delete-attempt-open");
    await page.keyboard.press("Escape");
    await check("delete attempt escape", async () => await page.locator("[role='alertdialog']").count() === 0);
    await screenshot("progress-delete-attempt-cancelled");
  });

  await test("results actions", QA_CASES.results, async () => {
    await gotoFixture("results");
    await page.locator("[data-action='review-answers']").click();
    await screenshot("results-review-answers");
    await gotoFixture("results");
    await page.locator("[data-action='practice-weakest']").click();
    await screenshot("results-practice-weakest");
    await gotoFixture("results");
    await page.locator("[data-action='retake-same-version']").click();
    await screenshot("results-retake-same-version");
    await gotoFixture("results-practice");
    await page.locator("[data-action='repeat-practice']").click();
    await screenshot("practice-results-repeat-drill");
    await gotoFixture("results-practice");
    await page.locator("[data-action='change-practice']").click();
    await screenshot("practice-results-change-practice");
  });

  await test("answer review filters", QA_CASES.review, async () => {
    await gotoFixture("review");
    for (const filter of ["wrong", "correct", "flagged", "all"]) {
      await page.locator(`[data-review-filter='${filter}']`).click();
      await screenshot(`review-filter-${filter}`);
    }
    await page.locator(".review-question-scroll").evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await screenshot("review-explanation-scrolled");
    const next = page.locator("[data-action='review-next']");
    const firstQuestion = await page.locator(".review-question-title, .review-question-number, .question-index").first().textContent();
    await next.click();
    const secondQuestion = await page.locator(".review-question-title, .review-question-number, .question-index").first().textContent();
    await check("review next changes question", async () => secondQuestion !== firstQuestion);
    await screenshot("review-next-question");
    const previous = page.locator("[data-action='review-prev']");
    await previous.click();
    const returnedQuestion = await page.locator(".review-question-title, .review-question-number, .question-index").first().textContent();
    await check("review previous returns question", async () => returnedQuestion === firstQuestion);
    await screenshot("review-previous-question");
    await gotoFixture("review-empty");
    await check("review empty disables previous", async () => await page.locator("[data-action='review-prev']").isDisabled());
    await check("review empty disables next", async () => await page.locator("[data-action='review-next']").isDisabled());
    await screenshot("review-filter-no-matches");
  });

  await browser.close();
  const expectedChecks = Object.values(QA_CASES).reduce((sum, entry) => sum + entry.checks.length, 0);
  const expectedScreenshots = Object.values(QA_CASES).reduce((sum, entry) => sum + entry.screenshots.length, 0);
  const missingChecks = report.tests.reduce((sum, entry) => sum + entry.missingChecks.length, 0);
  const missingScreenshots = report.tests.reduce((sum, entry) => sum + entry.missingScreenshots.length, 0);
  const gateVerdict = (gate) => report.tests.filter((entry) => entry.gate === gate).every((entry) => entry.coveragePassed && !entry.failedChecks.length);
  report.coverage = {
    expectedChecks,
    executedChecks: report.checks.length,
    expectedScreenshots,
    capturedScreenshots: report.screenshots.length,
    missingChecks,
    missingScreenshots,
    skippedRequired: missingChecks + missingScreenshots
  };
  report.verdicts = {
    functional: gateVerdict("functional") ? "passed" : "failed",
    reachability: gateVerdict("reachability") ? "passed" : "failed",
    opticalParity: "not_run",
    liveDeployment: /^https:\/\//i.test(baseUrl) ? (report.errors.length ? "failed" : "pending_external_edge_smoke") : "not_run"
  };
  if (report.coverage.executedChecks !== expectedChecks || report.coverage.capturedScreenshots !== expectedScreenshots || report.coverage.skippedRequired) {
    report.errors.push({ coverage: report.coverage });
  }
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  const summary = {
    build: report.build,
    screenshots: `${report.screenshots.length}/${expectedScreenshots}`,
    checks: `${report.checks.length}/${expectedChecks}`,
    passedChecks: report.checks.filter((entry) => entry.passed).length,
    skippedRequired: report.coverage.skippedRequired,
    verdicts: report.verdicts,
    failures: report.errors.length
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (report.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
