"use client";

import type { Message } from "@/types/chat";

type ChatMessageProps = {
  message: Message;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 whitespace-pre-wrap break-words ${
            isUser
              ? "bg-slate-800 text-white rounded-br-md dark:bg-slate-700"
              : "bg-slate-100 text-slate-900 rounded-bl-md dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
