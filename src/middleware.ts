import { NextResponse, type NextRequest } from "next/server";
import { verifyStudioChargeToken } from "@/lib/payments/studioChargeToken";

// Only runs for the pay screen: without a valid pay-link JWT, answer 401 with no charge data.
export async function middleware(req: NextRequest) {
  const chargeId = await verifyStudioChargeToken(req.nextUrl.searchParams.get("t"));
  if (!chargeId) {
    return new NextResponse(
      '<!DOCTYPE html><html><head><meta name="robots" content="noindex"><title>Link expired | Mari Esthetics</title></head><body style="font-family:sans-serif;text-align:center;padding:64px">This payment link is invalid or has expired. Please ask Mari Esthetics for a new link.</body></html>',
      { status: 401, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: ["/pay"] };
