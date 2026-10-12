import { buildLlmsTxt } from "@/lib/llms/content";

/** Must read Mongo at request time — build has no DB (ISR cached empty list). */
export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  try {
    const body = await buildLlmsTxt(false);
    return new Response(body, { headers: CACHE_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[llms.txt]", message);
    return new Response(
      "# Mari Esthetics\n\nBlog index temporarily unavailable. Try again shortly.\n",
      { status: 503, headers: CACHE_HEADERS }
    );
  }
}
