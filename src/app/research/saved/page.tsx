import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import DeleteButtonClient from "./DeleteButtonClient";

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

      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className="rounded-xl border p-3 glass-panel space-y-3">
            <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-background/60">
              {s.reference_image_url ? (
                <img src={s.reference_image_url} alt={s.title ?? s.id} className="w-full h-full object-cover" />
              ) : (
                <div className="grid place-items-center h-full text-xs text-muted-foreground">No image</div>
              )}
              <div className="absolute right-2 top-2">
                <DeleteButtonClient id={s.id} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium line-clamp-2">{s.title ?? "Untitled search"}</div>
              <div className="text-xs text-muted-foreground">{formatDate(s.created_at)}</div>
              <CardStats resultsJson={s.results_json} />
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/research/saved/${s.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded border hover:bg-accent"
                  title="Open saved search"
                  aria-label="Open saved search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 5v6h6v2H10V5h2Zm-2 14h10v2H8v-2ZM2 3h6v2H4v14h4v2H2V3Z"/>
                  </svg>
                </Link>
                {s.ai_query && (
                  <a
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(s.ai_query)}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Completed on eBay
                  </a>
                )}
                {s.query && (
                  <a
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(s.query)}&_sacat=0&_from=R40&rt=nc`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Current listings
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Removed async resolver – images are resolved in the main function now

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
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border p-3 glass-panel">
        <div className="text-xs text-muted-foreground">Avg Price</div>
        <div className="font-semibold text-emerald-400 mt-1">{avg !== null ? `${avg.toFixed(2)} ${currency ?? ''}` : 'n/a'}</div>
      </div>
      <div className="rounded-lg border p-3 glass-panel">
        <div className="text-xs text-muted-foreground">Items Found</div>
        <div className="font-semibold mt-1">{items.length}</div>
      </div>
      <div className="col-span-2 rounded-lg border p-3 glass-panel">
        <div className="text-xs text-muted-foreground">Suggested Offer</div>
        <div className="font-semibold mt-1">
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
    </div>
  );
}


