import Link from "next/link";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import InventoryActions from "./_components/InventoryActions";
import DataTable, { type Column } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return (
      <div>
        <p className="mb-4">Please sign in to view your inventory.</p>
        <Link href="/login" className="underline">Log in</Link>
      </div>
    );

  const sp = await searchParams;
  const query = (typeof sp.q === "string" ? sp.q : "").trim();
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1));
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let builder = supabase
    .from("inventory_items")
    .select("id,title,sku,quantity,purchase_price,acquired_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (query) builder = builder.ilike("title", `%${query}%`);
  const { data: items, error, count } = await builder.range(from, to);

  type Row = {
    id: string;
    title: string;
    sku: string | null;
    quantity: number;
    purchase_price: number | null;
    acquired_at: string | null;
  };

  const columns: Column<Row>[] = [
    { key: "title", header: "Title" },
    { key: "sku", header: "SKU" },
    { key: "quantity", header: "Qty", align: "right" },
    {
      key: "purchase_price",
      header: "Purchase",
      align: "right",
      render: (r) => formatCurrency(r.purchase_price),
    },
    {
      key: "acquired_at",
      header: "Acquired",
      render: (r) => formatDate(r.acquired_at),
    },
    {
      header: "Actions",
      align: "right",
      render: (r) => <InventoryActions id={r.id} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <Link href="/inventory/new" className="px-3 py-2 rounded border">Add item</Link>
      </div>
      {error && (
        <div className="text-sm text-red-600">{error.message}</div>
      )}
      <form className="grid gap-3 md:grid-cols-2">
        <input name="q" defaultValue={query} placeholder="Search title..." className="rounded-md border px-3 py-2" />
        <button className="rounded-md border px-3 py-2" type="submit">Apply</button>
      </form>
      <DataTable<Row> columns={columns} rows={(items ?? []) as Row[]} emptyMessage="No items yet. Add your first inventory item to see it here." />
      <div className="flex items-center justify-end gap-2 text-sm">
        <span>
          Page {page} / {Math.max(1, Math.ceil((count ?? 0) / pageSize))}
        </span>
        <Link href={`/inventory?${new URLSearchParams({ q: query, page: String(Math.max(1, page - 1)) })}`} className="px-2 py-1 border rounded disabled:opacity-50" aria-disabled={page === 1}>
          Prev
        </Link>
        <Link href={`/inventory?${new URLSearchParams({ q: query, page: String(page + 1) })}`} className="px-2 py-1 border rounded" aria-disabled={(count ?? 0) <= to + 1}>
          Next
        </Link>
      </div>
    </div>
  );
}


