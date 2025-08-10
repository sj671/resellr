"use client";
import Link from "next/link";
import { useState } from "react";

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
  return null; // Placeholder for future mobile sheet nav
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
        className="flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={displayName ?? email ?? undefined} src={avatarUrl ?? undefined} />
        <span className="hidden sm:inline text-sm">{label}</span>
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


