import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import SavedResultsClient from "./SavedResultsClient";

type ItemSummary = {
  itemId: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
};

export default async function SavedSearchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/search/saved/${id}`);

  const { data, error } = await supabase
    .from("saved_searches")
    .select("id,title,query,ai_query,reference_image_url,reference_image_path,results_json,created_at")
    .eq("id", id)
    .single();
  if (error || !data) return notFound();

  type ResultsJson = { results?: ItemSummary[]; ai_per_item?: Record<string, string> } | ItemSummary[] | null;
  const raw = data.results_json as ResultsJson;
  const results: ItemSummary[] = Array.isArray(raw)
    ? (raw as ItemSummary[])
    : raw && typeof raw === "object" && Array.isArray((raw as { results?: ItemSummary[] }).results)
    ? (((raw as { results?: ItemSummary[] }).results as ItemSummary[]) || [])
    : [];
  const aiPerItem: Record<string, string> | null =
    raw && !Array.isArray(raw) && typeof raw === "object"
      ? (((raw as { ai_per_item?: Record<string, string> }).ai_per_item as Record<string, string> | undefined) ?? null)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{data.title ?? "Saved Search"}</h1>
          {data.ai_query && (
            <div className="text-xs text-muted-foreground font-mono break-words">{data.ai_query}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data.ai_query && (
            <a
              href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(data.ai_query)}&_sacat=0&_from=R40&rt=nc&LH_Complete=1`}
              target="_blank"
              rel="noreferrer"
              className="rounded border px-3 py-2"
            >
              View completed on eBay
            </a>
          )}
                  <Link href="/search" className="rounded border px-3 py-2">Search</Link>
        <Link href="/search/saved" className="rounded border px-3 py-2">All Saved</Link>
        </div>
      </div>

      <SavedResultsClient results={results} aiPerItem={aiPerItem} />
    </div>
  );
}


