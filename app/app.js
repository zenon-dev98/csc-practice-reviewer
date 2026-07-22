(function () {
  "use strict";

  const TOTAL_TIME_SECONDS = 3 * 60 * 60 + 10 * 60;
  const COCKPIT_WIDTH = 1672;
  const COCKPIT_HEIGHT = 942;
  const PASSING_PERCENT = 80;
  const SYNC_INTERVAL_MS = 3500;
  const DEFAULT_PRACTICE_COUNT = 20;
  const PAPER_POLL_INTERVAL_MS = 7000;
  const AUDIO_PREFS_KEY = "csc-reviewer-audio";
  const ATTEMPT_RECOVERY_KEY_PREFIX = "csc-reviewer-attempt-recovery";
  const QA_TIMING_ENABLED = new URLSearchParams(location.search).get("qaTiming") === "1";
  const AVATAR_OPTIONS = [
    "cat", "dog", "cow", "fox", "panda",
    "rabbit", "bear", "tiger", "lion", "koala",
    "frog", "owl", "penguin", "duck", "pig",
    "monkey", "deer", "sheep", "hamster", "turtle"
  ];
  const AVATAR_SPRITE_COLUMNS = [75.1, 80.6, 86.2, 91.7, 97.1];
  const AVATAR_SPRITE_ROWS = [30.9, 40.7, 50.5, 60.4];
  const MUSIC_LIBRARY = {
    cafe: [
      { title: "Catchy Swing", artist: "Doge", src: "assets/audio/music/cafe-catchy-swing.ogg" },
      { title: "Fusion Break", artist: "Spring Spring", src: "assets/audio/music/cafe-fusion-jazz.ogg" },
      { title: "Corner Table", artist: "Spring Spring", src: "assets/audio/music/cafe-corner-table.ogg" },
      { title: "Piano Sway", artist: "Tozan", src: "assets/audio/music/cafe-piano-sway.ogg" },
      { title: "Jazz and Brass", artist: "Emma MA", src: "assets/audio/music/cafe-jazz-brass.wav" },
      { title: "Quiet Espresso", artist: "Ruskerdax", src: "assets/audio/music/cafe-quiet-espresso.mp3" }
    ],
    classical: [
      { title: "Once Upon a Time", artist: "TAD", src: "assets/audio/music/classical-once-upon-a-time.mp3" },
      { title: "Fantasy Orchestral", artist: "Joth", src: "assets/audio/music/classical-fantasy-orchestral.mp3" },
      { title: "Calm Theme", artist: "Pebonius", src: "assets/audio/music/classical-calm-theme.ogg" },
      { title: "Orchestring", artist: "Tozan", src: "assets/audio/music/classical-orchestring.ogg" },
      { title: "Forget Me Not", artist: "Kistol", src: "assets/audio/music/classical-forget-me-not.ogg" },
      { title: "Emotional Piano", artist: "Centurion of War", src: "assets/audio/music/classical-emotional-piano.ogg" }
    ]
  };
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
    "paper-setup",
    "paper-exam",
    "paper-timeout",
    "paper-scan",
    "paper-review",
    "paper-results",
    "exam",
    "exam-collapsed",
    "graph",
    "passage",
    "data-table",
    "metric-bars",
    "line-chart",
    "series-line",
    "series-bars",
    "long-prompt",
    "long-choices",
    "pause",
    "submit",
    "timeout",
    "chart-modal",
    "passage-modal",
    "table-modal",
    "line-modal",
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
    practiceCategory: "Verbal Ability",
    paperMode: false,
    paperPhase: "answering"
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
    modalReturn: null,
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
    openNavGroups: new Set(),
    reviewFilter: "all",
    recentTab: "all",
    practiceReviewTab: "practice",
    practiceCategoryDraft: null,
    audioMenuOpen: false,
    audio: loadAudioPreferences(),
    audioElements: null,
    audioContext: null,
    audioUserGesture: false,
    audioHistory: [],
    audioShuffleBag: [],
    accountAvatarDraft: null,
    examNavScrollTop: 0,
    examNavDrag: null,
    paperScans: [null, null],
    paperDetections: [],
    paperBlankConfirmed: false,
    paperDrag: null,
    paperPollId: null,
    paperSyncError: "",
    visibilityStartedAt: document.visibilityState === "visible" ? performance.now() : null,
    questionVersion: "1",
    fixtureMode: false,
    fixtureState: ""
  };

  const root = document.getElementById("app");
  root.dataset.inputMode = "pointer";

  function boot() {
    syncCockpitScale();
    window.addEventListener("resize", syncCockpitScale, { passive: true });
    window.addEventListener("beforeunload", () => {
      persistCurrentAttemptRecovery();
      flushDirty({ immediate: true });
    });
    window.addEventListener("pagehide", persistCurrentAttemptRecovery);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        recordVisibilityEvent("hidden");
        persistCurrentAttemptRecovery();
        flushDirty({ immediate: true });
      } else {
        recordVisibilityEvent("visible");
        syncBackgroundMusic();
      }
    });
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("toggle", handleDetailsToggle, true);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("pointerdown", handlePointerDown, { passive: false });
    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerUp, { passive: true });
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
            setView(requestedView() || { name: "dashboard" });
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
        setView(requestedView() || { name: "dashboard" });
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

  function requestedView() {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    if (view === "review") {
      const attemptId = params.get("attempt");
      return getAttempt(attemptId) ? { name: "review", attemptId, index: 0 } : null;
    }
    if (view === "practice") {
      const category = params.get("category");
      app.practiceCategoryDraft = SECTION_GROUPS.some((group) => group.section === category) ? category : null;
      app.practiceReviewTab = "practice";
      return { name: "practice" };
    }
    if (view === "setup") {
      const versionId = params.get("version");
      if (examVersions.some((version) => version.id === versionId)) {
        app.draft = { ...(app.draft || {}), options: { ...DEFAULT_OPTIONS, ...(app.draft?.options || {}), versionId } };
      }
      return { name: "setup" };
    }
    return null;
  }

  function routeHref(view, values = {}) {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("view", view);
    Object.entries(values).forEach(([key, value]) => {
      if (value != null && value !== "") url.searchParams.set(key, value);
    });
    return url.href;
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
    app.openNavGroups.clear();
    app.paperScans = [null, null];
    app.paperDetections = [];
    app.paperBlankConfirmed = false;
    app.paperSyncError = "";

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
    if (fixtureState === "setup" || fixtureState === "paper-setup") {
      if (fixtureState === "paper-setup") app.draft.options = { ...app.draft.options, paperMode: true, paperPhase: "answering" };
      return setView({ name: "setup" });
    }
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
      app.modal = fixtureState === "password-expanded" ? "password" : "profile";
      if (fixtureState === "delete-account") app.modal = "delete-account";
      return setView({ name: "dashboard" });
    }
    const requestedFixtureQuestion = new URLSearchParams(location.search).get("question");
    if (fixtureState === "exam" && active && requestedFixtureQuestion && questionsById.has(requestedFixtureQuestion)) {
      active.current_question_index = applyProductionQuestionFixture(active, requestedFixtureQuestion);
      return setView({ name: "exam", attemptId: active.id });
    }
    const productionFixture = {
      passage: "v07-q069",
      "passage-modal": "v07-q069",
      "data-table": "v01-q155",
      "table-modal": "v01-q155",
      "metric-bars": "v01-q159",
      "line-chart": "v06-q163",
      "line-modal": "v06-q163",
      "series-line": "v02-q163",
      "series-bars": "v04-q167",
      "long-prompt": "v11-q068",
      "long-choices": "v18-q154"
    }[fixtureState];
    if (productionFixture) {
      active.current_question_index = applyProductionQuestionFixture(active, productionFixture);
      if (fixtureState.endsWith("-modal")) app.modal = "chart";
      return setView({ name: "exam", attemptId: active.id });
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
    if (fixtureState === "paper-timeout") {
      active.options = { ...active.options, paperMode: true, paperPhase: "answering" };
      active.status = "in_progress";
      active.elapsed_seconds = active.total_time_seconds - 1;
      return setView({ name: "exam", attemptId: active.id });
    }
    if (["paper-exam", "paper-scan", "paper-review"].includes(fixtureState)) {
      active.options = { ...active.options, paperMode: true, paperPhase: fixtureState === "paper-exam" ? "answering" : fixtureState === "paper-review" ? "review" : "scanning" };
      active.status = fixtureState === "paper-exam" ? "in_progress" : "paused";
      if (fixtureState === "paper-review") seedPaperReviewFixture();
      return setView({ name: "exam", attemptId: active.id });
    }
    if (fixtureState === "paper-results") {
      submitted.options = { ...submitted.options, paperMode: true, paperPhase: "submitted" };
      return setView({ name: "results", attemptId: submitted.id });
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
    app.profile.nickname = app.profile.nickname || user.user_metadata?.nickname || "";
    app.profile.avatar_preset = Number(app.profile.avatar_preset || user.user_metadata?.avatar_preset || 0);
    app.attempts = (attemptsResult.data || []).map(normalizeAttempt);
    const recoveredAttempts = app.attempts.filter(applyAttemptRecovery);
    recoveredAttempts.forEach((attempt) => {
      app.dirtyAttempts.add(attempt.id);
      Object.keys(attempt.answers).forEach((questionId) => app.dirtyAnswers.add(`${attempt.id}|${questionId}`));
    });
    if (recoveredAttempts.length) {
      app.toast = `Recovered unsynced progress for ${recoveredAttempts.length === 1 ? "your active exam" : `${recoveredAttempts.length} active exams`} from this device.`;
      scheduleFlush();
    }
    app.attempts.filter((attempt) => attempt._clockMigrated).forEach((attempt) => {
      delete attempt._clockMigrated;
      touchAttempt(attempt);
    });
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
      nickname: "John",
      email: "john.smith@email.com",
      avatar_preset: 1,
      level: "Professional",
      notes: "Fixture reviewer profile.",
      birth_date: "",
      last_active_at: "2026-07-04T09:00:00.000Z"
    };
  }

  function fixtureAttempts() {
    const active = buildFixtureFullAttempt("fixture-active", { status: "in_progress", currentIndex: 42, completed: false });
    const latest = buildFixtureFullAttempt("fixture-submitted", { status: "submitted", currentIndex: 42, completed: true });
    const earlier = buildFixtureFullAttempt("fixture-submitted-2", { status: "submitted", currentIndex: 169, completed: true });
    const oldest = buildFixtureFullAttempt("fixture-submitted-3", { status: "submitted", currentIndex: 169, completed: true });
    earlier.title = "Mock Exam 06";
    earlier.started_at = "2026-06-28T06:00:00.000Z";
    earlier.submitted_at = "2026-06-28T08:46:00.000Z";
    oldest.title = "Mock Exam 05";
    oldest.started_at = "2026-06-21T06:00:00.000Z";
    oldest.submitted_at = "2026-06-21T08:38:00.000Z";
    Object.values(earlier.answers).forEach((answer, index) => {
      if (index % 11 === 0) answer.selected_choice = answer.correct_choice;
    });
    Object.values(oldest.answers).forEach((answer, index) => {
      if (index % 7 === 0) answer.selected_choice = answer.correct_choice;
    });
    earlier.score = scoreAttempt(earlier);
    earlier.percent = resultPercent(earlier);
    oldest.score = scoreAttempt(oldest);
    oldest.percent = resultPercent(oldest);
    return [active, latest, earlier, oldest, buildFixturePracticeAttempt("fixture-practice")];
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
      title: "Mock Exam",
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
    const kept = Object.values(attempt.answers).filter((answer) => answer.display_number > 20 && answer.display_number <= 40);
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
      stimulus: fixtureStimulus(displayNumber),
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
    return SECTION_GROUPS.find((group) => displayNumber >= group.start && displayNumber <= group.end) || SECTION_GROUPS[0];
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

  function fixtureStimulus(displayNumber) {
    if (displayNumber >= 81 && displayNumber <= 85) return fixtureChartStimulus();
    const readingSets = [
      { start: 47, end: 50, id: "fixture-reading-a", title: "Public information notice" },
      { start: 73, end: 76, id: "fixture-reading-b", title: "Community preparedness passage" },
      { start: 77, end: 80, id: "fixture-reading-c", title: "Workplace communication passage" }
    ];
    const set = readingSets.find((entry) => displayNumber >= entry.start && displayNumber <= entry.end);
    if (!set) return null;
    return {
      id: set.id,
      kind: "reading",
      label: `Questions ${set.start}-${set.end} refer to the passage below.`,
      title: set.title,
      description: "Read the shared passage carefully before answering the connected questions.",
      alt: "A shared reading passage used by the connected verbal questions."
    };
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

  function applyProductionQuestionFixture(attempt, questionId) {
    const source = questionsById.get(questionId);
    if (!source) return attempt.current_question_index;
    const related = source.stimulus?.id
      ? questionBank.filter((question) => question.version === source.version && question.stimulus?.id === source.stimulus.id)
      : [source];
    for (const question of related) {
      const target = Object.values(attempt.answers).find((answer) => answer.display_number === question.itemNumber);
      if (!target) continue;
      Object.assign(target, {
        section: question.section,
        subtopic: question.subtopic,
        csc_skill: question.cscSkill,
        prompt: question.prompt,
        choices: question.choices.map((choice) => ({ ...choice })),
        correct_choice: question.correctChoice,
        original_correct_choice: question.correctChoice,
        explanation: question.explanation,
        stimulus: question.stimulus || null,
        difficulty: question.difficulty,
        selected_choice: null,
        skipped: false
      });
    }
    return source.itemNumber - 1;
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
    const attempt = {
      ...row,
      question_order: toArray(row.question_order),
      options: row.options || {},
      answers
    };
    if (attempt.total_time_seconds && !attempt.options?.timerClock) {
      ensureAttemptClock(attempt);
      attempt._clockMigrated = true;
    }
    return attempt;
  }

  function attemptRecoveryKey(attemptId) {
    const userId = app.session?.user?.id;
    return userId ? `${ATTEMPT_RECOVERY_KEY_PREFIX}:${userId}:${attemptId}` : "";
  }

  function persistCurrentAttemptRecovery() {
    if (app.view.name !== "exam") return;
    persistAttemptRecovery(getAttempt(app.view.attemptId));
  }

  function persistAttemptRecovery(attempt) {
    const key = attemptRecoveryKey(attempt?.id);
    if (!key || app.fixtureMode || !["in_progress", "paused"].includes(attempt.status)) return;
    const answers = {};
    Object.values(attempt.answers || {}).forEach((answer) => {
      answers[answer.question_id] = {
        selected_choice: answer.selected_choice || null,
        skipped: Boolean(answer.skipped),
        flagged: Boolean(answer.flagged),
        time_spent_seconds: Number(answer.time_spent_seconds || 0),
        visit_count: Number(answer.visit_count || 0),
        first_seen_at: answer.first_seen_at || null,
        last_seen_at: answer.last_seen_at || null,
        first_answered_at: answer.first_answered_at || null,
        last_answered_at: answer.last_answered_at || null,
        answer_changes: Number(answer.answer_changes || 0),
        changed_wrong_to_correct: Number(answer.changed_wrong_to_correct || 0),
        changed_correct_to_wrong: Number(answer.changed_correct_to_wrong || 0),
        answer_history: toArray(answer.answer_history)
      };
    });
    try {
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        attemptId: attempt.id,
        savedAt: nowIso(),
        current_question_index: attempt.current_question_index,
        answers
      }));
    } catch {
      // Cloud autosave remains authoritative when browser storage is unavailable.
    }
  }

  function applyAttemptRecovery(attempt) {
    const key = attemptRecoveryKey(attempt?.id);
    if (!key || !["in_progress", "paused"].includes(attempt.status)) return false;
    try {
      const recovery = JSON.parse(localStorage.getItem(key) || "null");
      if (!recovery || recovery.version !== 1 || recovery.attemptId !== attempt.id) return false;
      const recoveryTime = Date.parse(recovery.savedAt || "");
      const cloudTime = Date.parse(attempt.updated_at || "");
      if (!Number.isFinite(recoveryTime) || (Number.isFinite(cloudTime) && recoveryTime <= cloudTime)) return false;
      attempt.current_question_index = Math.min(
        Math.max(0, Number(recovery.current_question_index) || 0),
        Math.max(0, attempt.total_questions - 1)
      );
      Object.entries(recovery.answers || {}).forEach(([questionId, saved]) => {
        const answer = attempt.answers[questionId];
        if (!answer || !saved) return;
        Object.assign(answer, saved, { answer_history: toArray(saved.answer_history) });
      });
      return true;
    } catch {
      return false;
    }
  }

  function clearAttemptRecovery(attemptId) {
    const key = attemptRecoveryKey(attemptId);
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Recovery cleanup is best-effort only.
    }
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function setView(view) {
    const previousView = app.view.name;
    if ((view.name === "create" || view.name === "signin") && app.view.name !== view.name) app.toast = "";
    app.view = view;
    app.audioMenuOpen = false;
    render();
    syncBackgroundMusic();
    if (view.name === "results" && previousView !== "results") playSound("confirmation");
  }

  function render() {
    clearInterval(app.timerId);
    app.timerId = null;
    clearInterval(app.paperPollId);
    app.paperPollId = null;
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
          <span class="boot-status">Connecting securely</span>
          <div class="boot-sync-modules" aria-label="Reviewer synchronization status">
            <span>${localIcon("circle-check")}<b>Account</b><small>Authenticating</small></span>
            <span>${localIcon("notebook-tabs")}<b>Question bank</b><small>Loading locally</small></span>
            <span>${localIcon("cloud-check")}<b>Progress</b><small>Checking cloud state</small></span>
          </div>
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
      </section>
    `, "system-frame");
  }

  function renderCreateAccount() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas access-console create-state">
        <div class="auth-copy">
          <span class="soft-pill">${icon("shield")} Private reviewer access</span>
          <h1>Start strong.<br /><em>Track every run.</em></h1>
          <p>Private Civil Service Professional practice with saved progress, timing, and review history.</p>
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
            <label class="field-label">Password<div class="field-with-icon has-toggle">${icon("key")}<input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="New password" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
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
          <h1>Welcome back.<br /><em>Keep moving.</em></h1>
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
    const latestCompleted = completed.slice().sort((a, b) => new Date(b.submitted_at || b.started_at) - new Date(a.submitted_at || a.started_at))[0];
    const hubSections = [
      { section: "General Information", label: "General", tone: "general", icon: "book-open-text" },
      { section: "Verbal Ability", label: "Verbal", tone: "verbal", icon: "message-square" },
      { section: "Numerical Ability", label: "Numerical", tone: "numerical", icon: "calculator" },
      { section: "Analytical Ability", label: "Analytical", tone: "analytical", icon: "brain-circuit" }
    ];
    const activeAnswers = activeAttempt ? Object.values(activeAttempt.answers) : [];
    const activeAnswered = activeAttempt ? answeredCount(activeAttempt) : 0;
    const activeTotal = activeAttempt?.total_questions || 170;
    const completion = activeTotal ? Math.round((activeAnswered / activeTotal) * 100) : 0;
    const sectionRows = hubSections.map((entry) => {
      const related = activeAnswers.filter((answer) => answer.section === entry.section);
      const answered = related.filter((answer) => answer.selected_choice).length;
      const group = SECTION_GROUPS.find((candidate) => candidate.section === entry.section);
      const total = related.length || (group ? group.end - group.start + 1 : 0);
      return { ...entry, answered, total, progress: total ? Math.round((answered / total) * 100) : 0 };
    });
    const firstName = String(displayName(app.profile) || "Reviewer").trim().split(/\s+/)[0] || "Reviewer";
    const activeVersion = activeAttempt ? examVersions.find((version) => version.id === activeAttempt.exam_version_id) : null;
    const activeVersionNumber = app.fixtureMode ? 7 : activeVersion?.number;
    const runTitle = activeAttempt?.mode === "practice"
      ? "Practice"
      : activeAttempt && activeVersionNumber
        ? `Mock Exam ${String(activeVersionNumber).padStart(2, "0")}`
        : activeAttempt ? examTitle(activeAttempt) : "Mock Exam";
    const runAction = activeAttempt ? "resume-exam" : "open-setup";
    const runActionLabel = activeAttempt ? "Resume Exam" : "Start New Mock Exam";
    const runTime = activeAttempt
      ? activeAttempt.total_time_seconds ? formatDuration(timeRemaining(activeAttempt)) : "Untimed"
      : formatDuration(TOTAL_TIME_SECONDS);
    const runCheckpoint = activeAttempt ? `Item ${activeAttempt.current_question_index + 1}` : "Ready to begin";
    root.innerHTML = authedShell(`
      <section class="study-hub simplified-hub" data-motion-purpose="page-enter">
        <div class="hub-grid-pattern" aria-hidden="true"></div>
        <div class="hub-stage">
          <header class="hub-hero">
            <h1><span>Lock in.</span> <em>Keep moving.</em></h1>
            <p>Welcome back, ${escapeHtml(firstName)}.</p>
          </header>

          <div class="hub-primary-grid">
            <section class="hub-panel hub-run-panel">
              <div class="hub-panel-title hub-run-title">
                ${localIcon("target")}
                <div><span>${activeAttempt ? "Active Mock Exam" : "Ready for a Mock Exam"}</span><h2>${escapeHtml(runTitle)}</h2></div>
                <span class="hub-scan-lines" aria-hidden="true"></span>
              </div>
              <div class="hub-run-body">
                <div class="hub-ring" style="--hub-completion:${completion * 3.6}deg" aria-label="${activeAnswered} of ${activeTotal} questions answered" tabindex="0">
                  <span class="hub-ring-progress" aria-hidden="true"></span>
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
                  </div>
                  <div class="hub-checkpoints">
                    <div class="hub-section-context">
                      <strong>Exam Sections</strong>
                      <small>Current attempt completion</small>
                    </div>
                    ${sectionRows.map((entry) => `
                      <div class="hub-checkpoint ${entry.tone}">
                        <span class="hub-checkpoint-icon">${localIcon(entry.icon)}</span>
                        ${entry.answered ? `<i class="hub-checkpoint-check">${localIcon("circle-check")}</i>` : ""}
                        <strong>${escapeHtml(entry.label)}</strong>
                        <small>${entry.total ? `${entry.answered} / ${entry.total}` : "No items"}</small>
                      </div>
                    `).join("")}
                  </div>
                  <div class="hub-run-status"><span>Current checkpoint <strong>${escapeHtml(runCheckpoint)}</strong></span></div>
                  <button class="hub-resume-button" data-action="${runAction}" type="button">
                    <i aria-hidden="true"></i>
                    <span>${escapeHtml(runActionLabel)}</span>
                    <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
                  </button>
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
                  <p><strong>Best Mock Score</strong><small>${fullMocks.length ? "Across completed mock exams" : "Complete a mock exam"}</small></p>
                  <b>${fullMocks.length ? `${Math.round(bestFull)}%` : "--"}</b>
                </div>
                <div class="hub-record blue">
                  <span>${localIcon("history")}</span>
                  <p><strong>Latest Mock Score</strong><small>${latestCompleted ? escapeHtml(examTitle(latestCompleted)) : "No completed attempt"}</small></p>
                  <b>${latestCompleted ? `${Math.round(resultPercent(latestCompleted))}%` : "--"}</b>
                </div>
                <div class="hub-record green">
                  <span>${localIcon("circle-check")}</span>
                  <p><strong>Completed Sessions</strong><small>Mock exams and practice</small></p>
                  <b>${completed.length}</b>
                </div>
              </div>
              <button class="hub-record-foot" data-action="recent-page" type="button">${localIcon("history")} View Progress ${localIcon("chevron-right")}</button>
            </section>
          </div>

          <section class="hub-action-dock" aria-label="Choose your next mode">
            <button class="hub-mode full" data-action="open-setup" type="button">
              ${localIcon("target")}
              <span><strong>Start New Mock Exam</strong><small>170 questions / 3 hours 10 minutes</small></span>
              <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
            </button>
            <button class="hub-mode practice" data-action="practice-page" type="button">
              ${localIcon("brain-circuit")}
              <span><strong>Practice</strong><small>Choose a section, length, and difficulty</small></span>
              <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
            </button>
            <button class="hub-mode mistakes" data-action="mistakes-page" type="button">
              ${localIcon("notebook-tabs")}
              <span><strong>Review</strong><small>${totalMistakes} mistakes / ${totalFlagged} flagged</small></span>
              <span class="hub-chevron-stack" aria-hidden="true">${localIcon("chevron-right")}${localIcon("chevron-right")}</span>
            </button>
          </section>
        </div>
      </section>
    `, "dashboard");
  }

  function renderSetup() {
    const draftOptions = { ...DEFAULT_OPTIONS, ...(app.draft?.options || {}) };
    const savedVersionId = draftOptions.versionId || examVersions[0]?.id;
    const paperMode = Boolean(draftOptions.paperMode);
    root.innerHTML = authedShell(`
      <section class="setup-page" data-motion-purpose="page-enter">
        <div class="page-title-row">
          <div>
            <h1>Mock Exam Setup</h1>
            <p>Choose a version and begin a 170-item timed exam.</p>
          </div>
        </div>

        <div class="setup-grid v5-setup-grid">
          <section class="card setup-main v5-panel">
            <div class="setup-facts instrument-grid v5-instrument-deck" aria-label="Exam format">
              ${setupFact("clipboard-list", "cyan", "Questions", "170")}
              ${setupFact("timer", "cyan", "Time Limit", "3h 10m")}
              ${setupFact("move", "cyan", "Movement", "Free")}
              ${setupFact("circle-pause", "cyan", "Resume", "Pause &")}
            </div>
            <div class="section-list allocation-console v5-allocation-console">
              <div class="technical-title"><h2>Exam Sections</h2><span aria-hidden="true"></span></div>
              <div class="allocation-grid">
              ${SECTION_GROUPS.map((group) => `
                <div class="section-row allocation-card ${group.tone}">
                  <span class="section-hud-icon">${localIcon(sectionIconName(group.section))}</span>
                  <div class="allocation-copy">
                    <strong>${escapeHtml(group.section)}</strong>
                    <span>Items ${group.range}</span>
                  </div>
                  <b>${group.end - group.start + 1}</b>
                </div>
              `).join("")}
              </div>
            </div>
          </section>

           <form class="card setup-options run-configuration v5-panel" data-form="setup">
             <div class="technical-title"><h2>Exam Options</h2><span aria-hidden="true"></span></div>
             <fieldset class="answer-mode-selector">
               <legend>Answer Mode</legend>
               <label class="answer-mode-card ${paperMode ? "" : "active"}"><input type="radio" name="answerMode" value="screen" ${paperMode ? "" : "checked"}><span>${localIcon("message-square")}<strong>On-screen</strong><small>Select answers in the reviewer</small></span></label>
               <label class="answer-mode-card ${paperMode ? "active" : ""}"><input type="radio" name="answerMode" value="paper" ${paperMode ? "checked" : ""}><span>${localIcon("clipboard-list")}<strong>Paper answer sheet</strong><small>Print, mark, scan, and grade</small></span></label>
             </fieldset>
             <label>Mock Version
              <select name="versionId">
                ${examVersions.map((version) => `<option value="${escapeAttr(version.id)}" ${version.id === savedVersionId ? "selected" : ""}>Mock Exam ${String(version.number).padStart(2, "0")}</option>`).join("")}
              </select>
            </label>
             ${toggleControl("shuffleQuestions", "Shuffle Questions", paperMode ? false : draftOptions.shuffleQuestions, paperMode)}
             ${toggleControl("shuffleAnswers", "Shuffle Answer Choices", paperMode ? false : draftOptions.shuffleAnswers, paperMode)}
             ${paperMode ? `<div class="paper-setup-note">${localIcon("clipboard-list")}<span><strong>Two printable sheets</strong><small>Page 1: Items 1-85 / Page 2: Items 86-170</small></span></div><button class="btn secondary paper-print-button" data-action="print-paper-sheets" type="button">${localIcon("clipboard-list")} Print Answer Sheets</button>` : ""}
             <p class="setup-auto-save">${localIcon("cloud-check")} ${paperMode ? "Scans stay on this device. Only confirmed answers are saved." : "Your progress is autosaved. You can pause and resume at any time."}</p>
             <button class="btn primary technical-cta" data-action="setup-submit" type="button"><span>${icon("play")} ${paperMode ? "Start Paper Exam" : "Start Mock Exam"}</span>${icon("arrow")}</button>
          </form>
        </div>
        <div class="setup-disclaimer">${icon("shield")}<p>These mock exams are independently created and are not affiliated with or endorsed by the Civil Service Commission.</p></div>
      </section>
    `, "setup");
  }

  function renderExam() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    if (isPaperAttempt(attempt) && paperPhase(attempt) !== "answering") return renderPaperWorkflow(attempt);
    materializeQuestionClock(attempt);
    const current = currentAnswer(attempt);
    if (!current) return setView({ name: "dashboard" });
    const remaining = timeRemaining(attempt);
    const linked = linkedStimulusAnswers(attempt, current);
    const isPaused = attempt.status === "paused";
    const paperMode = isPaperAttempt(attempt);
    const existingNav = root.querySelector(".exam-nav");
    if (existingNav) app.examNavScrollTop = existingNav.scrollTop;
    ensureAttemptClock(attempt);

    const version = examVersions.find((candidate) => candidate.id === attempt.exam_version_id);
    const versionNumber = app.fixtureMode ? 7 : version?.number;
    const runLabel = attempt.mode === "practice" ? escapeHtml(attempt.title || "Practice") : `Mock Exam ${versionNumber ? String(versionNumber).padStart(2, "0") : ""}`.trim();
    root.innerHTML = cockpitFrame(`
      <section class="exam-shell ${app.fixtureMode ? "fixture-exam" : ""} state-${escapeAttr(app.fixtureState || "live")} ${isPaused ? "is-paused" : ""} ${isPaused || app.modal === "submit" ? "exam-dimmed" : ""}">
        <header class="exam-topbar">
          <div class="exam-brand">${logo()}<div><strong>CSC Practice Reviewer</strong><span>Independent mock exam and review tool</span></div></div>
          <div class="exam-status" aria-label="Exam status">
            <div class="exam-hud-cell exam-run-cell"><span>Run</span><strong>${runLabel}</strong></div>
            <div class="exam-hud-cell exam-time-cell"><span>${attempt.mode === "practice" ? "Mode" : isPaused ? "Timer" : "Time Left"}</span><strong class="exam-time"><b class="exam-time-value">${attempt.mode === "practice" ? "Untimed" : attempt.options?.showTimer === false ? "Hidden" : formatDuration(remaining)}</b></strong></div>
            <div class="exam-hud-cell exam-answered-cell"><span>${paperMode ? "Answer Mode" : "Answered"}</span><strong class="exam-answered">${paperMode ? "Paper sheet" : `<b class="exam-answered-value">${answeredCount(attempt)}</b> / ${attempt.total_questions}`}</strong></div>
            ${attempt.mode === "practice" ? `<div class="exam-hud-cell exam-difficulty"><span>Practice</span><strong>${escapeHtml(statusLabel(attempt.options?.difficulty || "mixed"))} / ${attempt.total_questions}</strong></div>` : ""}
          </div>
          <div class="exam-actions">
            <button class="btn secondary mobile-question-toggle" data-action="toggle-exam-nav" type="button">${icon("review")} Questions</button>
            <button class="btn ghost exam-exit" data-action="save-exit" type="button">${icon("back")} Exit</button>
            <div class="exam-audio-control"><button class="icon-only header-audio-button ${app.audio.music && !app.audio.muted ? "active" : ""}" data-action="toggle-audio-menu" type="button" aria-label="Audio controls" aria-expanded="${app.audioMenuOpen ? "true" : "false"}">${icon(app.audio.muted ? "volume-off" : "music")}</button>${audioPopover()}</div>
            <button class="btn secondary" data-action="pause-exam" type="button" ${attempt.options?.enablePause === false || isPaused ? "disabled" : ""}>${icon("pause")} Pause</button>
            <button class="btn ${paperMode ? "paper-finish" : "danger"}" data-action="${paperMode ? "open-paper-finish" : "open-submit"}" type="button">${icon("submit")} ${paperMode ? "Finish Answering" : attempt.mode === "practice" ? "Finish Practice" : "Submit Exam"}</button>
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
            <section class="question-panel" data-motion-purpose="question-change"${app.fixtureMode ? ` data-question-id="${escapeAttr(current.question_id)}" data-question-seconds="${Number(current.time_spent_seconds || 0).toFixed(3)}"` : ""}>
              <div class="question-title">
                <div>
                  <span class="question-index">Item ${current.position + 1} <small>/ ${attempt.total_questions}</small></span>
                  <p class="topic-pill">${escapeHtml(current.section)} - ${escapeHtml(current.subtopic)}</p>
                </div>
                <span class="status-pill ${answerStatus(current)}">${statusText(current)}</span>
              </div>
              ${renderQuestionPrompt(current)}
              <div class="choices ${paperMode ? "paper-readonly-choices" : ""}">
                ${current.choices.map((choice) => `
                  <button class="choice ${current.selected_choice === choice.id ? "selected" : ""}" ${paperMode ? "aria-disabled=\"true\" tabindex=\"-1\"" : `data-choice="${choice.id}" data-motion-purpose="answer-selection"`} type="button" ${attempt.status !== "in_progress" || paperMode ? "disabled" : ""}>
                    <span class="choice-letter">${choice.id}</span>
                    <strong>${escapeHtml(choice.text)}</strong>
                    <i class="choice-radio"></i>
                  </button>
                `).join("")}
              </div>
              <div class="question-actions">
                <button class="btn secondary" data-action="previous-question" type="button" ${current.position === 0 ? "disabled" : ""}>${icon("back")} Previous</button>
                ${paperMode ? `<span class="paper-mark-reminder">${localIcon("clipboard-list")} Mark your printed sheet</span>` : `<button class="btn ghost" data-action="clear-answer" type="button">${icon("clear")} Clear Answer</button>`}
                <button class="btn ghost ${current.flagged ? "active" : ""}" data-action="toggle-flag" type="button">${icon("flag")} Flag for Review</button>
                ${paperMode ? "" : `<button class="btn secondary" data-action="skip-question" type="button">${icon("skip")} Skip</button>`}
                <button class="btn primary" data-action="${current.position >= attempt.total_questions - 1 ? paperMode ? "open-paper-finish" : "open-submit" : "next-question"}" type="button" ${!paperMode && !current.selected_choice ? "disabled" : ""}>${current.position >= attempt.total_questions - 1 ? paperMode ? "Finish Answering" : "Review & Submit" : "Next"} ${icon("arrow")}</button>
              </div>
            </section>
          </main>
        </div>
      </section>
      ${pauseModal(attempt)}
      ${submitModal(attempt)}
      ${paperFinishModal(attempt)}
      ${chartModal(attempt, current)}
      ${timeoutModal(attempt)}
      ${toast()}
    `, "exam-frame");

    if ((!app.fixtureMode || QA_TIMING_ENABLED) && attempt.status === "in_progress" && app.modal !== "timeout") {
      app.timerId = setInterval(() => tickAttempt(attempt.id), 1000);
    }
    requestAnimationFrame(() => {
      const nav = root.querySelector(".exam-nav");
      if (nav) nav.scrollTop = app.examNavScrollTop;
    });
  }

  function isPaperAttempt(attempt) {
    return Boolean(attempt?.options?.paperMode);
  }

  function paperPhase(attempt) {
    return attempt?.options?.paperPhase || "answering";
  }

  function paperFinishModal(attempt) {
    if (app.modal !== "paper-finish") return "";
    return `
      <div class="modal-backdrop static-backdrop paper-finish-backdrop" data-static-backdrop="true">
        <section class="submit-modal paper-finish-modal" role="dialog" aria-modal="true" aria-labelledby="paper-finish-title" tabindex="-1">
          <div class="submit-title-row"><span class="paper-finish-symbol">${localIcon("clipboard-list")}</span><div><p class="eyebrow">Paper answer mode</p><h2 id="paper-finish-title">Finish answering?</h2></div></div>
          <p>The exam timer will stop. You can then photograph or scan both answer sheets and confirm every detected mark.</p>
          <div class="paper-finish-checks"><span>${localIcon("timer")}<b>Timer freezes</b></span><span>${localIcon("cloud-check")}<b>Checkpoint syncs</b></span><span>${localIcon("clipboard-list")}<b>Two sheets required</b></span></div>
          <div class="modal-actions"><button class="btn ghost" data-action="close-modal" type="button">Keep Answering</button><button class="btn primary" data-action="confirm-paper-finish" type="button">Freeze and Scan</button></div>
        </section>
      </div>
    `;
  }

  function renderPaperWorkflow(attempt) {
    clearInterval(app.timerId);
    app.timerId = null;
    const review = paperPhase(attempt) === "review";
    const detections = normalizedPaperDetections();
    const summary = paperDetectionSummary(detections);
    const version = examVersions.find((candidate) => candidate.id === attempt.exam_version_id);
    const versionLabel = `Mock Exam ${String(version?.number || 1).padStart(2, "0")}`;
    root.innerHTML = cockpitFrame(`
      <section class="paper-workflow ${review ? "paper-review-stage" : "paper-scan-stage"}" data-motion-purpose="page-enter">
        <header class="paper-workflow-header">
          <div class="exam-brand">${logo()}<div><strong>CSC Practice Reviewer</strong><span>Independent mock exam and review tool</span></div></div>
          <div class="paper-run-status"><span>${escapeHtml(versionLabel)}</span><b>${review ? "Verify detected answers" : "Scan answer sheets"}</b><small>Timer frozen at ${formatDuration(attempt.elapsed_seconds)}</small></div>
          <div class="paper-header-actions"><button class="btn secondary" data-action="print-paper-sheets" type="button">${localIcon("clipboard-list")} Print Sheets</button><button class="btn ghost" data-action="paper-save-exit" type="button">${icon("save")} Save and Exit</button></div>
        </header>
        <main class="paper-workflow-body">
          <section class="paper-stage-title">
            <div><p class="eyebrow">Paper answer mode / ${review ? "Step 2 of 2" : "Step 1 of 2"}</p><h1>${review ? "Confirm detected answers" : "Upload both answer sheets"}</h1><p>${review ? "Resolve uncertain marks, verify blanks, then grade through the normal submission path." : "Use a CamScanner JPG, phone photo, or PNG. Processing remains on this device."}</p></div>
            <div class="paper-privacy-badge">${icon("shield")}<span><strong>Local processing</strong><small>Images are never uploaded</small></span></div>
          </section>
          ${app.paperSyncError ? `<div class="paper-sync-error" role="alert">${icon("warning")}<span><strong>Cloud checkpoint not confirmed</strong>${escapeHtml(app.paperSyncError)}</span><button class="btn secondary" data-action="retry-paper-sync" type="button">Retry sync</button></div>` : ""}
          ${review ? renderPaperConfirmation(attempt, detections, summary) : renderPaperUploadStage(attempt)}
        </main>
        ${toast()}
      </section>
    `, "paper-frame");
    requestAnimationFrame(() => renderPaperScanCanvases());
    syncPaperSubmissionPoll(attempt);
  }

  function renderPaperUploadStage(attempt) {
    return `
      <div class="paper-upload-grid">
        ${[0, 1].map((pageIndex) => {
          const scan = app.paperScans[pageIndex];
          const range = pageIndex === 0 ? "Items 1-85" : "Items 86-170";
          return `<section class="paper-upload-card ${scan ? "has-scan" : ""}">
            <div class="paper-upload-head"><span>Page ${pageIndex + 1}</span><strong>${range}</strong><em>${scan ? scan.alignmentConfidence >= 0.55 ? "Markers found" : "Check corners" : "Required"}</em></div>
            <div class="paper-canvas-wrap ${scan ? "" : "empty"}">
              ${scan ? `<canvas class="paper-alignment-canvas" data-paper-canvas="${pageIndex}" aria-label="Page ${pageIndex + 1} alignment preview"></canvas><p>Drag each numbered handle onto its matching corner marker.</p>` : `<div class="paper-upload-placeholder">${localIcon("clipboard-list")}<strong>No sheet selected</strong><span>JPG or PNG / CamScanner or camera</span></div>`}
            </div>
            <div class="paper-upload-actions">
              <label class="btn primary paper-file-label">${icon("open")} ${scan ? "Replace File" : "Choose File"}<input data-paper-file="${pageIndex}" type="file" accept="image/jpeg,image/png"></label>
              <label class="btn secondary paper-file-label paper-camera-label">${icon("camera")} Use Camera<input data-paper-file="${pageIndex}" type="file" accept="image/jpeg,image/png" capture="environment"></label>
              ${scan ? `<button class="btn secondary" data-action="rotate-paper-scan" data-paper-page="${pageIndex}" type="button">${icon("refresh")} Rotate</button><button class="btn ghost" data-action="reset-paper-corners" data-paper-page="${pageIndex}" type="button">Reset corners</button>` : ""}
            </div>
          </section>`;
        }).join("")}
      </div>
      <section class="paper-capture-guidance"><strong>Capture checklist</strong><span>Keep all four markers visible</span><span>Avoid shadows across bubbles</span><span>Use a flat, bright surface</span><span>Confirm page numbers before analysis</span></section>
      <footer class="paper-workflow-actions"><span>Both pages are required before recognition can begin.</span><button class="btn primary" data-action="analyze-paper-sheets" type="button" ${app.paperScans.every(Boolean) ? "" : "disabled"}>Analyze 170 Answers ${icon("arrow")}</button></footer>
    `;
  }

  function renderPaperConfirmation(attempt, detections, summary) {
    const unresolved = detections.filter((item) => (item.state === "multiple" || item.state === "low") && !item.reviewed).length;
    const blanks = detections.filter((item) => !item.choice).length;
    return `
      <section class="paper-detection-summary" aria-label="Recognition summary">
        <metric class="confident">${localIcon("circle-check")}<span>Confident</span><strong>${summary.confident}</strong></metric>
        <metric class="blank">${icon("clear")}<span>Blank</span><strong>${summary.blank}</strong></metric>
        <metric class="multiple">${icon("warning")}<span>Multiple</span><strong>${summary.multiple}</strong></metric>
        <metric class="low">${localIcon("target")}<span>Low confidence</span><strong>${summary.low}</strong></metric>
      </section>
      <section class="paper-answer-review v5-panel">
        <div class="paper-review-legend"><span><i class="confident"></i>Confident</span><span><i class="blank"></i>Blank</span><span><i class="multiple"></i>Multiple marks</span><span><i class="low"></i>Low confidence</span><small>Click A-D or Blank to correct any item.</small></div>
        <div class="paper-answer-grid">
          ${detections.map((item) => `<article class="paper-answer-item ${item.state} ${item.reviewed ? "reviewed" : ""}"><strong>${item.number}</strong><div>${["A", "B", "C", "D"].map((choice) => `<button class="${item.choice === choice ? "selected" : ""}" data-paper-answer="${item.number}" data-paper-choice="${choice}" type="button" aria-label="Item ${item.number}: ${choice}">${choice}</button>`).join("")}<button class="paper-blank-choice ${!item.choice ? "selected" : ""}" data-paper-answer="${item.number}" data-paper-choice="" type="button">Blank</button></div><small>${item.reviewed ? "Verified" : item.state === "confident" ? `${Math.round((item.confidence || 0) * 100)}%` : item.state.replace("low", "Check mark")}</small></article>`).join("")}
        </div>
      </section>
      <label class="paper-blank-confirm ${blanks ? "" : "complete"}"><input data-paper-confirm-blanks type="checkbox" ${app.paperBlankConfirmed || !blanks ? "checked" : ""} ${blanks ? "" : "disabled"}><span><strong>${blanks ? `Confirm ${blanks} blank item${blanks === 1 ? "" : "s"}` : "No blank items detected"}</strong><small>Blank answers will be graded as unanswered.</small></span></label>
      <footer class="paper-workflow-actions"><button class="btn secondary" data-action="paper-back-upload" type="button">${icon("back")} Recheck Images</button><span class="paper-review-readiness">${unresolved ? `${unresolved} uncertain item${unresolved === 1 ? "" : "s"} still need review` : "All uncertain marks reviewed"}</span><button class="btn primary" data-action="confirm-paper-grade" type="button" ${unresolved || (blanks && !app.paperBlankConfirmed) ? "disabled" : ""}>Confirm and Grade ${icon("submit")}</button></footer>
    `;
  }

  function renderResults() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    const score = scoreAttempt(attempt);
    const pct = resultPercent(attempt);
    const insights = performanceInsights(attempt);
    const runInsights = selectRunInsights(attempt);
    const stats = sectionStats(attempt);
    const isPractice = attempt.mode === "practice";
    const orderedStats = isPractice
      ? stats.filter((stat) => stat.total > 0)
      : SECTION_GROUPS.map((group) => stats.find((stat) => stat.section === group.section) || { section: group.section, correct: 0, total: group.end - group.start + 1, percent: 0 });
    const passed = pct >= PASSING_PERCENT;
    const weakestSection = insights.weakest?.section || "Verbal Ability";
    const reviewHref = routeHref("review", { attempt: attempt.id });
    const practiceHref = routeHref("practice", { category: weakestSection });
    const retakeHref = routeHref("setup", { version: attempt.exam_version_id });
    root.innerHTML = authedShell(`
      <section class="results-page v5-results-page ${passed ? "passed" : "needs-work"} ${isPractice ? "practice-result" : ""}" data-motion-purpose="page-enter">
        <div class="results-command-title">
          <strong>${isPractice ? "Practice Results" : "Mock Exam Results"}${isPaperAttempt(attempt) ? `<em class="paper-result-badge">Paper mode</em>` : ""}</strong>
          <small>${escapeHtml(examTitle(attempt))} completed ${formatDate(attempt.submitted_at || attempt.started_at)}</small>
        </div>

        <div class="results-summary-grid">
          <section class="results-performance-panel v5-panel">
            <div class="score-gauge-panel">
              <div class="score-gauge" style="--score:${Math.max(0, Math.min(100, pct)) * 3.6}deg">
                <span>Score</span><strong>${Math.round(pct)}%</strong><b>${score} / ${attempt.total_questions}</b><small>correct</small>
                <em>${isPractice ? "Complete" : passed ? "Passed" : "Needs Work"}</em>
              </div>
            </div>
            <section class="results-section-console v5-panel">
              <div class="technical-title accuracy-title"><h2>Section Accuracy</h2><small>Correct answers in this attempt</small><span aria-hidden="true"></span></div>
              <div class="results-section-grid">
                ${orderedStats.map((stat) => {
                  const percent = Math.round((stat.correct / Math.max(1, stat.total)) * 100);
                  return `<article class="result-section-card ${toneForSection(stat.section)}"><span class="section-hud-icon">${localIcon(sectionIconName(stat.section))}</span><strong>${escapeHtml(stat.section)}</strong><i><em style="width:${percent}%"></em></i><small>${stat.correct} / ${stat.total}</small><b>${percent}%</b></article>`;
                }).join("")}
              </div>
            </section>
          </section>
          <section class="result-metrics-rail v5-panel">
            <metric>${localIcon("timer")}<span>Total Time</span><strong>${formatDuration(attempt.elapsed_seconds)}</strong></metric>
            <metric>${localIcon("history")}<span>Average / Question</span><strong>${formatDuration(insights.averageTime)}</strong></metric>
            <metric>${localIcon("target")}<span>Unanswered</span><strong>${unansweredCount(attempt)}</strong></metric>
            <metric>${icon("flag")}<span>Flagged</span><strong>${flaggedCount(attempt)}</strong></metric>
          </section>
        </div>

        <section class="run-insights-panel v5-panel">
            <div class="technical-title"><h2>Run Insights</h2><span aria-hidden="true"></span></div>
            <div class="insight-grid">
              ${runInsights.map((insight) => resultInsight(insight.icon, insight.title, insight.value, insight.detail, insight.tone)).join("")}
            </div>
        </section>
        <footer class="results-action-row">
            <a class="result-action primary" data-action="review-answers" href="${escapeAttr(reviewHref)}">${localIcon("notebook-tabs")}<span><strong>Review Answers</strong></span>${icon("arrow")}</a>
            ${isPractice
              ? `<button class="result-action green" data-action="repeat-practice" type="button">${localIcon("target")}<span><strong>Repeat Drill</strong></span>${icon("arrow")}</button><button class="result-action purple" data-action="change-practice" type="button">${localIcon("settings")}<span><strong>Change Practice</strong></span>${icon("arrow")}</button>`
              : `<a class="result-action green" data-action="practice-weakest" href="${escapeAttr(practiceHref)}">${localIcon("target")}<span><strong>Practice Weakest Area</strong></span>${icon("arrow")}</a><a class="result-action purple" data-action="retake-same-version" href="${escapeAttr(retakeHref)}">${localIcon("history")}<span><strong>Retake Same Version</strong></span>${icon("arrow")}</a>`}
            <button class="result-action neutral" data-action="dashboard" type="button">${localIcon("home")}<span><strong>Back to Home</strong></span>${icon("arrow")}</button>
        </footer>
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
    const navWindow = reviewNavigatorWindow(filtered, index);
    root.innerHTML = authedShell(`
      <section class="review-page v3-review-page v5-review-page" data-motion-purpose="page-enter">
        <header class="review-command-head">
          <div><h1>Answer <span>Review</span></h1><small>${escapeHtml(examTitle(attempt))}</small></div>
          <div class="review-score-strip telemetry-rail">
            ${telemetryMetric("target", "Score", `${Math.round(resultPercent(attempt))}%`)}
            ${telemetryMetric("circle-check", "Correct", score)}
            ${telemetryMetric("notebook-tabs", "Needs Review", attempt.total_questions - score)}
            ${telemetryMetric("target", "Flagged", flaggedCount(attempt))}
          </div>
        </header>

        <div class="review-workstation v5-review-workstation">
          <aside class="review-navigator-console v5-panel">
            <section class="review-filter-panel">
              <div class="technical-title"><h2>Filter</h2><span aria-hidden="true"></span></div>
              <div class="filter-list">
                ${["all", "wrong", "correct", "flagged"].map((filter) => `<button class="${app.reviewFilter === filter ? "active" : ""}" data-review-filter="${filter}" type="button">${filterLabel(filter)}<small>${filteredReviewAnswers(attempt, filter).length}</small></button>`).join("")}
              </div>
            </section>
            <section class="review-matrix-panel">
              <div class="review-matrix-title"><strong>Question Navigator</strong><span>${escapeHtml(navWindow.label)}</span></div>
              <div class="review-matrix-head" aria-hidden="true"><span>#</span><span>General</span><span>Verbal</span><span>Numerical</span><span>Analytical</span></div>
              <div class="review-matrix-scroll">
                ${navWindow.items.map(({ item, itemIndex }) => {
                  const state = item.selected_choice === item.correct_choice ? "correct" : item.selected_choice ? "wrong" : "unanswered";
                  return `<button class="review-matrix-row ${itemIndex === index ? "current" : ""} ${state} ${item.flagged ? "flagged" : ""}" data-review-index="${itemIndex}" type="button"><b>${item.display_number}</b>${SECTION_GROUPS.map((group) => `<span class="matrix-section ${item.section === group.section ? `active ${group.tone}` : ""}">${item.section === group.section ? (item.flagged ? icon("flag") : state === "correct" ? localIcon("circle-check") : state === "wrong" ? icon("x") : `<i></i>`) : ""}</span>`).join("")}</button>`;
                }).join("")}
              </div>
            </section>
          </aside>

          <main class="review-question-panel v5-panel">
            ${answer && filtered.length ? `
              <div class="review-question-head"><span class="question-index"><span>Question</span><b>${answer.position + 1}</b><span>of ${attempt.total_questions}</span></span><div><p class="review-topic">${escapeHtml(answer.section)} / ${escapeHtml(answer.subtopic)}</p><span class="status-pill ${correct ? "answered" : "wrong"}">${correct ? "Correct" : answer.selected_choice ? "Incorrect" : "Unanswered"}</span><span class="review-head-time">${localIcon("timer")} ${formatDuration(answer.time_spent_seconds)}</span></div></div>
              <div class="review-question-scroll">
                ${answer.stimulus ? renderStimulusPanel(attempt, answer, linkedStimulusAnswers(attempt, answer), true) : ""}
                ${renderQuestionPrompt(answer)}
                <div class="review-choices">
                  ${answer.choices.map((choice) => `<div class="review-choice ${choice.id === answer.correct_choice ? "is-correct" : ""} ${choice.id === answer.selected_choice && choice.id !== answer.correct_choice ? "is-wrong" : ""}"><span>${choice.id}</span><strong>${escapeHtml(choice.text)}</strong><em>${choice.id === answer.correct_choice ? "Correct answer" : choice.id === answer.selected_choice ? "Your answer" : ""}</em></div>`).join("")}
                </div>
                <section class="review-explanation-console">
                  <div><strong>Explanation</strong><p>${escapeHtml(answer.explanation || "No explanation provided.")}</p></div>
                  <div class="review-metadata"><span>${localIcon("timer")}<b>Time Spent</b><strong>${formatDuration(answer.time_spent_seconds)}</strong></span><span>${localIcon("history")}<b>Visits</b><strong>${answer.visit_count || 0}</strong></span>${isPaperAttempt(attempt) ? `<span>${localIcon("clipboard-list")}<b>Answer Source</b><strong>Paper sheet</strong></span>` : `<span>${localIcon("history")}<b>Answer Changes</b><strong>${answer.answer_changes || 0}</strong></span>`}<span>${icon("flag")}<b>Flagged</b><strong>${answer.flagged ? "Yes" : "No"}</strong></span></div>
                </section>
              </div>
            ` : `<div class="review-empty-panel"><span>${icon("review")}</span><strong>No matching review items</strong><p>Change the active filter to continue reviewing this attempt.</p></div>`}
          </main>
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
      <section class="content-page practice-review-page" data-motion-purpose="page-enter">
        <div class="page-title-row">
          <div>
            <h1>Practice <span>& Review</span></h1>
            <p>Train a section or revisit questions that need attention.</p>
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
    const categoryStats = categoryPerformance(completed);
    const weakest = practiceCategoriesForDisplay()
      .map((category) => ({ category, percent: categoryPercent(categoryStats[category.section], category.section) }))
      .sort((left, right) => left.percent - right.percent)[0];
    root.innerHTML = sideShell("recent", `
      <section class="content-page progress-page" data-motion-purpose="page-enter">
        <div class="page-title-row">
          <div>
            <h1>Progress</h1>
            <p>See how completed exams and practice sessions are improving.</p>
          </div>
        </div>
        <div class="summary-cards statistics-rail telemetry-rail">
          ${telemetryMetric("target", "Completed Attempts", completed.length)}
          ${telemetryMetric("calculator", "Average Score", average == null ? "--" : `${Math.round(average)}%`)}
          ${telemetryMetric("trophy", "Best Score", completed.length ? `${Math.round(highest)}%` : "--")}
        </div>
        <div class="progress-analytics-grid">
        <section class="card trend-panel v3-panel">
          <div class="technical-title"><div><h2>Score History</h2><p>Score across completed runs</p></div><span>${completed.length ? `${completed.length} completed` : "Awaiting first run"}</span></div>
          ${progressTrendSvg(completed)}
        </section>
        <section class="card performance-card v3-panel">
          <div class="technical-title"><div><h2>Section Accuracy</h2><p>Historical correctness by exam section.</p></div><span aria-hidden="true"></span></div>
          <div class="performance-bars">
            ${practiceCategoriesForDisplay().map((category) => progressBarRow(category, categoryPercent(categoryStats[category.section], category.section))).join("")}
          </div>
          <button class="review-focus-cta" data-action="practice-weakest" type="button">${localIcon("target")} Practice weakest section <strong>${weakest && completed.length ? escapeHtml(weakest.category.label) : "Awaiting results"}</strong>${icon("arrow")}</button>
        </section>
        </div>
        <section class="card attempts-table-card v3-panel">
          <div class="attempt-table-title"><div><h2>Attempt Records</h2><span>${attempts.length} stored runs for ${escapeHtml(app.profile?.email || app.session?.user?.email || "this account")}</span></div><button class="btn tiny" data-action="refresh-attempts" type="button">${localIcon("history")} Refresh records</button></div>
          <div class="tabs progress-tabs">
            ${[
              ["all", "All Attempts"],
              ["full", "Mock Exams"],
              ["practice", "Practice"]
            ].map(([key, label]) => `<button class="${app.recentTab === key ? "active" : ""}" data-recent-tab="${key}" type="button">${label}</button>`).join("")}
          </div>
          <div class="attempt-table">
            <div class="table-head"><span>Attempt</span><span>Type</span><span>Status</span><span>Score</span><span>Answered</span><span>Action</span></div>
            ${filteredAttemptsByTab(attempts, app.recentTab).map((attempt, index) => `
              <div class="table-row">
                <span class="attempt-name"><i>${String(index + 1).padStart(2, "0")}</i><span><strong>${escapeHtml(examTitle(attempt))}</strong><small>${formatDate(attempt.started_at)}</small></span></span>
                <span class="attempt-type">${attempt.mode === "practice" ? "Practice" : "Mock Exam"}</span>
                <span class="attempt-status ${escapeAttr(attempt.status)}">${attempt.status === "submitted" || attempt.status === "timed_out" ? localIcon("circle-check") : localIcon("timer")} ${statusLabel(attempt.status)}</span>
                <span class="attempt-score">${attempt.status === "submitted" || attempt.status === "timed_out" ? `${Math.round(resultPercent(attempt))}%` : "--"}</span>
                <span class="attempt-answered">${answeredCount(attempt)} / ${attempt.total_questions}</span>
                <span class="row-actions">
                  <button class="btn tiny" data-attempt-open="${attempt.id}" type="button">${attempt.status === "in_progress" || attempt.status === "paused" ? "Continue" : "View Results"}</button>
                  <button class="icon-only" data-overflow="${attempt.id}" type="button" title="More actions">${icon("more")}</button>
                  ${app.modal === `overflow:${attempt.id}` ? overflowMenu(attempt) : ""}
                </span>
              </div>
            `).join("") || `<div class="progress-empty-state">${emptyInline("No attempts yet", "Start a mock exam or practice session to create your first record.")}<button class="btn primary" data-action="open-setup" type="button">${icon("play")} Start Mock Exam</button></div>`}
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
    const mistakes = wrongAnswerCount(completedAttempts());
    const flagged = app.attempts.reduce((sum, attempt) => sum + flaggedCount(attempt), 0);
    return `
      <div class="practice-mode-cards" aria-label="Practice and review modes">
        ${[
          ["practice", "Practice", "target", "Build skills and accuracy"],
          ["mistakes", "Mistakes", "circle-check", `${mistakes} to review`],
          ["flagged", "Flagged", "notebook-tabs", `${flagged} saved questions`]
        ].map(([key, label, iconName, detail]) => `<button class="practice-mode-card ${key} ${active === key ? "active" : ""}" data-practice-review-tab="${key}" type="button">${localIcon(iconName)}<span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></span>${localIcon("chevron-right")}</button>`).join("")}
      </div>
    `;
  }

  function practiceTabContent() {
    const categories = practiceCategoriesForDisplay();
    const selectedCategory = app.practiceCategoryDraft || categories[0]?.section;
    return `
      <form class="custom-practice practice-console v5-panel" data-form="custom-practice">
        <section class="practice-section-picker">
          <div class="technical-title"><h2>Build a Practice Set</h2><span aria-hidden="true"></span></div>
          <fieldset class="category-plates"><legend class="sr-only">Section</legend>${categories.map((category, index) => {
            const group = SECTION_GROUPS.find((entry) => entry.section === category.section);
            const available = group ? group.end - group.start + 1 : category.poolSize;
            return `<label class="section-plate ${category.tone}"><input type="radio" name="category" value="${escapeAttr(category.section)}" ${category.section === selectedCategory ? "checked" : ""}/><span class="section-hud-icon">${localIcon(sectionIconName(category.section))}</span><span class="section-copy"><strong>${escapeHtml(category.section)}</strong><small>${available} available</small></span><i>${localIcon("chevron-right")}</i></label>`;
          }).join("")}</fieldset>
        </section>
        <section class="run-profile-panel">
          <div class="count-segments" role="radiogroup" aria-labelledby="practice-count-label"><p class="segment-label" id="practice-count-label">Question Count</p>${[10, 20, 30, 40].map((count) => `<label><input type="radio" name="count" value="${count}" ${count === 20 ? "checked" : ""}/><span>${count}</span></label>`).join("")}</div>
          <div class="difficulty-segments" role="radiogroup" aria-labelledby="practice-difficulty-label"><p class="segment-label" id="practice-difficulty-label">Difficulty</p>${[["mixed", "Mixed"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(([value, label], index) => `<label><input type="radio" name="difficulty" value="${value}" ${index === 0 ? "checked" : ""}/><span>${label}</span></label>`).join("")}</div>
          <div class="selected-run-profile"><span data-practice-profile-section class="selected-run-section ${toneForSection(selectedCategory)}">${localIcon(sectionIconName(selectedCategory))}<strong>${escapeHtml(sectionLabel(selectedCategory))} selected</strong></span><b><span data-practice-count>20</span> questions / <span data-practice-difficulty>Mixed</span></b></div>
          <button class="btn primary technical-cta practice-start-cta" data-action="custom-practice-submit" type="button"><span>${localIcon("target")} Start Practice</span>${icon("arrow")}</button>
        </section>
      </form>
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
            <section class="card mistake-list mistakes-list-only v5-panel">
              <div class="mistake-console-head">
                <div><h2>Review Mistakes</h2><p>Choose a completed attempt and review missed questions.</p></div>
                <div class="mistake-summary-rail">
                  ${telemetryMetric("notebook-tabs", "Questions to Review", totalMissed)}
                  ${telemetryMetric("history", "Attempts", withMistakes.length)}
                  ${telemetryMetric(sectionIconName(priority?.category.section || "Verbal Ability"), "Weakest Section", priority ? priority.category.label : "--")}
                </div>
              </div>
              <div class="mistake-table-head"><span>Attempt</span><span>Type / Date</span><span>Score</span><span>Missed</span><span>Action</span></div>
              <div class="mistake-attempt-scroll">
                ${withMistakes.map(({ attempt, mistakes }) => `<article class="mistake-attempt-card">
                  <div class="mistake-attempt-title"><span class="section-hud-icon">${localIcon(attempt.mode === "practice" ? sectionIconName(mistakes[0]?.section) : "target")}</span><strong>${escapeHtml(examTitle(attempt))}</strong></div>
                  <span class="mistake-attempt-meta">${attempt.mode === "practice" ? "Practice" : "Mock Exam"}<small>${formatDate(attempt.submitted_at || attempt.started_at)}</small></span>
                  <strong class="mistake-score">${Math.round(resultPercent(attempt))}%</strong>
                  <strong class="mistake-count">${mistakes.length}</strong>
                  <button class="btn technical-row-cta" data-review-mistakes="${attempt.id}" type="button">Review Mistakes ${icon("arrow")}</button>
                </article>`).join("")}
              </div>
            </section>
        ` : `<section class="card mistakes-empty v5-panel">${emptyState("No mistakes yet", completed.length ? "Your completed attempts do not contain any mistakes." : "Complete a mock exam or practice session and missed questions will appear here.", "open-setup", "Start Mock Exam", "practice-page", "Start Practice")}</section>`}
      </section>
    `;
  }

  function flaggedTabContent() {
    const flagged = app.attempts.flatMap((attempt) => Object.values(attempt.answers).filter((answer) => answer.flagged).map((answer) => ({ attempt, answer })));
    const grouped = practiceCategoriesForDisplay().map((category) => ({ category, rows: flagged.filter((item) => item.answer.section === category.section) })).filter((group) => group.rows.length);
    return `
      <section class="review-queue">
        ${flagged.length ? `<div class="flagged-workspace simplified-flagged-workspace">
          <section class="card flagged-table-panel flagged-table-only v3-panel">
            <div class="technical-title"><div><h2>Flagged Questions</h2><p>${flagged.length} saved question${flagged.length === 1 ? "" : "s"}, grouped by section.</p></div><span aria-hidden="true"></span></div>
            <div class="flagged-table-head"><span>Item / Topic</span><span>Source Attempt</span><span>Answer State</span><span>Review</span></div>
            <div class="flagged-table-scroll">
              ${grouped.map(({ category, rows }) => `<section class="flagged-section ${category.tone}"><header>${localIcon(sectionIconName(category.section))}<h2>${escapeHtml(category.label)}</h2><em>${rows.length} items</em></header>${rows.map(({ attempt, answer }) => `
                <div class="flagged-table-row"><span><i>${icon("flag")}</i><strong>Item ${answer.display_number}</strong><small>${escapeHtml(answer.subtopic || answer.topic || "Review item")}</small></span><span>${escapeHtml(examTitle(attempt))}<small>${formatDate(attempt.started_at)}</small></span><span class="${answer.selected_choice === answer.correct_choice ? "correct" : answer.selected_choice ? "wrong" : "unanswered"}">${answer.selected_choice ? answer.selected_choice === answer.correct_choice ? "Correct" : "Incorrect" : "Unanswered"}</span><button class="btn tiny" data-open-review="${attempt.id}" data-review-question="${answer.question_id}" type="button">Review</button></div>
              `).join("")}</section>`).join("")}
            </div>
          </section>
        </div>` : `<section class="card flagged-empty v3-panel">${emptyState("No flagged questions yet", "Flag a question during an exam or answer review and it will appear here.", "open-setup", "Start Mock Exam", "practice-page", "Start Practice")}</section>`}
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
    const routes = [
      ["dashboard", "Home", "dashboard", "target"],
      ["setup", "Mock Exam", "setup-page", "notebook-tabs"],
      ["practice", "Practice & Review", "practice-page", "brain-circuit"],
      ["recent", "Progress", "recent-page", "history"]
    ];
    return `
      <header class="app-header signed-header study-hub-header">
        <div class="brand">${logo()}${brandText()}</div>
        <nav class="signed-primary-nav" aria-label="Primary navigation">
          ${routes.map(([route, label, action, iconName]) => `<button class="${activeRoute === route ? "active" : ""}" data-action="${action}" type="button" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"><span class="nav-glyph">${localIcon(iconName)}</span><span class="nav-label">${escapeHtml(label)}</span></button>`).join("")}
        </nav>
        <div class="header-actions">
          <div class="header-audio-control"><button class="icon-only header-audio-button ${app.audio.music && !app.audio.muted ? "active" : ""}" data-action="toggle-audio-menu" type="button" aria-label="Audio controls" aria-expanded="${app.audioMenuOpen ? "true" : "false"}">${icon(app.audio.muted ? "volume-off" : "music")}</button>${audioPopover()}</div>
          <button class="account-button" data-action="account-settings" type="button">${avatar(profile)}<span>${escapeHtml(displayName(profile))}</span>${icon("chev")}</button>
        </div>
      </header>
    `;
  }

  function authedShell(content, active = "dashboard") {
    return cockpitFrame(`${signedHeader(active)}<main class="signed-main">${content}</main>${profileModal()}${passwordModal()}${confirmationModal()}${mobileBottomNav(active)}`, `signed-frame view-${active}`);
  }

  function sideShell(active, content) {
    return cockpitFrame(`
      ${signedHeader(active)}
      <div class="side-layout top-shell-layout">
        <main class="side-content">${content}</main>
      </div>
      ${profileModal()}
      ${passwordModal()}
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
      ["dashboard", "Home", "dashboard", "home"],
      ["setup", "Mock Exam", "setup-page", "play"],
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
    const preset = avatarOption(profile?.avatar_preset);
    if (preset) return `<span class="avatar ${size} tone-account has-preset" aria-label="${escapeAttr(`${preset.name} avatar`)}"><span class="avatar-sprite" style="--avatar-x:${preset.x}%;--avatar-y:${preset.y}%" aria-hidden="true"></span></span>`;
    return `<span class="avatar ${size} tone-account" aria-label="Initials ${escapeAttr(label)}">${escapeHtml(label)}</span>`;
  }

  function avatarOption(value) {
    const index = Number(value || 0) - 1;
    const option = AVATAR_OPTIONS[index];
    return option ? {
      id: index + 1,
      name: option.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      column: index % 5,
      row: Math.floor(index / 5),
      x: AVATAR_SPRITE_COLUMNS[index % 5],
      y: AVATAR_SPRITE_ROWS[Math.floor(index / 5)]
    } : null;
  }

  function displayName(profile) {
    return String(profile?.nickname || profile?.name || "Account").trim() || "Account";
  }

  function profileModal() {
    if (app.modal !== "profile" && !(app.modal === "password" && app.modalReturn === "profile")) return "";
    const profile = app.profile;
    const selectedAvatar = app.accountAvatarDraft ?? Number(profile.avatar_preset || 0);
    const previewProfile = { ...profile, avatar_preset: selectedAvatar };
    return `
      <div class="modal-backdrop drawer-backdrop">
        <section class="profile-modal account-settings-modal command-drawer" role="dialog" aria-modal="true" aria-labelledby="account-settings-title" tabindex="-1" data-motion-purpose="modal-reveal">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          <div class="modal-heading">
            <h2 id="account-settings-title">Account Settings</h2>
            <p>Personalize your reviewer account and session.</p>
          </div>
          <form class="account-settings-form" data-form="profile">
            <div class="account-identity-preview">${avatar(previewProfile, "large")}<div><strong>${escapeHtml(displayName(profile))}</strong><small>${escapeHtml(profile.email)}</small></div></div>
            <fieldset class="avatar-picker"><legend>Choose an avatar</legend><div class="avatar-options">${AVATAR_OPTIONS.map((name, index) => {
              const preset = avatarOption(index + 1);
              return `<button class="avatar-option ${selectedAvatar === index + 1 ? "selected" : ""}" data-avatar-preset="${index + 1}" type="button" aria-label="Choose ${escapeAttr(name)} avatar" aria-pressed="${selectedAvatar === index + 1 ? "true" : "false"}"><span class="avatar-sprite" style="--avatar-x:${preset.x}%;--avatar-y:${preset.y}%" aria-hidden="true"></span></button>`;
            }).join("")}</div><small>Selection is applied after Save Changes.</small></fieldset>
            <div class="account-field-grid">
              <label>Nickname<input name="nickname" value="${escapeAttr(profile.nickname || firstName(profile.name))}" maxlength="24" placeholder="What should we call you?" /></label>
              <label>Full Name<input name="name" value="${escapeAttr(profile.name)}" required /></label>
              <label>Email Address <small>(used for sign-in)</small><input name="email" value="${escapeAttr(profile.email)}" disabled /></label>
            </div>
            <button class="account-command-row" data-action="open-password" type="button">${icon("key")}<span><strong>Change Password</strong><small>Open the secure password update flow</small></span>${icon("arrow")}</button>
            ${audioSettingsBlock()}
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

  function passwordModal() {
    if (app.modal !== "password") return "";
    return `
      <div class="modal-backdrop account-password-backdrop">
        <section class="password-modal" role="dialog" aria-modal="true" aria-labelledby="password-title" tabindex="-1" data-motion-purpose="modal-reveal">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          <p class="eyebrow">Account security</p>
          <h2 id="password-title">Change Password</h2>
          <p>Use your current password to confirm this change.</p>
          ${app.dialogError ? `<p class="form-error" role="alert">${escapeHtml(app.dialogError)}</p>` : ""}
          <form data-form="change-password" class="password-change-form">
            <label>Current Password<div class="field-with-icon has-toggle">${icon("key")}<input name="currentPassword" type="password" autocomplete="current-password" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
            <label>New Password<div class="field-with-icon has-toggle">${icon("key")}<input name="newPassword" type="password" minlength="8" autocomplete="new-password" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
            <label>Confirm New Password<div class="field-with-icon has-toggle">${icon("key")}<input name="confirmNewPassword" type="password" minlength="8" autocomplete="new-password" required /><button class="password-toggle" data-action="toggle-password" type="button" aria-label="Show password">${icon("eye")}</button></div></label>
            <div class="modal-actions"><button class="btn secondary" data-action="close-modal" type="button">Cancel</button><button class="btn primary" data-action="password-submit" type="button" ${app.busyAction === "password" ? "disabled" : ""}>${app.busyAction === "password" ? "Updating..." : "Update Password"}</button></div>
          </form>
        </section>
      </div>
    `;
  }

  function audioSettingsBlock() {
    const track = currentMusicTrack();
    return `<section class="account-audio-settings"><div class="audio-section-head"><strong>Audio</strong><small>Music starts only after you press Play.</small></div><div class="audio-category" role="group" aria-label="Music category">${[["cafe", "Cafe Jazz"], ["classical", "Classical"]].map(([key, label]) => `<button class="${app.audio.category === key ? "active" : ""}" data-audio-category="${key}" type="button" aria-pressed="${app.audio.category === key ? "true" : "false"}">${escapeHtml(label)}</button>`).join("")}</div><label class="audio-track-select">Track<select data-audio-track>${musicTracks().map((entry, index) => `<option value="${index}" ${index === app.audio.trackIndex ? "selected" : ""}>${escapeHtml(entry.title)} - ${escapeHtml(entry.artist)}</option>`).join("")}</select></label><div class="audio-transport" aria-label="Music controls"><button data-action="audio-previous" type="button" aria-label="Previous track">${icon("back")}</button><button class="audio-play ${app.audio.music ? "active" : ""}" data-action="toggle-music" type="button" aria-label="${app.audio.music ? "Pause" : "Play"} music">${icon(app.audio.music ? "pause" : "play")}</button><button data-action="audio-next" type="button" aria-label="Next track">${icon("arrow")}</button><button class="${app.audio.shuffle ? "active" : ""}" data-action="toggle-audio-shuffle" type="button" aria-label="Toggle shuffle" aria-pressed="${app.audio.shuffle ? "true" : "false"}">${icon("shuffle")}</button><button class="${app.audio.muted ? "active" : ""}" data-action="toggle-audio-mute" type="button" aria-label="Toggle mute" aria-pressed="${app.audio.muted ? "true" : "false"}">${icon(app.audio.muted ? "volume-off" : "volume")}</button></div><p class="audio-now-playing"><span>Selected</span><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></p><label>Music volume<input data-audio-volume="musicVolume" type="range" min="0" max="1" step="0.05" value="${escapeAttr(app.audio.musicVolume)}" /></label><div class="effects-control"><button class="audio-toggle ${app.audio.sfx ? "active" : ""}" data-action="toggle-sfx" type="button"><span>Interface effects<small>Navigation, selection, confirmation, warning</small></span><b>${app.audio.sfx ? "On" : "Off"}</b></button><label>Effects volume<input data-audio-volume="sfxVolume" type="range" min="0" max="1" step="0.05" value="${escapeAttr(app.audio.sfxVolume)}" /></label></div></section>`;
  }

  function pauseModal(attempt) {
    if (attempt.status !== "paused") return "";
    return `
      <div class="modal-backdrop static-backdrop" data-static-backdrop="true">
        <section class="pause-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title" tabindex="-1" data-motion-purpose="modal-reveal">
          <span class="pause-icon">${icon("pause")}</span>
          <p class="eyebrow">Checkpoint secured</p>
          <h2 id="pause-title">Exam Paused</h2>
          <div class="pause-facts"><span>${localIcon("timer")}<b>Time Remaining (Frozen)</b><strong>${formatDuration(timeRemaining(attempt))}</strong></span><span>${icon("flag")}<b>Current Checkpoint</b><strong>Item ${attempt.current_question_index + 1}</strong></span><span>${localIcon("cloud-check")}<b>Progress</b><strong>Checkpoint stored</strong></span></div>
          <p>Your progress has been saved.<br />Resume now or save and return Home.</p>
          <div class="pause-actions"><button class="btn primary" data-action="resume-paused" type="button">${icon("play")} Resume Exam</button><button class="btn secondary" data-action="save-exit" type="button">${icon("save")} Save and Exit</button></div>
        </section>
      </div>
    `;
  }

  function submitModal(attempt) {
    if (app.modal !== "submit") return "";
    return `
      <div class="modal-backdrop">
        <section class="submit-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title" tabindex="-1" data-motion-purpose="modal-reveal">
          <div class="submit-title-row"><span class="submit-danger-symbol">${icon("warning")}</span><div><p class="eyebrow">Final submission</p><h2 id="submit-title">Submit Exam?</h2></div></div>
          <p>You are about to submit this run. <strong>This action cannot be undone.</strong></p>
          <div class="submit-stats">
            <metric class="answered">${localIcon("circle-check")}<span>Answered</span><strong>${answeredCount(attempt)}</strong></metric>
            <metric class="unanswered">${icon("clear")}<span>Unanswered</span><strong>${unansweredCount(attempt)}</strong></metric>
            <metric class="skipped">${icon("skip")}<span>Skipped</span><strong>${skippedCount(attempt)}</strong></metric>
            <metric class="flagged">${icon("flag")}<span>Flagged</span><strong>${flaggedCount(attempt)}</strong></metric>
          </div>
          <div class="submit-warning">${icon("info")}<span>Review unanswered and flagged questions before submitting.</span></div>
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
    const presentation = stimulusPresentation(answer.stimulus);
    return `
      <div class="modal-backdrop chart-backdrop">
        <section class="chart-modal stimulus-modal ${presentation.className}" role="dialog" aria-modal="true" aria-label="Expanded ${presentation.noun}" tabindex="-1" data-motion-purpose="modal-reveal">
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
        <section class="timeout-modal" role="alertdialog" aria-modal="true" aria-labelledby="timeout-title" tabindex="-1" data-motion-purpose="modal-reveal">
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
        <section class="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" tabindex="-1" data-motion-purpose="modal-reveal">
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
        <section class="confirm-modal ${deletingAccount ? "account-delete-confirm" : "attempt-delete-confirm"}" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" tabindex="-1" data-motion-purpose="modal-reveal">
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
    const order = ["General Information", "Verbal Ability", "Numerical Ability", "Analytical Ability"];
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

  function renderQuestionPrompt(answer) {
    const prompt = String(answer?.prompt || "");
    const organization = /paragraph organization|pag-aayos ng talata|ayos ng talata/i.test(`${answer?.csc_skill || ""} ${answer?.subtopic || ""}`);
    if (!organization) return `<p class="prompt">${escapeHtml(prompt)}</p>`;
    const patterns = [/(?:^|\s)(IV|VI|V|III|II|I)\.\s+/g, /(?:^|\s)\((\d+)\)\s+/g];
    for (const pattern of patterns) {
      const markers = [...prompt.matchAll(pattern)];
      if (markers.length < 3) continue;
      const instruction = prompt.slice(0, markers[0].index).trim();
      const statements = markers.map((marker, index) => ({
        label: pattern === patterns[1] ? `(${marker[1]})` : `${marker[1]}.`,
        text: prompt.slice(marker.index + marker[0].length, markers[index + 1]?.index ?? prompt.length).trim()
      }));
      return `<div class="prompt ordering-prompt"><p>${escapeHtml(instruction)}</p><ol>${statements.map((statement) => `<li><b>${escapeHtml(statement.label)}</b><span>${escapeHtml(statement.text)}</span></li>`).join("")}</ol></div>`;
    }
    return `<p class="prompt">${escapeHtml(prompt)}</p>`;
  }

  function setupFact(iconName, tone, label, value) {
    return `<div class="instrument-cell ${escapeAttr(tone)}"><span class="instrument-icon">${localIcon(iconName)}</span><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
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
            <span><strong>${escapeHtml(examTitle(attempt))}</strong><small>${attempt.mode === "practice" ? "Practice" : "Mock Exam"} / ${formatDate(attempt.submitted_at || attempt.started_at)}</small></span>
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

  function toggleControl(name, label, checked, disabled = false) {
    return `
      <label class="toggle-row ${disabled ? "disabled" : ""}">${escapeHtml(label)}
        <input type="checkbox" name="${escapeAttr(name)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
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
      const previewAnswers = expandedFull ? groupAnswers : navPreviewAnswers(groupAnswers, attempt.current_question_index);
      const stimulusBody = renderStimulusNavigator(group, groupAnswers, attempt, expandedFull);
      return `
        <details class="question-group ${group.tone}" data-nav-section="${escapeAttr(group.section)}" ${navGroupOpen(group, hasCurrent) ? "open" : ""}>
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
            <div class="chip-grid">
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
    return SECTION_GROUPS;
  }

  function navGroupOpen(group, hasCurrent) {
    if (app.fixtureState === "exam") {
      return group.section === "General Information"
        || app.openNavGroups.has(group.section)
        || app.expandedNavGroups.has(group.section);
    }
    if (app.fixtureState === "graph") return group.section === "Numerical Ability";
    return hasCurrent || app.openNavGroups.has(group.section);
  }

  function renderStimulusNavigator(group, groupAnswers, attempt, expandedFull = false) {
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

    const stimulusGroups = new Map();
    for (const answer of groupAnswers) {
      const stimulusId = answer.stimulus?.id;
      if (!stimulusId) continue;
      if (!stimulusGroups.has(stimulusId)) stimulusGroups.set(stimulusId, []);
      stimulusGroups.get(stimulusId).push(answer);
    }
    const sharedStimulusIds = new Set(
      [...stimulusGroups.entries()].filter(([, items]) => items.length > 1).map(([stimulusId]) => stimulusId)
    );
    if (!sharedStimulusIds.size) return "";

    const blocks = [];
    const renderedStimuli = new Set();
    let individualItems = [];
    const flushIndividualItems = () => {
      if (!individualItems.length) return;
      blocks.push({ type: "individual", items: individualItems });
      individualItems = [];
    };
    for (const answer of groupAnswers) {
      const stimulusId = answer.stimulus?.id;
      if (!stimulusId || !sharedStimulusIds.has(stimulusId)) {
        individualItems.push(answer);
        continue;
      }
      flushIndividualItems();
      if (renderedStimuli.has(stimulusId)) continue;
      renderedStimuli.add(stimulusId);
      blocks.push({ type: "stimulus", items: stimulusGroups.get(stimulusId) });
    }
    flushIndividualItems();

    let stimulusIndex = 0;
    const labeledBlocks = blocks.map((block) => ({
      ...block,
      label: block.type === "individual"
        ? "Individual Items"
        : `${group.section === "Verbal Ability" ? "Reading Set" : "Data Set"} ${String.fromCharCode(65 + stimulusIndex++)}`
    }));
    const currentBlock = labeledBlocks.find((block) => block.items.some((item) => item.position === attempt.current_question_index)) || labeledBlocks[0];
    const visibleBlocks = expandedFull ? labeledBlocks : currentBlock ? [currentBlock] : [];
    return `
      <div class="stimulus-nav">
        ${visibleBlocks.map((block) => {
          const items = expandedFull ? block.items : navPreviewAnswers(block.items, attempt.current_question_index);
          const fullItems = block.items;
          const answered = fullItems.filter((item) => item.selected_choice).length;
          const range = `Questions ${fullItems[0].display_number}-${fullItems[fullItems.length - 1].display_number}`;
          return `
            <section class="stimulus-set open ${block.type === "individual" ? "individual-question-set" : "shared-question-set"}">
              <div class="stimulus-set-head"><strong>${block.label}</strong><span>${range}</span><em>${answered}/${fullItems.length} answered</em></div>
              <div class="chip-grid set-grid">${items.map((answer) => navChip(answer, attempt)).join("")}</div>
            </section>
          `;
        }).join("")}
        ${groupAnswers.length > 10 ? `<button class="question-chip more-chip navigator-disclosure" data-action="toggle-nav-full" data-nav-group="${escapeAttr(group.section)}" type="button">${expandedFull ? "Less" : "More"}</button>` : ""}
      </div>
    `;
  }

  function navPreviewAnswers(groupAnswers, currentIndex) {
    if (groupAnswers.length <= 10) return groupAnswers;
    const currentPosition = groupAnswers.findIndex((answer) => answer.position === currentIndex);
    const blockStart = currentPosition >= 0 ? Math.floor(currentPosition / 10) * 10 : 0;
    return groupAnswers.slice(blockStart, blockStart + 10);
  }

  function navChip(answer, attempt) {
    return `<button class="question-chip ${answerStatus(answer)} ${answer.flagged ? "flagged" : ""} ${answer.position === attempt.current_question_index ? "current" : ""}" data-goto="${answer.position}" type="button">${answer.display_number}</button>`;
  }

  function renderStimulusPanel(attempt, answer, linked, reviewMode = false) {
    const stimulus = answer.stimulus;
    if (!stimulus) return "";
    const presentation = stimulusPresentation(stimulus);
    const tableData = stimulusTableData(stimulus);
    const groupedChart = presentation.visual === "grouped-bars" ? renderGroupedBarChart(stimulus) : "";
    const seriesChart = ["bars", "line"].includes(presentation.visual) ? renderTabularSeriesChart(stimulus, presentation.visual) : "";
    const description = stimulus.description || stimulus.altText || stimulus.alt || "";
    const passage = presentation.visual === "passage"
      ? `<article class="passage-copy" aria-label="Passage text">${String(description).split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</article>`
      : "";
    const directTable = presentation.visual === "table" ? renderStimulusDataTable(tableData) : "";
    const exactValues = !["table", "passage"].includes(presentation.visual) ? renderExactValues(tableData) : "";
    return `
      <section class="stimulus-panel ${presentation.className}" data-stimulus-kind="${presentation.visual}">
        <header class="stimulus-head">
          <div>
            <span>${escapeHtml(stimulus.label || linked.label)}</span>
            <h2>${escapeHtml(stimulus.title || "Shared data set")}</h2>
            ${presentation.visual === "passage" ? "" : `<p>${escapeHtml(description)}</p>`}
          </div>
          ${reviewMode ? "" : `<button class="btn tiny" data-action="open-chart" type="button" aria-label="Open ${presentation.noun} in a larger view">${icon("open")} ${presentation.openLabel}</button>`}
        </header>
        <div class="stimulus-content">
          ${passage || groupedChart || seriesChart || directTable || `<p class="stimulus-fallback">${escapeHtml(description)}</p>`}
          ${exactValues}
        </div>
        <footer class="linked-items">
          <strong>${escapeHtml(linked.label)}</strong>
          <div>${linked.items.map((item) => `<button class="${item.position === attempt.current_question_index ? "active" : ""}" data-goto="${item.position}" type="button">${item.display_number}</button>`).join("")}</div>
          <p>These questions use the same ${presentation.noun}.</p>
        </footer>
      </section>
    `;
  }

  function stimulusPresentation(stimulus) {
    const kind = String(stimulus?.kind || "").toLowerCase();
    const chartType = String(stimulus?.chartType || "").toLowerCase();
    if (kind === "passage" || kind === "reading") return { visual: "passage", noun: "passage", openLabel: "Open Passage", className: "passage-stimulus" };
    if (chartType === "line" || kind === "line-table") return { visual: "line", noun: "graph", openLabel: "Open Graph", className: "line-stimulus" };
    if (chartType === "grouped-bars" || chartType === "bar") return { visual: "grouped-bars", noun: "chart", openLabel: "Open Chart", className: "grouped-stimulus" };
    if (kind === "bar-table") return { visual: "bars", noun: "chart", openLabel: "Open Chart", className: "bar-stimulus" };
    if (toArray(stimulus?.headers).length && toArray(stimulus?.rows).length) return { visual: "table", noun: "table", openLabel: "Open Table", className: "table-stimulus" };
    return { visual: "reference", noun: "reference", openLabel: "Open Reference", className: "reference-stimulus" };
  }

  function stimulusTableData(stimulus) {
    const headers = toArray(stimulus.headers);
    const rows = toArray(stimulus.rows);
    if (headers.length && rows.some((row) => toArray(row).length > 1)) return { headers, rows };
    const series = toArray(stimulus.series);
    if (!rows.length || !series.length) return { headers: [], rows: [] };
    return {
      headers: [stimulus.xLabel || "Category", ...series.map((entry) => entry.label)],
      rows: rows.map((row, index) => [row[0], ...series.map((entry) => toArray(entry.values)[index])])
    };
  }

  function renderStimulusDataTable(tableData) {
    if (!tableData.headers.length || !tableData.rows.length) return "";
    return `<div class="data-table-wrap" tabindex="0"><table><thead><tr>${tableData.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${tableData.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderExactValues(tableData) {
    const table = renderStimulusDataTable(tableData);
    return table ? `<details class="exact-values"><summary>Exact values</summary>${table}</details>` : "";
  }

  function stimulusSeries(stimulus) {
    const rows = toArray(stimulus.rows);
    const colors = ["#20d6d0", "#2f86ff", "#58d568", "#ffb020", "#a855f7"];
    const authored = toArray(stimulus.series).map((entry, index) => ({
      label: entry.label,
      color: entry.color || colors[index % colors.length],
      rawValues: toArray(entry.values),
      values: toArray(entry.values).map(Number)
    }));
    const headers = toArray(stimulus.headers);
    const derived = headers.slice(1).map((label, index) => ({
      label,
      color: colors[index % colors.length],
      rawValues: rows.map((row) => row[index + 1]),
      values: rows.map((row) => Number(row[index + 1]))
    }));
    const valid = (authored.length ? authored : derived).filter((entry) => entry.values.length === rows.length && entry.values.every(Number.isFinite));
    const legendLabels = toArray(stimulus.legend).map((entry) => String(entry).split(":").slice(1).join(":").trim().toLowerCase()).filter(Boolean);
    if (!legendLabels.length) return valid;
    const normalize = (value) => String(value).toLowerCase().replace(/\([^)]*\)/g, "").replace(/\b(line|bars?)\b/g, "").trim();
    const matched = valid.filter((entry) => legendLabels.some((label) => normalize(entry.label).includes(normalize(label)) || normalize(label).includes(normalize(entry.label))));
    return matched.length ? matched : valid;
  }

  function renderTabularSeriesChart(stimulus, visual) {
    const rows = toArray(stimulus.rows);
    const series = stimulusSeries(stimulus);
    if (!rows.length || !series.length) return "";
    if (visual === "line") return renderMultiLineChart(stimulus, series, rows);

    return `
      <div class="series-visual-grid bar-series-grid" role="group" aria-label="${escapeAttr(stimulus.altText || stimulus.alt || stimulus.title || "Data visualization")}">
        ${series.map((entry) => renderSeriesBars(entry, rows)).join("")}
      </div>
    `;
  }

  function renderSeriesBars(series, rows) {
    const max = Math.max(1, ...series.values.map((value) => Math.abs(value)));
    return `
      <section class="metric-series">
        <h3><i style="background:${escapeAttr(series.color)}"></i>${escapeHtml(series.label)}</h3>
        <div class="metric-bars">
          ${series.values.map((value, index) => `
            <div><span>${escapeHtml(rows[index][0])}</span><i><b style="width:${Math.max(4, Math.round((Math.abs(value) / max) * 100))}%;background:${escapeAttr(series.color)}"></b></i><strong>${escapeHtml(series.rawValues[index])}</strong></div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderMultiLineChart(stimulus, series, rows) {
    const values = series.flatMap((entry) => entry.values);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = Math.max(1, rawMax - rawMin);
    const roughStep = span / 5;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalizedStep = roughStep / magnitude;
    const step = (normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10) * magnitude;
    const min = Math.floor((rawMin - step * 0.35) / step) * step;
    const max = Math.ceil((rawMax + step * 0.35) / step) * step;
    const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => max - index * step);
    const width = 620;
    const height = 330;
    const plot = { left: 66, right: 20, top: 30, bottom: 64 };
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const formatNumber = (value) => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
    const xFor = (index) => rows.length === 1 ? plot.left + plotWidth / 2 : plot.left + (index * plotWidth) / (rows.length - 1);
    const yFor = (value) => plot.top + ((max - value) / Math.max(step, max - min)) * plotHeight;
    return `
      <div class="line-chart" role="group" aria-label="${escapeAttr(stimulus.altText || stimulus.alt || stimulus.title || "Line graph")}">
        <div class="chart-legend">${series.map((entry) => `<span><i style="background:${escapeAttr(entry.color)}"></i>${escapeHtml(entry.label)}</span>`).join("")}</div>
        <div class="line-chart-viewport" tabindex="0">
          <svg class="line-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img">
            <title>${escapeHtml(stimulus.title || "Line graph")}</title>
            <desc>${escapeHtml(stimulus.altText || stimulus.alt || "Values are labeled at every point.")}</desc>
            ${ticks.map((tick) => {
              const y = yFor(tick);
              return `<g class="chart-grid"><line x1="${plot.left}" y1="${y}" x2="${width - plot.right}" y2="${y}"></line><text x="${plot.left - 10}" y="${y + 4}" text-anchor="end">${formatNumber(tick)}</text></g>`;
            }).join("")}
            <text class="chart-axis-title chart-y-title" x="18" y="${plot.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 18 ${plot.top + plotHeight / 2})">${escapeHtml(stimulusAxisLabel(stimulus, series))}</text>
            ${series.map((entry) => {
              const points = entry.values.map((value, index) => ({ x: xFor(index), y: yFor(value), value }));
              return `<g class="line-series-path" data-series="${escapeAttr(entry.label)}"><polyline points="${points.map((point) => `${point.x},${point.y}`).join(" ")}" stroke="${escapeAttr(entry.color)}"></polyline>${points.map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${escapeAttr(entry.color)}"><title>${escapeHtml(`${entry.label}, ${rows[index][0]}: ${formatNumber(point.value)}`)}</title></circle><text class="chart-value" x="${point.x}" y="${Math.max(plot.top + 12, point.y - 9)}" text-anchor="middle">${formatNumber(point.value)}</text>`).join("")}</g>`;
            }).join("")}
            ${rows.map((row, index) => `<text class="chart-category" x="${xFor(index)}" y="${plot.top + plotHeight + 28}" text-anchor="middle">${escapeHtml(row[0])}</text>`).join("")}
            <text class="chart-axis-title chart-x-title" x="${plot.left + plotWidth / 2}" y="${height - 8}" text-anchor="middle">${escapeHtml(stimulus.xLabel || "")}</text>
          </svg>
        </div>
      </div>
    `;
  }

  function stimulusAxisLabel(stimulus, series) {
    if (stimulus.yLabel) return stimulus.yLabel;
    const unit = String(stimulus.description || "").match(/\bunit:\s*([^.;]+)/i)?.[1]?.trim();
    if (unit) return unit;
    const units = series.map((entry) => String(entry.label || "").match(/\(([^)]+)\)/)?.[1]?.trim()).filter(Boolean);
    return units.length && units.every((entry) => entry === units[0]) ? units[0] : "Reported value";
  }

  function renderGroupedBarChart(stimulus) {
    const rows = toArray(stimulus.rows);
    const series = toArray(stimulus.series);
    if (!rows.length || !series.length) return "";
    const values = series.flatMap((entry) => toArray(entry.values).map(Number).filter(Number.isFinite));
    const rawMax = Math.max(1, ...values);
    const roughStep = rawMax / 6;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalizedStep = roughStep / magnitude;
    const step = (normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10) * magnitude;
    const max = Math.ceil(rawMax / step) * step;
    const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, index) => index * step).reverse();
    const width = 560;
    const height = 330;
    const plot = { left: 58, right: 14, top: 24, bottom: 62 };
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const plotBottom = plot.top + plotHeight;
    const groupWidth = plotWidth / rows.length;
    const clusterWidth = Math.min(90, groupWidth * 0.76);
    const barGap = Math.min(6, clusterWidth * 0.06);
    const barWidth = Math.max(4, (clusterWidth - barGap * (series.length - 1)) / series.length);
    const formatNumber = (value) => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
    return `
      <div class="grouped-chart" role="group" aria-label="${escapeAttr(stimulus.alt || stimulus.title || "Grouped bar chart")}">
        <div class="chart-legend">${series.map((entry) => `<span><i style="background:${escapeAttr(entry.color)}"></i>${escapeHtml(entry.label)}</span>`).join("")}</div>
        <div class="grouped-chart-viewport" tabindex="0">
          <svg class="grouped-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img"
            aria-label="${escapeAttr(stimulus.alt || stimulus.title || "Grouped bar chart")}" data-plot-top="${plot.top}" data-plot-bottom="${plotBottom}">
            <title>${escapeHtml(stimulus.title || "Grouped bar chart")}</title>
            <desc>${escapeHtml(stimulus.alt || "Grouped values are labeled above each bar.")}</desc>
            ${ticks.map((tick) => {
              const y = plot.top + plotHeight - (tick / max) * plotHeight;
              return `<g class="chart-grid${tick === 0 ? " baseline" : ""}" data-value="${tick}"><line x1="${plot.left}" y1="${y}" x2="${width - plot.right}" y2="${y}"></line><text x="${plot.left - 10}" y="${y + 4}" text-anchor="end">${formatNumber(tick)}</text></g>`;
            }).join("")}
            <text class="chart-axis-title chart-y-title" x="17" y="${plot.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 17 ${plot.top + plotHeight / 2})">${escapeHtml(stimulus.yLabel || "")}</text>
            ${rows.map((row, rowIndex) => {
              const clusterX = plot.left + rowIndex * groupWidth + (groupWidth - clusterWidth) / 2;
              return `
                <g class="chart-group" data-row="${rowIndex}">
                  ${series.map((entry, seriesIndex) => {
                    const rawValue = Number(toArray(entry.values)[rowIndex]);
                    const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
                    const renderedHeight = value ? Math.max(2, (value / max) * plotHeight) : 0;
                    const x = clusterX + seriesIndex * (barWidth + barGap);
                    const y = plotBottom - renderedHeight;
                    return `<rect class="chart-bar" data-value="${value}" data-series="${escapeAttr(entry.label)}" x="${x}" y="${y}" width="${barWidth}" height="${renderedHeight}" rx="2" fill="${escapeAttr(entry.color)}"><title>${escapeHtml(`${entry.label}, ${row[0]}: ${formatNumber(value)}`)}</title></rect><text class="chart-value" x="${x + barWidth / 2}" y="${Math.max(plot.top + 11, y - 6)}" text-anchor="middle">${formatNumber(value)}</text>`;
                  }).join("")}
                  <text class="chart-category" x="${plot.left + rowIndex * groupWidth + groupWidth / 2}" y="${plotBottom + 27}" text-anchor="middle">${escapeHtml(row[0])}</text>
                </g>
              `;
            }).join("")}
            <text class="chart-axis-title chart-x-title" x="${plot.left + plotWidth / 2}" y="${height - 8}" text-anchor="middle">${escapeHtml(stimulus.xLabel || "")}</text>
          </svg>
        </div>
      </div>
    `;
  }

  function insightCard(title, value, detail) {
    return `<div class="insight-card"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></div>`;
  }

  function resultInsight(iconName, title, value, detail, tone) {
    return `<article class="result-insight ${escapeAttr(tone)}"><span>${localIcon(iconName)}</span><div><small>${escapeHtml(title)}</small><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></div></article>`;
  }

  function loadAudioPreferences() {
    const defaults = { music: false, sfx: false, musicVolume: 0.24, sfxVolume: 0.38, category: "cafe", trackIndex: 0, shuffle: true, muted: false };
    try {
      const saved = JSON.parse(localStorage.getItem(AUDIO_PREFS_KEY) || "null");
      const preferences = saved ? { ...defaults, ...saved } : defaults;
      preferences.music = Boolean(preferences.music);
      preferences.sfx = Boolean(preferences.sfx);
      preferences.shuffle = Boolean(preferences.shuffle);
      preferences.muted = Boolean(preferences.muted);
      preferences.category = MUSIC_LIBRARY[preferences.category] ? preferences.category : "cafe";
      preferences.trackIndex = Math.max(0, Math.min(MUSIC_LIBRARY[preferences.category].length - 1, Number(preferences.trackIndex) || 0));
      return preferences;
    } catch {
      return defaults;
    }
  }

  function saveAudioPreferences() {
    localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(app.audio));
  }

  function ensureAudioElements() {
    if (app.audioElements) return app.audioElements;
    const music = new Audio();
    music.loop = false;
    music.preload = "metadata";
    music.addEventListener("ended", () => nextMusicTrack(true));
    app.audioElements = { music };
    loadMusicTrack(false);
    updateAudioVolumes();
    return app.audioElements;
  }

  function updateAudioVolumes() {
    if (!app.audioElements) return;
    app.audioElements.music.volume = Math.max(0, Math.min(1, Number(app.audio.musicVolume) || 0));
    app.audioElements.music.muted = Boolean(app.audio.muted);
  }

  function syncBackgroundMusic() {
    if (!app.audio.music) return pauseBackgroundMusic();
    if (!app.audioUserGesture) return;
    const { music } = ensureAudioElements();
    loadMusicTrack(false);
    updateAudioVolumes();
    music.play().catch(() => {});
  }

  function pauseBackgroundMusic() {
    app.audioElements?.music.pause();
  }

  function musicTracks(category = app.audio.category) {
    return MUSIC_LIBRARY[category] || MUSIC_LIBRARY.cafe;
  }

  function currentMusicTrack() {
    const tracks = musicTracks();
    return tracks[Math.max(0, Math.min(tracks.length - 1, Number(app.audio.trackIndex) || 0))] || tracks[0];
  }

  function loadMusicTrack(autoplay = false) {
    const { music } = ensureAudioElements();
    const track = currentMusicTrack();
    if (music.dataset.trackSrc !== track.src) {
      music.dataset.trackSrc = track.src;
      music.src = track.src;
      music.load();
    }
    updateAudioVolumes();
    if (autoplay && app.audio.music && app.audioUserGesture) music.play().catch(() => {});
  }

  function setMusicCategory(category) {
    if (!MUSIC_LIBRARY[category] || category === app.audio.category) return;
    app.audio.category = category;
    app.audio.trackIndex = 0;
    app.audioHistory = [];
    app.audioShuffleBag = [];
    saveAudioPreferences();
    loadMusicTrack(app.audio.music);
    refreshAudioUi();
  }

  function selectMusicTrack(index) {
    const nextIndex = Math.max(0, Math.min(musicTracks().length - 1, Number(index) || 0));
    if (nextIndex !== app.audio.trackIndex) app.audioHistory.push(app.audio.trackIndex);
    app.audio.trackIndex = nextIndex;
    app.audioShuffleBag = app.audioShuffleBag.filter((item) => item !== nextIndex);
    saveAudioPreferences();
    loadMusicTrack(app.audio.music);
  }

  function nextMusicTrack(fromEnded = false) {
    const tracks = musicTracks();
    const current = Number(app.audio.trackIndex) || 0;
    app.audioHistory.push(current);
    let next;
    if (app.audio.shuffle) {
      if (!app.audioShuffleBag.length) {
        app.audioShuffleBag = tracks.map((_, index) => index).filter((index) => index !== current);
        for (let index = app.audioShuffleBag.length - 1; index > 0; index -= 1) {
          const swap = Math.floor(Math.random() * (index + 1));
          [app.audioShuffleBag[index], app.audioShuffleBag[swap]] = [app.audioShuffleBag[swap], app.audioShuffleBag[index]];
        }
      }
      next = app.audioShuffleBag.shift();
    } else {
      next = (current + 1) % tracks.length;
    }
    app.audio.trackIndex = next ?? ((current + 1) % tracks.length);
    saveAudioPreferences();
    loadMusicTrack(app.audio.music || fromEnded);
    refreshAudioUi();
  }

  function previousMusicTrack() {
    const previous = app.audioHistory.pop();
    app.audio.trackIndex = previous ?? ((Number(app.audio.trackIndex) - 1 + musicTracks().length) % musicTracks().length);
    saveAudioPreferences();
    loadMusicTrack(app.audio.music);
    refreshAudioUi();
  }

  function playSound(kind = "navigation") {
    if (!app.audio.sfx) return;
    const definitions = {
      navigation: [[420, 0.045, "sine", 0.035]],
      selection: [[620, 0.055, "triangle", 0.04], [820, 0.045, "triangle", 0.025]],
      confirmation: [[520, 0.07, "sine", 0.04], [780, 0.1, "sine", 0.035]],
      warning: [[220, 0.11, "triangle", 0.045], [180, 0.13, "triangle", 0.035]]
    };
    const sequence = definitions[kind] || definitions.navigation;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    app.audioContext ||= new AudioContextClass();
    const context = app.audioContext;
    if (context.state === "suspended") context.resume().catch(() => {});
    let offset = 0;
    for (const [frequency, duration, type, gainValue] of sequence) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + offset;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * app.audio.sfxVolume), start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
      offset += duration * 0.62;
    }
  }

  function toggleAudioMaster() {
    const enabled = !(app.audio.music || app.audio.sfx);
    app.audio.music = enabled;
    app.audio.sfx = enabled;
    saveAudioPreferences();
    refreshAudioUi();
    if (enabled) {
      app.audioUserGesture = true;
      playSound("confirmation");
      syncBackgroundMusic();
    } else {
      pauseBackgroundMusic();
    }
  }

  function audioPopover() {
    if (!app.audioMenuOpen) return "";
    const track = currentMusicTrack();
    return `
      <section class="audio-popover" aria-label="Audio settings" data-motion-purpose="popover-reveal">
        <div class="audio-popover-head">${icon("music")}<span><strong>Audio</strong><small>${escapeHtml(app.audio.category === "cafe" ? "Cafe Jazz" : "Classical")}</small></span></div>
        <p class="audio-popover-track"><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small></p>
        <div class="audio-transport compact"><button data-action="audio-previous" type="button" aria-label="Previous track">${icon("back")}</button><button class="audio-play ${app.audio.music ? "active" : ""}" data-action="toggle-music" type="button" aria-label="${app.audio.music ? "Pause" : "Play"} music">${icon(app.audio.music ? "pause" : "play")}</button><button data-action="audio-next" type="button" aria-label="Next track">${icon("arrow")}</button><button class="${app.audio.muted ? "active" : ""}" data-action="toggle-audio-mute" type="button" aria-label="Toggle mute">${icon(app.audio.muted ? "volume-off" : "volume")}</button></div>
        <label>Music volume<input data-audio-volume="musicVolume" type="range" min="0" max="1" step="0.05" value="${escapeAttr(app.audio.musicVolume)}" /></label>
        <button class="audio-toggle ${app.audio.sfx ? "active" : ""}" data-action="toggle-sfx" type="button"><span>Sound effects<small>Actions and results</small></span><b>${app.audio.sfx ? "On" : "Off"}</b></button>
        <label>Effects volume<input data-audio-volume="sfxVolume" type="range" min="0" max="1" step="0.05" value="${escapeAttr(app.audio.sfxVolume)}" /></label>
      </section>
    `;
  }

  function refreshAudioUi() {
    const active = document.activeElement;
    const focusAction = active?.dataset?.action || "";
    const focusCategory = active?.dataset?.audioCategory || "";
    const focusTrack = active?.matches?.("[data-audio-track]") || false;
    const drawer = root.querySelector(".account-settings-modal");
    const drawerScrollTop = drawer?.scrollTop || 0;
    root.querySelectorAll(".header-audio-control, .exam-audio-control").forEach((container) => {
      container.innerHTML = `<button class="icon-only header-audio-button ${app.audio.music && !app.audio.muted ? "active" : ""}" data-action="toggle-audio-menu" type="button" aria-label="Audio controls" aria-expanded="${app.audioMenuOpen ? "true" : "false"}">${icon(app.audio.muted ? "volume-off" : "music")}</button>${audioPopover()}`;
    });
    const accountAudio = root.querySelector(".account-audio-settings");
    if (accountAudio) accountAudio.outerHTML = audioSettingsBlock();
    requestAnimationFrame(() => {
      if (drawer) drawer.scrollTop = drawerScrollTop;
      const nextFocus = focusAction
        ? root.querySelector(`[data-action="${focusAction}"]`)
        : focusCategory
          ? root.querySelector(`[data-audio-category="${focusCategory}"]`)
          : focusTrack
            ? root.querySelector("[data-audio-track]")
            : null;
      nextFocus?.focus({ preventScroll: true });
    });
  }

  function refreshAvatarUi() {
    const selected = Number(app.accountAvatarDraft || 0);
    root.querySelectorAll("[data-avatar-preset]").forEach((button) => {
      const active = Number(button.dataset.avatarPreset) === selected;
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const preview = root.querySelector(".account-identity-preview > .avatar");
    if (preview) preview.outerHTML = avatar({ ...app.profile, avatar_preset: selected }, "large");
  }

  function handlePointerDown(event) {
    root.dataset.inputMode = "pointer";
    const paperCanvas = event.target.closest?.("canvas[data-paper-canvas]");
    if (paperCanvas && event.button === 0) {
      const pageIndex = Number(paperCanvas.dataset.paperCanvas);
      const scan = app.paperScans[pageIndex];
      if (!scan) return;
      const point = paperCanvasPoint(paperCanvas, event);
      const scale = paperCanvas.width / Math.max(1, paperCanvas.clientWidth);
      let handle = -1;
      let distance = Number.POSITIVE_INFINITY;
      scan.markers.forEach((marker, index) => {
        const candidate = Math.hypot(marker.x - point.x, marker.y - point.y);
        if (candidate < distance && candidate <= 30 * scale) {
          handle = index;
          distance = candidate;
        }
      });
      if (handle >= 0) {
        event.preventDefault();
        app.paperDrag = { pageIndex, handle, canvas: paperCanvas, pointerId: event.pointerId };
        paperCanvas.setPointerCapture?.(event.pointerId);
      }
      return;
    }
    const nav = event.target.closest(".exam-nav");
    if (!nav || event.button !== 0 || event.target.closest("button, summary, input, select, textarea, a")) return;
    app.examNavDrag = { nav, pointerId: event.pointerId, startY: event.clientY, startScroll: nav.scrollTop, moved: false };
    nav.classList.add("is-dragging");
    nav.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (app.paperDrag && app.paperDrag.pointerId === event.pointerId) {
      event.preventDefault();
      const { pageIndex, handle, canvas } = app.paperDrag;
      const scan = app.paperScans[pageIndex];
      const point = paperCanvasPoint(canvas, event);
      scan.markers[handle] = {
        x: Math.max(0, Math.min(scan.canvas.width - 1, point.x)),
        y: Math.max(0, Math.min(scan.canvas.height - 1, point.y))
      };
      scan.manuallyAdjusted = true;
      drawPaperAlignmentCanvas(pageIndex);
      return;
    }
    const drag = app.examNavDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > 4) drag.moved = true;
    if (!drag.moved) return;
    event.preventDefault();
    drag.nav.scrollTop = drag.startScroll - delta;
    app.examNavScrollTop = drag.nav.scrollTop;
  }

  function handlePointerUp(event) {
    if (app.paperDrag && (event.pointerId === undefined || app.paperDrag.pointerId === event.pointerId)) {
      app.paperDrag = null;
      return;
    }
    const drag = app.examNavDrag;
    if (!drag || (event.pointerId !== undefined && drag.pointerId !== event.pointerId)) return;
    drag.nav.classList.remove("is-dragging");
    app.examNavScrollTop = drag.nav.scrollTop;
    app.examNavDrag = null;
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
      if (formName === "forgot-password" || formName === "change-password") {
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
    if (action === "setup-submit") {
      const options = formOptions(target.closest("form"));
      active.options = { ...(active.options || {}), ...options };
      active.status = "in_progress";
      active.current_question_index = 0;
      app.fixtureState = options.paperMode ? "paper-exam" : "exam";
      app.modal = null;
      return setView({ name: "exam", attemptId: active.id }) || true;
    }
    if (action === "save-setup" || action === "resume-exam") {
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
      if (app.modal === "password" && app.modalReturn === "profile") {
        app.modal = "profile";
        app.modalReturn = null;
        return render() || true;
      }
      app.modal = null;
      app.modalReturn = null;
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
      active.status = "paused";
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
      const viewedAttempt = getAttempt(app.view.attemptId);
      const reviewAttempt = isPaperAttempt(viewedAttempt) ? viewedAttempt : submitted;
      return setView({ name: "review", attemptId: reviewAttempt.id, index: isPaperAttempt(reviewAttempt) ? 0 : 42 }) || true;
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
    if (action === "open-password") {
      app.modal = "password";
      app.modalReturn = "profile";
      return render() || true;
    }
    if (target.dataset.avatarPreset) {
      app.accountAvatarDraft = Number(target.dataset.avatarPreset);
      return render() || true;
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
    const target = event.target.closest("button, a[data-action]");
    if (!target) return;
    if (target.tagName === "A" && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    if (target.tagName === "A") event.preventDefault();
    const action = target.dataset.action;
    app.audioUserGesture = true;

    try {
      if (app.fixtureMode && handleFixtureClick(target, action)) return;
      if (target.dataset.audioCategory) return setMusicCategory(target.dataset.audioCategory);
      if (action === "toggle-audio-menu") {
        app.audioMenuOpen = !app.audioMenuOpen;
        refreshAudioUi();
        return syncBackgroundMusic();
      }
      if (action === "toggle-music") {
        app.audio.music = !app.audio.music;
        saveAudioPreferences();
        refreshAudioUi();
        return syncBackgroundMusic();
      }
      if (action === "toggle-sfx") {
        app.audio.sfx = !app.audio.sfx;
        saveAudioPreferences();
        refreshAudioUi();
        if (app.audio.sfx) playSound("confirmation");
        return;
      }
      if (action === "audio-previous") return previousMusicTrack();
      if (action === "audio-next") return nextMusicTrack();
      if (action === "toggle-audio-shuffle") {
        app.audio.shuffle = !app.audio.shuffle;
        app.audioShuffleBag = [];
        saveAudioPreferences();
        return refreshAudioUi();
      }
      if (action === "toggle-audio-mute") {
        app.audio.muted = !app.audio.muted;
        saveAudioPreferences();
        updateAudioVolumes();
        return refreshAudioUi();
      }
      if (action === "toggle-audio-master") return toggleAudioMaster();
      syncBackgroundMusic();
      if (!target.disabled && !target.dataset.choice && !["confirm-submit", "confirm-delete-account", "confirm-delete-attempt"].includes(action)) playSound("navigation");
      if (action === "reload-app") return location.reload();
      if (action === "toggle-password") return togglePasswordVisibility(target);
      if (action === "show-signin") return setView({ name: "signin" });
      if (action === "show-create") return setView({ name: "create" });
      if (action === "signup-submit") return await runBusy("create", () => signUp(formDataFromButton(target)));
      if (action === "signin-submit") return await runBusy("signin", () => signIn(formDataFromButton(target)));
      if (action === "setup-submit") return await startFullExam(formOptions(target.closest("form")));
      if (action === "print-paper-sheets") return printPaperSheets(target.closest("form"));
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
      if (action === "refresh-attempts") {
        await loadUserData();
        renderRecentAttempts();
        return showToast("Attempt records refreshed for this account.");
      }
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
      if (action === "open-password") return openModal("password");
      if (target.dataset.avatarPreset) {
        app.accountAvatarDraft = Number(target.dataset.avatarPreset);
        return refreshAvatarUi();
      }
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
      if (action === "open-paper-finish") return openModal("paper-finish");
      if (action === "confirm-paper-finish") return await freezePaperAttempt();
      if (action === "paper-save-exit") return await paperSaveAndExit();
      if (action === "retry-paper-sync") return await retryPaperSync();
      if (action === "rotate-paper-scan") return rotatePaperScan(Number(target.dataset.paperPage));
      if (action === "reset-paper-corners") return resetPaperCorners(Number(target.dataset.paperPage));
      if (action === "analyze-paper-sheets") return analyzePaperSheets();
      if (action === "paper-back-upload") return setPaperPhase("scanning");
      if (action === "confirm-paper-grade") return await confirmPaperGrade();
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
      if (target.dataset.paperAnswer) return setPaperDetectedAnswer(Number(target.dataset.paperAnswer), target.dataset.paperChoice || null);
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
    if (input.matches("[data-paper-file]")) return loadPaperScanFile(Number(input.dataset.paperFile), input.files?.[0]);
    if (input.matches("[data-paper-confirm-blanks]")) {
      app.paperBlankConfirmed = input.checked;
      return render();
    }
    if (input.matches("[data-audio-track]")) {
      selectMusicTrack(input.value);
      refreshAudioUi();
      return;
    }
    if (input.closest("[data-form='setup']")) {
      const form = input.closest("[data-form='setup']");
      const paper = form.elements.answerMode?.value === "paper";
      if (paper) {
        if (form.elements.shuffleQuestions) form.elements.shuffleQuestions.checked = false;
        if (form.elements.shuffleAnswers) form.elements.shuffleAnswers.checked = false;
      }
      saveSetupDraft(false).then(() => {
        if (input.name === "answerMode") renderSetup();
      }).catch((error) => showToast(readableError(error)));
    }
    const practiceForm = input.closest("[data-form='custom-practice']");
    if (practiceForm) syncPracticeProfile(practiceForm);
  }

  function handleInput(event) {
    const audioInput = event.target.closest("[data-audio-volume]");
    if (audioInput) {
      app.audio[audioInput.dataset.audioVolume] = Number(audioInput.value);
      updateAudioVolumes();
      saveAudioPreferences();
      return;
    }
    const input = event.target.closest("[data-delete-confirm]");
    if (!input) return;
    const button = input.closest("[role='alertdialog']")?.querySelector("[data-action='confirm-delete-account']");
    if (button) button.disabled = input.value.trim() !== "DELETE";
  }

  function handleDetailsToggle(event) {
    const details = event.target.closest?.("details.question-group[data-nav-section]");
    if (!details || !event.isTrusted) return;
    const section = details.dataset.navSection;
    if (details.open) app.openNavGroups.add(section);
    else app.openNavGroups.delete(section);
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
    if (event.key === "Tab") root.dataset.inputMode = "keyboard";
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
    if (!dialog && app.view.name === "exam" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      const editable = event.target.closest?.("input, textarea, select, button, summary, [contenteditable='true'], .audio-popover");
      if (!editable) {
        const attempt = getAttempt(app.view.attemptId);
        const answer = currentAnswer(attempt);
        const paperMode = isPaperAttempt(attempt);
        const choiceIndex = { Digit1: 0, Numpad1: 0, Digit2: 1, Numpad2: 1, Digit3: 2, Numpad3: 2, Digit4: 3, Numpad4: 3 }[event.code];
        if (!paperMode && choiceIndex !== undefined && answer?.choices?.[choiceIndex] && attempt?.status === "in_progress") {
          event.preventDefault();
          chooseAnswer(answer.choices[choiceIndex].id);
          return;
        }
        if (event.key === "Enter" && (paperMode || answer?.selected_choice) && attempt?.status === "in_progress") {
          event.preventDefault();
          if (answer.position >= attempt.total_questions - 1) openModal(paperMode ? "paper-finish" : "submit");
          else navigateQuestion(1);
          return;
        }
      }
    }
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
          nickname: firstName(data.name),
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
    const currentPassword = String(data.currentPassword || "");
    const newPassword = String(data.newPassword || "");
    if (newPassword.length < 8) throw new Error("Use at least 8 characters for the new password.");
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
    if (app.accountAvatarDraft !== null) updates.avatar_preset = app.accountAvatarDraft;
    const { data, error } = await app.client.from("profiles").update(updates).eq("user_id", app.session.user.id).select("*").single();
    if (error) throw error;
    const nickname = String(formData.nickname || "").trim() || firstName(updates.name);
    if (nickname.length > 24) throw new Error("Nickname must be 24 characters or fewer.");
    const metadata = { ...(app.session.user.user_metadata || {}), nickname, avatar_preset: app.accountAvatarDraft ?? Number(data.avatar_preset || 0), display_name: data.name };
    const authUpdate = await app.client.auth.updateUser({ data: metadata });
    if (authUpdate.error) throw authUpdate.error;
    app.session.user.user_metadata = metadata;
    app.profile = { ...data, nickname, avatar_preset: Number(metadata.avatar_preset || 0) };
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
    app.draft = { ...(app.draft || {}), options: { ...DEFAULT_OPTIONS, ...(app.draft?.options || {}), ...(attempt.options || {}), versionId: attempt.exam_version_id } };
    return setView({ name: "setup" });
  }

  async function repeatPractice() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    return startPractice(attempt.practice_category || "Verbal Ability", attempt.options?.count || attempt.total_questions || DEFAULT_PRACTICE_COUNT, attempt.options?.difficulty || "mixed");
  }

  async function practiceWeakestArea() {
    const attempt = getAttempt(app.view.attemptId);
    const weakest = performanceInsights(attempt).weakest?.section || "Verbal Ability";
    app.practiceCategoryDraft = weakest;
    app.practiceReviewTab = "practice";
    return setView({ name: "practice" });
  }

  function formOptions(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    const paperMode = values.answerMode === "paper";
    return {
      versionId: values.versionId || examVersions[0]?.id,
      showTimer: true,
      enablePause: true,
      shuffleQuestions: paperMode ? false : Boolean(values.shuffleQuestions),
      shuffleAnswers: paperMode ? false : Boolean(values.shuffleAnswers),
      paperMode,
      paperPhase: "answering"
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
      options: {
        ...(options || {}),
        timerClock: totalTimeSeconds ? { version: 1, elapsedAtAnchor: 0, anchoredAt: now } : null,
        telemetry: { version: 1, eventCount: 0, actionCounts: {}, visibility: { hiddenSeconds: 0, interruptions: 0 }, events: [] }
      },
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

  function ensureTelemetry(attempt) {
    attempt.options = { ...(attempt.options || {}) };
    attempt.options.telemetry = {
      version: 1,
      eventCount: 0,
      actionCounts: {},
      visibility: { hiddenSeconds: 0, interruptions: 0 },
      events: [],
      ...(attempt.options.telemetry || {})
    };
    return attempt.options.telemetry;
  }

  function recordAttemptEvent(attempt, type, data = {}) {
    if (!attempt) return;
    const telemetry = ensureTelemetry(attempt);
    const event = { type, at: nowIso(), questionId: currentAnswer(attempt)?.question_id || null, ...data };
    telemetry.events = [...toArray(telemetry.events), event].slice(-200);
    telemetry.eventCount = Number(telemetry.eventCount || 0) + 1;
    telemetry.actionCounts[type] = Number(telemetry.actionCounts[type] || 0) + 1;
    touchAttempt(attempt);
  }

  function recordVisibilityEvent(nextState) {
    const attempt = app.view.name === "exam" ? getAttempt(app.view.attemptId) : null;
    if (!attempt || attempt.status !== "in_progress") return;
    const now = performance.now();
    if (nextState === "hidden") materializeQuestionClock(attempt, now, true);
    const telemetry = ensureTelemetry(attempt);
    if (nextState === "hidden") {
      telemetry.visibility.interruptions = Number(telemetry.visibility.interruptions || 0) + 1;
      telemetry.visibility.hiddenStartedAt = nowIso();
      recordAttemptEvent(attempt, "visibility-hidden");
    } else {
      const hiddenAt = telemetry.visibility.hiddenStartedAt ? Date.parse(telemetry.visibility.hiddenStartedAt) : 0;
      if (hiddenAt) telemetry.visibility.hiddenSeconds = Number(telemetry.visibility.hiddenSeconds || 0) + Math.max(0, (Date.now() - hiddenAt) / 1000);
      delete telemetry.visibility.hiddenStartedAt;
      recordAttemptEvent(attempt, "visibility-visible");
    }
    app.visibilityStartedAt = now;
    attempt._lastQuestionTickMs = now;
    touchAttempt(attempt);
  }

  function ensureAttemptClock(attempt, at = Date.now()) {
    if (!attempt) return null;
    attempt.options = { ...(attempt.options || {}) };
    const existing = attempt.options.timerClock;
    if (existing && Number.isFinite(Number(existing.elapsedAtAnchor))) return existing;
    const elapsed = Math.max(0, Number(attempt.elapsed_seconds) || 0);
    attempt.options.timerClock = {
      version: 1,
      elapsedAtAnchor: elapsed,
      anchoredAt: attempt.status === "in_progress" ? new Date(at).toISOString() : null
    };
    return attempt.options.timerClock;
  }

  function effectiveElapsed(attempt, at = Date.now()) {
    if (!attempt) return 0;
    const clock = ensureAttemptClock(attempt, at);
    const stored = Math.max(0, Number(attempt.elapsed_seconds) || 0);
    if (attempt.status !== "in_progress" || !clock?.anchoredAt) return stored;
    const anchoredAt = Date.parse(clock.anchoredAt);
    if (!Number.isFinite(anchoredAt)) return stored;
    const elapsed = Number(clock.elapsedAtAnchor || 0) + Math.max(0, (at - anchoredAt) / 1000);
    return Math.max(stored, elapsed);
  }

  function materializeAttemptClock(attempt, at = Date.now(), keepRunning = attempt?.status === "in_progress") {
    if (!attempt) return 0;
    const max = Number(attempt.total_time_seconds) || Number.POSITIVE_INFINITY;
    const elapsed = Math.min(max, effectiveElapsed(attempt, at));
    attempt.elapsed_seconds = elapsed;
    attempt.options = { ...(attempt.options || {}), timerClock: { version: 1, elapsedAtAnchor: elapsed, anchoredAt: keepRunning ? new Date(at).toISOString() : null } };
    return elapsed;
  }

  function tickAttempt(attemptId) {
    const attempt = getAttempt(attemptId);
    if (!attempt || attempt.status !== "in_progress") return;
    const wallNow = Date.now();
    materializeAttemptClock(attempt, wallNow, true);
    materializeQuestionClock(attempt);
    touchAttempt(attempt);
    if (attempt.total_time_seconds && effectiveElapsed(attempt, wallNow) >= attempt.total_time_seconds) {
      beginTimeout(attempt);
      return;
    }
    updateExamTimerDom(attempt);
  }

  function materializeQuestionClock(attempt, at = performance.now(), countVisible = document.visibilityState === "visible") {
    if (!attempt) return 0;
    const last = Number(attempt._lastQuestionTickMs);
    attempt._lastQuestionTickMs = at;
    if (attempt.status !== "in_progress" || !countVisible || !Number.isFinite(last)) return 0;
    const delta = Math.max(0, Math.min(2.5, (at - last) / 1000));
    const answer = currentAnswer(attempt);
    if (!answer || delta <= 0) return 0;
    answer.time_spent_seconds += delta;
    answer.last_seen_at = nowIso();
    touchAnswer(attempt, answer.question_id);
    return delta;
  }

  function updateExamTimerDom(attempt) {
    const timer = document.querySelector(".exam-time-value");
    const answered = document.querySelector(".exam-answered-value");
    if (timer && attempt.options?.showTimer !== false) timer.textContent = formatDuration(timeRemaining(attempt));
    if (answered) answered.textContent = String(answeredCount(attempt));
  }

  function beginTimeout(attempt) {
    if (isPaperAttempt(attempt)) {
      freezePaperAttempt(true);
      return;
    }
    if (app.modal === "timeout") return;
    app.modal = "timeout";
    renderExam();
    setTimeout(() => submitAttempt(attempt, true), 900);
  }

  async function freezePaperAttempt(timedOut = false) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || !isPaperAttempt(attempt)) return;
    materializeQuestionClock(attempt);
    materializeAttemptClock(attempt, Date.now(), false);
    attempt.status = "paused";
    attempt.paused_at = nowIso();
    attempt.timed_out = Boolean(timedOut);
    attempt.options = {
      ...(attempt.options || {}),
      paperMode: true,
      paperPhase: "scanning",
      paperFrozenAt: nowIso(),
      paperTimedOut: Boolean(timedOut)
    };
    recordAttemptEvent(attempt, timedOut ? "paper-timeout-frozen" : "paper-finish-frozen");
    touchAttempt(attempt);
    app.modal = null;
    try {
      await flushDirty({ immediate: true, throwOnError: true });
      app.paperSyncError = "";
    } catch (error) {
      app.paperSyncError = readableError(error);
    }
    renderExam();
  }

  async function retryPaperSync() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    touchAttempt(attempt);
    try {
      await flushDirty({ immediate: true, throwOnError: true });
      app.paperSyncError = "";
      showToast("Frozen checkpoint saved online.");
    } catch (error) {
      app.paperSyncError = readableError(error);
      render();
    }
  }

  async function paperSaveAndExit() {
    const attempt = getAttempt(app.view.attemptId);
    if (attempt) {
      touchAttempt(attempt);
      await flushDirty({ immediate: true, throwOnError: true });
    }
    setView({ name: "dashboard" });
  }

  function setPaperPhase(phase) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || !isPaperAttempt(attempt)) return;
    attempt.options = { ...(attempt.options || {}), paperPhase: phase };
    touchAttempt(attempt);
    renderExam();
  }

  function printPaperSheets(form) {
    const toolkit = window.CSC_PAPER_MODE;
    if (!toolkit) throw new Error("Paper sheet tools are unavailable.");
    const formVersionId = form ? formOptions(form).versionId : null;
    const attempt = app.view.name === "exam" ? getAttempt(app.view.attemptId) : null;
    const versionId = formVersionId || attempt?.exam_version_id || app.draft?.options?.versionId;
    const version = examVersions.find((candidate) => candidate.id === versionId) || examVersions[0];
    const label = `Mock Exam ${String(version?.number || 1).padStart(2, "0")}`;
    document.querySelector(".paper-print-root")?.remove();
    const printRoot = document.createElement("section");
    printRoot.className = "paper-print-root";
    printRoot.setAttribute("aria-hidden", "true");
    for (let pageIndex = 0; pageIndex < 2; pageIndex += 1) {
      const canvas = document.createElement("canvas");
      canvas.className = "paper-print-page";
      toolkit.drawSheet(canvas, pageIndex, label);
      printRoot.appendChild(canvas);
    }
    document.body.appendChild(printRoot);
    const cleanup = () => {
      window.removeEventListener("afterprint", cleanup);
      printRoot.remove();
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  async function loadPaperScanFile(pageIndex, file) {
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) {
      showToast("Choose a JPG or PNG image.");
      return;
    }
    if (file.size > 24 * 1024 * 1024) {
      showToast("That image is larger than 24 MB. Export a smaller JPG or PNG.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      let canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0);
      bitmap.close?.();
      const orientationImage = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
      const orientation = window.CSC_PAPER_MODE.orientationTurns(orientationImage);
      const turns = orientation.confidence >= 0.2 ? orientation.turns : canvas.width > canvas.height ? 1 : 0;
      for (let turn = 0; turn < turns; turn += 1) canvas = rotateCanvasClockwise(canvas);
      const detectionCanvas = document.createElement("canvas");
      const scale = Math.min(1, 520 / Math.max(canvas.width, canvas.height));
      detectionCanvas.width = Math.max(1, Math.round(canvas.width * scale));
      detectionCanvas.height = Math.max(1, Math.round(canvas.height * scale));
      detectionCanvas.getContext("2d", { alpha: false }).drawImage(canvas, 0, 0, detectionCanvas.width, detectionCanvas.height);
      const detection = window.CSC_PAPER_MODE.detectMarkers(detectionCanvas.getContext("2d").getImageData(0, 0, detectionCanvas.width, detectionCanvas.height));
      const markers = detection.points.map((point) => ({ x: point.x / scale, y: point.y / scale }));
      app.paperScans[pageIndex] = { canvas, markers, alignmentConfidence: detection.confidence, orientationConfidence: orientation.confidence, manuallyAdjusted: false, fileName: file.name };
      app.paperDetections = [];
      app.paperBlankConfirmed = false;
      render();
    } catch (error) {
      showToast(`Could not read that image: ${readableError(error)}`);
    }
  }

  function rotateCanvasClockwise(source) {
    const canvas = document.createElement("canvas");
    canvas.width = source.height;
    canvas.height = source.width;
    const context = canvas.getContext("2d", { alpha: false });
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
    context.drawImage(source, 0, 0);
    return canvas;
  }

  function rotatePaperScan(pageIndex) {
    const scan = app.paperScans[pageIndex];
    if (!scan) return;
    scan.canvas = rotateCanvasClockwise(scan.canvas);
    scan.markers = window.CSC_PAPER_MODE.defaultMarkers(scan.canvas.width, scan.canvas.height);
    scan.alignmentConfidence = 0;
    scan.manuallyAdjusted = false;
    app.paperDetections = [];
    render();
  }

  function resetPaperCorners(pageIndex) {
    const scan = app.paperScans[pageIndex];
    if (!scan) return;
    scan.markers = window.CSC_PAPER_MODE.defaultMarkers(scan.canvas.width, scan.canvas.height);
    scan.alignmentConfidence = 0;
    scan.manuallyAdjusted = false;
    drawPaperAlignmentCanvas(pageIndex);
  }

  function paperCanvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scan = app.paperScans[Number(canvas.dataset.paperCanvas)];
    return {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * scan.canvas.width,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * scan.canvas.height
    };
  }

  function renderPaperScanCanvases() {
    app.paperScans.forEach((scan, pageIndex) => {
      if (scan) drawPaperAlignmentCanvas(pageIndex);
    });
  }

  function drawPaperAlignmentCanvas(pageIndex) {
    const scan = app.paperScans[pageIndex];
    const canvas = root.querySelector(`canvas[data-paper-canvas='${pageIndex}']`);
    if (!scan || !canvas) return;
    canvas.width = scan.canvas.width;
    canvas.height = scan.canvas.height;
    const context = canvas.getContext("2d", { alpha: false });
    context.drawImage(scan.canvas, 0, 0);
    context.save();
    context.strokeStyle = "#00e6df";
    context.fillStyle = "rgba(0, 230, 223, 0.18)";
    context.lineWidth = Math.max(4, scan.canvas.width / 350);
    context.beginPath();
    scan.markers.forEach((marker, index) => index ? context.lineTo(marker.x, marker.y) : context.moveTo(marker.x, marker.y));
    context.closePath();
    context.fill();
    context.stroke();
    scan.markers.forEach((marker, index) => {
      const radius = Math.max(18, scan.canvas.width / 60);
      context.fillStyle = "#00e6df";
      context.beginPath();
      context.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#001319";
      context.font = `800 ${Math.max(18, scan.canvas.width / 62)}px Arial`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), marker.x, marker.y);
    });
    context.restore();
  }

  function analyzePaperSheets() {
    if (!app.paperScans.every(Boolean)) return;
    try {
      app.paperDetections = app.paperScans.flatMap((scan, pageIndex) => {
        const context = scan.canvas.getContext("2d", { willReadFrequently: true });
        const imageData = context.getImageData(0, 0, scan.canvas.width, scan.canvas.height);
        return window.CSC_PAPER_MODE.analyze(imageData, scan.markers, pageIndex);
      }).sort((left, right) => left.number - right.number);
      app.paperBlankConfirmed = false;
      setPaperPhase("review");
    } catch (error) {
      showToast(`Recognition could not run: ${readableError(error)}`);
    }
  }

  function normalizedPaperDetections() {
    const byNumber = new Map(app.paperDetections.map((item) => [item.number, item]));
    return Array.from({ length: 170 }, (_, index) => byNumber.get(index + 1) || { number: index + 1, choice: null, state: "blank", confidence: 0, reviewed: false });
  }

  function paperDetectionSummary(detections) {
    return detections.reduce((summary, item) => {
      summary[item.state] = Number(summary[item.state] || 0) + 1;
      return summary;
    }, { confident: 0, blank: 0, multiple: 0, low: 0 });
  }

  function setPaperDetectedAnswer(number, choice) {
    const detections = normalizedPaperDetections();
    const item = detections[number - 1];
    if (!item) return;
    item.choice = choice || null;
    item.state = choice ? "confident" : "blank";
    item.confidence = 1;
    item.reviewed = true;
    app.paperDetections = detections;
    app.paperBlankConfirmed = false;
    render();
  }

  async function confirmPaperGrade() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || !isPaperAttempt(attempt)) return;
    const detections = normalizedPaperDetections();
    const unresolved = detections.filter((item) => (item.state === "multiple" || item.state === "low") && !item.reviewed);
    const blanks = detections.filter((item) => !item.choice);
    if (unresolved.length) throw new Error(`Review ${unresolved.length} uncertain mark${unresolved.length === 1 ? "" : "s"} before grading.`);
    if (blanks.length && !app.paperBlankConfirmed) throw new Error("Confirm the intentional blank answers before grading.");
    const byDisplay = new Map(Object.values(attempt.answers).map((answer) => [answer.display_number, answer]));
    const importedAt = nowIso();
    for (const detection of detections) {
      const answer = byDisplay.get(detection.number);
      if (!answer) continue;
      answer.selected_choice = detection.choice || null;
      answer.skipped = !detection.choice;
      answer.first_answered_at = detection.choice ? importedAt : null;
      answer.last_answered_at = detection.choice ? importedAt : null;
      answer.answer_changes = 0;
      answer.changed_wrong_to_correct = 0;
      answer.changed_correct_to_wrong = 0;
      answer.answer_history = [{ action: "paper-import", choice: detection.choice || null, at: importedAt }];
      touchAnswer(attempt, answer.question_id);
    }
    attempt.options = { ...(attempt.options || {}), paperPhase: "submitting", paperImportedAt: importedAt, paperBlankCount: blanks.length };
    recordAttemptEvent(attempt, "paper-answers-confirmed", { blanks: blanks.length });
    touchAttempt(attempt);
    await flushDirty({ immediate: true, throwOnError: true });
    attempt.options = { ...(attempt.options || {}), paperPhase: "submitted" };
    await submitAttempt(attempt, Boolean(attempt.options?.paperTimedOut));
    app.paperScans = [null, null];
    app.paperDetections = [];
    app.paperBlankConfirmed = false;
  }

  function seedPaperReviewFixture() {
    app.paperDetections = Array.from({ length: 170 }, (_, index) => {
      const number = index + 1;
      if (number % 41 === 0) return { number, choice: null, state: "multiple", confidence: 0, reviewed: false };
      if (number % 29 === 0) return { number, choice: "B", state: "low", confidence: 0.52, reviewed: false };
      if (number % 23 === 0) return { number, choice: null, state: "blank", confidence: 0.9, reviewed: false };
      return { number, choice: ["A", "B", "C", "D"][number % 4], state: "confident", confidence: 0.94, reviewed: false };
    });
  }

  function syncPaperSubmissionPoll(attempt) {
    if (app.fixtureMode || !app.client || !app.session?.user?.id || !isPaperAttempt(attempt) || !["scanning", "review"].includes(paperPhase(attempt))) return;
    clearInterval(app.paperPollId);
    app.paperPollId = setInterval(async () => {
      try {
        const { data, error } = await app.client.from("attempts").select("status,submitted_at,score,percent,options,updated_at").eq("id", attempt.id).eq("user_id", app.session.user.id).single();
        if (error) throw error;
        if (data.status === "submitted" || data.status === "timed_out") {
          await loadUserData();
          setView({ name: "results", attemptId: attempt.id });
        }
      } catch {
        // The frozen local attempt remains recoverable; the normal sync warning handles failures.
      }
    }, PAPER_POLL_INTERVAL_MS);
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
    answer.answer_history = [...toArray(answer.answer_history), { action: "select", choice, at: answer.last_answered_at }];
    recordAttemptEvent(attempt, "answer-selected", { choice, previousChoice: previous || null });
    touchAnswer(attempt, answer.question_id);
    touchAttempt(attempt);
    playSound("selection");
    renderExam();
  }

  function clearAnswer() {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!answer || attempt.status !== "in_progress") return;
    answer.selected_choice = null;
    answer.last_answered_at = nowIso();
    answer.answer_history = [...toArray(answer.answer_history), { action: "clear", at: answer.last_answered_at }];
    recordAttemptEvent(attempt, "answer-cleared");
    touchAnswer(attempt, answer.question_id);
    renderExam();
  }

  function skipQuestion() {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!answer || attempt.status !== "in_progress") return;
    answer.skipped = true;
    recordAttemptEvent(attempt, "skip");
    touchAnswer(attempt, answer.question_id);
    if (answer.position < attempt.total_questions - 1) gotoQuestion(answer.position + 1);
    else renderExam();
  }

  function toggleFlag() {
    const attempt = getAttempt(app.view.attemptId);
    const answer = currentAnswer(attempt);
    if (!answer) return;
    answer.flagged = !answer.flagged;
    recordAttemptEvent(attempt, answer.flagged ? "flag" : "unflag");
    touchAnswer(attempt, answer.question_id);
    renderExam();
  }

  function navigateQuestion(delta) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    const answer = currentAnswer(attempt);
    if (delta > 0 && answer && !answer.selected_choice && !isPaperAttempt(attempt)) {
      showToast("Choose an answer or use Skip.");
      return;
    }
    gotoQuestion(Math.min(Math.max(0, attempt.current_question_index + delta), attempt.total_questions - 1), delta > 0 ? "next" : "previous");
  }

  function gotoQuestion(index, source = "chip") {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || index < 0 || index >= attempt.total_questions) return;
    materializeQuestionClock(attempt);
    recordAttemptEvent(attempt, "navigate", { source, from: attempt.current_question_index, to: index });
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
    materializeQuestionClock(attempt);
    materializeAttemptClock(attempt, Date.now(), false);
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
    materializeAttemptClock(attempt, Date.now(), true);
    touchAttempt(attempt);
    if (!app.fixtureMode && app.client && app.session?.user?.id) {
      await app.client.from("pause_events").update({ resumed_at: nowIso() }).eq("attempt_id", attempt.id).is("resumed_at", null);
    }
    await flushDirty({ immediate: true });
    renderExam();
  }

  async function saveAndExit() {
    const attempt = getAttempt(app.view.attemptId);
    if (attempt && attempt.status === "in_progress") {
      materializeQuestionClock(attempt);
      materializeAttemptClock(attempt, Date.now(), false);
      attempt.status = "paused";
      attempt.paused_at = nowIso();
      recordAttemptEvent(attempt, "save-and-exit");
      touchAttempt(attempt);
    }
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
    materializeQuestionClock(attempt);
    materializeAttemptClock(attempt, Date.now(), false);
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
    persistAttemptRecovery(attempt);
    scheduleFlush();
  }

  function scheduleFlush() {
    if (app.syncTimer) return;
    app.syncTimer = setTimeout(() => {
      app.syncTimer = null;
      flushDirty();
    }, SYNC_INTERVAL_MS);
  }

  async function flushDirty(options = {}) {
    if (!app.client) return;
    if (app.flushing) {
      await new Promise((resolve) => {
        const waitForFlush = () => app.flushing ? setTimeout(waitForFlush, 10) : resolve();
        waitForFlush();
      });
    }
    if (!app.dirtyAttempts.size && !app.dirtyAnswers.size) return;
    app.flushing = true;
    clearTimeout(app.syncTimer);
    app.syncTimer = null;
    let attemptsToSync = [];
    let answerKeys = [];
    let syncSucceeded = false;
    try {
      attemptsToSync = Array.from(app.dirtyAttempts).map(getAttempt).filter(Boolean);
      answerKeys = Array.from(app.dirtyAnswers);
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
          options: attempt.options || {},
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
      syncSucceeded = true;
    } catch (error) {
      attemptsToSync.forEach((attempt) => app.dirtyAttempts.add(attempt.id));
      answerKeys.forEach((key) => app.dirtyAnswers.add(key));
      if (!options.immediate) scheduleFlush();
      if (!options.immediate) showToast(`Sync issue: ${readableError(error)}`);
      if (options.throwOnError) throw error;
    } finally {
      app.flushing = false;
      if (syncSucceeded) {
        const syncedAttemptIds = new Set([
          ...attemptsToSync.map((attempt) => attempt.id),
          ...answerKeys.map((key) => key.split("|")[0])
        ]);
        syncedAttemptIds.forEach((attemptId) => {
          const hasPendingAttempt = app.dirtyAttempts.has(attemptId);
          const hasPendingAnswer = Array.from(app.dirtyAnswers).some((key) => key.startsWith(`${attemptId}|`));
          if (!hasPendingAttempt && !hasPendingAnswer) clearAttemptRecovery(attemptId);
        });
      }
      if (app.dirtyAttempts.size || app.dirtyAnswers.size) scheduleFlush();
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
    const presentation = stimulusPresentation(answer.stimulus);
    return {
      label: answer.stimulus?.label || (items.length > 1 ? `${presentation.noun[0].toUpperCase()}${presentation.noun.slice(1)} for Items ${items[0].display_number}-${items[items.length - 1].display_number}` : "Reference"),
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
    return Math.max(0, attempt.total_time_seconds - effectiveElapsed(attempt));
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

  function selectRunInsights(attempt) {
    const answers = Object.values(attempt.answers).sort(byPosition);
    const summary = performanceInsights(attempt);
    const stats = sectionStats(attempt);
    const topicStats = groupedAnswerStats(answers, (answer) => answer.subtopic || answer.csc_skill || "Other").filter((row) => row.total >= 3);
    const difficultyStats = groupedAnswerStats(answers, (answer) => statusLabel(answer.difficulty || "mixed")).filter((row) => row.total >= 3);
    const topicAscending = topicStats.slice().sort((left, right) => left.percent - right.percent || right.total - left.total || left.label.localeCompare(right.label));
    const topicDescending = topicAscending.slice().reverse();
    const isPractice = attempt.mode === "practice";
    const candidates = [];
    const add = (entry, condition = true) => {
      if (condition && entry?.value !== undefined && entry?.value !== null && String(entry.value).trim()) candidates.push(entry);
    };

    if (isPractice) {
      add({ icon: "target", title: "Focus Topic", value: topicAscending[0]?.label, detail: `${Math.round(topicAscending[0]?.percent || 0)}% across ${topicAscending[0]?.total || 0} items`, tone: "red" }, topicAscending.length > 1);
      add({ icon: "trophy", title: "Strong Topic", value: topicDescending[0]?.label, detail: `${Math.round(topicDescending[0]?.percent || 0)}% across ${topicDescending[0]?.total || 0} items`, tone: "green" }, topicDescending.length > 1);
      const difficulty = difficultyStats.slice().sort((left, right) => left.percent - right.percent || left.label.localeCompare(right.label))[0];
      add({ icon: "brain-circuit", title: "Difficulty Check", value: difficulty?.label, detail: `${Math.round(difficulty?.percent || 0)}% across ${difficulty?.total || 0} items`, tone: "purple" }, Boolean(difficulty));
    } else {
      add({ icon: "target", title: "Weakest Section", value: summary.weakest?.section, detail: `${Math.round(summary.weakest?.percent || 0)}% accuracy`, tone: "red" }, Boolean(summary.weakest));
      add({ icon: "trophy", title: "Strongest Section", value: summary.strongest?.section, detail: `${Math.round(summary.strongest?.percent || 0)}% accuracy`, tone: "green" }, Boolean(summary.strongest));
      add({ icon: "notebook-tabs", title: "Most Missed Topic", value: topicAscending[0]?.label, detail: `${topicAscending[0]?.total - topicAscending[0]?.correct} missed of ${topicAscending[0]?.total}`, tone: "purple" }, Boolean(topicAscending[0]));
    }

    add({ icon: "timer", title: "Fastest Question", value: formatDuration(summary.fastest?.time_spent_seconds), detail: `Item ${summary.fastest?.display_number}`, tone: "cyan" }, Boolean(summary.fastest));
    add({ icon: "timer", title: "Longest Question", value: formatDuration(summary.slowest?.time_spent_seconds), detail: `Item ${summary.slowest?.display_number}`, tone: "amber" }, Boolean(summary.slowest));
    add({ icon: "brain-circuit", title: "Answer Changes", value: String(summary.changed), detail: `${summary.wrongToCorrect} improved / ${summary.correctToWrong} lost`, tone: "purple" }, !isPaperAttempt(attempt));
    add({ icon: "notebook-tabs", title: "Review Load", value: `${skippedCount(attempt) + unansweredCount(attempt) + flaggedCount(attempt)}`, detail: `${skippedCount(attempt)} skipped / ${flaggedCount(attempt)} flagged`, tone: "blue" });
    add({ icon: "circle-check", title: "Longest Correct Streak", value: String(longestCorrectStreak(answers)), detail: "Consecutive correct answers", tone: "green" });
    add({ icon: "target", title: "Coverage", value: `${answeredCount(attempt)} / ${attempt.total_questions}`, detail: unansweredCount(attempt) ? `${unansweredCount(attempt)} unanswered` : "Every item answered", tone: "cyan" });
    if (attempt.total_time_seconds) {
      const unused = Math.max(0, attempt.total_time_seconds - Number(attempt.elapsed_seconds || 0));
      add({ icon: "timer", title: unused > 0 ? "Time Remaining" : "Time Used", value: formatDuration(unused > 0 ? unused : attempt.elapsed_seconds), detail: unused > 0 ? "Unused at submission" : "Full timer used", tone: "amber" });
    }
    add({ icon: "target", title: "Overall Accuracy", value: `${Math.round(resultPercent(attempt))}%`, detail: `${scoreAttempt(attempt)} of ${attempt.total_questions} correct`, tone: "cyan" });
    add({ icon: "history", title: "Questions Visited", value: String(visitedCount(attempt)), detail: `${Math.max(0, attempt.total_questions - visitedCount(attempt))} not revisited`, tone: "blue" });

    const selected = [];
    const seen = new Set();
    for (const candidate of candidates) {
      if (seen.has(candidate.title)) continue;
      seen.add(candidate.title);
      selected.push(candidate);
      if (selected.length === 6) break;
    }
    return selected;
  }

  function groupedAnswerStats(answers, labelFor) {
    const groups = new Map();
    for (const answer of answers) {
      const label = String(labelFor(answer) || "Other").trim() || "Other";
      const row = groups.get(label) || { label, total: 0, correct: 0 };
      row.total += 1;
      if (answer.selected_choice === answer.correct_choice) row.correct += 1;
      groups.set(label, row);
    }
    return [...groups.values()].map((row) => ({ ...row, percent: row.total ? (row.correct / row.total) * 100 : 0 }));
  }

  function longestCorrectStreak(answers) {
    let best = 0;
    let current = 0;
    for (const answer of answers) {
      if (answer.selected_choice === answer.correct_choice) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
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
    if (attempt.mode === "practice") return attempt.title || `${sectionLabel(attempt.practice_category || "Verbal Ability")} Practice`;
    const version = examVersions.find((candidate) => candidate.id === attempt.exam_version_id);
    const fallbackNumber = String(attempt.title || "").match(/(?:version|mock)\s*(\d+)/i)?.[1];
    const number = version?.number || fallbackNumber;
    return number ? `Mock Exam ${String(number).padStart(2, "0")}` : "Mock Exam";
  }

  function sectionLabel(section) {
    return SECTION_GROUPS.find((group) => group.section === section)?.label || section;
  }

  function firstName(value) {
    return String(value || "Reviewer").trim().split(/\s+/)[0] || "Reviewer";
  }

  function toneForSection(section) {
    return SECTION_GROUPS.find((group) => group.section === section)?.tone || "";
  }

  function filterLabel(filter) {
    return { all: "All", wrong: "Wrong", correct: "Correct", flagged: "Flagged" }[filter] || filter;
  }

  function openModal(name) {
    app.audioMenuOpen = false;
    if (name === "profile") app.accountAvatarDraft = Number(app.profile?.avatar_preset || 0);
    if (name === "password") app.dialogError = "";
    app.modalReturn = name === "password" ? "profile" : null;
    app.modal = name;
    render();
  }

  function closeModal(rerender = true) {
    if (app.modalReturn && app.modal === "password") {
      app.modal = app.modalReturn;
      app.modalReturn = null;
      app.dialogError = "";
      if (rerender) render();
      return;
    }
    app.modal = null;
    app.modalReturn = null;
    app.dialogError = "";
    app.accountAvatarDraft = null;
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
      volume: "M4 10h4l5-4v12l-5-4H4v-4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11",
      "volume-off": "M4 10h4l5-4v12l-5-4H4v-4zM17 9l5 5M22 9l-5 5",
      shuffle: "M3 7h3c4 0 5 10 9 10h6M17 13l4 4-4 4M3 17h3c1.7 0 2.9-1.8 4-4M14 7c.4 0 .7 0 1 0h6M17 3l4 4-4 4",
      music: "M9 18V5l10-2v13M9 9l10-2M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
      clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5v5l4 2",
      stats: "M5 19V9M12 19V5M19 19v-7",
      check: "M5 12l4 4L19 6",
      delete: "M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6",
      filter: "M4 5h16l-6 7v6l-4 2v-8L4 5z",
      info: "M12 8h.01M11 12h1v5h1",
      warning: "M12 3l10 18H2L12 3zm0 6v5m0 3h.01",
      more: "M5 12h.01M12 12h.01M19 12h.01",
      open: "M14 4h6v6M20 4l-9 9M5 5h6M5 5v14h14v-6",
      camera: "M4 7h3l2-3h6l2 3h3v13H4V7zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
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
