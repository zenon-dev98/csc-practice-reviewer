"use strict";

const fs = require("node:fs");
const path = require("node:path");

const qaDir = path.resolve(process.argv[2] || "qa/current-states");
const reportPath = path.join(qaDir, "report.json");
if (!fs.existsSync(reportPath)) throw new Error(`Missing state report: ${reportPath}`);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const repoRoot = process.cwd();
const rows = report.entries.map((entry) => {
  const current = path.relative(qaDir, path.join(qaDir, entry.file)).replaceAll("\\", "/");
  const reference = path.relative(qaDir, path.join(repoRoot, "states", "v5", entry.reference)).replaceAll("\\", "/");
  const defects = entry.metrics.visualDefects.length + entry.metrics.overflow.length + entry.errors.length;
  return `<article class="comparison" data-defects="${defects}">
    <header><h2>${entry.state} <small>${entry.viewport.label}</small></h2><span class="${defects ? "fail" : "pass"}">${defects} automated defects</span></header>
    <div class="images"><figure><figcaption>Approved reference: ${entry.reference}</figcaption><img src="${reference}" alt="Approved reference for ${entry.state}"></figure><figure><figcaption>Current build: ${entry.file}</figcaption><img src="${current}" alt="Current build for ${entry.state}"></figure></div>
    <details><summary>Automated findings</summary><pre>${escapeHtml(JSON.stringify({ visualDefects: entry.metrics.visualDefects, overflow: entry.metrics.overflow, errors: entry.errors }, null, 2))}</pre></details>
  </article>`;
}).join("\n");

function escapeHtml(value) {
  return value.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
}

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>V5 QA comparison</title><style>
body{margin:0;background:#071015;color:#e9f4f5;font:14px/1.45 system-ui,sans-serif}main{max-width:1800px;margin:auto;padding:24px}.build{padding:16px;border:1px solid #25434b;background:#0a1a20}.comparison{margin:22px 0;border:1px solid #25434b;background:#0a151a}.comparison>header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #25434b}.comparison h2{margin:0;text-transform:capitalize}.comparison small{color:#9bb0b6}.pass{color:#58df79}.fail{color:#ff6e72}.images{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#25434b}.images figure{margin:0;padding:12px;background:#071015}.images figcaption{margin-bottom:8px;color:#a9bec3}.images img{display:block;width:100%;height:auto;background:#02090d}details{padding:12px 16px}pre{white-space:pre-wrap;color:#bed0d4}@media(max-width:900px){.images{grid-template-columns:1fr}}
</style></head><body><main><section class="build"><strong>Build ${report.build?.fingerprint || "unknown"}</strong><br>Generated ${report.createdAt}<br>Optical parity remains manual until each pair is reviewed and signed off.</section>${rows}</main></body></html>`;
fs.writeFileSync(path.join(qaDir, "comparison.html"), html);
process.stdout.write(`${path.join(qaDir, "comparison.html")}\n`);
