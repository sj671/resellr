import Link from "next/link";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import DataTable, { type Column } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import SaleActions from "./_components/SaleActions";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;
  const start = typeof sp.start === "string" ? sp.start : "";
  const end = typeof sp.end === "string" ? sp.end : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1));
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseRSCClient();
  let builder = supabase
    .from("sales")
    .select("id,sale_date,quantity,gross_amount,fees,shipping_income,shipping_cost,tax,created_at", { count: "exact" })
    .order("sale_date", { ascending: false });
  if (start) builder = builder.gte("sale_date", start);
  if (end) builder = builder.lte("sale_date", end);
  const { data, count, error } = await builder.range(from, to);
  const sales = (data ?? []) as Array<{
    id: string;
    sale_date: string;
    quantity: number;
    gross_amount: number;
    fees: number | null;
    shipping_income: number | null;
    shipping_cost: number | null;
    tax: number | null;
  }>;

  const columns: Column<(typeof sales)[number]>[] = [
    { key: "sale_date", header: "Date", render: (r) => formatDate(r.sale_date) },
    { key: "quantity", header: "Qty", align: "right" },
    { key: "gross_amount", header: "Gross", align: "right", render: (r) => formatCurrency(r.gross_amount) },
    { key: "fees", header: "Fees", align: "right", render: (r) => formatCurrency(r.fees ?? 0) },
    { key: "shipping_income", header: "Ship In", align: "right", render: (r) => formatCurrency(r.shipping_income ?? 0) },
    { key: "shipping_cost", header: "Ship Cost", align: "right", render: (r) => formatCurrency(r.shipping_cost ?? 0) },
    { key: "tax", header: "Tax", align: "right", render: (r) => formatCurrency(r.tax ?? 0) },
    { header: "Actions", align: "right", render: (r) => <SaleActions id={r.id} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <Link href="/sales/new" className="px-3 py-2 rounded border">Record sale</Link>
      </div>
      {error && <div className="text-sm text-red-600">{error.message}</div>}
      <form className="grid gap-3 md:grid-cols-3">
        <input name="start" type="date" defaultValue={start} className="rounded-md border px-3 py-2" />
        <input name="end" type="date" defaultValue={end} className="rounded-md border px-3 py-2" />
        <button className="rounded-md border px-3 py-2" type="submit">Apply</button>
      </form>
      <DataTable columns={columns} rows={sales} emptyMessage="No sales yet. Record your first sale to see it here." />
      <div className="flex items-center justify-end gap-2 text-sm">
        <span>Page {page} / {Math.max(1, Math.ceil((count ?? 0) / pageSize))}</span>
        <Link href={`/sales?${new URLSearchParams({ start, end, page: String(Math.max(1, page - 1)) })}`} className="px-2 py-1 border rounded">Prev</Link>
        <Link href={`/sales?${new URLSearchParams({ start, end, page: String(page + 1) })}`} className="px-2 py-1 border rounded">Next</Link>
      </div>
    </div>
  );
}


