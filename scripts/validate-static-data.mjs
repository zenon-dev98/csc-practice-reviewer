import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const bankDir = path.join(root, "app", "question-bank");
const sourceImagesDir = path.join(root, "app", "images");
const sourceIndexPath = path.join(root, "data", "source_question_index.csv");
const answerKeyPath = path.join(root, "data", "answer_key_set_h_v3_2026.json");
const problems = [];

const expectedSections = {
  "General Information": 20,
  "Verbal Ability": 60,
  "Numerical Ability": 40,
  "Analytical Ability": 50,
};

const expectedSkills = {
  "Philippine Constitution": 6,
  "RA 6713 / Code of Conduct": 6,
  "Peace and human rights": 4,
  "Environment management and protection": 4,
  "Word meaning": 10,
  "Sentence completion": 10,
  "Error recognition": 10,
  "Sentence structure": 10,
  "Paragraph organization": 8,
  "Reading comprehension": 12,
  "Basic operations": 10,
  "Number sequence": 8,
  "Word problems": 22,
  "Word analogy": 10,
  "Symbolic logic / abstract reasoning": 10,
  "Identifying assumptions and drawing conclusions": 14,
  "Data interpretation": 16,
};

function compact(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
}

function loadAuthoredBank() {
  if (!fs.existsSync(bankDir)) {
    problems.push("Missing app/question-bank directory.");
    return [];
  }
  const files = fs.readdirSync(bankDir).filter((name) => name.endsWith(".js")).sort((a, b) => {
    if (a === "manifest.js") return -1;
    if (b === "manifest.js") return 1;
    return a.localeCompare(b);
  });
  if (!files.includes("manifest.js")) problems.push("Missing question-bank manifest.js.");
  const expectedFiles = Array.from({ length: 20 }, (_, index) => `version-${String(index + 1).padStart(2, "0")}.js`);
  for (const file of expectedFiles) if (!files.includes(file)) problems.push(`Missing authored bank file ${file}.`);
  const context = { window: {} };
  vm.createContext(context);
  for (const file of files) {
    try {
      vm.runInContext(fs.readFileSync(path.join(bankDir, file), "utf8"), context, { filename: file });
    } catch (error) {
      problems.push(`${file} failed to load: ${error.message}`);
    }
  }
  return context.window.CSC_EXAM_VERSIONS || [];
}

function validateSourceFallback() {
  if (!fs.existsSync(sourceIndexPath) || !fs.existsSync(answerKeyPath)) {
    problems.push("Missing source image index or answer-key fallback.");
    return;
  }
  const csv = fs.readFileSync(sourceIndexPath, "utf8").trim();
  const answerKey = JSON.parse(fs.readFileSync(answerKeyPath, "utf8"));
  const [headerLine, ...lines] = csv.split(/\r?\n/);
  const headers = headerLine.split(",");
  const rows = lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  if (rows.length !== 170) problems.push(`Source fallback expected 170 rows, found ${rows.length}.`);
  if (Object.keys(answerKey.answers || {}).length !== 170) problems.push("Source fallback answer key must contain 170 answers.");
  for (let item = 1; item <= 170; item += 1) {
    const row = rows.find((candidate) => Number(candidate.item) === item);
    if (!row) {
      problems.push(`Source fallback is missing item ${item}.`);
      continue;
    }
    if (answerKey.answers[String(item)] !== row.answer) problems.push(`Source fallback answer mismatch for item ${item}.`);
    if (!row.source_image || !fs.existsSync(path.join(sourceImagesDir, row.source_image))) problems.push(`Missing source image for item ${item}: ${row.source_image}.`);
  }
}

function validateVersion(version, allIds, allPrompts) {
  if (version.totalTimeSeconds !== 11400) problems.push(`${version.id} must use a 3:10:00 timer.`);
  if (!compact(version.title) || !compact(version.source) || !version.coverageMatrix) problems.push(`${version.id} is missing title, source, or coverage metadata.`);
  if (!Array.isArray(version.questions) || version.questions.length !== 170) {
    problems.push(`${version.id} expected 170 questions, found ${version.questions?.length ?? 0}.`);
    return;
  }

  const sections = {};
  const skills = {};
  const difficulties = { easy: 0, medium: 0, hard: 0 };
  const answers = { A: 0, B: 0, C: 0, D: 0 };
  const itemNumbers = new Set();
  const stimulusGroups = new Map();
  let previousAnswer = "";
  let answerRun = 0;
  let longestAnswerRun = 0;

  for (const question of version.questions) {
    sections[question.section] = (sections[question.section] || 0) + 1;
    skills[question.cscSkill] = (skills[question.cscSkill] || 0) + 1;
    if (Object.hasOwn(difficulties, question.difficulty)) difficulties[question.difficulty] += 1;
    else problems.push(`${question.id} has invalid difficulty ${question.difficulty}.`);
    if (Object.hasOwn(answers, question.correctChoice)) answers[question.correctChoice] += 1;
    else problems.push(`${question.id} has invalid correct choice ${question.correctChoice}.`);
    if (question.correctChoice === previousAnswer) answerRun += 1;
    else {
      previousAnswer = question.correctChoice;
      answerRun = 1;
    }
    longestAnswerRun = Math.max(longestAnswerRun, answerRun);

    if (!question.id || allIds.has(question.id)) problems.push(`Missing or duplicate question ID ${question.id}.`);
    allIds.add(question.id);
    if (!Number.isInteger(question.itemNumber) || question.itemNumber < 1 || question.itemNumber > 170 || itemNumbers.has(question.itemNumber)) problems.push(`${question.id} has an invalid or duplicate item number.`);
    itemNumbers.add(question.itemNumber);
    if (!compact(question.section) || !compact(question.subtopic) || !compact(question.cscSkill)) problems.push(`${question.id} is missing classification metadata.`);
    if (compact(question.prompt).length < 12) problems.push(`${question.id} prompt is too short.`);
    const normalizedPrompt = compact(question.prompt).toLocaleLowerCase("en-US");
    if (allPrompts.has(normalizedPrompt)) problems.push(`Duplicate authored prompt: ${question.prompt}`);
    allPrompts.add(normalizedPrompt);
    if (/practice set\s*\d+|item\s*#\s*\d+/i.test(question.prompt)) problems.push(`${question.id} contains prompt pollution.`);
    if (!Array.isArray(question.choices) || question.choices.length !== 4) problems.push(`${question.id} must have four choices.`);
    else {
      const choiceIds = question.choices.map((choice) => choice.id);
      const choiceTexts = question.choices.map((choice) => compact(choice.text).toLocaleLowerCase("en-US"));
      if (new Set(choiceIds).size !== 4 || choiceIds.some((id) => !"ABCD".includes(id))) problems.push(`${question.id} has invalid choice IDs.`);
      if (new Set(choiceTexts).size !== 4 || choiceTexts.some((text) => !text)) problems.push(`${question.id} has empty or duplicate choice text.`);
      if (!question.choices.some((choice) => choice.id === question.correctChoice)) problems.push(`${question.id} correct choice does not exist.`);
    }
    if (compact(question.explanation).length < 20) problems.push(`${question.id} explanation is too short.`);
    if (!Number.isInteger(question.expectedSeconds) || question.expectedSeconds < 30) problems.push(`${question.id} has invalid expectedSeconds.`);
    if (!compact(question.reviewStatus) || !compact(question.qualityStatus) || !question.provenance) problems.push(`${question.id} is missing review status or provenance.`);
    if (!["typed", "stimulus"].includes(question.mode)) problems.push(`${question.id} has invalid render mode ${question.mode}.`);
    if (question.mode === "stimulus" && !question.stimulus) problems.push(`${question.id} uses stimulus mode without a stimulus.`);

    if (question.stimulus) {
      const stimulus = question.stimulus;
      if (!compact(stimulus.id) || !compact(stimulus.label) || !compact(stimulus.title)) problems.push(`${question.id} stimulus is missing identity or labels.`);
      if (!compact(stimulus.alt || stimulus.altText || stimulus.description)) problems.push(`${question.id} stimulus lacks an accessible text alternative.`);
      if (!["passage", "table", "bar-table", "line-table", "logic-grid"].includes(stimulus.kind)) problems.push(`${question.id} stimulus kind is invalid: ${stimulus.kind}.`);
      const group = stimulusGroups.get(stimulus.id) || { stimulus, items: [] };
      group.items.push(question.itemNumber);
      stimulusGroups.set(stimulus.id, group);
    }
  }

  for (const [section, expected] of Object.entries(expectedSections)) if (sections[section] !== expected) problems.push(`${version.id} ${section} expected ${expected}, found ${sections[section] || 0}.`);
  for (const [skill, expected] of Object.entries(expectedSkills)) if (skills[skill] !== expected) problems.push(`${version.id} ${skill} expected ${expected}, found ${skills[skill] || 0}.`);
  if (difficulties.easy !== 50 || difficulties.medium !== 90 || difficulties.hard !== 30) problems.push(`${version.id} difficulty split must be 50/90/30.`);
  for (const [letter, count] of Object.entries(answers)) if (count < 25 || count > 60) problems.push(`${version.id} answer ${letter} count is predictably imbalanced at ${count}.`);
  if (longestAnswerRun > 6) problems.push(`${version.id} has ${longestAnswerRun} consecutive answers in one position.`);

  const groups = Array.from(stimulusGroups.values());
  const dataGroups = groups.filter(({ stimulus }) => stimulus.kind !== "passage");
  if (dataGroups.length !== 4) problems.push(`${version.id} must contain four linked data-interpretation stimuli, found ${dataGroups.length}.`);
  if (dataGroups.filter(({ stimulus }) => stimulus.kind === "table").length < 2) problems.push(`${version.id} must contain at least two plain-table data sets.`);
  for (const { stimulus, items } of groups) {
    if (items.length < 3 || items.length > 5) problems.push(`${version.id} stimulus ${stimulus.id} must link 3-5 questions, found ${items.length}.`);
  }
}

validateSourceFallback();
const versions = loadAuthoredBank();
if (versions.length !== 20) problems.push(`Expected 20 authored versions, found ${versions.length}.`);
const versionIds = new Set();
const allIds = new Set();
const allPrompts = new Set();
for (const version of versions) {
  if (!version.id || versionIds.has(version.id)) problems.push(`Missing or duplicate version ID ${version.id}.`);
  versionIds.add(version.id);
  validateVersion(version, allIds, allPrompts);
}
if (allIds.size !== 3400) problems.push(`Expected 3,400 unique authored IDs, found ${allIds.size}.`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Static data validation passed for 20 authored versions and 3,400 questions.");
