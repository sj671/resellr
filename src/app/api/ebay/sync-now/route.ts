import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getEbayApiBase(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production" ? "https://api.ebay.com" : "https://api.sandbox.ebay.com";
}

function getTokenUrl(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.ebay.com/identity/v1/oauth2/token"
    : "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
}

type EbayConnectionRow = {
  access_token: string | null;
  access_token_expires_at: string | null;
  refresh_token_enc: string | null;
};

type EbayMoney = { value?: string | number };
type EbayPricingSummary = {
  total?: EbayMoney;
  deliveryCost?: EbayMoney;
  totalTax?: EbayMoney;
  totalMarketplaceFee?: EbayMoney;
  paymentDiscount?: EbayMoney;
};
type EbayLineItem = { quantity?: number };
type EbayOrder = {
  orderId?: string;
  creationDate?: string;
  lineItems?: EbayLineItem[];
  pricingSummary?: EbayPricingSummary;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEbayOrder(value: unknown): value is EbayOrder {
  if (!isObject(value)) return false;
  // Basic shape checks
  if ("orderId" in value && typeof (value as { orderId?: unknown }).orderId !== "string" && typeof (value as { orderId?: unknown }).orderId !== "undefined") {
    return false;
  }
  if ("creationDate" in value && typeof (value as { creationDate?: unknown }).creationDate !== "string" && typeof (value as { creationDate?: unknown }).creationDate !== "undefined") {
    return false;
  }
  if ("lineItems" in value && !Array.isArray((value as { lineItems?: unknown }).lineItems) && typeof (value as { lineItems?: unknown }).lineItems !== "undefined") {
    return false;
  }
  return true;
}

async function refreshAccessTokenIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  connection: EbayConnectionRow,
) {
  const now = Date.now();
  const expiresAt = connection.access_token_expires_at ? new Date(connection.access_token_expires_at).getTime() : 0;
  const needsRefresh = !connection.access_token || expiresAt - now < 5 * 60 * 1000; // <5m
  if (!needsRefresh) return connection.access_token as string;

  const clientId = process.env.EBAY_APP_ID!;
  const clientSecret = process.env.EBAY_CERT_ID!;
  const refreshToken = connection.refresh_token_enc;
  if (!refreshToken) throw new Error("missing_refresh_token");

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const resp = await fetch(getTokenUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
    cache: "no-store",
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`refresh_failed:${resp.status}:${text.slice(0, 120)}`);
  }
  const json = await resp.json();
  const newAccess = json.access_token as string;
  const expiresIn = (json.expires_in as number) ?? 0;
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { error } = await supabase
    .from("ebay_connections")
    .update({ access_token: newAccess, access_token_expires_at: accessTokenExpiresAt, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error(`persist_failed:${error.message}`);
  return newAccess;
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  // Load connection
  const { data: conn, error: connErr } = await supabase
    .from("ebay_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (connErr || !conn) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  try {
    const accessToken = await refreshAccessTokenIfNeeded(supabase, user.id, conn);
    const apiBase = getEbayApiBase();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const ordersUrl = new URL(`${apiBase}/sell/fulfillment/v1/order`);
    // Use documented filter param for time window and a small limit
    ordersUrl.searchParams.set("filter", `creationdate:[${since}..]`);
    ordersUrl.searchParams.set("limit", "20");

    const marketplaceId = process.env.EBAY_MARKETPLACE_ID || "EBAY_US";
    const resp = await fetch(ordersUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      // Surface common hints for 400/403
      const hint = resp.status === 403
        ? "Check scopes: include sell.fulfillment.readonly and re-connect."
        : resp.status === 400
        ? "Verify filter format and marketplace header."
        : undefined;
      return NextResponse.json({ error: "orders_fetch_failed", status: resp.status, detail: text.slice(0, 300), hint }, { status: 502 });
    }
    const json: unknown = await resp.json();

    // Map orders → sales (idempotent) with safe narrowing
    const ordersUnknown = isObject(json) && Array.isArray((json as { orders?: unknown }).orders)
      ? ((json as { orders?: unknown }).orders as unknown[])
      : [];
    const orders: EbayOrder[] = ordersUnknown.filter(isEbayOrder);
    const salesRows = orders.map((order) => {
      const orderId = typeof order.orderId === "string" ? order.orderId : undefined;
      const lineItems: EbayLineItem[] = Array.isArray(order.lineItems) ? order.lineItems : [];
      const subtotal = Number(order.pricingSummary?.total?.value ?? 0);
      const shippingIn = Number(order.pricingSummary?.deliveryCost?.value ?? 0);
      const tax = Number(order.pricingSummary?.totalTax?.value ?? 0);
      const createdAt = order.creationDate ? new Date(order.creationDate).toISOString() : new Date().toISOString();
      return {
        user_id: user.id,
        marketplace: "ebay",
        marketplace_sale_id: orderId ?? null,
        sale_date: createdAt,
        quantity: lineItems.reduce((acc: number, li: EbayLineItem) => acc + Number(li?.quantity ?? 0), 0) || 1,
        gross_amount: subtotal,
        fees: Number(order.pricingSummary?.totalMarketplaceFee?.value ?? 0) + Number(order.pricingSummary?.paymentDiscount?.value ?? 0),
        shipping_income: shippingIn,
        shipping_cost: 0, // unknown; left for user to edit later
        tax,
        note: null,
        external_json: order as unknown as Record<string, unknown>,
      };
    });

    if (salesRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("sales")
        .upsert(salesRows, {
          onConflict: "user_id,marketplace,marketplace_sale_id",
          ignoreDuplicates: false,
        });
      if (upsertErr) {
        return NextResponse.json({ error: `sales_upsert_failed:${upsertErr.message}` }, { status: 502 });
      }
    }

    // Update sync_state timestamp regardless
    await supabase
      .from("sync_state")
      .upsert({ user_id: user.id, provider: "ebay", resource: "orders", last_synced_at: new Date().toISOString() }, { onConflict: "user_id,provider,resource" });

    const count = orders.length;
    return NextResponse.json({ ok: true, resource: "orders", count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


