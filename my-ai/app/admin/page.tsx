"use client";

/**
 * Admin page - redirects to dashboard.
 * Kept for backward compatibility so /admin links still work.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard?section=faq");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
      <p className="text-slate-500">Redirecting to dashboard…</p>
    </div>
  );
}
