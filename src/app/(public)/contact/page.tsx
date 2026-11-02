import type { Metadata } from "next";
import { buildMetadata, hreflangForSinglePath } from "@/lib/seo";
import { contactPageSeo } from "@/lib/seo/staticPages";
import ContactPage from "./ContactClient";

export const metadata: Metadata = buildMetadata({
  title: contactPageSeo.title,
  description: contactPageSeo.description,
  path: contactPageSeo.path,
  keywords: contactPageSeo.keywords,
  hreflangAlternates: hreflangForSinglePath(contactPageSeo.path),
});

export default function Page() {
  return <ContactPage />;
}
