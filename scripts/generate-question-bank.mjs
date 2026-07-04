import fs from "node:fs";
import path from "node:path";

const SECTIONS = {
  GENERAL: "General Information",
  VERBAL: "Verbal Ability",
  NUMERICAL: "Numerical Ability",
  ANALYTICAL: "Analytical Ability",
};

const VERSION_COUNT = 20;
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "app", "generated-question-bank.js");
const AUDIT_OUTPUT = path.join(ROOT, "data", "generated_bank_audit.json");

const CSC_COVERAGE_MATRIX = {
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
    "Percent, ratio, average, rate, and discount",
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

function seededShuffle(items, seed) {
  const output = items.slice();
  let state = seed >>> 0;
  for (let index = output.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function pick(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function choiceSet(correct, distractors, seed) {
  const unique = [correct];
  for (const distractor of distractors) {
    if (!unique.includes(distractor)) unique.push(distractor);
  }
  const filler = ["Cannot be determined", "None of the choices", "All of the choices", "Not enough information"];
  for (const value of filler) {
    if (unique.length >= 4) break;
    if (!unique.includes(value)) unique.push(value);
  }
  const shuffled = seededShuffle(unique.slice(0, 4), seed);
  const letters = ["A", "B", "C", "D"];
  return {
    choices: shuffled.map((text, index) => ({ id: letters[index], text })),
    correctChoice: letters[shuffled.indexOf(correct)],
  };
}

function publicStimulus(stimulus) {
  if (!stimulus) return undefined;
  const { solutionOrder, ...publicData } = stimulus;
  return publicData;
}

function q(version, itemNumber, section, subtopic, prompt, correct, distractors, explanation, options = {}) {
  const result = choiceSet(correct, distractors, version * 10000 + itemNumber * 97);
  return {
    id: `generated-v${String(version).padStart(2, "0")}-${String(itemNumber).padStart(3, "0")}`,
    version,
    itemNumber,
    section,
    subtopic,
    prompt: `${prompt} Practice set ${version}, item ${itemNumber}.`,
    choices: result.choices,
    correctChoice: result.correctChoice,
    explanation,
    difficulty: options.difficulty || "medium",
    expectedSeconds: options.expectedSeconds || 60,
    reviewStatus: options.reviewStatus || "reviewed",
    qualityStatus: options.qualityStatus || "reviewed",
    mode: "typed",
    cscSkill: options.cscSkill || subtopic,
    stimulus: publicStimulus(options.stimulus),
  };
}

const offices = ["records office", "licensing unit", "health desk", "budget section", "municipal treasurer", "releasing window"];
const publicItems = ["business permit", "medical certificate", "clearance", "training request", "scholarship application", "tax declaration"];

const generalTemplates = [
  (v, i) => {
    const office = pick(offices, v + i);
    return q(v, i, SECTIONS.GENERAL, "RA 6713 / public interest", `A ${office} employee is asked by a relative to move one application ahead of earlier applicants. Which public-service norm should control the employee's action?`, "Commitment to public interest", ["Personal loyalty", "Political accommodation", "Speed over fairness"], "RA 6713 requires public officers to put public interest above personal interest.", { expectedSeconds: 45, cscSkill: "RA 6713 / Code of Conduct" });
  },
  (v, i) => q(v, i, SECTIONS.GENERAL, "RA 6713 / response period", "A written request from a citizen is complete and within the office's authority. Under the Code of Conduct, what is the commonly tested maximum period for action?", "15 working days", ["7 calendar days", "30 calendar days", "60 working days"], "The Code of Conduct is commonly tested as requiring action on written public requests within 15 working days.", { expectedSeconds: 45, cscSkill: "RA 6713 / Code of Conduct" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "SALN", "A newly appointed employee is told to disclose assets, liabilities, business interests, and financial connections. Which document is required?", "Statement of Assets, Liabilities, and Net Worth", ["Statement of Annual Leave and Notices", "Service Appointment Ledger Number", "Summary of Agency Legal Needs"], "SALN stands for Statement of Assets, Liabilities, and Net Worth.", { expectedSeconds: 40, cscSkill: "RA 6713 / Code of Conduct" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Bill of Rights", "Which article of the 1987 Philippine Constitution contains the Bill of Rights?", "Article III", ["Article I", "Article II", "Article VI"], "Article III is the Bill of Rights.", { expectedSeconds: 40, cscSkill: "Philippine Constitution" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Constitutional commissions", "The Civil Service Commission is classified under the Constitution as a:", "Constitutional Commission", ["Cabinet department", "Legislative bureau", "Trial court"], "The CSC is one of the Constitutional Commissions.", { expectedSeconds: 40, cscSkill: "Philippine Constitution" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Due process", "Before the State deprives a person of life, liberty, or property, what constitutional guarantee must be observed?", "Due process of law", ["Automatic forfeiture", "Executive privilege", "Secret notice only"], "Due process protects people from arbitrary government action.", { expectedSeconds: 45, cscSkill: "Philippine Constitution" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Right to information", "A citizen asks for a copy of a public office's published processing fees. Which constitutional principle supports lawful access?", "Right to information on matters of public concern", ["Right against self-incrimination", "Right to remain silent", "Right to compensation"], "The Constitution recognizes access to information on matters of public concern, subject to lawful limits.", { expectedSeconds: 50, cscSkill: "Philippine Constitution" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Accountability", "A supervisor documents why a transaction was delayed and records the corrective action. Which principle is best shown?", "Accountability", ["Seniority", "Immunity", "Confidentiality"], "Accountability means public officers are answerable for official acts.", { expectedSeconds: 45, cscSkill: "Public accountability and service ethics" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Transparency", "A city office posts its steps, fees, forms, and processing time where clients can inspect them. Which governance value is shown?", "Transparency", ["Favoritism", "Secrecy", "Centralization"], "Transparency makes public processes visible and understandable.", { expectedSeconds: 45, cscSkill: "Public accountability and service ethics" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Political neutrality", "During an election period, a public employee refuses to use office supplies for a candidate's campaign. Which civil-service value is observed?", "Political neutrality", ["Partisan loyalty", "Private sponsorship", "Electoral favoritism"], "Civil servants are expected to maintain political neutrality in public service.", { expectedSeconds: 45, cscSkill: "Public accountability and service ethics" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Gift prohibition", "An applicant offers a gift while a permit is pending. What should the employee do?", "Decline the gift because it may affect official duty", ["Accept it after office hours", "Accept it if the value is small", "Keep it and decide faster"], "Gifts connected to official action create a conflict and should be refused.", { expectedSeconds: 45, cscSkill: "RA 6713 / Code of Conduct" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Ease of doing business", "A frontline office removes duplicate signatures and uses a clear citizen's charter. The reform mainly supports:", "Efficient and transparent service delivery", ["Longer approval routing", "Informal facilitation fees", "Hidden processing steps"], "Citizen-facing service rules should simplify and make transactions transparent.", { expectedSeconds: 55, cscSkill: "Public accountability and service ethics" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Environmental rights", "The constitutional policy on a balanced and healthful ecology is most connected with:", "Environmental protection", ["Foreign trade", "Tax assessment", "Criminal sentencing"], "A balanced and healthful ecology concerns environmental protection.", { expectedSeconds: 45, cscSkill: "Environment management and protection" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Solid waste management", "Which office practice best supports ecological solid waste management?", "Segregating recyclable, biodegradable, and residual waste", ["Burning mixed paper waste", "Mixing recyclables with food waste", "Discarding reusable supplies immediately"], "Waste segregation and reduction support ecological solid waste management.", { expectedSeconds: 50, cscSkill: "Environment management and protection" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Air quality coordination", "For technical rules on air-quality standards, a local office should primarily coordinate with the:", "Department of Environment and Natural Resources", ["Department of Tourism", "Department of Finance", "Department of Education"], "DENR is the primary agency for environment and natural resources concerns.", { expectedSeconds: 45, cscSkill: "Environment management and protection" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Human rights", "The prohibition against torture and cruel treatment is best understood as a:", "Fundamental human-rights protection", ["Routine investigation method", "Privilege for officials", "Rule only for minors"], "Human rights principles prohibit torture and cruel treatment.", { expectedSeconds: 45, cscSkill: "Peace and human rights" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Peace education", "Peace education in public programs primarily develops the ability to:", "Resolve conflict through dialogue and non-violence", ["Win disputes by force", "Encourage rivalry", "Avoid communication"], "Peace education promotes non-violent conflict resolution.", { expectedSeconds: 45, cscSkill: "Peace and human rights" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Indigenous peoples", "Constitutional protection for indigenous cultural communities is intended to preserve their:", "Cultural integrity", ["Political isolation", "Economic exclusion", "Loss of identity"], "The Constitution recognizes and protects indigenous cultural communities and their rights.", { expectedSeconds: 45, cscSkill: "Peace and human rights" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Professionalism", "A clerk remains courteous, accurate, and timely despite a long queue. Which public-service value is best illustrated?", "Professionalism", ["Nepotism", "Delay", "Personal privilege"], "Professionalism requires competent, ethical, and respectful public service.", { expectedSeconds: 45, cscSkill: "Public accountability and service ethics" }),
  (v, i) => q(v, i, SECTIONS.GENERAL, "Confidential information", "An employee learns private client data while processing a record. What is the best action?", "Use the information only for authorized official purposes", ["Discuss it with friends", "Post it as a warning", "Use it for a private transaction"], "Private client data should be protected and used only for authorized work.", { expectedSeconds: 45, cscSkill: "Public accountability and service ethics" }),
];

const vocabPairs = [
  ["meticulous", "very careful and exact", ["careless", "temporary", "unrelated"]],
  ["impartial", "fair and unbiased", ["angry", "delayed", "confidential"]],
  ["succinct", "brief and clear", ["lengthy and vague", "incorrect", "decorative"]],
  ["prudent", "careful and wise", ["reckless", "expensive", "informal"]],
  ["mitigate", "make less severe", ["make worse", "ignore", "repeat"]],
  ["scrutinize", "examine closely", ["approve blindly", "decorate", "postpone"]],
  ["lucid", "clear", ["confusing", "emotional", "secret"]],
  ["discrepancy", "inconsistency", ["agreement", "schedule", "receipt"]],
  ["expedite", "speed up", ["delay", "hide", "reject"]],
  ["obsolete", "no longer useful", ["new", "mandatory", "accurate"]],
];

const filipinoPairs = [
  ["masinop", "maayos at maingat", ["pabaya", "maingay", "marahas"]],
  ["maagap", "kumikilos bago lumala ang problema", ["palaging nagpapaliban", "walang pakialam", "laging tumututol"]],
  ["makatarungan", "pantay at ayon sa tama", ["may kinikilingan", "magastos", "malabo"]],
  ["pananagutan", "responsibilidad sa ginawa", ["pag-iwas sa tungkulin", "pagpapahinga", "paglalakbay"]],
  ["ipinagpaliban", "inantala", ["sinimulan", "tinapos", "pinabilis"]],
  ["mapanuri", "maingat magsuri", ["padalos-dalos", "tahimik", "madaldal"]],
  ["tahasang", "direkta o walang paligoy-ligoy", ["malabo", "palihim", "mabagal"]],
  ["kabuhayan", "pinagkukunan ng ikinabubuhay", ["libangan", "parusa", "pahinga"]],
];

const grammarItems = [
  ["Which sentence is grammatically correct?", "The list of examinees was posted before noon.", ["The list of examinees were posted before noon.", "Each applicant have a valid ID.", "Neither report are complete."], "The singular subject 'list' takes the singular verb 'was'."],
  ["Choose the correct word: The committee gave _____ recommendation after reviewing the file.", "its", ["it's", "their", "there"], "'Its' is the possessive form."],
  ["Choose the correct word: The new queueing system had a clear _____ on waiting time.", "effect", ["affect", "effective", "effectively"], "'Effect' is the noun meaning result."],
  ["Which sentence uses pronouns correctly?", "The officer who signed the form is available.", ["The officer whom signed the form is available.", "The applicant which called is waiting.", "The files who were checked are ready."], "'Who' is the subject of the clause."],
  ["Identify the error: The supervisor and the accountant is reviewing the report.", "is", ["supervisor", "accountant", "report"], "A compound subject requires the plural verb 'are'."],
  ["Which sentence is concise and correct?", "Submit the form before the deadline.", ["Kindly please submit the form before the deadline.", "Submit the form before prior to the deadline.", "The form deadline submit before."], "The correct sentence is direct and grammatical."],
];

const readingScenarios = [
  {
    passage: "The city introduced online appointment slots, but it kept a walk-in lane for senior citizens and clients without internet access.",
    main: "Digital service should improve speed without excluding clients who need offline access.",
    detail: "It kept a walk-in lane for clients who might be excluded online.",
  },
  {
    passage: "After complaints about unclear fees, the office revised its citizen's charter and posted sample computations beside the cashier.",
    main: "Clear public information can reduce confusion in government transactions.",
    detail: "The office posted sample computations beside the cashier.",
  },
  {
    passage: "A records unit reduced missing files by assigning tracking numbers, recording release dates, and requiring receiving signatures.",
    main: "Tracking controls improve accountability over documents.",
    detail: "The unit assigned tracking numbers and recorded release dates.",
  },
  {
    passage: "The training team noticed repeated encoding errors, so it prepared a checklist and paired new staff with experienced encoders.",
    main: "Training and process checks can reduce recurring errors.",
    detail: "The team prepared a checklist and paired new staff with experienced encoders.",
  },
];

function verbalQuestion(version, localIndex, itemNumber) {
  const mod = (localIndex - 1) % 12;
  const office = pick(offices, version + localIndex);
  if (mod === 0) {
    const [word, answer, distractors] = pick(vocabPairs, version + localIndex);
    return q(version, itemNumber, SECTIONS.VERBAL, "English vocabulary", `In the sentence, choose the best meaning of "${word}": The ${office} gave a ${word} review of the supporting papers.`, answer, distractors, `"${word}" is best understood as "${answer}" in this context.`, { expectedSeconds: 45, cscSkill: "English vocabulary" });
  }
  if (mod === 1) {
    const [word, answer, distractors] = pick(filipinoPairs, version + localIndex);
    return q(version, itemNumber, SECTIONS.VERBAL, "Filipino vocabulary", `Piliin ang pinakamalapit na kahulugan ng salitang "${word}" sa gamit pang-opisina.`, answer, distractors, `Ang "${word}" ay pinakamalapit sa kahulugang "${answer}".`, { expectedSeconds: 45, cscSkill: "Filipino vocabulary" });
  }
  if (mod === 2 || mod === 5 || mod === 8) {
    const [prompt, answer, distractors, explanation] = pick(grammarItems, version + localIndex);
    return q(version, itemNumber, SECTIONS.VERBAL, "Grammar and correct usage", prompt, answer, distractors, explanation, { expectedSeconds: 50, cscSkill: "Grammar and correct usage" });
  }
  if (mod === 3 || mod === 9) {
    const scenario = pick(readingScenarios, version + localIndex);
    return q(version, itemNumber, SECTIONS.VERBAL, "Reading comprehension", `${scenario.passage} What is the main idea?`, scenario.main, ["Digital tools remove the need for public employees.", "Only online clients should be served.", "Complaints should be ignored after posting rules."], "The best answer states the broader point rather than one minor detail.", { expectedSeconds: 80, cscSkill: "Reading comprehension" });
  }
  if (mod === 4 || mod === 10) {
    const scenario = pick(readingScenarios, version + localIndex + 3);
    return q(version, itemNumber, SECTIONS.VERBAL, "Reading comprehension detail", `${scenario.passage} Which detail supports the office's action?`, scenario.detail, ["It stopped all public service.", "It removed all written records.", "It made the process secret."], "The correct answer is an explicit detail from the passage.", { expectedSeconds: 75, cscSkill: "Reading comprehension" });
  }
  if (mod === 6) {
    return q(version, itemNumber, SECTIONS.VERBAL, "Correct reasoning of thought process", "A memo says all complete applications are encoded within two days. Ana's application was complete on Monday. Which conclusion is best supported?", "Ana's application should be encoded by Wednesday if the rule is followed.", ["Ana's application was already approved.", "Ana does not need supporting documents.", "All incomplete applications are rejected."], "The conclusion follows only from the timing rule, not from approval or rejection.", { expectedSeconds: 70, cscSkill: "Correct reasoning of thought process" });
  }
  if (mod === 7) {
    return q(version, itemNumber, SECTIONS.VERBAL, "Filipino correct usage", "Alin ang pangungusap na tama ang ayos at gamit?", "Maagang dumating ang mga aplikante para sa pagsusulit.", ["Maaga dumating ang aplikante sila sa pagsusulit.", "Dumating maaga pagsusulit ang aplikante.", "Ang aplikante sila ay maaga dumating."], "The correct sentence has natural Filipino word order and agreement.", { expectedSeconds: 55, cscSkill: "Filipino vocabulary" });
  }
  return q(version, itemNumber, SECTIONS.VERBAL, "English vocabulary", "Choose the word most nearly opposite of 'reluctant' in this sentence: The witness was reluctant to sign the statement.", "eager", ["hesitant", "unwilling", "reserved"], "The opposite of reluctant is eager or willing.", { expectedSeconds: 40, cscSkill: "English vocabulary" });
}

function numberChoices(correct, offsets) {
  return offsets.map((offset) => String(correct + offset));
}

function makeServiceStimulus(version, section, startItem) {
  const base = 42 + version;
  const rows = [
    ["Monday", base, base + 9, base - 7],
    ["Tuesday", base + 12, base + 17, base - 2],
    ["Wednesday", base + 7, base + 21, base + 4],
    ["Thursday", base + 15, base + 26, base + 8],
  ];
  return {
    id: `stim-v${String(version).padStart(2, "0")}-${section.toLowerCase()}-${startItem}`,
    kind: "bar-table",
    title: `Client Transactions, Items ${startItem}-${startItem + 3}`,
    label: `Chart for Items ${startItem}-${startItem + 3}`,
    description: "The table shows completed transactions in three service windows over four days.",
    headers: ["Day", "Permits", "Clearances", "Certificates"],
    rows,
    alt: `Transactions table for items ${startItem}-${startItem + 3}: days as rows and permits, clearances, certificates as columns.`,
  };
}

function numericalQuestion(version, localIndex, itemNumber, stimuli) {
  const mod = (localIndex - 1) % 10;
  if (itemNumber >= 101 && itemNumber <= 104) {
    const stimulus = stimuli.numerical;
    const rows = stimulus.rows;
    if (itemNumber === 101) {
      const total = rows[0][1] + rows[0][2] + rows[0][3];
      return q(version, itemNumber, SECTIONS.NUMERICAL, "Data interpretation", "Using the chart, what is the total number of transactions on Monday?", String(total), numberChoices(total, [-12, 10, 18]), `Add Monday's three entries: ${rows[0][1]} + ${rows[0][2]} + ${rows[0][3]} = ${total}.`, { stimulus, expectedSeconds: 90, cscSkill: "Data interpretation" });
    }
    if (itemNumber === 102) {
      const diff = rows[3][2] - rows[1][2];
      return q(version, itemNumber, SECTIONS.NUMERICAL, "Data interpretation", "Using the chart, how many more clearances were completed on Thursday than on Tuesday?", String(diff), numberChoices(diff, [-4, 3, 8]), `Subtract Tuesday clearances from Thursday clearances: ${rows[3][2]} - ${rows[1][2]} = ${diff}.`, { stimulus, expectedSeconds: 90, cscSkill: "Data interpretation" });
    }
    if (itemNumber === 103) {
      const permits = rows.reduce((sum, row) => sum + row[1], 0);
      return q(version, itemNumber, SECTIONS.NUMERICAL, "Data interpretation", "Using the chart, what is the total number of permits for the four days?", String(permits), numberChoices(permits, [-15, 12, 24]), `Add all permit counts: ${rows.map((row) => row[1]).join(" + ")} = ${permits}.`, { stimulus, expectedSeconds: 95, cscSkill: "Data interpretation" });
    }
    const wedTotal = rows[2][1] + rows[2][2] + rows[2][3];
    const thuTotal = rows[3][1] + rows[3][2] + rows[3][3];
    const increase = thuTotal - wedTotal;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Data interpretation", "Using the chart, by how many transactions did the daily total increase from Wednesday to Thursday?", String(increase), numberChoices(increase, [-6, 5, 11]), `Wednesday total is ${wedTotal}; Thursday total is ${thuTotal}; the increase is ${increase}.`, { stimulus, expectedSeconds: 100, cscSkill: "Data interpretation" });
  }
  if (mod === 0) {
    const rows = 7 + version + Math.floor(localIndex / 10);
    const perRow = 9 + (version % 5);
    const damaged = 11 + (localIndex % 6);
    const correct = rows * perRow - damaged;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Arithmetic word problem", `An office printed ${rows} batches with ${perRow} forms per batch. If ${damaged} forms were spoiled, how many usable forms remained?`, String(correct), numberChoices(correct, [-9, 8, 15]), `${rows} x ${perRow} - ${damaged} = ${correct}.`, { expectedSeconds: 75, cscSkill: "Word problems" });
  }
  if (mod === 1) {
    const base = 240 + version * 8 + localIndex;
    const rate = 12 + (version % 4) * 3;
    const correct = Math.round(base * rate / 100);
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Percent", `A unit received ${base} applications. If ${rate}% required correction, about how many applications required correction?`, String(correct), [String(correct + 9), String(correct - 7), String(base - correct)], `${rate}% of ${base} is about ${correct}.`, { expectedSeconds: 65, cscSkill: "Basic operations" });
  }
  if (mod === 2) {
    const x = 8 + version + (localIndex % 4);
    const total = 4 * x + 18;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Linear equation", `Solve for x: 4x + 18 = ${total}.`, String(x), numberChoices(x, [-3, 2, 5]), `Subtract 18, then divide by 4 to get x = ${x}.`, { expectedSeconds: 65, cscSkill: "Basic operations" });
  }
  if (mod === 3) {
    const speed = 36 + version + localIndex;
    const hours = 2 + (localIndex % 4);
    const correct = speed * hours;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Rate word problem", `A service vehicle travelled at ${speed} km/h for ${hours} hours. What distance did it cover?`, `${correct} km`, [`${correct - speed} km`, `${correct + hours} km`, `${speed + hours} km`], `Distance = speed x time = ${correct} km.`, { expectedSeconds: 75, cscSkill: "Word problems" });
  }
  if (mod === 4) {
    const scores = [78 + version, 81 + version, 85 + version, 86 + version];
    const target = 84 + version;
    const correct = target * 5 - scores.reduce((sum, value) => sum + value, 0);
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Average word problem", `A reviewer scored ${scores.join(", ")} in four drills. What fifth score is needed to average ${target}?`, String(correct), numberChoices(correct, [-5, 4, 7]), `Five scores must total ${target * 5}; subtract the first four scores.`, { expectedSeconds: 85, cscSkill: "Word problems" });
  }
  if (mod === 5) {
    const price = 650 + version * 25 + localIndex;
    const discount = 10 + (localIndex % 4) * 5;
    const correct = price - Math.round(price * discount / 100);
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Discount word problem", `A calculator priced at PHP ${price} is discounted by ${discount}%. What is the sale price?`, `PHP ${correct}`, [`PHP ${price - discount}`, `PHP ${price + discount}`, `PHP ${Math.round(price * discount / 100)}`], `Sale price is original price minus the ${discount}% discount.`, { expectedSeconds: 75, cscSkill: "Word problems" });
  }
  if (mod === 6) {
    const start = version + (localIndex % 5);
    const seq = [start, start + 4, start + 10, start + 18, start + 28];
    const correct = start + 40;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Number sequence", `Find the next number: ${seq.join(", ")}, ____`, String(correct), numberChoices(correct, [-6, 5, 12]), "The differences are 4, 6, 8, 10, then 12.", { expectedSeconds: 75, cscSkill: "Number sequence" });
  }
  if (mod === 7) {
    const red = 8 + version;
    const blue = 6 + (localIndex % 6);
    const green = 5;
    const total = red + blue + green;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Probability word problem", `A box has ${red} red, ${blue} blue, and ${green} green folders. What is the probability of selecting a blue folder?`, `${blue}/${total}`, [`${red}/${total}`, `${green}/${total}`, `${blue}/${red}`], `Probability = favorable outcomes over total outcomes = ${blue}/${total}.`, { expectedSeconds: 75, cscSkill: "Word problems" });
  }
  if (mod === 8) {
    const ratioA = 2 + (version % 3);
    const ratioB = 5;
    const total = (ratioA + ratioB) * (10 + (localIndex % 4));
    const correct = total / (ratioA + ratioB) * ratioB;
    return q(version, itemNumber, SECTIONS.NUMERICAL, "Ratio word problem", `The ratio of online to walk-in clients is ${ratioA}:${ratioB}. If there are ${total} clients, how many are walk-in clients?`, String(correct), numberChoices(correct, [-5, 5, 10]), `There are ${ratioA + ratioB} parts; each part is ${total / (ratioA + ratioB)}, so walk-ins are ${correct}.`, { expectedSeconds: 85, cscSkill: "Word problems" });
  }
  const length = 11 + version;
  const width = 7 + (localIndex % 5);
  const correct = length * width;
  return q(version, itemNumber, SECTIONS.NUMERICAL, "Geometry area", `A rectangular notice board is ${length} cm by ${width} cm. What is its area?`, `${correct} sq cm`, [`${2 * (length + width)} sq cm`, `${length + width} sq cm`, `${correct + width} sq cm`], `Area = length x width = ${correct} sq cm.`, { expectedSeconds: 65, cscSkill: "Basic operations" });
}

const analogyPairs = [
  ["ordinance", "council", "decision", "court"],
  ["agenda", "meeting", "docket", "case"],
  ["thermometer", "temperature", "barometer", "pressure"],
  ["registry", "names", "inventory", "supplies"],
  ["auditor", "accounts", "librarian", "books"],
  ["seal", "authenticate", "signature", "approve"],
  ["map", "location", "schedule", "time"],
  ["receipt", "payment", "certificate", "completion"],
];

function makeLogicStimulus(version) {
  const offices = ["Archives", "Budget", "Cashier", "Dispatch"];
  const order = seededShuffle(offices, 5000 + version);
  const constraints = [
    ["1", `${order[0]} is processed before ${order[1]}.`],
    ["2", `${order[2]} is immediately after ${order[1]}.`],
    ["3", `${order[3]} is not first.`],
  ];
  return {
    id: `stim-v${String(version).padStart(2, "0")}-logic-151`,
    kind: "logic-grid",
    title: "Office Queue Rules, Items 151-154",
    label: "Logic setup for Items 151-154",
    description: "Use the rules below to determine the only valid processing order.",
    headers: ["Rule", "Constraint"],
    rows: constraints,
    alt: "A four-position office queue logic setup with before, after, and not-first constraints.",
    solutionOrder: order,
  };
}

function analyticalQuestion(version, localIndex, itemNumber, stimuli) {
  const mod = (localIndex - 1) % 10;
  if (itemNumber >= 151 && itemNumber <= 154) {
    const stimulus = stimuli.analytical;
    const order = stimulus.solutionOrder;
    if (itemNumber === 151) {
      return q(version, itemNumber, SECTIONS.ANALYTICAL, "Data interpretation", "Using the logic setup, which office is first?", order[0], [order[1], order[2], order[3]], "The rule set directly places the first listed office before the next offices in the solved order.", { stimulus, expectedSeconds: 90, cscSkill: "Data interpretation" });
    }
    if (itemNumber === 152) {
      return q(version, itemNumber, SECTIONS.ANALYTICAL, "Data interpretation", "Using the logic setup, which office is immediately after the second office?", order[2], [order[0], order[1], order[3]], `The setup states that ${order[2]} is immediately after ${order[1]}.`, { stimulus, expectedSeconds: 90, cscSkill: "Data interpretation" });
    }
    if (itemNumber === 153) {
      return q(version, itemNumber, SECTIONS.ANALYTICAL, "Identifying assumptions and drawing conclusions", `If ${order[0]} is first and ${order[1]} is second, what must be true?`, `${order[2]} is third`, [`${order[3]} is first`, `${order[1]} is fourth`, `${order[0]} is third`], `The rule says ${order[2]} immediately follows ${order[1]}, so it must be third.`, { stimulus, expectedSeconds: 95, cscSkill: "Identifying assumptions and drawing conclusions" });
    }
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Pattern and sequence reasoning", "Which complete order satisfies all rules?", order.join(" - "), [seededShuffle(order, version).join(" - "), [order[1], order[0], order[2], order[3]].join(" - "), [order[3], order[2], order[1], order[0]].join(" - ")], "Only the correct order satisfies the before, immediately-after, and not-first conditions.", { stimulus, expectedSeconds: 100, cscSkill: "Pattern and sequence reasoning" });
  }
  if (mod === 0) {
    const pair = pick(analogyPairs, version + localIndex);
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Word analogy", `${pair[0].toUpperCase()} : ${pair[1].toUpperCase()} :: ${pair[2].toUpperCase()} : ____`, pair[3], ["folder", "window", "vehicle"], "The second pair must use the same relationship as the first pair.", { expectedSeconds: 65, cscSkill: "Word analogy" });
  }
  if (mod === 1) {
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Identifying assumptions and drawing conclusions", "All approved applications receive a reference number. This application is approved. Which conclusion follows?", "This application receives a reference number.", ["This application is incomplete.", "All applications are approved.", "The applicant paid a penalty."], "The conclusion follows directly from the rule and fact.", { expectedSeconds: 80, cscSkill: "Identifying assumptions and drawing conclusions" });
  }
  if (mod === 2) {
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Identifying assumptions and drawing conclusions", "If the server is offline, online filing stops. Online filing stopped. Which conclusion is valid?", "The server may be offline, but another cause is also possible.", ["The server is definitely offline.", "The filing was approved.", "No one used the system."], "Affirming the consequent is invalid; other causes may stop filing.", { expectedSeconds: 90, cscSkill: "Identifying assumptions and drawing conclusions" });
  }
  if (mod === 3) {
    const start = version + (localIndex % 4);
    const seq = [start, start + 3, start + 9, start + 18, start + 30];
    const correct = start + 45;
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Pattern and sequence reasoning", `Identify the next number: ${seq.join(", ")}, ____`, String(correct), numberChoices(correct, [-9, 6, 12]), "The differences are 3, 6, 9, 12, then 15.", { expectedSeconds: 70, cscSkill: "Pattern and sequence reasoning" });
  }
  if (mod === 4) {
    const startCode = 65 + (version % 6);
    const next = String.fromCharCode(startCode + 6);
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Pattern and sequence reasoning", `Find the next code: ${String.fromCharCode(startCode)}2, ${String.fromCharCode(startCode + 2)}4, ${String.fromCharCode(startCode + 4)}6, ____`, `${next}8`, [`${next}6`, `${String.fromCharCode(startCode + 5)}8`, `${String.fromCharCode(startCode + 6)}10`], "The letter advances by two and the number advances by two.", { expectedSeconds: 70, cscSkill: "Pattern and sequence reasoning" });
  }
  if (mod === 5) {
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Symbolic logic / abstract reasoning", "A pattern repeats: circle, square, triangle, diamond, circle, square, triangle, ____. What comes next?", "diamond", ["circle", "square", "triangle"], "The repeating cycle is circle, square, triangle, diamond.", { expectedSeconds: 60, cscSkill: "Symbolic logic / abstract reasoning" });
  }
  if (mod === 6) {
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Symbolic logic / abstract reasoning", "In a code, STAR means approved, BOX means pending, and X means denied. Which mark should appear beside a completed approved request?", "STAR", ["BOX", "X", "CIRCLE"], "The legend states that STAR means approved.", { expectedSeconds: 55, cscSkill: "Symbolic logic / abstract reasoning" });
  }
  if (mod === 7) {
    const first = 18 + version;
    const second = 11 + localIndex;
    const correct = first - second;
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Data interpretation", `A table says Unit A has ${first} pending requests and Unit B has ${second}. How many more pending requests does Unit A have?`, String(correct), numberChoices(correct, [-3, 4, 7]), `Subtract Unit B from Unit A: ${first} - ${second} = ${correct}.`, { expectedSeconds: 75, cscSkill: "Data interpretation" });
  }
  if (mod === 8) {
    return q(version, itemNumber, SECTIONS.ANALYTICAL, "Word analogy", "KEY : LOCK :: PASSWORD : ____", "ACCOUNT", ["WINDOW", "STAMP", "PAPER"], "A key opens a lock; a password opens or accesses an account.", { expectedSeconds: 60, cscSkill: "Word analogy" });
  }
  return q(version, itemNumber, SECTIONS.ANALYTICAL, "Identifying assumptions and drawing conclusions", "Some electronic records are archived. All archived records have retention dates. What follows?", "Some electronic records have retention dates.", ["All electronic records are archived.", "No paper record has a date.", "All retention dates are electronic."], "The two statements imply that at least some electronic records have retention dates.", { expectedSeconds: 85, cscSkill: "Identifying assumptions and drawing conclusions" });
}

function buildVersion(version) {
  const stimuli = {
    numerical: makeServiceStimulus(version, "Numerical", 101),
    analytical: makeLogicStimulus(version),
  };
  const questions = [];
  for (let item = 1; item <= 20; item += 1) questions.push(generalTemplates[item - 1](version, item));
  for (let item = 21; item <= 80; item += 1) questions.push(verbalQuestion(version, item - 20, item));
  for (let item = 81; item <= 120; item += 1) questions.push(numericalQuestion(version, item - 80, item, stimuli));
  for (let item = 121; item <= 170; item += 1) questions.push(analyticalQuestion(version, item - 120, item, stimuli));
  return {
    id: `generated-professional-v${String(version).padStart(2, "0")}`,
    title: `Professional Practice Version ${version}`,
    source: "Original generated reviewer content based on official CSC Professional coverage categories",
    totalTimeSeconds: 11400,
    coverageMatrix: CSC_COVERAGE_MATRIX,
    questions,
  };
}

function summarizeVersion(version) {
  const bySection = {};
  const bySkill = {};
  const stimulusGroups = {};
  for (const question of version.questions) {
    bySection[question.section] = (bySection[question.section] || 0) + 1;
    bySkill[question.cscSkill] = (bySkill[question.cscSkill] || 0) + 1;
    if (question.stimulus) {
      const group = stimulusGroups[question.stimulus.id] || {
        id: question.stimulus.id,
        label: question.stimulus.label,
        kind: question.stimulus.kind,
        itemNumbers: [],
      };
      group.itemNumbers.push(question.itemNumber);
      stimulusGroups[question.stimulus.id] = group;
    }
  }
  return {
    id: version.id,
    title: version.title,
    totalQuestions: version.questions.length,
    bySection,
    bySkill,
    stimulusGroups: Object.values(stimulusGroups),
  };
}

const versions = Array.from({ length: VERSION_COUNT }, (_, index) => buildVersion(index + 1));
const audit = {
  generatedAt: new Date().toISOString(),
  versionCount: versions.length,
  totalQuestions: versions.reduce((sum, version) => sum + version.questions.length, 0),
  coverageMatrix: CSC_COVERAGE_MATRIX,
  versions: versions.map(summarizeVersion),
};

fs.writeFileSync(OUTPUT, `window.CSC_EXAM_VERSIONS = ${JSON.stringify(versions, null, 2)};\n`, "utf8");
fs.writeFileSync(AUDIT_OUTPUT, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

console.log(`Generated ${versions.length} versions and ${audit.totalQuestions} questions.`);
