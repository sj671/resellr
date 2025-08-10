"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { z } from "zod";

const FormSchema = z.object({
  title: z.string().optional(),
  inventory_item_id: z.string().optional(),
  marketplace: z.string().min(1, "Marketplace is required"),
  price: z.string().optional(),
  status: z.string().optional(),
  listed_at: z.string().optional(),
});

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [inventoryId, setInventoryId] = useState("");
  const [marketplace, setMarketplace] = useState("eBay");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [listedAt, setListedAt] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryOptions, setInventoryOptions] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const [l, inv] = await Promise.all([
        supabase.from("listings").select("title,inventory_item_id,marketplace,price,status,listed_at").eq("id", id).maybeSingle(),
        supabase.from("inventory_items").select("id,title").order("created_at", { ascending: false }).limit(200),
      ]);
      if (l.error) setMessage(l.error.message);
      const data = l.data;
      if (data) {
        setTitle((data.title as string) ?? "");
        setInventoryId(((data.inventory_item_id as string | null) ?? ""));
        setMarketplace((data.marketplace as string) ?? "eBay");
        setPrice(data.price != null ? String(data.price) : "");
        setStatus((data.status as string) ?? "active");
        setListedAt(((data.listed_at as string | null) ?? ""));
      }
      setInventoryOptions((inv.data ?? []).map((d) => ({ id: d.id as string, title: (d.title as string) ?? d.id })));
      setLoading(false);
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const parsed = FormSchema.safeParse({ title, inventory_item_id: inventoryId, marketplace, price, status, listed_at: listedAt });
    if (!parsed.success) {
      setSaving(false);
      setMessage(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("listings")
      .update({
        title: title || null,
        inventory_item_id: inventoryId || null,
        marketplace,
        price: price ? Number(price) : null,
        status: status || null,
        listed_at: listedAt || null,
      })
      .eq("id", id);
    if (error) {
      setSaving(false);
      setMessage(error.message);
      return;
    }
    router.replace("/listings");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Edit listing</h1>
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
            <input id="market" required value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
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


