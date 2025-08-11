import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import DataTable, { type Column } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import ExpenseActions from "./_components/ExpenseActions";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const start = typeof sp.start === "string" ? sp.start : "";
  const end = typeof sp.end === "string" ? sp.end : "";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1));
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/expenses");
  let builder = supabase
    .from("expenses")
    .select("id,occurred_at,category,amount,note,created_at", { count: "exact" })
    .order("occurred_at", { ascending: false });
  if (q) builder = builder.ilike("category", `%${q}%`);
  if (start) builder = builder.gte("occurred_at", start);
  if (end) builder = builder.lte("occurred_at", end);
  const { data, count, error } = await builder.range(from, to);
  const expenses = (data ?? []) as Array<{
    id: string;
    occurred_at: string;
    category: string;
    amount: number;
    note: string | null;
  }>;

  const columns: Column<(typeof expenses)[number]>[] = [
    { key: "occurred_at", header: "Date", render: (r) => formatDate(r.occurred_at) },
    { key: "category", header: "Category" },
    { key: "amount", header: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
    { key: "note", header: "Note" },
    { header: "Actions", align: "right", render: (r) => <ExpenseActions id={r.id} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Link href="/expenses/new" className="px-3 py-2 rounded border">Add expense</Link>
      </div>
      {error && <div className="text-sm text-red-600">{error.message}</div>}
      <form className="grid gap-3 md:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Search category..." className="rounded-md border px-3 py-2" />
        <input name="start" type="date" defaultValue={start} className="rounded-md border px-3 py-2" />
        <input name="end" type="date" defaultValue={end} className="rounded-md border px-3 py-2" />
        <button className="rounded-md border px-3 py-2" type="submit">Apply</button>
      </form>
      <DataTable columns={columns} rows={expenses} emptyMessage="No expenses yet." />
      <div className="flex items-center justify-end gap-2 text-sm">
        <span>Page {page} / {Math.max(1, Math.ceil((count ?? 0) / pageSize))}</span>
        <Link href={`/expenses?${new URLSearchParams({ q, start, end, page: String(Math.max(1, page - 1)) })}`} className="px-2 py-1 border rounded">Prev</Link>
        <Link href={`/expenses?${new URLSearchParams({ q, start, end, page: String(page + 1) })}`} className="px-2 py-1 border rounded">Next</Link>
      </div>
    </div>
  );
}


