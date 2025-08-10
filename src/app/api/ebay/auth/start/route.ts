import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getAuthBase(): string {
  if (process.env.EBAY_AUTH_BASE_URL) return process.env.EBAY_AUTH_BASE_URL;
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://auth.ebay.com/oauth2/authorize"
    : "https://auth.sandbox.ebay.com/oauth2/authorize";
}

function buildAuthorizeUrl(params: Record<string, string>): string {
  const url = new URL(getAuthBase());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function GET() {
  const clientId = process.env.EBAY_APP_ID;
  const ruName = process.env.EBAY_RU_NAME; // Redirect URL name (RuName)
  const scope = process.env.EBAY_SCOPE || "https://api.ebay.com/oauth/api_scope";

  if (!clientId || !ruName) {
    return NextResponse.json({ error: "server_config_missing" }, { status: 500 });
  }

  const stateBytes = await crypto.getRandomValues(new Uint8Array(12));
  const state = Buffer.from(stateBytes).toString("hex");

  const authorizeUrl = buildAuthorizeUrl({
    response_type: "code",
    client_id: clientId,
    redirect_uri: ruName,
    scope,
    state,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: "ebay_oauth_state",
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return NextResponse.redirect(authorizeUrl);
}


