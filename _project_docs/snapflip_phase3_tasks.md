# Snapflip — Phase 3 Tasks: eBay Sync (Read‑Only)

**Scope:** Connect a user's eBay account and continuously ingest Orders and active Listings into local tables using idempotent upserts. No writebacks to eBay.

---

## 1. Outcomes
- User can connect eBay via OAuth and see connection status.
- Orders and active Listings are imported on an interval and on-demand, mapped to `sales` and `listings`.
- Ingestion is idempotent, resilient to retries, and respects API quotas.
- Manual sale entry remains available for non‑eBay marketplaces.

---

## 2. Milestones & Tasks

### M1 — OAuth & Connection (implemented)
- App config
  - Env vars: `EBAY_ENV` ("production"|"sandbox"), `EBAY_APP_ID`, `EBAY_CERT_ID`, `EBAY_RU_NAME` (Redirect URL name), `EBAY_SCOPE` (space‑delimited minimal scopes), `EBAY_BASE_URL` (derived), `EBAY_MARKETPLACE_ID` (default `EBAY_US`).
- DB: `public.ebay_connections`
  - Columns: `owner_id uuid PK (FK profiles)`, `ebay_user_id text`, `refresh_token_enc text`, `access_token text`, `access_token_expires_at timestamptz`, `scopes text[]`, `status text check in ('connected','revoked','error') default 'connected'`, `failure_count int default 0`, `last_error text`, `created_at`, `updated_at`.
  - RLS: owner‑only read/write. Default deny.
- UI: Settings → eBay card
  - Connect button → begins OAuth via `/api/ebay/auth/start`, redirects to eBay authorize URL.
  - After callback (`/auth/callback/ebay`), redirect to `/settings?ebay=connected` or show error via `?ebay_error=`.
  - Show connection status, "Sync now" button (calls `/api/ebay/sync-now`).
- Server actions / routes
  - Exchange `code` for tokens; store `refresh_token_enc` using server‑side encryption (e.g., Supabase `pgp_sym_encrypt` or KMS if available), compute `access_token_expires_at`.
  - Token refresh helper invoked when < 5 minutes to expiry.

### M2 — Data Model & Mapping
- Tables from Phase 2 are assumed: `listings`, `sales`.
- Field mapping (high‑level)
  - Listings (active):
    - marketplace: `"ebay"`
    - listing_id: eBay listing/item ID
    - status: `"active"|"ended"` (only `active` in Phase 3 UI)
    - price: current buy‑it‑now price if available
    - external_json: selected raw fields for debugging
  - Sales (orders):
    - sale_id: eBay orderId
    - sold_at: order purchase date (UTC)
    - price: item subtotal (sum of line items)
    - fees: marketplace + payment processing fees (sum)
    - shipping_in: shipping charged to buyer
    - shipping_out: actual shipping cost (unknown from eBay; leave 0, editable)
    - tax: tax collected (if provided)
    - external_json: selected raw fields for debugging
  - Inventory association: Use SKU match on order line items to link to `inventory_items` where possible; otherwise, keep null.
- Idempotency strategy
  - Upsert by composite unique keys:
    - Listings: `(marketplace='ebay', listing_id)`
    - Sales: `(marketplace='ebay', sale_id)`
  - Updates should be non‑destructive for user‑entered fields (e.g., do not overwrite `shipping_out`).

### M3 — Sync Workers (Pull)
- Create `public.sync_state` table
  - Columns: `owner_id uuid`, `provider text`, `resource text`, `cursor text`, `last_synced_at timestamptz`, PK `(owner_id, provider, resource)`.
  - RLS: owner‑only.
- Scheduled job (every 10–15 min) per connected account
  - Resources: `orders`, `listings`.
  - Use `cursor` or `modifiedSince` if provided by eBay; otherwise, maintain `last_synced_at` and windowing.
  - Handle pagination; respect `Retry‑After` and backoff on 429.
  - On 401, refresh token and retry once; on failure, increment `failure_count` and store `last_error`.
- On‑demand sync endpoint implemented: `/api/ebay/sync-now`.
  - Uses `filter=creationdate:[<ISO>..]` and `X-EBAY-C-MARKETPLACE-ID` header.
  - Maps orders to `sales` via idempotent upsert; updates `sync_state`.

### M4 — UI Surfacing
- Settings
  - Connection status, last sync time, error string, buttons: Sync now, Revoke.
- Listings page
  - Show eBay listings with `marketplace` badge and filter.
- Sales page
  - Show imported orders with badges and filter, allow editing of `shipping_out`.

### M5 — Testing & Tooling
- Unit tests for mappers (orders → sales, listings → listings) with fixtures.
- E2E smoke for OAuth callback happy path (mock eBay API).
- Seed/mocking script
  - Provide `scripts/phase3_mock_ebay.mjs` to insert representative listings/orders or to stand up a mock HTTP server for local sync.
  - Include a README snippet for usage and cleanup, similar to a `seed.mjs` pattern for easy testing.

#### EBAY_ENV & OAuth Connectivity Tests
- Environment validation
  - Ensure: `EBAY_ENV`, `EBAY_APP_ID`, `EBAY_CERT_ID`, `EBAY_RU_NAME`, `EBAY_SCOPE` and base URL derived from env.
  - Add a runnable script: `scripts/phase3_env_test.mjs` that validates presence/format and exits non‑zero on failure.
- OAuth URL construction
  - Built authorize URL uses RuName for `redirect_uri` (not raw URL).
  - Note: eBay expects `redirect_uri` to be the Redirect URL name (RuName) configured in your developer app, not the raw HTTPS URL. Update the underlying Redirect URL for that RuName in the eBay app settings to point to your tunnel or production domain.
  - Output the URL for manual copy/paste to validate the app registration.
- Token exchange flow (mock)
  - Using the mock server (`scripts/phase3_mock_ebay.mjs`) or a simple local handler, simulate exchanging a code for tokens and verify the code path that stores `refresh_token_enc`, `access_token`, and `access_token_expires_at` without hitting real eBay.
- How to run
  - Sandbox dry‑run:
    ```bash
    EBAY_ENV=sandbox EBAY_APP_ID=xxx EBAY_CERT_ID=yyy EBAY_REDIRECT_URI=https://example.com/cb \
    EBAY_SCOPE="https://api.ebay.com/oauth/api_scope" \
    node scripts/phase3_env_test.mjs --print-url
    ```
  - With mock token exchange:
    ```bash
    node scripts/phase3_env_test.mjs --mock
    ```
  - Documented per your preference for test scripts with usage notes similar to `seed.mjs` [[memory:5714198]].

##### Local Redirect URL (Cloudflared/ngrok)
- For local OAuth testing you need a public HTTPS URL that forwards to your localhost so the eBay redirect can reach your app.
- Option A: Cloudflared (quick tunnel)
  - Install: `brew install cloudflared` or follow Cloudflare docs.
  - Start tunnel: `cloudflared tunnel --url http://localhost:3000`
  - Copy the printed `https://<random>.trycloudflare.com` URL.
- Set your eBay app Redirect URL (for the RuName) to `https://<random>.trycloudflare.com/auth/callback/ebay`. In env, set `EBAY_RU_NAME` to the app’s Redirect URL name.

---

## 10. Research (eBay Browse) — Implemented
- Text search endpoint: `src/app/api/research/ebay/search/route.ts` proxies `q` or `imageUrl` to `buy/browse/v1/item_summary/search` using application access token.
- Image search endpoint: `src/app/api/research/ebay/search-by-image/route.ts` accepts multipart upload and forwards base64 JSON body to `search_by_image`.
- App token helper: `src/lib/ebay/appToken.ts` caches client‑credentials token (`EBAY_APP_ID`/`EBAY_CERT_ID`), defaults `EBAY_BUY_SCOPE` to `https://api.ebay.com/oauth/api_scope`.
- AI summarization: `src/app/api/ai/summarize-titles/route.ts` calls OpenAI (model `gpt-4o-mini` by default) to produce a concise query and notes.
- UI: `src/app/research/page.tsx` implements keyword/image search, KPIs, AI generation, Save modal, quick-fill from AI to title.
- Saved searches
  - DB migrations: `00000000000004_phase3_saved_searches.sql`, `00000000000005_add_title_to_saved_searches.sql`, `00000000000006_saved_searches_unique_title.sql`, `00000000000007_saved_searches_delete_policy.sql`, `00000000000008_saved_searches_image_path.sql`.
  - Storage bucket: `00000000000009_storage_research_public.sql` creates `research-public` with public read and per‑user write policies.
  - APIs: save (`src/app/api/research/save/route.ts`), delete (`src/app/api/research/saved/[id]/delete/route.ts`), update per‑item AI (`src/app/api/research/saved/[id]/update-ai/route.ts`).
  - Pages: list (`src/app/research/saved/page.tsx`), detail (`src/app/research/saved/[id]/page.tsx`) and client (`SavedResultsClient.tsx`).

### Env
- `EBAY_MARKETPLACE_ID` (default `EBAY_US`)
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
- `SUPABASE_STORAGE_BUCKET=research-public`, `SUPABASE_STORAGE_PUBLIC=true`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only) for image delete path

### RLS Notes
- `saved_searches`: select/insert/update/delete where `user_id = auth.uid()`.
- Storage (`research-public`):
  - public read; authenticated users can write/delete only under `{auth.uid()}/...` path.
- Option B: ngrok
  - `ngrok http 3000` → use the printed `https://<random>.ngrok.io` as above.
- Note
  - eBay requires an exact match for redirect URIs; ephemeral URLs mean you must update both env and eBay app each time it changes. Prefer a stable domain/tunnel when possible.

---

## 3. APIs (eBay — indicative)
- Orders: eBay Sell Fulfillment API `getOrders` with time filtering and pagination.
- Listings: eBay Sell Inventory/Listing APIs for active items.
- Use minimal scopes necessary; store scope list with the connection for audit.

---

## 4. Environment & Secrets
- `EBAY_ENV`, `EBAY_APP_ID`, `EBAY_CERT_ID`, `EBAY_REDIRECT_URI`, `EBAY_SCOPE`, `EBAY_BASE_URL`.
- Store secrets only in server runtime / `.env.local` and Supabase secrets; never in client.
- Encrypt refresh tokens at rest.

---

## 5. RLS & Security
- `ebay_connections`, `sync_state`: owner‑only policies.
- All ingestion occurs via server‑side jobs with service role; final writes performed through RPC that enforces ownership on insert/update.
- Limit `external_json` to necessary fields; avoid PII beyond what the app needs.

---

## 6. Acceptance Criteria
- User can connect and revoke eBay.
- First sync runs within 5 minutes of connection; "Sync now" triggers within 30 seconds.
- Re‑running sync causes no duplicates; updated data is reflected.
- At least one real eBay sandbox account successfully ingested in staging.
- Mapping unit tests pass; E2E OAuth callback smoke passes.
- Environment test script passes for both `EBAY_ENV=sandbox` and `EBAY_ENV=production` (URL generation and env validation).

---

## 7. Rollout Plan
- Dev: sandbox eBay app and account; run scheduled job with short interval.
- Staging: connect a test account; monitor error rates and ingestion lag.
- Prod: enable production eBay credentials; set conservative schedules; add alerting on consecutive failures per account.

---

## 8. Non‑Goals (Phase 3)
- Creating or editing eBay listings.
- Handling returns/cancellations/partial refunds beyond what appears in order payload.
- Multi‑marketplace sync (future phases may add others).

---

## 9. Open Questions
- Exact fee breakdown mapping—aggregate vs. separate columns? (Proposed: aggregate into `fees`, keep raw in `external_json`.)
- Which eBay listing endpoint best aligns with required fields for active inventory? Validate during implementation.
