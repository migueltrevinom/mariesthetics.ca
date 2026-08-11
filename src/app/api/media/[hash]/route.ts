import { NextResponse } from "next/server";

const GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    // Validate IPFS hash format (Qm... or bafy...)
    const cleanHash = hash.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{55,})/)?.[0];
    if (!cleanHash) {
      return NextResponse.json({ error: "Invalid IPFS hash" }, { status: 400 });
    }

    // Try multi-gateway fallback with 4-second timeout per gateway
    let response: Response | null = null;
    for (const gateway of GATEWAYS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${gateway}${cleanHash}`, {
          signal: controller.signal,
          headers: {
            Accept: "image/*",
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          response = res;
          break;
        }
      } catch {
        // Continue to next gateway if timeout or connection failure
        continue;
      }
    }

    if (!response || !response.ok) {
      // Fallback redirect to primary Pinata gateway if all proxy attempts fail
      return NextResponse.redirect(`https://gateway.pinata.cloud/ipfs/${cleanHash}`, { status: 302 });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Immutable 1-Year Cache for Browser & CDN
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    console.error("[IPFS Cache Proxy Error]:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
