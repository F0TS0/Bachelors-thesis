"use client";

/** Text input + Send button; auto-expanding textarea, Enter to send, Shift+Enter for newline */
import { useCallback, useEffect, useRef, useState } from "react";

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const MIN_ROWS = 1;
const MAX_ROWS = 6;

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a question…",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-resize textarea as user types */
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const newHeight = Math.min(
      Math.max(el.scrollHeight, MIN_ROWS * lineHeight),
      MAX_ROWS * lineHeight
    );
    el.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          // Shift+Enter = newline
          return;
        }
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex gap-3 p-3 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={MIN_ROWS}
        className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-500"
        style={{ minHeight: 24 * MIN_ROWS, maxHeight: 24 * MAX_ROWS }}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="self-end rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white transition-opacity hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        Send
      </button>
    </div>
  );
}
