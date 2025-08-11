import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import { NavToggle, MobileNav } from "@/components/header_client";

export default async function Header() {

  const nav = (
    <nav className="hidden md:flex items-center gap-6 text-sm">
      <Link href="/research" className="hover:underline">
        Research
      </Link>
      <Link href="/coming-soon" className="hover:underline">
        Coming Soon
      </Link>
      <Link href="/profile" className="hover:underline">Profile</Link>
      <Link href="#" className="hover:underline">
        Insights
      </Link>
    </nav>
  );

  return (
    <header className="border-b bg-background">
      <div className="container h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <NavToggle />
          <Link href="/" className="font-semibold text-lg select-none">
            <span className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Resellr</span>
          </Link>
          {nav}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
        </div>
      </div>
      <MobileNav />
    </header>
  );
}


