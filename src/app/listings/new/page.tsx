"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [marketplace, setMarketplace] = useState("eBay");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [listedAt, setListedAt] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("inventory_items")
        .select("id,title")
        .order("created_at", { ascending: false })
        .limit(200);
      setInventoryOptions((data ?? []).map((d) => ({ id: d.id as string, title: (d.title as string) ?? d.id })));
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setMessage("Not signed in");
      return;
    }
    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      inventory_item_id: inventoryId || null,
      title: title || null,
      marketplace,
      price: price ? Number(price) : null,
      status: status || null,
      listed_at: listedAt || null,
    });
    if (error) {
      setSaving(false);
      setMessage(error.message);
      return;
    }
    router.replace("/listings");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Add listing</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm" htmlFor="inv">Inventory item</label>
          <select id="inv" value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2">
            <option value="">(none)</option>
            {inventoryOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="market">Marketplace</label>
            <input id="market" value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="price">Price</label>
            <input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="status">Status</label>
            <input id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="listed">Listed at</label>
            <input id="listed" type="datetime-local" value={listedAt} onChange={(e) => setListedAt(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="rounded-md px-4 py-2 bg-foreground text-background disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </div>
  );
}


