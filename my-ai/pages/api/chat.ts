import type { NextApiRequest, NextApiResponse } from "next";
import { getFaqByQuestion } from "../../lib/db";
import { generateVertexAIResponse } from "../../lib/googleAI";

type Data = { answer: string };

// This is my single backend entry point for the chat UI.
// The frontend only talks to POST /api/chat.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // I only support POST here
  if (req.method !== "POST") {
    return res.status(405).json({ answer: "Method not allowed" });
  }

  // I validate the request body early so I don't waste AI calls.
  const { message } = (req.body as { message?: unknown }) || {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ answer: "No message provided" });
  }

  const userMessage = message.trim();

  // Step 1: I try to answer using my FAQ database first.
  const faq = getFaqByQuestion(userMessage);

  // If I find a good FAQ match, I return it immediately.
  if (faq) {
    return res.status(200).json({ answer: faq.answer });
  }

  // Step 2: If there is no FAQ match, I fall back to Vertex AI.
  // I pass a short prompt 
  try {
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
    return res.status(200).json({ answer: aiResponse });
  } catch (err) {
    // I log the full error server-side for debugging.
    console.error("Vertex AI error:", err);
    return res
      .status(500)
      .json({ answer: "Sorry, something went wrong with AI." });
  }
}