"use client";

/**
 * useChat - chat state and actions
 *
 * Manages messages, loading, errors. Sends to API with full history for
 * multi-turn conversation. Supports retry and clear.
 */

import { useCallback, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import { sendChatMessage } from "@/services/chatService";

/** First message shown when chat loads */
const INITIAL_MESSAGES: Message[] = [
  {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Hey! Ask me something 👇",
    timestamp: new Date(),
  },
];

type ChatState = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
};

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: INITIAL_MESSAGES,
    isLoading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  /** Add a new message to the list */
  const appendMessage = useCallback((role: Message["role"], content: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
  }, []);

  /** Send user message; on retry, omit last user msg from history to avoid dup */
  const sendMessage = useCallback(
    async (text: string, retryLastUserMessage?: string) => {
      const trimmed = text.trim();
      if (!trimmed || state.isLoading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!retryLastUserMessage) {
        appendMessage("user", trimmed);
      }

      // Build history: on retry, exclude last user msg since we're resending it
      const baseHistory = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const history = retryLastUserMessage
        ? baseHistory.slice(0, -1)
        : baseHistory;
      const result = await sendChatMessage(trimmed, history, controller.signal);

      setState((prev) => ({ ...prev, isLoading: false }));

      if (result.ok) {
        appendMessage("assistant", result.answer);
      } else if (result.error) {
        setState((prev) => ({ ...prev, error: result.error }));
      }
      // result.error empty = user aborted, no UI change
    },
    [state.isLoading, appendMessage]
  );

  const clearChat = useCallback(() => {
    setState({
      messages: INITIAL_MESSAGES,
      isLoading: false,
      error: null,
    });
  }, []);

  const retry = useCallback(() => {
    const lastUser = [...state.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUser) {
      setState((prev) => ({ ...prev, error: null }));
      sendMessage(lastUser.content, lastUser.content);
    }
  }, [state.messages, sendMessage]);

  const dismissError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearChat,
    retry,
    dismissError,
  };
}
