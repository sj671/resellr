import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If there's an auth error or no user, return null for both
    if (authError || !user) {
      return NextResponse.json({ user: null, profile: null });
    }

    // Only try to fetch profile if we have a valid user
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Return user data even if profile fetch fails
        return NextResponse.json({ user, profile: null });
      }

      return NextResponse.json({ user, profile });
    } catch (profileError) {
      console.error('Profile fetch exception:', profileError);
      // Return user data even if profile fetch fails
      return NextResponse.json({ user, profile: null });
    }
  } catch (error) {
    console.error('API /me error:', error);
    // Return null for both user and profile on any error
    return NextResponse.json({ user: null, profile: null });
  }
}


