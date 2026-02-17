/**
 * Central config: env vars, runtime checks.
 * Fail fast on missing required vars.
 */

const optional = (key: string, def: string) =>
  process.env[key] ?? def;

const required = (key: string, envKeys: string[]): string => {
  for (const k of envKeys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  throw new Error(
    `Missing required env: set one of [${envKeys.join(", ")}] in .env.local`
  );
};

export const config = {
  // Chat API
  chat: {
    maxMessageLength: 4000,
  },

  // Vertex AI
  vertex: {
    projectId: required("GOOGLE_CLOUD_PROJECT", [
      "GOOGLE_CLOUD_PROJECT",
      "GCLOUD_PROJECT",
      "GOOGLE_PROJECT_ID",
    ]),
    location: optional("VERTEX_LOCATION", "us-central1"),
    model: optional("VERTEX_MODEL", "gemini-1.0-pro"),
    credentialsPath: optional("GOOGLE_APPLICATION_CREDENTIALS", ""),
    enabled: process.env.VERTEX_FALLBACK_ENABLED !== "false",
  },

  // Admin
  admin: {
    password: process.env.ADMIN_PASSWORD ?? "",
  },
} as const;
