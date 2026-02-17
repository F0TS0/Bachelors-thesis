/**
 * Unified error handling: map internal errors to user-friendly messages.
 */

export type ApiError = {
  code: string;
  message: string;
  statusCode: number;
};

const USER_FRIENDLY: Record<string, string> = {
  UNAUTHORIZED: "Please log in again.",
  BAD_REQUEST: "Invalid request. Please check your input.",
  RATE_LIMIT: "Too many requests. Please try again in a moment.",
  TIMEOUT: "Request took too long. Please try again.",
  AI_UNAVAILABLE: "AI service is temporarily unavailable.",
  DATABASE_ERROR: "Something went wrong on our end.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function toUserMessage(code: string): string {
  return USER_FRIENDLY[code] ?? USER_FRIENDLY.UNKNOWN;
}

export function mapError(err: unknown): ApiError {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("401") || msg.includes("Unauthorized")) {
    return { code: "UNAUTHORIZED", message: toUserMessage("UNAUTHORIZED"), statusCode: 401 };
  }
  if (msg.includes("400") || msg.includes("Bad Request") || msg.includes("No message")) {
    return { code: "BAD_REQUEST", message: toUserMessage("BAD_REQUEST"), statusCode: 400 };
  }
  if (msg.includes("429") || msg.includes("rate") || msg.includes("quota")) {
    return { code: "RATE_LIMIT", message: toUserMessage("RATE_LIMIT"), statusCode: 429 };
  }
  if (msg.includes("timeout") || msg.includes("Timeout") || msg.includes("ETIMEDOUT")) {
    return { code: "TIMEOUT", message: toUserMessage("TIMEOUT"), statusCode: 408 };
  }
  if (msg.includes("AbortError")) {
    return { code: "CANCELLED", message: "", statusCode: 0 };
  }
  if (msg.includes("vertex") || msg.includes("Vertex") || msg.includes("GOOGLE")) {
    return { code: "AI_UNAVAILABLE", message: toUserMessage("AI_UNAVAILABLE"), statusCode: 503 };
  }
  if (msg.includes("SQLite") || msg.includes("database") || msg.includes("ECONNREFUSED")) {
    return { code: "DATABASE_ERROR", message: toUserMessage("DATABASE_ERROR"), statusCode: 500 };
  }

  return {
    code: "UNKNOWN",
    message: toUserMessage("UNKNOWN"),
    statusCode: 500,
  };
}
