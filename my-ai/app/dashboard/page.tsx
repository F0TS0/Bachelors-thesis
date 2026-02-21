"use client";

/**
 * Admin Dashboard
 *
 * Unified dashboard for bot configuration: Overview, Profile (about me),
 * and FAQ management. Uses ADMIN_PASSWORD for auth.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FaqRow } from "@/types/faq";
import type { AdminApiResponse } from "@/types/api";

/** localStorage key for persisting admin password between sessions */
const LS_KEY = "adminPw";

/** Dashboard sections (Overview, Profile, FAQs) */
type Section = "overview" | "profile" | "faq";

/** Sidebar navigation config */
const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◉" },
  { id: "profile", label: "Profile", icon: "◎" },
  { id: "faq", label: "FAQs", icon: "◆" },
];

export default function DashboardPage() {
  // Read section from URL query (?section=faq) for deep linking
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("section") as Section) || "overview";
  const [section, setSection] = useState<Section>(
    SECTIONS.some((s) => s.id === initialSection) ? initialSection : "overview"
  );

  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [aboutContent, setAboutContent] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<FaqRow[]>([]);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");

  // Restore saved password from previous session
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setPw(saved);
  }, []);

  /** Show status or error message in the UI */
  const setUi = useCallback((msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setStatus("");
    } else {
      setStatus(msg);
      setError("");
    }
  }, []);

  /** API client for profile (about me) - GET/PUT */
  const profileApi = useCallback(
    async (method: string, body?: Record<string, unknown>) => {
      const res = await fetch("/api/admin/profile", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; content?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      return json;
    },
    [pw]
  );

  /** API client for FAQ CRUD - GET/POST/PUT/DELETE */
  const faqApi = useCallback(
    async (method: string, body?: Record<string, unknown>) => {
      const url =
        method === "GET" && search.trim()
          ? `/api/admin/faq?search=${encodeURIComponent(search.trim())}`
          : "/api/admin/faq";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json()) as AdminApiResponse;
      if (!res.ok) {
        const msg = (json && !json.ok && json.error) || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return json ?? ({ ok: true } as AdminApiResponse);
    },
    [pw, search]
  );

  const loadProfile = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setUi("Loading…");
    try {
      const out = await profileApi("GET");
      setAboutContent(out.content ?? "");
      setUi("Profile loaded.");
    } catch (e) {
      setUi(e instanceof Error ? e.message : "Failed to load.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, profileApi, setUi]);

  const refreshFaq = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setUi("Loading FAQs…");
    try {
      const out = await faqApi("GET");
      setItems((out.data ?? []) as FaqRow[]);
      setUi("FAQs loaded.");
    } catch (e) {
      setUi(e instanceof Error ? e.message : "Failed to load FAQs.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, faqApi, setUi]);

  const login = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setUi("Checking password…");
    try {
      await profileApi("GET");
      localStorage.setItem(LS_KEY, pw);
      setAuthed(true);
      const out = await profileApi("GET");
      setAboutContent(out.content ?? "");
      const faqOut = await faqApi("GET");
      setItems((faqOut.data ?? []) as FaqRow[]);
      setUi("Logged in.");
    } catch (e) {
      setAuthed(false);
      localStorage.removeItem(LS_KEY);
      setUi(e instanceof Error ? e.message : "Login failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, pw, profileApi, faqApi, setUi]);

  const saveProfile = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setUi("Saving…");
    try {
      await profileApi("PUT", { content: aboutContent });
      setUi("Profile saved.");
    } catch (e) {
      setUi(e instanceof Error ? e.message : "Save failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, aboutContent, profileApi, setUi]);

  const resetFaqForm = useCallback(() => {
    setEditing(null);
    setQuestion("");
    setAnswer("");
    setCategory("");
  }, []);

  const createFaq = useCallback(async () => {
    if (busy) return;
    const q = question.trim();
    const a = answer.trim();
    const c = category.trim();
    if (!q || !a || !c) {
      setUi("Question, answer and category are required.", true);
      return;
    }
    setBusy(true);
    setUi("Creating…");
    try {
      await faqApi("POST", { question: q, answer: a, category: c });
      await refreshFaq();
      resetFaqForm();
      setUi("FAQ created.");
    } catch (e) {
      setUi(e instanceof Error ? e.message : "Create failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, question, answer, category, faqApi, refreshFaq, resetFaqForm, setUi]);

  const updateFaq = useCallback(async () => {
    if (!editing || busy) return;
    const q = question.trim();
    const a = answer.trim();
    const c = category.trim();
    if (!q || !a || !c) {
      setUi("Question, answer and category are required.", true);
      return;
    }
    setBusy(true);
    setUi("Updating…");
    try {
      await faqApi("PUT", { id: editing.id, question: q, answer: a, category: c });
      await refreshFaq();
      resetFaqForm();
      setUi("FAQ updated.");
    } catch (e) {
      setUi(e instanceof Error ? e.message : "Update failed.", true);
    } finally {
      setBusy(false);
    }
  }, [editing, busy, question, answer, category, faqApi, refreshFaq, resetFaqForm, setUi]);

  const deleteFaq = useCallback(async (id: number) => {
    if (busy) return;
    setBusy(true);
    setUi("Deleting…");
    try {
      await faqApi("DELETE", { id });
      await refreshFaq();
      if (editing?.id === id) resetFaqForm();
      setUi("FAQ deleted.");
    } catch (e) {
      setUi(e instanceof Error ? e.message : "Delete failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, editing?.id, faqApi, refreshFaq, resetFaqForm, setUi]);

  const loadFaq = useCallback((row: FaqRow) => {
    setEditing(row);
    setQuestion(row.question);
    setAnswer(row.answer);
    setCategory(row.category ?? "");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setAuthed(false);
    setPw("");
    setAboutContent("");
    setItems([]);
    resetFaqForm();
  }, [resetFaqForm]);

  // Load section data when switching tabs
  useEffect(() => {
    if (authed && section === "profile") loadProfile();
    if (authed && section === "faq") refreshFaq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, section]);

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in with your admin password
          </p>
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            type="password"
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            onClick={login}
            disabled={!pw.trim() || busy}
            className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-3 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {status && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{status}</p>}
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-700">
          <h1 className="font-semibold text-slate-900 dark:text-slate-100">Admin</h1>
        </div>
        <nav className="flex-1 p-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                section === s.id
                  ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span className="text-slate-400">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ← Back to chat
          </Link>
          <button
            onClick={logout}
            className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          {status && (
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{status}</p>
          )}
          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {section === "overview" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Overview
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">FAQs</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {items.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">questions in database</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Profile</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {aboutContent.trim() ? "Configured" : "Empty"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {aboutContent.trim()
                      ? `${aboutContent.split(/\s+/).filter(Boolean).length} words`
                      : "Add info in Profile"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">Quick links</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSection("profile")}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setSection("faq")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    Manage FAQs
                  </button>
                  <Link
                    href="/"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    Open chat
                  </Link>
                </div>
              </div>
            </div>
          )}

          {section === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Profile
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This text is given to the AI so it can answer questions about you.
              </p>
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <textarea
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  placeholder="Your name, job, interests, background…"
                  rows={14}
                  className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="flex gap-3">
                  <button
                    onClick={saveProfile}
                    disabled={busy}
                    className="rounded-lg bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={loadProfile}
                    disabled={busy}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    Reload
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === "faq" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                FAQs
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-slate-900 dark:text-slate-100">FAQ list</strong>
                    <div className="flex gap-2">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        onClick={() => refreshFaq()}
                        disabled={busy}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-slate-700"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="grid max-h-[480px] gap-3 overflow-y-auto">
                    {items.map((row) => (
                      <div
                        key={row.id}
                        className={`rounded-lg border p-3 ${
                          editing?.id === row.id
                            ? "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {row.question}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {row.category ?? "—"} • #{row.id}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => loadFaq(row)}
                            disabled={busy}
                            className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteFaq(row.id)}
                            disabled={busy}
                            className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-4 flex justify-between">
                    <strong className="text-slate-900 dark:text-slate-100">
                      {editing ? `Edit #${editing.id}` : "Create FAQ"}
                    </strong>
                    <button
                      onClick={resetFaqForm}
                      disabled={busy}
                      className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Question
                      </label>
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g. What is your name?"
                        disabled={busy}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Answer
                      </label>
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="The reply for this question"
                        rows={5}
                        disabled={busy}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Personal, Support"
                        disabled={busy}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    {!editing ? (
                      <button
                        onClick={createFaq}
                        disabled={busy || !question.trim() || !answer.trim() || !category.trim()}
                        className="rounded-lg bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700"
                      >
                        {busy ? "…" : "Create"}
                      </button>
                    ) : (
                      <button
                        onClick={updateFaq}
                        disabled={busy || !question.trim() || !answer.trim() || !category.trim()}
                        className="rounded-lg bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700"
                      >
                        {busy ? "…" : "Update"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
