import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null, profile: null });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ user, error: error.message }, { status: 500 });
  return NextResponse.json({ user, profile });
}


