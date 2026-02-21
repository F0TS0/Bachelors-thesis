"use client";

/**
 * ChatUI - main chat interface
 *
 * Header (clear, theme), message list, loading state, error banner,
 * scroll-to-bottom, and input. Uses useChat for state.
 */

import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatInput } from "./chat/ChatInput";
import { LoadingIndicator } from "./chat/LoadingIndicator";
import { ErrorBanner } from "./chat/ErrorBanner";
import { ScrollToBottom } from "./chat/ScrollToBottom";
import { useChat } from "@/hooks/useChat";

const THEME_KEY = "chat-theme";

/** Read theme from localStorage or system preference */
function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ChatUI() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retry,
    dismissError,
  } = useChat();

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <ChatHeader
        onClear={clearChat}
        clearDisabled={isLoading}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div ref={bodyRef} className="relative flex-1 overflow-y-auto p-4">
        <div ref={contentRef} className="pb-2">
          {error && (
            <ErrorBanner
              message={error}
              onRetry={retry}
              onDismiss={dismissError}
            />
          )}
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isLoading && <LoadingIndicator />}
        </div>
        <div aria-hidden className="h-px" />
      </div>

      <ScrollToBottom
        containerRef={bodyRef}
        contentRef={contentRef}
        threshold={80}
      />

      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder='Type a question (e.g., "What is your name?")'
      />
    </div>
  );
}
