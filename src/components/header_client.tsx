"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

function Avatar({ name, src }: { name?: string | null; src?: string | null }) {
  const label = (name ?? "").trim() || "?";
  const initials = label
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-muted text-foreground grid place-items-center text-xs overflow-hidden">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function NavToggle() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = open ? "hidden" : "";
    return () => { html.style.overflow = ""; };
  }, [open]);
  return (
    <button
      className="md:hidden p-2 border rounded"
      aria-label="Open menu"
      onClick={() => setOpen((v) => !v)}
      data-open={open}
    >
      ☰
    </button>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  // tie to NavToggle via attribute (simple shared state alternative is possible)
  useEffect(() => {
    const btn = document.querySelector('[data-open]');
    function onClick() {
      const val = btn?.getAttribute('data-open') === 'true';
      setOpen(val);
    }
    btn?.addEventListener('click', onClick);
    return () => btn?.removeEventListener('click', onClick);
  }, []);

  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 z-40 bg-background/90 backdrop-blur-sm">
      <div className="absolute right-3 top-16 w-64 rounded-md border bg-popover text-popover-foreground shadow p-2">
        <nav className="grid">
          <MenuLink href="/research" label="Research" />
          <MenuLink href="/coming-soon" label="Coming Soon" />
          <MenuLink href="/profile" label="Profile" />
          <MenuLink href="/settings" label="Settings" />
        </nav>
      </div>
    </div>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="px-3 py-2 rounded hover:bg-muted">
      {label}
    </a>
  );
}

export function UserMenu({
  userPresent,
  displayName,
  email,
  avatarUrl,
}: {
  userPresent: boolean;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
}) {
  // const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!userPresent)
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="px-3 py-1 rounded border">
          Log in
        </Link>
        <Link href="/signup" className="px-3 py-1 rounded border">
          Sign up
        </Link>
      </div>
    );

  // Sign out handled via form POST for reliability

  const label = displayName || email || "Account";
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={displayName ?? email ?? undefined} src={avatarUrl ?? undefined} />
        <span className="hidden md:inline text-sm truncate max-w-[8rem]">{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover text-popover-foreground shadow">
          <div className="py-1 text-sm">
            <Link href="/dashboard" className="block px-3 py-2 hover:bg-muted" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link href="/settings" className="block px-3 py-2 hover:bg-muted" onClick={() => setOpen(false)}>
              Settings
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="block w-full text-left px-3 py-2 hover:bg-muted">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


