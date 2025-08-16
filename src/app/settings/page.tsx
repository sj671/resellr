"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  
  const { error, connected } = useMemo(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return {
      error: params.get("ebay_error"),
      connected: params.get("ebay"),
    };
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        
        if (!data.user) {
          // User not authenticated, redirect to login
          router.push('/login?next=/settings');
          return;
        }
        
        setAuthChecking(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?next=/settings');
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {error === "declined" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          eBay authorization was declined. You can retry from here when ready.
        </div>
      )}

      {error === "state_mismatch" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Security check failed (state mismatch). Please try connecting again.
        </div>
      )}

      {connected === "connected" && (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          eBay account connected successfully.
        </div>
      )}

      <div className="flex gap-2">
        <a
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
          href="/api/ebay/auth/start"
        >
          Connect eBay
        </a>
        <SyncNowButton />
      </div>

      <p className="text-muted-foreground text-sm">More settings coming soon.</p>
    </div>
  );
}

function SyncNowButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const resp = await fetch("/api/ebay/sync-now", { method: "POST" });
      const json = await resp.json();
      if (!resp.ok) {
        const status = json?.status || resp.status;
        const error = json?.error || resp.statusText;
        const hint = json?.hint ? ` Hint: ${json.hint}` : "";
        setMessage(`Sync failed (${status}): ${error}.${hint}`);
        return;
      }
      const count = json?.count ?? 0;
      setMessage(`Triggered sync for orders. Received ${count} item(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessage(`Sync failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-60"
      >
        {loading ? "Syncing…" : "Sync now"}
      </button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}


