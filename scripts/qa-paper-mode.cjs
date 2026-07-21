"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require(path.join(process.env.LOCALAPPDATA, "csc-reviewer", "qa-deps", "node_modules", "playwright"));

const baseUrl = process.env.CSC_QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.argv[2] || "qa/t0041-paper-mode");
fs.mkdirSync(outputDir, { recursive: true });

const expectedChecks = [
  "paper tools load",
  "two print pages cover 1-170",
  "Letter and A4 print outputs contain two pages",
  "all 170 patterned bubbles recognize correctly",
  "all unmarked bubbles recognize as blank",
  "double mark is reported as multiple",
  "faint mark is reported for review",
  "corrected mark favors the final dark choice",
  "skewed sheet recognizes correctly",
  "shadowed sheet recognizes correctly",
  "brightened sheet recognizes correctly",
  "rotated sheet normalizes and recognizes correctly",
  "automatic markers locate all four corners",
  "paper setup locks both shuffle controls",
  "paper setup exposes two-page print action",
  "paper exam choices are read-only",
  "paper exam next works without an onscreen answer",
  "paper finish requires confirmation",
  "paper finish opens local upload stage",
  "paper timeout freezes and opens local upload stage",
  "upload stage separates file and camera controls",
  "both uploaded pages enable recognition",
  "recognition produces 170 editable items",
  "manual answer correction is applied",
  "intentional blank requires confirmation",
  "confirmed paper answers reach results",
  "paper result is labeled",
  "paper review omits answer-change claims",
  "scan images trigger no upload request",
  "paper desktop states have no document overflow",
  "paper mobile states remain reachable"
];

function buildMetadata() {
  const files = ["app/index.html", "app/app.js", "app/paper-mode.js", "app/v5-production.css"];
  const hash = crypto.createHash("sha256");
  files.forEach((file) => hash.update(fs.readFileSync(path.resolve(file))));
  return { fingerprint: hash.digest("hex").slice(0, 16), files };
}

function pngBuffer(dataUrl) {
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1536, height: 816 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const report = {
    createdAt: new Date().toISOString(),
    baseUrl,
    browser: "Microsoft Edge",
    build: buildMetadata(),
    expected: expectedChecks.length,
    checks: [],
    screenshots: [],
    requestsAfterScan: [],
    runtimeErrors: []
  };
  const executed = new Set();
  page.on("pageerror", (error) => report.runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") report.runtimeErrors.push(`console: ${message.text()}`); });

  function check(name, passed, details = "") {
    if (!expectedChecks.includes(name)) throw new Error(`Unexpected check: ${name}`);
    if (executed.has(name)) throw new Error(`Duplicate check: ${name}`);
    executed.add(name);
    report.checks.push({ name, passed: Boolean(passed), details });
  }

  async function shot(name, fullPage = false) {
    const file = `${String(report.screenshots.length + 1).padStart(2, "0")}-${name}.png`;
    await page.screenshot({ path: path.join(outputDir, file), fullPage });
    report.screenshots.push({ name, file, viewport: page.viewportSize() });
  }

  await page.goto(`${baseUrl}?fixture=paper-scan&qa=paper-omr`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  check("paper tools load", await page.evaluate(() => Boolean(window.CSC_PAPER_MODE)));

  const omr = await page.evaluate(() => {
    const tools = window.CSC_PAPER_MODE;
    const letters = tools.LETTERS;
    const makeSheet = (pageIndex, markFor, treatment) => {
      const canvas = document.createElement("canvas");
      tools.drawSheet(canvas, pageIndex, "Mock Exam 07");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      for (const item of tools.templateItems(pageIndex)) {
        const marks = markFor(item.number);
        for (const mark of marks) {
          const choice = item.choices.find((candidate) => candidate.letter === mark.letter);
          context.save();
          context.globalAlpha = mark.alpha ?? 1;
          context.fillStyle = "#000";
          context.beginPath();
          context.arc(choice.x, choice.y, 13, 0, Math.PI * 2);
          context.fill();
          context.restore();
        }
      }
      if (treatment === "shadow") {
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "rgba(0,0,0,0.02)");
        gradient.addColorStop(0.55, "rgba(0,0,0,0.24)");
        gradient.addColorStop(1, "rgba(0,0,0,0.05)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (treatment === "bright") {
        context.fillStyle = "rgba(255,255,255,0.22)";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      return canvas;
    };
    const pattern = (number) => [{ letter: letters[(number - 1) % 4] }];
    const exactPages = [0, 1].map((pageIndex) => makeSheet(pageIndex, pattern));
    const exact = exactPages.flatMap((canvas, pageIndex) => tools.analyze(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), tools.MARKERS, pageIndex));
    const blankPages = [0, 1].map((pageIndex) => makeSheet(pageIndex, () => []));
    const blanks = blankPages.flatMap((canvas, pageIndex) => tools.analyze(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), tools.MARKERS, pageIndex));
    const doubleCanvas = makeSheet(0, (number) => number === 1 ? [{ letter: "A" }, { letter: "B" }] : []);
    const double = tools.analyze(doubleCanvas.getContext("2d").getImageData(0, 0, doubleCanvas.width, doubleCanvas.height), tools.MARKERS, 0)[0];
    const faintCanvas = makeSheet(0, (number) => number === 1 ? [{ letter: "C", alpha: 0.12 }] : []);
    const faint = tools.analyze(faintCanvas.getContext("2d").getImageData(0, 0, faintCanvas.width, faintCanvas.height), tools.MARKERS, 0)[0];
    const correctedCanvas = makeSheet(0, (number) => number === 1 ? [{ letter: "A", alpha: 0.12 }, { letter: "D" }] : []);
    const corrected = tools.analyze(correctedCanvas.getContext("2d").getImageData(0, 0, correctedCanvas.width, correctedCanvas.height), tools.MARKERS, 0)[0];
    const transformedCanvas = document.createElement("canvas");
    transformedCanvas.width = tools.WIDTH;
    transformedCanvas.height = tools.HEIGHT;
    const transformedContext = transformedCanvas.getContext("2d", { willReadFrequently: true });
    transformedContext.fillStyle = "#fff";
    transformedContext.fillRect(0, 0, transformedCanvas.width, transformedCanvas.height);
    const transform = { a: 0.92, b: 0.012, c: 0.018, d: 0.94, e: 42, f: 48 };
    transformedContext.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
    transformedContext.drawImage(exactPages[0], 0, 0);
    transformedContext.resetTransform();
    const transformedMarkers = tools.MARKERS.map((point) => ({ x: transform.a * point.x + transform.c * point.y + transform.e, y: transform.b * point.x + transform.d * point.y + transform.f }));
    const skewed = tools.analyze(transformedContext.getImageData(0, 0, transformedCanvas.width, transformedCanvas.height), transformedMarkers, 0);
    const shadowCanvas = makeSheet(0, pattern, "shadow");
    const shadowed = tools.analyze(shadowCanvas.getContext("2d").getImageData(0, 0, shadowCanvas.width, shadowCanvas.height), tools.MARKERS, 0);
    const brightCanvas = makeSheet(0, pattern, "bright");
    const brightened = tools.analyze(brightCanvas.getContext("2d").getImageData(0, 0, brightCanvas.width, brightCanvas.height), tools.MARKERS, 0);
    const rotateClockwise = (source) => {
      const target = document.createElement("canvas");
      target.width = source.height;
      target.height = source.width;
      const targetContext = target.getContext("2d", { alpha: false, willReadFrequently: true });
      targetContext.translate(target.width, 0);
      targetContext.rotate(Math.PI / 2);
      targetContext.drawImage(source, 0, 0);
      return target;
    };
    let rotatedCanvas = rotateClockwise(exactPages[0]);
    const orientation = tools.orientationTurns(rotatedCanvas.getContext("2d").getImageData(0, 0, rotatedCanvas.width, rotatedCanvas.height));
    for (let turn = 0; turn < orientation.turns; turn += 1) rotatedCanvas = rotateClockwise(rotatedCanvas);
    const rotated = tools.analyze(rotatedCanvas.getContext("2d").getImageData(0, 0, rotatedCanvas.width, rotatedCanvas.height), tools.MARKERS, 0);
    const markerCanvas = document.createElement("canvas");
    markerCanvas.width = 408;
    markerCanvas.height = 528;
    markerCanvas.getContext("2d").drawImage(exactPages[0], 0, 0, 408, 528);
    const markerDetection = tools.detectMarkers(markerCanvas.getContext("2d").getImageData(0, 0, 408, 528));
    return {
      pageRanges: tools.PAGES,
      exactErrors: exact.filter((item) => item.choice !== letters[(item.number - 1) % 4] || item.state !== "confident").map((item) => ({ number: item.number, choice: item.choice, state: item.state, scores: item.scores })),
      blankErrors: blanks.filter((item) => item.state !== "blank").map((item) => ({ number: item.number, choice: item.choice, state: item.state, scores: item.scores })),
      double,
      faint,
      corrected,
      skewErrors: skewed.filter((item) => item.choice !== letters[(item.number - 1) % 4]).length,
      shadowErrors: shadowed.filter((item) => item.choice !== letters[(item.number - 1) % 4]).length,
      brightErrors: brightened.filter((item) => item.choice !== letters[(item.number - 1) % 4]).length,
      rotatedErrors: rotated.filter((item) => item.choice !== letters[(item.number - 1) % 4]).length,
      orientation,
      markerDetection,
      printDataUrls: blankPages.map((canvas) => canvas.toDataURL("image/png")),
      uploadDataUrls: exactPages.map((canvas) => canvas.toDataURL("image/png"))
    };
  });

  check("two print pages cover 1-170", omr.pageRanges.length === 2 && omr.pageRanges[0].start === 1 && omr.pageRanges[0].end === 85 && omr.pageRanges[1].start === 86 && omr.pageRanges[1].end === 170);
  check("all 170 patterned bubbles recognize correctly", omr.exactErrors.length === 0, JSON.stringify(omr.exactErrors.slice(0, 4)));
  check("all unmarked bubbles recognize as blank", omr.blankErrors.length === 0, JSON.stringify(omr.blankErrors.slice(0, 4)));
  check("double mark is reported as multiple", omr.double.state === "multiple", JSON.stringify(omr.double));
  check("faint mark is reported for review", omr.faint.state === "low", JSON.stringify(omr.faint));
  check("corrected mark favors the final dark choice", omr.corrected.choice === "D" && omr.corrected.state === "confident", JSON.stringify(omr.corrected));
  check("skewed sheet recognizes correctly", omr.skewErrors === 0, `${omr.skewErrors} errors`);
  check("shadowed sheet recognizes correctly", omr.shadowErrors === 0, `${omr.shadowErrors} errors`);
  check("brightened sheet recognizes correctly", omr.brightErrors === 0, `${omr.brightErrors} errors`);
  check("rotated sheet normalizes and recognizes correctly", omr.rotatedErrors === 0 && omr.orientation.turns === 3, JSON.stringify({ errors: omr.rotatedErrors, orientation: omr.orientation }));
  check("automatic markers locate all four corners", omr.markerDetection.points.length === 4 && omr.markerDetection.confidence >= 0.55, JSON.stringify(omr.markerDetection));

  omr.printDataUrls.forEach((dataUrl, index) => {
    const file = `print-page-${index + 1}.png`;
    fs.writeFileSync(path.join(outputDir, file), pngBuffer(dataUrl));
    report.screenshots.push({ name: `print-page-${index + 1}`, file, source: "native 1632x2112 canvas" });
  });

  await page.evaluate(() => {
    document.getElementById("app").hidden = true;
    const holder = document.createElement("main");
    holder.className = "paper-print-root";
    for (let index = 0; index < 2; index += 1) {
      const canvas = document.createElement("canvas");
      window.CSC_PAPER_MODE.drawSheet(canvas, index, "Mock Exam 07");
      canvas.className = "paper-print-page";
      holder.appendChild(canvas);
    }
    document.body.appendChild(holder);
  });
  await page.emulateMedia({ media: "print" });
  const letterPdf = path.join(outputDir, "answer-sheets-letter.pdf");
  const a4Pdf = path.join(outputDir, "answer-sheets-a4-fit.pdf");
  await page.pdf({ path: letterPdf, format: "Letter", printBackground: true, preferCSSPageSize: true });
  await page.pdf({ path: a4Pdf, format: "A4", printBackground: true, preferCSSPageSize: false });
  const pageCount = (file) => (fs.readFileSync(file, "latin1").match(/\/Type\s*\/Page\b/g) || []).length;
  check("Letter and A4 print outputs contain two pages", pageCount(letterPdf) === 2 && pageCount(a4Pdf) === 2 && fs.statSync(letterPdf).size > 10000 && fs.statSync(a4Pdf).size > 10000, `Letter: ${pageCount(letterPdf)} pages; A4: ${pageCount(a4Pdf)} pages`);
  report.screenshots.push({ name: "letter-print", file: "answer-sheets-letter.pdf" }, { name: "a4-fit-print", file: "answer-sheets-a4-fit.pdf" });
  await page.emulateMedia({ media: "screen" });

  await page.goto(`${baseUrl}?fixture=paper-setup&qa=paper-workflow`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await shot("paper-setup");
  check("paper setup locks both shuffle controls", await page.locator("input[name='shuffleQuestions']:disabled, input[name='shuffleAnswers']:disabled").count() === 2);
  check("paper setup exposes two-page print action", await page.getByRole("button", { name: /Print Answer Sheets/i }).isVisible() && (await page.locator(".paper-setup-note").innerText()).includes("Items 86-170"));
  await page.getByRole("button", { name: /Start Paper Exam/i }).click();
  await page.locator(".paper-readonly-choices").waitFor();
  await shot("paper-exam");
  const paperChoiceCount = await page.locator(".paper-readonly-choices .choice").count();
  check("paper exam choices are read-only", paperChoiceCount > 0 && await page.locator(".paper-readonly-choices .choice:disabled").count() === paperChoiceCount, `${paperChoiceCount} choices`);
  const beforeItem = await page.locator(".question-item-number").innerText().catch(() => page.locator(".question-index").innerText());
  await page.getByRole("button", { name: /^Next/i }).click();
  const afterItem = await page.locator(".question-item-number").innerText().catch(() => page.locator(".question-index").innerText());
  check("paper exam next works without an onscreen answer", beforeItem !== afterItem, `${beforeItem} -> ${afterItem}`);
  await page.getByRole("button", { name: /Finish Answering/i }).first().click();
  check("paper finish requires confirmation", await page.getByRole("dialog", { name: /Finish answering/i }).isVisible());
  await shot("paper-finish-confirmation");
  await page.getByRole("button", { name: /Freeze and Scan/i }).click();
  await page.getByRole("heading", { name: /Upload both answer sheets/i }).waitFor();
  check("paper finish opens local upload stage", await page.getByText(/Timer frozen at/i).isVisible());
  check("upload stage separates file and camera controls", await page.getByText("Choose File", { exact: true }).count() === 2 && await page.getByText("Use Camera", { exact: true }).count() === 2);
  await shot("paper-upload-empty");

  const timeoutPage = await context.newPage();
  timeoutPage.setDefaultTimeout(10000);
  await timeoutPage.goto(`${baseUrl}?fixture=paper-timeout&qaTiming=1&qa=paper-timeout`, { waitUntil: "networkidle" });
  await timeoutPage.getByRole("heading", { name: /Upload both answer sheets/i }).waitFor({ timeout: 6000 });
  check("paper timeout freezes and opens local upload stage", await timeoutPage.getByText(/Timer frozen at 3:10:00/i).isVisible());
  await timeoutPage.screenshot({ path: path.join(outputDir, "paper-timeout-scan.png") });
  report.screenshots.push({ name: "paper-timeout-scan", file: "paper-timeout-scan.png", viewport: timeoutPage.viewportSize() });
  await timeoutPage.close();

  const scanRequests = [];
  page.on("request", (request) => {
    if (!["document", "script", "stylesheet", "image", "font"].includes(request.resourceType())) scanRequests.push({ method: request.method(), url: request.url(), type: request.resourceType() });
  });
  await page.locator("input[data-paper-file='0']").first().setInputFiles({ name: "page-1.png", mimeType: "image/png", buffer: pngBuffer(omr.uploadDataUrls[0]) });
  await page.locator(".paper-upload-card.has-scan").waitFor();
  await page.locator("input[data-paper-file='1']").first().setInputFiles({ name: "page-2.png", mimeType: "image/png", buffer: pngBuffer(omr.uploadDataUrls[1]) });
  await page.locator(".paper-upload-card.has-scan").nth(1).waitFor();
  await page.getByRole("button", { name: /Analyze 170 Answers/i }).waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector('[data-action="analyze-paper-sheets"]')?.disabled);
  check("both uploaded pages enable recognition", await page.getByRole("button", { name: /Analyze 170 Answers/i }).isEnabled());
  await shot("paper-upload-aligned");
  await page.getByRole("button", { name: /Analyze 170 Answers/i }).click();
  await page.getByRole("heading", { name: /Confirm detected answers/i }).waitFor();
  check("recognition produces 170 editable items", await page.locator(".paper-answer-item").count() === 170);
  await shot("paper-review-grid");
  await page.locator("[data-paper-answer='1'][data-paper-choice='D']").click();
  check("manual answer correction is applied", await page.locator("[data-paper-answer='1'][data-paper-choice='D']").getAttribute("class").then((value) => value.includes("selected")));
  await page.locator("[data-paper-answer='2'][data-paper-choice='']").click();
  check("intentional blank requires confirmation", await page.getByRole("button", { name: /Confirm and Grade/i }).isDisabled() && await page.locator("[data-paper-confirm-blanks]").isVisible());
  await page.locator("[data-paper-confirm-blanks]").check();
  await page.getByRole("button", { name: /Confirm and Grade/i }).click();
  await page.locator(".results-page").waitFor();
  check("confirmed paper answers reach results", await page.locator(".results-page").isVisible());
  check("paper result is labeled", await page.getByText("Paper mode", { exact: true }).isVisible());
  await shot("paper-results");
  await page.getByRole("button", { name: /Review Answers/i }).click();
  check("paper review omits answer-change claims", await page.getByText("Answer Source", { exact: true }).isVisible() && await page.getByText("Answer Changes", { exact: true }).count() === 0);
  await shot("paper-answer-review");
  report.requestsAfterScan = scanRequests;
  check("scan images trigger no upload request", scanRequests.every((request) => !/supabase|storage|upload/i.test(request.url)), JSON.stringify(scanRequests));

  const desktopStates = ["paper-setup", "paper-exam", "paper-scan", "paper-review", "paper-results"];
  let desktopOverflow = [];
  for (const fixture of desktopStates) {
    await page.goto(`${baseUrl}?fixture=${fixture}&qa=paper-desktop`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth - innerWidth, height: document.documentElement.scrollHeight - innerHeight }));
    if (overflow.width > 1 || overflow.height > 1) desktopOverflow.push({ fixture, overflow });
    await shot(`desktop-${fixture}`);
  }
  check("paper desktop states have no document overflow", desktopOverflow.length === 0, JSON.stringify(desktopOverflow));

  await page.setViewportSize({ width: 390, height: 844 });
  let mobileFailures = [];
  for (const fixture of ["paper-setup", "paper-exam", "paper-scan", "paper-review", "paper-results"]) {
    await page.goto(`${baseUrl}?fixture=${fixture}&qa=paper-mobile`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => ({ widthOverflow: document.documentElement.scrollWidth - innerWidth, scrollHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight, rootVisible: Boolean(document.querySelector("#app > *")) }));
    if (metrics.widthOverflow > 1 || !metrics.rootVisible) mobileFailures.push({ fixture, metrics });
    await shot(`mobile-${fixture}`, true);
  }
  check("paper mobile states remain reachable", mobileFailures.length === 0, JSON.stringify(mobileFailures));

  const missing = expectedChecks.filter((name) => !executed.has(name));
  missing.forEach((name) => report.checks.push({ name, passed: false, details: "unexecuted" }));
  report.executed = executed.size;
  report.passed = report.checks.filter((item) => item.passed).length;
  report.failed = report.checks.filter((item) => !item.passed).length;
  report.verdicts = {
    functional: report.failed === 0 && report.runtimeErrors.length === 0 ? "pass" : "fail",
    reachability: report.checks.filter((item) => /next|finish|upload|editable|mobile/.test(item.name)).every((item) => item.passed) ? "pass" : "fail",
    optical: report.checks.find((item) => item.name === "paper desktop states have no document overflow")?.passed ? "needs-human-review" : "fail",
    privacy: report.checks.find((item) => item.name === "scan images trigger no upload request")?.passed ? "pass" : "fail"
  };
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outputDir, "manifest.md"), `# Paper Mode QA\n\n- Build: \`${report.build.fingerprint}\`\n- Expected: ${report.expected}\n- Executed: ${report.executed}\n- Passed: ${report.passed}\n- Failed: ${report.failed}\n- Runtime errors: ${report.runtimeErrors.length}\n\n${report.checks.map((item) => `- [${item.passed ? "x" : " "}] ${item.name}${item.details ? `: ${item.details}` : ""}`).join("\n")}\n`);
  await browser.close();
  if (report.failed || report.runtimeErrors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
