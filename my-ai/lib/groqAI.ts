/**
 * Groq AI integration
 *
 * Wraps Groq SDK for chat completions. Uses system prompt + optional
 * profile context (about me) so the bot can answer questions about the site owner.
 */

import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS) || 30_000;

if (!apiKey?.trim()) {
  throw new Error("Missing GROQ_API_KEY. Set it in .env.local");
}

const client = new Groq({ apiKey: apiKey.trim() });

/** Reject if the promise doesn't resolve within ms */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Groq request timeout")), ms)
    ),
  ]);
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Single-turn: send one prompt, get one reply */
export async function generateGroqResponse(prompt: string): Promise<string> {
  return generateGroqResponseWithHistory([{ role: "user", content: prompt }]);
}

/** Multi-turn: send conversation history + optional profile context */
export async function generateGroqResponseWithHistory(
  messages: ChatMessage[],
  systemContext?: string
): Promise<string> {
  let systemContent =
    "You are an AI assistant for a website. If you do not know something specific about the website/company, say so. Be concise and helpful.";
  if (systemContext?.trim()) {
    systemContent += `\n\nHere is information about the person who owns this site (use it to answer questions about them):\n\n${systemContext.trim()}`;
  }

  const completion = await withTimeout(
    client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
    timeoutMs
  );

  const text = completion.choices?.[0]?.message?.content?.trim();
  return text || "Sorry, I could not generate a response.";
}
