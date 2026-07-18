window.CSC_EXAM_VERSIONS = [];
window.CSC_AUTHORED_QUESTION = function authoredQuestion(version, itemNumber, section, subtopic, cscSkill, prompt, choiceTexts, correctChoice, explanation, difficulty, expectedSeconds, provenance, stimulus) {
  return {
    id: `v${String(version).padStart(2, "0")}-q${String(itemNumber).padStart(3, "0")}`,
    version,
    itemNumber,
    section,
    subtopic,
    cscSkill,
    prompt,
    choices: choiceTexts.map((text, index) => ({ id: "ABCD"[index], text })),
    correctChoice,
    explanation,
    difficulty,
    expectedSeconds,
    reviewStatus: "needs_review",
    qualityStatus: "needs_review",
    provenance,
    ...(stimulus ? { stimulus } : {}),
    mode: "typed",
  };
};
window.CSC_AUTHORED_ITEM = function authoredItem(version, itemNumber, section, subtopic, cscSkill, prompt, correctText, distractorTexts, correctChoice, explanation, difficulty, expectedSeconds, provenance, stimulus) {
  const choiceTexts = [...distractorTexts];
  choiceTexts.splice("ABCD".indexOf(correctChoice), 0, correctText);
  return window.CSC_AUTHORED_QUESTION(version, itemNumber, section, subtopic, cscSkill, prompt, choiceTexts, correctChoice, explanation, difficulty, expectedSeconds, provenance, stimulus);
};
window.CSC_COMPACT_ITEM = function compactItem(version, itemNumber, code, subtopic, prompt, correctText, distractorTexts, correctChoice, explanation, difficulty, provenance, stimulus) {
  const domains = {
    C: ["General Information", "Philippine Constitution"], R: ["General Information", "RA 6713 / Code of Conduct"], H: ["General Information", "Peace and human rights"], E: ["General Information", "Environment management and protection"],
    WM: ["Verbal Ability", "Word meaning"], SC: ["Verbal Ability", "Sentence completion"], ER: ["Verbal Ability", "Error recognition"], SS: ["Verbal Ability", "Sentence structure"], PO: ["Verbal Ability", "Paragraph organization"], RC: ["Verbal Ability", "Reading comprehension"],
    BO: ["Numerical Ability", "Basic operations"], NS: ["Numerical Ability", "Number sequence"], WP: ["Numerical Ability", "Word problems"],
    WA: ["Analytical Ability", "Word analogy"], AR: ["Analytical Ability", "Symbolic logic / abstract reasoning"], IC: ["Analytical Ability", "Identifying assumptions and drawing conclusions"], DI: ["Analytical Ability", "Data interpretation"],
  };
  const [section, cscSkill] = domains[code];
  return window.CSC_AUTHORED_ITEM(version, itemNumber, section, subtopic, cscSkill, prompt, correctText, distractorTexts, correctChoice, explanation, difficulty, { easy: 50, medium: 70, hard: 95 }[difficulty], provenance, stimulus);
};
