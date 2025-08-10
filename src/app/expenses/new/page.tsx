"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NewExpensePage() {
  const router = useRouter();
  const [occurredAt, setOccurredAt] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setMsg("Not signed in");
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      occurred_at: occurredAt || null,
      category,
      amount: Number(amount),
      note: note || null,
    });
    if (error) {
      setSaving(false);
      setMsg(error.message);
      return;
    }
    router.replace("/expenses");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Add expense</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="date">Date</label>
            <input id="date" type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="category">Category</label>
            <input id="category" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="amount">Amount</label>
          <input id="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
        </div>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="note">Note</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
        </div>
        <button type="submit" disabled={saving} className="rounded-md px-4 py-2 bg-foreground text-background disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
      </form>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </div>
  );
}


