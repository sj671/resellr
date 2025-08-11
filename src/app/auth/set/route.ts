import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SetSessionBody = {
  access_token?: string;
  refresh_token?: string;
};

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = (await request.json()) as SetSessionBody;
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "missing_tokens" }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Ensure profile row exists after setting session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id", ignoreDuplicates: false });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


