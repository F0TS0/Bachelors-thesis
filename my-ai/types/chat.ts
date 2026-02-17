/**
 * Shared types for chat - used by UI, hooks, and API.
 * Single source of truth for message model.
 */

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
};

export type ChatApiResponse = {
  answer?: string;
};

export type ChatApiError = {
  error?: string;
};
