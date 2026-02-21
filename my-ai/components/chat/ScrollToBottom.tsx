"use client";

/** "New messages" button shown when user has scrolled up; clicks scroll to bottom */
import { useEffect, useState } from "react";

type ScrollToBottomProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  threshold?: number;
};

export function ScrollToBottom({
  containerRef,
  contentRef,
  threshold = 100,
}: ScrollToBottomProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef?.current ?? container;
    if (!container || !content) return;

    const check = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShow(distanceFromBottom > threshold);
    };

    check();
    container.addEventListener("scroll", check);
    const observer = new MutationObserver(check);
    observer.observe(content, { childList: true, subtree: true });
    return () => {
      container.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, [containerRef, contentRef, threshold]);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={scrollToBottom}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-slate-700 px-4 py-2 text-xs font-medium text-white shadow-lg transition-opacity hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500"
      aria-label="Scroll to bottom"
    >
      ↓ New messages
    </button>
  );
}
