/**
 * Chat API - POST /api/chat
 *
 * Flow: 1) Try FAQ lookup for the latest user message.
 *       2) If no match, call Groq AI with conversation history and profile context.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getFaqByQuestion, getAboutMe } from "../../lib/db";
import { generateGroqResponseWithHistory } from "../../lib/groqAI";
import { config } from "../../lib/config";
import type { ChatSuccessResponse } from "@/types/api";

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Parse and validate messages array from request body */
function parseMessages(body: unknown): { messages: ChatMessage[]; lastUser: string } | null {
  const obj = body as { messages?: unknown };
  const arr = Array.isArray(obj?.messages) ? obj.messages : [];
  const messages: ChatMessage[] = [];
  let lastUser = "";
  for (const m of arr) {
    const role = m?.role === "user" ? "user" : m?.role === "assistant" ? "assistant" : null;
    const content = typeof m?.content === "string" ? m.content.trim() : "";
    if (role && content) {
      messages.push({ role, content });
      if (role === "user") lastUser = content;
    }
  }
  return lastUser ? { messages, lastUser } : null;
}

// Single backend entry point for chat: FAQ first, Groq AI fallback.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatSuccessResponse>
) {
  const started = Date.now();

  console.log("[chat] request", { method: req.method, url: req.url });

  try {
    if (req.method !== "POST") {
      console.warn("[chat] method not allowed", req.method);
      return res.status(405).json({ answer: "Method not allowed" });
    }

    const parsed = parseMessages(req.body);
    if (!parsed) {
      console.warn("[chat] bad request: missing/invalid messages");
      return res.status(400).json({ answer: "No message provided" });
    }

    const { messages, lastUser: userMessage } = parsed;

    // Step 1: Try FAQ lookup for the latest user message.
    console.log("[chat] faq lookup");
    const faq = getFaqByQuestion(userMessage);

    if (faq) {
      console.log("[chat] answered from faq", { id: faq.id, category: faq.category });
      return res.status(200).json({ answer: faq.answer });
    }

    // Step 2: If no FAQ match and Groq fallback is enabled, use AI with conversation history.
    if (!config.groq.enabled) {
      console.log("[chat] no faq match, groq fallback disabled");
      return res.status(200).json({
        answer: "No FAQ match found. AI fallback is currently disabled.",
      });
    }

    console.log("[chat] no faq match, calling groq", { historyLength: messages.length });

    const aboutMe = getAboutMe();
    const aiResponse = await generateGroqResponseWithHistory(messages, aboutMe ?? undefined);

    console.log("[chat] answered from groq", {
      chars: typeof aiResponse === "string" ? aiResponse.length : 0,
    });

    return res.status(200).json({ answer: aiResponse });
  } catch (err: any) {
    // I log the full error server-side for debugging.
    console.error("[chat] handler error", {
      message: err?.message,
      stack: err?.stack,
    });

    return res
      .status(500)
      .json({ answer: "Sorry, something went wrong with AI." });
  } finally {
    console.log("[chat] request finished", { ms: Date.now() - started });
  }
}