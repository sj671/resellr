"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import { NavToggle, MobileNav, MenuProvider } from "@/components/header_client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Header() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data on component mount and listen for auth state changes
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch('/api/me', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
        console.log('Fetched user data:', data.user?.email); // Debug log
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUser();

    // Listen for auth state changes
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: { user?: { email?: string } } | null) => {
      console.log('Auth state change:', event, session?.user?.email); // Debug log
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Clear any existing user data first
        setUser(null);
        setLoading(true);
        // Fetch fresh user data
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state...'); // Debug log
        // Clear user data immediately on sign out
        setUser(null);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        console.log('No initial session, user is logged out...'); // Debug log
        // Clear user data if no session exists
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);



  return (
    <MenuProvider>
      <header className="border-b bg-background">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <NavToggle />
            <Link href="/" className="font-semibold text-lg select-none">
              <span className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Snapflip</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex">
              <ThemeToggle />
            </span>
          </div>
        </div>
        <MobileNav user={user} loading={loading} />
      </header>
    </MenuProvider>
  );
}


