import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    // Fetch row to determine image path before deletion
    const { data: row, error: loadErr } = await supabase
      .from("saved_searches")
      .select("reference_image_path, reference_image_url, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (loadErr || !row) return NextResponse.json({ error: loadErr?.message || "not_found" }, { status: 404 });

    // Delete DB row
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Best-effort delete the stored image (supports both public and private buckets)
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "research-public";
    if (row.reference_image_path) {
      try {
        const admin = createSupabaseAdminClient();
        await admin.storage.from(bucket).remove([row.reference_image_path]);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


