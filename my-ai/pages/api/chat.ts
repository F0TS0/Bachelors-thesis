import type { NextApiRequest, NextApiResponse } from "next";
import { getFaqByQuestion } from "../../lib/db";
import { generateVertexAIResponse } from "../../lib/googleAI";
import { config } from "../../lib/config";
import type { ChatSuccessResponse } from "@/types/api";

// Single backend entry point for chat: FAQ first, Vertex AI fallback.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatSuccessResponse>
) {
  const started = Date.now();

  // I log every request so I can see what's happening while testing.
  console.log("[chat] request", { method: req.method, url: req.url });

  try {
    // I only support POST here.
    if (req.method !== "POST") {
      console.warn("[chat] method not allowed", req.method);
      return res.status(405).json({ answer: "Method not allowed" });
    }

    // I validate the request body early so I don't waste AI calls.
    const { message } = (req.body as { message?: unknown }) || {};
    if (typeof message !== "string" || !message.trim()) {
      console.warn("[chat] bad request: missing/invalid message", {
        type: typeof message,
      });
      return res.status(400).json({ answer: "No message provided" });
    }

    const userMessage = message.trim();

    // Step 1: I try to answer using my FAQ database first.
    console.log("[chat] faq lookup");
    const faq = getFaqByQuestion(userMessage);

    // If I find a good FAQ match, I return it immediately.
    if (faq) {
      console.log("[chat] answered from faq", { id: faq.id, category: faq.category });
      return res.status(200).json({ answer: faq.answer });
    }

    // Step 2: If no FAQ match and Vertex fallback is enabled, use AI.
    if (!config.vertex.enabled) {
      console.log("[chat] no faq match, vertex fallback disabled");
      return res.status(200).json({
        answer: "No FAQ match found. AI fallback is currently disabled.",
      });
    }

    console.log("[chat] no faq match, calling vertex");
    const prompt = [
      "You are an AI assistant for a website.",
      "If you do not know something specific about the website/company, say so.",
      "Be concise and helpful.",
      "",
      `User question: ${userMessage}`,
      "",
      "Answer:",
    ].join("\n");

    const aiResponse = await generateVertexAIResponse(prompt);

    console.log("[chat] answered from vertex", {
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