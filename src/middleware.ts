import { NextResponse, type NextRequest } from "next/server";
import { verifyStudioChargeToken } from "@/lib/payments/studioChargeToken";

// Pay screen: without a valid pay-link JWT, answer 401 with no charge data.
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== "/pay") {
    // Lets the root layout set <html lang/dir> from the page's content language.
    const headers = new Headers(req.headers);
    headers.set("x-pathname", req.nextUrl.pathname);
    return NextResponse.next({ request: { headers } });
  }
  const chargeId = await verifyStudioChargeToken(req.nextUrl.searchParams.get("t"));
  if (!chargeId) {
    return new NextResponse(
      '<!DOCTYPE html><html><head><meta name="robots" content="noindex"><title>Link expired | Mari Esthetics</title></head><body style="font-family:sans-serif;text-align:center;padding:64px">This payment link is invalid or has expired. Please ask Mari Esthetics for a new link.</body></html>',
      { status: 401, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|opengraph-image|twitter-image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|webmanifest)$).*)"],
};
