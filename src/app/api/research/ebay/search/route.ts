import { NextResponse } from "next/server";
import { getApplicationAccessToken } from "@/lib/ebay/appToken";

function apiBase() {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production" ? "https://api.ebay.com" : "https://api.sandbox.ebay.com";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const imageUrl = searchParams.get("imageUrl")?.trim();
    const limit = Number(searchParams.get("limit") || 12);
    const marketplaceId = process.env.EBAY_MARKETPLACE_ID || "EBAY_US";
    
    console.log("q", q);
    console.log("imageUrl", imageUrl);
    console.log("limit", limit);
    console.log("marketplaceId", marketplaceId);

    const token = await getApplicationAccessToken();


    if (q) {
      const url = new URL(`${apiBase()}/buy/browse/v1/item_summary/search`);
      url.searchParams.set("q", q);
      url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));
      const resp = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
        },
      });
      const text = await resp.text();
      if (!resp.ok) return NextResponse.json({ error: "browse_failed", status: resp.status, detail: text.slice(0, 300) }, { status: 502 });
      return NextResponse.json(JSON.parse(text));
    }

    if (imageUrl) {
      const url = new URL(`${apiBase()}/buy/browse/v1/item_summary/search_by_image`);
      url.searchParams.set("image_url", imageUrl);
      url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));
      const resp = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
        },
      });
      const text = await resp.text();
      if (!resp.ok) return NextResponse.json({ error: "image_browse_failed", status: resp.status, detail: text.slice(0, 300) }, { status: 502 });
      return NextResponse.json(JSON.parse(text));
    }

    return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


