"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "needs_verification" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (data.user && !data.session) {
      setStatus("needs_verification");
      setMessage("Check your email to confirm your account.");
      return;
    }
    // Ensure profile row exists when session is created immediately
    if (data.session && data.user) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, email: data.user.email ?? null }, { onConflict: "id" });
    }
    router.replace("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Sign up</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Create an account with email and password.
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
          {status === "loading" ? "Creating..." : "Create account"}
        </button>
      </form>
      {status !== "idle" && (
        <div
          role="status"
          className={`mt-4 rounded border p-3 text-sm ${
            status === "error"
              ? "border-red-500 text-red-600"
              : "border-green-600 text-green-700"
          }`}
        >
          {message}
        </div>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="underline" href="/login">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}


