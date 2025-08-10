import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        const secure = process.env.NODE_ENV === "production";
        try {
          cookieStore.set({
            name,
            value,
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure,
          });
        } catch {
          // ignore when not in a route handler/server action
        }
      },
      remove(name: string, options: CookieOptions) {
        const secure = process.env.NODE_ENV === "production";
        try {
          cookieStore.set({
            name,
            value: "",
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure,
          });
        } catch {
          // ignore when not in a route handler/server action
        }
      },
    },
  });
}

export async function createSupabaseRSCClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // In Server Components, cookie mutations are not allowed. Provide read-only access.
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}


