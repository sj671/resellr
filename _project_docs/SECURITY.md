# SECURITY.md — Snapflip
**Version:** 0.1  
**Scope:** Phase 0 baseline (extends with each phase)

---

## 1) Security Principles
- **Least privilege & default deny.** All Postgres tables use RLS with no `USING TRUE` catch‑alls.
- **Single source of truth:** Supabase Auth + PostgREST/RPC. No ad‑hoc DB users for the app.
- **No secrets in client.** Client uses only anon key; service role remains server‑only.
- **Secure by design:** sensible headers, HTTPS everywhere, strong cookie settings.
- **Defense in depth:** RLS + server checks + input validation + observability.

---

## 2) Identity, Sessions & Cookies
- **Auth Provider:** Supabase Auth (email magic link in Phase 1).
- **Session propagation:** Use `createServerClient` to read/set cookies server‑side (Next Route Handlers/Server Actions).
- **Cookies (recommended):**
  - `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` for critical flows).
  - Domain pinned to app host; no `localStorage` for tokens.
- **Revalidation:** On sign‑in/out, revalidate protected routes and purge SW cache for sensitive responses.

---

## 3) HTTP Security Headers
Configure in `next.config.mjs` (Phase 0 baseline):
```
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
**Recommended additions (Phase 1+):**
- **Content-Security-Policy** (tighten as features land):
  - baseline example (adjust hashes/nonces as needed):
    ```
    Content-Security-Policy:
      default-src 'self';
      script-src 'self' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      connect-src 'self' https://*.supabase.co;
      font-src 'self' data:;
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
    ```
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (after proving HTTPS consistently)

---

## 4) Database & RLS
### 4.1 Default posture
- Every application table has:
  - `owner_id uuid not null default auth.uid()` (or set at insert via RPC)
  - `enable row level security`
  - Policies:
    - **select:** `using (owner_id = auth.uid())`
    - **insert:** `with check (owner_id = auth.uid())`
    - **update:** `using (owner_id = auth.uid())`
    - **delete:** `using (owner_id = auth.uid())`

### 4.2 Profiles (Phase 0 example)
```sql
alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid());
```

### 4.3 RPC safety pattern
- Multi‑step writes go through **SQL functions** that validate `auth.uid()` and enforce ownership within the function.
- Example skeleton:
```sql
create or replace function public.record_sale(p_item_id uuid, p_price numeric)
returns void
language plpgsql security definer
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  -- verify ownership
  if not exists (select 1 from inventory_items where id = p_item_id and owner_id = v_uid) then
    raise exception 'forbidden';
  end if;

  -- ... do inserts/updates within a transaction ...
end $$;
```
- Mark as `stable`/`volatile` appropriately; limit `security definer` usage; keep functions small and auditable.

### 4.4 RLS Test Matrix (add tests per table)
| Table | Action | Actor | Expect | Example Test |
|---|---|---|---|---|
| `profiles` | select self | user A | ✅ allowed | `supabase.from('profiles').select('*').eq('id', userA)` |
| `profiles` | select other | user A | ❌ denied | `eq('id', userB)` → empty set |
| `profiles` | insert self | user A | ✅ allowed | insert with `id = auth.uid()` |
| `profiles` | update other | user A | ❌ denied | update `id=userB` → error/0 rows |

Automate with a small Node test using two sessions (see §9).

---

## 5) Secrets Handling
- Store **anon** and **service role** keys in **`.env`** (never commit).  
  - Client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Server‑only code may use `SUPABASE_SERVICE_ROLE` **only in Route Handlers/Server Actions** when absolutely necessary (avoid where possible; prefer RLS + user session).
- Rotate keys upon compromise or developer off‑boarding.
- Restrict Supabase project policies (CORS origins, redirect URLs, password rules).

---

## 6) PWA & Caching
- Service worker caches **static assets only** in Phase 0. Avoid caching authenticated API responses.
- Use cache‑busting on deploy; consider SW versioning.
- On sign‑out, call `caches.keys()` + delete app cache if you later cache auth’d data.

---

## 7) Dependency & Build Security
- Pin `node` version; enable `pnpm audit` in CI.
- Disallow postinstall scripts from untrusted packages.
- Verify `@supabase/*`, `next`, `react`, `shadcn/ui` are official scopes.
- Add `eslint-plugin-security` (Phase 1+).

---

## 8) Logging, Monitoring, Incident Response
- Client: error boundaries + minimal console logging (no PII).
- Server: consider Sentry for route errors; redact tokens.
- DB: Supabase logs (Auth, PostgREST) for anomaly checks.
- **IR Playbook (baseline):**
  1) Identify: alert from error rate spike or user report.
  2) Contain: revoke tokens, rotate Supabase keys, disable affected routes.
  3) Eradicate: patch, regression tests, verify RLS policies.
  4) Recover: re‑enable, monitor closely 72h.
  5) Post‑mortem: document timeline & preventive actions.

---

## 9) Quick RLS Test Harness (Node)
Create `scripts/rls-test.ts` (example sketch):
```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function signIn(email: string) {
  const c = createClient(url, anon);
  const { data, error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: 'http://localhost:3000/auth/callback' } });
  if (error) throw error;
  return c;
}

(async () => {
  const a = await signIn('a@example.com'); // use pre-provisioned users in dev
  const b = await signIn('b@example.com');

  // Example: ensure A cannot read B's profile
  const aSelf = await a.from('profiles').select('*');
  const aReadsB = await a.from('profiles').select('*').not('id','eq',(await aSelf.data?.[0]?.id) || '');

  console.log('A self:', aSelf.error || aSelf.data);
  console.log('A reads others (should be empty):', aReadsB.error || aReadsB.data);
})().catch(console.error);
```
Run with `ts-node` in dev; expand with table‑specific tests.

---

## 10) Data Classification & PII
- **Public:** app marketing copy, anonymized metrics.
- **Internal:** app configuration, non‑PII usage data.
- **Confidential (PII):** user email, names, addresses (Phase 2+).  
  - Encrypt at rest (Postgres default + disk), TLS in transit.
  - Limit access via RLS and explicit SELECT lists.
  - Do not log PII; redact in errors.

---

## 11) Backups & DR (Phase 2+)
- Supabase automated backups enabled.
- Export schema & data snapshots before destructive migrations.
- Recovery objective targets: RPO ≤ 24h, RTO ≤ 4h (adjust later).

---

## 12) Compliance & Legal (Future)
- Tax data handling (Schedule C categories) may imply retention rules.
- If handling payments (Stripe), comply with PCI‑DSS SAQ‑A (tokenized).

---

## 13) Review Checklist (per PR/phase)
- [ ] New tables have `owner_id`, RLS enabled, 4 basic policies.
- [ ] No `security definer` functions without explicit reason and test.
- [ ] No service role usage in client code.
- [ ] CSP reviewed if new external domains added.
- [ ] Secrets not committed; env documented.
- [ ] Added/updated RLS tests for new tables.
- [ ] Error states and empty states do not leak data.

---

## 14) Pentest‑Style Spot Checks (Phase 2+)
- IDOR attempts across all `owner_id`‑scoped tables.
- CSRF on sensitive POST endpoints (use `SameSite` + CSRF tokens for non‑Supabase forms).
- SW cache poisoning (restrict scope; prefer runtime fetch for data).

---

*End SECURITY.md v0.1*
