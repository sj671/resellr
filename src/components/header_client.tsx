"use client";
import Link from "next/link";
import { useEffect, useState, createContext, useContext } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Create a context for sharing menu state
const MenuContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

// Custom hook to use menu context
const useMenu = () => useContext(MenuContext);

// Context provider component
export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

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
  const { isOpen, setIsOpen } = useMenu();
  
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = isOpen ? "hidden" : "";
    return () => { html.style.overflow = ""; };
  }, [isOpen]);

  return (
    <button
      className="p-2 border rounded hover:bg-accent transition-colors"
      aria-label="Open menu"
      onClick={() => setIsOpen(!isOpen)}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

export function MobileNav({ 
  user, 
  loading 
}: { 
  user: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null;
  loading: boolean;
}) {
  const { isOpen, setIsOpen } = useMenu();

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.mobile-nav') && !target.closest('button')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Close menu on escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);

  const handleSignOut = async () => {
    try {
      console.log('Signing out user...'); // Debug log
      
      // Close menu immediately
      setIsOpen(false);
      
      const supabase = createSupabaseBrowserClient();
      
      // First, call the Supabase signout endpoint to clear server-side session
      try {
        await fetch('/auth/signout', { method: 'POST' });
        console.log('Server-side signout successful');
      } catch (signoutError) {
        console.log('Server-side signout failed, continuing with client-side...', signoutError);
      }
      
      // Sign out from Supabase client
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful, clearing all auth state...'); // Debug log
      
      // Clear all Supabase-related storage
      if (typeof window !== 'undefined') {
        // Clear localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear cookies manually
        document.cookie.split(";").forEach(function(c) { 
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      }
      
      // Force a complete page reload to clear all state
      console.log('Reloading page to clear all state...'); // Debug log
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if sign out fails, clear storage and redirect
      setIsOpen(false);
      
      if (typeof window !== 'undefined') {
        // Clear storage even on error
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      }
      
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Slide-out Menu */}
      <div 
        className={`mobile-nav fixed left-0 top-0 h-full w-80 bg-background border-r z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-2">
          <MenuLink href="/research" label="Research" onClick={() => setIsOpen(false)} />
          <MenuLink href="/coming-soon" label="Coming Soon" onClick={() => setIsOpen(false)} />
          <MenuLink href="/profile" label="Profile" onClick={() => setIsOpen(false)} />
          <MenuLink href="/settings" label="Settings" onClick={() => setIsOpen(false)} />
          <MenuLink href="/dashboard" label="Dashboard" onClick={() => setIsOpen(false)} />
        </nav>

        {/* User Section */}
        {!loading && (
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.email} src={user.user_metadata?.avatar_url} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-2 text-sm text-center border rounded-lg hover:bg-accent transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-2 text-sm text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MenuLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      className="block px-4 py-3 rounded-lg hover:bg-accent transition-colors text-base font-medium"
      onClick={onClick}
    >
      {label}
    </Link>
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


