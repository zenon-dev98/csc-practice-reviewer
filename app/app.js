(function () {
  "use strict";

  const TOTAL_TIME_SECONDS = 3 * 60 * 60 + 10 * 60;
  const COCKPIT_WIDTH = 1672;
  const COCKPIT_HEIGHT = 942;
  const PASSING_PERCENT = 80;
  const SYNC_INTERVAL_MS = 3500;
  const DEFAULT_PRACTICE_COUNT = 20;
  const generatedVersions = window.CSC_EXAM_VERSIONS || [];
  const generatedQuestions = generatedVersions.flatMap((version) => version.questions || []);
  const sourceQuestions = window.CSC_QUESTIONS || [];
  const questionBank = generatedQuestions.length > 0 ? generatedQuestions : sourceQuestions;
  const questionsById = new Map(questionBank.map((question) => [question.id, question]));
  const examVersions = generatedVersions.map((version, index) => ({
    id: version.id,
    title: version.title || `Mock Version ${index + 1}`,
    number: index + 1,
    questions: version.questions || []
  }));
  const SECTION_GROUPS = [
    { section: "General Information", label: "General", tone: "general", range: "1-20", start: 1, end: 20 },
    { section: "Verbal Ability", label: "Verbal", tone: "verbal", range: "21-80", start: 21, end: 80 },
    { section: "Numerical Ability", label: "Numerical", tone: "numerical", range: "81-120", start: 81, end: 120 },
    { section: "Analytical Ability", label: "Analytical", tone: "analytical", range: "121-170", start: 121, end: 170 }
  ];
  const SCREEN_SECTION_GROUPS = [
    { section: "Verbal Ability", label: "Verbal Ability", tone: "verbal", range: "1-60", start: 1, end: 60 },
    { section: "Numerical Ability", label: "Numerical Ability", tone: "numerical", range: "61-100", start: 61, end: 100 },
    { section: "Analytical Ability", label: "Analytical Ability", tone: "analytical", range: "101-140", start: 101, end: 140 },
    { section: "General Information", label: "General Information", tone: "general", range: "141-170", start: 141, end: 170 }
  ];
  const FIXTURE_STATES = new Set([
    "loading",
    "config",
    "fatal",
    "create",
    "create-loading",
    "select",
    "signin-loading",
    "forgot-password",
    "forgot-error",
    "forgot-success",
    "dashboard",
    "dashboard-empty",
    "setup",
    "exam",
    "exam-collapsed",
    "graph",
    "pause",
    "submit",
    "timeout",
    "chart-modal",
    "results",
    "results-fail",
    "results-practice",
    "review",
    "review-empty",
    "practice",
    "mistakes",
    "mistakes-empty",
    "flagged",
    "flagged-empty",
    "recent",
    "progress",
    "progress-empty",
    "profile-modal",
    "password-expanded",
    "delete-account",
    "delete-attempt"
  ]);
  const PRACTICE_CATEGORIES = SECTION_GROUPS.map((group) => ({
    ...group,
    poolSize: 120,
    description: {
      "General Information": "Constitution, ethics, environment, accountability, and public service values.",
      "Verbal Ability": "Vocabulary, Filipino usage, grammar, comprehension, and reasoning of thought.",
      "Numerical Ability": "Operations, percentages, averages, rates, sequences, and data interpretation.",
      "Analytical Ability": "Analogy, assumptions, conclusions, symbolic logic, and pattern reasoning."
    }[group.section]
  }));
  const DEFAULT_OPTIONS = {
    showTimer: true,
    enablePause: true,
    shuffleQuestions: false,
    shuffleAnswers: false,
    versionId: examVersions[0]?.id || "",
    practiceCount: DEFAULT_PRACTICE_COUNT,
    practiceDifficulty: "mixed",
    practiceCategory: "Verbal Ability"
  };
  const app = {
    client: null,
    session: null,
    profile: null,
    attempts: [],
    draft: null,
    updates: [],
    view: { name: "boot" },
    modal: null,
    dialogTarget: null,
    dialogError: "",
    resetEmail: "",
    fatal: null,
    busyAction: "",
    examNavOpen: false,
    toast: "",
    timerId: null,
    syncTimer: null,
    dirtyAttempts: new Set(),
    dirtyAnswers: new Set(),
    flushing: false,
    pendingQuestionEntry: new Map(),
    expandedNavGroups: new Set(),
    reviewFilter: "all",
    recentTab: "all",
    practiceReviewTab: "practice",
    questionVersion: "1",
    fixtureMode: false,
    fixtureState: ""
  };

  const root = document.getElementById("app");

  function boot() {
    syncCockpitScale();
    window.addEventListener("resize", syncCockpitScale, { passive: true });
    window.addEventListener("beforeunload", () => {
      flushDirty({ immediate: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushDirty({ immediate: true });
    });
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);
    new MutationObserver(focusActiveDialog).observe(root, { childList: true, subtree: true });
    init();
  }

  function focusActiveDialog() {
    const dialog = root.querySelector("[role='dialog'], [role='alertdialog']");
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true });
  }

  function syncCockpitScale() {
    const desktop = window.innerWidth >= 1100;
    const scale = desktop ? Math.min(window.innerWidth / COCKPIT_WIDTH, window.innerHeight / COCKPIT_HEIGHT) : 1;
    root.style.setProperty("--cockpit-scale", String(scale));
    root.classList.toggle("cockpit-desktop", desktop);
  }

  async function init() {
    const fixture = normalizeFixtureName(new URLSearchParams(location.search).get("fixture"));
    if (fixture) {
      initFixture(fixture);
      return;
    }

    if (!validateConfig()) {
      setView({ name: "config" });
      return;
    }

    try {
      app.client = window.supabase.createClient(
        window.CSC_SUPABASE_CONFIG.url.replace(/\/rest\/v1\/?$/, ""),
        window.CSC_SUPABASE_CONFIG.publishableKey || window.CSC_SUPABASE_CONFIG.anonKey,
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
      const { data, error } = await app.client.auth.getSession();
      if (error) throw error;
      app.session = data.session;
      app.client.auth.onAuthStateChange(async (event, session) => {
        const hadSession = Boolean(app.session);
        app.session = session;
        if (session) {
          if (!hadSession || app.view.name === "boot" || app.view.name === "create" || app.view.name === "signin") {
            await loadUserData();
            app.modal = null;
            setView({ name: "dashboard" });
          }
        } else {
          app.modal = null;
          app.profile = null;
          app.attempts = [];
          setView({ name: "create" });
        }
      });
      if (app.session) {
        await loadUserData();
        setView({ name: "dashboard" });
      } else {
        setView({ name: "create" });
      }
    } catch (error) {
      renderFatal("Supabase is not ready", readableError(error));
    }
  }

  function validateConfig() {
    const config = window.CSC_SUPABASE_CONFIG || {};
    const key = config.publishableKey || config.anonKey;
    return Boolean(config.url && key && /^https:\/\/.+\.supabase\.co\/?$/.test(config.url.replace(/\/rest\/v1\/?$/, "")));
  }

  function normalizeFixtureName(value) {
    const name = String(value || "").trim().toLowerCase().replace(/_/g, "-");
    return FIXTURE_STATES.has(name) ? name : "";
  }

  function initFixture(fixtureState) {
    app.fixtureMode = true;
    app.fixtureState = fixtureState;
    app.client = null;
    app.session = { user: { id: "fixture-user", email: "john.smith@email.com" } };
    app.profile = fixtureProfile();
    app.attempts = fixtureAttempts();
    app.draft = { user_id: "fixture-user", options: { ...DEFAULT_OPTIONS, versionId: examVersions[0]?.id || "fixture-version-1" } };
    app.updates = [{ title: "Two reviewer updates", body: "Visual QA fixture notification." }, { title: "Practice reminders", body: "Continue recent drills." }];
    app.modal = null;
    app.toast = null;
    app.dialogTarget = null;
    app.dialogError = "";
    app.fatal = null;
    app.busyAction = fixtureState.endsWith("-loading") ? fixtureState.replace("-loading", "") : "";
    app.examNavOpen = false;
    app.reviewFilter = "all";
    app.recentTab = "all";
    app.practiceReviewTab = "practice";
    app.expandedNavGroups.clear();

    const active = getAttempt("fixture-active");
    const submitted = getAttempt("fixture-submitted");
    if (active) {
      active.status = "in_progress";
      active.current_question_index = 42;
      active.elapsed_seconds = 38;
    }

    if (fixtureState === "loading") return setView({ name: "boot" });
    if (fixtureState === "config") return setView({ name: "config" });
    if (fixtureState === "fatal") {
      app.fatal = { title: "Synchronization unavailable", message: "Reviewer data could not be loaded. Check the connection and reload the application." };
      return setView({ name: "fatal" });
    }
    if (fixtureState === "dashboard-empty" || fixtureState === "progress-empty" || fixtureState === "mistakes-empty") {
      app.attempts = [];
      if (fixtureState === "dashboard-empty") return setView({ name: "dashboard" });
      if (fixtureState === "progress-empty") return setView({ name: "recent" });
      app.practiceReviewTab = "mistakes";
      return setView({ name: "practice" });
    }

    if (fixtureState === "create" || fixtureState === "create-loading") return setView({ name: "create" });
    if (["select", "signin-loading", "forgot-password", "forgot-error", "forgot-success"].includes(fixtureState)) {
      if (fixtureState === "forgot-error") {
        app.modal = "forgot-password";
        app.dialogError = "Enter a valid email address.";
        app.view = { name: "signin" };
        return render();
      } else if (fixtureState.startsWith("forgot")) app.modal = fixtureState;
      return setView({ name: "signin" });
    }
    if (fixtureState === "setup") return setView({ name: "setup" });
    if (fixtureState === "practice" || fixtureState === "mistakes" || fixtureState === "flagged" || fixtureState === "flagged-empty") {
      if (fixtureState === "flagged-empty") {
        app.attempts.forEach((attempt) => Object.values(attempt.answers).forEach((answer) => { answer.flagged = false; }));
      }
      app.practiceReviewTab = fixtureState === "mistakes" ? "mistakes" : fixtureState === "flagged" ? "flagged" : "practice";
      if (fixtureState === "flagged-empty") app.practiceReviewTab = "flagged";
      return setView({ name: "practice" });
    }
    if (fixtureState === "recent" || fixtureState === "progress" || fixtureState === "delete-attempt") {
      if (fixtureState === "delete-attempt") {
        app.modal = "delete-attempt";
        app.dialogTarget = submitted.id;
      }
      return setView({ name: "recent" });
    }
    if (fixtureState === "results" || fixtureState === "results-fail") {
      if (fixtureState === "results-fail") {
        Object.values(submitted.answers).forEach((answer, index) => { if (index % 3 !== 0) answer.selected_choice = answer.correct_choice === "A" ? "B" : "A"; });
      }
      submitted.score = scoreAttempt(submitted);
      submitted.percent = resultPercent(submitted);
      return setView({ name: "results", attemptId: submitted.id });
    }
    if (fixtureState === "results-practice") {
      const practiceAttempt = getAttempt("fixture-practice");
      practiceAttempt.score = scoreAttempt(practiceAttempt);
      practiceAttempt.percent = resultPercent(practiceAttempt);
      return setView({ name: "results", attemptId: practiceAttempt.id });
    }
    if (fixtureState === "review" || fixtureState === "review-empty") {
      if (fixtureState === "review-empty") {
        Object.values(submitted.answers).forEach((answer) => { answer.flagged = false; });
        app.reviewFilter = "flagged";
      }
      return setView({ name: "review", attemptId: submitted.id, index: fixtureState === "review" ? 42 : 0 });
    }
    if (fixtureState === "profile-modal" || fixtureState === "password-expanded" || fixtureState === "delete-account") {
      app.modal = "profile";
      if (fixtureState === "delete-account") app.modal = "delete-account";
      return setView({ name: "dashboard" });
    }
    if (fixtureState === "graph") {
      active.current_question_index = 81;
      return setView({ name: "exam", attemptId: active.id });
    }
    if (fixtureState === "chart-modal") {
      active.current_question_index = 81;
      app.modal = "chart";
      return setView({ name: "exam", attemptId: active.id });
    }
    if (fixtureState === "pause") {
      active.status = "paused";
      return setView({ name: "exam", attemptId: active.id });
    }
    if (fixtureState === "submit") {
      app.modal = "submit";
      return setView({ name: "exam", attemptId: active.id });
    }
    if (fixtureState === "timeout") {
      active.elapsed_seconds = active.total_time_seconds;
      app.modal = "timeout";
      return setView({ name: "exam", attemptId: active.id });
    }
    if (fixtureState === "exam" || fixtureState === "exam-collapsed") return setView({ name: "exam", attemptId: active.id });
    return setView({ name: "dashboard" });
  }

  async function loadUserData() {
    if (!app.session) return;
    const user = app.session.user;
    const [profileResult, attemptsResult, draftResult, updatesResult] = await Promise.all([
      app.client.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      app.client.from("attempts").select("*, attempt_answers(*)").eq("user_id", user.id).order("started_at", { ascending: false }),
      app.client.from("setup_drafts").select("*").eq("user_id", user.id).maybeSingle(),
      app.client.from("app_updates").select("*").eq("active", true).order("published_at", { ascending: false }).limit(5)
    ]);

    if (profileResult.error && profileResult.error.code !== "PGRST116") throw profileResult.error;
    if (attemptsResult.error) throw attemptsResult.error;
    if (draftResult.error && draftResult.error.code !== "PGRST116") throw draftResult.error;
    if (updatesResult.error) throw updatesResult.error;

    app.profile = profileResult.data || await createProfileFromSession();
    app.attempts = (attemptsResult.data || []).map(normalizeAttempt);
    app.draft = draftResult.data;
    app.updates = updatesResult.data || [];
  }

  async function createProfileFromSession() {
    const user = app.session.user;
    const metadata = user.user_metadata || {};
    const profile = {
      user_id: user.id,
      name: metadata.display_name || metadata.name || user.email?.split("@")[0] || "Reviewer",
      email: user.email || "",
      avatar_preset: Number(metadata.avatar_preset || 0),
      level: "Professional",
      notes: "",
      last_active_at: nowIso()
    };
    const { data, error } = await app.client.from("profiles").upsert(profile, { onConflict: "user_id" }).select("*").single();
    if (error) throw error;
    return data;
  }

  function fixtureProfile() {
    return {
      user_id: "fixture-user",
      name: "John Smith",
      email: "john.smith@email.com",
      avatar_preset: 1,
      level: "Professional",
      notes: "Fixture reviewer profile.",
      birth_date: "",
      last_active_at: "2026-07-04T09:00:00.000Z"
    };
  }

  function fixtureAttempts() {
    return [
      buildFixtureFullAttempt("fixture-active", { status: "in_progress", currentIndex: 42, completed: false }),
      buildFixtureFullAttempt("fixture-submitted", { status: "submitted", currentIndex: 42, completed: true }),
      buildFixturePracticeAttempt("fixture-practice")
    ];
  }

  function buildFixtureFullAttempt(id, options) {
    const completed = Boolean(options.completed);
    const now = "2026-07-04T09:00:00.000Z";
    const answers = {};
    const questionOrder = [];
    for (let displayNumber = 1; displayNumber <= 170; displayNumber += 1) {
      const answer = fixtureAnswer(id, displayNumber, completed);
      answers[answer.question_id] = answer;
      questionOrder.push(answer.question_id);
    }
    return {
      id,
      user_id: "fixture-user",
      mode: "full",
      title: "Professional Mock Exam",
      practice_category: null,
      exam_version_id: "fixture-version-1",
      status: options.status,
      started_at: "2026-07-04T06:00:00.000Z",
      submitted_at: completed ? "2026-07-04T08:54:00.000Z" : null,
      paused_at: null,
      elapsed_seconds: completed ? (2 * 3600 + 54 * 60) : 38,
      current_question_index: options.currentIndex,
      total_questions: 170,
      total_time_seconds: TOTAL_TIME_SECONDS,
      options: { showTimer: true, enablePause: true, shuffleQuestions: false, shuffleAnswers: false },
      question_order: questionOrder,
      answers,
      score: completed ? 142 : null,
      percent: completed ? 83.5 : null,
      timed_out: false,
      created_at: now,
      updated_at: now
    };
  }

  function buildFixturePracticeAttempt(id) {
    const attempt = buildFixtureFullAttempt(id, { status: "submitted", currentIndex: 0, completed: true });
    const kept = Object.values(attempt.answers).filter((answer) => answer.display_number <= 20);
    attempt.mode = "practice";
    attempt.title = "Category Practice: Verbal Ability";
    attempt.practice_category = "Verbal Ability";
    attempt.exam_version_id = "fixture-practice-verbal";
    attempt.total_questions = kept.length;
    attempt.total_time_seconds = null;
    attempt.elapsed_seconds = 25 * 60;
    attempt.score = 15;
    attempt.percent = 75;
    attempt.question_order = kept.map((answer) => answer.question_id);
    attempt.answers = Object.fromEntries(kept.map((answer, index) => [answer.question_id, { ...answer, position: index, display_number: index + 1 }]));
    return attempt;
  }

  function fixtureAnswer(attemptId, displayNumber, completed) {
    const group = fixtureGroupForDisplay(displayNumber);
    const correctChoice = fixtureCorrectChoice(displayNumber);
    const selectedChoice = completed ? fixtureSubmittedChoice(displayNumber, correctChoice) : fixtureActiveChoice(displayNumber);
    const now = "2026-07-04T09:00:00.000Z";
    const answer = {
      attempt_id: attemptId,
      user_id: "fixture-user",
      question_id: `${attemptId}-q-${displayNumber}`,
      position: displayNumber - 1,
      display_number: displayNumber,
      original_item_number: displayNumber,
      section: group.section,
      subtopic: fixtureSubtopic(group.section, displayNumber),
      csc_skill: fixtureSubtopic(group.section, displayNumber),
      prompt: fixturePrompt(displayNumber, group.section),
      choices: fixtureChoices(displayNumber),
      correct_choice: correctChoice,
      original_correct_choice: correctChoice,
      explanation: fixtureExplanation(displayNumber, correctChoice),
      stimulus: displayNumber >= 81 && displayNumber <= 85 ? fixtureChartStimulus() : null,
      difficulty: displayNumber % 3 === 0 ? "hard" : displayNumber % 2 === 0 ? "medium" : "easy",
      selected_choice: selectedChoice,
      skipped: !completed && fixtureSkippedDisplays().has(displayNumber),
      flagged: fixtureFlaggedDisplays().has(displayNumber),
      time_spent_seconds: completed ? 28 + ((displayNumber * 7) % 96) : (selectedChoice ? 34 + (displayNumber % 25) : 0),
      visit_count: completed ? 1 + (displayNumber % 3 === 0 ? 1 : 0) : (displayNumber <= 50 || displayNumber === 82 ? 1 : 0),
      answer_changes: completed && displayNumber % 17 === 0 ? 1 : 0,
      changed_wrong_to_correct: completed && displayNumber % 34 === 0 ? 1 : 0,
      changed_correct_to_wrong: completed && displayNumber % 51 === 0 ? 1 : 0,
      answer_history: selectedChoice ? [{ choice: selectedChoice, at: now }] : [],
      created_at: now,
      updated_at: now
    };
    if (!completed && displayNumber === 43) {
      answer.time_spent_seconds = 54;
      answer.visit_count = 2;
    }
    if (completed && displayNumber === 43) {
      answer.selected_choice = "B";
      answer.time_spent_seconds = 54;
      answer.flagged = true;
      answer.answer_changes = 1;
    }
    return answer;
  }

  function fixtureGroupForDisplay(displayNumber) {
    return SCREEN_SECTION_GROUPS.find((group) => displayNumber >= group.start && displayNumber <= group.end) || SCREEN_SECTION_GROUPS[0];
  }

  function fixtureSubtopic(section, displayNumber) {
    if (section === "Verbal Ability") return displayNumber % 5 === 0 ? "Reading Comprehension" : "Grammar and Correct Usage";
    if (section === "Numerical Ability") return displayNumber <= 85 ? "Data Interpretation" : "Word Problems";
    if (section === "Analytical Ability") return displayNumber % 2 ? "Logic and Assumptions" : "Symbolic Sequencing";
    return "Public Service Values";
  }

  function fixturePrompt(displayNumber, section) {
    if (displayNumber === 43) return "Which of the following sentences is written correctly?";
    if (displayNumber === 82) return "Based on the chart, which month recorded the highest increase from the previous month?";
    if (section === "Numerical Ability") return `A reviewer answered ${40 + (displayNumber % 9)} questions in ${20 + (displayNumber % 7)} minutes. What rate best describes the work pace?`;
    if (section === "Analytical Ability") return "Choose the option that best completes the logical sequence or conclusion.";
    if (section === "General Information") return "Which statement best reflects ethical and accountable public service?";
    return "Choose the sentence that is grammatically correct and logically clear.";
  }

  function fixtureChoices(displayNumber) {
    if (displayNumber === 43) {
      return [
        { id: "A", text: "Every one of the students were given a handbook." },
        { id: "B", text: "Each of the students were given a handbook." },
        { id: "C", text: "Each of the students was given a handbook." },
        { id: "D", text: "Every one of the students was given a handbook." },
        { id: "E", text: "Each of the students have been given a handbook." }
      ];
    }
    if (displayNumber === 82) {
      return [
        { id: "A", text: "February" },
        { id: "B", text: "March" },
        { id: "C", text: "April" },
        { id: "D", text: "May" },
        { id: "E", text: "January" }
      ];
    }
    return [
      { id: "A", text: "Option A" },
      { id: "B", text: "Option B" },
      { id: "C", text: "Option C" },
      { id: "D", text: "Option D" },
      { id: "E", text: "Option E" }
    ];
  }

  function fixtureCorrectChoice(displayNumber) {
    if (displayNumber === 82) return "B";
    return "C";
  }

  function fixtureSubmittedChoice(displayNumber, correctChoice) {
    const correct = (
      (displayNumber >= 1 && displayNumber <= 54 && displayNumber !== 43) ||
      (displayNumber >= 61 && displayNumber <= 90) ||
      (displayNumber >= 101 && displayNumber <= 133) ||
      (displayNumber >= 141 && displayNumber <= 166)
    );
    return correct ? correctChoice : (correctChoice === "A" ? "B" : "A");
  }

  function fixtureActiveChoice(displayNumber) {
    return fixtureActiveAnsweredDisplays().has(displayNumber) ? fixtureCorrectChoice(displayNumber) : null;
  }

  function fixtureActiveAnsweredDisplays() {
    return new Set([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 41, 42, 43, 47, 50,
      61, 62, 67, 81, 82, 86, 87, 91, 92, 93, 94, 95,
      101, 104, 108, 111, 112, 113, 114, 115,
      141, 148, 151, 152
    ]);
  }

  function fixtureSkippedDisplays() {
    return new Set([45, 64, 85, 103, 144]);
  }

  function fixtureFlaggedDisplays() {
    return new Set([42, 49, 62, 84, 104, 146, 160]);
  }

  function fixtureExplanation(displayNumber, correctChoice) {
    if (displayNumber === 43) return "Each is singular, so the verb should be singular: was. This keeps subject-verb agreement consistent.";
    if (displayNumber === 82) return "The combined regional bars increase most sharply from February to March in the chart.";
    return `Choice ${correctChoice} best matches the tested CSC skill for this item.`;
  }

  function fixtureChartStimulus() {
    return {
      id: "fixture-chart-a",
      label: "Questions 81-85 refer to the chart below.",
      title: "Monthly Sales (in Million PHP) by Region - 2024",
      description: "Grouped monthly sales chart for Luzon, Visayas, and Mindanao.",
      chartType: "grouped-bars",
      xLabel: "Month",
      yLabel: "Sales (Million PHP)",
      headers: ["Month", "Luzon", "Visayas", "Mindanao"],
      rows: [
        ["Jan", 70, 50, 30],
        ["Feb", 80, 55, 35],
        ["Mar", 90, 60, 40],
        ["Apr", 95, 65, 45],
        ["May", 110, 70, 50]
      ],
      series: [
        { label: "Luzon", color: "#214d98", values: [70, 80, 90, 95, 110] },
        { label: "Visayas", color: "#159f9b", values: [50, 55, 60, 65, 70] },
        { label: "Mindanao", color: "#ff9f2f", values: [30, 35, 40, 45, 50] }
      ],
      alt: "Luzon rises from 70 to 110, Visayas from 50 to 70, and Mindanao from 30 to 50 across January to May."
    };
  }

  function normalizeAttempt(row) {
    const answers = {};
    for (const answer of row.attempt_answers || []) {
      answers[answer.question_id] = {
        ...answer,
        choices: toArray(answer.choices),
        stimulus: answer.stimulus || null,
        answer_history: toArray(answer.answer_history)
      };
    }
    return {
      ...row,
      question_order: toArray(row.question_order),
      options: row.options || {},
      answers
    };
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function setView(view) {
    if ((view.name === "create" || view.name === "signin") && app.view.name !== view.name) app.toast = "";
    app.view = view;
    render();
  }

  function render() {
    clearInterval(app.timerId);
    app.timerId = null;
    root.dataset.fixture = app.fixtureMode ? app.fixtureState : "";
    root.dataset.view = app.view.name;
    root.classList.toggle("fixture-mode", app.fixtureMode);

    if (app.view.name === "boot") return renderLoading();
    if (app.view.name === "fatal") return renderFatal(app.fatal?.title || "Application unavailable", app.fatal?.message || "The reviewer could not start.");
    if (app.view.name === "config") return renderConfig();
    if (app.view.name === "create") return renderCreateAccount();
    if (app.view.name === "signin") return renderSignIn();
    if (app.view.name === "dashboard") return renderDashboard();
    if (app.view.name === "setup") return renderSetup();
    if (app.view.name === "exam") return renderExam();
    if (app.view.name === "results") return renderResults();
    if (app.view.name === "review") return renderReview();
    if (app.view.name === "practice") return renderPractice();
    if (app.view.name === "recent") return renderRecentAttempts();
    if (app.view.name === "mistakes") return renderMistakePicker();
    if (app.view.name === "bookmarks") return renderBookmarks();
  }

  function renderLoading() {
    root.innerHTML = cockpitFrame(`
      <section class="system-screen boot-screen" aria-live="polite">
        <div class="system-grid" aria-hidden="true"></div>
        <div class="system-corner top-left" aria-hidden="true"></div><div class="system-corner top-right" aria-hidden="true"></div><div class="system-corner bottom-left" aria-hidden="true"></div><div class="system-corner bottom-right" aria-hidden="true"></div>
        <div class="boot-console">
          <img src="assets/brand-shield.svg" alt="" />
          <p class="eyebrow">Private reviewer network</p>
          <strong class="boot-brand">CSC Practice Reviewer</strong>
          <small class="boot-product-line">Independent mock exam and review tool</small>
          <h1>Syncing reviewer data</h1>
          <div class="segmented-loader" aria-label="Loading"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <b class="boot-progress">68%</b>
          <span>Initializing secure synchronization</span>
          <div class="boot-security"><span>${icon("lock")}<b>Encrypted connection</b><small>AES-256</small></span><span>${icon("shield")}<b>Secure channel</b><small>TLS 1.3</small></span></div>
        </div>
      </section>
    `, "system-frame");
  }

  function renderFatal(title, message) {
    root.innerHTML = cockpitFrame(`
      <section class="system-screen diagnostic-screen">
        <aside class="diagnostic-rail status-rail"><strong>System Status</strong><span>Connection <b>Failed</b></span><span>Services <b>Unavailable</b></span><span>Data Access <b>Pending</b></span><span>Security <b>Standby</b></span></aside>
        <article class="diagnostic-panel danger-diagnostic" role="alert">
          <div class="diagnostic-code">ERR / SYNC-01</div>
          ${brandBlock()}
          <p class="eyebrow">Reviewer diagnostics</p>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(message)}</p>
          <details><summary>Technical details</summary><code>No credentials, account data, or secrets are shown in this diagnostic.</code></details>
          <button class="btn primary" data-action="reload-app" type="button">${icon("refresh")} Reload App</button>
        </article>
        <aside class="diagnostic-rail metrics-rail"><strong>System Metrics</strong><span>Service availability <b>0%</b></span><span>Error rate <b>100%</b></span><span>Connections <b>0</b></span></aside>
      </section>
    `, "system-frame");
  }

  function renderConfig() {
    root.innerHTML = cockpitFrame(`
      <section class="system-screen diagnostic-screen">
        <aside class="diagnostic-rail status-rail"><strong>System Status</strong><span>Connection <b>Missing</b></span><span>Services <b>Waiting</b></span><span>Data Access <b>Pending</b></span><span>Security <b>Standby</b></span></aside>
        <article class="diagnostic-panel warning-diagnostic">
          <div class="diagnostic-code">CFG / API-00</div>
          ${brandBlock()}
          <p class="eyebrow">Developer configuration</p>
          <h1>Supabase setup required</h1>
          <p>This build needs a project URL and publishable browser key in <code>app/supabase-config.js</code>.</p>
          <details><summary>Configuration shape</summary><pre>window.CSC_SUPABASE_CONFIG = {
  url: "https://project-ref.supabase.co",
  publishableKey: "sb_publishable_..."
};</pre></details>
          <button class="btn primary" data-action="reload-app" type="button">${icon("refresh")} Reload App</button>
        </article>
        <aside class="diagnostic-rail metrics-rail"><strong>Configuration</strong><span>Project URL <b>Required</b></span><span>Browser key <b>Required</b></span><span>Secrets exposed <b>No</b></span></aside>
      </section>
    `, "system-frame");
  }

  function renderCreateAccount() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas access-console create-state">
        <div class="auth-copy">
          <span class="soft-pill">${icon("shield")} Private reviewer access</span>
          <h1>Train with focus.<br /><em>Track every run.</em></h1>
          <p>Invite-only Civil Service Professional practice with secure progress, timing, and review history.</p>
          <div class="auth-chips">
            <span>${icon("clock")} <b>Exam continuity</b><small>Pause, resume, and recover unfinished runs</small></span>
            <span>${icon("stats")} <b>Private analytics</b><small>Scores and timing stay tied to your account</small></span>
            <span>${icon("review")} <b>Targeted review</b><small>Return to mistakes and flagged questions</small></span>
          </div>
        </div>
        <form class="auth-card" data-form="signup">
          <div class="auth-card-head">
            <h2>Create Account</h2>
            <p>Set up your reviewer account.</p>
          </div>
          <label class="field-label">Full Name<div class="field-with-icon">${icon("user")}<input name="name" autocomplete="name" placeholder="Enter your full name" required /></div></label>
          <label class="field-label">Email Address<div class="field-with-icon">${icon("mail")}<input name="email" type="email" autocomplete="email" placeholder="Enter your email address" required /></div></label>
          <div class="auth-password-grid">
            <label class="field-label">Password<div class="field-with-icon has-toggle">${icon("key")}<input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="Create a password" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
            <label class="field-label">Confirm Password<div class="field-with-icon has-toggle">${icon("key")}<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Confirm" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
          </div>
          <label class="field-label">Invite Code<div class="field-with-icon">${icon("shield")}<input name="inviteCode" autocomplete="off" placeholder="Enter invite code" required /></div></label>
          <button class="btn primary" data-action="signup-submit" type="button" ${app.busyAction === "create" ? "disabled" : ""}>${app.busyAction === "create" ? "Creating account..." : "Create Account"}</button>
          <div class="auth-divider"><span>or</span></div>
          <p class="auth-switch-copy">Already have an account?</p>
          <button class="text-link" data-action="show-signin" type="button">Sign in</button>
        </form>
      </section>
    `);
  }

  function renderSignIn() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas access-console select-mode">
        <div class="auth-copy compact-copy">
          <span class="soft-pill">${icon("shield")} Returning reviewer</span>
          <h1>Resume the run.<br /><em>Keep your edge.</em></h1>
          <p>Continue saved exams, targeted practice, mistakes, flags, and personal performance records.</p>
          <div class="auth-chips">
            <span>${icon("clock")} <b>Resume unfinished exams</b><small>Return to the exact saved checkpoint</small></span>
            <span>${icon("stats")} <b>View previous scores</b><small>Compare section and pacing records</small></span>
            <span>${icon("bookmark")} <b>Continue focused review</b><small>Practice mistakes and flagged items</small></span>
          </div>
        </div>
        <form class="auth-card profile-picker-card" data-form="signin" autocomplete="off">
          <div class="auth-card-head">
            <h2>Sign In</h2>
            <p>Continue your saved exams and review history.</p>
          </div>
          <label class="field-label">Email Address<div class="field-with-icon">${icon("mail")}<input name="email" type="email" autocomplete="off" placeholder="Enter your email address" required /></div></label>
          <label class="field-label">Password<div class="field-with-icon has-toggle">${icon("lock")}<input name="password" type="password" autocomplete="off" placeholder="Enter your password" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
          <button class="btn primary" data-action="signin-submit" type="button" ${app.busyAction === "signin" ? "disabled" : ""}>${app.busyAction === "signin" ? "Signing in..." : "Sign In"}</button>
          <button class="text-link" data-action="forgot-password" type="button">Forgot Password?</button>
          <div class="auth-divider"><span>or</span></div>
          <p class="auth-switch-copy">New here?</p>
          <button class="text-link" data-action="show-create" type="button">Create account</button>
        </form>
      </section>
    `);
  }

  function renderFixtureCreateProfile() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas create-state fixture-auth">
        <div class="auth-copy">
          <span class="soft-pill">${icon("building")} Civil Service Exam Practice</span>
          <h1>Review smarter. Track your progress clearly.</h1>
          <p>Save mock exam scores, review history, and progress across every section while preparing for the Professional level.</p>
          <div class="auth-chips">
            <span>${icon("clock")} Timed mock exams</span>
            <span>${icon("stats")} Score tracking</span>
            <span>${icon("review")} Reviewer history</span>
          </div>
        </div>
        <form class="auth-card fixture-create-card" data-form="signup">
          <div class="auth-card-head">
            <h2>Create Account</h2>
            <p>Set up your reviewer account.</p>
          </div>
          <label class="field-label">Full Name<div class="field-with-icon">${icon("user")}<input name="name" autocomplete="name" placeholder="Enter your full name" /></div></label>
          <label class="field-label">Email Address<div class="field-with-icon">${icon("mail")}<input name="email" type="email" autocomplete="email" placeholder="Enter your email address" /></div></label>
          <button class="btn primary" data-action="signup-submit" type="button">${icon("spark")} Create Account</button>
          <div class="auth-divider"><span>or</span></div>
          <p class="auth-switch-copy">Already have an account?</p>
          <button class="text-link" data-action="show-signin" type="button">Sign in</button>
        </form>
      </section>
    `);
  }

  function renderFixtureSelectProfile() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas select-mode fixture-auth">
        <div class="auth-copy compact-copy">
          <span class="soft-pill">${icon("building")} Civil Service Exam Practice</span>
          <h1>Returning reviewer</h1>
          <p>Sign in to continue your saved exam progress, review history, flagged questions, and results.</p>
          <div class="auth-chips">
            <span>${icon("clock")} Resume unfinished exams</span>
            <span>${icon("stats")} View previous scores</span>
            <span>${icon("bookmark")} Continue category practice</span>
          </div>
        </div>
        <form class="auth-card profile-picker-card" data-form="signin" autocomplete="off">
          <div class="auth-card-head">
            <h2>Sign In</h2>
            <p>Continue your saved exams and review history.</p>
          </div>
          <label class="field-label">Email Address<div class="field-with-icon">${icon("mail")}<input name="email" type="email" autocomplete="off" placeholder="Enter your email address" /></div></label>
          <label class="field-label">Password<div class="field-with-icon has-toggle">${icon("lock")}<input name="password" type="password" autocomplete="off" placeholder="Enter your password" /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
          <button class="btn primary" data-action="signin-submit" type="button">Sign In</button>
          <button class="text-link" data-action="forgot-password" type="button">Forgot Password?</button>
          <div class="auth-divider"><span>or</span></div>
          <p class="auth-switch-copy">New here?</p>
          <button class="text-link" data-action="show-create" type="button">Create account</button>
        </form>
      </section>
    `);
  }

  function renderDashboard() {
    const attempts = app.attempts;
    const completed = completedAttempts();
    const activeAttempt = attempts.find((attempt) => attempt.status === "in_progress" || attempt.status === "paused");
    const totalFlagged = attempts.reduce((sum, attempt) => sum + flaggedCount(attempt), 0);
    const totalMistakes = wrongAnswerCount(completed);
    const fullMocks = completed.filter((attempt) => attempt.mode === "full");
    const bestFull = fullMocks.reduce((best, attempt) => Math.max(best, resultPercent(attempt)), 0);
    const fastestPass = fullMocks
      .filter((attempt) => resultPercent(attempt) >= PASSING_PERCENT)
      .sort((a, b) => a.elapsed_seconds - b.elapsed_seconds)[0];
    const categoryStats = categoryPerformance(completed);
    const hubSections = [
      { section: "Verbal Ability", label: "Verbal", tone: "verbal", icon: "message-square" },
      { section: "Numerical Ability", label: "Numerical", tone: "numerical", icon: "calculator" },
      { section: "Analytical Ability", label: "Analytical", tone: "analytical", icon: "brain-circuit" },
      { section: "General Information", label: "General", tone: "general", icon: "book-open-text" }
    ];
    const activeAnswers = activeAttempt ? Object.values(activeAttempt.answers) : [];
    const activeAnswered = activeAttempt ? answeredCount(activeAttempt) : 0;
    const activeTotal = activeAttempt?.total_questions || 170;
    const completion = activeTotal ? Math.round((activeAnswered / activeTotal) * 100) : 0;
    const sectionRows = hubSections.map((entry) => {
      const related = activeAnswers.filter((answer) => answer.section === entry.section);
      const answered = related.filter((answer) => answer.selected_choice).length;
      return { ...entry, answered, total: related.length, progress: related.length ? Math.round((answered / related.length) * 100) : 0 };
    });
    const strongest = hubSections
      .map((entry) => ({ ...entry, percent: categoryStats[entry.section]?.percent ?? -1 }))
      .sort((a, b) => b.percent - a.percent)[0];
    const numericalRecord = categoryStats["Numerical Ability"]?.percent;
    const totalQuestionsCompleted = attempts.reduce((sum, attempt) => sum + answeredCount(attempt), 0);
    const firstName = String(app.profile?.name || "Reviewer").trim().split(/\s+/)[0] || "Reviewer";
    const activeVersion = activeAttempt ? examVersions.find((version) => version.id === activeAttempt.exam_version_id) : null;
    const activeVersionNumber = app.fixtureMode ? 7 : activeVersion?.number;
    const runTitle = activeAttempt?.mode === "practice"
      ? "Focused Practice"
      : activeAttempt && activeVersionNumber
        ? `Professional Mock ${String(activeVersionNumber).padStart(2, "0")}`
        : activeAttempt ? examTitle(activeAttempt) : "Professional Mock";
    const runAction = activeAttempt ? "resume-exam" : "open-setup";
    const runActionLabel = activeAttempt ? "Resume Run" : "Start Full Mock";
    const runTime = activeAttempt
      ? activeAttempt.total_time_seconds ? formatDuration(timeRemaining(activeAttempt)) : "Untimed"
      : formatDuration(TOTAL_TIME_SECONDS);
    const runCheckpoint = activeAttempt ? `Item ${activeAttempt.current_question_index + 1}` : "Ready to begin";
    root.innerHTML = authedShell(`
      <section class="study-hub">
        <div class="hub-grid-pattern" aria-hidden="true"></div>
        <div class="hub-stage">
          <header class="hub-hero">
            <h1><span>Lock in.</span> <em>Keep moving.</em></h1>
            <p>Welcome back, ${escapeHtml(firstName)}.</p>
          </header>

          <div class="hub-primary-grid">
            <section class="hub-panel hub-run-panel">
              <div class="hub-panel-title">
                ${localIcon("target")}
                <h2>${escapeHtml(runTitle)}</h2>
                <span class="hub-scan-lines" aria-hidden="true"></span>
              </div>
              <div class="hub-run-body">
                <div class="hub-ring" style="--hub-completion:${completion * 3.6}deg" aria-label="${activeAnswered} of ${activeTotal} questions answered. Ring colors identify Verbal, Numerical, Analytical, General, and skipped items." tabindex="0">
                  <span class="hub-ring-progress" aria-hidden="true"></span>
                  <i class="hub-ring-node node-one" aria-hidden="true"></i>
                  <i class="hub-ring-node node-two" aria-hidden="true"></i>
                  <i class="hub-ring-node node-three" aria-hidden="true"></i>
                  <i class="hub-ring-node node-four" aria-hidden="true"></i>
                  <div class="hub-ring-core">
                    <strong>${activeAnswered}</strong>
                    <span>/ ${activeTotal}</span>
                    <small>questions<br />completed</small>
                  </div>
                </div>
                <div class="hub-run-details">
                  <div class="hub-time-row">
                    ${localIcon("timer")}
                    <span>${activeAttempt?.total_time_seconds === null ? "Practice mode" : "Time remaining"}</span>
                    <strong>${escapeHtml(runTime)}</strong>
                    <div class="hub-run-telemetry" aria-label="Run status">
                      <span><b>${completion}%</b> complete</span>
                      <span><b>${activeTotal - activeAnswered}</b> remaining</span>
                      <span><b>${activeAttempt ? "Live" : "Ready"}</b> status</span>
                    </div>
                  </div>
                  <div class="hub-checkpoints">
                    ${sectionRows.map((entry) => `
                      <div class="hub-checkpoint ${entry.tone}">
                        <span class="hub-checkpoint-icon">${localIcon(entry.icon)}</span>
                        ${entry.answered ? `<i class="hub-checkpoint-check">${localIcon("circle-check")}</i>` : ""}
                        <strong>${escapeHtml(entry.label)}</strong>
                        <small>${entry.total ? `${entry.answered}/${entry.total}` : "--"}</small>
                      </div>
                    `).join("")}
                  </div>
                  <div class="hub-run-status">
                    <span>Current checkpoint <strong>${escapeHtml(runCheckpoint)}</strong></span>
                    <span>${localIcon("cloud-check")} ${activeAttempt ? "Saved online" : "20 versions available"}</span>
                  </div>
                  <button class="hub-resume-button" data-action="${runAction}" type="button">
                    <i aria-hidden="true"></i>
                    <span>${escapeHtml(runActionLabel)}</span>
                    <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
                  </button>
                </div>
                <div class="hub-ring-legend" role="note" aria-label="Progress ring legend">
                  ${sectionRows.map((entry) => `<span class="${entry.tone}"><i></i>${escapeHtml(entry.label)}</span>`).join("")}
                  <span class="ring-progress-key"><i></i>Overall progress</span>
                </div>
              </div>
            </section>

            <section class="hub-panel hub-records-panel">
              <div class="hub-panel-title">
                ${localIcon("target")}
                <h2>Your Records</h2>
                <span class="hub-scan-lines" aria-hidden="true"></span>
              </div>
              <div class="hub-record-list">
                <span class="hub-record-rail" aria-hidden="true"></span>
                <div class="hub-record teal">
                  <span>${localIcon("trophy")}</span>
                  <p><strong>Best full mock</strong><small>${fullMocks.length ? "Personal best" : "Complete a mock to set it"}</small></p>
                  <b>${fullMocks.length ? `${Math.round(bestFull)}%` : "--"}</b>
                </div>
                <div class="hub-record blue">
                  <span>${localIcon("calculator")}</span>
                  <p><strong>Numerical</strong><small>Across completed attempts</small></p>
                  <b>${numericalRecord == null ? "--" : `${Math.round(numericalRecord)}%`}</b>
                </div>
                <div class="hub-record green">
                  <span>${localIcon("timer")}</span>
                  <p><strong>Fastest pass</strong><small>Full mock at 80%+</small></p>
                  <b>${fastestPass ? formatDuration(fastestPass.elapsed_seconds) : "--"}</b>
                </div>
              </div>
              <button class="hub-record-foot" data-action="recent-page" type="button">${localIcon("history")} Open complete progress ${localIcon("chevron-right")}</button>
            </section>
          </div>

          <section class="hub-action-dock" aria-label="Choose your next mode">
            <button class="hub-mode full" data-action="open-setup" type="button">
              ${localIcon("target")}
              <span><strong>Full Mock</strong><small>170 items under exam conditions</small></span>
              <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
            </button>
            <button class="hub-mode practice" data-action="practice-page" type="button">
              ${localIcon("brain-circuit")}
              <span><strong>Focused Practice</strong><small>Drill by section and difficulty</small></span>
              <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
            </button>
            <button class="hub-mode mistakes" data-action="mistakes-page" type="button">
              ${localIcon("notebook-tabs")}
              <span><strong>Review Mistakes</strong><small>${totalMistakes} missed items / ${totalFlagged} flagged</small></span>
              <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
            </button>
          </section>

          <section class="hub-performance-ribbon">
            <div class="hub-ribbon-label"><span>Section performance ${localIcon("chevron-right")}</span><small>${totalQuestionsCompleted} questions completed</small></div>
            ${hubSections.map((entry) => {
              const percent = categoryStats[entry.section]?.percent;
              return `
                <button class="hub-section-score ${entry.tone}" data-action="practice-page" type="button">
                  ${localIcon(entry.icon)}
                  <span>${escapeHtml(entry.label)}</span>
                  <strong>${percent == null ? "--" : `${Math.round(percent)}%`}</strong>
                </button>
              `;
            }).join("")}
            <span class="sr-only">Strongest recorded section: ${strongest?.percent >= 0 ? escapeHtml(strongest.label) : "No score yet"}</span>
          </section>
        </div>
      </section>
    `, "dashboard");
  }

  function renderSetup() {
    const draftOptions = { ...DEFAULT_OPTIONS, ...(app.draft?.options || {}) };
    const savedVersionId = draftOptions.versionId || examVersions[0]?.id;
    const setupGroups = app.fixtureMode ? SCREEN_SECTION_GROUPS : SECTION_GROUPS;
    root.innerHTML = authedShell(`
      <section class="setup-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Full mock / run protocol</p>
            <h1>Mission Briefing</h1>
            <p>Configure one complete Professional-level simulation.</p>
          </div>
        </div>

        <div class="setup-grid v3-setup-grid">
          <section class="card setup-main mission-briefing v3-panel">
            <div class="exam-badge-row">
              <span class="soft-pill"><i></i> Timed simulation</span>
              <strong>Professional Mock / 170-item protocol</strong>
            </div>
            <div class="setup-facts instrument-grid">
              ${setupFact("target", "cyan", "Total Questions", "170")}
              ${setupFact("timer", "blue", "Time Limit", "3h 10m")}
              ${setupFact("notebook-tabs", "green", "Exam Type", "Professional")}
              ${setupFact("brain-circuit", "purple", "Navigation", "Free movement")}
              ${setupFact("target", "amber", "Review Tools", "Flag, skip, revisit")}
              ${setupFact("timer", "blue", "Pause", "Save and exit")}
            </div>
            <div class="section-list allocation-console">
              <div class="technical-title"><h2>Section Allocation</h2><span aria-hidden="true"></span></div>
              ${setupGroups.map((group) => `
                <div class="section-row allocation-card ${group.tone}">
                  <span class="section-hud-icon">${localIcon(sectionIconName(group.section))}</span>
                  <div class="allocation-copy">
                    <strong>${escapeHtml(group.section)}</strong>
                    <span>Items ${group.range}</span>
                  </div>
                  <b>${group.end - group.start + 1}<small> items</small></b>
                  <div class="allocation-meter" aria-label="${Math.round(((group.end - group.start + 1) / 170) * 100)} percent of the exam"><i style="--allocation:${((group.end - group.start + 1) / 170) * 100}%"></i></div>
                  <em>${Math.round(((group.end - group.start + 1) / 170) * 1000) / 10}%</em>
                </div>
              `).join("")}
            </div>
            <div class="note-box">
              <strong>Important Notes</strong>
              <p>This is an independent practice reviewer, not an official CSC exam. Your exam progress is stored online under your signed-in account.</p>
            </div>
          </section>

          <form class="card setup-options run-configuration v3-panel" data-form="setup">
            <div class="technical-title"><h2>Run Configuration</h2><span aria-hidden="true"></span></div>
            <label>Mock Version
              <select name="versionId">
                ${examVersions.map((version) => `<option value="${escapeAttr(version.id)}" ${version.id === savedVersionId ? "selected" : ""}>Version ${version.number} - ${escapeHtml(version.title)}</option>`).join("")}
              </select>
            </label>
            ${toggleControl("showTimer", "Show Timer", draftOptions.showTimer)}
            ${toggleControl("enablePause", "Enable Pause", draftOptions.enablePause)}
            ${toggleControl("shuffleQuestions", "Shuffle Questions", draftOptions.shuffleQuestions)}
            ${toggleControl("shuffleAnswers", "Shuffle Answer Choices", draftOptions.shuffleAnswers)}
            <div class="readiness-card">
              <div class="technical-title"><strong>Preflight Check</strong><span aria-hidden="true"></span></div>
              <span>${localIcon("cloud-check")} Stable internet connection ${localIcon("circle-check")}</span>
              <span>${localIcon("brain-circuit")} Quiet review space ${localIcon("circle-check")}</span>
              <span>${localIcon("timer")} At least 3 hours available ${localIcon("circle-check")}</span>
            </div>
            <button class="btn primary technical-cta" data-action="setup-submit" type="button"><span>${icon("play")} Start Full Mock</span>${icon("arrow")}</button>
            <button class="btn secondary technical-cta secondary-cta" data-action="save-setup" type="button"><span>${icon("save")} Save Configuration</span></button>
          </form>
        </div>
      </section>
    `, "setup");
  }

  function renderExam() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    const current = currentAnswer(attempt);
    if (!current) return setView({ name: "dashboard" });
    const remaining = timeRemaining(attempt);
    const linked = linkedStimulusAnswers(attempt, current);
    const isPaused = attempt.status === "paused";

    const version = examVersions.find((candidate) => candidate.id === attempt.exam_version_id);
    const runLabel = attempt.mode === "practice" ? escapeHtml(attempt.title || "Focused Practice") : `Professional Mock ${version ? String(version.number).padStart(2, "0") : ""}`.trim();
    root.innerHTML = cockpitFrame(`
      <section class="exam-shell ${app.fixtureMode ? "fixture-exam" : ""} state-${escapeAttr(app.fixtureState || "live")} ${isPaused ? "is-paused" : ""} ${isPaused || app.modal === "submit" ? "exam-dimmed" : ""}">
        <header class="exam-topbar">
          <div class="exam-brand">${logo()}<div><strong>CSC Practice Reviewer</strong><span>Independent mock exam and review tool</span></div></div>
          <div class="exam-status">
            <strong>${runLabel}</strong>
            <div>
              <span class="exam-time">${attempt.mode === "practice" ? "Untimed Practice" : attempt.options?.showTimer === false ? "Timer hidden" : `${isPaused ? "Paused" : "Time Left:"} ${formatDuration(remaining)}`}</span>
              <span class="exam-answered">Answered: ${answeredCount(attempt)}/${attempt.total_questions}</span>
              ${attempt.mode === "practice" ? `<span class="exam-difficulty">${escapeHtml(statusLabel(attempt.options?.difficulty || "mixed"))} / ${attempt.total_questions} items</span>` : ""}
            </div>
          </div>
          <div class="exam-actions">
            <button class="btn secondary mobile-question-toggle" data-action="toggle-exam-nav" type="button">${icon("review")} Questions</button>
            <button class="btn secondary" data-action="pause-exam" type="button" ${attempt.options?.enablePause === false || isPaused ? "disabled" : ""}>${icon("pause")} Pause</button>
            <button class="btn danger" data-action="open-submit" type="button">${icon("submit")} ${attempt.mode === "practice" ? "Finish Practice" : "Submit Exam"}</button>
          </div>
        </header>

        <div class="exam-body ${current.stimulus ? "with-stimulus" : ""}">
          <aside class="exam-nav ${app.examNavOpen ? "mobile-open" : ""}">
            <div class="nav-title">
              <h2>Questions</h2>
              <button class="icon-only mobile-nav-close" data-action="toggle-exam-nav" type="button" aria-label="Close question navigator">${icon("x")}</button>
              <div class="legend">
                <span><i class="legend-dot answered"></i>Answered</span>
                <span><i class="legend-dot unanswered"></i>Unanswered</span>
                <span><i class="legend-dot skipped"></i>Skipped</span>
                <span><i class="legend-dot flagged"></i>Flagged</span>
              </div>
            </div>
            ${groupNavigator(attempt)}
          </aside>

          <main class="exam-question">
            ${current.stimulus ? renderStimulusPanel(attempt, current, linked) : ""}
            <section class="question-panel">
              <div class="question-title">
                <div>
                  <span class="question-index">Item ${current.position + 1} <small>/ ${attempt.total_questions}</small></span>
                  <p class="topic-pill">${escapeHtml(current.section)} - ${escapeHtml(current.subtopic)}</p>
                </div>
                <span class="status-pill ${answerStatus(current)}">${statusText(current)}</span>
              </div>
              <p class="prompt">${escapeHtml(current.prompt)}</p>
              <div class="choices">
                ${current.choices.map((choice) => `
                  <button class="choice ${current.selected_choice === choice.id ? "selected" : ""}" data-choice="${choice.id}" type="button" ${attempt.status !== "in_progress" ? "disabled" : ""}>
                    <span class="choice-letter">${choice.id}</span>
                    <strong>${escapeHtml(choice.text)}</strong>
                    <i class="choice-radio"></i>
                  </button>
                `).join("")}
              </div>
              <div class="question-actions">
                <button class="btn secondary" data-action="previous-question" type="button" ${current.position === 0 ? "disabled" : ""}>${icon("back")} Previous</button>
                <button class="btn ghost" data-action="clear-answer" type="button">${icon("clear")} Clear Answer</button>
                <button class="btn ghost ${current.flagged ? "active" : ""}" data-action="toggle-flag" type="button">${icon("flag")} Flag for Review</button>
                <button class="btn secondary" data-action="skip-question" type="button">${icon("skip")} Skip</button>
                <button class="btn primary" data-action="next-question" type="button" ${current.position >= attempt.total_questions - 1 || !current.selected_choice ? "disabled" : ""}>Next ${icon("arrow")}</button>
              </div>
            </section>
          </main>
        </div>
      </section>
      ${pauseModal(attempt)}
      ${submitModal(attempt)}
      ${chartModal(attempt, current)}
      ${timeoutModal(attempt)}
      ${toast()}
    `, "exam-frame");

    if (!app.fixtureMode && attempt.status === "in_progress" && app.modal !== "timeout") {
      app.timerId = setInterval(() => tickAttempt(attempt.id), 1000);
    }
  }

  function renderResults() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    const score = scoreAttempt(attempt);
    const pct = resultPercent(attempt);
    const insights = performanceInsights(attempt);
    const stats = sectionStats(attempt);
    const isPractice = attempt.mode === "practice";

    const passed = pct >= PASSING_PERCENT;
    root.innerHTML = authedShell(`
      <section class="results-page v3-results-page ${passed ? "passed" : "needs-work"} ${isPractice ? "practice-result" : ""}">
        <div class="results-command-title">
          <span>Results</span>
          <strong>${isPractice ? "Focused Practice Debrief" : "Professional Mock Debrief"}</strong>
          <small>${escapeHtml(examTitle(attempt))} / ${formatDate(attempt.submitted_at || attempt.started_at)}</small>
        </div>

        <section class="results-overview-console">
          <div class="score-gauge-panel v3-panel">
            <div class="score-gauge" style="--score:${Math.max(0, Math.min(100, pct)) * 3.6}deg">
              <span>Score</span><strong>${Math.round(pct)}%</strong><b>${score} / ${attempt.total_questions}</b><small>correct</small>
            </div>
          </div>
          <div class="timing-console">
            <metric>${localIcon("timer")}<span>Total Time</span><strong>${formatDuration(attempt.elapsed_seconds)}</strong><small>HH:MM:SS</small></metric>
            <metric>${localIcon("target")}<span>Average / Item</span><strong>${formatDuration(insights.averageTime)}</strong><small>per question</small></metric>
          </div>
          <div class="result-status-panel ${passed ? "passed" : "failed"}">
            ${icon(passed ? "check" : "stats")}
            <strong>${isPractice ? "Complete" : passed ? "Passed" : "Needs Work"}</strong>
            <small>${isPractice ? `${score} correct answers recorded` : passed ? "Passing target reached" : `${Math.max(0, Math.ceil((PASSING_PERCENT / 100) * attempt.total_questions) - score)} more correct answers needed`}</small>
          </div>
        </section>

        <section class="results-section-console v3-panel">
          <div class="technical-title"><h2>Section Performance</h2><span aria-hidden="true"></span></div>
          <div class="results-section-grid">
            ${stats.map((stat) => {
              const percent = Math.round((stat.correct / Math.max(1, stat.total)) * 100);
              return `<article class="result-section-card ${toneForSection(stat.section)}"><span class="section-hud-icon">${localIcon(sectionIconName(stat.section))}</span><div><strong>${escapeHtml(stat.section)}</strong><b>${percent}%</b><i><em style="width:${percent}%"></em></i><small>${stat.correct} / ${stat.total} correct</small></div></article>`;
            }).join("")}
          </div>
        </section>

        <div class="results-lower-grid">
          <section class="run-insights-panel v3-panel">
            <div class="technical-title"><h2>Run Insights</h2><span aria-hidden="true"></span></div>
            <div class="insight-grid">
              ${resultInsight("timer", "Fastest Question", insights.fastest ? formatDuration(insights.fastest.time_spent_seconds) : "--", insights.fastest ? `Item ${insights.fastest.display_number}` : "No timing yet", "cyan")}
              ${resultInsight("timer", "Longest Question", insights.slowest ? formatDuration(insights.slowest.time_spent_seconds) : "--", insights.slowest ? `Item ${insights.slowest.display_number}` : "No timing yet", "amber")}
              ${resultInsight("trophy", "Strongest Area", insights.strongest?.section || "--", insights.strongest ? `${Math.round(insights.strongest.percent)}% accuracy` : "No data yet", "green")}
              ${resultInsight("target", "Weakest Area", insights.weakest?.section || "--", insights.weakest ? `${Math.round(insights.weakest.percent)}% accuracy` : "No data yet", "red")}
              ${resultInsight("brain-circuit", "Changed Answers", String(insights.changed), `${insights.wrongToCorrect} improved / ${insights.correctToWrong} lost`, "purple")}
              ${resultInsight("notebook-tabs", "Flagged Questions", String(flaggedCount(attempt)), `${Math.round((flaggedCount(attempt) / Math.max(1, attempt.total_questions)) * 100)}% of run`, "amber")}
              ${resultInsight("target", "Skipped Questions", String(skippedCount(attempt)), `${unansweredCount(attempt)} unanswered`, "blue")}
              ${resultInsight("circle-check", "Overall Accuracy", `${Math.round(pct)}%`, `${score} / ${attempt.total_questions} correct`, "green")}
            </div>
          </section>
          <aside class="results-action-rail v3-panel">
            <div class="technical-title"><h2>Actions</h2><span aria-hidden="true"></span></div>
            <button class="result-action primary" data-action="review-answers" type="button">${localIcon("notebook-tabs")}<span><strong>Review Answers</strong><small>Inspect every item and explanation</small></span>${icon("arrow")}</button>
            ${isPractice
              ? `<button class="result-action purple" data-action="repeat-practice" type="button">${localIcon("target")}<span><strong>Repeat Drill</strong><small>Run the same practice profile</small></span>${icon("arrow")}</button><button class="result-action green" data-action="change-practice" type="button">${localIcon("brain-circuit")}<span><strong>Change Practice</strong><small>Choose another section or difficulty</small></span>${icon("arrow")}</button>`
              : `<button class="result-action purple" data-action="practice-weakest" type="button">${localIcon("target")}<span><strong>Practice Weakest Area</strong><small>${escapeHtml(insights.weakest?.section || "Targeted review")}</small></span>${icon("arrow")}</button><button class="result-action green" data-action="retake-same-version" type="button">${localIcon("history")}<span><strong>Retake Same Version</strong><small>Restart this 170-item mock</small></span>${icon("arrow")}</button>`}
          </aside>
        </div>
      </section>
    `, "results");
  }

  function renderReview() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    const filtered = filteredReviewAnswers(attempt, app.reviewFilter);
    const index = Math.min(app.view.index || 0, Math.max(0, filtered.length - 1));
    const answer = filtered[index] || Object.values(attempt.answers).sort(byPosition)[0];
    const correct = answer?.selected_choice === answer?.correct_choice;
    const score = scoreAttempt(attempt);
    const pct = resultPercent(attempt);
    const navWindow = reviewNavigatorWindow(filtered, index);
    root.innerHTML = authedShell(`
      <section class="review-page v3-review-page">
        <header class="review-command-head">
          <div><p class="eyebrow">Attempt inspection</p><h1>Answer Review</h1><small>${escapeHtml(examTitle(attempt))}</small></div>
          <div class="review-score-strip telemetry-rail">
            ${telemetryMetric("target", "Score", `${Math.round(pct)}%`)}
            ${telemetryMetric("circle-check", "Correct", score)}
            ${telemetryMetric("notebook-tabs", "Needs Review", attempt.total_questions - score)}
            ${telemetryMetric("target", "Flagged", flaggedCount(attempt))}
          </div>
          <button class="btn secondary" data-action="back-results" type="button">${icon("back")} Back to Results</button>
        </header>

        <div class="review-workstation">
          <aside class="review-filter-panel v3-panel">
            <div class="technical-title"><h2>Filters</h2><span aria-hidden="true"></span></div>
            <p>Answer State</p>
            <div class="filter-list">
              ${["all", "wrong", "correct", "flagged"].map((filter) => `<button class="${app.reviewFilter === filter ? "active" : ""}" data-review-filter="${filter}" type="button">${filterLabel(filter)}<small>${filteredReviewAnswers(attempt, filter).length}</small></button>`).join("")}
            </div>
            <div class="review-filter-note">${localIcon("target")}<span><strong>Current scope</strong><small>${escapeHtml(filterLabel(app.reviewFilter))} questions</small></span></div>
          </aside>

          <aside class="review-item-panel v3-panel">
            <div class="review-item-head"><strong>Question</strong><span>${filtered.length}</span></div>
            <small class="navigator-range">${navWindow.label}</small>
            <div class="review-dots">
              ${navWindow.items.map(({ item, itemIndex }) => `<button class="${itemIndex === index ? "current" : ""} ${item.selected_choice === item.correct_choice ? "correct" : item.selected_choice ? "wrong" : "unanswered"} ${item.flagged ? "flagged" : ""}" data-review-index="${itemIndex}" type="button"><span>${item.display_number}</span>${item.flagged ? icon("flag") : item.selected_choice === item.correct_choice ? localIcon("circle-check") : icon("x")}</button>`).join("")}
            </div>
          </aside>

          <main class="review-question-panel v3-panel">
            ${answer && filtered.length ? `
              <div class="review-question-head"><span class="question-index"><span>Question</span><b>${answer.position + 1}</b><span>of ${attempt.total_questions}</span></span><span class="status-pill ${correct ? "answered" : "wrong"}">${correct ? "Correct" : "Incorrect"}</span></div>
              <div class="review-question-scroll">
                <p class="topic-pill">${escapeHtml(answer.section)} / ${escapeHtml(answer.subtopic)}</p>
                ${answer.stimulus ? renderStimulusPanel(attempt, answer, linkedStimulusAnswers(attempt, answer), true) : ""}
                <p class="prompt">${escapeHtml(answer.prompt)}</p>
                <div class="review-choices">
                  ${answer.choices.map((choice) => `<div class="review-choice ${choice.id === answer.correct_choice ? "is-correct" : ""} ${choice.id === answer.selected_choice && choice.id !== answer.correct_choice ? "is-wrong" : ""}"><span>${choice.id}</span><strong>${escapeHtml(choice.text)}</strong><em>${choice.id === answer.correct_choice ? "Correct answer" : choice.id === answer.selected_choice ? "Your answer" : ""}</em></div>`).join("")}
              </div>
            ` : `<div class="review-empty-panel"><span>${icon("review")}</span><strong>No matching review items</strong><p>Change the active filter to continue reviewing this attempt.</p></div>`}
          </main>

          <aside class="review-explanation-panel v3-panel">
            <div class="technical-title"><h2>Explanation</h2><span aria-hidden="true"></span></div>
            ${answer && filtered.length ? `<div class="explanation-copy"><p>${escapeHtml(answer.explanation || "No explanation provided.")}</p></div><div class="review-metadata"><span>${localIcon("timer")}<b>Time Spent</b><strong>${formatDuration(answer.time_spent_seconds)}</strong></span><span>${localIcon("target")}<b>Visits</b><strong>${answer.visit_count || 0}</strong></span><span>${localIcon("history")}<b>Answer Changes</b><strong>${answer.answer_changes || 0}</strong></span><span>${icon("flag")}<b>Flagged</b><strong>${answer.flagged ? "Yes" : "No"}</strong></span></div>` : `<p class="explanation-empty">Select another filter to restore the explanation panel.</p>`}
          </aside>
        </div>

        <footer class="review-footer">
          <button class="btn secondary" data-action="review-prev" type="button" ${index <= 0 ? "disabled" : ""}>${icon("back")} Previous</button>
          <button class="btn secondary" data-action="back-results" type="button">${icon("review")} Return to Results</button>
          <button class="btn primary" data-action="review-next" type="button" ${index >= filtered.length - 1 ? "disabled" : ""}>Next ${icon("arrow")}</button>
        </footer>
      </section>
    `, "review");
  }

  function renderPractice() {
    const tab = app.practiceReviewTab || "practice";
    root.innerHTML = sideShell("practice", `
      <section class="content-page practice-review-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Targeted training console</p>
            <h1>Practice & Review</h1>
            <p>Build focused drills, revisit missed items, and inspect flagged questions.</p>
          </div>
        </div>
        ${practiceReviewTabs(tab)}
        ${tab === "mistakes" ? mistakesTabContent() : tab === "flagged" ? flaggedTabContent() : practiceTabContent()}
      </section>
    `);
  }

  function renderRecentAttempts() {
    const attempts = app.attempts;
    const completed = completedAttempts();
    const average = averagePercent(completed);
    const highest = completed.reduce((best, attempt) => Math.max(best, resultPercent(attempt)), 0);
    const fullMocks = attempts.filter((attempt) => attempt.mode === "full");
    const practiceRuns = attempts.filter((attempt) => attempt.mode === "practice");
    const categoryStats = categoryPerformance(completed);
    const weakest = practiceCategoriesForDisplay()
      .map((category) => ({ category, percent: categoryPercent(categoryStats[category.section], category.section) }))
      .sort((left, right) => left.percent - right.percent)[0];
    root.innerHTML = sideShell("recent", `
      <section class="content-page progress-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Private performance telemetry</p>
            <h1>Progress</h1>
            <p>Track scores, section performance, and attempt history.</p>
          </div>
        </div>
        <div class="summary-cards statistics-rail telemetry-rail">
          ${telemetryMetric("target", "Total Attempts", attempts.length)}
          ${telemetryMetric("notebook-tabs", "Full Mocks", fullMocks.length)}
          ${telemetryMetric("brain-circuit", "Practice Runs", practiceRuns.length)}
          ${telemetryMetric("calculator", "Average Score", average == null ? "--" : `${Math.round(average)}%`)}
          ${telemetryMetric("trophy", "Best Score", completed.length ? `${Math.round(highest)}%` : "--")}
        </div>
        <div class="progress-analytics-grid">
        <section class="card trend-panel v3-panel">
          <div class="technical-title"><div><h2>Attempt Performance</h2><p>Score across completed runs</p></div><span>${completed.length ? `${completed.length} completed` : "Awaiting first run"}</span></div>
          ${progressTrendSvg(completed)}
        </section>
        <section class="card performance-card v3-panel">
          <div class="technical-title"><h2>Section Performance</h2><span aria-hidden="true"></span></div>
          <div class="performance-bars">
            ${practiceCategoriesForDisplay().map((category) => progressBarRow(category, categoryPercent(categoryStats[category.section], category.section))).join("")}
          </div>
          <button class="review-focus-cta" data-action="practice-weakest" type="button">${localIcon("target")} Review Focus <strong>${weakest && completed.length ? escapeHtml(weakest.category.label) : "Awaiting results"}</strong>${icon("arrow")}</button>
        </section>
        </div>
        <section class="card attempts-table-card v3-panel">
          <div class="attempt-table-title"><h2>Attempt Records</h2><span>${attempts.length} stored runs</span></div>
          <div class="tabs progress-tabs">
            ${[
              ["all", "All Attempts"],
              ["full", "Full Mocks"],
              ["practice", "Practice"],
              ["review", "Review"]
            ].map(([key, label]) => `<button class="${app.recentTab === key ? "active" : ""}" data-recent-tab="${key}" type="button">${label}</button>`).join("")}
          </div>
          <div class="attempt-table">
            <div class="table-head"><span>Attempt</span><span>Type</span><span>Status</span><span>Score</span><span>Answered</span><span>Action</span></div>
            ${filteredAttemptsByTab(attempts, app.recentTab).map((attempt, index) => `
              <div class="table-row">
                <span class="attempt-name"><i>${String(index + 1).padStart(2, "0")}</i><span><strong>${escapeHtml(examTitle(attempt))}</strong><small>${formatDate(attempt.started_at)}</small></span></span>
                <span class="attempt-type">${attempt.mode === "practice" ? "Practice" : "Full Mock"}</span>
                <span class="attempt-status ${escapeAttr(attempt.status)}">${attempt.status === "submitted" || attempt.status === "timed_out" ? localIcon("circle-check") : localIcon("timer")} ${statusLabel(attempt.status)}</span>
                <span class="attempt-score">${attempt.status === "submitted" || attempt.status === "timed_out" ? `${Math.round(resultPercent(attempt))}%` : "--"}</span>
                <span class="attempt-answered">${answeredCount(attempt)} / ${attempt.total_questions}</span>
                <span class="row-actions">
                  <button class="btn tiny" data-attempt-open="${attempt.id}" type="button">${attempt.status === "in_progress" || attempt.status === "paused" ? "Continue" : "View Results"}</button>
                  <button class="icon-only" data-overflow="${attempt.id}" type="button" title="More actions">${icon("more")}</button>
                  ${app.modal === `overflow:${attempt.id}` ? overflowMenu(attempt) : ""}
                </span>
              </div>
            `).join("") || `<div class="progress-empty-state">${emptyInline("No attempts yet", "Start a full mock or focused practice run to create your first record.")}<button class="btn primary" data-action="open-setup" type="button">${icon("play")} Start Full Mock</button></div>`}
          </div>
        </section>
      </section>
    `);
  }

  function renderMistakePicker() {
    app.practiceReviewTab = "mistakes";
    renderPractice();
  }

  function renderBookmarks() {
    app.practiceReviewTab = "flagged";
    renderPractice();
  }

  function practiceReviewTabs(active) {
    return `
      <div class="tabs practice-review-tabs">
        ${[
          ["practice", "Practice"],
          ["mistakes", "Mistakes"],
          ["flagged", "Flagged"]
        ].map(([key, label]) => `<button class="${active === key ? "active" : ""}" data-practice-review-tab="${key}" type="button">${escapeHtml(label)}</button>`).join("")}
      </div>
    `;
  }

  function practiceTabContent() {
    const categoryStats = categoryPerformance(completedAttempts());
    const categories = practiceCategoriesForDisplay();
    const selected = categories[0];
    return `
      <form class="custom-practice practice-console" data-form="custom-practice">
        <section class="card practice-section-picker v3-panel">
          <div class="technical-title"><h2>Choose a Section</h2><span aria-hidden="true"></span></div>
          <fieldset class="category-plates"><legend class="sr-only">Section</legend>${categories.map((category, index) => `<label class="section-plate ${category.tone}"><input type="radio" name="category" value="${escapeAttr(category.section)}" ${index === 0 ? "checked" : ""}/><span class="section-hud-icon">${localIcon(sectionIconName(category.section))}</span><span class="section-copy"><strong>${escapeHtml(category.label)}</strong><small>${escapeHtml(category.description)}</small><em>${category.poolSize} questions</em></span></label>`).join("")}</fieldset>
        </section>
        <section class="card run-profile-panel v3-panel">
          <div class="technical-title"><h2>Run Profile</h2><span aria-hidden="true"></span></div>
          <div class="selected-run-section ${selected.tone}" data-practice-profile-section>${localIcon(sectionIconName(selected.section))}<strong>${escapeHtml(selected.label)} selected</strong></div>
          <fieldset class="count-segments"><legend>Question Count</legend>${[10, 20, 30, 40, 60].map((count) => `<label><input type="radio" name="count" value="${count}" ${count === 20 ? "checked" : ""}/><span>${count}</span></label>`).join("")}</fieldset>
          <fieldset class="difficulty-segments"><legend>Difficulty</legend>${[["mixed", "Mixed"], ["medium", "Standard"], ["hard", "Challenge"]].map(([value, label], index) => `<label><input type="radio" name="difficulty" value="${value}" ${index === 0 ? "checked" : ""}/><span>${label}</span></label>`).join("")}</fieldset>
          <div class="run-profile-facts">
            <span>${localIcon("notebook-tabs")}<strong data-practice-count>20</strong><small>Questions</small></span>
            <span>${localIcon("brain-circuit")}<strong data-practice-difficulty>Mixed</strong><small>Difficulty</small></span>
            <span>${localIcon("timer")}<strong>Untimed</strong><small>Practice</small></span>
          </div>
          <button class="btn primary technical-cta" data-action="custom-practice-submit" type="button"><span>${icon("play")} Start Custom Practice</span>${icon("arrow")}</button>
          <button class="btn secondary technical-cta secondary-cta" data-action="reset-practice" type="button"><span>${icon("refresh")} Reset Options</span></button>
        </section>
      </form>
      <section class="card category-picker quick-run-grid v3-panel">
        <div class="technical-title quick-title">
          <h2>Quick Practice</h2>
          <p>Launch a 20-item mixed drill from one section.</p>
        </div>
        <div class="category-card-grid">
          ${categories.map((category) => quickPracticeModule(category, categoryStats[category.section])).join("")}
        </div>
      </section>
    `;
  }

  function mistakesTabContent() {
    const completed = completedAttempts();
    const withMistakes = completed.map((attempt) => ({ attempt, mistakes: wrongAnswers(attempt) })).filter((item) => item.mistakes.length);
    const categories = practiceCategoriesForDisplay();
    const totalMissed = withMistakes.reduce((sum, item) => sum + item.mistakes.length, 0);
    const sectionCounts = categories.map((category) => ({
      category,
      count: withMistakes.reduce((sum, item) => sum + item.mistakes.filter((answer) => answer.section === category.section).length, 0)
    }));
    const affected = sectionCounts.filter((entry) => entry.count > 0);
    const priority = affected.slice().sort((left, right) => right.count - left.count)[0];
    return `
      <section class="mistakes-hub">
        ${withMistakes.length ? `
          <div class="mistake-summary telemetry-rail">
            ${telemetryMetric("target", "Total Missed", totalMissed)}
            ${telemetryMetric("notebook-tabs", "Attempts Ready", withMistakes.length)}
            ${telemetryMetric("brain-circuit", "Sections Affected", affected.length)}
            ${telemetryMetric(sectionIconName(priority?.category.section || "Numerical Ability"), "Highest Priority", priority ? priority.category.label : "--")}
          </div>
          <div class="mistakes-workspace">
            <section class="card mistake-list v3-panel">
              <div class="technical-title"><h2>Choose an Attempt</h2><span aria-hidden="true"></span></div>
              <div class="mistake-attempt-scroll">
                ${withMistakes.map(({ attempt, mistakes }, index) => {
                  const perSection = categories.map((category) => ({ category, count: mistakes.filter((answer) => answer.section === category.section).length })).filter((entry) => entry.count);
                  return `<article class="mistake-attempt-card">
                    <div class="attempt-index">${String(index + 1).padStart(2, "0")}</div>
                    <div class="mistake-attempt-title"><strong>${escapeHtml(examTitle(attempt))}</strong><small>${attempt.mode === "practice" ? "Type: Practice" : "Type: Full Mock"} / ${formatDate(attempt.submitted_at || attempt.started_at)}</small></div>
                    <metric><span>Score</span><strong>${Math.round(resultPercent(attempt))}%</strong></metric>
                    <metric class="missed"><span>Missed</span><strong>${mistakes.length}</strong></metric>
                    <metric><span>Answered</span><strong>${answeredCount(attempt)} / ${attempt.total_questions}</strong></metric>
                    <div class="mistake-section-strip">${perSection.map((entry) => `<span class="${entry.category.tone}">${localIcon(sectionIconName(entry.category.section))}<b>${entry.category.label}</b><strong>${entry.count}</strong></span>`).join("")}</div>
                    <button class="btn technical-row-cta" data-review-mistakes="${attempt.id}" type="button">Review Mistakes ${icon("arrow")}</button>
                  </article>`;
                }).join("")}
              </div>
            </section>
            <section class="card review-focus-panel v3-panel">
              <div class="technical-title"><h2>Review Focus</h2><span aria-hidden="true"></span></div>
              <div class="focus-total"><span>!</span><strong>${totalMissed}</strong><b>questions ready</b></div>
              <p>Review missed questions by section or open the largest attempt queue.</p>
              <div class="focus-section-list">
                ${sectionCounts.map(({ category, count }) => `<div class="focus-section ${category.tone}">${localIcon(sectionIconName(category.section))}<strong>${category.label}</strong><b>${count}</b><i><span style="width:${totalMissed ? Math.max(4, (count / totalMissed) * 100) : 0}%"></span></i>${priority?.category.section === category.section ? "<em>Top priority</em>" : ""}</div>`).join("")}
              </div>
              <button class="btn primary technical-cta" data-review-mistakes="${withMistakes[0].attempt.id}" type="button"><span>Review Largest Mistake Set</span>${icon("arrow")}</button>
              ${priority ? `<button class="btn secondary technical-cta secondary-cta" data-practice-category="${escapeAttr(priority.category.section)}" type="button"><span>Start ${escapeHtml(priority.category.label)} Practice</span></button>` : ""}
            </section>
          </div>
          <div class="mistake-note">${icon("info")} Correctly answered items stay out of this queue. New mistakes are added after each completed run.</div>
        ` : `<div class="mistake-summary telemetry-rail empty-mistake-summary">
              ${telemetryMetric("target", "Total Missed", "0")}
              ${telemetryMetric("notebook-tabs", "Attempts Ready", "0")}
              ${telemetryMetric("brain-circuit", "Sections Affected", "0")}
              ${telemetryMetric("calculator", "Highest Priority", "--")}
            </div>
            <section class="card mistakes-empty v3-panel">${emptyState("No mistakes yet", completed.length ? "Your submitted attempts do not have missed items." : "Complete a mock exam or practice drill first, then missed items will appear here.", "open-setup", "Start Full Mock", "practice-page", "Start Practice")}</section>
            <div class="mistake-note">${icon("info")} Missed questions appear here after a submitted mock exam or practice run.</div>`}
      </section>
    `;
  }

  function flaggedTabContent() {
    const flagged = app.attempts.flatMap((attempt) => Object.values(attempt.answers).filter((answer) => answer.flagged).map((answer) => ({ attempt, answer })));
    const grouped = practiceCategoriesForDisplay().map((category) => ({ category, rows: flagged.filter((item) => item.answer.section === category.section) })).filter((group) => group.rows.length);
    const totalTime = flagged.reduce((sum, item) => sum + (item.answer.time_spent_seconds || 0), 0);
    const dated = flagged.map((item) => item.answer.last_seen_at || item.attempt.started_at).filter(Boolean).sort();
    return `
      <section class="review-queue">
        ${flagged.length ? `<div class="flagged-workspace">
          <aside class="card flagged-summary v3-panel">
            <div class="technical-title"><h2>Summary</h2><span aria-hidden="true"></span></div>
            <div class="flagged-total">${icon("flag")}<span><b>Flagged Items</b><strong>${flagged.length}</strong></span></div>
            ${practiceCategoriesForDisplay().map((category) => {
              const count = flagged.filter((item) => item.answer.section === category.section).length;
              return `<div class="flagged-summary-row ${category.tone}">${localIcon(sectionIconName(category.section))}<span><b>${category.label}</b><strong>${count}</strong></span></div>`;
            }).join("")}
            <div class="flagged-date-row">${localIcon("history")}<span><b>Oldest Flagged</b><strong>${formatDate(dated[0])}</strong></span></div>
            <div class="flagged-date-row">${localIcon("timer")}<span><b>Average Time / Item</b><strong>${formatDuration(totalTime / Math.max(1, flagged.length))}</strong></span></div>
          </aside>
          <section class="card flagged-table-panel v3-panel">
            <div class="flagged-table-toolbar"><h2>Flagged Review Queue</h2><div><button class="btn tiny" type="button">${icon("filter")} Filters</button><span>Sorted by section</span></div></div>
            <div class="flagged-table-head"><span>Item / Topic</span><span>Source Attempt</span><span>Answer State</span><span>Time Spent</span><span>Review</span></div>
            <div class="flagged-table-scroll">
              ${grouped.map(({ category, rows }) => `<section class="flagged-section ${category.tone}"><header>${localIcon(sectionIconName(category.section))}<h2>${escapeHtml(category.label)}</h2><em>${rows.length} items</em></header>${rows.map(({ attempt, answer }) => `
                <div class="flagged-table-row"><span><i>${icon("flag")}</i><strong>Item ${answer.display_number}</strong><small>${escapeHtml(answer.subtopic || answer.topic || "Review item")}</small></span><span>${escapeHtml(examTitle(attempt))}<small>${formatDate(attempt.started_at)}</small></span><span class="${answer.selected_choice === answer.correct_choice ? "correct" : answer.selected_choice ? "wrong" : "unanswered"}">${answer.selected_choice ? answer.selected_choice === answer.correct_choice ? "Correct" : "Incorrect" : "Unanswered"}</span><span>${formatDuration(answer.time_spent_seconds)}</span><button class="btn tiny" data-open-review="${attempt.id}" data-review-question="${answer.question_id}" type="button">Review</button></div>
              `).join("")}</section>`).join("")}
            </div>
          </section>
        </div>` : `<section class="card flagged-empty v3-panel">${emptyState("No flagged questions yet", "Flag an item during an exam or answer review to place it in this queue.", "open-setup", "Start Full Mock", "practice-page", "Start Practice")}</section>`}
      </section>
    `;
  }

  function progressTrendSvg(attempts) {
    const rows = attempts.slice().sort((a, b) => new Date(a.started_at) - new Date(b.started_at)).slice(-12);
    const points = rows.map((attempt, index) => {
      const x = rows.length === 1 ? 300 : 24 + (index * 552) / (rows.length - 1);
      const y = 176 - (Math.max(0, Math.min(100, resultPercent(attempt))) * 1.42);
      return { x, y, score: Math.round(resultPercent(attempt)) };
    });
    const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
    return `<div class="trend-chart"><svg viewBox="0 0 600 210" role="img" aria-label="${rows.length ? "Completed-attempt score trend" : "No completed attempts yet"}"><defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24e8ff" stop-opacity=".34"/><stop offset="1" stop-color="#24e8ff" stop-opacity="0"/></linearGradient></defs><g class="trend-grid"><path d="M24 34H576M24 105H576M24 176H576"/><text x="2" y="39">100</text><text x="8" y="110">50</text><text x="14" y="181">0</text></g>${points.length > 1 ? `<path class="trend-area" d="M${points[0].x} 176 L${polyline.replaceAll(" ", " L")} L${points[points.length - 1].x} 176Z"/><polyline class="trend-line" points="${polyline}"/>` : ""}${points.map((point) => `<g class="trend-point"><circle cx="${point.x}" cy="${point.y}" r="5"/><text x="${point.x}" y="${point.y - 12}">${point.score}%</text></g>`).join("")}${rows.length ? "" : `<text class="trend-empty" x="300" y="108">NO ATTEMPTS YET</text>`}</svg></div>`;
  }

  function emptyInline(title, body) {
    return `<div class="empty-inline"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div>`;
  }

  function publicShell(content) {
    return cockpitFrame(`
      <header class="app-header public-header">
        <div class="brand">${logo()}${brandText()}</div>
        <span class="access-status"><i></i> Invite-only access</span>
      </header>
      <main class="public-main">${content}</main>
      <footer class="public-status-rail">
        <span>${icon("shield")} Independent practice reviewer</span>
        <span>Not affiliated with or endorsed by the Civil Service Commission</span>
        <span class="status-online"><i></i> Secure account storage</span>
      </footer>
      ${forgotPasswordModal()}
      ${toast()}
    `, "public-frame");
  }

  function signedHeader(active = "dashboard") {
    const profile = app.profile;
    const activeRoute = active === "results" || active === "review" ? "recent" : active;
    const signedLogo = active === "dashboard"
      ? `<img class="logo hub-logo" src="assets/brand-shield.svg" alt="CSC Practice Reviewer logo" />`
      : logo();
    const routes = [
      ["dashboard", "Study Hub", "dashboard"],
      ["setup", "Full Mock", "setup-page"],
      ["practice", "Practice & Review", "practice-page"],
      ["recent", "Progress", "recent-page"]
    ];
    return `
      <header class="app-header signed-header study-hub-header">
        <div class="brand">${signedLogo}${brandText()}</div>
        <nav class="signed-primary-nav" aria-label="Primary navigation">
          ${routes.map(([route, label, action]) => `<button class="${activeRoute === route ? "active" : ""}" data-action="${action}" type="button">${escapeHtml(label)}</button>`).join("")}
        </nav>
        <div class="header-actions">
          <button class="account-button" data-action="account-settings" type="button">${avatar(profile)}<span>${escapeHtml(profile?.name || "Account")}</span>${icon("chev")}</button>
        </div>
      </header>
    `;
  }

  function authedShell(content, active = "dashboard") {
    return cockpitFrame(`${signedHeader(active)}<main class="signed-main">${content}</main>${profileModal()}${confirmationModal()}${mobileBottomNav(active)}`, `signed-frame view-${active}`);
  }

  function sideShell(active, content) {
    return cockpitFrame(`
      ${signedHeader(active)}
      <div class="side-layout top-shell-layout">
        <main class="side-content">${content}</main>
      </div>
      ${profileModal()}
      ${confirmationModal()}
      ${toast()}
      ${mobileBottomNav(active)}
    `, `signed-frame view-${active}`);
  }

  function cockpitFrame(content, className = "") {
    return `<div class="cockpit-viewport ${escapeAttr(className)}"><div class="cockpit-frame">${content}</div></div>`;
  }

  function mobileBottomNav(active) {
    const items = [
      ["dashboard", "Study Hub", "dashboard", "home"],
      ["setup", "Full Mock", "setup-page", "play"],
      ["practice", "Practice", "practice-page", "brain"],
      ["recent", "Progress", "recent-page", "stats"]
    ];
    const route = active === "results" || active === "review" ? "recent" : active;
    return `<nav class="mobile-bottom-nav" aria-label="Mobile navigation">${items.map(([key, label, action, glyph]) => `<button class="${route === key ? "active" : ""}" data-action="${action}" type="button">${icon(glyph)}<span>${label}</span></button>`).join("")}</nav>`;
  }

  function brandBlock() {
    return `<div class="brand large">${logo()}${brandText()}</div>`;
  }

  function brandText() {
    return `<div><strong>CSC Practice Reviewer</strong><span>Independent mock exam and review tool</span></div>`;
  }

  function logo() {
    return `<img class="logo" src="assets/brand-shield.svg" alt="CSC Practice Reviewer logo" />`;
  }

  function sideNavItem(route, label, iconName, active) {
    const action = route === "dashboard" ? "dashboard" : `${route}-page`;
    return `<button class="${active === route ? "active" : ""}" data-action="${action}" type="button">${icon(iconName)} ${escapeHtml(label)}</button>`;
  }

  function avatar(profile, size = "") {
    const label = initials(profile?.name || profile?.email || "Reviewer");
    return `<span class="avatar ${size} tone-account">${escapeHtml(label)}</span>`;
  }

  function profileModal() {
    if (app.modal !== "profile") return "";
    const profile = app.profile;
    return `
      <div class="modal-backdrop drawer-backdrop">
        <section class="profile-modal account-settings-modal command-drawer" role="dialog" aria-modal="true" aria-labelledby="account-settings-title" tabindex="-1">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          <div class="modal-heading">
            <p class="eyebrow">Account command</p>
            <h2 id="account-settings-title">Account Settings</h2>
            <p>Identity, security, and session controls.</p>
          </div>
          <form class="account-settings-form" data-form="profile">
            <div class="account-avatar-panel">
              ${avatar(profile, "large")}
            </div>
            <div class="account-field-grid">
              <label>Full Name<input name="name" value="${escapeAttr(profile.name)}" required /></label>
              <label>Email Address <small>(used for sign-in)</small><input name="email" value="${escapeAttr(profile.email)}" disabled /></label>
            </div>
            <details class="account-password-panel" ${app.fixtureState === "password-expanded" ? "open" : ""}>
              <summary>${icon("lock")} <span>Change Password</span>${icon("chev")}</summary>
              <div class="account-password-grid" data-form="change-password">
                <label>Current Password<div class="field-with-icon has-toggle">${icon("key")}<input name="currentPassword" type="password" autocomplete="current-password" /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
                <label>New Password<div class="field-with-icon has-toggle">${icon("key")}<input name="newPassword" type="password" minlength="8" autocomplete="new-password" /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
                <label>Confirm New Password<div class="field-with-icon has-toggle">${icon("key")}<input name="confirmNewPassword" type="password" minlength="8" autocomplete="new-password" /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
              </div>
              <button class="btn secondary account-password-save" data-action="password-submit" type="button" ${app.busyAction === "password" ? "disabled" : ""}>${icon("key")} ${app.busyAction === "password" ? "Updating..." : "Update Password"}</button>
            </details>
            <div class="account-modal-actions">
              <button class="btn primary" data-action="profile-submit" type="button" ${app.busyAction === "profile" ? "disabled" : ""}>${icon("save")} ${app.busyAction === "profile" ? "Saving..." : "Save Changes"}</button>
              <button class="btn secondary" data-action="signout" type="button">${icon("logout")} Sign Out</button>
            </div>
            <div class="account-danger-row">
              <button class="btn danger outline" data-action="delete-profile" type="button">${icon("delete")} Delete Account</button>
            </div>
            </form>
        </section>
      </div>
    `;
  }

  function pauseModal(attempt) {
    if (attempt.status !== "paused") return "";
    return `
      <div class="modal-backdrop static-backdrop" data-static-backdrop="true">
        <section class="pause-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title" tabindex="-1">
          <span class="pause-icon">${icon("pause")}</span>
          <p class="eyebrow">Checkpoint secured</p>
          <h2 id="pause-title">Exam Paused</h2>
          <div class="pause-facts"><span>${localIcon("timer")}<b>Time Remaining (Frozen)</b><strong>${formatDuration(timeRemaining(attempt))}</strong></span><span>${icon("flag")}<b>Current Checkpoint</b><strong>Item ${attempt.current_question_index + 1}</strong></span><span>${localIcon("cloud-check")}<b>Sync Status</b><strong>Saved Online</strong></span></div>
          <p>Your progress has been saved.<br />Resume now or save and return to the Study Hub.</p>
          <div class="pause-actions"><button class="btn primary" data-action="resume-paused" type="button">${icon("play")} Resume Exam</button><button class="btn secondary" data-action="save-exit" type="button">${icon("save")} Save and Exit</button></div>
        </section>
      </div>
    `;
  }

  function submitModal(attempt) {
    if (app.modal !== "submit") return "";
    return `
      <div class="modal-backdrop">
        <section class="submit-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title" tabindex="-1">
          <span class="submit-danger-symbol">!</span>
          <p class="eyebrow">Final submission</p>
          <h2 id="submit-title">Submit Exam?</h2>
          <p>You are about to submit this run. <strong>This action cannot be undone.</strong></p>
          <div class="submit-stats">
            <metric class="answered">${localIcon("circle-check")}<span>Answered</span><strong>${answeredCount(attempt)}</strong></metric>
            <metric class="unanswered">${icon("clear")}<span>Unanswered</span><strong>${unansweredCount(attempt)}</strong></metric>
            <metric class="skipped">${icon("skip")}<span>Skipped</span><strong>${skippedCount(attempt)}</strong></metric>
            <metric class="flagged">${icon("flag")}<span>Flagged</span><strong>${flaggedCount(attempt)}</strong></metric>
          </div>
          <div class="submit-warning">${icon("shield")} Review unanswered and flagged questions before submitting.</div>
          <div class="modal-actions">
            <button class="btn secondary" data-action="review-unanswered" type="button">Review Unanswered</button>
            <button class="btn secondary" data-action="review-flagged" type="button">Review Flagged</button>
            <button class="btn ghost" data-action="close-modal" type="button">Cancel</button>
            <button class="btn danger" data-action="confirm-submit" type="button">Submit Exam</button>
          </div>
        </section>
      </div>
    `;
  }

  function chartModal(attempt, answer) {
    if (app.modal !== "chart" || !answer?.stimulus) return "";
    return `
      <div class="modal-backdrop chart-backdrop">
        <section class="chart-modal" role="dialog" aria-modal="true" aria-label="Expanded chart" tabindex="-1">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          ${renderStimulusPanel(attempt, answer, linkedStimulusAnswers(attempt, answer), true)}
        </section>
      </div>
    `;
  }

  function timeoutModal(attempt) {
    if (app.modal !== "timeout") return "";
    return `
      <div class="modal-backdrop static-backdrop timeout-backdrop" data-static-backdrop="true">
        <section class="timeout-modal" role="alertdialog" aria-modal="true" aria-labelledby="timeout-title" tabindex="-1">
          <span class="timeout-symbol">${icon("clock")}</span>
          <h2 id="timeout-title">Time Expired</h2>
          <div class="timeout-clock"><span>Time Remaining</span><strong>0:00</strong></div>
          <p><b>Finalizing your attempt</b><br />Synchronizing your answers. Your submission is automatic.</p>
          <div class="segmented-loader compact" aria-label="Submitting"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <small>Answered <strong>${answeredCount(attempt)}</strong> of ${attempt.total_questions}</small>
          <div class="timeout-note">${icon("refresh")} Please keep this page open while the final checkpoint is stored.</div>
        </section>
      </div>
    `;
  }

  function forgotPasswordModal() {
    if (app.modal !== "forgot-password" && app.modal !== "forgot-success") return "";
    const value = app.resetEmail || document.querySelector("[data-form='signin'] input[name='email']")?.value || app.profile?.email || "";
    const success = app.modal === "forgot-success";
    return `
      <div class="modal-backdrop auth-dialog-backdrop">
        <section class="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" tabindex="-1">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          <span class="reset-symbol">${icon(success ? "check" : "mail")}</span>
          <p class="eyebrow">Account recovery</p>
          <h2 id="reset-title">${success ? "Reset link sent" : "Reset your password"}</h2>
          ${success
            ? `<p>Check <strong>${escapeHtml(value || "your email")}</strong> for the secure reset link.</p><button class="btn primary" data-action="close-modal" type="button">Return to Sign In</button>`
            : `<p>Enter the email used for this private reviewer account.</p>${app.dialogError ? `<p class="form-error" role="alert">${escapeHtml(app.dialogError)}</p>` : ""}<form data-form="forgot-password"><label class="field-label">Email Address<div class="field-with-icon">${icon("mail")}<input name="email" type="email" value="${escapeAttr(value)}" autocomplete="email" required /></div></label><div class="modal-actions"><button class="btn secondary" data-action="close-modal" type="button">Cancel</button><button class="btn primary" data-action="send-reset" type="button" ${app.busyAction === "reset" ? "disabled" : ""}>${app.busyAction === "reset" ? "Sending..." : "Send Reset Link"}</button></div></form>`}
        </section>
      </div>
    `;
  }

  function confirmationModal() {
    if (app.modal !== "delete-account" && app.modal !== "delete-attempt") return "";
    const deletingAccount = app.modal === "delete-account";
    const attempt = deletingAccount ? null : getAttempt(app.dialogTarget);
    const target = deletingAccount ? app.profile?.name || "this account" : examTitle(attempt || {});
    return `
      <div class="modal-backdrop danger-backdrop">
        <section class="confirm-modal ${deletingAccount ? "account-delete-confirm" : "attempt-delete-confirm"}" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" tabindex="-1">
          <span class="danger-symbol">${icon("delete")}</span>
          <p class="eyebrow">Destructive command</p>
          <h2 id="confirm-title">${deletingAccount ? "Delete Account?" : "Delete Attempt?"}</h2>
          <p><strong>${escapeHtml(target)}</strong> ${deletingAccount ? "and every stored attempt" : "and its answer history"} will be permanently removed.</p>
          ${deletingAccount ? `<div class="delete-impact"><span>Account identity<b>${escapeHtml(target)}</b></span><span>Stored reviewer data<b>Attempts, answers, and results</b></span></div><label class="delete-confirm-field"><span>Confirmation</span><small>Type <b>DELETE</b> exactly to continue.</small><input data-delete-confirm name="deleteConfirmation" autocomplete="off" spellcheck="false" placeholder="Type DELETE" /></label>` : ""}
          <div class="modal-actions"><button class="btn secondary" data-action="close-modal" type="button">Cancel</button><button class="btn danger" data-action="${deletingAccount ? "confirm-delete-account" : "confirm-delete-attempt"}" type="button" ${deletingAccount ? "disabled" : ""}>${deletingAccount ? "Delete Account" : "Delete Attempt"}</button></div>
        </section>
      </div>
    `;
  }

  function updatesPopover() {
    if (app.modal !== "updates") return "";
    return `
      <div class="updates-popover">
        <strong>App Updates</strong>
        ${app.updates.length ? app.updates.map((update) => `<p>${escapeHtml(update.title)}<small>${escapeHtml(update.body || "")}</small></p>`).join("") : `<p>No active updates yet.<small>This area is reserved for future deployed-app announcements.</small></p>`}
      </div>
    `;
  }

  function overflowMenu(attempt) {
    return `
      <div class="overflow-menu">
        <button data-attempt-review="${attempt.id}" type="button">Review Answers</button>
        <button data-attempt-retake="${attempt.id}" type="button">Retake Setup</button>
        <button data-attempt-delete="${attempt.id}" type="button">Delete Attempt</button>
      </div>
    `;
  }

  function categoryPercent(stats, section) {
    if (stats) return Math.round(stats.percent);
    return 0;
  }

  function practiceCategoriesForDisplay() {
    const order = ["Verbal Ability", "Numerical Ability", "Analytical Ability", "General Information"];
    return order.map((section) => PRACTICE_CATEGORIES.find((category) => category.section === section)).filter(Boolean);
  }

  function dashboardCategoryCard(category, stats) {
    const percent = categoryPercent(stats, category.section);
    return `
      <button class="dashboard-category ${category.tone}" data-practice-category="${escapeAttr(category.section)}" type="button">
        <span class="category-symbol">${categorySymbol(category.section)}</span>
        <strong>${escapeHtml(category.label)}</strong>
        <div class="progress-line"><i style="width:${percent}%"></i></div>
        <small>${percent}%</small>
        <em>Practice ${icon("arrow")}</em>
      </button>
    `;
  }

  function progressBarRow(category, percent) {
    return `
      <div class="performance-row ${category.tone}">
        <span>${localIcon(sectionIconName(category.section))}<b>${escapeHtml(category.label)}</b></span>
        <i><b style="width:${percent}%"></b></i>
        <strong>${percent}%</strong>
        <em>${percent ? "Recorded accuracy" : "No result yet"}</em>
      </div>
    `;
  }

  function setupFact(iconName, tone, label, value) {
    return `<div class="instrument-cell ${escapeAttr(tone)}"><span class="instrument-icon">${localIcon(iconName)}</span><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function telemetryMetric(iconName, label, value) {
    return `<metric><span class="telemetry-icon">${localIcon(iconName)}</span><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></metric>`;
  }

  function sectionIconName(section) {
    return {
      "Verbal Ability": "book-open-text",
      "Numerical Ability": "calculator",
      "Analytical Ability": "brain-circuit",
      "General Information": "notebook-tabs"
    }[section] || "target";
  }

  function quickPracticeModule(category, stats) {
    return `<button class="quick-practice-module ${category.tone}" data-practice-category="${escapeAttr(category.section)}" type="button"><span class="section-hud-icon">${localIcon(sectionIconName(category.section))}</span><span><strong>${escapeHtml(category.label)}</strong><small>20-item mixed drill${stats ? ` / ${Math.round(stats.percent)}% average` : ""}</small></span><b>Start ${icon("arrow")}</b></button>`;
  }

  function dashboardRecentTable(attempts, fallbackAttempt) {
    const rows = attempts.length ? attempts : (fallbackAttempt ? [fallbackAttempt] : []);
    if (!rows.length) return `<p class="empty-note">No attempts yet. Start a full mock exam to build your history.</p>`;
    return `
      <div class="dashboard-attempt-list">
        ${rows.map((attempt) => `
          <button class="dashboard-attempt-row" data-attempt-open="${attempt.id}" type="button">
            <span><strong>${escapeHtml(examTitle(attempt))}</strong><small>${attempt.mode === "practice" ? "Practice" : "Full Mock"} / ${formatDate(attempt.submitted_at || attempt.started_at)}</small></span>
            <em>${attempt.status === "submitted" || attempt.status === "timed_out" ? `${Math.round(resultPercent(attempt))}%` : statusLabel(attempt.status)}</em>
            <b>${answeredCount(attempt)}/${attempt.total_questions}</b>
            ${icon("arrow")}
          </button>
        `).join("")}
      </div>
    `;
  }

  function emptyState(title, body, action, label, secondaryAction = "", secondaryLabel = "") {
    return `
      <div class="empty-state">
        <span class="card-icon document-icon">${icon("review")}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(body)}</p>
        ${action ? `<div class="empty-state-actions"><button class="btn primary" data-action="${escapeAttr(action)}" type="button">${label ? escapeHtml(label) : "Continue"}</button>${secondaryAction ? `<button class="btn secondary" data-action="${escapeAttr(secondaryAction)}" type="button">${escapeHtml(secondaryLabel || "Continue")}</button>` : ""}</div>` : ""}
      </div>
    `;
  }

  function categorySymbol(section) {
    return {
      "Verbal Ability": "Aa",
      "Numerical Ability": "123",
      "Analytical Ability": "<>",
      "General Information": "i"
    }[section] || ".";
  }

  function categoryMiniCard(category, stats) {
    const value = stats ? `${Math.round(stats.percent)}%` : "--";
    return `
      <button class="category-mini ${category.tone}" data-practice-category="${escapeAttr(category.section)}" type="button">
        <strong>${escapeHtml(category.label)}</strong>
        <span>${category.poolSize} questions</span>
        <small>${value} avg</small>
      </button>
    `;
  }

  function categoryPracticeCard(category, stats) {
    return `
      <section class="category-card ${category.tone}">
        <div class="category-icon">${icon(category.tone)}</div>
        <h2>${escapeHtml(category.label)}</h2>
        <p>${escapeHtml(category.description)}</p>
        <div class="category-meta">
          <span>${category.poolSize} questions</span>
          <span>${stats ? `${Math.round(stats.percent)}% avg` : "No score yet"}</span>
          <span>${stats ? `Last: ${formatDate(stats.last)}` : "Not practiced"}</span>
        </div>
        <button class="btn primary" data-practice-category="${escapeAttr(category.section)}" type="button">Start Practice</button>
      </section>
    `;
  }

  function attemptList(attempts) {
    return `<div class="attempt-list">${attempts.map((attempt) => `
      <button class="attempt-row" data-attempt-open="${attempt.id}" type="button">
        <strong>${escapeHtml(examTitle(attempt))}</strong>
        <span>${statusLabel(attempt.status)} / ${formatDuration(attempt.elapsed_seconds)}</span>
        <small>${attempt.status === "submitted" || attempt.status === "timed_out" ? `${Math.round(resultPercent(attempt))}%` : `${answeredCount(attempt)}/${attempt.total_questions} answered`}</small>
      </button>
    `).join("") || `<p class="empty-note">No attempts yet.</p>`}</div>`;
  }

  function toggleControl(name, label, checked) {
    return `
      <label class="toggle-row">${escapeHtml(label)}
        <input type="checkbox" name="${escapeAttr(name)}" ${checked ? "checked" : ""}>
        <span></span>
      </label>
    `;
  }

  function groupNavigator(attempt) {
    const answers = Object.values(attempt.answers).sort(byPosition);
    if (attempt.mode === "practice") {
      return `
        <details class="question-group" open>
          <summary><span><strong>${escapeHtml(attempt.practice_category || "Practice")}</strong><small>Questions 1-${attempt.total_questions}</small></span><em>${answeredCount(attempt)}/${attempt.total_questions} answered</em><b class="group-chevron">${icon("chev")}</b></summary>
          <div class="chip-grid">${answers.map((answer) => navChip(answer, attempt)).join("")}</div>
        </details>
      `;
    }

    return navGroupsForAttempt(attempt).map((group) => {
      const groupAnswers = answers.filter((answer) => answer.display_number >= group.start && answer.display_number <= group.end);
      const hasCurrent = groupAnswers.some((answer) => answer.position === attempt.current_question_index);
      const answered = groupAnswers.filter((answer) => answer.selected_choice).length;
      const skipped = groupAnswers.filter((answer) => answer.skipped && !answer.selected_choice).length;
      const flagged = groupAnswers.filter((answer) => answer.flagged).length;
      const expandedFull = app.expandedNavGroups.has(group.section);
      const previewAnswers = expandedFull ? navExpandedPreviewAnswers(groupAnswers, attempt.current_question_index) : navPreviewAnswers(groupAnswers, attempt.current_question_index);
      const stimulusBody = renderStimulusNavigator(group, groupAnswers, attempt);
      return `
        <details class="question-group ${group.tone}" ${navGroupOpen(group, hasCurrent) ? "open" : ""}>
          <summary>
            <span><strong>${escapeHtml(group.section)}</strong><small>Questions ${group.range}</small></span>
            <em>${answered}/${groupAnswers.length} answered</em>
            <b class="group-chevron">${icon("chev")}</b>
          </summary>
          ${stimulusBody || `
            <div class="group-counts">
              <span>${answered} answered</span>
              <span>${groupAnswers.length - answered} unanswered</span>
              <span>${skipped} skipped</span>
              <span>${flagged} flagged</span>
            </div>
            <div class="chip-grid ${expandedFull ? "is-scroll" : ""}">
              ${previewAnswers.map((answer) => navChip(answer, attempt)).join("")}
              ${!expandedFull && groupAnswers.length > previewAnswers.length ? `<button class="question-chip more-chip" data-action="toggle-nav-full" data-nav-group="${escapeAttr(group.section)}" type="button">More</button>` : ""}
              ${expandedFull && groupAnswers.length > 10 ? `<button class="question-chip more-chip" data-action="toggle-nav-full" data-nav-group="${escapeAttr(group.section)}" type="button">Less</button>` : ""}
            </div>
          `}
        </details>
      `;
    }).join("");
  }

  function navGroupsForAttempt(attempt) {
    return app.fixtureMode ? SCREEN_SECTION_GROUPS : SECTION_GROUPS;
  }

  function navGroupOpen(group, hasCurrent) {
    if (app.fixtureState === "exam") return true;
    if (app.fixtureState === "graph") return group.section === "Numerical Ability";
    if (app.fixtureState === "exam-collapsed" || app.fixtureState === "pause" || app.fixtureState === "submit") {
      return hasCurrent || app.expandedNavGroups.has(group.section);
    }
    return hasCurrent || app.expandedNavGroups.has(group.section);
  }

  function renderStimulusNavigator(group, groupAnswers, attempt) {
    if (app.fixtureMode && app.fixtureState === "graph" && group.section === "Numerical Ability") {
      const setA = groupAnswers.filter((answer) => answer.display_number >= 81 && answer.display_number <= 85);
      const setB = groupAnswers.filter((answer) => answer.display_number >= 86 && answer.display_number <= 90);
      const setC = groupAnswers.filter((answer) => answer.display_number >= 91 && answer.display_number <= 100);
      return `
        <div class="stimulus-nav">
          <details class="stimulus-set" open>
            <summary class="stimulus-set-head"><strong>Chart Set A</strong><span>Questions 81-85</span><em>3/5 answered</em><b class="group-chevron">${icon("chev")}</b></summary>
            <div class="chip-grid set-grid">${setA.map((answer) => navChip(answer, attempt)).join("")}</div>
          </details>
          <details class="stimulus-set">
            <summary class="stimulus-set-head"><strong>Numerical Set B</strong><span>Questions 86-90</span><em>2/5 answered</em><b class="group-chevron">${icon("chev")}</b></summary>
            <div class="chip-grid set-grid">${setB.map((answer) => navChip(answer, attempt)).join("")}</div>
          </details>
          <details class="stimulus-set">
            <summary class="stimulus-set-head"><strong>Numerical Set C</strong><span>Questions 91-100</span><em>7/10 answered</em><b class="group-chevron">${icon("chev")}</b></summary>
            <div class="chip-grid set-grid">${setC.map((answer) => navChip(answer, attempt)).join("")}</div>
          </details>
        </div>
      `;
    }

    const stimulusGroups = [];
    const seen = new Set();
    for (const answer of groupAnswers) {
      const stimulusId = answer.stimulus?.id;
      if (!stimulusId || seen.has(stimulusId)) continue;
      const items = groupAnswers.filter((candidate) => candidate.stimulus?.id === stimulusId);
      if (items.length < 2) continue;
      seen.add(stimulusId);
      stimulusGroups.push(items);
    }
    if (!stimulusGroups.length) return "";
    return `
      <div class="stimulus-nav">
        ${stimulusGroups.map((items, index) => {
          const answered = items.filter((item) => item.selected_choice).length;
          return `
            <section class="stimulus-set open">
              <div class="stimulus-set-head"><strong>Chart Set ${String.fromCharCode(65 + index)}</strong><span>Questions ${items[0].display_number}-${items[items.length - 1].display_number}</span><em>${answered}/${items.length} answered</em></div>
              <div class="chip-grid set-grid">${items.map((answer) => navChip(answer, attempt)).join("")}</div>
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  function navPreviewAnswers(groupAnswers, currentIndex) {
    if (groupAnswers.length <= 10) return groupAnswers;
    const currentPosition = groupAnswers.findIndex((answer) => answer.position === currentIndex);
    const blockStart = currentPosition >= 0 ? Math.floor(currentPosition / 10) * 10 : 0;
    return groupAnswers.slice(blockStart, blockStart + 10);
  }

  function navExpandedPreviewAnswers(groupAnswers, currentIndex) {
    if (groupAnswers.length <= 20) return groupAnswers;
    const currentPosition = groupAnswers.findIndex((answer) => answer.position === currentIndex);
    const blockStart = currentPosition >= 0 ? Math.floor(currentPosition / 10) * 10 : 0;
    return groupAnswers.slice(blockStart, blockStart + 20);
  }

  function navChip(answer, attempt) {
    return `<button class="question-chip ${answerStatus(answer)} ${answer.flagged ? "flagged" : ""} ${answer.position === attempt.current_question_index ? "current" : ""}" data-goto="${answer.position}" type="button">${answer.display_number}</button>`;
  }

  function renderStimulusPanel(attempt, answer, linked, reviewMode = false) {
    const stimulus = answer.stimulus;
    if (!stimulus) return "";
    const rows = toArray(stimulus.rows);
    const headers = toArray(stimulus.headers);
    const groupedChart = stimulus.chartType === "grouped-bars" ? renderGroupedBarChart(stimulus) : "";
    const chartRows = rows.map((row) => {
      const values = row.slice(1).map(Number).filter(Number.isFinite);
      return { label: row[0], total: values.reduce((sum, value) => sum + value, 0) };
    }).filter((row) => row.total > 0);
    const max = chartRows.length ? Math.max(...chartRows.map((row) => row.total)) : 1;
    return `
      <section class="stimulus-panel">
        <div class="stimulus-head">
          <div>
            <span>${escapeHtml(stimulus.label || linked.label)}</span>
            <h2>${escapeHtml(stimulus.title || "Shared data set")}</h2>
            <p>${escapeHtml(stimulus.description || stimulus.alt || "")}</p>
          </div>
          ${reviewMode ? "" : `<button class="btn tiny" data-action="open-chart" type="button">${icon("open")} Open Larger</button>`}
        </div>
        ${groupedChart || (chartRows.length ? `<div class="chart-bars">${chartRows.map((row) => `<div><span>${escapeHtml(row.label)}</span><i><b style="width:${Math.max(6, Math.round((row.total / max) * 100))}%"></b></i><strong>${row.total}</strong></div>`).join("")}</div>` : "")}
        ${!groupedChart && headers.length && rows.length ? `<div class="data-table-wrap"><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
        <div class="linked-items">
          <strong>${escapeHtml(linked.label)}</strong>
          <div>${linked.items.map((item) => `<button class="${item.position === attempt.current_question_index ? "active" : ""}" data-goto="${item.position}" type="button">${item.display_number}</button>`).join("")}</div>
          <p>These questions are connected and use the same chart.</p>
        </div>
      </section>
    `;
  }

  function renderGroupedBarChart(stimulus) {
    const rows = toArray(stimulus.rows);
    const series = toArray(stimulus.series);
    if (!rows.length || !series.length) return "";
    const max = Math.max(120, ...series.flatMap((entry) => toArray(entry.values).map(Number).filter(Number.isFinite)));
    return `
      <div class="grouped-chart" role="img" aria-label="${escapeAttr(stimulus.alt || stimulus.title || "Grouped bar chart")}">
        <div class="chart-legend">${series.map((entry) => `<span><i style="background:${escapeAttr(entry.color)}"></i>${escapeHtml(entry.label)}</span>`).join("")}</div>
        <div class="chart-plot">
          <span class="y-label">${escapeHtml(stimulus.yLabel || "")}</span>
          <div class="chart-scale">${[120, 100, 80, 60, 40, 20, 0].map((tick) => `<span>${tick}</span>`).join("")}</div>
          <div class="chart-bars-vertical">
            ${rows.map((row, rowIndex) => `
              <div class="chart-month">
                <div class="bar-cluster">
                  ${series.map((entry) => {
                    const value = Number(toArray(entry.values)[rowIndex] || 0);
                    return `<b style="height:${Math.max(4, Math.round((value / max) * 100))}%; background:${escapeAttr(entry.color)}"><em>${value}</em></b>`;
                  }).join("")}
                </div>
                <strong>${escapeHtml(row[0])}</strong>
              </div>
            `).join("")}
          </div>
        </div>
        <small>${escapeHtml(stimulus.xLabel || "")}</small>
      </div>
    `;
  }

  function insightCard(title, value, detail) {
    return `<div class="insight-card"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></div>`;
  }

  function resultInsight(iconName, title, value, detail, tone) {
    return `<article class="result-insight ${escapeAttr(tone)}"><span>${localIcon(iconName)}</span><div><small>${escapeHtml(title)}</small><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></div></article>`;
  }

  function toast() {
    return app.toast ? `<div class="toast">${escapeHtml(app.toast)}</div>` : "";
  }

  async function handleSubmit(event) {
    const form = event.target.closest("form");
    if (!form) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const formName = form.dataset.form;

    try {
      if (formName === "signup") await runBusy("create", () => signUp(data));
      if (formName === "signin") await runBusy("signin", () => signIn(data));
      if (formName === "setup") await startFullExam(formOptions(form));
      if (formName === "profile") await runBusy("profile", () => saveProfile(form));
      if (formName === "change-password") await runBusy("password", () => changePassword(data));
      if (formName === "custom-practice") await startPractice(data.category, Number(data.count), data.difficulty);
      if (formName === "forgot-password") await runBusy("reset", () => sendPasswordReset(data));
    } catch (error) {
      if (formName === "forgot-password") {
        app.dialogError = readableError(error);
        render();
        return;
      }
      showToast(readableError(error));
    }
  }

  function handleFixtureClick(target, action) {
    const active = getAttempt("fixture-active");
    const submitted = getAttempt("fixture-submitted");
    if (action === "show-signin") {
      app.fixtureState = "select";
      return setView({ name: "signin" }) || true;
    }
    if (action === "show-create") {
      app.fixtureState = "create";
      return setView({ name: "create" }) || true;
    }
    if (action === "reload-app") return true;
    if (action === "forgot-password") {
      app.resetEmail = "john.smith@email.com";
      app.modal = "forgot-password";
      return render() || true;
    }
    if (action === "send-reset") {
      app.resetEmail = formDataFromButton(target).email || "john.smith@email.com";
      app.fixtureState = "forgot-success";
      app.modal = "forgot-success";
      return render() || true;
    }
    if (action === "signup-submit" || action === "signin-submit" || action === "dashboard") {
      app.fixtureState = "dashboard";
      app.modal = null;
      return setView({ name: "dashboard" }) || true;
    }
    if (action === "open-setup" || action === "setup-page" || action === "retake-setup") {
      app.fixtureState = "setup";
      app.modal = null;
      return setView({ name: "setup" }) || true;
    }
    if (action === "setup-submit" || action === "save-setup" || action === "resume-exam") {
      active.status = "in_progress";
      active.current_question_index = action === "resume-exam" ? 42 : 0;
      app.fixtureState = action === "resume-exam" ? "exam-collapsed" : "exam";
      app.modal = null;
      return setView({ name: "exam", attemptId: active.id }) || true;
    }
    if (action === "practice-page") {
      app.fixtureState = "practice";
      app.practiceReviewTab = "practice";
      app.modal = null;
      return setView({ name: "practice" }) || true;
    }
    if (action === "recent-page" || action === "results-history-page") {
      app.fixtureState = "recent";
      app.modal = null;
      return setView({ name: "recent" }) || true;
    }
    if (action === "mistakes-page") {
      app.fixtureState = "practice";
      app.practiceReviewTab = "mistakes";
      return setView({ name: "practice" }) || true;
    }
    if (action === "bookmarks-page") {
      app.fixtureState = "practice";
      app.practiceReviewTab = "flagged";
      return setView({ name: "practice" }) || true;
    }
      if (action === "manage-profile" || action === "switch-account" || action === "account-settings") {
        app.fixtureState = "profile-modal";
        app.modal = "profile";
        return setView({ name: "dashboard" }) || true;
    }
    if (action === "close-modal") {
      app.modal = null;
      app.fixtureState = app.view.name === "exam" ? "exam-collapsed" : "dashboard";
      render();
      return true;
    }
    if (action === "toggle-exam-nav") {
      app.examNavOpen = !app.examNavOpen;
      return renderExam() || true;
    }
    if (action === "pause-exam") {
      active.status = "paused";
      app.fixtureState = "pause";
      return renderExam() || true;
    }
    if (action === "resume-paused") {
      active.status = "in_progress";
      app.fixtureState = "exam-collapsed";
      return renderExam() || true;
    }
    if (action === "save-exit") {
      active.status = "in_progress";
      app.modal = null;
      app.fixtureState = "dashboard";
      return setView({ name: "dashboard" }) || true;
    }
    if (action === "open-submit") {
      app.modal = "submit";
      app.fixtureState = "submit";
      return renderExam() || true;
    }
    if (action === "confirm-submit") {
      app.modal = null;
      app.fixtureState = "results";
      return setView({ name: "results", attemptId: submitted.id }) || true;
    }
    if (action === "review-unanswered" || action === "review-flagged") return false;
    if (action === "review-answers") {
      app.fixtureState = "review";
      return setView({ name: "review", attemptId: submitted.id, index: 42 }) || true;
    }
    if (target.dataset.practiceReviewTab) {
      app.practiceReviewTab = target.dataset.practiceReviewTab;
      app.fixtureState = "practice";
      return setView({ name: "practice" }) || true;
    }
    if (action === "back-results") {
      app.fixtureState = "results";
      return setView({ name: "results", attemptId: submitted.id }) || true;
    }
    if (action === "custom-practice-submit" || target.dataset.practiceCategory) {
      const practice = getAttempt("fixture-practice");
      app.fixtureState = "results";
      return setView({ name: "results", attemptId: practice.id }) || true;
    }
    if (action === "repeat-practice" || action === "change-practice" || action === "practice-weakest") {
      if (action === "change-practice" || action === "practice-weakest") {
        app.practiceReviewTab = "practice";
        app.fixtureState = "practice";
        return setView({ name: "practice" }) || true;
      }
      app.fixtureState = "exam-collapsed";
      return setView({ name: "exam", attemptId: active.id }) || true;
    }
    if (action === "retake-same-version") {
      app.fixtureState = "setup";
      return setView({ name: "setup" }) || true;
    }
    if (action === "delete-profile") {
      app.fixtureState = "delete-account";
      app.modal = "delete-account";
      return render() || true;
    }
    if (action === "confirm-delete-account") {
      app.fixtureState = "select";
      app.modal = null;
      return setView({ name: "signin" }) || true;
    }
    if (action === "confirm-delete-attempt") {
      app.attempts = app.attempts.filter((attempt) => attempt.id !== app.dialogTarget);
      app.modal = null;
      app.fixtureState = "progress";
      return render() || true;
    }
    if (action === "password-submit" || action === "profile-submit") {
      showToast("Fixture mode: no Supabase data is changed.");
      return true;
    }
    if (action === "signout") {
      app.fixtureState = "select";
      return setView({ name: "signin" }) || true;
    }
    if (target.dataset.attemptResults || target.dataset.attemptOpen || target.dataset.attemptReview) {
      app.fixtureState = target.dataset.attemptReview ? "review" : "results";
      return setView({ name: target.dataset.attemptReview ? "review" : "results", attemptId: submitted.id, index: 0 }) || true;
    }
    if (target.dataset.attemptDelete) {
      app.dialogTarget = target.dataset.attemptDelete;
      app.modal = "delete-attempt";
      app.fixtureState = "delete-attempt";
      return render() || true;
    }
    return false;
  }

  async function handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    const action = target.dataset.action;

    try {
      if (app.fixtureMode && handleFixtureClick(target, action)) return;
      if (action === "reload-app") return location.reload();
      if (action === "toggle-password") return togglePasswordVisibility(target);
      if (action === "show-signin") return setView({ name: "signin" });
      if (action === "show-create") return setView({ name: "create" });
      if (action === "signup-submit") return await runBusy("create", () => signUp(formDataFromButton(target)));
      if (action === "signin-submit") return await runBusy("signin", () => signIn(formDataFromButton(target)));
      if (action === "setup-submit") return await startFullExam(formOptions(target.closest("form")));
      if (action === "profile-submit") return await runBusy("profile", () => saveProfile(target.closest("form")));
      if (action === "password-submit") return await runBusy("password", () => changePassword(formDataFromButton(target)));
      if (action === "custom-practice-submit") {
        const values = formDataFromButton(target);
        return await startPractice(values.category, Number(values.count), values.difficulty);
      }
      if (action === "reset-practice") {
        const form = target.closest("form");
        form?.reset();
        return syncPracticeProfile(form);
      }
      if (action === "dashboard") return setView({ name: "dashboard" });
      if (action === "open-setup" || action === "setup-page" || action === "retake-setup") return setView({ name: "setup" });
      if (action === "practice-page") {
        app.practiceReviewTab = "practice";
        return setView({ name: "practice" });
      }
      if (action === "recent-page") return setView({ name: "recent" });
      if (action === "mistakes-page") {
        app.practiceReviewTab = "mistakes";
        return setView({ name: "practice" });
      }
      if (action === "bookmarks-page") {
        app.practiceReviewTab = "flagged";
        return setView({ name: "practice" });
      }
      if (action === "results-history-page") return setView({ name: "recent" });
      if (action === "manage-profile" || action === "account-settings") return openModal("profile");
      if (action === "close-modal") return closeModal();
      if (action === "signout") return await signOut();
      if (action === "forgot-password") return await forgotPassword();
      if (action === "send-reset") return await runBusy("reset", () => sendPasswordReset(formDataFromButton(target)));
      if (action === "save-setup") return await saveSetupDraft();
      if (action === "resume-exam") return resumeActiveAttempt();
      if (action === "pause-exam") return await pauseAttempt();
      if (action === "resume-paused") return await resumePausedAttempt();
      if (action === "save-exit") return await saveAndExit();
      if (action === "open-submit") return openModal("submit");
      if (action === "confirm-submit") return await submitCurrentAttempt(false);
      if (action === "review-unanswered") return jumpToFirst((answer) => !answer.selected_choice);
      if (action === "review-flagged") return jumpToFirst((answer) => answer.flagged);
      if (action === "previous-question") return navigateQuestion(-1);
      if (action === "next-question") return navigateQuestion(1);
      if (action === "skip-question") return skipQuestion();
      if (action === "clear-answer") return clearAnswer();
      if (action === "toggle-flag") return toggleFlag();
      if (action === "open-chart") return openModal("chart");
      if (action === "toggle-exam-nav") {
        app.examNavOpen = !app.examNavOpen;
        return renderExam();
      }
      if (action === "review-answers") return setView({ name: "review", attemptId: app.view.attemptId, index: 0 });
      if (action === "back-results") return setView({ name: "results", attemptId: app.view.attemptId });
      if (action === "review-prev") return moveReview(-1);
      if (action === "review-next") return moveReview(1);
      if (action === "toggle-updates") return openModal(app.modal === "updates" ? null : "updates");
      if (action === "delete-profile") return await deleteProfile();
      if (action === "confirm-delete-account") return await confirmDeleteProfile();
      if (action === "confirm-delete-attempt") return await confirmDeleteAttempt();
      if (action === "repeat-practice") return await repeatPractice();
      if (action === "change-practice") {
        app.practiceReviewTab = "practice";
        return setView({ name: "practice" });
      }
      if (action === "practice-weakest") return await practiceWeakestArea();
      if (action === "retake-same-version") return await retakeSameVersion();
      if (action === "toggle-nav-full") {
        const group = target.dataset.navGroup;
        if (app.expandedNavGroups.has(group)) app.expandedNavGroups.delete(group);
        else app.expandedNavGroups.add(group);
        return render();
      }

      if (target.dataset.choice) return chooseAnswer(target.dataset.choice);
      if (target.dataset.goto !== undefined) return gotoQuestion(Number(target.dataset.goto));
      if (target.dataset.reviewFilter) return setReviewFilter(target.dataset.reviewFilter);
      if (target.dataset.reviewIndex !== undefined) return setView({ ...app.view, index: Number(target.dataset.reviewIndex) });
      if (target.dataset.practiceReviewTab) {
        app.practiceReviewTab = target.dataset.practiceReviewTab;
        return render();
      }
      if (target.dataset.practiceCategory) return await startPractice(target.dataset.practiceCategory, DEFAULT_PRACTICE_COUNT, "mixed");
      if (target.dataset.attemptOpen) return openAttempt(target.dataset.attemptOpen);
      if (target.dataset.attemptResults) return setView({ name: "results", attemptId: target.dataset.attemptResults });
      if (target.dataset.attemptReview) return setView({ name: "review", attemptId: target.dataset.attemptReview, index: 0 });
      if (target.dataset.attemptRetake) return setView({ name: "setup" });
      if (target.dataset.attemptDelete) return await deleteAttempt(target.dataset.attemptDelete);
      if (target.dataset.overflow) return openModal(app.modal === `overflow:${target.dataset.overflow}` ? null : `overflow:${target.dataset.overflow}`);
      if (target.dataset.recentTab) {
        app.recentTab = target.dataset.recentTab;
        return render();
      }
      if (target.dataset.reviewMistakes) {
        app.reviewFilter = "wrong";
        return setView({ name: "review", attemptId: target.dataset.reviewMistakes, index: 0 });
      }
      if (target.dataset.openReview) {
        app.reviewFilter = "flagged";
        const attempt = getAttempt(target.dataset.openReview);
        const flagged = filteredReviewAnswers(attempt, "flagged");
        const index = Math.max(0, flagged.findIndex((answer) => answer.question_id === target.dataset.reviewQuestion));
        return setView({ name: "review", attemptId: target.dataset.openReview, index });
      }
    } catch (error) {
      showToast(readableError(error));
    }
  }

  function handleChange(event) {
    const input = event.target;
    if (input.closest("[data-form='setup']")) saveSetupDraft(false);
    const practiceForm = input.closest("[data-form='custom-practice']");
    if (practiceForm) syncPracticeProfile(practiceForm);
  }

  function handleInput(event) {
    const input = event.target.closest("[data-delete-confirm]");
    if (!input) return;
    const button = input.closest("[role='alertdialog']")?.querySelector("[data-action='confirm-delete-account']");
    if (button) button.disabled = input.value.trim() !== "DELETE";
  }

  function syncPracticeProfile(form) {
    if (!form) return;
    const selectedCategory = form.querySelector("input[name='category']:checked")?.value || "Verbal Ability";
    const selectedCount = form.querySelector("input[name='count']:checked")?.value || "20";
    const selectedDifficulty = form.querySelector("input[name='difficulty']:checked")?.closest("label")?.textContent.trim() || "Mixed";
    const category = practiceCategoriesForDisplay().find((entry) => entry.section === selectedCategory) || practiceCategoriesForDisplay()[0];
    const section = form.querySelector("[data-practice-profile-section]");
    if (section) {
      section.className = `selected-run-section ${category.tone}`;
      section.innerHTML = `${localIcon(sectionIconName(category.section))}<strong>${escapeHtml(category.label)} selected</strong>`;
    }
    const count = form.querySelector("[data-practice-count]");
    const difficulty = form.querySelector("[data-practice-difficulty]");
    if (count) count.textContent = selectedCount;
    if (difficulty) difficulty.textContent = selectedDifficulty;
  }

  function handleKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey && event.target instanceof HTMLInputElement) {
      const form = event.target.closest("form");
      const action = form?.dataset.form === "signin"
        ? "signin-submit"
        : form?.dataset.form === "signup"
          ? "signup-submit"
          : form?.dataset.form === "forgot-password"
            ? "send-reset"
            : "";
      const submitter = action ? form.querySelector(`[data-action='${action}']`) : null;
      if (submitter && !submitter.disabled) {
        event.preventDefault();
        submitter.click();
        return;
      }
    }
    const dialog = document.querySelector("[role='dialog'], [role='alertdialog']");
    if (!dialog) return;
    if (event.key === "Escape") {
      const staticDialog = dialog.closest(".static-backdrop");
      if (!staticDialog && app.modal) {
        event.preventDefault();
        closeModal();
      }
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex='-1'])"));
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function signUp(data) {
    const inviteCode = String(data.inviteCode || "").trim();
    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match.");
    }
    const { data: result, error } = await app.client.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          display_name: data.name.trim(),
          invite_code: inviteCode
        }
      }
    });
    if (error) throw error;
    if (result.session) {
      app.session = result.session;
      await loadUserData();
      setView({ name: "dashboard" });
    } else {
      await signIn(data);
    }
  }

  async function runBusy(action, task) {
    app.busyAction = action;
    render();
    try {
      return await task();
    } finally {
      app.busyAction = "";
      render();
    }
  }

  async function signIn(data) {
    const { data: result, error } = await app.client.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password
    });
    if (error) throw error;
    app.session = result.session;
    await loadUserData();
    setView({ name: "dashboard" });
  }

  function togglePasswordVisibility(button) {
    const field = button.closest(".field-with-icon");
    const input = field?.querySelector("input");
    if (!input) return;
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    button.classList.toggle("is-visible", visible);
  }

  async function signOut() {
    await flushDirty({ immediate: true });
    const { error } = await app.client.auth.signOut();
    if (error) throw error;
    app.session = null;
    app.profile = null;
    app.attempts = [];
    setView({ name: "signin" });
  }

  function forgotPassword() {
    app.resetEmail = document.querySelector("[data-form='signin'] input[name='email']")?.value || app.profile?.email || "";
    app.dialogError = "";
    openModal("forgot-password");
  }

  async function sendPasswordReset(data) {
    const email = String(data.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    app.resetEmail = email;
    const { error } = await app.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}`
    });
    if (error) throw error;
    app.dialogError = "";
    app.modal = "forgot-success";
    render();
  }

  async function changePassword(data) {
    const email = app.profile.email;
    const currentPassword = data.currentPassword;
    const newPassword = data.newPassword;
    if (data.confirmNewPassword !== undefined && newPassword !== data.confirmNewPassword) {
      throw new Error("New passwords do not match.");
    }
    const signInResult = await app.client.auth.signInWithPassword({ email, password: currentPassword });
    if (signInResult.error) throw signInResult.error;
    const { error } = await app.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
    showToast("Password changed.");
  }

  async function saveProfile(form) {
    const formData = Object.fromEntries(new FormData(form).entries());
    const updates = {
      user_id: app.session.user.id,
      name: formData.name.trim(),
      level: app.profile.level || "Professional",
      birth_date: app.profile.birth_date || null,
      notes: app.profile.notes || "",
      last_active_at: nowIso()
    };
    const { data, error } = await app.client.from("profiles").update(updates).eq("user_id", app.session.user.id).select("*").single();
    if (error) throw error;
    app.profile = data;
    closeModal();
    showToast("Account settings saved.");
  }

  async function deleteProfile() {
    app.modal = "delete-account";
    render();
  }

  async function confirmDeleteProfile() {
    const confirmation = document.querySelector("[data-delete-confirm]")?.value.trim();
    if (confirmation !== "DELETE") return;
    const { error } = await app.client.from("profiles").delete().eq("user_id", app.session.user.id);
    if (error) throw error;
    await app.client.auth.signOut();
    app.session = null;
    setView({ name: "signin" });
  }

  async function retakeSameVersion() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    return startFullExam({ ...DEFAULT_OPTIONS, ...(attempt.options || {}), versionId: attempt.exam_version_id });
  }

  async function repeatPractice() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    return startPractice(attempt.practice_category || "Verbal Ability", attempt.options?.count || attempt.total_questions || DEFAULT_PRACTICE_COUNT, attempt.options?.difficulty || "mixed");
  }

  async function practiceWeakestArea() {
    const attempt = getAttempt(app.view.attemptId);
    const weakest = performanceInsights(attempt).weakest?.section || "Verbal Ability";
    return startPractice(weakest, DEFAULT_PRACTICE_COUNT, "mixed");
  }

  function formOptions(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    return {
      versionId: values.versionId || examVersions[0]?.id,
      showTimer: Boolean(values.showTimer),
      enablePause: Boolean(values.enablePause),
      shuffleQuestions: Boolean(values.shuffleQuestions),
      shuffleAnswers: Boolean(values.shuffleAnswers)
    };
  }

  function formDataFromButton(button) {
    const form = button.closest("form");
    return form ? Object.fromEntries(new FormData(form).entries()) : {};
  }

  async function saveSetupDraft(notify = true) {
    const form = document.querySelector("[data-form='setup']");
    const options = form ? formOptions(form) : { ...DEFAULT_OPTIONS };
    const payload = { user_id: app.session?.user?.id || "local-user", options, updated_at: nowIso() };
    if (app.fixtureMode || !app.client || !app.session?.user?.id) {
      app.draft = payload;
      if (notify) {
        showToast("Setup saved for later.");
        setView({ name: "dashboard" });
      }
      return;
    }
    const { data, error } = await app.client.from("setup_drafts").upsert(payload, { onConflict: "user_id" }).select("*").single();
    if (error) throw error;
    app.draft = data;
    if (notify) {
      showToast("Setup saved for later.");
      setView({ name: "dashboard" });
    }
  }

  async function startFullExam(options) {
    const version = examVersions.find((candidate) => candidate.id === options.versionId) || examVersions[0];
    if (!version) throw new Error("No exam version found.");
    const orderedQuestions = prepareFullExamQuestions(version.questions, options);
    const attempt = await createAttempt({
      mode: "full",
      title: version.title,
      examVersionId: version.id,
      totalTimeSeconds: TOTAL_TIME_SECONDS,
      questions: orderedQuestions,
      options
    });
    setView({ name: "exam", attemptId: attempt.id });
  }

  async function startPractice(category, count, difficulty) {
    const pool = buildPracticePool(category, difficulty);
    const selected = pool.slice(0, count).map((question, index) => ({ question, displayNumber: index + 1, originalItemNumber: question.itemNumber }));
    const attempt = await createAttempt({
      mode: "practice",
      title: `${sectionLabel(category)} Practice`,
      examVersionId: `practice-${slug(category)}-${Date.now()}`,
      practiceCategory: category,
      totalTimeSeconds: null,
      questions: selected,
      options: { showTimer: false, enablePause: true, shuffleQuestions: false, shuffleAnswers: false, difficulty, count }
    });
    setView({ name: "exam", attemptId: attempt.id });
  }

  async function createAttempt({ mode, title, examVersionId, practiceCategory, totalTimeSeconds, questions, options }) {
    const attemptId = crypto.randomUUID();
    const now = nowIso();
    const questionOrder = questions.map((entry) => entry.question.id);
    const attemptRow = {
      id: attemptId,
      user_id: app.session.user.id,
      mode,
      title,
      practice_category: practiceCategory || null,
      exam_version_id: examVersionId,
      status: "in_progress",
      started_at: now,
      elapsed_seconds: 0,
      current_question_index: 0,
      total_questions: questions.length,
      total_time_seconds: totalTimeSeconds,
      options,
      question_order: questionOrder
    };
    const answerRows = questions.map((entry, position) => answerSnapshot(attemptId, entry.question, position, entry.displayNumber || position + 1, options.shuffleAnswers));
    answerRows[0].visit_count = 1;
    answerRows[0].first_seen_at = now;
    answerRows[0].last_seen_at = now;

    const { data, error } = await app.client.from("attempts").insert(attemptRow).select("*").single();
    if (error) throw error;
    const answersResult = await app.client.from("attempt_answers").insert(answerRows).select("*");
    if (answersResult.error) throw answersResult.error;
    const attempt = normalizeAttempt({ ...data, attempt_answers: answersResult.data || [] });
    app.attempts.unshift(attempt);
    return attempt;
  }

  function answerSnapshot(attemptId, question, position, displayNumber, shuffleAnswers) {
    const now = nowIso();
    const snapshot = shuffledChoices(question, shuffleAnswers, position + 1);
    return {
      attempt_id: attemptId,
      user_id: app.session.user.id,
      question_id: question.id,
      position,
      display_number: displayNumber,
      original_item_number: question.itemNumber || displayNumber,
      section: question.section,
      subtopic: question.subtopic,
      csc_skill: question.cscSkill || question.subtopic,
      prompt: question.prompt,
      choices: snapshot.choices,
      correct_choice: snapshot.correctChoice,
      original_correct_choice: question.correctChoice,
      explanation: question.explanation || "",
      stimulus: question.stimulus || null,
      difficulty: question.difficulty || "medium",
      selected_choice: null,
      skipped: false,
      flagged: false,
      time_spent_seconds: 0,
      visit_count: 0,
      answer_changes: 0,
      changed_wrong_to_correct: 0,
      changed_correct_to_wrong: 0,
      answer_history: [],
      created_at: now,
      updated_at: now
    };
  }

  function prepareFullExamQuestions(versionQuestions, options) {
    const withDisplay = [];
    for (const group of SECTION_GROUPS) {
      const sectionQuestions = versionQuestions.filter((question) => question.section === group.section);
      const ordered = options.shuffleQuestions ? shuffleBlocks(sectionQuestions, `${options.versionId}-${group.section}`) : sectionQuestions;
      ordered.forEach((question, offset) => withDisplay.push({ question, displayNumber: group.start + offset, originalItemNumber: question.itemNumber }));
    }
    return withDisplay;
  }

  function shuffleBlocks(questions, seedText) {
    const blocks = [];
    const byStimulus = new Map();
    for (const question of questions) {
      const key = question.stimulus?.id || question.id;
      if (!byStimulus.has(key)) {
        byStimulus.set(key, []);
        blocks.push(byStimulus.get(key));
      }
      byStimulus.get(key).push(question);
    }
    return seededShuffle(blocks, hashCode(seedText)).flat();
  }

  function buildPracticePool(category, difficulty) {
    let pool = questionBank.filter((question) => question.section === category);
    if (difficulty && difficulty !== "mixed") pool = pool.filter((question) => question.difficulty === difficulty);
    if (pool.length < 120) pool = questionBank.filter((question) => question.section === category);
    return seededShuffle(pool, hashCode(`${category}-${difficulty}-${app.session.user.id}`)).slice(0, 120);
  }

  function shuffledChoices(question, shouldShuffle, seed) {
    const sourceChoices = toArray(question.choices).slice(0, 4);
    if (!shouldShuffle) {
      return { choices: sourceChoices, correctChoice: question.correctChoice };
    }
    const shuffledTexts = seededShuffle(sourceChoices, hashCode(`${question.id}-${seed}`));
    const letters = ["A", "B", "C", "D"];
    const choices = shuffledTexts.map((choice, index) => ({ id: letters[index], text: choice.text }));
    const correctText = sourceChoices.find((choice) => choice.id === question.correctChoice)?.text;
    return { choices, correctChoice: choices.find((choice) => choice.text === correctText)?.id || "A" };
  }

  function tickAttempt(attemptId) {
    const attempt = getAttempt(attemptId);
    if (!attempt || attempt.status !== "in_progress") return;
    attempt.elapsed_seconds += 1;
    const answer = currentAnswer(attempt);
    if (answer) {
      answer.time_spent_seconds += 1;
      answer.last_seen_at = nowIso();
      touchAnswer(attempt, answer.question_id);
    }
    touchAttempt(attempt);
    if (attempt.total_time_seconds && attempt.elapsed_seconds >= attempt.total_time_seconds) {
      beginTimeout(attempt);
      return;
    }
    updateExamTimerDom(attempt);
  }

  function updateExamTimerDom(attempt) {
    const timer = document.querySelector(".exam-time");
    const answered = document.querySelector(".exam-answered");
    if (timer && attempt.options?.showTimer !== false) timer.textContent = `Time Left: ${formatDuration(timeRemaining(attempt))}`;
    if (answered) answered.textContent = `Answered: ${answeredCount(attempt)}/${attempt.total_questions}`;
  }

  function beginTimeout(attempt) {
    if (app.modal === "timeout") return;
    app.modal = "timeout";
    renderExam();
    setTimeout(() => submitAttempt(attempt, true), 900);
  }

  function chooseAnswer(choice) {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!attempt || !answer || attempt.status !== "in_progress") return;
    const previous = answer.selected_choice;
    if (previous && previous !== choice) {
      answer.answer_changes += 1;
      if (previous !== answer.correct_choice && choice === answer.correct_choice) answer.changed_wrong_to_correct += 1;
      if (previous === answer.correct_choice && choice !== answer.correct_choice) answer.changed_correct_to_wrong += 1;
    }
    answer.selected_choice = choice;
    answer.skipped = false;
    answer.last_answered_at = nowIso();
    answer.first_answered_at = answer.first_answered_at || answer.last_answered_at;
    answer.answer_history = [...toArray(answer.answer_history), { choice, at: answer.last_answered_at }];
    touchAnswer(attempt, answer.question_id);
    touchAttempt(attempt);
    renderExam();
  }

  function clearAnswer() {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!answer || attempt.status !== "in_progress") return;
    answer.selected_choice = null;
    answer.last_answered_at = nowIso();
    touchAnswer(attempt, answer.question_id);
    renderExam();
  }

  function skipQuestion() {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!answer || attempt.status !== "in_progress") return;
    answer.skipped = true;
    touchAnswer(attempt, answer.question_id);
    if (answer.position < attempt.total_questions - 1) gotoQuestion(answer.position + 1);
    else renderExam();
  }

  function toggleFlag() {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!answer) return;
    answer.flagged = !answer.flagged;
    touchAnswer(attempt, answer.question_id);
    renderExam();
  }

  function navigateQuestion(delta) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    const answer = currentAnswer(attempt);
    if (delta > 0 && answer && !answer.selected_choice) {
      showToast("Choose an answer or use Skip.");
      return;
    }
    gotoQuestion(Math.min(Math.max(0, attempt.current_question_index + delta), attempt.total_questions - 1));
  }

  function gotoQuestion(index) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || index < 0 || index >= attempt.total_questions) return;
    attempt.current_question_index = index;
    app.examNavOpen = false;
    const answer = currentAnswer(attempt);
    if (answer) {
      answer.visit_count = (answer.visit_count || 0) + 1;
      answer.first_seen_at = answer.first_seen_at || nowIso();
      answer.last_seen_at = nowIso();
      touchAnswer(attempt, answer.question_id);
    }
    touchAttempt(attempt);
    renderExam();
  }

  async function pauseAttempt() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || attempt.options?.enablePause === false) return;
    attempt.status = "paused";
    attempt.paused_at = nowIso();
    touchAttempt(attempt);
    if (!app.fixtureMode && app.client && app.session?.user?.id) {
      await app.client.from("pause_events").insert({ attempt_id: attempt.id, user_id: app.session.user.id, paused_at: attempt.paused_at });
    }
    await flushDirty({ immediate: true });
    renderExam();
  }

  async function resumePausedAttempt() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    attempt.status = "in_progress";
    attempt.paused_at = null;
    touchAttempt(attempt);
    if (!app.fixtureMode && app.client && app.session?.user?.id) {
      await app.client.from("pause_events").update({ resumed_at: nowIso() }).eq("attempt_id", attempt.id).is("resumed_at", null);
    }
    await flushDirty({ immediate: true });
    renderExam();
  }

  async function saveAndExit() {
    await flushDirty({ immediate: true });
    closeModal(false);
    setView({ name: "dashboard" });
  }

  async function submitCurrentAttempt(timedOut) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    await submitAttempt(attempt, timedOut);
  }

  async function submitAttempt(attempt, timedOut) {
    attempt.status = timedOut ? "timed_out" : "submitted";
    attempt.timed_out = timedOut;
    attempt.submitted_at = nowIso();
    attempt.score = scoreAttempt(attempt);
    attempt.percent = resultPercent(attempt);
    touchAttempt(attempt);
    Object.values(attempt.answers).forEach((answer) => touchAnswer(attempt, answer.question_id));
    await flushDirty({ immediate: true });
    app.modal = null;
    setView({ name: "results", attemptId: attempt.id });
  }

  function resumeActiveAttempt() {
    const attempt = app.attempts.find((candidate) => candidate.status === "in_progress" || candidate.status === "paused");
    if (!attempt) return;
    setView({ name: "exam", attemptId: attempt.id });
  }

  function openAttempt(attemptId) {
    const attempt = getAttempt(attemptId);
    if (!attempt) return;
    if (attempt.status === "submitted" || attempt.status === "timed_out") setView({ name: "results", attemptId });
    else setView({ name: "exam", attemptId });
  }

  function jumpToFirst(predicate) {
    const attempt = getAttempt(app.view.attemptId);
    const answer = Object.values(attempt.answers).sort(byPosition).find(predicate);
    closeModal(false);
    if (answer) {
      attempt.current_question_index = answer.position;
      renderExam();
    } else {
      showToast("No matching questions.");
    }
  }

  function moveReview(delta) {
    const attempt = getAttempt(app.view.attemptId);
    const filtered = filteredReviewAnswers(attempt, app.reviewFilter);
    const nextIndex = Math.min(Math.max(0, (app.view.index || 0) + delta), filtered.length - 1);
    setView({ ...app.view, index: nextIndex });
  }

  function setReviewFilter(filter) {
    app.reviewFilter = filter;
    setView({ ...app.view, index: 0 });
  }

  async function deleteAttempt(attemptId) {
    app.dialogTarget = attemptId;
    app.modal = "delete-attempt";
    render();
  }

  async function confirmDeleteAttempt() {
    const attemptId = app.dialogTarget;
    if (!attemptId) return;
    const { error } = await app.client.from("attempts").delete().eq("id", attemptId).eq("user_id", app.session.user.id);
    if (error) throw error;
    app.attempts = app.attempts.filter((attempt) => attempt.id !== attemptId);
    closeModal(false);
    render();
  }

  function touchAttempt(attempt) {
    app.dirtyAttempts.add(attempt.id);
    scheduleFlush();
  }

  function touchAnswer(attempt, questionId) {
    app.dirtyAnswers.add(`${attempt.id}|${questionId}`);
    scheduleFlush();
  }

  function scheduleFlush() {
    clearTimeout(app.syncTimer);
    app.syncTimer = setTimeout(() => flushDirty(), SYNC_INTERVAL_MS);
  }

  async function flushDirty(options = {}) {
    if (!app.client || app.flushing) return;
    if (!app.dirtyAttempts.size && !app.dirtyAnswers.size) return;
    app.flushing = true;
    clearTimeout(app.syncTimer);
    try {
      const attemptsToSync = Array.from(app.dirtyAttempts).map(getAttempt).filter(Boolean);
      const answerKeys = Array.from(app.dirtyAnswers);
      const answersToSync = answerKeys.map((key) => {
        const [attemptId, questionId] = key.split("|");
        const attempt = getAttempt(attemptId);
        return attempt?.answers?.[questionId];
      }).filter(Boolean);

      app.dirtyAttempts.clear();
      app.dirtyAnswers.clear();

      for (const attempt of attemptsToSync) {
        const payload = {
          status: attempt.status,
          elapsed_seconds: attempt.elapsed_seconds,
          current_question_index: attempt.current_question_index,
          score: attempt.score ?? null,
          percent: attempt.percent ?? null,
          timed_out: attempt.timed_out || false,
          submitted_at: attempt.submitted_at || null,
          paused_at: attempt.paused_at || null,
          updated_at: nowIso()
        };
        const { error } = await app.client.from("attempts").update(payload).eq("id", attempt.id).eq("user_id", app.session.user.id);
        if (error) throw error;
      }

      if (answersToSync.length) {
        const { error } = await app.client.from("attempt_answers").upsert(answersToSync.map(dbAnswerPayload), { onConflict: "attempt_id,question_id" });
        if (error) throw error;
      }
    } catch (error) {
      if (!options.immediate) showToast(`Sync issue: ${readableError(error)}`);
    } finally {
      app.flushing = false;
    }
  }

  function dbAnswerPayload(answer) {
    return {
      attempt_id: answer.attempt_id,
      user_id: answer.user_id,
      question_id: answer.question_id,
      position: answer.position,
      display_number: answer.display_number,
      original_item_number: answer.original_item_number,
      section: answer.section,
      subtopic: answer.subtopic,
      csc_skill: answer.csc_skill,
      prompt: answer.prompt,
      choices: answer.choices,
      correct_choice: answer.correct_choice,
      original_correct_choice: answer.original_correct_choice,
      explanation: answer.explanation,
      stimulus: answer.stimulus,
      difficulty: answer.difficulty,
      selected_choice: answer.selected_choice,
      skipped: answer.skipped,
      flagged: answer.flagged,
      time_spent_seconds: answer.time_spent_seconds,
      visit_count: answer.visit_count,
      first_seen_at: answer.first_seen_at || null,
      last_seen_at: answer.last_seen_at || null,
      first_answered_at: answer.first_answered_at || null,
      last_answered_at: answer.last_answered_at || null,
      answer_changes: answer.answer_changes,
      changed_wrong_to_correct: answer.changed_wrong_to_correct,
      changed_correct_to_wrong: answer.changed_correct_to_wrong,
      answer_history: answer.answer_history || [],
      updated_at: nowIso()
    };
  }

  function getAttempt(attemptId) {
    return app.attempts.find((attempt) => attempt.id === attemptId);
  }

  function currentAnswer(attempt) {
    if (!attempt?.answers) return null;
    return Object.values(attempt.answers).find((answer) => answer.position === attempt.current_question_index);
  }

  function linkedStimulusAnswers(attempt, answer) {
    const stimulusId = answer.stimulus?.id;
    const items = stimulusId
      ? Object.values(attempt.answers).filter((candidate) => candidate.stimulus?.id === stimulusId).sort(byPosition)
      : [answer];
    return {
      label: items.length > 1 ? `Chart for Items ${items[0].display_number}-${items[items.length - 1].display_number}` : "Reference",
      items
    };
  }

  function filteredReviewAnswers(attempt, filter) {
    if (!attempt?.answers) return [];
    const answers = Object.values(attempt.answers).sort(byPosition);
    if (filter === "wrong") return answers.filter((answer) => answer.selected_choice !== answer.correct_choice);
    if (filter === "correct") return answers.filter((answer) => answer.selected_choice === answer.correct_choice);
    if (filter === "flagged") return answers.filter((answer) => answer.flagged);
    return answers;
  }

  function reviewNavigatorWindow(items, currentIndex) {
    if (!items.length) return { items: [], label: "No items" };
    const pageSize = 40;
    const pageStart = Math.max(0, Math.min(items.length - pageSize, Math.floor(currentIndex / pageSize) * pageSize));
    const visible = items.slice(pageStart, pageStart + pageSize).map((item, offset) => ({ item, itemIndex: pageStart + offset }));
    const first = visible[0]?.item.display_number;
    const last = visible[visible.length - 1]?.item.display_number;
    return {
      items: visible,
      label: items.length > pageSize ? `Showing items ${first}-${last} of ${items.length}` : `${items.length} item${items.length === 1 ? "" : "s"}`
    };
  }

  function wrongAnswers(attempt) {
    return Object.values(attempt.answers).filter((answer) => answer.selected_choice !== answer.correct_choice);
  }

  function completedAttempts() {
    return app.attempts.filter((attempt) => attempt.status === "submitted" || attempt.status === "timed_out");
  }

  function scoreAttempt(attempt) {
    return Object.values(attempt.answers).reduce((sum, answer) => sum + (answer.selected_choice === answer.correct_choice ? 1 : 0), 0);
  }

  function resultPercent(attempt) {
    return attempt.total_questions ? (scoreAttempt(attempt) / attempt.total_questions) * 100 : 0;
  }

  function answeredCount(attempt) {
    return Object.values(attempt.answers).filter((answer) => answer.selected_choice).length;
  }

  function unansweredCount(attempt) {
    return attempt.total_questions - answeredCount(attempt);
  }

  function skippedCount(attempt) {
    return Object.values(attempt.answers).filter((answer) => answer.skipped && !answer.selected_choice).length;
  }

  function flaggedCount(attempt) {
    return Object.values(attempt.answers).filter((answer) => answer.flagged).length;
  }

  function visitedCount(attempt) {
    return Object.values(attempt.answers).filter((answer) => answer.visit_count > 0).length;
  }

  function wrongAnswerCount(attempts) {
    return attempts.reduce((sum, attempt) => sum + wrongAnswers(attempt).length, 0);
  }

  function timeRemaining(attempt) {
    if (!attempt.total_time_seconds) return 0;
    return Math.max(0, attempt.total_time_seconds - attempt.elapsed_seconds);
  }

  function sectionStats(attempt) {
    const stats = new Map();
    for (const answer of Object.values(attempt.answers)) {
      const row = stats.get(answer.section) || { section: answer.section, correct: 0, total: 0, time: 0 };
      row.total += 1;
      row.time += answer.time_spent_seconds || 0;
      if (answer.selected_choice === answer.correct_choice) row.correct += 1;
      stats.set(answer.section, row);
    }
    return Array.from(stats.values()).map((row) => ({
      ...row,
      percent: row.total ? (row.correct / row.total) * 100 : 0,
      averageTime: row.total ? row.time / row.total : 0
    }));
  }

  function performanceInsights(attempt) {
    const answers = Object.values(attempt.answers);
    const timed = answers.filter((answer) => answer.time_spent_seconds > 0);
    const sortedByTime = timed.slice().sort((a, b) => a.time_spent_seconds - b.time_spent_seconds);
    const stats = sectionStats(attempt);
    const byAccuracy = stats.slice().sort((a, b) => a.percent - b.percent);
    const bySpeed = stats.slice().sort((a, b) => a.averageTime - b.averageTime);
    const weakest = byAccuracy[0];
    return {
      averageTime: timed.length ? timed.reduce((sum, answer) => sum + answer.time_spent_seconds, 0) / timed.length : 0,
      fastest: sortedByTime[0],
      slowest: sortedByTime[sortedByTime.length - 1],
      fastestSection: bySpeed[0],
      slowestSection: bySpeed[bySpeed.length - 1],
      weakest,
      strongest: byAccuracy[byAccuracy.length - 1],
      changed: answers.reduce((sum, answer) => sum + (answer.answer_changes || 0), 0),
      wrongToCorrect: answers.reduce((sum, answer) => sum + (answer.changed_wrong_to_correct || 0), 0),
      correctToWrong: answers.reduce((sum, answer) => sum + (answer.changed_correct_to_wrong || 0), 0),
      recommendation: weakest ? `Practice ${sectionLabel(weakest.section)}` : "Take another full mock"
    };
  }

  function categoryPerformance(attempts) {
    const output = {};
    for (const section of SECTION_GROUPS.map((group) => group.section)) {
      const related = attempts.flatMap((attempt) => Object.values(attempt.answers).filter((answer) => answer.section === section));
      if (!related.length) continue;
      const correct = related.filter((answer) => answer.selected_choice === answer.correct_choice).length;
      const lastAttempt = attempts.find((attempt) => Object.values(attempt.answers).some((answer) => answer.section === section));
      output[section] = {
        percent: (correct / related.length) * 100,
        last: lastAttempt?.submitted_at || lastAttempt?.started_at
      };
    }
    return output;
  }

  function averagePercent(attempts) {
    if (!attempts.length) return null;
    return attempts.reduce((sum, attempt) => sum + resultPercent(attempt), 0) / attempts.length;
  }

  function activeDays(attempts) {
    return new Set(attempts.map((attempt) => new Date(attempt.started_at).toDateString())).size;
  }

  function filteredAttemptsByTab(attempts, tab) {
    if (tab === "full") return attempts.filter((attempt) => attempt.mode === "full");
    if (tab === "practice" || tab === "quick") return attempts.filter((attempt) => attempt.mode === "practice");
    if (tab === "review") return attempts.filter((attempt) => flaggedCount(attempt) || wrongAnswers(attempt).length);
    return attempts;
  }

  function statusText(answer) {
    if (answer.selected_choice) return "Answered";
    if (answer.skipped) return "Skipped";
    return "Unanswered";
  }

  function answerStatus(answer) {
    if (answer.selected_choice) return "answered";
    if (answer.skipped) return "skipped";
    return "blank";
  }

  function statusLabel(status) {
    return String(status || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function examTitle(attempt) {
    return attempt.title || examVersions.find((version) => version.id === attempt.exam_version_id)?.title || "Professional Mock Exam";
  }

  function sectionLabel(section) {
    return SECTION_GROUPS.find((group) => group.section === section)?.label || section;
  }

  function toneForSection(section) {
    return SECTION_GROUPS.find((group) => group.section === section)?.tone || "";
  }

  function filterLabel(filter) {
    return { all: "All", wrong: "Wrong", correct: "Correct", flagged: "Flagged" }[filter] || filter;
  }

  function openModal(name) {
    app.modal = name;
    render();
  }

  function closeModal(rerender = true) {
    app.modal = null;
    app.dialogError = "";
    if (rerender) render();
  }

  function showToast(message) {
    app.toast = message;
    render();
    setTimeout(() => {
      if (app.toast === message) {
        app.toast = "";
        render();
      }
    }, 3600);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function formatDate(value) {
    if (!value) return "--";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  }

  function initials(name) {
    return String(name || "Reviewer").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "R";
  }

  function byPosition(a, b) {
    return a.position - b.position;
  }

  function seededShuffle(items, seed) {
    const output = items.slice();
    let state = seed >>> 0;
    for (let index = output.length - 1; index > 0; index -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const swap = state % (index + 1);
      [output[index], output[swap]] = [output[swap], output[index]];
    }
    return output;
  }

  function hashCode(value) {
    return String(value).split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 2166136261);
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function readableError(error) {
    return error?.message || String(error || "Something went wrong.");
  }

  function localIcon(name, className = "") {
    return `<span class="local-icon ${escapeAttr(className)}" style="--local-icon:url('assets/icons/${escapeAttr(name)}.svg')" aria-hidden="true"></span>`;
  }

  function icon(name) {
    const paths = {
      spark: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z",
      arrow: "M5 12h14m-6-6l6 6-6 6",
      plus: "M12 5v14M5 12h14",
      shield: "M12 3l7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6l7-3z",
      switch: "M7 7h10l-3-3m3 13H7l3 3",
      edit: "M4 20h4L18 10l-4-4L4 16v4z",
      play: "M8 5v14l11-7-11-7z",
      review: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
      home: "M3 11l9-8 9 8v9h-6v-6H9v6H3v-9z",
      back: "M19 12H5m6-6l-6 6 6 6",
      save: "M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-7h8v7",
      pause: "M7 5h4v14H7zM13 5h4v14h-4z",
      submit: "M4 12l6 6L20 6",
      clear: "M6 6l12 12M18 6L6 18",
      flag: "M6 21V4h11l-2 5 2 5H6",
      skip: "M5 5l8 7-8 7V5zm9 0h3v14h-3V5z",
      x: "M6 6l12 12M18 6L6 18",
      key: "M14 10a4 4 0 1 0-3.5 4l-1.5 1.5H7v2H5v2H3v-3.5L8.5 10.5A4 4 0 0 0 14 10z",
      lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z",
      eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      bookmark: "M7 4h10v17l-5-3-5 3V4z",
      chev: "M9 6l6 6-6 6",
      logout: "M10 17l5-5-5-5M15 12H3M21 4v16h-8",
      bell: "M18 16H6l2-3V9a4 4 0 0 1 8 0v4l2 3zM10 19h4",
      grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
      clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5v5l4 2",
      stats: "M5 19V9M12 19V5M19 19v-7",
      check: "M5 12l4 4L19 6",
      delete: "M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6",
      filter: "M4 5h16l-6 7v6l-4 2v-8L4 5z",
      info: "M12 8h.01M11 12h1v5h1",
      more: "M5 12h.01M12 12h.01M19 12h.01",
      open: "M14 4h6v6M20 4l-9 9M5 5h6M5 5v14h14v-6",
      refresh: "M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6",
      building: "M4 21V5h10v16M14 9h6v12M7 8h2M7 12h2M7 16h2M16 12h2M16 16h2",
      user: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      mail: "M4 6h16v12H4zM4 7l8 6 8-6",
      trophy: "M8 4h8v3a4 4 0 0 1-8 0V4zM6 5H4v2a4 4 0 0 0 4 4M18 5h2v2a4 4 0 0 1-4 4M12 11v5M9 21h6M8 16h8",
      verbal: "M4 5h16v10H8l-4 4z",
      numerical: "M5 19h14M7 15v4M12 9v10M17 4v15",
      analytical: "M12 3l8 5-8 5-8-5 8-5zm-8 10l8 5 8-5",
      general: "M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z"
    };
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.spark}" /></svg>`;
  }

  boot();
})();
