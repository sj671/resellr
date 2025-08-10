"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [acquiredAt, setAcquiredAt] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      setStatus("error");
      setMessage(userErr?.message ?? "Not signed in");
      return;
    }
    const { error } = await supabase.from("inventory_items").insert({
      user_id: user.id,
      title,
      sku: sku || null,
      quantity,
      purchase_price: purchasePrice ? Number(purchasePrice) : null,
      acquired_at: acquiredAt || null,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    router.replace("/inventory");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Add inventory item</h1>
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
        <button type="submit" disabled={status === "saving"} className="rounded-md px-4 py-2 bg-foreground text-background disabled:opacity-60">
          {status === "saving" ? "Saving..." : "Save"}
        </button>
      </form>
      {status === "error" && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </div>
  );
}


