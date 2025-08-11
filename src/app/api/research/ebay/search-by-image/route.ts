import { NextResponse } from "next/server";
import { getApplicationAccessToken } from "@/lib/ebay/appToken";

function apiBase() {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production" ? "https://api.ebay.com" : "https://api.sandbox.ebay.com";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const limit = String(form.get("limit") || "12");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "missing_file" }, { status: 400 });
    }

    const token = await getApplicationAccessToken();
    const marketplaceId = process.env.EBAY_MARKETPLACE_ID || "EBAY_US";

    // Send JSON payload with base64 image per your expected format
    const arrayBuf = await (file as Blob).arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    const url = `${apiBase()}/buy/browse/v1/item_summary/search_by_image`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64,
        filter: "soldItems",
        limit: Number(limit) || 12,
        sort: "newlyListed",
      }),
    });
    const text = await resp.text();
    if (!resp.ok) return NextResponse.json({ error: "image_browse_failed", status: resp.status, detail: text.slice(0, 300) }, { status: 502 });
    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


