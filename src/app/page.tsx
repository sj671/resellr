export const revalidate = 60;

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Resellr</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A modern reseller PWA scaffold with Tailwind, shadcn/ui, and Supabase. Phase 0 delivers a polished shell and data wiring.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="#" className="px-4 py-2 rounded bg-foreground text-background">
            Get started
          </a>
          <a href="#" className="px-4 py-2 rounded border">
            Learn more
          </a>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Inventory", desc: "Track items and stock with ease." },
          { title: "Sales", desc: "Monitor orders and revenue trends." },
          { title: "Expenses", desc: "Analyze costs and margins." },
        ].map((c) => (
          <div key={c.title} className="border rounded-lg p-6 bg-card text-card-foreground">
            <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
