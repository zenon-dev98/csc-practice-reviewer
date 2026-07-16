import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const bankDir = path.join(root, "app", "question-bank");
const outputPath = path.join(root, "data", "question_bank_quality_audit.json");
const reportOnly = process.argv.includes("--report-only");

function loadBank() {
  const context = { window: {} };
  vm.createContext(context);
  const files = fs.readdirSync(bankDir).filter((name) => name.endsWith(".js")).sort((a, b) => {
    if (a === "manifest.js") return -1;
    if (b === "manifest.js") return 1;
    return a.localeCompare(b);
  });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(bankDir, file), "utf8"), context, { filename: file });
  }
  return context.window.CSC_EXAM_VERSIONS;
}

function compact(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
}

function stripPromptPollution(prompt) {
  return compact(prompt).replace(/\s*Practice set \d+,\s*item \d+\.?$/i, "").trim();
}

function normalizedPrompt(prompt) {
  return stripPromptPollution(prompt).toLocaleLowerCase("en-US").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'");
}

function templatePrompt(prompt) {
  return normalizedPrompt(prompt)
    .replace(/php\s*[\d,.]+/g, "php #")
    .replace(/\b\d+(?:\.\d+)?%?/g, "#")
    .replace(/\b(monday|tuesday|wednesday|thursday|friday)\b/g, "<day>")
    .replace(/\b(ana|ben|carla|dino|elena|farah|gio|hana)\b/g, "<name>");
}

function templateForQuestion(question) {
  // Sequence items may share an instruction while expressing distinct patterns.
  // Exact-prompt duplicate detection still applies to them.
  return question.cscSkill === "Number sequence"
    ? normalizedPrompt(question.prompt)
    : templatePrompt(question.prompt);
}

function correctText(question) {
  return compact(question.choices?.find((choice) => choice.id === question.correctChoice)?.text);
}

function choiceSignature(question) {
  return (question.choices || []).map((choice) => compact(choice.text).toLocaleLowerCase("en-US")).sort().join(" || ");
}

function addGroup(map, key, question) {
  const group = map.get(key) || [];
  group.push({ id: question.id, version: question.version, itemNumber: question.itemNumber });
  map.set(key, group);
}

function duplicateSummary(map, minimum = 2, limit = 30) {
  return Array.from(map.entries())
    .filter(([, questions]) => questions.length >= minimum)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, questions]) => ({ key, count: questions.length, questions }));
}

function permutations(values) {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) => permutations(values.filter((_, current) => current !== index)).map((rest) => [value, ...rest]));
}

function logicSolutionCount(stimulus) {
  if (stimulus?.kind !== "logic-grid" || !Array.isArray(stimulus.rows)) return null;
  const constraints = stimulus.rows.map((row) => compact(row[1]));
  const names = new Set();
  for (const rule of constraints) {
    const before = rule.match(/^(.+?) is processed before (.+?)\.$/i);
    const after = rule.match(/^(.+?) is immediately after (.+?)\.$/i);
    const notFirst = rule.match(/^(.+?) is not first\.$/i);
    if (before) { names.add(before[1]); names.add(before[2]); }
    if (after) { names.add(after[1]); names.add(after[2]); }
    if (notFirst) names.add(notFirst[1]);
  }
  if (names.size !== 4) return null;
  return permutations(Array.from(names)).filter((order) => constraints.every((rule) => {
    const before = rule.match(/^(.+?) is processed before (.+?)\.$/i);
    if (before) return order.indexOf(before[1]) < order.indexOf(before[2]);
    const after = rule.match(/^(.+?) is immediately after (.+?)\.$/i);
    if (after) return order.indexOf(after[1]) === order.indexOf(after[2]) + 1;
    const notFirst = rule.match(/^(.+?) is not first\.$/i);
    if (notFirst) return order[0] !== notFirst[1];
    return false;
  })).length;
}

const versions = loadBank();
if (!Array.isArray(versions)) throw new Error("Authored bank did not define window.CSC_EXAM_VERSIONS.");

const allQuestions = versions.flatMap((version) => version.questions || []);
const basePromptGroups = new Map();
const templateGroups = new Map();
const shuffledDuplicateGroups = new Map();
const explanationGroups = new Map();
const findings = [];
const ids = new Set();
const fillerChoices = new Set(["cannot be determined", "none of the choices", "all of the choices", "not enough information"]);
const invalidAttributiveWords = /\ba (mitigate|scrutinize|expedite|obsolete|discrepancy) review\b/i;

for (const question of allQuestions) {
  const base = normalizedPrompt(question.prompt);
  const template = templateForQuestion(question);
  const correct = correctText(question);
  addGroup(basePromptGroups, base, question);
  addGroup(templateGroups, template, question);
  addGroup(shuffledDuplicateGroups, `${base} :: ${choiceSignature(question)} :: ${correct.toLocaleLowerCase("en-US")}`, question);
  addGroup(explanationGroups, compact(question.explanation).toLocaleLowerCase("en-US"), question);

  if (/Practice set \d+,\s*item \d+/i.test(question.prompt)) findings.push({ severity: "blocker", code: "prompt_pollution", id: question.id });
  if (!question.id || ids.has(question.id)) findings.push({ severity: "blocker", code: "duplicate_or_missing_id", id: question.id });
  ids.add(question.id);
  for (const field of ["section", "subtopic", "cscSkill", "prompt", "correctChoice", "explanation", "difficulty", "reviewStatus", "qualityStatus"]) {
    if (!compact(question[field])) findings.push({ severity: "blocker", code: "missing_required_field", id: question.id, field });
  }
  if (!Number.isInteger(question.itemNumber) || question.itemNumber < 1 || question.itemNumber > 170) findings.push({ severity: "blocker", code: "invalid_item_number", id: question.id, itemNumber: question.itemNumber });
  if (invalidAttributiveWords.test(question.prompt)) findings.push({ severity: "blocker", code: "invalid_word_usage", id: question.id, prompt: stripPromptPollution(question.prompt) });
  if (!question.source && !question.provenance) findings.push({ severity: "high", code: "missing_provenance", id: question.id });
  if (["reviewed", "verified"].includes(question.qualityStatus) && !question.source && !question.provenance) {
    findings.push({ severity: "high", code: "unsupported_quality_claim", id: question.id, qualityStatus: question.qualityStatus });
  }
  const choices = (question.choices || []).map((choice) => compact(choice.text));
  if (choices.length !== 4) findings.push({ severity: "blocker", code: "wrong_choice_count", id: question.id, count: choices.length });
  if (!question.choices?.some((choice) => choice.id === question.correctChoice)) findings.push({ severity: "blocker", code: "missing_correct_choice", id: question.id });
  if (compact(question.explanation).length < 20) findings.push({ severity: "blocker", code: "weak_explanation", id: question.id });
  if (question.stimulus && !compact(question.stimulus.altText || question.stimulus.description)) findings.push({ severity: "blocker", code: "inaccessible_stimulus", id: question.id, stimulusId: question.stimulus.id });
  if (new Set(choices.map((choice) => choice.toLocaleLowerCase("en-US"))).size !== choices.length) {
    findings.push({ severity: "blocker", code: "duplicate_choices", id: question.id });
  }
  const fillerCount = choices.filter((choice) => fillerChoices.has(choice.toLocaleLowerCase("en-US"))).length;
  if (fillerCount) findings.push({ severity: "medium", code: "generic_filler_choice", id: question.id, count: fillerCount });
  const comparison = stripPromptPollution(question.prompt).match(/Unit A has (\d+) pending requests and Unit B has (\d+)\. How many more pending requests does Unit A have\?/i);
  if (comparison && Number(comparison[1]) < Number(comparison[2])) {
    findings.push({ severity: "blocker", code: "reversed_more_than_comparison", id: question.id, prompt: stripPromptPollution(question.prompt), answer: correct });
  }
}

const versionReports = versions.map((version) => {
  const questions = version.questions || [];
  const difficulties = { easy: 0, medium: 0, hard: 0, invalid: 0 };
  const sections = {};
  const skills = {};
  const answerPositions = { A: 0, B: 0, C: 0, D: 0 };
  let currentAnswer = "";
  let currentAnswerRun = 0;
  let longestAnswerRun = 0;
  const localBase = new Map();
  const localTemplate = new Map();
  const itemNumbers = new Set();
  for (const question of questions) {
    if (Object.hasOwn(difficulties, question.difficulty)) difficulties[question.difficulty] += 1;
    else difficulties.invalid += 1;
    sections[question.section] = (sections[question.section] || 0) + 1;
    skills[question.cscSkill] = (skills[question.cscSkill] || 0) + 1;
    if (Object.hasOwn(answerPositions, question.correctChoice)) answerPositions[question.correctChoice] += 1;
    if (question.correctChoice === currentAnswer) currentAnswerRun += 1;
    else {
      currentAnswer = question.correctChoice;
      currentAnswerRun = 1;
    }
    longestAnswerRun = Math.max(longestAnswerRun, currentAnswerRun);
    addGroup(localBase, normalizedPrompt(question.prompt), question);
    addGroup(localTemplate, templateForQuestion(question), question);
    if (itemNumbers.has(question.itemNumber)) findings.push({ severity: "blocker", code: "duplicate_item_number", id: question.id, version: version.id, itemNumber: question.itemNumber });
    itemNumbers.add(question.itemNumber);
  }
  const stimulusGroups = new Map();
  for (const question of questions.filter((item) => item.stimulus)) {
    if (!stimulusGroups.has(question.stimulus.id)) stimulusGroups.set(question.stimulus.id, { stimulus: question.stimulus, items: [] });
    stimulusGroups.get(question.stimulus.id).items.push(question.itemNumber);
  }
  return {
    id: version.id,
    totalQuestions: questions.length,
    difficulties,
    sections,
    skills,
    answerPositions,
    longestAnswerRun,
    uniqueItemNumbers: itemNumbers.size,
    exactDuplicatePromptGroups: duplicateSummary(localBase, 2, 100),
    templateDuplicatePromptGroups: duplicateSummary(localTemplate, 2, 100),
    stimulusGroups: Array.from(stimulusGroups.values()).map(({ stimulus, items }) => ({
      id: stimulus.id,
      kind: stimulus.kind,
      items,
      logicSolutionCount: logicSolutionCount(stimulus),
    })),
  };
});

const exactDuplicates = duplicateSummary(basePromptGroups, 2, 100);
const templateDuplicates = duplicateSummary(templateGroups, 2, 100);
const shuffledDuplicates = duplicateSummary(shuffledDuplicateGroups, 2, 100);
const repeatedExplanations = duplicateSummary(explanationGroups, 3, 50);
const difficultyTotals = allQuestions.reduce((counts, question) => {
  counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
  return counts;
}, {});
const findingTotals = findings.reduce((counts, finding) => {
  counts[finding.code] = (counts[finding.code] || 0) + 1;
  return counts;
}, {});
const ambiguousLogicGroups = versionReports.flatMap((version) => version.stimulusGroups
  .filter((group) => group.kind === "logic-grid" && group.logicSolutionCount !== 1)
  .map((group) => ({ version: version.id, ...group })));

const blockers = [];
if (versions.length !== 20) blockers.push(`Expected 20 authored versions, found ${versions.length}.`);
if (allQuestions.length !== 3400) blockers.push(`Expected 3,400 authored questions, found ${allQuestions.length}.`);
if (findingTotals.prompt_pollution) blockers.push(`${findingTotals.prompt_pollution} prompts contain generator-only set/item suffixes.`);
if (exactDuplicates.length) blockers.push(`${exactDuplicates.length} exact normalized prompt groups repeat.`);
if (shuffledDuplicates.length) blockers.push(`${shuffledDuplicates.length} question groups differ only by choice order or identifiers.`);
if (versionReports.some((version) => version.templateDuplicatePromptGroups.length > 0)) blockers.push("At least one version repeats normalized prompt templates internally.");
if (Object.keys(difficultyTotals).length === 1) blockers.push(`All ${allQuestions.length} questions use difficulty '${Object.keys(difficultyTotals)[0]}'.`);
if (findingTotals.invalid_word_usage) blockers.push(`${findingTotals.invalid_word_usage} vocabulary prompts use a word in an invalid grammatical role.`);
if (findingTotals.reversed_more_than_comparison) blockers.push(`${findingTotals.reversed_more_than_comparison} comparison questions ask 'how many more' when the first value is smaller.`);
if (ambiguousLogicGroups.length) blockers.push(`${ambiguousLogicGroups.length} logic stimulus groups do not have exactly one solution.`);
if (findingTotals.wrong_choice_count) blockers.push(`${findingTotals.wrong_choice_count} questions do not have exactly four choices.`);
if (findingTotals.duplicate_choices) blockers.push(`${findingTotals.duplicate_choices} questions contain duplicate choice text.`);
if (findingTotals.missing_correct_choice) blockers.push(`${findingTotals.missing_correct_choice} questions have a missing answer-key choice.`);
if (findingTotals.missing_provenance) blockers.push(`${findingTotals.missing_provenance} questions lack provenance.`);
if (findingTotals.duplicate_or_missing_id) blockers.push(`${findingTotals.duplicate_or_missing_id} questions have duplicate or missing IDs.`);
if (findingTotals.invalid_item_number) blockers.push(`${findingTotals.invalid_item_number} questions have invalid item numbers.`);
if (findingTotals.duplicate_item_number) blockers.push(`${findingTotals.duplicate_item_number} questions reuse an item number within a version.`);
if (findingTotals.missing_required_field) blockers.push(`${findingTotals.missing_required_field} required question fields are empty.`);
if (findingTotals.weak_explanation) blockers.push(`${findingTotals.weak_explanation} explanations are too short to teach the answer.`);
if (findingTotals.inaccessible_stimulus) blockers.push(`${findingTotals.inaccessible_stimulus} stimulus-linked questions lack a textual alternative.`);
for (const version of versionReports) {
  if (version.totalQuestions !== 170) blockers.push(`${version.id} has ${version.totalQuestions} questions instead of 170.`);
  if (version.sections["General Information"] !== 20 || version.sections["Verbal Ability"] !== 60 || version.sections["Numerical Ability"] !== 40 || version.sections["Analytical Ability"] !== 50) blockers.push(`${version.id} does not match the 20/60/40/50 section blueprint.`);
  if (version.uniqueItemNumbers !== 170) blockers.push(`${version.id} has ${version.uniqueItemNumbers} unique item numbers instead of 170.`);
  if (version.difficulties.easy < 35 || version.difficulties.easy > 50 || version.difficulties.medium < 80 || version.difficulties.medium > 100 || version.difficulties.hard < 30 || version.difficulties.hard > 45) blockers.push(`${version.id} difficulty mix is outside the authored-bank rubric.`);
  if (Object.values(version.answerPositions).some((count) => count < 25 || count > 60)) blockers.push(`${version.id} answer positions are predictably imbalanced (${Object.entries(version.answerPositions).map(([letter, count]) => `${letter}:${count}`).join(", ")}).`);
  if (version.longestAnswerRun > 6) blockers.push(`${version.id} contains a run of ${version.longestAnswerRun} consecutive answers in the same position.`);
  const requiredSkills = ["Philippine Constitution", "RA 6713 / Code of Conduct", "Peace and human rights", "Environment management and protection", "Word meaning", "Sentence completion", "Error recognition", "Sentence structure", "Paragraph organization", "Reading comprehension", "Basic operations", "Number sequence", "Word problems", "Word analogy", "Symbolic logic / abstract reasoning", "Identifying assumptions and drawing conclusions", "Data interpretation"];
  for (const skill of requiredSkills) if (!version.skills[skill]) blockers.push(`${version.id} is missing required CSC skill '${skill}'.`);
  for (const group of version.stimulusGroups) {
    if (group.items.length < 3 || group.items.length > 5) blockers.push(`${version.id} stimulus ${group.id} links ${group.items.length} questions; expected 3-5.`);
  }
}

const audit = {
  generatedAt: new Date().toISOString(),
  source: path.relative(root, bankDir).replaceAll("\\", "/"),
  versionCount: versions.length,
  totalQuestions: allQuestions.length,
  difficultyTotals,
  findingTotals,
  findings,
  blockers,
  exactDuplicatePromptGroupCount: exactDuplicates.length,
  templateDuplicatePromptGroupCount: templateDuplicates.length,
  shuffledDuplicateGroupCount: shuffledDuplicates.length,
  repeatedExplanationGroupCount: repeatedExplanations.length,
  ambiguousLogicGroups,
  exactDuplicates,
  templateDuplicates,
  shuffledDuplicates,
  repeatedExplanations,
  versionReports,
};

fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  versionCount: audit.versionCount,
  totalQuestions: audit.totalQuestions,
  difficultyTotals: audit.difficultyTotals,
  findingTotals: audit.findingTotals,
  exactDuplicatePromptGroupCount: audit.exactDuplicatePromptGroupCount,
  templateDuplicatePromptGroupCount: audit.templateDuplicatePromptGroupCount,
  shuffledDuplicateGroupCount: audit.shuffledDuplicateGroupCount,
  ambiguousLogicGroupCount: audit.ambiguousLogicGroups.length,
  blockers: audit.blockers,
  output: path.relative(root, outputPath),
}, null, 2));

if (!reportOnly && blockers.length) process.exit(1);
