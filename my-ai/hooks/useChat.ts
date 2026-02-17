"use client";

import { useCallback, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import { sendChatMessage } from "@/services/chatService";

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

  const appendMessage = useCallback((role: Message["role"], content: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
  }, []);

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

      const result = await sendChatMessage(trimmed, controller.signal);

      setState((prev) => ({ ...prev, isLoading: false }));

      if (result.ok) {
        appendMessage("assistant", result.answer);
      } else if (result.error) {
        setState((prev) => ({ ...prev, error: result.error }));
      }
      // result.error empty = aborted, do nothing
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
