import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function ProfilePage() {
  const supabase = await createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const email = user.email ?? "";
  const userId = user.id;
  const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  const createdAt = user.created_at ? new Date(user.created_at) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-white">
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and view your profile information</p>
      </div>

      <div className="rounded-2xl border p-6 glass-panel">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mt-3">Account Details</h2>
          <p className="text-xs text-muted-foreground">Your profile information</p>
        </div>

        <div className="space-y-4">
          <Field label="Email Address" value={email} />
          <Field label="User ID" value={userId} />
          <Field label="Last Sign In" value={lastSignInAt ? formatDate(lastSignInAt.toISOString()) : "—"} />
          <Field label="Account Created" value={createdAt ? formatDate(createdAt.toISOString()) : "—"} />
        </div>


      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="rounded-md border bg-background/60 px-3 py-3 text-sm glass-panel">{value}</div>
    </div>
  );
}


