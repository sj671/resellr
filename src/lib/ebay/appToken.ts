let cachedToken: { value: string; expiresAt: number } | null = null;

function getTokenUrl(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  if (process.env.EBAY_TOKEN_URL) return process.env.EBAY_TOKEN_URL;
  return env === "production"
    ? "https://api.ebay.com/identity/v1/oauth2/token"
    : "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
}

export async function getApplicationAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CERT_ID;
  const scope = process.env.EBAY_BUY_SCOPE || "https://api.ebay.com/oauth/api_scope";
  if (!clientId || !clientSecret) throw new Error("missing_app_credentials");
  
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
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
    throw new Error(`app_token_failed:${resp.status}:${text.slice(0, 200)}`);
  }
  const json = (await resp.json()) as { access_token: string; expires_in: number };
  const expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;
  cachedToken = { value: json.access_token, expiresAt };
  return json.access_token;
}


