"use client";

import { useEffect, useRef, useState } from "react";

//I keep roles as a union so I can extend it later (e.g. "system", "moderator")
 
type Role = "user" | "bot";

type Msg = { role: Role; content: string };

//This matches what my backend returns from POST /api/chat. If I change the API response, I update this type first.
 
type ChatResponse = { answer?: string };

const START: Msg[] = [{ role: "bot", content: "Hey! Ask me something 👇" }];

export default function ChatUI() {
  // Chat History
  const [messages, setMessages] = useState<Msg[]>(START);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // I scroll to this element when new messages arrive.
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // If I submit again while a request is running, I cancel the old one to avoid race conditions.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function append(role: Role, content: string) {
    setMessages((prev) => [...prev, { role, content }]);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    // Cancel any previous call
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setInput("");
    setLoading(true);
    append("user", text);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      // I’ll handle 401/403 here.
      if (!res.ok) {
        const extra = await res.text().catch(() => "");
        throw new Error(
          `Request failed: ${res.status} ${res.statusText}${extra ? ` — ${extra}` : ""}`
        );
      }

      const data = (await res.json()) as ChatResponse;
      const answer =
        typeof data.answer === "string" && data.answer.trim()
          ? data.answer
          : "No answer returned.";

      append("bot", answer);
    } catch (err: any) {
      // AbortError is expected when I cancel requests.
      if (err?.name === "AbortError") return;

      append("bot", "API call failed. Check server logs.");
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    // If I want to keep conversation context later, I can remove this button and store messages instead.
    setMessages(START);
  }

  return (
    <div className="chatShell">
      <div className="chatHeader">
        <div className="chatTitle">AI FAQ Chat</div>
        <div className="chatSub">SQLite FAQ → Vertex AI (RAG)</div>

        {}
        <button className="chatBtn" onClick={clearChat} disabled={loading} style={{ marginLeft: "auto" }}>
          Clear
        </button>
      </div>

      <div className="chatBody">
        {messages.map((m, idx) => (
          <div key={idx} className={`msgRow ${m.role === "user" ? "right" : "left"}`}>
            <div className={`msgBubble ${m.role === "user" ? "user" : "bot"}`}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="msgRow left">
            <div className="msgBubble bot">Typing…</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chatInputBar">
        <input
          className="chatInput"
          value={input}
          placeholder='Type a question (e.g., "What is your name?")'
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={loading}
        />
        <button className="chatBtn" onClick={sendMessage} disabled={loading || input.trim().length === 0}>
          Send
        </button>
      </div>
    </div>
  );
}