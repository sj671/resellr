import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateResultsCount } from "@/lib/saved-searches";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { aiPerItem } = (await request.json()) as { aiPerItem?: Record<string, string> };
    if (!aiPerItem || Object.keys(aiPerItem).length === 0) {
      return NextResponse.json({ error: "missing_aiPerItem" }, { status: 400 });
    }

    // Load existing
    const { data, error } = await supabase
      .from("saved_searches")
      .select("results_json,user_id")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message || "not_found" }, { status: 404 });
    if (data.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    type ItemSummary = {
      itemId: string;
      title?: string;
      image?: { imageUrl?: string };
      price?: { value?: string; currency?: string };
      itemWebUrl?: string;
    };
    type ResultsJson = { results?: ItemSummary[]; ai_per_item?: Record<string, string> } | ItemSummary[] | null;
    const raw = data.results_json as ResultsJson;
    let merged: { results: ItemSummary[]; ai_per_item: Record<string, string> };
    if (Array.isArray(raw)) {
      merged = { results: raw, ai_per_item: { ...aiPerItem } };
    } else if (raw && typeof raw === "object") {
      const existingResults = Array.isArray((raw as { results?: ItemSummary[] }).results)
        ? ((raw as { results?: ItemSummary[] }).results as ItemSummary[])
        : [];
      const existingAi = (raw as { ai_per_item?: Record<string, string> }).ai_per_item || {};
      merged = { results: existingResults, ai_per_item: { ...existingAi, ...aiPerItem } };
    } else {
      merged = { results: [], ai_per_item: { ...aiPerItem } };
    }

    // Calculate updated results count
    const resultsCount = calculateResultsCount(merged);

    const { error: upErr } = await supabase
      .from("saved_searches")
      .update({ 
        results_json: merged,
        results_count: resultsCount
      })
      .eq("id", id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


