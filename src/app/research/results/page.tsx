"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ItemSummary = {
  itemId: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
};

export default function SearchResultsPage() {
  const [results, setResults] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiNotes, setAiNotes] = useState<string>("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveAiQuery, setSaveAiQuery] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchImageUrl, setSearchImageUrl] = useState<string>("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    // Read data from sessionStorage
    const resultsData = sessionStorage.getItem('searchResults');
    const query = sessionStorage.getItem('searchQuery');
    const imageUrl = sessionStorage.getItem('searchImageUrl');
    const preview = sessionStorage.getItem('searchPreview');

    if (preview) {
      setUploadedPreview(preview);
    }

    // Store search query info in state before clearing sessionStorage
    if (query) {
      setSearchQuery(query);
    }
    if (imageUrl) {
      setSearchImageUrl(imageUrl);
    }

    if (resultsData) {
      try {
        const parsedResults = JSON.parse(resultsData);
        setResults(parsedResults);
        

        
        // Clear sessionStorage after reading
        sessionStorage.removeItem('searchResults');
        sessionStorage.removeItem('searchQuery');
        sessionStorage.removeItem('searchImageUrl');
        sessionStorage.removeItem('searchPreview');
      } catch (err) {
        setError("Failed to load search results");
      }
    } else if (query || imageUrl) {
      // If no results in sessionStorage, perform the search
      performSearch(query, imageUrl);
    }

    setLoading(false);
  }, []);

  // Add scroll event listener for scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 400); // Show button after scrolling 400px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function performSearch(query?: string | null, imageUrl?: string | null) {
    if (!query && !imageUrl) return;
    
    // Store search query info in state
    if (query) {
      setSearchQuery(query);
    }
    if (imageUrl) {
      setSearchImageUrl(imageUrl);
    }
    
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (imageUrl) params.set("imageUrl", imageUrl);
      
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

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function generateAIQuery() {
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
  }

  async function saveSearch() {
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
          title: saveTitle,
          query: searchQuery || searchImageUrl,
          aiQuery: saveAiQuery || aiQuery,
          results,
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
      alert("Search saved successfully!");
    } catch (err) {
      alert("Failed to save search");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Search Results</h1>
          <Link href="/research" className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            ← Back to Research
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800 dark:text-red-200 font-medium">Error</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Search Results</h1>
          <p className="text-muted-foreground mt-1">
            {results.length} items found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSaveOpen(true)}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Save Search
          </button>
          <Link href="/research" className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
            New Search
          </Link>
        </div>
      </div>

      {/* Results Info */}
      <div className="rounded-lg border p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {results.length} items
          </div>
          <Link 
            href="/research" 
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            ← Back to Search
          </Link>
        </div>
      </div>

      {/* Search Query Display */}
      {(searchQuery || searchImageUrl) && (
        <div className="rounded-lg border p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {searchQuery || 'Image Search'}
              </h3>
            </div>
            <Link 
              href="/research" 
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Modify Search
            </Link>
          </div>
        </div>
      )}

      {/* Reference Image */}
      {uploadedPreview && (
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="text-lg font-semibold mb-3">Reference Image</h3>
          <div className="w-48 aspect-square rounded-lg overflow-hidden">
            <img src={uploadedPreview} alt="Reference" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Results Summary */}
      <SummaryBar items={results} />

      {/* AI Query Generation */}
      <div className="rounded-lg border p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">AI Query for Completed Items</h3>
            <p className="text-sm text-muted-foreground">Generate a search query for completed eBay listings</p>
          </div>
          <button
            onClick={generateAIQuery}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Query
          </button>
        </div>

        {aiQuery && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Generated Query:</div>
              <div className="font-mono text-sm break-words">{aiQuery}</div>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(aiQuery)}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Completed on eBay
              </a>
              <button
                onClick={() => { setSaveAiQuery(aiQuery); setSaveOpen(true); }}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save with AI Query
              </button>
            </div>

            {aiNotes && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                {aiNotes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-2xl font-semibold mb-6">Current eBay Listings</h2>
        <div className="space-y-4">
          {results.map((it) => (
            <div key={it.itemId} className="rounded-xl border p-4 bg-background hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Image on the left */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    {it.image?.imageUrl ? (
                      <img
                        src={it.image.imageUrl}
                        alt={it.title || it.itemId}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="grid place-items-center h-full text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                </div>

                {/* Details on the right */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold line-clamp-2">{it.title ?? it.itemId}</h3>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {it.price?.value && (
                        <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                          {it.price.value} <span className="text-sm text-muted-foreground">{it.price.currency}</span>
                        </div>
                      )}
                    </div>
                    
                    {it.itemWebUrl && (
                      <a
                        href={it.itemWebUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 7h-3V6c0-1.7-1.3-3-3-3h-2C9.3 3 8 4.3 8 6v1H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 6c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v1h-4V6z"/>
                        </svg>
                        View on eBay
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Search Modal */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border p-6 bg-background">
            <div className="text-lg font-semibold mb-2">Save Search</div>
            <div className="text-sm text-muted-foreground mb-4">Give this search a title so you can find it later.</div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="e.g., He-Man lot Aug 2025"
                    className="flex-1 rounded-lg border px-3 py-2 mt-1"
                  />
                  {aiQuery && (
                    <button
                      type="button"
                      onClick={() => setSaveTitle(aiQuery)}
                      className="mt-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                      title="Use AI query as title"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">AI Query (optional)</label>
                <input
                  value={saveAiQuery}
                  onChange={(e) => setSaveAiQuery(e.target.value)}
                  placeholder="AI-generated eBay search query"
                  className="w-full rounded-lg border px-3 py-2 mt-1 font-mono text-sm"
                />
              </div>
            </div>

            {saveTitle.trim() === "" && (
              <div className="mt-2 text-xs text-red-500">Title is required</div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors" 
                onClick={() => setSaveOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm transition-colors disabled:opacity-50"
                onClick={saveSearch}
                disabled={!saveTitle.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
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
      <div className="rounded-xl border p-6 bg-card">
        <div className="text-sm text-muted-foreground mb-2">Average Price</div>
        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {avg !== null ? `${avg.toFixed(2)} ${currency ?? ''}` : 'n/a'}
        </div>
      </div>
      <div className="rounded-xl border p-6 bg-card">
        <div className="text-sm text-muted-foreground mb-2">Suggested Offer Range</div>
        <div className="text-3xl font-bold">
          {low !== null && high !== null ? (
            <span>
              <span className="text-emerald-500">{low.toFixed(2)}</span>
              <span className="mx-2 text-muted-foreground">-</span>
              <span className="text-emerald-500">{high.toFixed(2)}</span>
              <span className="ml-2 text-sm text-muted-foreground">{currency ?? ''}</span>
            </span>
          ) : (
            'n/a'
          )}
        </div>
      </div>
      <div className="rounded-xl border p-6 bg-card">
        <div className="text-sm text-muted-foreground mb-2">Items Found</div>
        <div className="text-3xl font-bold">{items.length}</div>
      </div>
    </div>
  );
}
