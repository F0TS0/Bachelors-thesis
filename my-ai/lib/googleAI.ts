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

// I create a single Vertex AI client instance
const vertexAI = new VertexAI({ project: projectId, location });

// This function is the only public entry point for AI generation.
export async function generateVertexAIResponse(
  prompt: string
): Promise<string> {
  // I fetch the generative model instance here
  const model = vertexAI.getGenerativeModel({ model: modelName });
  // I send the prompt to Vertex AI and wait for the response.
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      // Temperature controls creativity vs determinism.
      temperature: 0.7,
      // Token limit prevents overly long or runaway responses.
      maxOutputTokens: 300,
    },
  });

  const text = result.response.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text)
    .filter(Boolean)
    .join("")
    ?.trim();

  return text || "Sorry, I could not generate a response.";
}