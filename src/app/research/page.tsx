"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type ItemSummary = {
  itemId: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
};

export default function ResearchPage() {
  const [q, setQ] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [results, setResults] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiNotes, setAiNotes] = useState<string>("");
  const [perItemQuery, setPerItemQuery] = useState<Record<string, string>>({});
  const [perItemLoading, setPerItemLoading] = useState<Record<string, boolean>>({});
  const [uploadedPreview, setUploadedPreview] = useState<string>("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveAiQuery, setSaveAiQuery] = useState("");
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

  async function runSearch() {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (!q.trim() && imageUrl.trim()) params.set("imageUrl", imageUrl.trim());
      const resp = await fetch(`/api/research/ebay/search?${params.toString()}`);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || resp.statusText);
      const items = Array.isArray(json?.itemSummaries) ? (json.itemSummaries as ItemSummary[]) : [];
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runImageUpload(file: File) {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      // Set a local object URL preview
      setUploadedPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      const fd = new FormData();
      fd.set("file", file);
      const resp = await fetch("/api/research/ebay/search-by-image", { method: "POST", body: fd });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || resp.statusText);
      const items = Array.isArray(json?.itemSummaries) ? (json.itemSummaries as ItemSummary[]) : [];
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Research</h1>
        <Link href="/research/saved" className="rounded border px-3 py-1 text-sm hover:bg-accent">Saved</Link>
      </div>

      {/* Photo upload card */}
      <div className="rounded-xl border p-5 bg-card text-card-foreground shadow-sm glass-panel">
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-semibold">Upload Image</h2>
          <p className="text-sm text-muted-foreground">Take a photo or choose from your library</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-white shadow-sm bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 hover:opacity-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M9 3a1 1 0 0 0-.894.553L7.382 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.382l-.724-1.447A1 1 0 0 0 15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 .002 6.002A3 3 0 0 0 12 10Z"/>
            </svg>
            Take Photo
          </button>

          <button
            type="button"
            onClick={() => libraryInputRef.current?.click()}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-white shadow-sm bg-gradient-to-r from-sky-500 to-fuchsia-600 hover:opacity-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2l1.5 3L17 6.5 14 8l-1.5 3L11 8 8 6.5 10.5 5 12 2Zm-6 9l1 2.5L10 15l-3 .5L6 18l-1-2.5L2 15l3-.5L6 11Zm12 0l1 2.5 3 .5-3 .5-1 2.5-1-2.5-3-.5 3-.5 1-2.5Z"/>
            </svg>
            Choose from Library
          </button>
        </div>

        {/* hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) runImageUpload(f);
          }}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) runImageUpload(f);
          }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          placeholder="Search by keywords (e.g., 'Nintendo Switch')"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border px-3 py-2"
        />
        <input
          placeholder="...or paste an image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button onClick={runSearch} disabled={loading} className="rounded-md border px-3 py-2">
          {loading ? "Searching…" : "Search eBay"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {(uploadedPreview || results.length > 0) && uploadedPreview && (
        <div className="rounded-md border p-3 glass-panel">
          <div className="text-sm mb-2">Reference image</div>
          <div className="w-full aspect-[3/4] rounded overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploadedPreview} alt="Uploaded reference" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <SummaryBar items={results} />
      )}

      {results.length > 0 && (
        <div className="flex items-center justify-end">
          <button
            className="rounded border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => { setSaveAiQuery(aiQuery || ""); setSaveOpen(true); }}
          >
            Save search
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-md border p-3 space-y-2 glass-panel">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">Generate Query for eBay Completed Search</div>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded border hover:bg-accent"
              aria-label="Generate AI query"
              title="Generate AI query"
              onClick={async () => {
                try {
                  const titles = results.map((r) => r.title).filter(Boolean) as string[];
                  const resp = await fetch("/api/ai/summarize-titles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ titles }),
                  });
                  const json = await resp.json();
                  if (!resp.ok) throw new Error(json?.error || resp.statusText);
                  setAiQuery(json.query || "");
                  setAiNotes(json.notes || "");
                } catch (err) {
                  setAiNotes(err instanceof Error ? err.message : String(err));
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M11 2l1.5 4.5L17 8l-4.5 1.5L11 14l-1.5-4.5L5 8l4.5-1.5L11 2Zm7 7l.9 2.7L22 13l-3.1 1.3L17.6 17l-.5-3.3L14 12.1l3.1-1.3L18 7Zm-12 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>
              </svg>
            </button>
          </div>
          {aiQuery && (
            <div className="text-sm space-y-2">
              <div className="font-mono p-2 bg-muted rounded break-words">{aiQuery}</div>
                <div className="flex items-center gap-3">
                <a
                  className="inline-flex items-center rounded border px-3 py-1 text-sm hover:bg-accent"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(aiQuery)}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
                >
                  View completed on eBay
                </a>
                <button
                  className="inline-flex items-center rounded border px-3 py-1 text-sm hover:bg-accent"
                  onClick={() => { setSaveAiQuery(aiQuery || ""); setSaveOpen(true); }}
                >
                  Save search
                </button>
              </div>
              <div className="text-xs text-muted-foreground">{aiNotes}</div>
            </div>
          )}
        </div>
      )}

      {saveOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border p-5 glass-panel">
            <div className="text-lg font-semibold mb-2">Save search</div>
            <div className="text-sm text-muted-foreground mb-4">Give this search a title so you can find it later.</div>
            <input
              autoFocus
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="e.g., He-Man lot Aug 2025"
              className="w-full rounded-md border bg-background px-3 py-2"
            />
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Search query</div>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded border text-xs hover:bg-accent"
                  title="Use AI query as title"
                  aria-label="Use AI query as title"
                  onClick={() => setSaveTitle(saveAiQuery || aiQuery || "")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M16 3H8a2 2 0 0 0-2 2v2h2V5h8v2h2V5a2 2 0 0 0-2-2Zm3 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2ZM7 13h10v2H7v-2Z"/>
                  </svg>
                </button>
              </div>
              <input
                value={saveAiQuery}
                onChange={(e) => setSaveAiQuery(e.target.value)}
                placeholder="AI-generated eBay search query"
                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
            {saveTitle.trim() === "" && (
              <div className="mt-2 text-xs text-red-500">Title is required</div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="rounded border px-3 py-1" onClick={() => setSaveOpen(false)}>Cancel</button>
              <button
                className="rounded border px-3 py-1 hover:bg-accent"
                onClick={async () => {
                  if (!saveTitle.trim()) return;
                  try {
                    const refB64 = uploadedPreview
                      ? await fetch(uploadedPreview).then((r) => r.blob()).then((b) => new Promise<string>((res) => {
                          const fr = new FileReader();
                          fr.onload = () => res(fr.result as string);
                          fr.readAsDataURL(b);
                        }))
                      : undefined;
                    const resp = await fetch("/api/research/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: saveTitle || undefined,
                        query: q || imageUrl || undefined,
                        aiQuery: saveAiQuery || aiQuery,
                        results,
                        aiPerItem: perItemQuery,
                        referenceImageBase64: refB64,
                      }),
                    });
                    if (!resp.ok) {
                      const data = await resp.json().catch(() => ({}));
                      if (resp.status === 409 || data?.error === "duplicate_title") {
                        alert("You already have a saved search with this title. Please choose another.");
                        return;
                      }
                      alert(data?.error || "Failed to save");
                      return;
                    }
                    setSaveOpen(false);
                    setSaveTitle("");
                    setSaveAiQuery("");
                  } catch {}
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-2xl border p-5 glass-panel space-y-4">
          <h2 className="text-lg font-semibold">eBay Current Listings</h2>

          <div className="grid gap-4 md:grid-cols-3">
        {results.map((it) => (
          <div key={it.itemId} className="border rounded-md p-3 hover:bg-muted/50 glass-panel">
            <div className="w-full aspect-[3/4] rounded overflow-hidden">
              {it.image?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.image.imageUrl}
                  alt={it.title || it.itemId}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem] flex-1">{it.title ?? it.itemId}</div>
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
                      setPerItemQuery((s) => ({ ...s, [id]: json.query || "" }));
                    } catch {
                      // Surface minimal error via notes area could be added; for now, no-op
                    } finally {
                      setPerItemLoading((s) => ({ ...s, [id]: false }));
                    }
                  }}
                >
                  {perItemLoading[it.itemId] ? (
                    <span className="animate-pulse">AI</span>
                  ) : (
                    // simple spark icon
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
              {it.itemWebUrl && (
                <a
                  href={it.itemWebUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs underline text-blue-600 hover:text-blue-700"
                >
                  View on eBay
                </a>
              )}
              {perItemQuery[it.itemId] && (
                <div className="text-xs">
                  <a
                    className="inline-flex items-center rounded border px-2 py-1 hover:bg-accent"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(perItemQuery[it.itemId])}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
                  >
                    Completed (AI)
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {results.length === 0 && !loading && !error && (
          <div className="text-sm text-muted-foreground">Enter a query or image URL to search active items.</div>
        )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBar({ items }: { items: ItemSummary[] }) {
  const prices = items
    .map((it) => Number(it.price?.value))
    .filter((v) => Number.isFinite(v)) as number[];
  const currency = items.find((it) => it.price?.currency)?.price?.currency;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const low = avg !== null ? avg * 0.5 : null;
  const high = avg !== null ? avg * 0.7 : null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border p-4 glass-panel">
        <div className="text-sm text-muted-foreground">Average Current Price</div>
        <div className="text-2xl font-semibold text-emerald-500 mt-1">
          {avg !== null ? `${avg.toFixed(2)} ${currency ?? ''}` : 'n/a'}
        </div>
      </div>
      <div className="rounded-xl border p-4 glass-panel">
        <div className="text-sm text-muted-foreground">Suggested Offer Range</div>
        <div className="text-2xl font-semibold mt-1">
          {low !== null && high !== null ? (
            <span>
              <span className="text-emerald-400">{low.toFixed(2)}</span>
              <span className="mx-1"> - </span>
              <span className="text-emerald-400">{high.toFixed(2)}</span>
              <span className="ml-1 text-muted-foreground">{currency ?? ''}</span>
            </span>
          ) : (
            'n/a'
          )}
        </div>
      </div>
      <div className="rounded-xl border p-4 glass-panel">
        <div className="text-sm text-muted-foreground">Items Found</div>
        <div className="text-2xl font-semibold mt-1">{items.length}</div>
      </div>
    </div>
  );
}


