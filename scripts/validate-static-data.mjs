import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const csv = fs.readFileSync(path.join(root, "data", "source_question_index.csv"), "utf8").trim();
const answerKey = JSON.parse(fs.readFileSync(path.join(root, "data", "answer_key_set_h_v3_2026.json"), "utf8"));
const generatedBankPath = path.join(root, "app", "generated-question-bank.js");
const generatedAuditPath = path.join(root, "data", "generated_bank_audit.json");
const sourceImagesDir = path.join(root, "app", "images");

const [headerLine, ...lines] = csv.split(/\r?\n/);
const headers = headerLine.split(",");
const rows = lines.map((line) => {
  const values = line.split(",");
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
});

const problems = [];
const expectedItems = new Set(Array.from({ length: 170 }, (_, index) => String(index + 1)));
const rowItems = new Set(rows.map((row) => row.item));

if (rows.length !== 170) problems.push(`Expected 170 question rows, found ${rows.length}.`);
if (Object.keys(answerKey.answers).length !== 170) problems.push("Answer key must contain 170 answers.");

for (const item of expectedItems) {
  if (!rowItems.has(item)) problems.push(`Missing row for item ${item}.`);
  if (!answerKey.answers[item]) problems.push(`Missing answer for item ${item}.`);
}

for (const row of rows) {
  if (!["A", "B", "C", "D"].includes(row.answer)) problems.push(`Bad CSV answer for item ${row.item}: ${row.answer}`);
  if (answerKey.answers[row.item] !== row.answer) {
    problems.push(`Answer mismatch for item ${row.item}: CSV ${row.answer}, key ${answerKey.answers[row.item]}`);
  }
  if (!row.source_image || !fs.existsSync(path.join(sourceImagesDir, row.source_image))) {
    problems.push(`Missing source image for item ${row.item}: ${row.source_image}`);
  }
}

const sections = rows.reduce((counts, row) => {
  counts[row.section] = (counts[row.section] ?? 0) + 1;
  return counts;
}, {});

const expectedSections = {
  "General Information": 20,
  "Verbal Ability": 60,
  "Numerical Ability": 40,
  "Analytical Ability": 50,
};

const expectedSkills = {
  "General Information": [
    "Philippine Constitution",
    "RA 6713 / Code of Conduct",
    "Peace and human rights",
    "Environment management and protection",
    "Public accountability and service ethics",
  ],
  "Verbal Ability": [
    "English vocabulary",
    "Filipino vocabulary",
    "Grammar and correct usage",
    "Reading comprehension",
    "Correct reasoning of thought process",
  ],
  "Numerical Ability": [
    "Basic operations",
    "Number sequence",
    "Word problems",
    "Data interpretation",
  ],
  "Analytical Ability": [
    "Word analogy",
    "Symbolic logic / abstract reasoning",
    "Identifying assumptions and drawing conclusions",
    "Data interpretation",
    "Pattern and sequence reasoning",
  ],
};

for (const [section, expected] of Object.entries(expectedSections)) {
  if (sections[section] !== expected) problems.push(`${section} expected ${expected}, found ${sections[section] ?? 0}.`);
}

if (!fs.existsSync(generatedBankPath)) {
  problems.push("Missing app/generated-question-bank.js.");
} else {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(generatedBankPath, "utf8"), context);
  const versions = context.window.CSC_EXAM_VERSIONS;
  if (!Array.isArray(versions)) {
    problems.push("Generated exam bank did not define window.CSC_EXAM_VERSIONS.");
  } else {
    if (versions.length !== 20) problems.push(`Expected 20 generated versions, found ${versions.length}.`);
    const versionIds = new Set();
    const allIds = new Set();
    const allPrompts = new Set();

    for (const version of versions) {
      if (!version.id || versionIds.has(version.id)) problems.push(`Missing or duplicate generated version id ${version.id}.`);
      versionIds.add(version.id);
      if (version.totalTimeSeconds !== 11400) problems.push(`${version.id} should use a 11400-second timer.`);
      if (!version.title) problems.push(`${version.id} is missing a title.`);
      if (!version.source) problems.push(`${version.id} is missing a source description.`);
      if (!version.coverageMatrix) problems.push(`${version.id} is missing coverageMatrix.`);
      if (!Array.isArray(version.questions)) {
        problems.push(`${version.id} has no questions array.`);
        continue;
      }
      if (version.questions.length !== 170) {
        problems.push(`${version.id} expected 170 questions, found ${version.questions.length}.`);
      }

      const versionSections = version.questions.reduce((counts, question) => {
        counts[question.section] = (counts[question.section] ?? 0) + 1;
        return counts;
      }, {});

      for (const [section, expected] of Object.entries(expectedSections)) {
        if (versionSections[section] !== expected) {
          problems.push(`${version.id} ${section} expected ${expected}, found ${versionSections[section] ?? 0}.`);
        }
      }

      const itemNumbers = new Set();
      const skillsBySection = {};
      const stimulusGroups = {};
      for (const question of version.questions) {
        if (allIds.has(question.id)) problems.push(`Duplicate generated question id ${question.id}.`);
        allIds.add(question.id);
        if (!Number.isInteger(question.version) || question.version < 1 || question.version > 20) {
          problems.push(`${question.id} has invalid version ${question.version}.`);
        }
        if (itemNumbers.has(question.itemNumber)) problems.push(`${version.id} duplicate item number ${question.itemNumber}.`);
        if (!Number.isInteger(question.itemNumber) || question.itemNumber < 1 || question.itemNumber > 170) {
          problems.push(`${question.id} has invalid item number ${question.itemNumber}.`);
        }
        itemNumbers.add(question.itemNumber);
        if (!expectedSections[question.section]) problems.push(`${question.id} has invalid section ${question.section}.`);
        if (!question.subtopic) problems.push(`${question.id} is missing subtopic.`);
        if (!question.cscSkill) problems.push(`${question.id} is missing cscSkill.`);
        if (question.cscSkill) {
          const sectionSkills = skillsBySection[question.section] || new Set();
          sectionSkills.add(question.cscSkill);
          skillsBySection[question.section] = sectionSkills;
        }
        if (!question.prompt || question.prompt.length < 20) problems.push(`${question.id} prompt is too short.`);
        if (allPrompts.has(question.prompt)) problems.push(`Duplicate generated prompt: ${question.prompt}`);
        allPrompts.add(question.prompt);
        if (!Array.isArray(question.choices) || question.choices.length !== 4) {
          problems.push(`${question.id} must have four choices.`);
        } else {
          const choiceIds = new Set(question.choices.map((choice) => choice.id));
          if (choiceIds.size !== 4) problems.push(`${question.id} has duplicate choice IDs.`);
          for (const choice of question.choices) {
            if (!["A", "B", "C", "D"].includes(choice.id)) problems.push(`${question.id} has invalid choice ID ${choice.id}.`);
            if (!choice.text) problems.push(`${question.id} choice ${choice.id} is missing text.`);
          }
        }
        if (!["A", "B", "C", "D"].includes(question.correctChoice)) {
          problems.push(`${question.id} has invalid correct choice ${question.correctChoice}.`);
        }
        if (!question.choices?.some((choice) => choice.id === question.correctChoice)) {
          problems.push(`${question.id} correct choice ${question.correctChoice} does not exist in choices.`);
        }
        if (!question.explanation || question.explanation.length < 10) {
          problems.push(`${question.id} explanation is too short.`);
        }
        if (!["easy", "medium", "hard"].includes(question.difficulty)) {
          problems.push(`${question.id} has invalid difficulty ${question.difficulty}.`);
        }
        if (!Number.isInteger(question.expectedSeconds) || question.expectedSeconds < 30) {
          problems.push(`${question.id} has invalid expectedSeconds ${question.expectedSeconds}.`);
        }
        if (!["draft", "reviewed", "needs_review", "verified", "generated_verified"].includes(question.reviewStatus)) {
          problems.push(`${question.id} has invalid reviewStatus ${question.reviewStatus}.`);
        }
        if (!["draft", "reviewed", "needs_review", "verified"].includes(question.qualityStatus)) {
          problems.push(`${question.id} has invalid qualityStatus ${question.qualityStatus}.`);
        }
        if (question.mode !== "typed") problems.push(`${question.id} must be typed mode.`);
        if (question.stimulus) {
          if (!question.stimulus.id) problems.push(`${question.id} stimulus is missing id.`);
          if (!question.stimulus.label) problems.push(`${question.id} stimulus is missing label.`);
          if (!question.stimulus.alt) problems.push(`${question.id} stimulus is missing alt text.`);
          if (!["bar-table", "logic-grid"].includes(question.stimulus.kind)) {
            problems.push(`${question.id} stimulus has invalid kind ${question.stimulus.kind}.`);
          }
          const stimulusGroup = stimulusGroups[question.stimulus.id] || [];
          stimulusGroup.push(question.itemNumber);
          stimulusGroups[question.stimulus.id] = stimulusGroup;
        }
      }

      for (const [section, skills] of Object.entries(expectedSkills)) {
        const seenSkills = skillsBySection[section] || new Set();
        for (const skill of skills) {
          if (!seenSkills.has(skill)) problems.push(`${version.id} missing ${section} skill: ${skill}.`);
        }
      }

      const groups = Object.entries(stimulusGroups);
      if (groups.length < 2) problems.push(`${version.id} should contain at least two stimulus groups.`);
      for (const [stimulusId, itemNumbersForStimulus] of groups) {
        if (itemNumbersForStimulus.length < 3 || itemNumbersForStimulus.length > 5) {
          problems.push(`${version.id} stimulus ${stimulusId} should link 3-5 questions, found ${itemNumbersForStimulus.length}.`);
        }
      }
    }

    if (versionIds.size !== 20) problems.push(`Expected 20 unique version IDs, found ${versionIds.size}.`);
    if (allIds.size !== 3400) problems.push(`Expected 3400 unique generated IDs, found ${allIds.size}.`);
  }
}

if (!fs.existsSync(generatedAuditPath)) {
  problems.push("Missing data/generated_bank_audit.json.");
} else {
  const audit = JSON.parse(fs.readFileSync(generatedAuditPath, "utf8"));
  if (audit.versionCount !== 20) problems.push(`Generated audit expected versionCount 20, found ${audit.versionCount}.`);
  if (audit.totalQuestions !== 3400) problems.push(`Generated audit expected totalQuestions 3400, found ${audit.totalQuestions}.`);
  if (!Array.isArray(audit.versions) || audit.versions.length !== 20) {
    problems.push("Generated audit must include 20 version summaries.");
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log("Static data validation passed.");
