import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { NavToggle, MobileNav, UserMenu } from "@/components/header_client";

export default async function Header() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let email: string | null = null;
  let avatarUrl: string | null = null;
  if (user) {
    email = user.email ?? null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  const nav = (
    <nav className="hidden md:flex items-center gap-6 text-sm">
      <Link href="/dashboard" className="hover:underline">
        Dashboard
      </Link>
      <Link href="/inventory" className="hover:underline">
        Inventory
      </Link>
      <Link href="/listings" className="hover:underline">
        Listings
      </Link>
      <Link href="/sales" className="hover:underline">
        Sales
      </Link>
      <Link href="/expenses" className="hover:underline">
        Expenses
      </Link>
      <Link href="#" className="hover:underline">
        Insights
      </Link>
    </nav>
  );

  return (
    <header className="border-b bg-background">
      <div className="container h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavToggle />
          <Link href="/" className="font-semibold text-lg">
            Resellr
          </Link>
          {nav}
        </div>
        <div className="flex items-center gap-3">
          <UserMenu
            userPresent={!!user}
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
          />
          <ThemeToggle />
        </div>
      </div>
      <MobileNav />
    </header>
  );
}


