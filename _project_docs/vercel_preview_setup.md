# Vercel Preview Environment Setup (Staging)

Goal: Run a stable Sandbox-backed staging at a fixed preview domain to test eBay OAuth without changing settings per deploy.

---

## 1) Create a stable preview domain

Option A — Add a Preview domain to this project
- In Vercel → Project → Settings → Domains → Add
- Enter a domain/subdomain you control, e.g. `staging.snapflip.app`
- Assign it to the Preview environment
- Result: `https://staging.snapflip.app` always points to the latest Preview deploy

Option B — Separate “staging” project (simple)
- Duplicate this project in Vercel as `snapflip-staging`
- Assign a stable domain, e.g. `snapflip-staging.vercel.app` (or a custom domain)
- Use Sandbox env vars in this project

Note: eBay OAuth requires an exact redirect. Stable Preview domain avoids updating eBay settings every PR.

---

## 2) Environment variables (Preview)
Set these in Vercel → Project → Settings → Environment Variables → Environment: Preview.

- NEXT_PUBLIC_SUPABASE_URL: your STAGING Supabase URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: your STAGING anon key
- EBAY_ENV: `sandbox`
- EBAY_APP_ID: Sandbox Client ID
- EBAY_CERT_ID: Sandbox Client Secret
- EBAY_RU_NAME: Sandbox RuName (exact string)
- EBAY_SCOPE:
  - `https://api.ebay.com/oauth/api_scope`
  - `https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly`
  - (optional) `https://api.ebay.com/oauth/api_scope/sell.inventory.readonly`
- EBAY_MARKETPLACE_ID: `EBAY_US` (optional)

After adding variables, redeploy.

---

## 3) eBay Sandbox settings
In eBay Developer Portal (Sandbox app):
- Redirect URL (for your Sandbox RuName): `https://<preview-domain>/auth/callback/ebay`, e.g. `https://staging.snapflip.app/auth/callback/ebay`
- Privacy Policy URL: `https://<preview-domain>/privacy`
- Accepted URL: `https://<preview-domain>/settings?ebay=connected`
- Declined URL: `https://<preview-domain>/settings?ebay_error=declined`

---

## 4) Supabase migrations (staging project)
From your local machine:
```bash
supabase link --project-ref <staging-ref>
supabase migration up
```

---

## 5) Verify flow
- Open `https://<preview-domain>/settings`
- Click “Connect eBay” → log in with Sandbox test user → back to Settings (connected)
- Click “Sync now” → verify `public.sales` in STAGING Supabase

---

## 6) Notes
- `VERCEL_ENV=preview` at runtime; `EBAY_ENV` should be `sandbox` here (set explicitly via env var)
- Changing `EBAY_SCOPE` requires re-connecting the account to grant new scopes
- Keep production credentials strictly separate (Production environment variables)

