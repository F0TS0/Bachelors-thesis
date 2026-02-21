"use client";

/** Animated dots shown while waiting for AI response */
export function LoadingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex flex-col max-w-[85%] sm:max-w-[80%] items-start">
        <div className="flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
          <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
