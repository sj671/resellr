export default function ComingSoonPage() {
  const features = [
    { title: "Inventory", desc: "Track items, SKUs, cost, and photos." },
    { title: "Listings", desc: "Manage active listings across marketplaces." },
    { title: "Sales", desc: "See orders, fees and profitability." },
    { title: "Expenses", desc: "Record expenses and receipts." },
    { title: "Insights", desc: "KPIs and reports for your business." },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Coming Soon</h1>
        <p className="text-sm text-muted-foreground">We’re focused on Research first. These features will roll out next.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border p-4 glass-panel">
            <div className="text-lg font-semibold">{f.title}</div>
            <div className="text-sm text-muted-foreground">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


