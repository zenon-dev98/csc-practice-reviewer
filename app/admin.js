(function () {
  "use strict";

  const ADMIN_USERNAME = "review-admin";
  const ADMIN_EMAIL = "admin@csc-practice-reviewer.local";
  const root = document.getElementById("admin-app");
  const state = {
    client: null,
    session: null,
    profiles: [],
    attempts: [],
    selectedUserId: "",
    selectedAttemptId: "",
    answers: [],
    search: "",
    loading: true,
    error: "",
    notice: ""
  };

  boot();

  async function boot() {
    const config = window.CSC_SUPABASE_CONFIG || {};
    if (!window.supabase || !config.url || !config.publishableKey) {
      state.loading = false;
      state.error = "Supabase configuration is unavailable.";
      return renderLogin();
    }

    state.client = window.supabase.createClient(normalizeUrl(config.url), config.publishableKey, {
      auth: {
        storageKey: "csc-reviewer-admin-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });

    const { data } = await state.client.auth.getSession();
    state.session = data.session;
    if (!state.session) {
      state.loading = false;
      return renderLogin();
    }
    await loadAdminData();
  }

  function normalizeUrl(url) {
    return String(url).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  }

  async function signIn(form) {
    state.error = "";
    state.loading = true;
    renderLogin();
    const values = Object.fromEntries(new FormData(form));
    if (String(values.username || "").trim().toLowerCase() !== ADMIN_USERNAME) {
      state.loading = false;
      state.error = "Invalid administrator credentials.";
      return renderLogin();
    }

    const { data, error } = await state.client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: String(values.password || "")
    });
    if (error) {
      state.loading = false;
      state.error = "Invalid administrator credentials.";
      return renderLogin();
    }
    state.session = data.session;
    await loadAdminData();
  }

  async function verifyAdmin() {
    const { data, error } = await state.client
      .from("app_admins")
      .select("user_id,label")
      .eq("user_id", state.session.user.id)
      .maybeSingle();
    if (error || !data) throw new Error("This account does not have administrator access.");
    return data;
  }

  async function loadAdminData() {
    state.loading = true;
    state.error = "";
    renderLoading();
    try {
      await verifyAdmin();
      const [profilesResult, attemptsResult] = await Promise.all([
        state.client
          .from("profiles")
          .select("user_id,name,email,created_at,updated_at,last_active_at")
          .order("last_active_at", { ascending: false }),
        state.client
          .from("attempts")
          .select("id,user_id,mode,title,practice_category,exam_version_id,status,started_at,submitted_at,elapsed_seconds,current_question_index,total_questions,total_time_seconds,score,percent,timed_out,options,updated_at")
          .order("started_at", { ascending: false })
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (attemptsResult.error) throw attemptsResult.error;
      state.profiles = profilesResult.data || [];
      state.attempts = attemptsResult.data || [];
      if (state.selectedUserId && !state.profiles.some((profile) => profile.user_id === state.selectedUserId)) {
        state.selectedUserId = "";
      }
      state.loading = false;
      renderDashboard();
    } catch (error) {
      state.loading = false;
      state.error = error.message || "Unable to load administration data.";
      renderLogin(true);
    }
  }

  async function loadAnswers(attemptId) {
    state.selectedAttemptId = attemptId;
    state.answers = [];
    state.notice = "Loading answer records...";
    renderDashboard();
    const { data, error } = await state.client
      .from("attempt_answers")
      .select("display_number,section,subtopic,prompt,selected_choice,correct_choice,skipped,flagged,time_spent_seconds,visit_count,answer_changes")
      .eq("attempt_id", attemptId)
      .order("display_number", { ascending: true });
    state.notice = "";
    if (error) {
      state.error = error.message;
    } else {
      state.error = "";
      state.answers = data || [];
    }
    renderDashboard();
  }

  async function signOut() {
    await state.client.auth.signOut();
    state.session = null;
    state.profiles = [];
    state.attempts = [];
    state.selectedUserId = "";
    state.selectedAttemptId = "";
    state.answers = [];
    state.error = "";
    renderLogin();
  }

  function renderLoading() {
    root.innerHTML = `<section class="admin-loading" aria-live="polite"><span class="spinner"></span><strong>Loading administration data</strong></section>`;
  }

  function renderLogin(denied = false) {
    root.innerHTML = `
      <div class="admin-login-shell">
        <section class="admin-login-copy">
          <img src="assets/brand-shield.svg" alt="" />
          <p class="eyebrow">PRIVATE REVIEWER</p>
          <h1>Administration</h1>
          <p>Read-only access to account activity, attempts, scores, and answer records.</p>
        </section>
        <form class="admin-login-card" data-form="admin-login" autocomplete="off">
          <div>
            <p class="eyebrow">AUTHORIZED ACCESS</p>
            <h2>Admin sign in</h2>
          </div>
          ${state.error ? `<p class="message error" role="alert">${escapeHtml(state.error)}</p>` : ""}
          ${denied ? `<p class="message">Use the dedicated administrator credentials, not a reviewer account.</p>` : ""}
          <label>Username<input name="username" value="${ADMIN_USERNAME}" autocomplete="off" required /></label>
          <label>Password<span class="password-field"><input name="password" type="password" autocomplete="new-password" required /><button type="button" data-action="toggle-password" aria-label="Show password">Show</button></span></label>
          <button class="primary" type="submit" ${state.loading ? "disabled" : ""}>${state.loading ? "Signing in..." : "Sign in"}</button>
          <a href="index.html">Return to reviewer</a>
        </form>
      </div>`;
  }

  function renderDashboard() {
    const completed = state.attempts.filter(isCompleted);
    const active = state.attempts.filter((attempt) => ["in_progress", "paused"].includes(attempt.status));
    const average = completed.length ? Math.round(completed.reduce((sum, attempt) => sum + numericPercent(attempt), 0) / completed.length) : null;
    const filteredProfiles = state.profiles.filter((profile) => {
      const term = state.search.toLowerCase();
      return !term || `${profile.name} ${profile.email}`.toLowerCase().includes(term);
    });
    const selectedProfile = state.profiles.find((profile) => profile.user_id === state.selectedUserId);

    root.innerHTML = `
      <div class="admin-shell">
        <header class="admin-header">
          <div class="brand"><img src="assets/brand-shield.svg" alt="" /><div><strong>CSC Practice Reviewer</strong><span>Administration</span></div></div>
          <div class="header-actions"><button type="button" data-action="refresh">Refresh data</button><button type="button" data-action="signout">Sign out</button></div>
        </header>
        <main class="admin-main">
          <div class="page-heading"><div><p class="eyebrow">READ-ONLY OVERVIEW</p><h1>Reviewer activity</h1><p>Private usage and performance records for the invited study group.</p></div><span>Updated ${formatDateTime(new Date().toISOString())}</span></div>
          ${state.error ? `<p class="message error" role="alert">${escapeHtml(state.error)}</p>` : ""}
          <section class="metric-grid" aria-label="General statistics">
            ${metric("Registered users", state.profiles.length, "Profiles in the reviewer")}
            ${metric("Total attempts", state.attempts.length, `${active.length} currently active`)}
            ${metric("Completed", completed.length, "Submitted or timed out")}
            ${metric("Average score", average === null ? "--" : `${average}%`, completed.length ? "Across completed attempts" : "No completed attempts")}
          </section>
          <section class="admin-workspace">
            <div class="users-panel">
              <div class="panel-heading"><div><p class="eyebrow">USERS</p><h2>Account directory</h2></div><label class="search-field"><span class="sr-only">Search users</span><input type="search" data-role="user-search" value="${escapeAttr(state.search)}" placeholder="Search name or email" /></label></div>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Attempts</th><th>Completed</th><th>Average</th><th>Last active</th></tr></thead>
                  <tbody>${filteredProfiles.map(userRow).join("") || `<tr><td colspan="5" class="empty-cell">No matching users.</td></tr>`}</tbody>
                </table>
              </div>
            </div>
            <aside class="detail-panel">${selectedProfile ? userDetails(selectedProfile) : emptyDetails()}</aside>
          </section>
        </main>
      </div>`;
  }

  function metric(label, value, note) {
    return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
  }

  function userRow(profile) {
    const attempts = userAttempts(profile.user_id);
    const completed = attempts.filter(isCompleted);
    const average = completed.length ? Math.round(completed.reduce((sum, attempt) => sum + numericPercent(attempt), 0) / completed.length) : null;
    return `<tr class="${profile.user_id === state.selectedUserId ? "selected" : ""}" data-user-id="${profile.user_id}" tabindex="0">
      <td><strong>${escapeHtml(profile.name)}</strong><small>${escapeHtml(profile.email)}</small></td>
      <td>${attempts.length}</td><td>${completed.length}</td><td>${average === null ? "--" : `${average}%`}</td><td>${formatDate(profile.last_active_at)}</td>
    </tr>`;
  }

  function userDetails(profile) {
    const attempts = userAttempts(profile.user_id);
    const completed = attempts.filter(isCompleted);
    const best = completed.length ? Math.max(...completed.map(numericPercent)) : null;
    return `
      <div class="detail-heading"><div class="initials">${escapeHtml(initials(profile.name))}</div><div><p class="eyebrow">USER DETAILS</p><h2>${escapeHtml(profile.name)}</h2><p>${escapeHtml(profile.email)}</p></div></div>
      <dl class="user-facts"><div><dt>Joined</dt><dd>${formatDate(profile.created_at)}</dd></div><div><dt>Last active</dt><dd>${formatDateTime(profile.last_active_at)}</dd></div><div><dt>Attempts</dt><dd>${attempts.length}</dd></div><div><dt>Best score</dt><dd>${best === null ? "--" : `${best}%`}</dd></div></dl>
      <div class="attempt-heading"><h3>Attempt history</h3><span>${attempts.length} records</span></div>
      <div class="attempt-list">${attempts.map(attemptCard).join("") || `<p class="empty-note">This user has no attempts yet.</p>`}</div>
      ${state.selectedAttemptId ? answerDetails() : ""}`;
  }

  function attemptCard(attempt) {
    return `<article class="attempt-card ${attempt.id === state.selectedAttemptId ? "selected" : ""}">
      <div><strong>${escapeHtml(attempt.title)}</strong><small>${escapeHtml(attempt.mode === "full" ? "Mock exam" : `Practice${attempt.practice_category ? ` · ${attempt.practice_category}` : ""}`)} · ${formatDate(attempt.started_at)}</small></div>
      <div class="attempt-score"><strong>${isCompleted(attempt) ? `${numericPercent(attempt)}%` : escapeHtml(statusLabel(attempt.status))}</strong><small>${attempt.score ?? 0}/${attempt.total_questions}</small></div>
      <button type="button" data-attempt-id="${attempt.id}">View answers</button>
    </article>`;
  }

  function answerDetails() {
    const attempt = state.attempts.find((row) => row.id === state.selectedAttemptId);
    if (!attempt) return "";
    const correct = state.answers.filter((answer) => answer.selected_choice && answer.selected_choice === answer.correct_choice).length;
    return `<section class="answer-detail">
      <div class="attempt-heading"><div><p class="eyebrow">ANSWER RECORDS</p><h3>${escapeHtml(attempt.title)}</h3></div><button type="button" data-action="close-answers">Close</button></div>
      ${state.notice ? `<p class="empty-note">${escapeHtml(state.notice)}</p>` : `<p class="answer-summary">${state.answers.length} items · ${correct} correct · ${state.answers.filter((answer) => answer.skipped).length} skipped · ${state.answers.filter((answer) => answer.flagged).length} flagged</p>
      <div class="answers-table"><table><thead><tr><th>#</th><th>Section / question</th><th>Selected</th><th>Correct</th><th>Time</th></tr></thead><tbody>${state.answers.map((answer) => `<tr><td>${answer.display_number}</td><td><strong>${escapeHtml(answer.section)}</strong><small>${escapeHtml(answer.prompt)}</small></td><td class="${answer.selected_choice === answer.correct_choice ? "correct" : "wrong"}">${answer.selected_choice || (answer.skipped ? "Skipped" : "Blank")}</td><td>${answer.correct_choice}</td><td>${formatDuration(answer.time_spent_seconds)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty-cell">No answer snapshots were stored for this attempt.</td></tr>`}</tbody></table></div>`}
    </section>`;
  }

  function emptyDetails() {
    return `<div class="detail-empty"><div class="empty-icon">i</div><h2>Select a user</h2><p>Choose an account to inspect its activity, attempts, scores, and answer records.</p></div>`;
  }

  function userAttempts(userId) {
    return state.attempts.filter((attempt) => attempt.user_id === userId);
  }

  function isCompleted(attempt) {
    return attempt.status === "submitted" || attempt.status === "timed_out";
  }

  function numericPercent(attempt) {
    const value = Number(attempt.percent);
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  function statusLabel(status) {
    return ({ in_progress: "In progress", paused: "Paused", submitted: "Completed", timed_out: "Timed out" })[status] || status;
  }

  function initials(name) {
    return String(name || "A").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function formatDate(value) {
    if (!value) return "--";
    return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));
  }

  function formatDateTime(value) {
    if (!value) return "--";
    return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(Math.floor(total % 60)).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  root.addEventListener("submit", (event) => {
    if (!event.target.matches('[data-form="admin-login"]')) return;
    event.preventDefault();
    signIn(event.target);
  });

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    const row = event.target.closest("tr[data-user-id]");
    if (row && !button) {
      state.selectedUserId = row.dataset.userId;
      state.selectedAttemptId = "";
      state.answers = [];
      return renderDashboard();
    }
    if (!button) return;
    if (button.dataset.attemptId) return loadAnswers(button.dataset.attemptId);
    if (button.dataset.action === "refresh") return loadAdminData();
    if (button.dataset.action === "signout") return signOut();
    if (button.dataset.action === "close-answers") {
      state.selectedAttemptId = "";
      state.answers = [];
      return renderDashboard();
    }
    if (button.dataset.action === "toggle-password") {
      const input = button.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Show" : "Hide";
    }
  });

  root.addEventListener("input", (event) => {
    if (!event.target.matches('[data-role="user-search"]')) return;
    state.search = event.target.value;
    renderDashboard();
    const input = root.querySelector('[data-role="user-search"]');
    input?.focus();
    input?.setSelectionRange(state.search.length, state.search.length);
  });

  root.addEventListener("keydown", (event) => {
    const row = event.target.closest("tr[data-user-id]");
    if (!row || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    state.selectedUserId = row.dataset.userId;
    state.selectedAttemptId = "";
    state.answers = [];
    renderDashboard();
  });
})();
