import type { Locale } from "@/components/i18n/LanguageContext";

/** Localized UI strings for the post page upgrades. */
export const POST_COPY: Record<Locale, {
  shortAnswer: string; toc: string; minRead: (n: number) => string; related: string; by: string;
  alt: (service: string, title: string) => string; blog: string; home: string;
}> = {
  en: { shortAnswer: "The short answer", toc: "In this article", minRead: (n) => `${n} min read`, related: "More on this treatment", by: "By", alt: (s, t) => `${s} in West Edmonton – ${t}`, blog: "Blog", home: "Home" },
  es: { shortAnswer: "La respuesta corta", toc: "En este artículo", minRead: (n) => `${n} min de lectura`, related: "Más sobre este tratamiento", by: "Por", alt: (s, t) => `${s} en el oeste de Edmonton – ${t}`, blog: "Blog", home: "Inicio" },
  tl: { shortAnswer: "Ang maikling sagot", toc: "Sa artikulong ito", minRead: (n) => `${n} minutong basa`, related: "Higit pa sa treatment na ito", by: "Ni", alt: (s, t) => `${s} sa West Edmonton – ${t}`, blog: "Blog", home: "Home" },
  pa: { shortAnswer: "ਛੋਟਾ ਜਵਾਬ", toc: "ਇਸ ਲੇਖ ਵਿੱਚ", minRead: (n) => `${n} ਮਿੰਟ ਪੜ੍ਹਨ ਦਾ ਸਮਾਂ`, related: "ਇਸ ਟ੍ਰੀਟਮੈਂਟ ਬਾਰੇ ਹੋਰ", by: "ਲੇਖਕ", alt: (s, t) => `ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ${s} – ${t}`, blog: "ਬਲੌਗ", home: "ਮੁੱਖ ਪੰਨਾ" },
  ar: { shortAnswer: "الإجابة المختصرة", toc: "في هذا المقال", minRead: (n) => `${n} دقائق قراءة`, related: "المزيد عن هذا العلاج", by: "بقلم", alt: (s, t) => `${s} في غرب إدمونتون – ${t}`, blog: "المدونة", home: "الرئيسية" },
};

const QUICK_ANSWERS = /^(quick answers|faq|frequently asked questions|respuestas r[aá]pidas|preguntas frecuentes|mabilis na sagot|mga madalas itanong|ਛੋਟੇ ਜਵਾਬ|ਆਮ ਸਵਾਲ|إجابات سريعة|الأسئلة الشائعة)$/i;

const stripTags = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;|&rsquo;|’/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Legacy plain/markdown-ish bodies -> HTML, matching the old renderer's output. */
function plainToHtml(content: string): string {
  return content
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      if (b.startsWith("### ")) return `<h3 class="blog-h3">${escapeHtml(b.slice(4))}</h3>`;
      if (b.startsWith("## ")) return `<h2 class="blog-h2">${escapeHtml(b.slice(3))}</h2>`;
      return `<p class="blog-p">${b.split("\n").map(escapeHtml).join("<br />")}</p>`;
    })
    .join("\n");
}

export function anchorId(text: string, used: Set<string>): string {
  const base =
    text.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{M}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
  let id = base;
  for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
  used.add(id);
  return id;
}

export type EnhancedPost = {
  html: string;
  toc: Array<{ id: string; text: string }>;
  faqs: Array<{ q: string; a: string }>;
  firstParagraph: string;
  readMinutes: number;
  inlineImages: Array<{ url: string; alt: string }>;
};

/**
 * Server-side post processing: H2 anchors + TOC, alt fallback on <img>, Quick-answers FAQ
 * extraction, first paragraph (short-answer fallback), and reading time.
 */
export function enhancePostHtml(content: string, altFallback: string): EnhancedPost {
  let html = /<[a-z][\s\S]*>/i.test(content) ? content : plainToHtml(content);
  const used = new Set<string>();
  const toc: EnhancedPost["toc"] = [];

  html = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs: string, inner: string) => {
    const text = stripTags(inner);
    const existing = attrs.match(/\sid="([^"]+)"/);
    const id = existing ? existing[1] : anchorId(text, used);
    toc.push({ id, text });
    return existing ? m : `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  const inlineImages: EnhancedPost["inlineImages"] = [];
  html = html.replace(/<img\b([^>]*?)\/?>/gi, (_m, attrs: string) => {
    const src = attrs.match(/\ssrc="([^"]+)"/)?.[1] || "";
    const altMatch = attrs.match(/\salt="([^"]*)"/);
    let alt = altMatch?.[1]?.trim() || "";
    if (!alt) {
      alt = escapeHtml(altFallback);
      attrs = altMatch ? attrs.replace(altMatch[0], ` alt="${alt}"`) : `${attrs} alt="${alt}"`;
    }
    if (src) inlineImages.push({ url: src, alt: stripTags(alt) });
    return `<img${attrs} loading="lazy" />`;
  });

  // Quick answers: <p><strong>Q</strong> A</p> blocks after a matching H2, until the next H2.
  const faqs: EnhancedPost["faqs"] = [];
  const h2re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const heads = [...html.matchAll(h2re)];
  heads.forEach((h, i) => {
    if (!QUICK_ANSWERS.test(stripTags(h[1]))) return;
    const start = h.index! + h[0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index! : html.length;
    for (const p of html.slice(start, end).matchAll(/<p[^>]*>\s*<(strong|b)>([\s\S]*?)<\/\1>([\s\S]*?)<\/p>/gi)) {
      const q = stripTags(p[2]);
      const a = stripTags(p[3]);
      if (q && a) faqs.push({ q, a });
    }
  });

  const firstP = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const text = stripTags(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  return {
    html,
    toc,
    faqs,
    firstParagraph: firstP ? stripTags(firstP[1]) : "",
    readMinutes: Math.max(1, Math.round(words / 200)),
    inlineImages,
  };
}
