"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface DeleteButtonClientProps {
  id: string;
  title?: string | null;
}

export default function DeleteButtonClient({ id, title }: DeleteButtonClientProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  async function onDelete() {
          await fetch(`/api/search/saved/${id}/delete`, { method: "POST" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded border hover:bg-accent text-red-500 transition-colors"
        aria-label="Delete saved search"
        title="Delete saved search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM8 9h2v9H8V9Z"/>
        </svg>
      </button>

      <DeleteConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={onDelete}
        title="Delete Saved Search"
        message="Are you sure you want to delete this saved search"
        itemName={title || undefined}
      />
    </>
  );
}


