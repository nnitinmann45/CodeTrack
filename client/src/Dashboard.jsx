import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { api } from "./api";
import { useAuth } from "./main";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);
const platforms = [
  "LeetCode",
  "Codeforces",
  "HackerRank",
  "GeeksforGeeks",
  "Other",
];
const difficulties = ["Easy", "Medium", "Hard"];
const topics = [
  "Arrays",
  "Strings",
  "Hash Map",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Recursion",
  "Dynamic Programming",
  "Greedy",
  "Math",
  "Other",
];
function today(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      border: { display: false },
      grid: { color: "#edf0ec" },
    },
  },
};
export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [page, setPage] = useState("Overview"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [platform, setPlatform] = useState(""),
    [topic, setTopic] = useState(""),
    [pageNumber, setPageNumber] = useState(1);
  async function reload() {
    setLoading(true);
    setError("");
    try {
      setData(await api("/problems"));
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    setPageNumber(1);
  }, [search, difficulty, platform, topic]);
  const filtered = (data?.problems || []).filter(
    (p) =>
      `${p.title} ${p.topic} ${p.notes}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!difficulty || p.difficulty === difficulty) &&
      (!platform || p.platform === platform) &&
      (!topic || p.topic === topic),
  );
  const maxPage = Math.max(1, Math.ceil(filtered.length / 10)),
    currentPage = Math.min(pageNumber, maxPage);
  const rows =
    page === "Overview"
      ? (data?.problems || []).slice(0, 5)
      : filtered.slice((currentPage - 1) * 10, currentPage * 10);
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      setError(e.message);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api("/problems/" + deleting._id, { method: "DELETE" });
      setDeleting(null);
      setToast("Problem deleted. Your progress has been recalculated.");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            problems: data.problems.map(
              ({
                title,
                platform,
                url,
                difficulty,
                topic,
                solvedDate,
                notes,
              }) => ({
                title,
                platform,
                url,
                difficulty,
                topic,
                solvedDate,
                notes,
              }),
            ),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codetrack-problems.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">C</span>CodeTrack
          <span className="brand-dot">.</span>
        </a>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            ["Overview", "◫"],
            ["Problems", "☷"],
            ["Achievements", "◇"],
            ["Settings", "⚙"],
          ].map(([name, icon]) => (
            <button
              key={name}
              aria-label={name}
              title={name}
              className={"nav-item " + (page === name ? "active" : "")}
              onClick={() => setPage(name)}
            >
              <span aria-hidden="true">{icon}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span>THE DAILY COMMIT</span>
          <p>Progress comes from showing up, one problem at a time.</p>
        </div>
        <div className="profile">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>Personal workspace</small>
          </div>
        </div>
        <button className="logout" onClick={logout}>
          Log out
        </button>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span> {page}
          </span>
          <span className="date-label">
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeZone: user.timezone,
            }).format(new Date())}
          </span>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {page === "Overview"
                  ? "MAKE PROGRESS VISIBLE"
                  : "YOUR CODING JOURNEY"}
              </p>
              <h1>
                {page === "Overview"
                  ? `Keep going, ${user.name.split(" ")[0]}.`
                  : page}
              </h1>
              <p className="muted">
                {page === "Overview"
                  ? "Every problem is another step forward. Here’s where you stand."
                  : page === "Problems"
                    ? "Your practice history, all in one place."
                    : page === "Achievements"
                      ? "Small milestones. Meaningful momentum."
                      : "Make this workspace yours."}
              </p>
            </div>
            {page !== "Settings" && (
              <button onClick={() => setEditor({})}>＋ Log a problem</button>
            )}
          </div>
          {toast && (
            <div className="success" role="status">
              {toast}
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              <button className="text-button" onClick={reload}>
                Retry
              </button>
            </div>
          )}
          {loading && !data ? (
            <div className="panel">Loading your progress…</div>
          ) : (
            <>
              {page === "Overview" && data && (
                <>
                  <section className="stats-grid">
                    {[
                      [
                        "Problems solved",
                        data.stats.total,
                        "Across all your platforms",
                      ],
                      [
                        "Total points",
                        data.stats.points,
                        "Easy 10 · Medium 20 · Hard 40",
                      ],
                      [
                        "Current streak",
                        `${data.stats.currentStreak} days`,
                        data.stats.todayCount
                          ? "You showed up today."
                          : "One problem keeps the momentum.",
                      ],
                      [
                        "Longest streak",
                        `${data.stats.longestStreak} days`,
                        "Your personal best",
                      ],
                    ].map(([label, value, caption]) => (
                      <article className="stat-card" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>{caption}</small>
                      </article>
                    ))}
                  </section>
                  <section className="chart-grid">
                    <article className="panel">
                      <div className="panel-heading">
                        <h2>Practice rhythm</h2>
                        <span className="pill">Last 14 days</span>
                      </div>
                      <div className="line-chart">
                        <Line
                          options={chartOptions}
                          data={{
                            labels: data.stats.activity
                              .slice(-14)
                              .map((d) => d.date.slice(5)),
                            datasets: [
                              {
                                data: data.stats.activity
                                  .slice(-14)
                                  .map((d) => d.count),
                                borderColor: "#26775d",
                                backgroundColor: "rgba(38,119,93,.08)",
                                fill: true,
                                tension: 0.35,
                                pointRadius: 3,
                              },
                            ],
                          }}
                        />
                      </div>
                    </article>
                    <article className="panel">
                      <div className="panel-heading">
                        <h2>Difficulty mix</h2>
                        <span className="muted">{data.stats.total} total</span>
                      </div>
                      {data.stats.total ? (
                        <div className="doughnut-chart">
                          <Doughnut
                            options={{
                              maintainAspectRatio: false,
                              cutout: "76%",
                              plugins: { legend: { display: false } },
                            }}
                            data={{
                              labels: difficulties,
                              datasets: [
                                {
                                  data: difficulties.map(
                                    (d) => data.stats.difficulty[d],
                                  ),
                                  backgroundColor: [
                                    "#489e7a",
                                    "#dfb554",
                                    "#ce7669",
                                  ],
                                  borderWidth: 0,
                                },
                              ],
                            }}
                          />
                        </div>
                      ) : (
                        <div className="chart-empty">
                          Your first problem starts the story.
                        </div>
                      )}
                      <div className="difficulty-legend">
                        {difficulties.map((d) => (
                          <span key={d}>
                            <i className={"dot " + d.toLowerCase()} />
                            {d}
                            <b>{data.stats.difficulty[d]}</b>
                          </span>
                        ))}
                      </div>
                    </article>
                  </section>
                  <section className="panel activity-panel">
                    <div className="panel-heading">
                      <h2>Show up. Build consistency.</h2>
                      <span className="muted">
                        Last 12 weeks · {user.timezone}
                      </span>
                    </div>
                    <div className="heatmap">
                      {data.stats.activity.map((d) => (
                        <div
                          key={d.date}
                          title={`${d.date}: ${d.count} problems`}
                          aria-label={`${d.date}: ${d.count} problems`}
                          className={"heat-cell level-" + Math.min(d.count, 4)}
                        />
                      ))}
                    </div>
                    <div className="heat-caption">
                      <span>Every square is a day of your journey.</span>
                      <span>
                        Less <i className="heat-cell level-0" />
                        <i className="heat-cell level-2" />
                        <i className="heat-cell level-4" /> More
                      </span>
                    </div>
                  </section>
                </>
              )}
              {(page === "Overview" || page === "Problems") && data && (
                <section className="panel problems-panel">
                  <div className="panel-heading">
                    <h2>
                      {page === "Overview"
                        ? "Recent practice"
                        : "Problem library"}
                    </h2>
                    {page === "Overview" ? (
                      <button
                        className="text-button"
                        onClick={() => setPage("Problems")}
                      >
                        View all →
                      </button>
                    ) : (
                      <button
                        className="secondary compact"
                        onClick={exportData}
                      >
                        Export JSON
                      </button>
                    )}
                  </div>
                  {page === "Problems" && (
                    <div className="filters">
                      <input
                        aria-label="Search problems"
                        placeholder="Search title, topic, or notes…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <select
                        aria-label="Filter difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="">All difficulties</option>
                        {difficulties.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                      >
                        <option value="">All platforms</option>
                        {platforms.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option value="">All topics</option>
                        {[...new Set(data.problems.map((p) => p.topic))]
                          .sort()
                          .map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                      </select>
                    </div>
                  )}
                  {rows.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Problem</th>
                            <th>Difficulty</th>
                            <th>Topic</th>
                            <th>Solved on</th>
                            <th>
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((p) => (
                            <tr key={p._id}>
                              <td>
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {p.title} <span className="external">↗</span>
                                </a>
                                <small>{p.platform}</small>
                              </td>
                              <td>
                                <span
                                  className={
                                    "difficulty " + p.difficulty.toLowerCase()
                                  }
                                >
                                  {p.difficulty}
                                </span>
                              </td>
                              <td>
                                <span className="topic-tag">{p.topic}</span>
                              </td>
                              <td className="nowrap">{p.solvedDate}</td>
                              <td className="row-actions">
                                <button
                                  className="text-button"
                                  aria-label={"Edit " + p.title}
                                  onClick={() => setEditor(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-button danger-text"
                                  aria-label={"Delete " + p.title}
                                  onClick={() => setDeleting(p)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty">
                      <div className="empty-icon">⌘</div>
                      <h3>
                        {data.problems.length
                          ? "No matching problems"
                          : "Your next chapter starts here"}
                      </h3>
                      <p>
                        {data.problems.length
                          ? "Try a different search or filter."
                          : "Log a problem you’ve solved and watch your progress take shape."}
                      </p>
                      {!data.problems.length && (
                        <button onClick={() => setEditor({})}>
                          Log your first problem
                        </button>
                      )}
                    </div>
                  )}
                  {page === "Problems" && (
                    <div className="pagination">
                      <span>
                        {filtered.length} problem
                        {filtered.length !== 1 ? "s" : ""}
                      </span>
                      <div>
                        <button
                          className="secondary compact"
                          disabled={currentPage === 1}
                          onClick={() => setPageNumber(currentPage - 1)}
                        >
                          Previous
                        </button>
                        <span>
                          {currentPage} / {maxPage}
                        </span>
                        <button
                          className="secondary compact"
                          disabled={currentPage === maxPage}
                          onClick={() => setPageNumber(currentPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
              {page === "Achievements" && data && (
                <>
                  <section className="badge-grid">
                    {data.stats.badges.map((b, i) => (
                      <article
                        className={
                          "panel badge-card " + (b.earned ? "earned" : "locked")
                        }
                        key={b.name}
                      >
                        <div className="badge-icon">
                          {["✦", "↗", "★", "♧", "⚑", "◆"][i]}
                        </div>
                        <span className="eyebrow">
                          {b.earned ? "EARNED" : "IN PROGRESS"}
                        </span>
                        <h2>{b.name}</h2>
                        <p className="muted">{b.description}</p>
                      </article>
                    ))}
                  </section>
                  <section className="panel">
                    <h2>Topics explored</h2>
                    {Object.keys(data.stats.topics).length ? (
                      <div className="topic-list">
                        {Object.entries(data.stats.topics)
                          .sort((a, b) => b[1] - a[1])
                          .map(([name, count]) => (
                            <div key={name}>
                              <span>{name}</span>
                              <strong>{count} solved</strong>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="muted">
                        Your topics will appear as you log problems.
                      </p>
                    )}
                  </section>
                  <p className="fine-print">
                    Points and achievements reflect your current records.
                    Editing or deleting a record recalculates them. One unique
                    problem URL earns points once.
                  </p>
                </>
              )}
              {page === "Settings" && <Settings onSaved={setToast} />}
            </>
          )}
          <footer className="footer">
            CodeTrack <span>Practice with intention.</span>
          </footer>
        </div>
      </main>
      {editor && (
        <ProblemEditor
          problem={editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            setToast("Problem saved. Keep going!");
            await reload();
          }}
        />
      )}
      {deleting && (
        <Modal
          title="Delete this problem?"
          onClose={() => !busy && setDeleting(null)}
        >
          <p>
            Remove “{deleting.title}”? Your points, streaks, and badges will be
            recalculated. This cannot be undone.
          </p>
          <div className="modal-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button className="danger" disabled={busy} onClick={remove}>
              {busy ? "Deleting…" : "Delete problem"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="panel-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="text-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
function ProblemEditor({ problem, onClose, onSaved }) {
  const { user } = useAuth(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/problems" + (problem._id ? "/" + problem._id : ""), {
        method: problem._id ? "PUT" : "POST",
        body,
      });
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={problem._id ? "Edit problem" : "Log a solved problem"}
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit}>
        <label>
          Problem title
          <input
            autoFocus
            name="title"
            required
            maxLength={160}
            defaultValue={problem.title || ""}
            placeholder="e.g. Two Sum"
          />
        </label>
        <label>
          Problem URL
          <input
            name="url"
            type="url"
            required
            maxLength={1000}
            defaultValue={problem.url || ""}
            placeholder="https://leetcode.com/problems/two-sum/"
          />
        </label>
        <div className="form-row">
          <label>
            Platform
            <select
              name="platform"
              defaultValue={problem.platform || "LeetCode"}
            >
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select
              name="difficulty"
              defaultValue={problem.difficulty || "Easy"}
            >
              {difficulties.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Topic
            <input
              list="topics"
              name="topic"
              required
              maxLength={60}
              defaultValue={problem.topic || ""}
              placeholder="e.g. Hash Map"
            />
            <datalist id="topics">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label>
            Solved date
            <input
              type="date"
              name="solvedDate"
              required
              min="2000-01-01"
              max={today(user.timezone)}
              defaultValue={problem.solvedDate || today(user.timezone)}
            />
          </label>
        </div>
        <label>
          Notes <span className="muted">(optional)</span>
          <textarea
            name="notes"
            rows={4}
            maxLength={5000}
            defaultValue={problem.notes || ""}
            placeholder="Your approach, time complexity, or what you learned…"
          />
        </label>
        <p className="fine-print">
          Log each problem once. Dates use {user.timezone}.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button disabled={busy}>{busy ? "Saving…" : "Save problem"}</button>
        </div>
      </form>
    </Modal>
  );
}
function Settings({ onSaved }) {
  const { user, setUser, mailConfigured } = useAuth(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const d = await api("/auth/settings", {
        method: "PATCH",
        body: {
          name: form.get("name"),
          timezone: form.get("timezone"),
          remindersEnabled: form.get("remindersEnabled") === "on",
        },
      });
      setUser(d.user);
      onSaved("Settings saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError("");
    try {
      const d = await api("/auth/send-verification", { method: "POST" });
      onSaved(d.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel settings-panel">
      <h2>Your profile</h2>
      <form onSubmit={submit}>
        <label>
          Name
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={user.name}
          />
        </label>
        <label>
          Email
          <input value={user.email} disabled readOnly />
        </label>
        <label>
          Timezone
          <input
            name="timezone"
            required
            defaultValue={user.timezone}
            list="timezones"
          />
          <datalist id="timezones">
            {[
              "Asia/Kolkata",
              "UTC",
              "America/New_York",
              "Europe/London",
              "Asia/Singapore",
              "Australia/Sydney",
            ].map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <p className="fine-print">
          Timezone controls today’s date and your current streak. Existing
          solved dates stay as entered.
        </p>
        <hr />
        <h2>Practice reminders</h2>
        <p className="muted">
          A gentle email after two days without practice. At most one reminder
          per 24 hours.
        </p>
        <p className="fine-print">
          {!mailConfigured
            ? "Email reminders are unavailable on this deployment."
            : user.emailVerified
              ? "Your email is verified."
              : "Verify your email before enabling reminders."}
        </p>
        {mailConfigured && !user.emailVerified && (
          <button
            type="button"
            className="secondary"
            onClick={verify}
            disabled={busy}
          >
            Send verification email
          </button>
        )}
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="remindersEnabled"
            defaultChecked={user.remindersEnabled}
            disabled={!mailConfigured || !user.emailVerified}
          />
          Send me practice reminders
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy}>
          {busy ? "Please wait…" : "Save settings"}
        </button>
      </form>
      <button
        className="secondary"
        style={{ marginTop: 20 }}
        onClick={async () => {
          try {
            await api("/auth/logout", { method: "POST" });
            setUser(null);
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Log out on all devices
      </button>
    </section>
  );
}
