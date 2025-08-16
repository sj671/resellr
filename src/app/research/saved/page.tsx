import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import DeleteButtonClient from "./DeleteButtonClient";

// Helper function to check if results exist
function hasResults(resultsJson: unknown): boolean {
  if (!resultsJson) return false;
  if (Array.isArray(resultsJson)) return resultsJson.length > 0;
  if (typeof resultsJson === 'object' && resultsJson !== null) {
    const results = (resultsJson as { results?: unknown }).results;
    return Array.isArray(results) && results.length > 0;
  }
  return false;
}

type SavedSearch = {
  id: string;
  title: string | null;
  query: string | null;
  ai_query: string | null;
  reference_image_url: string | null;
  reference_image_path?: string | null;
  created_at: string;
  results_json?: unknown;
};

export default async function SavedSearchesPage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/research/saved");

  const { data, error } = await supabase
    .from("saved_searches")
    .select("id,title,query,ai_query,reference_image_url,reference_image_path,created_at,results_json")
    .order("created_at", { ascending: false });
  if (error) {
    return <div className="text-sm text-red-500">{error.message}</div>;
  }
  const baseRows = (data ?? []) as SavedSearch[];

  // Resolve image URLs (public or signed) on the server
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "research-public";
  const rows = await Promise.all(
    baseRows.map(async (s) => {
      let imageUrl = s.reference_image_url;
      if (!imageUrl && s.reference_image_path) {
        // For public bucket, compute public URL
        const { data } = (await supabase.storage.from(bucket).getPublicUrl(s.reference_image_path));
        imageUrl = data.publicUrl;
      }
      return { ...s, reference_image_url: imageUrl } as SavedSearch;
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Searches</h1>
        <Link href="/research" className="rounded border px-3 py-2">Back to Research</Link>
      </div>

      {rows.length === 0 && (
        <div className="text-sm text-muted-foreground">No saved searches yet.</div>
      )}

      <div className="space-y-4">
        {rows.map((s) => (
          <div key={s.id} className="rounded-xl border p-4 glass-panel hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {/* Image on the left */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-background/60">
                  {s.reference_image_url ? (
                    <img 
                      src={s.reference_image_url} 
                      alt={s.title ?? s.id} 
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
                    <h3 className="text-lg font-semibold line-clamp-1">{s.title ?? "Untitled search"}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(s.created_at)}</p>
                  </div>
                  
                  {/* Tools dropdown */}
                  <div className="relative group">
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        {/* View Details */}
                        <Link
                          href={`/research/saved/${s.id}`}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Details</span>
                        </Link>
                        
                        {/* Edit */}
                        <button className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors w-full text-left">
                          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        
                        {/* View All Results */}
                        {hasResults(s.results_json) && (
                          <button className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors w-full text-left">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>View All Results</span>
                          </button>
                        )}
                        
                        {/* Divider */}
                        <div className="border-t my-1"></div>
                        
                        {/* Delete */}
                        <div className="px-4 py-2">
                          <DeleteButtonClient id={s.id} title={s.title} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats in a horizontal layout */}
                <div className="flex gap-4">
                  <CardStats resultsJson={s.results_json} />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {s.ai_query && (
                    <a
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(s.ai_query)}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                      Completed on eBay
                    </a>
                  )}
                  {s.query && (
                    <a
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(s.query)}&_from=R40&rt=nc`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                      Current listings
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Updated CardStats to work better in horizontal layout
type CardItem = { price?: { value?: string; currency?: string } };
function CardStats({ resultsJson }: { resultsJson: unknown }) {
  const raw = resultsJson as Record<string, unknown> | CardItem[] | null | undefined;
  let items: CardItem[] = [];
  if (Array.isArray(raw)) {
    items = raw as CardItem[];
  } else if (raw && typeof raw === "object" && Array.isArray((raw as { results?: CardItem[] }).results)) {
    items = ((raw as { results?: CardItem[] }).results as CardItem[]) || [];
  }
  const prices: number[] = items
    .map((it) => Number(it?.price?.value))
    .filter((v) => Number.isFinite(v));
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const low = avg !== null ? avg * 0.5 : null;
  const high = avg !== null ? avg * 0.7 : null;
  const currency = items.find((it) => it?.price?.currency)?.price?.currency;
  
  return (
    <div className="flex gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Avg:</span>
        <span className="font-semibold text-emerald-400">
          {avg !== null ? `${avg.toFixed(2)} ${currency ?? ''}` : 'n/a'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Items:</span>
        <span className="font-semibold">{items.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Offer:</span>
        <span className="font-semibold">
          {low !== null && high !== null ? (
            <span>
              <span className="text-emerald-400">{low.toFixed(2)}</span>
              <span className="mx-1">-</span>
              <span className="text-emerald-400">{high.toFixed(2)}</span>
              <span className="ml-1 text-muted-foreground">{currency ?? ''}</span>
            </span>
          ) : (
            'n/a'
          )}
        </span>
      </div>
    </div>
  );
}


