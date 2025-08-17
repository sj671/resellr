"use client";

import { useMemo, useState } from "react";

type ItemSummary = {
  itemId: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
};

export default function SavedResultsClient({
  results,
  aiPerItem,
}: {
  results: ItemSummary[];
  aiPerItem: Record<string, string> | null;
}) {
  const [sort, setSort] = useState<"priceAsc" | "priceDesc" | "title">("priceDesc");
  const [q, setQ] = useState("");
  const [perItemQuery, setPerItemQuery] = useState<Record<string, string>>(aiPerItem || {});
  const [perItemLoading, setPerItemLoading] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const copy = [...results];
    const norm = (v?: string) => (v ? parseFloat(v) : NaN);
    let arr = copy;
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter((r) => (r.title || "").toLowerCase().includes(term));
    }
    arr.sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      const pa = norm(a.price?.value);
      const pb = norm(b.price?.value);
      if (Number.isNaN(pa) && Number.isNaN(pb)) return 0;
      if (Number.isNaN(pa)) return 1;
      if (Number.isNaN(pb)) return -1;
      return sort === "priceAsc" ? pa - pb : pb - pa;
    });
    return arr;
  }, [results, sort, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "priceAsc" | "priceDesc" | "title")}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="priceDesc">Price: high to low</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="title">Title</option>
          </select>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter titles..."
          className="rounded-md border bg-background px-3 py-2 text-sm w-full md:w-64"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map((it) => (
          <div key={it.itemId} className="rounded-xl border p-3 glass-panel">
            <div className="w-full aspect-[3/4] rounded overflow-hidden">
              {it.image?.imageUrl ? (
                <img src={it.image.imageUrl} alt={it.title || it.itemId} className="w-full h-full object-cover" />
              ) : (
                <div className="text-xs text-muted-foreground grid place-items-center h-full">No image</div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium line-clamp-2 flex-1">{it.title ?? it.itemId}</div>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded border text-xs hover:bg-accent"
                  title="AI suggest query for this title"
                  aria-label="AI suggest query"
                  onClick={async () => {
                    const id = it.itemId;
                    if (!id) return;
                    setPerItemLoading((s) => ({ ...s, [id]: true }));
                    try {
                      const titles = [it.title ?? it.itemId];
                      const resp = await fetch("/api/ai/summarize-titles", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ titles }),
                      });
                      const json = await resp.json();
                      if (!resp.ok) throw new Error(json?.error || resp.statusText);
                      const query = json.query || "";
                      setPerItemQuery((s) => ({ ...s, [id]: query }));
                      // Persist to server
                      await fetch("./update-ai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ aiPerItem: { [id]: query } }),
                      });
                    } catch {
                    } finally {
                      setPerItemLoading((s) => ({ ...s, [id]: false }));
                    }
                  }}
                >
                  {perItemLoading[it.itemId] ? (
                    <span className="animate-pulse">AI</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M11 2l1.5 4.5L17 8l-4.5 1.5L11 14l-1.5-4.5L5 8l4.5-1.5L11 2Zm7 7l.9 2.7L22 13l-3.1 1.3L17.6 17l-.5-3.3L14 12.1l3.1-1.3L18 7Zm-12 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>
                    </svg>
                  )}
                </button>
              </div>
              {it.price?.value && (
                <div className="text-sm">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{it.price.value}</span>{" "}
                  <span className="text-muted-foreground">{it.price.currency}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                {(perItemQuery?.[it.itemId] || aiPerItem?.[it.itemId]) && (
                  <a
                    className="inline-flex items-center rounded border px-2 py-1 hover:bg-accent"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent((perItemQuery?.[it.itemId] || aiPerItem?.[it.itemId] || ""))}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
                  >
                    Completed (AI)
                  </a>
                )}
                {it.itemWebUrl && (
                  <a href={it.itemWebUrl} target="_blank" rel="noreferrer" className="underline">View on eBay</a>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">No items match your filter.</div>
        )}
      </div>
    </div>
  );
}


