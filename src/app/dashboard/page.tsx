import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import StatCard from "./_components/StatCard";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? profile?.email ?? user.email ?? "User";
  void displayName; // avoid unused var warning for now

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [invCount, listCount, salesAgg, expAgg, recentSales] = await Promise.all([
    supabase.from("inventory_items").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase
      .from("sales")
      .select("gross_amount,fees,shipping_income,shipping_cost,tax")
      .gte("sale_date", since.toISOString()),
    supabase
      .from("expenses")
      .select("amount")
      .gte("occurred_at", since.toISOString().slice(0, 10)),
    supabase
      .from("sales")
      .select("id,sale_date,gross_amount,fees,shipping_cost,shipping_income,tax")
      .order("sale_date", { ascending: false })
      .limit(5),
  ]);

  const invTotal = invCount.count ?? 0;
  const listTotal = listCount.count ?? 0;
  const salesRows = salesAgg.data ?? [];
  const expRows = expAgg.data ?? [];
  const revenue = salesRows.reduce((sum, r) => sum + (r.gross_amount ?? 0), 0);
  const fees = salesRows.reduce((sum, r) => sum + (r.fees ?? 0), 0);
  const shipIncome = salesRows.reduce((sum, r) => sum + (r.shipping_income ?? 0), 0);
  const shipCost = salesRows.reduce((sum, r) => sum + (r.shipping_cost ?? 0), 0);
  const tax = salesRows.reduce((sum, r) => sum + (r.tax ?? 0), 0);
  const expenses = expRows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const net = revenue + shipIncome - fees - shipCost - tax - expenses;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Inventory items" value={invTotal} sublabel="Total tracked" />
        <StatCard label="Active listings" value={listTotal} sublabel="All marketplaces" />
        <StatCard label="30d revenue" value={formatCurrency(revenue)} sublabel="Gross sales" />
        <StatCard label="30d net" value={formatCurrency(net)} sublabel="After fees, ship, tax, expenses" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent sales</h2>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Gross</th>
                <th className="text-right px-3 py-2">Fees</th>
                <th className="text-right px-3 py-2">Ship In</th>
                <th className="text-right px-3 py-2">Ship Cost</th>
                <th className="text-right px-3 py-2">Tax</th>
              </tr>
            </thead>
            <tbody>
              {(recentSales.data ?? []).map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{new Date(s.sale_date as string).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(s.gross_amount as number)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency((s.fees as number) ?? 0)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency((s.shipping_income as number) ?? 0)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency((s.shipping_cost as number) ?? 0)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency((s.tax as number) ?? 0)}</td>
                </tr>
              ))}
              {(!recentSales.data || recentSales.data.length === 0) && (
                <tr>
                  <td className="px-3 py-8 text-center text-muted-foreground" colSpan={6}>No recent sales.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


