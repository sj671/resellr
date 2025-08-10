import Link from "next/link";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import DataTable, { type Column } from "@/components/ui/data-table";
import ListingActions from "./_components/ListingActions";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const marketplace = (typeof sp.marketplace === "string" ? sp.marketplace : "").trim();
  const status = (typeof sp.status === "string" ? sp.status : "").trim();
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1));
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseRSCClient();
  let builder = supabase
    .from("listings")
    .select("id,title,marketplace,price,status,listed_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (q) builder = builder.ilike("title", `%${q}%`);
  if (marketplace) builder = builder.eq("marketplace", marketplace);
  if (status) builder = builder.eq("status", status);
  const { data, count, error } = await builder.range(from, to);
  const listings = (data ?? []) as Array<{
    id: string;
    title: string | null;
    marketplace: string;
    price: number | null;
    status: string | null;
    listed_at: string | null;
  }>;

  const columns: Column<(typeof listings)[number]>[] = [
    { key: "title", header: "Title" },
    { key: "marketplace", header: "Marketplace" },
    { key: "price", header: "Price", align: "right", render: (r) => formatCurrency(r.price) },
    { key: "status", header: "Status" },
    { key: "listed_at", header: "Listed", render: (r) => formatDate(r.listed_at) },
    { header: "Actions", align: "right", render: (r) => <ListingActions id={r.id} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <Link href="/listings/new" className="px-3 py-2 rounded border">Add listing</Link>
      </div>
      {error && <div className="text-sm text-red-600">{error.message}</div>}
      <form className="grid gap-3 md:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Search title..." className="rounded-md border px-3 py-2" />
        <input name="marketplace" defaultValue={marketplace} placeholder="Marketplace (e.g., eBay)" className="rounded-md border px-3 py-2" />
        <input name="status" defaultValue={status} placeholder="Status (e.g., active)" className="rounded-md border px-3 py-2" />
        <button className="rounded-md border px-3 py-2" type="submit">Apply</button>
      </form>
      <DataTable columns={columns} rows={listings} emptyMessage="No listings yet. Create your first listing to see it here." />
      <div className="flex items-center justify-end gap-2 text-sm">
        <span>Page {page} / {Math.max(1, Math.ceil((count ?? 0) / pageSize))}</span>
        <Link href={`/listings?${new URLSearchParams({ q, page: String(Math.max(1, page - 1)) })}`} className="px-2 py-1 border rounded">Prev</Link>
        <Link href={`/listings?${new URLSearchParams({ q, page: String(page + 1) })}`} className="px-2 py-1 border rounded">Next</Link>
      </div>
    </div>
  );
}


