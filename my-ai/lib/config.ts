/**
 * Central config: env vars, runtime checks.
 * Fail fast on missing required vars.
 */

export const config = {
  /** Chat API limits */
  chat: {
    maxMessageLength: 4000,
  },

  /** Groq AI fallback (set GROQ_FALLBACK_ENABLED=false to disable) */
  groq: {
    enabled: process.env.GROQ_FALLBACK_ENABLED !== "false",
  },

  /** Admin auth (ADMIN_PASSWORD) */
  admin: {
    password: process.env.ADMIN_PASSWORD ?? "",
  },
} as const;
