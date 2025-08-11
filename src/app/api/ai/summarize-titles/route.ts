import { NextResponse } from "next/server";

const OPENAI_API_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  try {
    const { titles } = (await request.json()) as { titles?: string[] };
    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ error: "missing_titles" }, { status: 400 });
    }
    console.log("titles", titles);
    const system = `You are an expert e-commerce merchandiser and eBay search optimizer. Given many listing titles, create ONE concise, high-recall keyword query suitable for eBay's search box.

Rules:
- Capture the common product (brand + model/family + key spec if consistent). Remove fluff (emojis, condition words, seller notes, lot counts, quantities).
- Prefer generic tokens over very specific variants unless they are clearly dominant.
- Keep it 3–8 words; include quoted phrases only when essential (e.g., exact model string). No punctuation besides quotes.
- If there's only one title in the list and If title is describing the decade of a product include the decade in the query.
- If there's only one title in the list and If title includes words like "lot of", or "vintage" or "antique" or "old" or "new" include the decade in the query.
- Avoid price, condition, warranty, shipping, and subjective adjectives.
- Output JSON only: {"query":"...","notes":"why this captures common elements"}.`;

    const user = `Titles JSON array:\n${JSON.stringify(titles, null, 2)}\n\nProduce the JSON response now.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "server_missing_openai_key" }, { status: 500 });

    const resp = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" } as { type: "json_object" },
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: "openai_failed", detail: data }, { status: 502 });
    }
    const content = data.choices?.[0]?.message?.content;
    let parsed: { query?: string; notes?: string } | null = null;
    try {
      parsed = content ? JSON.parse(content) : null;
    } catch {
      parsed = null;
    }
    const query = parsed?.query || "";
    const notes = parsed?.notes || "";
    if (!query) return NextResponse.json({ error: "no_query_generated" }, { status: 500 });
    return NextResponse.json({ query, notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


