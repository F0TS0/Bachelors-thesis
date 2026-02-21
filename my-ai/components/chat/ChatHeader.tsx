"use client";

/** Chat header: title, subtitle, theme toggle, clear button */
type ChatHeaderProps = {
  onClear: () => void;
  clearDisabled?: boolean;
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export function ChatHeader({
  onClear,
  clearDisabled = false,
  theme,
  onThemeToggle,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div>
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          AI FAQ Chat
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          SQLite FAQ → Groq
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onThemeToggle}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
