"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { z } from "zod";

const FormSchema = z.object({
  sale_date: z.string().optional(),
  quantity: z.coerce.number().min(1),
  gross_amount: z.coerce.number().min(0),
  fees: z.coerce.number().optional(),
  shipping_income: z.coerce.number().optional(),
  shipping_cost: z.coerce.number().optional(),
  tax: z.coerce.number().optional(),
});

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [saleDate, setSaleDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [gross, setGross] = useState("");
  const [fees, setFees] = useState("");
  const [shipIn, setShipIn] = useState("");
  const [shipCost, setShipCost] = useState("");
  const [tax, setTax] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("sales")
        .select("sale_date,quantity,gross_amount,fees,shipping_income,shipping_cost,tax")
        .eq("id", id)
        .maybeSingle();
      if (error) setMsg(error.message);
      if (data) {
        setSaleDate((data.sale_date as string) ?? "");
        setQuantity((data.quantity as number) ?? 1);
        setGross(String(data.gross_amount));
        setFees(data.fees != null ? String(data.fees) : "");
        setShipIn(data.shipping_income != null ? String(data.shipping_income) : "");
        setShipCost(data.shipping_cost != null ? String(data.shipping_cost) : "");
        setTax(data.tax != null ? String(data.tax) : "");
      }
      setLoading(false);
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const parsed = FormSchema.safeParse({
      sale_date: saleDate,
      quantity,
      gross_amount: gross,
      fees,
      shipping_income: shipIn,
      shipping_cost: shipCost,
      tax,
    });
    if (!parsed.success) {
      setSaving(false);
      setMsg(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("sales")
      .update({
        sale_date: saleDate || null,
        quantity,
        gross_amount: Number(gross),
        fees: fees ? Number(fees) : null,
        shipping_income: shipIn ? Number(shipIn) : null,
        shipping_cost: shipCost ? Number(shipCost) : null,
        tax: tax ? Number(tax) : null,
      })
      .eq("id", id);
    if (error) {
      setSaving(false);
      setMsg(error.message);
      return;
    }
    router.replace("/sales");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Edit sale</h1>
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


