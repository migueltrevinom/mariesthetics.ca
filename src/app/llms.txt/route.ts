import { buildLlmsTxt } from "@/lib/llms/content";

export const revalidate = 300;

export async function GET() {
  const body = await buildLlmsTxt(false);
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
