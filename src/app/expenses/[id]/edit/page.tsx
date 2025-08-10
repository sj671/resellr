"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { z } from "zod";

const FormSchema = z.object({
  occurred_at: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01),
  note: z.string().optional(),
});

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [occurredAt, setOccurredAt] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("occurred_at,category,amount,note")
        .eq("id", id)
        .maybeSingle();
      if (error) setMsg(error.message);
      if (data) {
        setOccurredAt((data.occurred_at as string) ?? "");
        setCategory((data.category as string) ?? "");
        setAmount(data.amount != null ? String(data.amount) : "");
        setNote((data.note as string | null) ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const parsed = FormSchema.safeParse({ occurred_at: occurredAt, category, amount, note });
    if (!parsed.success) {
      setSaving(false);
      setMsg(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("expenses")
      .update({
        occurred_at: occurredAt || null,
        category,
        amount: Number(amount),
        note: note || null,
      })
      .eq("id", id);
    if (error) {
      setSaving(false);
      setMsg(error.message);
      return;
    }
    router.replace("/expenses");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Edit expense</h1>
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


