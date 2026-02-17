"use client";

import { useCallback, useEffect, useState } from "react";
import type { FaqRow } from "@/types/faq";
import type { AdminApiResponse } from "@/types/api";

const LS_KEY = "adminPw";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<FaqRow[]>([]);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setPw(saved);
  }, []);

  const setUi = useCallback((msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setStatus("");
    } else {
      setStatus(msg);
      setError("");
    }
  }, []);

  const callApi = useCallback(
    async (method: string, body?: Record<string, unknown>) => {
      const url =
        method === "GET" && search.trim()
          ? `/api/admin/faq?search=${encodeURIComponent(search.trim())}`
          : "/api/admin/faq";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": pw,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      let json: AdminApiResponse | null = null;
      try {
        json = (await res.json()) as AdminApiResponse;
      } catch {
        json = null;
      }

      if (!res.ok) {
        const msg =
          (json && !json.ok && json.error) || `HTTP ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      return json ?? { ok: true } as AdminApiResponse;
    },
    [pw, search]
  );

  const refresh = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setUi("Loading FAQ list...");
    try {
      const out = await callApi("GET");
      const data = out.ok ? (out.data ?? []) : [];
      setItems(data as FaqRow[]);
      setUi("FAQ list loaded.");
    } catch (e: unknown) {
      setUi(e instanceof Error ? e.message : "Failed to load FAQs.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, callApi, setUi]);

  const resetForm = useCallback(() => {
    setEditing(null);
    setQuestion("");
    setAnswer("");
    setCategory("");
    setStatus("");
    setError("");
  }, []);

  const login = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setUi("Checking password...");
    try {
      const out = await callApi("GET");
      localStorage.setItem(LS_KEY, pw);
      setAuthed(true);
      const data = out.ok ? (out.data ?? []) : [];
      setItems(data as FaqRow[]);
      setUi("Logged in.");
    } catch (e: unknown) {
      setAuthed(false);
      localStorage.removeItem(LS_KEY);
      setUi(e instanceof Error ? e.message : "Login failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, pw, callApi, setUi]);

  const logout = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setAuthed(false);
    setPw("");
    setItems([]);
    setEditing(null);
    resetForm();
  }, [resetForm]);

  const create = useCallback(async () => {
    if (busy) return;
    const q = question.trim();
    const a = answer.trim();
    const c = category.trim();
    if (!q || !a || !c) {
      setUi("Question, answer and category are required.", true);
      return;
    }
    setBusy(true);
    setUi("Creating FAQ...");
    try {
      await callApi("POST", { question: q, answer: a, category: c });
      await refresh();
      resetForm();
      setUi("FAQ created.");
    } catch (e: unknown) {
      setUi(e instanceof Error ? e.message : "Create failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, question, answer, category, callApi, refresh, resetForm, setUi]);

  const update = useCallback(async () => {
    if (!editing || busy) return;
    const q = question.trim();
    const a = answer.trim();
    const c = category.trim();
    if (!q || !a || !c) {
      setUi("Question, answer and category are required.", true);
      return;
    }
    setBusy(true);
    setUi(`Updating FAQ #${editing.id}...`);
    try {
      await callApi("PUT", { id: editing.id, question: q, answer: a, category: c });
      await refresh();
      resetForm();
      setUi("FAQ updated.");
    } catch (e: unknown) {
      setUi(e instanceof Error ? e.message : "Update failed.", true);
    } finally {
      setBusy(false);
    }
  }, [editing, busy, question, answer, category, callApi, refresh, resetForm, setUi]);

  const remove = useCallback(async (id: number) => {
    if (busy) return;
    setBusy(true);
    setUi(`Deleting FAQ #${id}...`);
    try {
      await callApi("DELETE", { id });
      await refresh();
      if (editing?.id === id) resetForm();
      setUi("FAQ deleted.");
    } catch (e: unknown) {
      setUi(e instanceof Error ? e.message : "Delete failed.", true);
    } finally {
      setBusy(false);
    }
  }, [busy, editing?.id, callApi, refresh, resetForm, setUi]);

  const load = useCallback((row: FaqRow) => {
    setEditing(row);
    setQuestion(row.question);
    setAnswer(row.answer);
    setCategory(row.category ?? "");
    setStatus(`Editing #${row.id}`);
    setError("");
  }, []);

  useEffect(() => {
    if (!pw.trim() || authed) return;
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pw]);

  useEffect(() => {
    if (authed) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-100 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-lg p-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Admin login
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Password from <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">ADMIN_PASSWORD</code> in .env.local
        </p>
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Admin password"
          type="password"
          className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          onClick={login}
          disabled={!pw.trim() || busy}
          className="mt-4 rounded-lg bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {busy ? "Checking..." : "Login"}
        </button>
        {status && (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{status}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 dark:bg-slate-950">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Admin — FAQ
        </h1>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Logout
        </button>
      </div>

      {status && (
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{status}</p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <strong className="text-slate-900 dark:text-slate-100">FAQ list</strong>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions, answers, categories…"
                aria-label="Search FAQs"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                onClick={refresh}
                disabled={busy}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {busy ? "…" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="grid max-h-[520px] gap-3 overflow-y-auto">
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
                  {row.category ?? "(no category)"} • #{row.id}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => load(row)}
                    disabled={busy}
                    className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(row.id)}
                    disabled={busy}
                    className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex justify-between">
            <strong className="text-slate-900 dark:text-slate-100">
              {editing ? `Edit #${editing.id}` : "Create FAQ"}
            </strong>
            <button
              onClick={resetForm}
              disabled={busy}
              className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>

          <div className="grid gap-3">
            <div>
              <label htmlFor="faq-question" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Question
              </label>
              <input
                id="faq-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What is your name?"
                disabled={busy}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="faq-answer" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Answer
              </label>
              <textarea
                id="faq-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="The reply shown when this question is matched"
                rows={6}
                disabled={busy}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="faq-category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <input
                id="faq-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Personal, Support, Pricing"
                disabled={busy}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Used for grouping and search
              </p>
            </div>

            {!editing ? (
              <button
                onClick={create}
                disabled={busy || !question.trim() || !answer.trim() || !category.trim()}
                className="rounded-lg bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {busy ? "Working…" : "Create"}
              </button>
            ) : (
              <button
                onClick={update}
                disabled={busy || !question.trim() || !answer.trim() || !category.trim()}
                className="rounded-lg bg-slate-800 px-5 py-2.5 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {busy ? "Working…" : "Update"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
    </main>
  );
}
