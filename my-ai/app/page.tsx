/** Home page - renders the chat UI */
import ChatUI from "@/components/ChatUI";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <ChatUI />
    </main>
  );
}