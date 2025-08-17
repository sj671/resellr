import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const { display_name } = await request.json();

    if (typeof display_name !== 'string') {
      return NextResponse.json({ error: "Invalid display_name" }, { status: 400 });
    }

    // Update the profile
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({ 
        display_name: display_name.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
