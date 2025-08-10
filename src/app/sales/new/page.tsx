"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NewSalePage() {
  const router = useRouter();
  const [saleDate, setSaleDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [gross, setGross] = useState("");
  const [fees, setFees] = useState("");
  const [shipIn, setShipIn] = useState("");
  const [shipCost, setShipCost] = useState("");
  const [tax, setTax] = useState("");
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
    const { error } = await supabase.from("sales").insert({
      user_id: user.id,
      sale_date: saleDate || null,
      quantity,
      gross_amount: Number(gross),
      fees: fees ? Number(fees) : null,
      shipping_income: shipIn ? Number(shipIn) : null,
      shipping_cost: shipCost ? Number(shipCost) : null,
      tax: tax ? Number(tax) : null,
    });
    if (error) {
      setSaving(false);
      setMsg(error.message);
      return;
    }
    router.replace("/sales");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Record sale</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="date">Date</label>
            <input id="date" type="datetime-local" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="qty">Qty</label>
            <input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="gross">Gross</label>
            <input id="gross" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="fees">Fees</label>
            <input id="fees" inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="shipin">Ship income</label>
            <input id="shipin" inputMode="decimal" value={shipIn} onChange={(e) => setShipIn(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="shipcost">Ship cost</label>
            <input id="shipcost" inputMode="decimal" value={shipCost} onChange={(e) => setShipCost(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="tax">Tax</label>
            <input id="tax" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="rounded-md px-4 py-2 bg-foreground text-background disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
      </form>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </div>
  );
}


