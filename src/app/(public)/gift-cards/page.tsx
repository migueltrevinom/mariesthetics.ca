import type { Metadata } from "next";
import { buildMetadata, hreflangForSinglePath } from "@/lib/seo";
import { giftCardsPageSeo } from "@/lib/seo/staticPages";
import GiftCardsPage from "./GiftCardsClient";

export const metadata: Metadata = buildMetadata({
  title: giftCardsPageSeo.title,
  description: giftCardsPageSeo.description,
  path: giftCardsPageSeo.path,
  keywords: giftCardsPageSeo.keywords,
  hreflangAlternates: hreflangForSinglePath(giftCardsPageSeo.path),
});

export default function Page() {
  return <GiftCardsPage />;
}
