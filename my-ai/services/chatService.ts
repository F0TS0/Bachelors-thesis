/**
 * Chat API service - UI calls this, not fetch directly.
 * Single place for API URL, headers, and error mapping.
 */

import { mapError } from "@/lib/errors";
import type { ChatSuccessResponse } from "@/types/api";

export type ChatResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

export async function sendChatMessage(
  message: string,
  signal?: AbortSignal
): Promise<ChatResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
      signal,
    });

    const data = (await res.json()) as ChatSuccessResponse & { error?: string };

    if (!res.ok) {
      const errMsg = data.error ?? data.answer ?? `Request failed: ${res.status}`;
      const mapped = mapError(new Error(errMsg));
      return { ok: false, error: mapped.message || errMsg };
    }

    const answer =
      typeof data.answer === "string" && data.answer.trim()
        ? data.answer.trim()
        : "No answer returned.";

    return { ok: true, answer };
  } catch (err) {
    const mapped = mapError(err);
    if (mapped.code === "CANCELLED") {
      return { ok: false, error: "" }; // Swallow abort
    }
    return { ok: false, error: mapped.message };
  }
}
