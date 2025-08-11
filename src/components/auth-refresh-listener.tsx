"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange(() => {
      // Refresh Server Components (e.g., Header) when auth state changes
      router.refresh();
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}


