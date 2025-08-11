"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    // Ensure profile row exists on first sign-in (Phase 1 acceptance criterion)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id" });
    }
    // Ensure the SSR session cookies are set by calling a server route to setSession
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      await fetch("/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        }),
      });
    }
    router.replace("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Log in</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Use your email and password to access your account.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md px-4 py-2 bg-foreground text-background disabled:opacity-60"
        >
          {status === "loading" ? "Logging in..." : "Log in"}
        </button>
      </form>
      {status === "error" && (
        <div
          role="status"
          className="mt-4 rounded border p-3 text-sm border-red-500 text-red-600"
        >
          {message}
        </div>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Don’t have an account?{" "}
        <Link className="underline" href="/signup">
          Sign up
        </Link>
        .
      </p>
    </div>
  );
}


