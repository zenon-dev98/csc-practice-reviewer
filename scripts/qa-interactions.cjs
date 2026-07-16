"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/t0024-cockpit-interactions");
fs.mkdirSync(outputDir, { recursive: true });

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1672, height: 942 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.setDefaultNavigationTimeout(30000);
  const report = { baseUrl, createdAt: new Date().toISOString(), browser: "Microsoft Edge", screenshots: [], checks: [], errors: [] };
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`); });

  async function gotoFixture(name) {
    runtimeErrors.length = 0;
    await page.goto(`${baseUrl}?fixture=${encodeURIComponent(name)}&qa=interactions`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(80);
  }

  async function screenshot(name) {
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
    const passed = Boolean(await condition());
    report.checks.push({ name, passed, details });
    if (!passed) report.errors.push({ name, details });
  }

  async function test(name, callback) {
    try {
      await callback();
    } catch (error) {
      report.errors.push({ name, error: error.message, stack: error.stack });
    }
  }

  await test("auth controls", async () => {
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

  await test("dashboard and account", async () => {
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
    await page.locator("[data-action='toggle-audio-master']").click();
    await page.locator("[data-audio-volume='musicVolume']").fill("0.25");
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

  await test("setup controls", async () => {
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
    await check("setup section typography and icons are readable", async () => await page.locator(".allocation-card").evaluateAll((cards) => cards.every((card) => {
      const icon = card.querySelector(".section-hud-icon")?.getBoundingClientRect();
      const title = card.querySelector(".allocation-copy strong");
      return icon?.width >= 46 && parseFloat(getComputedStyle(title).fontSize) >= 19;
    })));
    await check("decorative animations are fully retired", async () => await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length === 0));
    await screenshot("setup-spacing-and-motion-audit");
    const version = page.locator("select[name='versionId']");
    if (await version.count()) await version.selectOption({ index: Math.min(1, (await version.locator("option").count()) - 1) });
    const shuffle = page.locator("input[name='shuffleQuestions']");
    if (await shuffle.count()) await shuffle.check({ force: true });
    await screenshot("setup-options-modified");
    await page.locator("[data-action='setup-submit']").click();
    await check("setup starts exam", async () => await page.locator(".exam-shell").count() === 1);
    await screenshot("setup-start-exam");
  });

  await test("exam answer controls", async () => {
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
    const more = page.locator(".exam-nav .more-chip:visible").first();
    if (await more.count()) {
      const nav = page.locator(".exam-nav");
      await more.evaluate((node) => node.scrollIntoView({ block: "center" }));
      const scrollBeforeMore = await nav.evaluate((node) => node.scrollTop);
      await more.click();
      const scrollAfterMore = await nav.evaluate((node) => node.scrollTop);
      await check("exam navigator keeps scroll after More", async () => Math.abs(scrollAfterMore - scrollBeforeMore) < 3);
      await screenshot("exam-group-more");
      const less = page.locator(".more-chip", { hasText: "Less" }).first();
      if (await less.count()) {
        await less.scrollIntoViewIfNeeded();
        await check("expanded group disclosure remains inside navigator", async () => await less.evaluate((button) => {
          const nav = button.closest(".exam-nav")?.getBoundingClientRect();
          const rect = button.getBoundingClientRect();
          return nav && rect.left >= nav.left && rect.right <= nav.right && rect.top >= nav.top && rect.bottom <= nav.bottom;
        }));
        await screenshot("exam-group-more-lower-content");
        const scrollBeforeLess = await nav.evaluate((node) => node.scrollTop);
        await less.click();
        const scrollAfterLess = await nav.evaluate((node) => node.scrollTop);
        await check("exam navigator collapse keeps every section reachable", async () => await nav.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          const groups = Array.from(node.querySelectorAll("details.question-group"));
          const last = groups.at(-1)?.getBoundingClientRect();
          const validScroll = node.scrollTop >= 0 && node.scrollTop <= node.scrollHeight - node.clientHeight + 1;
          return validScroll && last && last.top >= bounds.top && last.bottom <= bounds.bottom;
        }), `before=${scrollBeforeLess}, after=${scrollAfterLess}`);
        await screenshot("exam-group-less");
      }
      await page.locator(".exam-nav").evaluate((node) => {
        node.querySelectorAll("details.question-group").forEach((group) => { group.open = true; });
      });
      await nav.evaluate((node) => { node.scrollTop = 0; });
      await nav.hover();
      await page.mouse.wheel(0, 260);
      await page.waitForTimeout(80);
      await check("exam navigator supports mouse wheel", async () => await nav.evaluate((node) => node.scrollTop > 0));
      const dragBox = await nav.boundingBox();
      if (dragBox) {
        await nav.evaluate((node) => { node.scrollTop = 180; });
        const dragBefore = await nav.evaluate((node) => node.scrollTop);
        await page.mouse.move(dragBox.x + 6, dragBox.y + dragBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(dragBox.x + 6, dragBox.y + dragBox.height / 2 - 90, { steps: 6 });
        await page.mouse.up();
        await check("exam navigator supports pointer drag", async () => await nav.evaluate((node, before) => node.scrollTop > before, dragBefore));
      }
      await screenshot("exam-navigator-wheel-and-drag");
    }
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

  await test("exam full section navigation", async () => {
    await gotoFixture("exam");
    const verbalGroup = () => page.locator(".exam-nav details.question-group").filter({ has: page.getByText("Verbal Ability", { exact: true }) }).first();
    const moreChip = verbalGroup().locator(".more-chip");
    if (await moreChip.count()) await moreChip.click();
    await check("expanded Verbal section contains all 60 questions", async () => await verbalGroup().locator("[data-goto]").count() === 60);
    await check("expanded Verbal section contains question 21", async () => await verbalGroup().locator("[data-goto='20']").count() === 1);
    await check("expanded Verbal section contains question 51", async () => await verbalGroup().locator("[data-goto='50']").count() === 1);
    await check("expanded Verbal section contains question 80", async () => await verbalGroup().locator("[data-goto='79']").count() === 1);
    await check("Verbal shared stimuli are labeled as reading sets", async () => await verbalGroup().getByText("Reading Set A", { exact: true }).count() === 1);
    await verbalGroup().locator("[data-goto='50']").scrollIntoViewIfNeeded();
    await verbalGroup().locator("[data-goto='50']").click();
    await check("navigator opens question 51", async () => /Item 51\b/i.test(await page.locator(".question-index").innerText()));
    await screenshot("exam-question-51-from-mixed-navigator");
    await verbalGroup().locator("[data-goto='79']").scrollIntoViewIfNeeded();
    await verbalGroup().locator("[data-goto='79']").click();
    await check("navigator opens question 80", async () => /Item 80\b/i.test(await page.locator(".question-index").innerText()));
    await screenshot("exam-question-80");
    await verbalGroup().locator("[data-goto='20']").scrollIntoViewIfNeeded();
    await verbalGroup().locator("[data-goto='20']").click();
    await check("navigator returns from question 80 to question 21", async () => /Item 21\b/i.test(await page.locator(".question-index").innerText()));
    await screenshot("exam-question-21-after-80");
  });

  await test("question timing and non-submitting exit", async () => {
    runtimeErrors.length = 0;
    await page.goto(`${baseUrl}?fixture=exam&qaTiming=1&qa=timing`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const initial = Number(await page.locator(".question-panel").getAttribute("data-question-seconds"));
    await page.waitForTimeout(1250);
    await page.locator("[data-goto='43']").click();
    await page.waitForTimeout(1100);
    await page.locator("[data-goto='42']").click();
    const resumed = Number(await page.locator(".question-panel").getAttribute("data-question-seconds"));
    await check("per-question time survives navigation", async () => resumed >= initial + 0.8, `initial=${initial}, resumed=${resumed}`);
    await screenshot("exam-question-time-restored");
    await page.locator("[data-action='pause-exam']").click();
    await page.locator(".pause-modal [data-action='save-exit']").click();
    await check("exit returns home without submitting", async () => await page.locator(".study-hub").count() === 1);
    await check("exit leaves attempt resumable", async () => await page.locator("[data-action='resume-exam']").count() === 1);
    await screenshot("exam-save-and-exit-home");
  });

  await test("stimulus modals", async () => {
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

  await test("practice and review tabs", async () => {
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

  await test("progress filters and row menu", async () => {
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

  await test("results actions", async () => {
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

  await test("answer review filters", async () => {
    await gotoFixture("review");
    for (const filter of ["wrong", "correct", "flagged", "all"]) {
      await page.locator(`[data-review-filter='${filter}']`).click();
      await screenshot(`review-filter-${filter}`);
    }
    await page.locator(".review-question-scroll").evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await screenshot("review-explanation-scrolled");
    const next = page.locator("[data-action='review-next']");
    if (!(await next.isDisabled())) {
      await next.click();
      await screenshot("review-next-question");
      const previous = page.locator("[data-action='review-prev']");
      if (!(await previous.isDisabled())) await previous.click();
      await screenshot("review-previous-question");
    }
    await gotoFixture("review-empty");
    await check("review empty disables previous", async () => await page.locator("[data-action='review-prev']").isDisabled());
    await check("review empty disables next", async () => await page.locator("[data-action='review-next']").isDisabled());
    await screenshot("review-filter-no-matches");
  });

  await browser.close();
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  const summary = {
    screenshots: report.screenshots.length,
    checks: report.checks.length,
    passedChecks: report.checks.filter((entry) => entry.passed).length,
    failures: report.errors.length
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (report.errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
