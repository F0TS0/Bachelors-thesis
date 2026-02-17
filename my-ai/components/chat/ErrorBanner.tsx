"use client";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-red-800 dark:text-red-200">{message}</span>
        <div className="flex gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
