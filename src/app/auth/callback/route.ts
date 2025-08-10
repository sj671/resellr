import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error.message)}`, url.origin));
    }
  }

  // Create profile row if not exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("profiles")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id", ignoreDuplicates: true });
  }

  return NextResponse.redirect(new URL(next, url.origin));
}


