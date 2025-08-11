import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EbayTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  refresh_token?: string;
  refresh_token_expires_in?: number; // seconds
  scope?: string; // space-delimited
};

function getEbayTokenUrl(envValue: string | undefined): string {
  const env = (envValue || "sandbox").toLowerCase();
  if (process.env.EBAY_TOKEN_URL) return process.env.EBAY_TOKEN_URL;
  return env === "production"
    ? "https://api.ebay.com/identity/v1/oauth2/token"
    : "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Validate state against cookie (CSRF protection)
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ebay_oauth_state")?.value;
  if (expectedState && state !== expectedState) {
    return NextResponse.redirect(new URL(`/settings?ebay_error=${encodeURIComponent("state_mismatch")}`, url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/settings")}`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/settings?ebay_error=${encodeURIComponent("missing_code")}`, url.origin));
  }

  const clientId = process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CERT_ID;
  const ruName = process.env.EBAY_RU_NAME; // RuName (Redirect URL name)
  const scopeConfigured = process.env.EBAY_SCOPE || "";
  const envValue = process.env.EBAY_ENV || "sandbox";

  if (!clientId || !clientSecret || !ruName) {
    return NextResponse.redirect(
      new URL(
        `/settings?ebay_error=${encodeURIComponent(
          "server_config_missing"
        )}`,
        url.origin
      )
    );
  }

  const tokenUrl = getEbayTokenUrl(envValue);

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ruName,
    });

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: body.toString(),
      // Do not cache tokens
      cache: "no-store",
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return NextResponse.redirect(
        new URL(
          `/settings?ebay_error=${encodeURIComponent(
            `token_exchange_failed:${tokenResp.status}`
          )}&detail=${encodeURIComponent(text.slice(0, 200))}`,
          url.origin
        )
      );
    }

    const tokenJson = (await tokenResp.json()) as EbayTokenResponse;
    const now = Date.now();
    const accessTokenExpiresAt = new Date(
      now + (tokenJson.expires_in ?? 0) * 1000
    ).toISOString();
    const scopesArray = (tokenJson.scope || scopeConfigured)
      .split(" ")
      .filter(Boolean);

    // Persist connection (owner-only RLS expected)
    const upsertPayload = {
      user_id: user.id,
      access_token: tokenJson.access_token,
      access_token_expires_at: accessTokenExpiresAt,
      refresh_token_enc: tokenJson.refresh_token ?? null,
      scopes: scopesArray,
      status: "connected" as const,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("ebay_connections")
      .upsert(upsertPayload, { onConflict: "user_id" });

    if (upsertError) {
      return NextResponse.redirect(
        new URL(
          `/settings?ebay_error=${encodeURIComponent(
            `persist_failed:${upsertError.message}`
          )}`,
          url.origin
        )
      );
    }

    return NextResponse.redirect(new URL(`/settings?ebay=connected`, url.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(new URL(`/settings?ebay_error=${encodeURIComponent(message)}`, url.origin));
  }
}


