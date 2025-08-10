"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function EditInventoryItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [acquiredAt, setAcquiredAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("inventory_items")
        .select("title,sku,quantity,purchase_price,acquired_at")
        .eq("id", id)
        .maybeSingle();
      if (error) setMsg(error.message);
      if (data) {
        setTitle(data.title);
        setSku(data.sku ?? "");
        setQuantity(data.quantity);
        setPurchasePrice(data.purchase_price?.toString() ?? "");
        setAcquiredAt((data.acquired_at as string | null) ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("inventory_items")
      .update({
        title,
        sku: sku || null,
        quantity,
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        acquired_at: acquiredAt || null,
      })
      .eq("id", id);
    if (error) {
      setSaving(false);
      setMsg(error.message);
      return;
    }
    router.replace("/inventory");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Edit inventory item</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm" htmlFor="title">Title</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="sku">SKU</label>
            <input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="qty">Quantity</label>
            <input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="price">Purchase price</label>
            <input id="price" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="acq">Acquired at</label>
            <input id="acq" type="date" value={acquiredAt} onChange={(e) => setAcquiredAt(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="rounded-md px-4 py-2 bg-foreground text-background disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
      </form>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </div>
  );
}


