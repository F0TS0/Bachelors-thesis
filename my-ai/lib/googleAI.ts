import fs from "fs";
import { VertexAI } from "@google-cloud/vertexai";

// Centralized helper for Google Vertex AI.
// I keep all LLM-related logic here so the rest of the app stays clean.
// UI components must never import this file directly.

// env variables
const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_PROJECT_ID;

// If the project ID is missing, I fail fast.
if (!projectId) {
  throw new Error(
    "Missing project id. Set GOOGLE_CLOUD_PROJECT (or GCLOUD_PROJECT) in .env"
  );
}

// Authentication (Application Default Credentials)
// For local development, I use a service account JSON key
// via GOOGLE_APPLICATION_CREDENTIALS.
const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// If credentials are set explicitly, I verify the file actually exists.
if (credsPath && !fs.existsSync(credsPath)) {
  throw new Error(
    `GOOGLE_APPLICATION_CREDENTIALS is set but the file does not exist: ${credsPath}\n` +
      `Fix your .env/.env.local so it points to a valid JSON key file.`
  );
}


const location = process.env.VERTEX_LOCATION || "us-central1";
const modelName = process.env.VERTEX_MODEL || "gemini-1.0-pro";
const timeoutMs = Number(process.env.VERTEX_TIMEOUT_MS) || 30_000;
const maxRetries = Number(process.env.VERTEX_MAX_RETRIES) || 2;

// I create a single Vertex AI client instance
const vertexAI = new VertexAI({ project: projectId, location });

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Vertex AI request timeout")), ms)
    ),
  ]);
}

// This function is the only public entry point for AI generation.
export async function generateVertexAIResponse(
  prompt: string
): Promise<string> {
  const model = vertexAI.getGenerativeModel({ model: modelName });
  let lastErr: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await withTimeout(
        model.generateContent({
          contents: [
            { role: "user", parts: [{ text: prompt }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
        timeoutMs
      );

      const text = result.response.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text)
        .filter(Boolean)
        .join("")
        ?.trim();

      return text || "Sorry, I could not generate a response.";
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        console.warn("[vertex] retry", { attempt: attempt + 1, maxRetries });
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastErr;
}