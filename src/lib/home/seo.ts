import type { Locale } from "@/components/i18n/LanguageContext";
import { formatCad } from "@/lib/money";

/** Localized homepage <title> (brand suffix is added once by the root layout template). */
export const HOME_TITLE: Record<Locale, string> = {
  en: "Facials, Lashes & Brows in West Edmonton",
  es: "Faciales, Pestañas y Cejas en el Oeste de Edmonton",
  tl: "Facials, Lashes at Brows sa West Edmonton",
  pa: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਫੇਸ਼ੀਅਲ, ਲੈਸ਼ ਅਤੇ ਬ੍ਰੋਜ਼",
  ar: "فيشيال ورموش وحواجب في غرب إدمونتون",
};

export const HOME_DESCRIPTION: Record<Locale, string> = {
  en: "Private esthetics studio in West Edmonton (Glastonbury / The Hamptons): facials, lash extensions, powder brows and lip blush. Book online with a small deposit.",
  es: "Estudio de estética privado en el oeste de Edmonton (Glastonbury / The Hamptons): faciales, extensiones de pestañas, cejas powder y lip blush. Reserva en línea con un pequeño depósito.",
  tl: "Pribadong esthetics studio sa West Edmonton (Glastonbury / The Hamptons): facials, lash extensions, powder brows at lip blush. Mag-book online na may maliit na deposit.",
  pa: "ਵੈਸਟ ਐਡਮਿੰਟਨ (Glastonbury / The Hamptons) ਵਿੱਚ ਨਿੱਜੀ ਐਸਥੈਟਿਕਸ ਸਟੂਡੀਓ: ਫੇਸ਼ੀਅਲ, ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ, ਪਾਊਡਰ ਬ੍ਰੋਜ਼ ਅਤੇ ਲਿਪ ਬਲੱਸ਼। ਛੋਟੀ ਡਿਪਾਜ਼ਿਟ ਨਾਲ ਆਨਲਾਈਨ ਬੁੱਕ ਕਰੋ।",
  ar: "استوديو تجميل خاص في غرب إدمونتون (Glastonbury / The Hamptons): فيشيال، وصلات رموش، حواجب بودرة وتوريد شفاه. احجزي عبر الإنترنت بعربون بسيط.",
};

export const HOME_LINKS_COPY: Record<Locale, { eyebrow: string; title: string; posts: string; inArea: (x: string) => string }> = {
  en: { eyebrow: "Treatment guides", title: "Explore treatments in West Edmonton", posts: "Latest skin & lash articles", inArea: (x) => `${x} in West Edmonton` },
  es: { eyebrow: "Guías de tratamientos", title: "Tratamientos en el oeste de Edmonton", posts: "Artículos recientes de piel y pestañas", inArea: (x) => `${x} en el oeste de Edmonton` },
  tl: { eyebrow: "Mga gabay sa treatment", title: "Mga treatment sa West Edmonton", posts: "Pinakabagong artikulo sa skin at lashes", inArea: (x) => `${x} sa West Edmonton` },
  pa: { eyebrow: "ਟ੍ਰੀਟਮੈਂਟ ਗਾਈਡ", title: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਟ੍ਰੀਟਮੈਂਟ", posts: "ਸਕਿਨ ਅਤੇ ਲੈਸ਼ ਬਾਰੇ ਨਵੇਂ ਲੇਖ", inArea: (x) => `ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ${x}` },
  ar: { eyebrow: "أدلة العلاجات", title: "علاجات في غرب إدمونتون", posts: "أحدث المقالات عن البشرة والرموش", inArea: (x) => `${x} في غرب إدمونتون` },
};

export const HOME_FAQ_HEADING: Record<Locale, { eyebrow: string; title: string }> = {
  en: { eyebrow: "Questions", title: "Good to know." },
  es: { eyebrow: "Preguntas", title: "Bueno saberlo." },
  tl: { eyebrow: "Mga tanong", title: "Mabuting malaman." },
  pa: { eyebrow: "ਸਵਾਲ", title: "ਜਾਣਨ ਯੋਗ ਗੱਲਾਂ।" },
  ar: { eyebrow: "أسئلة", title: "معلومات مفيدة." },
};

export type HomeFaqItem = { q: string; a: string };

/** Starting prices (cents) from the live Service collection; undefined = not offered/unknown. */
export type HomePrices = {
  lashes?: number;
  facials?: number;
  powderBrows?: number;
  lipBlush?: number;
};

type PriceQ = { q: string; a: (p: string) => string };

const COPY: Record<Locale, {
  lashes: PriceQ; facials: PriceQ; powderBrows: PriceQ; lipBlush: PriceQ;
  location: HomeFaqItem; deposit: HomeFaqItem;
}> = {
  en: {
    lashes: { q: "How much are lash extensions in West Edmonton?", a: (p) => `Lash extension sets at Mari Esthetics start at ${p}. A small deposit holds your appointment and is credited toward the total.` },
    facials: { q: "How much is a facial in West Edmonton?", a: (p) => `Facials start at ${p}, from a basic facial to hydra and anti-aging treatments, each tailored to your skin.` },
    powderBrows: { q: "How much do powder brows cost in Edmonton?", a: (p) => `Soft powder brows start at ${p}, done one-on-one in a private West Edmonton studio.` },
    lipBlush: { q: "How much is lip blush in Edmonton?", a: (p) => `Lip blush starts at ${p}. Your shade is chosen together with Mari during the consultation.` },
    location: { q: "Where is Mari Esthetics located?", a: "Mari Esthetics is a private home studio in West Edmonton (Glastonbury / The Hamptons, T5T), close to Lewis Estates, Granville and Callingwood. The exact address is shared once your appointment is confirmed." },
    deposit: { q: "How do deposits work?", a: "A deposit secures your appointment and is credited 100% toward your treatment. Pay by card for instant confirmation or by Interac e-Transfer. Deposits are non-refundable for no-shows." },
  },
  es: {
    lashes: { q: "¿Cuánto cuestan las extensiones de pestañas en el oeste de Edmonton?", a: (p) => `Los sets de extensiones de pestañas en Mari Esthetics empiezan en ${p}. Un pequeño depósito reserva tu cita y se descuenta del total.` },
    facials: { q: "¿Cuánto cuesta un facial en el oeste de Edmonton?", a: (p) => `Los faciales empiezan en ${p}, desde un facial básico hasta tratamientos hydra y antiedad, adaptados a tu piel.` },
    powderBrows: { q: "¿Cuánto cuestan las cejas powder en Edmonton?", a: (p) => `Las cejas powder cuestan ${p}, en atención individual en un estudio privado del oeste de Edmonton.` },
    lipBlush: { q: "¿Cuánto cuesta el lip blush en Edmonton?", a: (p) => `El lip blush cuesta ${p}. El tono se elige junto con Mari durante la consulta.` },
    location: { q: "¿Dónde está Mari Esthetics?", a: "Mari Esthetics es un estudio privado en casa en el oeste de Edmonton (Glastonbury / The Hamptons, T5T), cerca de Lewis Estates, Granville y Callingwood. La dirección exacta se comparte al confirmar tu cita." },
    deposit: { q: "¿Cómo funcionan los depósitos?", a: "El depósito asegura tu cita y se acredita al 100% en tu tratamiento. Paga con tarjeta para confirmación inmediata o por Interac e-Transfer. No es reembolsable si no te presentas." },
  },
  tl: {
    lashes: { q: "Magkano ang lash extensions sa West Edmonton?", a: (p) => `Ang lash extension sets sa Mari Esthetics ay nagsisimula sa ${p}. Maliit na deposit ang magre-reserve ng appointment mo at ibabawas ito sa kabuuan.` },
    facials: { q: "Magkano ang facial sa West Edmonton?", a: (p) => `Ang facials ay nagsisimula sa ${p}, mula basic facial hanggang hydra at anti-aging, ayon sa pangangailangan ng balat mo.` },
    powderBrows: { q: "Magkano ang powder brows sa Edmonton?", a: (p) => `Ang soft powder brows ay ${p}, one-on-one sa pribadong studio sa West Edmonton.` },
    lipBlush: { q: "Magkano ang lip blush sa Edmonton?", a: (p) => `Ang lip blush ay ${p}. Pipiliin ninyo ni Mari ang kulay sa konsultasyon.` },
    location: { q: "Saan matatagpuan ang Mari Esthetics?", a: "Ang Mari Esthetics ay pribadong home studio sa West Edmonton (Glastonbury / The Hamptons, T5T), malapit sa Lewis Estates, Granville at Callingwood. Ibibigay ang eksaktong address kapag kumpirmado na ang appointment mo." },
    deposit: { q: "Paano gumagana ang deposit?", a: "Sinisiguro ng deposit ang appointment mo at buong ibabawas ito sa treatment. Magbayad gamit ang card para sa agarang kumpirmasyon o sa Interac e-Transfer. Hindi ito refundable kung hindi ka sumipot." },
  },
  pa: {
    lashes: { q: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?", a: (p) => `Mari Esthetics ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਸੈੱਟ ${p} ਤੋਂ ਸ਼ੁਰੂ ਹੁੰਦੇ ਹਨ। ਛੋਟੀ ਡਿਪਾਜ਼ਿਟ ਤੁਹਾਡੀ ਅਪਾਇੰਟਮੈਂਟ ਰਿਜ਼ਰਵ ਕਰਦੀ ਹੈ ਅਤੇ ਕੁੱਲ ਵਿੱਚੋਂ ਘਟਾਈ ਜਾਂਦੀ ਹੈ।` },
    facials: { q: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਫੇਸ਼ੀਅਲ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?", a: (p) => `ਫੇਸ਼ੀਅਲ ${p} ਤੋਂ ਸ਼ੁਰੂ ਹੁੰਦੇ ਹਨ, ਬੇਸਿਕ ਫੇਸ਼ੀਅਲ ਤੋਂ ਹਾਈਡ੍ਰਾ ਅਤੇ ਐਂਟੀ-ਏਜਿੰਗ ਤੱਕ, ਤੁਹਾਡੀ ਸਕਿਨ ਅਨੁਸਾਰ।` },
    powderBrows: { q: "ਐਡਮਿੰਟਨ ਵਿੱਚ ਪਾਊਡਰ ਬ੍ਰੋਜ਼ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?", a: (p) => `ਸਾਫ਼ਟ ਪਾਊਡਰ ਬ੍ਰੋਜ਼ ਦੀ ਕੀਮਤ ${p} ਹੈ, ਵੈਸਟ ਐਡਮਿੰਟਨ ਦੇ ਨਿੱਜੀ ਸਟੂਡੀਓ ਵਿੱਚ ਇੱਕ-ਤੋਂ-ਇੱਕ।` },
    lipBlush: { q: "ਐਡਮਿੰਟਨ ਵਿੱਚ ਲਿਪ ਬਲੱਸ਼ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?", a: (p) => `ਲਿਪ ਬਲੱਸ਼ ਦੀ ਕੀਮਤ ${p} ਹੈ। ਰੰਗ ਸਲਾਹ-ਮਸ਼ਵਰੇ ਦੌਰਾਨ Mari ਨਾਲ ਮਿਲ ਕੇ ਚੁਣਿਆ ਜਾਂਦਾ ਹੈ।` },
    location: { q: "Mari Esthetics ਕਿੱਥੇ ਸਥਿਤ ਹੈ?", a: "Mari Esthetics ਵੈਸਟ ਐਡਮਿੰਟਨ (Glastonbury / The Hamptons, T5T) ਵਿੱਚ ਇੱਕ ਨਿੱਜੀ ਘਰੇਲੂ ਸਟੂਡੀਓ ਹੈ, Lewis Estates, Granville ਅਤੇ Callingwood ਦੇ ਨੇੜੇ। ਪੂਰਾ ਪਤਾ ਅਪਾਇੰਟਮੈਂਟ ਪੱਕੀ ਹੋਣ ਤੋਂ ਬਾਅਦ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।" },
    deposit: { q: "ਡਿਪਾਜ਼ਿਟ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ?", a: "ਡਿਪਾਜ਼ਿਟ ਤੁਹਾਡੀ ਅਪਾਇੰਟਮੈਂਟ ਪੱਕੀ ਕਰਦੀ ਹੈ ਅਤੇ ਪੂਰੀ ਤਰ੍ਹਾਂ ਟ੍ਰੀਟਮੈਂਟ ਵਿੱਚ ਗਿਣੀ ਜਾਂਦੀ ਹੈ। ਤੁਰੰਤ ਪੁਸ਼ਟੀ ਲਈ ਕਾਰਡ ਨਾਲ ਜਾਂ Interac e-Transfer ਨਾਲ ਭੁਗਤਾਨ ਕਰੋ। ਨਾ ਆਉਣ ਦੀ ਸੂਰਤ ਵਿੱਚ ਡਿਪਾਜ਼ਿਟ ਵਾਪਸ ਨਹੀਂ ਹੁੰਦੀ।" },
  },
  ar: {
    lashes: { q: "كم سعر وصلات الرموش في غرب إدمونتون؟", a: (p) => `تبدأ أسعار وصلات الرموش في Mari Esthetics من ${p}. عربون بسيط يحجز موعدك ويُخصم من المبلغ الإجمالي.` },
    facials: { q: "كم سعر الفيشيال في غرب إدمونتون؟", a: (p) => `تبدأ جلسات الفيشيال من ${p}، من الفيشيال الأساسي إلى الهيدرا ومكافحة الشيخوخة، وكلها مصممة لبشرتك.` },
    powderBrows: { q: "كم سعر حواجب البودرة في إدمونتون؟", a: (p) => `سعر حواجب البودرة الناعمة ${p}، في جلسة فردية داخل استوديو خاص في غرب إدمونتون.` },
    lipBlush: { q: "كم سعر توريد الشفاه في إدمونتون؟", a: (p) => `سعر توريد الشفاه ${p}. يتم اختيار اللون مع ماري أثناء الاستشارة.` },
    location: { q: "أين يقع Mari Esthetics؟", a: "Mari Esthetics استوديو منزلي خاص في غرب إدمونتون (Glastonbury / The Hamptons، T5T) بالقرب من Lewis Estates وGranville وCallingwood. يتم مشاركة العنوان الدقيق بعد تأكيد موعدك." },
    deposit: { q: "كيف يعمل العربون؟", a: "يضمن العربون موعدك ويُحتسب بالكامل من قيمة العلاج. ادفعي بالبطاقة لتأكيد فوري أو عبر Interac e-Transfer. العربون غير قابل للاسترداد في حال عدم الحضور." },
  },
};

/** Builds the homepage FAQ; price questions only appear when a real DB price exists. */
export function buildHomeFaq(locale: Locale, prices: HomePrices): HomeFaqItem[] {
  const c = COPY[locale] || COPY.en;
  const items: HomeFaqItem[] = [];
  const add = (key: keyof HomePrices) => {
    const cents = prices[key];
    if (typeof cents === "number" && cents > 0) {
      items.push({ q: c[key].q, a: c[key].a(formatCad(cents)) });
    }
  };
  add("lashes");
  add("facials");
  add("powderBrows");
  add("lipBlush");
  items.push(c.location, c.deposit);
  return items;
}
