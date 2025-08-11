"use client";

import { useRouter } from "next/navigation";

export default function DeleteButtonClient({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    const ok = typeof window !== "undefined" ? window.confirm("Delete this saved search?") : false;
    if (!ok) return;
    await fetch(`/api/research/saved/${id}/delete`, { method: "POST" });
    router.refresh();
  }
  return (
    <button
      onClick={onDelete}
      className="inline-flex h-8 w-8 items-center justify-center rounded border hover:bg-accent text-red-500"
      aria-label="Delete saved search"
      title="Delete saved search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM8 9h2v9H8V9Z"/>
      </svg>
    </button>
  );
}


