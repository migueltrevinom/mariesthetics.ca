import type { Locale } from "@/components/i18n/LanguageContext";
import type { LandingContent } from "./types";

/**
 * Geo landing for "lash extensions West Edmonton" / "lashes West Edmonton".
 * Prices are never written here — the page renders the live hybrid and volume menu.
 * Say "one of the lowest-priced". Do not use a superlative that claims we are the lowest.
 */
export const WEST_LASH_PRICE_LEAD: Record<Locale, string> = {
  en: "Lash Extensions West Edmonton",
  es: "Extensiones de Pestañas Oeste de Edmonton",
  tl: "Lash Extensions West Edmonton",
  pa: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ",
  ar: "وصلات الرموش غرب إدمونتون",
};

/** Link from this page back to the full lash menu (classic included). */
export const ALL_LASH_GUIDE_LABEL: Record<Locale, string> = {
  en: "Classic, hybrid and volume lashes",
  es: "Clásicas, híbridas y volumen",
  tl: "Classic, hybrid at volume lashes",
  pa: "ਕਲਾਸਿਕ, ਹਾਈਬ੍ਰਿਡ ਅਤੇ ਵਾਲਿਊਮ ਲੈਸ਼",
  ar: "رموش كلاسيك وهايبرد وفوليوم",
};

export const westLashLandingContent: Record<Locale, LandingContent> = {
  en: {
    metaTitle: "Lash Extensions West Edmonton",
    metaDescription:
      "Affordable volume and hybrid lash extensions in a private one-on-one West Edmonton studio. One of the lowest-priced. Address shared at booking.",
    eyebrow: "Lashes · West Edmonton",
    h1: "Lash Extensions West Edmonton",
    intro: [
      "Lashes in West Edmonton for Lewis Estates, Callingwood, Glastonbury, and The Hamptons: volume and hybrid sets in a private studio, one client at a time.",
      "Mari Esthetics is that studio. Marinelle Trevino does every lash appointment herself. The address is shared at booking, not published on this page.",
      "For volume and hybrid lashes, Mari Esthetics is one of the lowest-priced private studios on the west end — a short drive from West Edmonton Mall and Anthony Henday Drive. The menu below is the live booking price.",
    ],
    whatToExpect: [
      "A private one-on-one appointment for volume or hybrid lashes, mapped to your eye shape",
      "A gentle cleanse of the lash line before application",
      "Lightweight fans or a classic-volume mix on your own lashes",
      "A comfort check and aftercare before you leave",
      "Full sets run about {setDuration}; fills about {fillDuration}",
    ],
    aftercare: [
      "Keep lashes dry for the first day; avoid steam, saunas, and heavy sweating",
      "Cleanse daily with an oil-free lash cleanser",
      "Brush gently with a clean spoolie; avoid rubbing your eyes or sleeping face-down",
      "Skip oil-based makeup removers along the lash line",
      "Book fills on a 2–3 week rhythm, while enough of the set remains",
    ],
    faqs: [
      {
        q: "Do you offer lash extensions in West Edmonton?",
        a: "Yes. Volume and hybrid lashes are applied one-on-one in a private studio for Lewis Estates, Callingwood, Glastonbury, and The Hamptons. The address is shared at booking.",
      },
      {
        q: "Are you near West Edmonton Mall and the Henday?",
        a: "Yes. The studio is a short drive from West Edmonton Mall and Anthony Henday Drive, which suits Glastonbury, The Hamptons, Lewis Estates, and Callingwood.",
      },
      {
        q: "Are these one of the lowest-priced lashes in West Edmonton?",
        a: "Mari Esthetics is one of the lowest-priced private studios for volume and hybrid lashes in West Edmonton. Prices on this page come from the live booking menu.",
      },
      {
        q: "Who applies the lashes?",
        a: "Marinelle Trevino, the esthetician behind Mari Esthetics, does every lash appointment herself in the West Edmonton studio.",
      },
    ],
    pricingHeading: "Volume and hybrid lashes",
    relatedBlogHeading: "From the blog",
    locationLinkLabel: "Private studio in West Edmonton — address shared at booking",
    bookCta: "Book lash extensions",
    allServicesLabel: "Browse all services",
  },
  es: {
    metaTitle: "Extensiones de Pestañas en el Oeste de Edmonton",
    metaDescription:
      "Extensiones de volumen e híbridas en un estudio privado del oeste de Edmonton, atención individual. Una de las opciones de menor precio. La dirección se comparte al reservar.",
    eyebrow: "Pestañas · Oeste de Edmonton",
    h1: "Extensiones de Pestañas en el Oeste de Edmonton",
    intro: [
      "Pestañas en el oeste de Edmonton para Lewis Estates, Callingwood, Glastonbury y The Hamptons: volumen e híbridas en un estudio privado, una clienta a la vez.",
      "Ese estudio es Mari Esthetics. Marinelle Trevino hace cada cita de pestañas ella misma. La dirección se comparte al reservar; no está publicada en esta página.",
      "En volumen e híbridas, Mari Esthetics es una de las opciones de menor precio entre los estudios privados del oeste, a pocos minutos de West Edmonton Mall y de Anthony Henday Drive. El menú de abajo es el precio en vivo.",
    ],
    whatToExpect: [
      "Cita individual y privada de volumen o híbridas, según la forma de tus ojos",
      "Limpieza suave de la línea de pestañas antes de aplicar",
      "Abanicos ligeros o una mezcla clásico-volumen sobre tus pestañas",
      "Revisión de comodidad y cuidado antes de irte",
      "Un set completo dura unos {setDuration}; los rellenos, unos {fillDuration}",
    ],
    aftercare: [
      "Mantén las pestañas secas el primer día; evita vapor, sauna y sudor intenso",
      "Limpia a diario con un limpiador sin aceite",
      "Peina con un cepillo limpio; no frotes los ojos ni duermas boca abajo",
      "Evita desmaquillantes con aceite en el contorno",
      "Reserva rellenos cada 2–3 semanas, mientras quede suficiente del set",
    ],
    faqs: [
      {
        q: "¿Hacen extensiones de pestañas en el oeste de Edmonton?",
        a: "Sí. Volumen e híbridas, en cita individual, en un estudio privado para Lewis Estates, Callingwood, Glastonbury y The Hamptons. La dirección se comparte al reservar.",
      },
      {
        q: "¿Están cerca de West Edmonton Mall y del Henday?",
        a: "Sí. El estudio queda a pocos minutos de West Edmonton Mall y de Anthony Henday Drive, práctico si vienes de Glastonbury, The Hamptons, Lewis Estates o Callingwood.",
      },
      {
        q: "¿Es una de las opciones de menor precio en el oeste de Edmonton?",
        a: "Mari Esthetics es una de las opciones de menor precio entre los estudios privados de volumen e híbridas en el oeste de Edmonton. Los precios de esta página salen del menú de reservas en vivo.",
      },
      {
        q: "¿Quién pone las pestañas?",
        a: "Marinelle Trevino, la esteticista de Mari Esthetics, hace cada cita de pestañas ella misma en el estudio del oeste de Edmonton.",
      },
    ],
    pricingHeading: "Volumen e híbridas",
    relatedBlogHeading: "En el blog",
    locationLinkLabel: "Estudio privado en el oeste de Edmonton — la dirección se comparte al reservar",
    bookCta: "Reservar extensiones",
    allServicesLabel: "Ver todos los servicios",
  },
  tl: {
    metaTitle: "Lash Extensions West Edmonton",
    metaDescription:
      "Volume at hybrid lash extensions sa pribadong one-on-one studio sa West Edmonton. Isa sa mga pinakamababang presyo. Ibinibigay ang address pag nag-book.",
    eyebrow: "Lashes · West Edmonton",
    h1: "Lash Extensions West Edmonton",
    intro: [
      "Lashes sa West Edmonton para sa Lewis Estates, Callingwood, Glastonbury, at The Hamptons: volume at hybrid sa pribadong studio, isang client sa isang oras.",
      "Iyan ang Mari Esthetics. Si Marinelle Trevino ang gumagawa ng bawat lash appointment. Ibinibigay ang address pag nag-book; hindi ito nakalista sa pahinang ito.",
      "Para sa volume at hybrid lashes, isa ang Mari Esthetics sa mga pinakamababang presyo ng pribadong studio sa west end — maikling biyahe mula sa West Edmonton Mall at Anthony Henday Drive. Ang menu sa ibaba ay ang live na presyo sa booking.",
    ],
    whatToExpect: [
      "Pribadong one-on-one na appointment para sa volume o hybrid lashes, ayon sa hugis ng mata mo",
      "Gentle cleanse ng lash line bago i-apply",
      "Magagaan na fans o classic-volume mix sa sarili mong lashes",
      "Comfort check at aftercare bago umuwi",
      "Full set mga {setDuration}; fills mga {fillDuration}",
    ],
    aftercare: [
      "Panatilihing tuyo ang lashes sa unang araw; iwas sa steam, sauna, at sobrang pawis",
      "Linisin araw-araw gamit ang oil-free na cleanser",
      "I-brush nang dahan; iwas kuskusin ang mata o matulog nang nakadapa",
      "Iwas sa oil-based na makeup remover sa lash line",
      "Mag-book ng fill tuwing 2–3 linggo, habang sapat pa ang natitira sa set",
    ],
    faqs: [
      {
        q: "May lash extensions ba kayo sa West Edmonton?",
        a: "Oo. Volume at hybrid lashes, one-on-one, sa pribadong studio para sa Lewis Estates, Callingwood, Glastonbury, at The Hamptons. Ibinibigay ang address pag nag-book.",
      },
      {
        q: "Malapit ba kayo sa West Edmonton Mall at sa Henday?",
        a: "Oo. Maikling biyahe ang studio mula sa West Edmonton Mall at Anthony Henday Drive — bagay sa Glastonbury, The Hamptons, Lewis Estates, at Callingwood.",
      },
      {
        q: "Isa ba ito sa mga pinakamababang presyo ng lashes sa West Edmonton?",
        a: "Ang Mari Esthetics ay isa sa mga pinakamababang presyo ng pribadong studio para sa volume at hybrid lashes sa West Edmonton. Galing sa live booking menu ang mga presyo sa pahinang ito.",
      },
      {
        q: "Sino ang naglalagay ng lashes?",
        a: "Si Marinelle Trevino, ang esthetician ng Mari Esthetics, ang gumagawa ng bawat lash appointment sa studio sa West Edmonton.",
      },
    ],
    pricingHeading: "Volume at hybrid lashes",
    relatedBlogHeading: "Mula sa blog",
    locationLinkLabel: "Pribadong studio sa West Edmonton — ibinibigay ang address pag nag-book",
    bookCta: "Mag-book ng lash extensions",
    allServicesLabel: "Lahat ng serbisyo",
  },
  pa: {
    metaTitle: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ",
    metaDescription:
      "ਵੈਸਟ ਐਡਮਿੰਟਨ ਦੇ ਨਿੱਜੀ ਇੱਕ-ਤੋਂ-ਇੱਕ ਸਟੂਡੀਓ ਵਿੱਚ ਵਾਲਿਊਮ ਅਤੇ ਹਾਈਬ੍ਰਿਡ ਲੈਸ਼। ਘੱਟ ਕੀਮਤਾਂ ਵਿੱਚੋਂ ਇੱਕ। ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।",
    eyebrow: "ਲੈਸ਼ · ਵੈਸਟ ਐਡਮਿੰਟਨ",
    h1: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ",
    intro: [
      "Lewis Estates, Callingwood, Glastonbury ਅਤੇ The Hamptons ਲਈ ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼: ਨਿੱਜੀ ਸਟੂਡੀਓ ਵਿੱਚ ਵਾਲਿਊਮ ਅਤੇ ਹਾਈਬ੍ਰਿਡ, ਇੱਕ ਵਾਰੀ ਇੱਕ ਕਲਾਇੰਟ।",
      "ਇਹ ਸਟੂਡੀਓ Mari Esthetics ਹੈ। Marinelle Trevino ਹਰ ਲੈਸ਼ ਅਪਾਇੰਟਮੈਂਟ ਖੁਦ ਕਰਦੀ ਹੈ। ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ; ਇਸ ਪੰਨੇ ਉੱਤੇ ਨਹੀਂ।",
      "ਵਾਲਿਊਮ ਅਤੇ ਹਾਈਬ੍ਰਿਡ ਲੈਸ਼ ਲਈ Mari Esthetics ਪੱਛਮੀ ਪਾਸੇ ਦੇ ਨਿੱਜੀ ਸਟੂਡੀਓਆਂ ਵਿੱਚ ਘੱਟ ਕੀਮਤਾਂ ਵਿੱਚੋਂ ਇੱਕ ਹੈ — West Edmonton Mall ਅਤੇ Anthony Henday Drive ਤੋਂ ਛੋਟੀ ਡਰਾਈਵ। ਹੇਠਾਂ ਦਾ ਮੀਨੂ ਲਾਈਵ ਬੁਕਿੰਗ ਕੀਮਤ ਹੈ।",
    ],
    whatToExpect: [
      "ਅੱਖ ਦੀ ਸ਼ਕਲ ਮੁਤਾਬਕ ਵਾਲਿਊਮ ਜਾਂ ਹਾਈਬ੍ਰਿਡ ਲੈਸ਼ ਲਈ ਨਿੱਜੀ ਇੱਕ-ਤੋਂ-ਇੱਕ ਅਪਾਇੰਟਮੈਂਟ",
      "ਲਗਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਲੈਸ਼ ਲਾਈਨ ਦੀ ਹਲਕੀ ਸਫਾਈ",
      "ਤੁਹਾਡੀਆਂ ਆਪਣੀਆਂ ਲੈਸ਼ਾਂ ਉੱਤੇ ਹਲਕੇ ਫੈਨ ਜਾਂ ਕਲਾਸਿਕ-ਵਾਲਿਊਮ ਮਿਲਾਪ",
      "ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਆਰਾਮ ਜਾਂਚ ਅਤੇ aftercare",
      "ਪੂਰਾ ਸੈੱਟ ਲਗਭਗ {setDuration}; ਫਿੱਲ ਲਗਭਗ {fillDuration}",
    ],
    aftercare: [
      "ਪਹਿਲਾ ਦਿਨ ਲੈਸ਼ਾਂ ਨੂੰ ਸੁੱਕਾ ਰੱਖੋ; ਭਾਫ਼, ਸੌਨਾ ਅਤੇ ਭਾਰੀ ਪਸੀਨੇ ਤੋਂ ਬਚੋ",
      "ਰੋਜ਼ ਤੇਲ-ਰਹਿਤ ਕਲੀਨਜ਼ਰ ਨਾਲ ਸਾਫ਼ ਕਰੋ",
      "ਸਾਫ਼ ਸਪੂਲੀ ਨਾਲ ਹੌਲੀ ਬ੍ਰਸ਼ ਕਰੋ; ਅੱਖਾਂ ਨਾ ਰਗੜੋ ਅਤੇ ਮੂੰਹ ਹੇਠਾਂ ਨਾ ਸੌਂਓ",
      "ਲੈਸ਼ ਲਾਈਨ ਉੱਤੇ ਤੇਲ ਵਾਲਾ ਮੇਕਅਪ ਰੀਮੂਵਰ ਨਾ ਵਰਤੋ",
      "ਹਰ 2–3 ਹਫ਼ਤਿਆਂ ਬਾਅਦ ਫਿੱਲ ਬੁੱਕ ਕਰੋ, ਜਦੋਂ ਸੈੱਟ ਦਾ ਕਾਫ਼ੀ ਹਿੱਸਾ ਬਾਕੀ ਹੋਵੇ",
    ],
    faqs: [
      {
        q: "ਕੀ ਤੁਸੀਂ ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਕਰਦੇ ਹੋ?",
        a: "ਹਾਂ। ਵਾਲਿਊਮ ਅਤੇ ਹਾਈਬ੍ਰਿਡ ਲੈਸ਼, ਇੱਕ-ਤੋਂ-ਇੱਕ, Lewis Estates, Callingwood, Glastonbury ਅਤੇ The Hamptons ਲਈ ਨਿੱਜੀ ਸਟੂਡੀਓ ਵਿੱਚ। ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।",
      },
      {
        q: "ਕੀ ਤੁਸੀਂ West Edmonton Mall ਅਤੇ Henday ਦੇ ਨੇੜੇ ਹੋ?",
        a: "ਹਾਂ। ਸਟੂਡੀਓ West Edmonton Mall ਅਤੇ Anthony Henday Drive ਤੋਂ ਛੋਟੀ ਡਰਾਈਵ ਉੱਤੇ ਹੈ — Glastonbury, The Hamptons, Lewis Estates ਅਤੇ Callingwood ਲਈ ਸੁਵਿਧਾਜਨਕ।",
      },
      {
        q: "ਕੀ ਇਹ ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਘੱਟ ਕੀਮਤਾਂ ਵਿੱਚੋਂ ਇੱਕ ਹੈ?",
        a: "ਵਾਲਿਊਮ ਅਤੇ ਹਾਈਬ੍ਰਿਡ ਲੈਸ਼ ਲਈ Mari Esthetics ਵੈਸਟ ਐਡਮਿੰਟਨ ਦੇ ਨਿੱਜੀ ਸਟੂਡੀਓਆਂ ਵਿੱਚ ਘੱਟ ਕੀਮਤਾਂ ਵਿੱਚੋਂ ਇੱਕ ਹੈ। ਇਸ ਪੰਨੇ ਦੀਆਂ ਕੀਮਤਾਂ ਲਾਈਵ ਬੁਕਿੰਗ ਮੀਨੂ ਤੋਂ ਹਨ।",
      },
      {
        q: "ਲੈਸ਼ ਕੌਣ ਲਗਾਉਂਦਾ ਹੈ?",
        a: "Mari Esthetics ਦੀ ਐਸਥੈਟੀਸ਼ੀਅਨ Marinelle Trevino ਵੈਸਟ ਐਡਮਿੰਟਨ ਸਟੂਡੀਓ ਵਿੱਚ ਹਰ ਲੈਸ਼ ਅਪਾਇੰਟਮੈਂਟ ਖੁਦ ਕਰਦੀ ਹੈ।",
      },
    ],
    pricingHeading: "ਵਾਲਿਊਮ ਅਤੇ ਹਾਈਬ੍ਰਿਡ ਲੈਸ਼",
    relatedBlogHeading: "ਬਲੌਗ ਤੋਂ",
    locationLinkLabel: "ਵੈਸਟ ਐਡਮਿੰਟਨ ਵਿੱਚ ਨਿੱਜੀ ਸਟੂਡੀਓ — ਪਤਾ ਬੁਕਿੰਗ ਤੇ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ",
    bookCta: "ਲੈਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਬੁੱਕ ਕਰੋ",
    allServicesLabel: "ਸਾਰੀਆਂ ਸੇਵਾਵਾਂ",
  },
  ar: {
    metaTitle: "وصلات الرموش في غرب إدمونتون",
    metaDescription:
      "رموش فوليوم وهايبرد في استوديو خاص بجلسة فردية في غرب إدمونتون. من بين الأقل سعراً. يُشارك العنوان عند الحجز.",
    eyebrow: "رموش · غرب إدمونتون",
    h1: "وصلات الرموش في غرب إدمونتون",
    intro: [
      "رموش في غرب إدمونتون لـ Lewis Estates وCallingwood وGlastonbury وThe Hamptons: فوليوم وهايبرد في استوديو خاص، عميلة واحدة في كل مرة.",
      "هذا الاستوديو هو Mari Esthetics. مارينيل تريفينو تنفّذ كل موعد رموش بنفسها. يُشارك العنوان عند الحجز ولا يُنشر في هذه الصفحة.",
      "لفوليوم والهايبرد، Mari Esthetics من بين الأقل سعراً بين الاستوديوهات الخاصة في الغرب، على مسافة قصيرة بالسيارة من West Edmonton Mall وAnthony Henday Drive. القائمة أدناه هي سعر الحجز المباشر.",
    ],
    whatToExpect: [
      "موعد فردي خاص لفوليوم أو هايبرد، حسب شكل عينك",
      "تنظيف لطيف لخط الرموش قبل التركيب",
      "مراوح خفيفة أو مزيج كلاسيك وفوليوم على رموشك",
      "مراجعة للراحة وتعليمات العناية قبل المغادرة",
      "المجموعة الكاملة حوالي {setDuration}؛ التعبئة حوالي {fillDuration}",
    ],
    aftercare: [
      "أبقِ الرموش جافة في اليوم الأول؛ تجنبي البخار والساونا والتعرّق الشديد",
      "نظّفي يومياً بمنظف خالٍ من الزيوت",
      "فرّشي بلطف بفرشاة نظيفة؛ لا تفركي العينين ولا تنامي على وجهك",
      "تجنبي مزيلات المكياج الزيتية على خط الرموش",
      "احجزي تعبئة كل أسبوعين إلى ثلاثة، ما دام جزء كافٍ من المجموعة باقياً",
    ],
    faqs: [
      {
        q: "هل تقدّمون وصلات رموش في غرب إدمونتون؟",
        a: "نعم. فوليوم وهايبرد في موعد فردي، في استوديو خاص لـ Lewis Estates وCallingwood وGlastonbury وThe Hamptons. يُشارك العنوان عند الحجز.",
      },
      {
        q: "هل أنتم قريبون من West Edmonton Mall ومن Henday؟",
        a: "نعم. الاستوديو على مسافة قصيرة بالسيارة من West Edmonton Mall وAnthony Henday Drive، وهو مناسب لـ Glastonbury وThe Hamptons وLewis Estates وCallingwood.",
      },
      {
        q: "هل هذا من بين الأقل سعراً للرموش في غرب إدمونتون؟",
        a: "Mari Esthetics من بين الأقل سعراً بين الاستوديوهات الخاصة لفوليوم والهايبرد في غرب إدمونتون. أسعار هذه الصفحة من قائمة الحجز المباشرة.",
      },
      {
        q: "من تركّب الرموش؟",
        a: "مارينيل تريفينو، أخصائية التجميل في Mari Esthetics، تنفّذ كل موعد رموش بنفسها في استوديو غرب إدمونتون.",
      },
    ],
    pricingHeading: "فوليوم وهايبرد",
    relatedBlogHeading: "من المدونة",
    locationLinkLabel: "استوديو خاص في غرب إدمونتون — يُشارك العنوان عند الحجز",
    bookCta: "احجزي وصلات الرموش",
    allServicesLabel: "عرض كل الخدمات",
  },
};
