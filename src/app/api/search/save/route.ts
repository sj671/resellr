import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prepareSavedSearchData } from "@/lib/saved-searches";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { title, query, aiQuery, results, aiPerItem, referenceImageBase64 } = (await request.json()) as {
      title?: string;
      query?: string;
      aiQuery?: string;
      results?: unknown;
      aiPerItem?: Record<string, string>;
      referenceImageBase64?: string; // data URL or raw base64 without prefix
    };

    let referenceImageUrl: string | null = null;
    let referenceImagePath: string | null = null;
    if (referenceImageBase64) {
      const b64 = referenceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      const buffer = Buffer.from(b64, "base64");
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "research-public";
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const upload = await supabase.storage.from(bucket).upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (!upload.error) {
        referenceImagePath = fileName;
        // Bucket is public → compute public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        referenceImageUrl = data.publicUrl;
      } else {
        return NextResponse.json({ error: `upload_failed:${upload.error.message}` }, { status: 400 });
      }
    }

    const payload = prepareSavedSearchData({
      user_id: user.id,
      title: title ?? null,
      query: query ?? null,
      ai_query: aiQuery ?? null,
      results_json: { results: results ?? null, ai_per_item: aiPerItem ?? null } as unknown,
      reference_image_url: referenceImageUrl,
      reference_image_path: referenceImagePath,
    });

    const { error } = await supabase
      .from("saved_searches")
      .insert(payload);
    if (error) {
      const isDupe = error.code === "23505" || (error.message || "").includes("ux_saved_searches_user_title");
      return NextResponse.json({ error: isDupe ? "duplicate_title" : error.message }, { status: isDupe ? 409 : 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


