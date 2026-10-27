import type { Locale } from "@/components/i18n/LanguageContext";
import { formatCad } from "@/lib/money";
import type { LandingContent } from "./types";

/** "$100" for whole dollars, "$72.50" otherwise. */
export function wholeDollar(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : formatCad(cents);
}

export type VolumeCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string[];
  titleLead: string;
  titleSet: string;
  titleFill: string;
  bookSet: string;
  bookFill: string;
  locationLinkLabel: string;
  allServicesLabel: string;
  lashGuideLabel: string;
  pricingHeading: string;
  meansHeading: string;
  meansHeadingGeneric: string;
  suitsHeading: string;
  suitsBody: string;
  chooserNote: string;
  parkaLabel: string;
  fillRulesHeading: string;
  compareHeading: string;
  compareSentence: (min: string, max: string, date: string) => string;
  lowestLine: string;
  compareLinkLabel: string;
  postsHeading: string;
  faqHeading: string;
  depositLabel: string;
  depositCredited: string;
  costQ: string;
  costA: (lines: string) => string;
  lengthQ: string;
  lengthA: (lines: string) => string;
  fillQ: string;
  fillIntro: string;
  vsQ: string;
  vsA: (url: string) => string;
  prepQ: string;
  prepA: string;
  depositQ: string;
  depositA: (amount: string) => string;
  meta: (parts: { density: string; prices: string }) => string;
};

export const VOLUME_COPY: Record<Locale, VolumeCopy> = {
  en: {
    metaTitle: "Volume Lashes Edmonton",
    metaDescription:
      "Volume lash extensions in a private West Edmonton studio, one-on-one with Marinelle Trevino. Address shared at booking.",
    eyebrow: "Volume lashes · West Edmonton",
    h1: "Volume Lash Extensions in West Edmonton",
    intro: [
      "Volume lashes are a fuller set than classic one-to-one extensions: lightweight fans on your own lashes, mapped in a private one-on-one appointment.",
      "Mari Esthetics is a private studio in West Edmonton; address shared at booking. You book the volume set or the volume fill directly, and the price on this page is the live menu price.",
    ],
    titleLead: "Volume Lashes Edmonton",
    titleSet: "Volume Set",
    titleFill: "Fill",
    bookSet: "Book volume set",
    bookFill: "Book volume fill",
    locationLinkLabel: "Private studio in West Edmonton; address shared at booking",
    allServicesLabel: "Browse all services",
    lashGuideLabel: "Classic, hybrid and volume compared",
    pricingHeading: "Volume set and volume fill",
    meansHeading: "What 2D–5D means",
    meansHeadingGeneric: "What this volume set is",
    suitsHeading: "Volume, hybrid or classic",
    suitsBody:
      "Volume is the fuller option on our lash menu. Classic is one extension on each natural lash. Hybrid mixes the two. The right one is the look you want to wear day to day.",
    chooserNote: "Prices below are the live full-set prices from the booking menu.",
    parkaLabel: "Read the classic, hybrid and volume comparison",
    fillRulesHeading: "Volume fill timing",
    compareHeading: "How our price compares",
    compareSentence: (min, max, date) =>
      `Edmonton lash studios we checked list volume full sets from ${min} to ${max} (checked ${date}).`,
    lowestLine: "Mari Esthetics is one of the lowest-priced volume options in Edmonton.",
    compareLinkLabel: "See the lash extensions cost guide",
    postsHeading: "Volume lash guides",
    faqHeading: "Volume lash questions",
    depositLabel: "Deposit",
    depositCredited: "credited to your total",
    costQ: "How much are volume lashes in Edmonton?",
    costA: (lines) => `Volume lashes at Mari Esthetics: ${lines}.`,
    lengthQ: "How long is a volume lash appointment?",
    lengthA: (lines) => lines,
    fillQ: "When do I book a volume fill instead of a new set?",
    fillIntro: "From the Volume Fill menu:",
    vsQ: "How is volume different from hybrid?",
    vsA: (url) =>
      `Volume uses multi-dimensional fans for a fuller look. Hybrid mixes classic and volume lashes. Classic is one extension on each natural lash. A studio guide compares the three: ${url}`,
    prepQ: "How do I prepare for volume lashes?",
    prepA:
      "Arrive with clean lashes and no mascara or oil along the lash line. Keep the extensions dry for the first 24 hours, then cleanse with an oil-free lash cleanser. The studio address is shared at booking.",
    depositQ: "Is there a deposit for volume lashes?",
    depositA: (amount) => `Yes. ${amount} The deposit holds your appointment and is credited to your total.`,
    meta: ({ density, prices }) =>
      `${density} in West Edmonton. ${prices} One-on-one with Marinelle Trevino. Book online.`,
  },
  es: {
    metaTitle: "Pestañas de Volumen Edmonton",
    metaDescription:
      "Extensiones de pestañas de volumen en un estudio privado del oeste de Edmonton, atención individual con Marinelle Trevino. La dirección se comparte al reservar.",
    eyebrow: "Volumen · Oeste de Edmonton",
    h1: "Extensiones de Pestañas de Volumen en el Oeste de Edmonton",
    intro: [
      "Las pestañas de volumen son un set más lleno que las clásicas de una en una: abanicos ligeros sobre tus pestañas, en una cita individual y privada.",
      "Mari Esthetics es un estudio privado en el oeste de Edmonton; la dirección se comparte al reservar. Reservas el set de volumen o el relleno, y el precio de esta página es el del menú en vivo.",
    ],
    titleLead: "Pestañas de Volumen Edmonton",
    titleSet: "Set de volumen",
    titleFill: "Relleno",
    bookSet: "Reservar set de volumen",
    bookFill: "Reservar relleno de volumen",
    locationLinkLabel: "Estudio privado en el oeste de Edmonton; la dirección se comparte al reservar",
    allServicesLabel: "Ver todos los servicios",
    lashGuideLabel: "Clásicas, híbridas y volumen",
    pricingHeading: "Set de volumen y relleno",
    meansHeading: "Qué significa 2D–5D",
    meansHeadingGeneric: "Qué es este set de volumen",
    suitsHeading: "Volumen, híbridas o clásicas",
    suitsBody:
      "El volumen es la opción más llena del menú. Las clásicas son una extensión por pestaña natural. Las híbridas mezclan las dos. Elige el look que quieres llevar cada día.",
    chooserNote: "Los precios de abajo son los sets completos del menú de reservas.",
    parkaLabel: "Leer la comparación de clásicas, híbridas y volumen",
    fillRulesHeading: "Cuándo toca el relleno de volumen",
    compareHeading: "Cómo se compara nuestro precio",
    compareSentence: (min, max, date) =>
      `Los estudios de pestañas de Edmonton que revisamos listan sets de volumen desde ${min} hasta ${max} (revisado el ${date}).`,
    lowestLine: "Mari Esthetics es una de las opciones de volumen con precio más bajo en Edmonton.",
    compareLinkLabel: "Ver la guía de precios de extensiones",
    postsHeading: "Guías de pestañas de volumen",
    faqHeading: "Preguntas sobre volumen",
    depositLabel: "Depósito",
    depositCredited: "se descuenta del total",
    costQ: "¿Cuánto cuestan las pestañas de volumen en Edmonton?",
    costA: (lines) => `Pestañas de volumen en Mari Esthetics: ${lines}.`,
    lengthQ: "¿Cuánto dura una cita de volumen?",
    lengthA: (lines) => lines,
    fillQ: "¿Cuándo reservo un relleno y cuándo un set nuevo?",
    fillIntro: "Del menú de relleno de volumen:",
    vsQ: "¿En qué se diferencia el volumen de las híbridas?",
    vsA: (url) =>
      `El volumen usa abanicos para un look más lleno. Las híbridas mezclan clásicas y volumen. Las clásicas son una extensión por pestaña natural. Una guía del estudio compara las tres: ${url}`,
    prepQ: "¿Cómo me preparo para las pestañas de volumen?",
    prepA:
      "Llega con las pestañas limpias, sin rímel ni aceite. Mantenlas secas las primeras 24 horas y luego límpialas con un limpiador sin aceite. La dirección del estudio se comparte al reservar.",
    depositQ: "¿Hay depósito para las pestañas de volumen?",
    depositA: (amount) => `Sí. ${amount} El depósito reserva tu cita y se descuenta del total.`,
    meta: ({ density, prices }) =>
      `${density} en el oeste de Edmonton. ${prices} Atención individual con Marinelle Trevino. Reserva en línea.`,
  },
  tl: {
    metaTitle: "Volume Lashes Edmonton",
    metaDescription:
      "Volume lash extensions sa pribadong studio sa West Edmonton, one-on-one kasama si Marinelle Trevino. Ibinibigay ang address pag nag-book.",
    eyebrow: "Volume lashes · West Edmonton",
    h1: "Volume Lash Extensions sa West Edmonton",
    intro: [
      "Mas puno ang volume kaysa classic na isa-isa: magagaan na fans sa natural lashes mo, sa pribadong one-on-one na appointment.",
      "Pribadong studio ang Mari Esthetics sa West Edmonton; ibinibigay ang address pag nag-book. Diretso mong i-book ang volume set o volume fill, at ang presyo sa pahinang ito ay ang live na presyo sa menu.",
    ],
    titleLead: "Volume Lashes Edmonton",
    titleSet: "Volume Set",
    titleFill: "Fill",
    bookSet: "I-book ang volume set",
    bookFill: "I-book ang volume fill",
    locationLinkLabel: "Pribadong studio sa West Edmonton; ibinibigay ang address pag nag-book",
    allServicesLabel: "Lahat ng serbisyo",
    lashGuideLabel: "Classic, hybrid at volume",
    pricingHeading: "Volume set at volume fill",
    meansHeading: "Ano ang ibig sabihin ng 2D–5D",
    meansHeadingGeneric: "Ano ang volume set na ito",
    suitsHeading: "Volume, hybrid o classic",
    suitsBody:
      "Ang volume ang mas punong opsyon sa lash menu. Ang classic ay isang extension sa bawat natural lash. Hinahalo ng hybrid ang dalawa. Piliin ang look na gusto mong suotin araw-araw.",
    chooserNote: "Ang mga presyo sa ibaba ay live na full-set prices mula sa booking menu.",
    parkaLabel: "Basahin ang paghahambing ng classic, hybrid at volume",
    fillRulesHeading: "Kailan ang volume fill",
    compareHeading: "Paano ikukumpara ang presyo namin",
    compareSentence: (min, max, date) =>
      `Ang mga lash studio sa Edmonton na tiningnan namin ay naglista ng volume full set mula ${min} hanggang ${max} (tiningnan noong ${date}).`,
    lowestLine: "Ang Mari Esthetics ay isa sa mga pinakamababang presyo ng volume sa Edmonton.",
    compareLinkLabel: "Tingnan ang gabay sa presyo ng lash extensions",
    postsHeading: "Mga gabay sa volume lashes",
    faqHeading: "Mga tanong tungkol sa volume",
    depositLabel: "Deposit",
    depositCredited: "ibabawas sa kabuuan",
    costQ: "Magkano ang volume lashes sa Edmonton?",
    costA: (lines) => `Volume lashes sa Mari Esthetics: ${lines}.`,
    lengthQ: "Gaano katagal ang volume lash appointment?",
    lengthA: (lines) => lines,
    fillQ: "Kailan fill, at kailan bagong set?",
    fillIntro: "Mula sa Volume Fill menu:",
    vsQ: "Ano ang pinagkaiba ng volume at hybrid?",
    vsA: (url) =>
      `Ang volume ay multi-dimensional fans para mas puno. Hinahalo ng hybrid ang classic at volume. Ang classic ay isang extension sa bawat natural lash. May gabay ang studio na nagkukumpara sa tatlo: ${url}`,
    prepQ: "Paano maghanda para sa volume lashes?",
    prepA:
      "Dumating nang malinis ang lashes, walang mascara o oil. Panatilihing tuyo ang extensions sa unang 24 oras, tapos linisin gamit ang oil-free lash cleanser. Ibinibigay ang address ng studio pag nag-book.",
    depositQ: "May deposit ba para sa volume lashes?",
    depositA: (amount) => `Oo. ${amount} Hinahawakan ng deposit ang appointment at ibabawas ito sa kabuuan.`,
    meta: ({ density, prices }) =>
      `${density} sa West Edmonton. ${prices} One-on-one kasama si Marinelle Trevino. Mag-book online.`,
  },
  pa: {
    metaTitle: "ਐਡਮਿੰਟਨ ਵਾਲਿਊਮ ਲੈਸ਼",
    metaDescription:
      "ਵੈਸਟ ਐਡਮਿੰਟਨ ਦੇ ਨਿੱਜੀ ਸਟੂਡੀਓ ਵਿੱਚ ਵਾਲਿਊਮ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ, Marinelle Trevino ਨਾਲ ਇੱਕ-ਤੋਂ-ਇੱਕ। ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।",
    eyebrow: "ਵਾਲਿਊਮ ਲੈਸ਼ · ਵੈਸਟ ਐਡਮਿੰਟਨ",
    h1: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਵਾਲਿਊਮ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ",
    intro: [
      "ਵਾਲਿਊਮ ਲੈਸ਼ ਕਲਾਸਿਕ ਇੱਕ-ਤੋਂ-ਇੱਕ ਨਾਲੋਂ ਵਧੇਰੇ ਭਰੀ ਹੁੰਦੀ ਹੈ: ਤੁਹਾਡੀਆਂ ਆਪਣੀਆਂ ਲੈਸ਼ਾਂ ਉੱਤੇ ਹਲਕੇ ਫੈਨ, ਨਿੱਜੀ ਇੱਕ-ਤੋਂ-ਇੱਕ ਅਪਾਇੰਟਮੈਂਟ ਵਿੱਚ।",
      "Mari Esthetics ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਇੱਕ ਨਿੱਜੀ ਸਟੂਡੀਓ ਹੈ; ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ। ਵਾਲਿਊਮ ਸੈੱਟ ਜਾਂ ਵਾਲਿਊਮ ਫਿੱਲ ਸਿੱਧੀ ਬੁੱਕ ਕਰੋ। ਇਸ ਪੰਨੇ ਦੀ ਕੀਮਤ ਲਾਈਵ ਮੀਨੂ ਦੀ ਕੀਮਤ ਹੈ।",
    ],
    titleLead: "ਵਾਲਿਊਮ ਲੈਸ਼ ਐਡਮਿੰਟਨ",
    titleSet: "ਵਾਲਿਊਮ ਸੈੱਟ",
    titleFill: "ਫਿੱਲ",
    bookSet: "ਵਾਲਿਊਮ ਸੈੱਟ ਬੁੱਕ ਕਰੋ",
    bookFill: "ਵਾਲਿਊਮ ਫਿੱਲ ਬੁੱਕ ਕਰੋ",
    locationLinkLabel: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਨਿੱਜੀ ਸਟੂਡੀਓ; ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ",
    allServicesLabel: "ਸਾਰੀਆਂ ਸੇਵਾਵਾਂ",
    lashGuideLabel: "ਕਲਾਸਿਕ, ਹਾਈਬ੍ਰਿਡ ਅਤੇ ਵਾਲਿਊਮ",
    pricingHeading: "ਵਾਲਿਊਮ ਸੈੱਟ ਅਤੇ ਵਾਲਿਊਮ ਫਿੱਲ",
    meansHeading: "2D–5D ਦਾ ਕੀ ਮਤਲਬ ਹੈ",
    meansHeadingGeneric: "ਇਹ ਵਾਲਿਊਮ ਸੈੱਟ ਕੀ ਹੈ",
    suitsHeading: "ਵਾਲਿਊਮ, ਹਾਈਬ੍ਰਿਡ ਜਾਂ ਕਲਾਸਿਕ",
    suitsBody:
      "ਵਾਲਿਊਮ ਲੈਸ਼ ਮੀਨੂ ਉੱਤੇ ਵਧੇਰੇ ਭਰੀ ਚੋਣ ਹੈ। ਕਲਾਸਿਕ ਵਿੱਚ ਹਰ ਕੁਦਰਤੀ ਲੈਸ਼ ਉੱਤੇ ਇੱਕ ਐਕਸਟੈਂਸ਼ਨ ਹੁੰਦੀ ਹੈ। ਹਾਈਬ੍ਰਿਡ ਦੋਵੇਂ ਮਿਲਾਉਂਦੀ ਹੈ। ਉਹ ਲੁੱਕ ਚੁਣੋ ਜੋ ਤੁਸੀਂ ਰੋਜ਼ ਪਹਿਨਣਾ ਚਾਹੁੰਦੇ ਹੋ।",
    chooserNote: "ਹੇਠਾਂ ਦਿੱਤੀਆਂ ਕੀਮਤਾਂ ਬੁਕਿੰਗ ਮੀਨੂ ਦੇ ਲਾਈਵ ਫੁੱਲ ਸੈੱਟ ਹਨ।",
    parkaLabel: "ਕਲਾਸਿਕ, ਹਾਈਬ੍ਰਿਡ ਅਤੇ ਵਾਲਿਊਮ ਦੀ ਤੁਲਨਾ ਪੜ੍ਹੋ",
    fillRulesHeading: "ਵਾਲਿਊਮ ਫਿੱਲ ਕਦੋਂ",
    compareHeading: "ਸਾਡੀ ਕੀਮਤ ਦੀ ਤੁਲਨਾ",
    compareSentence: (min, max, date) =>
      `ਐਡਮਿੰਟਨ ਦੇ ਲੈਸ਼ ਸਟੂਡੀਓ ਜੋ ਅਸੀਂ ਵੇਖੇ, ਉਹ ਵਾਲਿਊਮ ਫੁੱਲ ਸੈੱਟ ${min} ਤੋਂ ${max} ਤੱਕ ਦੱਸਦੇ ਹਨ (${date} ਨੂੰ ਜਾਂਚਿਆ)।`,
    lowestLine: "Mari Esthetics ਐਡਮਿੰਟਨ ਵਿੱਚ ਵਾਲਿਊਮ ਦੀਆਂ ਘੱਟ ਕੀਮਤਾਂ ਵਿੱਚੋਂ ਇੱਕ ਹੈ।",
    compareLinkLabel: "ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਕੀਮਤ ਗਾਈਡ ਵੇਖੋ",
    postsHeading: "ਵਾਲਿਊਮ ਲੈਸ਼ ਗਾਈਡਾਂ",
    faqHeading: "ਵਾਲਿਊਮ ਲੈਸ਼ ਸਵਾਲ",
    depositLabel: "ਡਿਪਾਜ਼ਿਟ",
    depositCredited: "ਕੁੱਲ ਵਿੱਚੋਂ ਘਟਾਈ ਜਾਂਦੀ ਹੈ",
    costQ: "ਐਡਮਿੰਟਨ ਵਿੱਚ ਵਾਲਿਊਮ ਲੈਸ਼ ਦੀ ਕੀਮਤ ਕਿੰਨੀ ਹੈ?",
    costA: (lines) => `Mari Esthetics ਵਿੱਚ ਵਾਲਿਊਮ ਲੈਸ਼: ${lines}।`,
    lengthQ: "ਵਾਲਿਊਮ ਲੈਸ਼ ਅਪਾਇੰਟਮੈਂਟ ਕਿੰਨੀ ਦੇਰ ਦੀ ਹੁੰਦੀ ਹੈ?",
    lengthA: (lines) => lines,
    fillQ: "ਫਿੱਲ ਕਦੋਂ ਬੁੱਕ ਕਰਾਂ ਅਤੇ ਨਵਾਂ ਸੈੱਟ ਕਦੋਂ?",
    fillIntro: "ਵਾਲਿਊਮ ਫਿੱਲ ਮੀਨੂ ਤੋਂ:",
    vsQ: "ਵਾਲਿਊਮ ਹਾਈਬ੍ਰਿਡ ਤੋਂ ਕਿਵੇਂ ਵੱਖਰੀ ਹੈ?",
    vsA: (url) =>
      `ਵਾਲਿਊਮ ਵਿੱਚ ਵਧੇਰੇ ਭਰਪੂਰ ਲੁੱਕ ਲਈ ਫੈਨ ਹੁੰਦੇ ਹਨ। ਹਾਈਬ੍ਰਿਡ ਕਲਾਸਿਕ ਅਤੇ ਵਾਲਿਊਮ ਮਿਲਾਉਂਦੀ ਹੈ। ਕਲਾਸਿਕ ਵਿੱਚ ਹਰ ਕੁਦਰਤੀ ਲੈਸ਼ ਉੱਤੇ ਇੱਕ ਐਕਸਟੈਂਸ਼ਨ ਹੁੰਦੀ ਹੈ। ਸਟੂਡੀਓ ਗਾਈਡ ਤਿੰਨਾਂ ਦੀ ਤੁਲਨਾ ਕਰਦੀ ਹੈ: ${url}`,
    prepQ: "ਵਾਲਿਊਮ ਲੈਸ਼ ਲਈ ਕਿਵੇਂ ਤਿਆਰੀ ਕਰਾਂ?",
    prepA:
      "ਸਾਫ਼ ਲੈਸ਼ਾਂ ਨਾਲ ਆਓ, ਮਸਕਾਰਾ ਜਾਂ ਤੇਲ ਬਿਨਾਂ। ਪਹਿਲੇ 24 ਘੰਟੇ ਐਕਸਟੈਂਸ਼ਨ ਸੁੱਕੀਆਂ ਰੱਖੋ, ਫਿਰ ਤੇਲ-ਰਹਿਤ ਕਲੀਨਜ਼ਰ ਨਾਲ ਸਾਫ਼ ਕਰੋ। ਸਟੂਡੀਓ ਦਾ ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।",
    depositQ: "ਕੀ ਵਾਲਿਊਮ ਲੈਸ਼ ਲਈ ਡਿਪਾਜ਼ਿਟ ਹੈ?",
    depositA: (amount) => `ਹਾਂ। ${amount} ਡਿਪਾਜ਼ਿਟ ਅਪਾਇੰਟਮੈਂਟ ਰਿਜ਼ਰਵ ਕਰਦੀ ਹੈ ਅਤੇ ਕੁੱਲ ਵਿੱਚੋਂ ਘਟਾਈ ਜਾਂਦੀ ਹੈ।`,
    meta: ({ density, prices }) =>
      `${density} ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ। ${prices} Marinelle Trevino ਨਾਲ ਇੱਕ-ਤੋਂ-ਇੱਕ। ਆਨਲਾਈਨ ਬੁੱਕ ਕਰੋ।`,
  },
  ar: {
    metaTitle: "رموش فوليوم إدمونتون",
    metaDescription:
      "وصلات رموش فوليوم في استوديو خاص في غرب إدمونتون، جلسة فردية مع مارينيل تريفينو. يُشارك العنوان عند الحجز.",
    eyebrow: "رموش فوليوم · غرب إدمونتون",
    h1: "وصلات رموش الفوليوم في غرب إدمونتون",
    intro: [
      "رموش الفوليوم أكثف من الكلاسيك شعرة بشعرة: مراوح خفيفة على رموشك الطبيعية، في موعد فردي وخاص.",
      "Mari Esthetics استوديو خاص في غرب إدمونتون؛ يُشارك العنوان عند الحجز. تحجزين مجموعة الفوليوم أو التعبئة مباشرة، وسعر هذه الصفحة هو سعر القائمة المباشر.",
    ],
    titleLead: "رموش فوليوم إدمونتون",
    titleSet: "مجموعة فوليوم",
    titleFill: "تعبئة",
    bookSet: "احجزي مجموعة الفوليوم",
    bookFill: "احجزي تعبئة الفوليوم",
    locationLinkLabel: "استوديو خاص في غرب إدمونتون؛ يُشارك العنوان عند الحجز",
    allServicesLabel: "كل الخدمات",
    lashGuideLabel: "كلاسيك وهايبرد وفوليوم",
    pricingHeading: "مجموعة الفوليوم والتعبئة",
    meansHeading: "ماذا يعني 2D–5D",
    meansHeadingGeneric: "ما هي مجموعة الفوليوم هذه",
    suitsHeading: "فوليوم أم هايبرد أم كلاسيك",
    suitsBody:
      "الفوليوم هو الخيار الأكثف في قائمة الرموش. الكلاسيك رمش واحد على كل رمش طبيعي. الهايبرد يمزج الاثنين. اختاري الإطلالة التي تريدينها كل يوم.",
    chooserNote: "الأسعار أدناه هي أسعار المجموعات الكاملة من قائمة الحجز.",
    parkaLabel: "اقرئي مقارنة الكلاسيك والهايبرد والفوليوم",
    fillRulesHeading: "متى تكون تعبئة الفوليوم",
    compareHeading: "كيف يقارن سعرنا",
    compareSentence: (min, max, date) =>
      `استوديوهات الرموش في إدمونتون التي راجعناها تعرض مجموعات فوليوم كاملة من ${min} إلى ${max} (تاريخ المراجعة ${date}).`,
    lowestLine: "Mari Esthetics من بين الأقل سعراً لرموش الفوليوم في إدمونتون.",
    compareLinkLabel: "اطلعي على دليل أسعار وصلات الرموش",
    postsHeading: "أدلة رموش الفوليوم",
    faqHeading: "أسئلة عن رموش الفوليوم",
    depositLabel: "العربون",
    depositCredited: "يُخصم من المبلغ الإجمالي",
    costQ: "كم سعر رموش الفوليوم في إدمونتون؟",
    costA: (lines) => `رموش الفوليوم في Mari Esthetics: ${lines}.`,
    lengthQ: "كم تستغرق جلسة رموش الفوليوم؟",
    lengthA: (lines) => lines,
    fillQ: "متى أحجز تعبئة ومتى مجموعة جديدة؟",
    fillIntro: "من قائمة تعبئة الفوليوم:",
    vsQ: "ما الفرق بين الفوليوم والهايبرد؟",
    vsA: (url) =>
      `الفوليوم يستخدم مراوح لإطلالة أكثف. الهايبرد يمزج الكلاسيك والفوليوم. الكلاسيك رمش واحد على كل رمش طبيعي. دليل الاستوديو يقارن الثلاثة: ${url}`,
    prepQ: "كيف أستعد لرموش الفوليوم؟",
    prepA:
      "احضري برموش نظيفة من دون ماسكارا أو زيت. أبقي الوصلات جافة أول 24 ساعة ثم نظفيها بمنظف خالٍ من الزيت. يُشارك عنوان الاستوديو عند الحجز.",
    depositQ: "هل يوجد عربون لرموش الفوليوم؟",
    depositA: (amount) => `نعم. ${amount} العربون يحجز موعدك ويُخصم من المبلغ الإجمالي.`,
    meta: ({ density, prices }) =>
      `${density} في غرب إدمونتون. ${prices} جلسة فردية مع مارينيل تريفينو. احجزي عبر الإنترنت.`,
  },
};

/** Link shown on the combined lash page. */
export const LASH_PAGE_VOLUME_LINK: Record<Locale, string> = {
  en: "Want volume? See volume set and fill prices",
  es: "¿Quieres volumen? Ver precios del set y del relleno",
  tl: "Gusto mo ng volume? Tingnan ang presyo ng set at fill",
  pa: "ਵਾਲਿਊਮ ਚਾਹੀਦਾ ਹੈ? ਸੈੱਟ ਅਤੇ ਫਿੱਲ ਦੀਆਂ ਕੀਮਤਾਂ ਵੇਖੋ",
  ar: "تريدين فوليوم؟ شاهدي أسعار المجموعة والتعبئة",
};

export const VOLUME_CALLOUT: Record<Locale, { both: (set: string, fill: string) => string; setOnly: (set: string) => string; fillOnly: (fill: string) => string }> = {
  en: {
    both: (set, fill) => `Volume lash set ${set} · fill ${fill} — one-on-one in West Edmonton`,
    setOnly: (set) => `Volume lash set ${set} — one-on-one in West Edmonton`,
    fillOnly: (fill) => `Volume lash fill ${fill} — one-on-one in West Edmonton`,
  },
  es: {
    both: (set, fill) => `Set de volumen ${set} · relleno ${fill} — atención individual en el oeste de Edmonton`,
    setOnly: (set) => `Set de volumen ${set} — atención individual en el oeste de Edmonton`,
    fillOnly: (fill) => `Relleno de volumen ${fill} — atención individual en el oeste de Edmonton`,
  },
  tl: {
    both: (set, fill) => `Volume lash set ${set} · fill ${fill} — one-on-one sa West Edmonton`,
    setOnly: (set) => `Volume lash set ${set} — one-on-one sa West Edmonton`,
    fillOnly: (fill) => `Volume lash fill ${fill} — one-on-one sa West Edmonton`,
  },
  pa: {
    both: (set, fill) => `ਵਾਲਿਊਮ ਲੈਸ਼ ਸੈੱਟ ${set} · ਫਿੱਲ ${fill} — ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਇੱਕ-ਤੋਂ-ਇੱਕ`,
    setOnly: (set) => `ਵਾਲਿਊਮ ਲੈਸ਼ ਸੈੱਟ ${set} — ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਇੱਕ-ਤੋਂ-ਇੱਕ`,
    fillOnly: (fill) => `ਵਾਲਿਊਮ ਲੈਸ਼ ਫਿੱਲ ${fill} — ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਇੱਕ-ਤੋਂ-ਇੱਕ`,
  },
  ar: {
    both: (set, fill) => `مجموعة فوليوم ${set} · تعبئة ${fill} — جلسة فردية في غرب إدمونتون`,
    setOnly: (set) => `مجموعة فوليوم ${set} — جلسة فردية في غرب إدمونتون`,
    fillOnly: (fill) => `تعبئة فوليوم ${fill} — جلسة فردية في غرب إدمونتون`,
  },
};

export function volumeCalloutText(locale: Locale, setCents?: number, fillCents?: number, price: (cents: number) => string = wholeDollar): string | null {
  const c = VOLUME_CALLOUT[locale] || VOLUME_CALLOUT.en;
  const set = setCents && setCents > 0 ? price(setCents) : "";
  const fill = fillCents && fillCents > 0 ? price(fillCents) : "";
  if (set && fill) return c.both(set, fill);
  if (set) return c.setOnly(set);
  if (fill) return c.fillOnly(fill);
  return null;
}

function asLanding(c: VolumeCopy): LandingContent {
  return {
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    eyebrow: c.eyebrow,
    h1: c.h1,
    intro: c.intro,
    whatToExpect: [c.suitsBody],
    aftercare: [c.prepA],
    faqs: [],
    pricingHeading: c.pricingHeading,
    relatedBlogHeading: c.postsHeading,
    locationLinkLabel: c.locationLinkLabel,
    bookCta: c.bookSet,
    allServicesLabel: c.allServicesLabel,
  };
}

export const volumeLandingContent: Record<Locale, LandingContent> = {
  en: asLanding(VOLUME_COPY.en),
  es: asLanding(VOLUME_COPY.es),
  tl: asLanding(VOLUME_COPY.tl),
  pa: asLanding(VOLUME_COPY.pa),
  ar: asLanding(VOLUME_COPY.ar),
};
