"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ItemSummary = {
  itemId: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
};

export default function ResearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>("");
  const [searchMethod, setSearchMethod] = useState<"text" | "image">("text");
  const [resultLimit, setResultLimit] = useState(50);
  const [authChecking, setAuthChecking] = useState(true);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        
        if (!data.user) {
          // User not authenticated, redirect to login
          router.push('/login?next=/research');
          return;
        }
        
        setAuthChecking(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?next=/research');
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  async function runSearch() {
    if (!q.trim() && !imageUrl.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (imageUrl.trim()) params.set("imageUrl", imageUrl.trim());
      params.set("limit", String(resultLimit));
      params.set("offset", "0"); // Always start from first page
      
      const resp = await fetch(`/api/research/ebay/search?${params.toString()}`);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || resp.statusText);
      
      const items = Array.isArray(json?.itemSummaries) ? (json.itemSummaries as ItemSummary[]) : [];
      
      // Store results in sessionStorage and redirect to results page
      sessionStorage.setItem('searchResults', JSON.stringify(items));
      sessionStorage.setItem('searchQuery', q.trim() || '');
      sessionStorage.setItem('searchImageUrl', imageUrl.trim() || '');
      
      window.location.href = '/research/results';
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  async function runImageUpload(file: File) {
    setLoading(true);
    setError(null);
    setSearchMethod("image");
    
    try {
      // Set a local object URL preview
      const previewUrl = URL.createObjectURL(file);
      setUploadedPreview(previewUrl);
      
      const fd = new FormData();
      fd.set("file", file);
      fd.set("limit", String(resultLimit));
      fd.set("offset", "0"); // Always start from first page
      const resp = await fetch("/api/research/ebay/search-by-image", { method: "POST", body: fd });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || resp.statusText);
      
      const items = Array.isArray(json?.itemSummaries) ? (json.itemSummaries as ItemSummary[]) : [];
      
      // Store results and preview in sessionStorage and redirect to results page
      sessionStorage.setItem('searchResults', JSON.stringify(items));
      sessionStorage.setItem('searchPreview', previewUrl);
      sessionStorage.setItem('searchImageUrl', '');
      
      window.location.href = '/research/results';
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      runSearch();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research Products</h1>
          <p className="text-muted-foreground mt-1">Search eBay by text or image to find pricing and market data</p>
        </div>
        <Link href="/research/saved" className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">
          View Saved Searches
        </Link>
      </div>

      {/* Results Limit Selector */}
      <div className="rounded-lg border p-4 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Number of Results</h3>
            <p className="text-xs text-muted-foreground">Choose how many items to search for</p>
          </div>
          <select
            value={resultLimit}
            onChange={(e) => setResultLimit(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm bg-background"
          >
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
            <option value={200}>200 items</option>
          </select>
        </div>
        
      </div>

      {/* Search Methods */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Text Search */}
        <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Search by Text</h2>
                <p className="text-sm text-muted-foreground">Enter keywords to find products</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                placeholder="e.g., 'Nintendo Switch', 'iPhone 13', 'vintage camera'"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full rounded-lg border px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={runSearch} 
                disabled={loading || !q.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Search eBay"}
              </button>
            </div>
          </div>
        </div>

        {/* Image Search */}
        <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Search by Image</h2>
                <p className="text-sm text-muted-foreground">Upload a photo or paste an image URL</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => libraryInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Library
                </button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">or</div>
              
              <input
                placeholder="Paste image URL here"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full rounded-lg border px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              
              <button 
                onClick={runSearch} 
                disabled={loading || !imageUrl.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "Search by Image"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
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

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800 dark:text-red-200 font-medium">Error</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Ready to research?</h3>
          <p className="text-gray-500 dark:text-gray-400">Enter a search term above or upload an image to get started</p>
        </div>
      )}
    </div>
  );
}




