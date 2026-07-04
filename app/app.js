(function () {
  "use strict";

  const TOTAL_TIME_SECONDS = 3 * 60 * 60 + 10 * 60;
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
  const AVATARS = ["AZ", "BR", "CX", "DL", "EV", "FK", "GP", "HM"];
  const app = {
    client: null,
    session: null,
    profile: null,
    attempts: [],
    draft: null,
    updates: [],
    view: { name: "boot" },
    modal: null,
    toast: "",
    timerId: null,
    syncTimer: null,
    dirtyAttempts: new Set(),
    dirtyAnswers: new Set(),
    flushing: false,
    pendingQuestionEntry: new Map(),
    reviewFilter: "all",
    recentTab: "all",
    questionVersion: "1"
  };

  const root = document.getElementById("app");

  function boot() {
    window.addEventListener("beforeunload", () => {
      flushDirty({ immediate: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushDirty({ immediate: true });
    });
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("change", handleChange);
    init();
  }

  async function init() {
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
      app.client.auth.onAuthStateChange(async (_event, session) => {
        app.session = session;
        if (session) {
          await loadUserData();
          setView({ name: "dashboard" });
        } else {
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
    app.view = view;
    render();
  }

  function render() {
    clearInterval(app.timerId);
    app.timerId = null;

    if (app.view.name === "boot") return renderLoading();
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
    root.innerHTML = `<section class="loading-screen"><div class="spinner"></div><p>Loading reviewer...</p></section>`;
  }

  function renderFatal(title, message) {
    root.innerHTML = `
      <section class="config-screen">
        <div class="config-card">
          ${brandBlock()}
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(message)}</p>
        </div>
      </section>
    `;
  }

  function renderConfig() {
    root.innerHTML = `
      <section class="config-screen">
        <div class="config-card">
          ${brandBlock()}
          <h1>Supabase setup required</h1>
          <p>This online build needs <code>app/supabase-config.js</code> with the project URL and publishable key before it can run.</p>
          <pre>window.CSC_SUPABASE_CONFIG = {
  url: "https://your-project-ref.supabase.co",
  publishableKey: "sb_publishable_..."
};</pre>
        </div>
      </section>
    `;
  }

  function renderCreateAccount() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas">
        <div class="auth-copy">
          <span class="soft-pill">Civil Service Exam Practice</span>
          <h1>Review smarter. Track your progress clearly.</h1>
          <p>Timed mock exams, focused drills, answer review, and progress tracking for a small independent study group.</p>
          <div class="auth-chips">
            <span>Timed mock exams</span>
            <span>Score tracking</span>
            <span>Reviewer history</span>
          </div>
        </div>
        <form class="auth-card" data-form="signup">
          <div>
            <h2>Create Profile</h2>
            <p>Make one online profile tied to your email.</p>
          </div>
          <label>Full Name<input name="name" autocomplete="name" required /></label>
          <label>Email Address<input name="email" type="email" autocomplete="email" required /></label>
          <label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
          <label>Invite Code<input name="inviteCode" autocomplete="off" required /></label>
          <button class="btn primary" data-action="signup-submit" type="button">${icon("spark")} Start Reviewing</button>
          <div class="auth-divider"><span>or</span></div>
          <button class="text-link" data-action="show-signin" type="button">Select existing profile</button>
        </form>
      </section>
      ${toast()}
    `);
  }

  function renderSignIn() {
    root.innerHTML = publicShell(`
      <section class="auth-canvas select-mode">
        <div class="auth-copy compact-copy">
          <span class="soft-pill">Returning reviewer</span>
          <h1>Select Profile</h1>
          <p>Sign in with the email and password for your reviewer account.</p>
          <button class="btn secondary" data-action="show-create" type="button">${icon("plus")} Create New Profile</button>
        </div>
        <form class="auth-card profile-picker-card" data-form="signin">
          <div>
            <h2>Sign In</h2>
            <p>Continue your saved exams and review history.</p>
          </div>
          <label>Email Address<input name="email" type="email" autocomplete="email" required /></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
          <button class="btn primary" data-action="signin-submit" type="button">${icon("arrow")} Continue</button>
          <button class="text-link" data-action="forgot-password" type="button">Forgot Password?</button>
          <button class="text-link" data-action="show-create" type="button">Back to Create Profile</button>
        </form>
      </section>
      ${toast()}
    `);
  }

  function renderDashboard() {
    const profile = app.profile;
    const attempts = app.attempts;
    const completed = completedAttempts();
    const activeAttempt = attempts.find((attempt) => attempt.status === "in_progress" || attempt.status === "paused");
    const latest = attempts[0];
    const latestCompleted = completed[0];
    const average = averagePercent(completed);
    const categoryStats = categoryPerformance(completed);
    root.innerHTML = authedShell(`
      <section class="dash-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Profile Dashboard</p>
            <h1>Professional Reviewer</h1>
          </div>
          <div class="header-actions">
            <button class="btn ghost" data-action="switch-account" type="button">${icon("switch")} Switch Account</button>
            <button class="avatar-button" data-action="manage-profile" type="button">${avatar(profile)}</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <section class="card profile-summary">
            <div class="profile-main">
              ${avatar(profile, "large")}
              <div>
                <h2>${escapeHtml(profile.name)}</h2>
                <p>${escapeHtml(profile.email)}</p>
                <span>${escapeHtml(profile.level || "Professional")} Level</span>
              </div>
            </div>
            <button class="btn secondary" data-action="manage-profile" type="button">${icon("edit")} Edit Profile</button>
          </section>

          <section class="card continue-card ${activeAttempt ? "" : "disabled-card"}">
            <div class="card-head">
              <div>
                <p class="eyebrow">Continue Last Exam</p>
                <h2>${activeAttempt ? examTitle(activeAttempt) : "No active exam"}</h2>
              </div>
              <span>${activeAttempt ? `${answeredCount(activeAttempt)}/${activeAttempt.total_questions}` : "0/170"}</span>
            </div>
            <p>${activeAttempt ? `${formatDuration(timeRemaining(activeAttempt))} left. Last viewed item ${activeAttempt.current_question_index + 1}.` : "Your resumable attempt will appear here after you start or save one."}</p>
            <button class="btn primary" data-action="resume-exam" type="button" ${activeAttempt ? "" : "disabled"}>${icon("play")} Resume Exam</button>
          </section>

          <section class="card start-card">
            <div class="card-head">
              <div>
                <p class="eyebrow">Professional Mock Exam</p>
                <h2>Start Full Mock Exam</h2>
              </div>
              <span>170 items</span>
            </div>
            <div class="mini-facts">
              <span>3:10:00</span>
              <span>80% passing</span>
              <span>20 versions</span>
            </div>
            <button class="btn primary" data-action="open-setup" type="button">${icon("play")} Start Exam</button>
          </section>

          <section class="card wide">
            <div class="card-head">
              <div>
                <p class="eyebrow">Practice by Category</p>
                <h2>Target weak areas</h2>
              </div>
              <button class="btn secondary" data-action="practice-page" type="button">Open Practice</button>
            </div>
            <div class="category-card-grid compact">
              ${PRACTICE_CATEGORIES.map((category) => categoryMiniCard(category, categoryStats[category.section])).join("")}
            </div>
          </section>

          <section class="card review-card">
            <p class="eyebrow">Review Mistakes</p>
            <h2>${wrongAnswerCount(completed)} missed items</h2>
            <p>Choose a previous attempt and review only the questions you missed.</p>
            <button class="btn secondary" data-action="mistakes-page" type="button">${icon("review")} Review Now</button>
          </section>

          <section class="card progress-card">
            <p class="eyebrow">Progress Summary</p>
            <div class="metric-grid">
              <metric><strong>${completed.length}</strong><span>Completed</span></metric>
              <metric><strong>${average == null ? "--" : `${Math.round(average)}%`}</strong><span>Average</span></metric>
              <metric><strong>${latestCompleted ? `${Math.round(resultPercent(latestCompleted))}%` : "--"}</strong><span>Latest</span></metric>
            </div>
          </section>

          <section class="card recent-card">
            <div class="card-head">
              <div>
                <p class="eyebrow">Recent Attempts</p>
                <h2>History</h2>
              </div>
              <button class="btn ghost" data-action="recent-page" type="button">View All</button>
            </div>
            ${attemptList(attempts.slice(0, 4))}
          </section>
        </div>
      </section>
      ${profileModal()}
      ${toast()}
    `, "dashboard");
  }

  function renderSetup() {
    const draftOptions = { ...DEFAULT_OPTIONS, ...(app.draft?.options || {}) };
    const savedVersionId = draftOptions.versionId || examVersions[0]?.id;
    root.innerHTML = authedShell(`
      <section class="setup-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Professional Mock Exam</p>
            <h1>Exam Setup</h1>
          </div>
          <button class="btn ghost" data-action="dashboard" type="button">${icon("back")} Back to Dashboard</button>
        </div>

        <div class="setup-grid">
          <section class="card setup-main">
            <div class="exam-badge-row">
              <span class="soft-pill">Timed Exam</span>
              <strong>Professional Mock Exam</strong>
            </div>
            <div class="setup-facts">
              <div><span>Total Questions</span><strong>170</strong></div>
              <div><span>Time Limit</span><strong>3h 10m</strong></div>
              <div><span>Exam Type</span><strong>Professional</strong></div>
              <div><span>Navigation</span><strong>Free movement</strong></div>
              <div><span>Review Tools</span><strong>Flag, skip, revisit</strong></div>
              <div><span>Pause</span><strong>Save and exit supported</strong></div>
            </div>
            <div class="section-list">
              <h2>Question Groups</h2>
              ${SECTION_GROUPS.map((group) => `
                <div class="section-row ${group.tone}">
                  <div>
                    <strong>${escapeHtml(group.section)}</strong>
                    <span>Items ${group.range}</span>
                  </div>
                  <small>${group.end - group.start + 1} items</small>
                </div>
              `).join("")}
            </div>
            <div class="note-box">
              <strong>Important Notes</strong>
              <p>This is an independent practice reviewer, not an official CSC exam. Your exam progress is stored online under your signed-in account.</p>
            </div>
          </section>

          <form class="card setup-options" data-form="setup">
            <h2>Exam Options</h2>
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
              <strong>Readiness Check</strong>
              <span>Stable internet connection</span>
              <span>Quiet review space</span>
              <span>At least 3 hours available</span>
            </div>
            <button class="btn primary" data-action="setup-submit" type="button">${icon("play")} Start Exam</button>
            <button class="btn secondary" data-action="save-setup" type="button">${icon("save")} Save for Later</button>
          </form>
        </div>
      </section>
      ${toast()}
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

    root.innerHTML = `
      <section class="exam-shell ${isPaused || app.modal === "submit" ? "exam-dimmed" : ""}">
        <header class="exam-topbar">
          <div class="exam-brand">${logo()}<div><strong>Professional Mock Exam</strong><span>${attempt.mode === "practice" ? "Category Practice" : examTitle(attempt)}</span></div></div>
          <div class="exam-status">
            <span>${attempt.options?.showTimer === false ? "Timer hidden" : formatDuration(remaining)}</span>
            <small>${answeredCount(attempt)}/${attempt.total_questions} answered</small>
          </div>
          <div class="exam-actions">
            <button class="btn secondary" data-action="pause-exam" type="button" ${attempt.options?.enablePause === false || isPaused ? "disabled" : ""}>${icon("pause")} Pause</button>
            <button class="btn danger" data-action="open-submit" type="button">${icon("submit")} Submit Exam</button>
          </div>
        </header>

        <div class="exam-body ${current.stimulus ? "with-stimulus" : ""}">
          <aside class="exam-nav">
            <div class="nav-title">
              <h2>Questions</h2>
              <div class="legend">
                <span><i class="legend-dot answered"></i>Answered</span>
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
                  <span class="question-index">Question ${current.position + 1} of ${attempt.total_questions}</span>
                  <h1>Item ${current.display_number}</h1>
                  <p>${escapeHtml(current.section)} / ${escapeHtml(current.subtopic)}</p>
                </div>
                <span class="status-pill ${answerStatus(current)}">${statusText(current)}</span>
              </div>
              <p class="prompt">${escapeHtml(current.prompt)}</p>
              <div class="choices">
                ${current.choices.map((choice) => `
                  <button class="choice ${current.selected_choice === choice.id ? "selected" : ""}" data-choice="${choice.id}" type="button" ${attempt.status !== "in_progress" ? "disabled" : ""}>
                    <span>${choice.id}</span>
                    <strong>${escapeHtml(choice.text)}</strong>
                  </button>
                `).join("")}
              </div>
              <div class="question-actions">
                <button class="btn secondary" data-action="previous-question" type="button" ${current.position === 0 ? "disabled" : ""}>${icon("back")} Previous</button>
                <button class="btn ghost" data-action="clear-answer" type="button">${icon("clear")} Clear Answer</button>
                <button class="btn ghost ${current.flagged ? "active" : ""}" data-action="toggle-flag" type="button">${icon("flag")} Flag for Review</button>
                <button class="btn secondary" data-action="skip-question" type="button">${icon("skip")} Skip</button>
                <button class="btn primary" data-action="next-question" type="button" ${current.position >= attempt.total_questions - 1 ? "disabled" : ""}>Next ${icon("arrow")}</button>
              </div>
            </section>
          </main>
        </div>
      </section>
      ${pauseModal(attempt)}
      ${submitModal(attempt)}
      ${chartModal(attempt, current)}
      ${toast()}
    `;

    if (attempt.status === "in_progress") {
      app.timerId = setInterval(() => tickAttempt(attempt.id), 1000);
    }
  }

  function renderResults() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    const score = attempt.score ?? scoreAttempt(attempt);
    const pct = resultPercent(attempt);
    const insights = performanceInsights(attempt);
    const stats = sectionStats(attempt);
    const isPractice = attempt.mode === "practice";

    root.innerHTML = publicShell(`
      <section class="results-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">${isPractice ? "Practice Results" : "Results Summary"}</p>
            <h1>${isPractice ? "Practice Complete" : "Professional Mock Exam Complete"}</h1>
          </div>
          <button class="btn ghost" data-action="dashboard" type="button">${icon("home")} Back to Dashboard</button>
        </div>
        <section class="result-hero card">
          <div class="score-ring ${pct >= PASSING_PERCENT ? "passed" : "needs-work"}">
            <strong>${Math.round(pct)}%</strong>
            <span>${isPractice ? "Accuracy" : pct >= PASSING_PERCENT ? "PASSED" : "NEEDS REVIEW"}</span>
          </div>
          <div>
            <span class="soft-pill">${score} correct / ${attempt.total_questions}</span>
            <h2>${isPractice ? "Focused practice finished." : pct >= PASSING_PERCENT ? "You passed this mock exam." : "Keep reviewing targeted sections."}</h2>
            <p>Duration: ${formatDuration(attempt.elapsed_seconds)}. Submitted ${formatDate(attempt.submitted_at || attempt.started_at)}.</p>
          </div>
          <div class="result-stats">
            <metric><strong>${score}</strong><span>Correct</span></metric>
            <metric><strong>${attempt.total_questions - score}</strong><span>Wrong</span></metric>
            <metric><strong>${flaggedCount(attempt)}</strong><span>Flagged</span></metric>
            <metric><strong>${formatDuration(insights.averageTime)}</strong><span>Avg/item</span></metric>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <p class="eyebrow">Category Breakdown</p>
              <h2>Section performance</h2>
            </div>
          </div>
          <div class="breakdown-grid">
            ${stats.map((stat) => `
              <div class="breakdown-card ${toneForSection(stat.section)}">
                <div><strong>${escapeHtml(stat.section)}</strong><span>${stat.correct}/${stat.total}</span></div>
                <div class="bar"><i style="width:${Math.round((stat.correct / stat.total) * 100)}%"></i></div>
                <small>${Math.round((stat.correct / stat.total) * 100)}% accuracy / ${formatDuration(stat.averageTime)} avg</small>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <p class="eyebrow">Performance Insights</p>
              <h2>Useful fun facts</h2>
            </div>
          </div>
          <div class="insight-grid">
            ${insightCard("Average answer time", formatDuration(insights.averageTime), "Your pacing per visited question.")}
            ${insightCard("Fastest question", insights.fastest ? `Item ${insights.fastest.display_number}` : "--", insights.fastest ? formatDuration(insights.fastest.time_spent_seconds) : "No timing yet.")}
            ${insightCard("Longest question", insights.slowest ? `Item ${insights.slowest.display_number}` : "--", insights.slowest ? formatDuration(insights.slowest.time_spent_seconds) : "No timing yet.")}
            ${insightCard("Fastest group", insights.fastestSection?.section || "--", insights.fastestSection ? `${formatDuration(insights.fastestSection.averageTime)} avg` : "No data yet.")}
            ${insightCard("Weakest area", insights.weakest?.section || "--", insights.weakest ? `${Math.round(insights.weakest.percent)}% accuracy` : "No data yet.")}
            ${insightCard("Strongest area", insights.strongest?.section || "--", insights.strongest ? `${Math.round(insights.strongest.percent)}% accuracy` : "No data yet.")}
            ${insightCard("Changed answers", String(insights.changed), `${insights.wrongToCorrect} improved, ${insights.correctToWrong} lost.`)}
            ${insightCard("Retry focus", insights.recommendation, "Use this to choose your next drill.")}
          </div>
        </section>

        <section class="card overview-card">
          <p class="eyebrow">Exam Overview</p>
          <div class="overview-row">
            <span>${skippedCount(attempt)} skipped</span>
            <span>${unansweredCount(attempt)} unanswered</span>
            <span>${visitedCount(attempt)} visited</span>
            <span>${attempt.options?.shuffleQuestions ? "Question shuffle on" : "Bank order"}</span>
          </div>
        </section>

        <div class="bottom-actions">
          <button class="btn primary" data-action="review-answers" type="button">${icon("review")} Review Answers</button>
          <button class="btn secondary" data-action="dashboard" type="button">${icon("home")} Back to Dashboard</button>
          <button class="btn secondary" data-action="retake-setup" type="button">${icon("refresh")} Retake Exam</button>
        </div>
      </section>
      ${toast()}
    `);
  }

  function renderReview() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return setView({ name: "dashboard" });
    const filtered = filteredReviewAnswers(attempt, app.reviewFilter);
    const index = Math.min(app.view.index || 0, Math.max(0, filtered.length - 1));
    const answer = filtered[index] || Object.values(attempt.answers).sort(byPosition)[0];
    const correct = answer?.selected_choice === answer?.correct_choice;
    root.innerHTML = publicShell(`
      <section class="review-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Answer Review</p>
            <h1>${examTitle(attempt)}</h1>
          </div>
          <button class="btn ghost" data-action="back-results" type="button">${icon("back")} Back to Results</button>
        </div>
        <div class="review-layout">
          <aside class="card review-sidebar">
            <h2>Review Filters</h2>
            <div class="filter-list">
              ${["all", "wrong", "correct", "flagged"].map((filter) => `<button class="${app.reviewFilter === filter ? "active" : ""}" data-review-filter="${filter}" type="button">${filterLabel(filter)}</button>`).join("")}
            </div>
            <h2>Question Navigator</h2>
            <div class="review-dots">
              ${filtered.map((item, itemIndex) => `<button class="${itemIndex === index ? "current" : ""} ${item.selected_choice === item.correct_choice ? "correct" : "wrong"} ${item.flagged ? "flagged" : ""}" data-review-index="${itemIndex}" type="button">${item.display_number}</button>`).join("") || `<span>No items</span>`}
            </div>
          </aside>
          <main class="card review-main">
            ${answer ? `
              <div class="question-title">
                <div>
                  <span class="question-index">Question ${answer.position + 1} of ${attempt.total_questions}</span>
                  <h1>Item ${answer.display_number}</h1>
                  <p>${escapeHtml(answer.section)} / ${escapeHtml(answer.subtopic)} / ${formatDuration(answer.time_spent_seconds)} spent</p>
                </div>
                <span class="status-pill ${correct ? "answered" : "wrong"}">${correct ? "Correct" : "Incorrect"}</span>
              </div>
              ${answer.stimulus ? renderStimulusPanel(attempt, answer, linkedStimulusAnswers(attempt, answer), true) : ""}
              <p class="prompt">${escapeHtml(answer.prompt)}</p>
              <div class="review-choices">
                ${answer.choices.map((choice) => `
                  <div class="review-choice ${choice.id === answer.correct_choice ? "is-correct" : ""} ${choice.id === answer.selected_choice && choice.id !== answer.correct_choice ? "is-wrong" : ""}">
                    <span>${choice.id}</span>
                    <strong>${escapeHtml(choice.text)}</strong>
                  </div>
                `).join("")}
              </div>
              <div class="explanation-box">
                <strong>Explanation</strong>
                <p>${escapeHtml(answer.explanation || "No explanation provided.")}</p>
              </div>
              <div class="metadata-strip">
                <span>Visits: ${answer.visit_count || 0}</span>
                <span>Answer changes: ${answer.answer_changes || 0}</span>
                <span>${answer.flagged ? "Flagged" : "Not flagged"}</span>
              </div>
            ` : `<p>No review items for this filter.</p>`}
            <div class="question-actions">
              <button class="btn secondary" data-action="review-prev" type="button" ${index <= 0 ? "disabled" : ""}>Previous Question</button>
              <button class="btn ghost" data-action="back-results" type="button">Return to Results</button>
              <button class="btn primary" data-action="review-next" type="button" ${index >= filtered.length - 1 ? "disabled" : ""}>Next Question</button>
            </div>
          </main>
        </div>
      </section>
    `);
  }

  function renderPractice() {
    const categoryStats = categoryPerformance(completedAttempts());
    root.innerHTML = sideShell("practice", `
      <section class="content-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Practice by Category</p>
            <h1>Choose a focused drill</h1>
          </div>
          <div class="header-actions">
            <button class="icon-only update-bell" data-action="toggle-updates" type="button" title="Updates">${icon("bell")}<span>${app.updates.length || 0}</span></button>
            <button class="btn ghost" data-action="switch-account" type="button">${icon("switch")} Switch Account</button>
          </div>
        </div>
        <div class="category-card-grid">
          ${PRACTICE_CATEGORIES.map((category) => categoryPracticeCard(category, categoryStats[category.section])).join("")}
        </div>
        <form class="card custom-practice" data-form="custom-practice">
          <div>
            <p class="eyebrow">Custom Practice</p>
            <h2>Build a drill</h2>
          </div>
          <label>Select Category
            <select name="category">${PRACTICE_CATEGORIES.map((category) => `<option value="${escapeAttr(category.section)}">${escapeHtml(category.label)}</option>`).join("")}</select>
          </label>
          <label>Number of Questions
            <select name="count">${[10, 20, 30, 40, 60].map((count) => `<option value="${count}" ${count === 10 ? "selected" : ""}>${count}</option>`).join("")}</select>
          </label>
          <label>Difficulty
            <select name="difficulty">
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <button class="btn primary" data-action="custom-practice-submit" type="button">${icon("play")} Start Custom Practice</button>
        </form>
        <section class="note-card">
          <strong>Study Tip</strong>
          <p>Use practice sessions after every full mock. The app will keep your timing and accuracy separate from full exam attempts.</p>
          <button class="btn secondary" data-action="manage-profile" type="button">View Settings</button>
        </section>
      </section>
      ${updatesPopover()}
      ${profileModal()}
    `);
  }

  function renderRecentAttempts() {
    const attempts = app.attempts;
    const completed = completedAttempts();
    const average = averagePercent(completed);
    const highest = completed.reduce((best, attempt) => Math.max(best, resultPercent(attempt)), 0);
    root.innerHTML = sideShell("recent", `
      <section class="content-page">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">Recent Attempts</p>
            <h1>Attempt history</h1>
          </div>
          <button class="btn ghost" data-action="dashboard" type="button">${icon("home")} Dashboard</button>
        </div>
        <div class="summary-cards">
          <metric><strong>${attempts.length}</strong><span>Total Attempts</span></metric>
          <metric><strong>${average == null ? "--" : Math.round(average)}</strong><span>Average Score</span></metric>
          <metric><strong>${completed.length ? Math.round(highest) : "--"}</strong><span>Highest</span></metric>
          <metric><strong>${activeDays(attempts)}</strong><span>Days Active</span></metric>
        </div>
        <section class="card attempts-table-card">
          <div class="tabs">
            ${[
              ["all", "All Attempts"],
              ["full", "Full Mock Exams"],
              ["practice", "Category Practice"],
              ["quick", "Quick Practice"],
              ["review", "Review Sessions"]
            ].map(([key, label]) => `<button class="${app.recentTab === key ? "active" : ""}" data-recent-tab="${key}" type="button">${label}</button>`).join("")}
          </div>
          <div class="attempt-table">
            <div class="table-head"><span>Type</span><span>Date</span><span>Score</span><span>Duration</span><span>Actions</span></div>
            ${filteredAttemptsByTab(attempts, app.recentTab).map((attempt) => `
              <div class="table-row">
                <span><strong>${escapeHtml(examTitle(attempt))}</strong><small>${attempt.mode || "full"}</small></span>
                <span>${formatDate(attempt.started_at)}</span>
                <span>${attempt.status === "submitted" || attempt.status === "timed_out" ? `${Math.round(resultPercent(attempt))}%` : statusLabel(attempt.status)}</span>
                <span>${formatDuration(attempt.elapsed_seconds)}</span>
                <span class="row-actions">
                  <button class="btn tiny" data-attempt-results="${attempt.id}" type="button">View Results</button>
                  <button class="icon-only" data-overflow="${attempt.id}" type="button" title="More actions">${icon("more")}</button>
                  ${app.modal === `overflow:${attempt.id}` ? overflowMenu(attempt) : ""}
                </span>
              </div>
            `).join("") || `<p class="empty-note">No attempts in this tab.</p>`}
          </div>
        </section>
      </section>
    `);
  }

  function renderMistakePicker() {
    const completed = completedAttempts();
    root.innerHTML = sideShell("mistakes", `
      <section class="content-page">
        <div class="page-title-row">
          <div><p class="eyebrow">Review Mistakes</p><h1>Choose an attempt</h1></div>
          <button class="btn ghost" data-action="dashboard" type="button">Dashboard</button>
        </div>
        <section class="card">
          ${completed.map((attempt) => `
            <button class="attempt-select-row" data-review-mistakes="${attempt.id}" type="button">
              <strong>${escapeHtml(examTitle(attempt))}</strong>
              <span>${formatDate(attempt.submitted_at || attempt.started_at)}</span>
              <small>${wrongAnswers(attempt).length} mistakes / ${Math.round(resultPercent(attempt))}%</small>
            </button>
          `).join("") || `<p class="empty-note">No completed attempts yet.</p>`}
        </section>
      </section>
    `);
  }

  function renderBookmarks() {
    const flagged = app.attempts.flatMap((attempt) => Object.values(attempt.answers).filter((answer) => answer.flagged).map((answer) => ({ attempt, answer })));
    root.innerHTML = sideShell("bookmarks", `
      <section class="content-page">
        <div class="page-title-row">
          <div><p class="eyebrow">Bookmarks</p><h1>Flagged questions</h1></div>
          <button class="btn ghost" data-action="dashboard" type="button">Dashboard</button>
        </div>
        <section class="card bookmark-list">
          ${flagged.map(({ attempt, answer }) => `
            <button class="attempt-select-row" data-open-review="${attempt.id}" data-review-question="${answer.question_id}" type="button">
              <strong>Item ${answer.display_number} - ${escapeHtml(answer.section)}</strong>
              <span>${escapeHtml(examTitle(attempt))}</span>
              <small>${answer.selected_choice ? `Selected ${answer.selected_choice}` : "Unanswered"} / ${formatDuration(answer.time_spent_seconds)}</small>
            </button>
          `).join("") || `<p class="empty-note">Flag questions during an exam or review to bookmark them.</p>`}
        </section>
      </section>
    `);
  }

  function publicShell(content) {
    return `
      <header class="app-header">
        <div class="brand">${logo()}${brandText()}</div>
        <span class="disclaimer-pill">${icon("shield")} Not affiliated with the Civil Service Commission</span>
      </header>
      ${content}
    `;
  }

  function authedShell(content, active = "dashboard") {
    return `
      <header class="app-header">
        <div class="brand">${logo()}${brandText()}</div>
        <span class="disclaimer-pill">${icon("shield")} Not affiliated with the Civil Service Commission</span>
      </header>
      ${content}
      ${active !== "practice" ? "" : ""}
    `;
  }

  function sideShell(active, content) {
    const profile = app.profile;
    return `
      <div class="side-layout">
        <aside class="side-nav">
          <div class="side-brand">${logo()}<div><strong>CSC Practice Reviewer</strong><span>Professional Level</span></div></div>
          <button class="side-profile" data-action="manage-profile" type="button">${avatar(profile)}<span><strong>${escapeHtml(profile?.name || "Reviewer")}</strong><small>${escapeHtml(profile?.email || "")}</small></span>${icon("chev")}</button>
          <nav>
            ${sideNavItem("dashboard", "Dashboard", "home", active)}
            ${sideNavItem("setup", "Start Full Mock Exam", "play", active)}
            ${sideNavItem("practice", "Practice by Category", "grid", active)}
            ${sideNavItem("mistakes", "Review Mistakes", "review", active)}
            ${sideNavItem("recent", "Recent Attempts", "clock", active)}
            ${sideNavItem("results-history", "Results History", "stats", active)}
            ${sideNavItem("bookmarks", "Bookmarks", "flag", active)}
          </nav>
          <div class="study-tip"><strong>Study Tip</strong><p>Review the section that cost the most time before retaking a full mock.</p></div>
          <button class="btn ghost full" data-action="signout" type="button">${icon("logout")} Log Out</button>
        </aside>
        <main class="side-content">${content}</main>
      </div>
      ${toast()}
    `;
  }

  function brandBlock() {
    return `<div class="brand large">${logo()}${brandText()}</div>`;
  }

  function brandText() {
    return `<div><span>Independent Practice Reviewer</span><strong>CSC Practice Reviewer</strong></div>`;
  }

  function logo() {
    return `<img class="logo" src="assets/logo.png" alt="CSC Practice Reviewer logo" />`;
  }

  function sideNavItem(route, label, iconName, active) {
    const action = route === "results-history" ? "recent-page" : `${route}-page`;
    return `<button class="${active === route ? "active" : ""}" data-action="${action}" type="button">${icon(iconName)} ${escapeHtml(label)}</button>`;
  }

  function avatar(profile, size = "") {
    const preset = Number(profile?.avatar_preset || 0) % AVATARS.length;
    const label = initials(profile?.name || AVATARS[preset]);
    return `<span class="avatar ${size} tone-${preset}">${escapeHtml(label)}</span>`;
  }

  function profileModal() {
    if (app.modal !== "profile") return "";
    const profile = app.profile;
    return `
      <div class="modal-backdrop">
        <section class="profile-modal">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          <h2>Manage Profile</h2>
          <div class="profile-modal-grid">
            <div class="account-column">
              <p class="eyebrow">Account Actions</p>
              <div class="account-card">
                ${avatar(profile, "large")}
                <strong>${escapeHtml(profile.email)}</strong>
                <span>Signed in account</span>
              </div>
              <form class="mini-form" data-form="change-password">
                <label>Current Password<input name="currentPassword" type="password" autocomplete="current-password" required /></label>
                <label>New Password<input name="newPassword" type="password" minlength="8" autocomplete="new-password" required /></label>
                <button class="btn secondary" data-action="password-submit" type="button">${icon("key")} Change Password</button>
              </form>
              <button class="btn ghost full" data-action="signout" type="button">${icon("logout")} Sign Out</button>
              <div class="tip-box"><strong>Tip</strong><p>Use the same email/password to open your profile from another device.</p></div>
            </div>
            <form class="edit-profile-form" data-form="profile">
              <p class="eyebrow">Edit Profile</p>
              <div class="avatar-picker">
                ${AVATARS.map((label, index) => `<label class="avatar-option"><input type="radio" name="avatarPreset" value="${index}" ${Number(profile.avatar_preset || 0) === index ? "checked" : ""}> <span class="avatar tone-${index}">${label}</span></label>`).join("")}
              </div>
              <label>Full Name<input name="name" value="${escapeAttr(profile.name)}" required /></label>
              <label>Email<input name="email" value="${escapeAttr(profile.email)}" disabled /></label>
              <label>Level
                <select name="level">
                  <option ${profile.level === "Professional" ? "selected" : ""}>Professional</option>
                  <option ${profile.level === "Subprofessional" ? "selected" : ""}>Subprofessional</option>
                </select>
              </label>
              <label>Birth Date<input name="birthDate" type="date" value="${escapeAttr(profile.birth_date || "")}" /></label>
              <label>Notes<textarea name="notes">${escapeHtml(profile.notes || "")}</textarea></label>
              <div class="modal-actions">
                <button class="btn ghost" data-action="close-modal" type="button">Cancel</button>
                <button class="btn primary" data-action="profile-submit" type="button">${icon("save")} Save Changes</button>
              </div>
              <button class="delete-link" data-action="delete-profile" type="button">Delete This Profile</button>
            </form>
          </div>
        </section>
      </div>
    `;
  }

  function pauseModal(attempt) {
    if (attempt.status !== "paused") return "";
    return `
      <div class="modal-backdrop">
        <section class="pause-modal">
          <span class="pause-icon">${icon("pause")}</span>
          <h2>Exam Paused</h2>
          <p>Your time is stopped. Resume when ready or save and exit to the dashboard.</p>
          <button class="btn primary" data-action="resume-paused" type="button">${icon("play")} Resume Exam</button>
          <button class="btn secondary" data-action="save-exit" type="button">${icon("save")} Save and Exit</button>
        </section>
      </div>
    `;
  }

  function submitModal(attempt) {
    if (app.modal !== "submit") return "";
    return `
      <div class="modal-backdrop">
        <section class="submit-modal">
          <h2>Submit Exam?</h2>
          <p>You can still review unanswered or flagged items before submitting.</p>
          <div class="submit-stats">
            <metric><strong>${answeredCount(attempt)}</strong><span>Answered</span></metric>
            <metric><strong>${unansweredCount(attempt)}</strong><span>Unanswered</span></metric>
            <metric><strong>${skippedCount(attempt)}</strong><span>Skipped</span></metric>
            <metric><strong>${flaggedCount(attempt)}</strong><span>Flagged</span></metric>
          </div>
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
      <div class="modal-backdrop">
        <section class="chart-modal">
          <button class="modal-close" data-action="close-modal" type="button">${icon("x")}</button>
          ${renderStimulusPanel(attempt, answer, linkedStimulusAnswers(attempt, answer), true)}
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
          <summary><span><strong>${escapeHtml(attempt.practice_category || "Practice")}</strong><small>Items 1-${attempt.total_questions}</small></span><em>${answeredCount(attempt)}/${attempt.total_questions}</em></summary>
          <div class="chip-grid">${answers.map((answer) => navChip(answer, attempt)).join("")}</div>
        </details>
      `;
    }

    return SECTION_GROUPS.map((group) => {
      const groupAnswers = answers.filter((answer) => answer.section === group.section);
      const hasCurrent = groupAnswers.some((answer) => answer.position === attempt.current_question_index);
      return `
        <details class="question-group ${group.tone}" ${hasCurrent ? "open" : ""}>
          <summary>
            <span><strong>${escapeHtml(group.section)}</strong><small>${group.range}</small></span>
            <em>${groupAnswers.filter((answer) => answer.selected_choice).length}/${groupAnswers.length}</em>
          </summary>
          <div class="group-counts">
            <span>${groupAnswers.filter((answer) => answer.selected_choice).length} answered</span>
            <span>${groupAnswers.filter((answer) => answer.skipped && !answer.selected_choice).length} skipped</span>
            <span>${groupAnswers.filter((answer) => !answer.selected_choice).length} open</span>
          </div>
          <div class="chip-grid">${groupAnswers.map((answer) => navChip(answer, attempt)).join("")}</div>
        </details>
      `;
    }).join("");
  }

  function navChip(answer, attempt) {
    return `<button class="question-chip ${answerStatus(answer)} ${answer.flagged ? "flagged" : ""} ${answer.position === attempt.current_question_index ? "current" : ""}" data-goto="${answer.position}" type="button">${answer.display_number}</button>`;
  }

  function renderStimulusPanel(attempt, answer, linked, reviewMode = false) {
    const stimulus = answer.stimulus;
    if (!stimulus) return "";
    const rows = toArray(stimulus.rows);
    const headers = toArray(stimulus.headers);
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
          ${reviewMode ? "" : `<div class="stimulus-actions"><button class="btn tiny" data-action="open-chart" type="button">Zoom</button><button class="btn tiny" data-action="open-chart" type="button">Open Larger</button></div>`}
        </div>
        ${chartRows.length ? `<div class="chart-bars">${chartRows.map((row) => `<div><span>${escapeHtml(row.label)}</span><i><b style="width:${Math.max(6, Math.round((row.total / max) * 100))}%"></b></i><strong>${row.total}</strong></div>`).join("")}</div>` : ""}
        ${headers.length && rows.length ? `<div class="data-table-wrap"><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
        <div class="linked-items">
          <strong>${escapeHtml(linked.label)}</strong>
          ${linked.items.map((item) => `<button class="${item.position === attempt.current_question_index ? "active" : ""}" data-goto="${item.position}" type="button">Item ${item.display_number}</button>`).join("")}
        </div>
      </section>
    `;
  }

  function insightCard(title, value, detail) {
    return `<div class="insight-card"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></div>`;
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
      if (formName === "signup") await signUp(data);
      if (formName === "signin") await signIn(data);
      if (formName === "setup") await startFullExam(formOptions(form));
      if (formName === "profile") await saveProfile(form);
      if (formName === "change-password") await changePassword(data);
      if (formName === "custom-practice") await startPractice(data.category, Number(data.count), data.difficulty);
    } catch (error) {
      showToast(readableError(error));
    }
  }

  async function handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    const action = target.dataset.action;

    try {
      if (action === "show-signin") return setView({ name: "signin" });
      if (action === "show-create") return setView({ name: "create" });
      if (action === "signup-submit") return await signUp(formDataFromButton(target));
      if (action === "signin-submit") return await signIn(formDataFromButton(target));
      if (action === "setup-submit") return await startFullExam(formOptions(target.closest("form")));
      if (action === "profile-submit") return await saveProfile(target.closest("form"));
      if (action === "password-submit") return await changePassword(formDataFromButton(target));
      if (action === "custom-practice-submit") {
        const values = formDataFromButton(target);
        return await startPractice(values.category, Number(values.count), values.difficulty);
      }
      if (action === "dashboard") return setView({ name: "dashboard" });
      if (action === "open-setup" || action === "setup-page" || action === "retake-setup") return setView({ name: "setup" });
      if (action === "practice-page") return setView({ name: "practice" });
      if (action === "recent-page") return setView({ name: "recent" });
      if (action === "mistakes-page") return setView({ name: "mistakes" });
      if (action === "bookmarks-page") return setView({ name: "bookmarks" });
      if (action === "results-history-page") return setView({ name: "recent" });
      if (action === "manage-profile") return openModal("profile");
      if (action === "close-modal") return closeModal();
      if (action === "switch-account" || action === "signout") return await signOut();
      if (action === "forgot-password") return await forgotPassword();
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
      if (action === "review-answers") return setView({ name: "review", attemptId: app.view.attemptId, index: 0 });
      if (action === "back-results") return setView({ name: "results", attemptId: app.view.attemptId });
      if (action === "review-prev") return moveReview(-1);
      if (action === "review-next") return moveReview(1);
      if (action === "toggle-updates") return openModal(app.modal === "updates" ? null : "updates");
      if (action === "delete-profile") return await deleteProfile();

      if (target.dataset.choice) return chooseAnswer(target.dataset.choice);
      if (target.dataset.goto !== undefined) return gotoQuestion(Number(target.dataset.goto));
      if (target.dataset.reviewFilter) return setReviewFilter(target.dataset.reviewFilter);
      if (target.dataset.reviewIndex !== undefined) return setView({ ...app.view, index: Number(target.dataset.reviewIndex) });
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
        return setView({ name: "review", attemptId: target.dataset.openReview, index: 0 });
      }
    } catch (error) {
      showToast(readableError(error));
    }
  }

  function handleChange(event) {
    const input = event.target;
    if (input.closest("[data-form='setup']")) saveSetupDraft(false);
  }

  async function signUp(data) {
    const inviteCode = String(data.inviteCode || "").trim();
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

  async function signOut() {
    await flushDirty({ immediate: true });
    const { error } = await app.client.auth.signOut();
    if (error) throw error;
    app.session = null;
    app.profile = null;
    app.attempts = [];
    setView({ name: "signin" });
  }

  async function forgotPassword() {
    const email = prompt("Enter your account email for password reset:");
    if (!email) return;
    const { error } = await app.client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${location.origin}${location.pathname}`
    });
    if (error) throw error;
    showToast("Password reset email sent.");
  }

  async function changePassword(data) {
    const email = app.profile.email;
    const currentPassword = data.currentPassword;
    const newPassword = data.newPassword;
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
      avatar_preset: Number(formData.avatarPreset || 0),
      level: formData.level,
      birth_date: formData.birthDate || null,
      notes: formData.notes || "",
      last_active_at: nowIso()
    };
    const { data, error } = await app.client.from("profiles").update(updates).eq("user_id", app.session.user.id).select("*").single();
    if (error) throw error;
    app.profile = data;
    closeModal();
    showToast("Profile saved.");
  }

  async function deleteProfile() {
    if (!confirm("Delete this profile data and all attempts? This cannot be undone.")) return;
    const { error } = await app.client.from("profiles").delete().eq("user_id", app.session.user.id);
    if (error) throw error;
    await app.client.auth.signOut();
    app.session = null;
    setView({ name: "signin" });
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
    const payload = { user_id: app.session.user.id, options, updated_at: nowIso() };
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
      submitAttempt(attempt, true);
      return;
    }
    updateExamTimerDom(attempt);
  }

  function updateExamTimerDom(attempt) {
    const timer = document.querySelector(".exam-status span");
    const answered = document.querySelector(".exam-status small");
    if (timer && attempt.options?.showTimer !== false) timer.textContent = formatDuration(timeRemaining(attempt));
    if (answered) answered.textContent = `${answeredCount(attempt)}/${attempt.total_questions} answered`;
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
    gotoQuestion(Math.min(Math.max(0, attempt.current_question_index + delta), attempt.total_questions - 1));
  }

  function gotoQuestion(index) {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt || index < 0 || index >= attempt.total_questions) return;
    attempt.current_question_index = index;
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
    await app.client.from("pause_events").insert({ attempt_id: attempt.id, user_id: app.session.user.id, paused_at: attempt.paused_at });
    await flushDirty({ immediate: true });
    renderExam();
  }

  async function resumePausedAttempt() {
    const attempt = getAttempt(app.view.attemptId);
    if (!attempt) return;
    attempt.status = "in_progress";
    attempt.paused_at = null;
    touchAttempt(attempt);
    await app.client.from("pause_events").update({ resumed_at: nowIso() }).eq("attempt_id", attempt.id).is("resumed_at", null);
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
    if (!confirm("Delete this attempt and its answer history?")) return;
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
    const answers = Object.values(attempt.answers).sort(byPosition);
    if (filter === "wrong") return answers.filter((answer) => answer.selected_choice !== answer.correct_choice);
    if (filter === "correct") return answers.filter((answer) => answer.selected_choice === answer.correct_choice);
    if (filter === "flagged") return answers.filter((answer) => answer.flagged);
    return answers;
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
      chev: "M9 6l6 6-6 6",
      logout: "M10 17l5-5-5-5M15 12H3M21 4v16h-8",
      bell: "M18 16H6l2-3V9a4 4 0 0 1 8 0v4l2 3zM10 19h4",
      grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
      clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5v5l4 2",
      stats: "M5 19V9M12 19V5M19 19v-7",
      more: "M5 12h.01M12 12h.01M19 12h.01",
      refresh: "M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6",
      verbal: "M4 5h16v10H8l-4 4z",
      numerical: "M5 19h14M7 15v4M12 9v10M17 4v15",
      analytical: "M12 3l8 5-8 5-8-5 8-5zm-8 10l8 5 8-5",
      general: "M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z"
    };
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.spark}" /></svg>`;
  }

  boot();
})();
