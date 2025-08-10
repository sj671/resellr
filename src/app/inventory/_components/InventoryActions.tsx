"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function InventoryActions({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("inventory_items").delete().eq("id", id);
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2 justify-end">
      <Link href={`/inventory/${id}/edit`} className="text-sm underline">Edit</Link>
      <button onClick={onDelete} className="text-sm text-red-600 underline">Delete</button>
    </div>
  );
}


