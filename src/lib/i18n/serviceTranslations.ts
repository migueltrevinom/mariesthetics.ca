import type { Locale } from "@/components/i18n/LanguageContext";

export interface TranslatedService {
  name: string;
  description: string;
}

const SERVICE_FALLBACK_TRANSLATIONS: Record<string, Record<Locale, TranslatedService>> = {
  "Classic Set": {
    en: {
      name: "Classic Set",
      description: "One extension is attached to one natural lash. Gives a natural, mascara-like look."
    },
    es: {
      name: "Juego Clásico de Pestañas",
      description: "Se aplica una extensión a cada pestaña natural. Brinda un aspecto natural y definido."
    },
    tl: {
      name: "Classic Lash Set",
      description: "Isang extension sa bawat natural na pilikmata. Nagbibigay ng natural na hitsura."
    },
    pa: {
      name: "ਕਲਾਸਿਕ ਲੇਸ਼ ਸੈੱਟ",
      description: "ਇੱਕ ਕੁਦਰਤੀ ਲੇਸ਼ 'ਤੇ ਇੱਕ ਐਕਸਟੈਂਸ਼ਨ ਲਗਾਈ ਜਾਂਦੀ ਹੈ। ਸੁਭਾਵਿਕ ਦਿੱਖ ਦਿੰਦੀ ਹੈ।"
    },
    ar: {
      name: "مجموعة الرموش الكلاسيكية",
      description: "يتم تركيب رمش واحد على كل رمش طبيعي، مما يعطي مظهراً طبيعياً وجذاباً."
    }
  },
  "Classic Fill": {
    en: {
      name: "Classic Fill",
      description: "Keep your classic lash extensions looking fresh and full with a refill."
    },
    es: {
      name: "Relleno Clásico",
      description: "Mantén tus extensiones de pestañas clásicas frescas y abundantes con este mantenimiento."
    },
    tl: {
      name: "Classic Lash Fill",
      description: "Panatilihing sariwa at puno ang iyong classic lash extensions."
    },
    pa: {
      name: "ਕਲਾਸਿਕ ਫਿਲ",
      description: "ਆਪਣੀ ਲੇਸ਼ ਐਕਸਟੈਂਸ਼ਨ ਨੂੰ ਤਾਜ਼ਾ ਅਤੇ ਭਰਪੂਰ ਰੱਖੋ।"
    },
    ar: {
      name: "تعبئة الرموش الكلاسيكية",
      description: "حافظي على رموشك الكلاسيكية متألقة وممتلئة بلمسة تجديد."
    }
  },
  "Hybrid Set": {
    en: {
      name: "Hybrid Set",
      description: "A mix of classic and volume lashes. Offers a fuller yet textured appearance."
    },
    es: {
      name: "Juego Híbrido de Pestañas",
      description: "Combinación de pestañas clásicas y de volumen. Brinda un aspecto más denso y con textura."
    },
    tl: {
      name: "Hybrid Lash Set",
      description: "Pinaghalong classic at volume lashes para sa magandang balanse ng kapal."
    },
    pa: {
      name: "ਹਾਈਬ੍ਰਿਡ ਲੇਸ਼ ਸੈੱਟ",
      description: "ਕਲਾਸਿਕ ਅਤੇ ਵੋਲਿਊਮ ਲੇਸ਼ਿਜ਼ ਦਾ ਸੁਮੇਲ।"
    },
    ar: {
      name: "مجموعة الرموش الهجينة (هايبرد)",
      description: "مزيج بين الرموش الكلاسيكية ورموش الكثافة لمظهر أكثر امتلاءً وتألقاً."
    }
  },
  "Hybrid Fill": {
    en: {
      name: "Hybrid Fill",
      description: "Refill for hybrid set to maintain texture and density."
    },
    es: {
      name: "Relleno Híbrido",
      description: "Relleno para el juego híbrido para mantener la textura y la densidad deseada."
    },
    tl: {
      name: "Hybrid Lash Fill",
      description: "Retoke para sa hybrid lash set."
    },
    pa: {
      name: "ਹਾਈਬ੍ਰਿਡ ਫਿਲ",
      description: "ਹਾਈਬ੍ਰਿਡ ਲੇਸ਼ਿਜ਼ ਲਈ ਰਿਫਿਲ।"
    },
    ar: {
      name: "تعبئة الرموش الهجينة",
      description: "تعبئة رموش الهايبرد للحفاظ على الكثافة والشكل الجذاب."
    }
  },
  "Volume Set (2D-5D)": {
    en: {
      name: "Volume Set (2D-5D)",
      description: "Create a soft, fluffy, and fuller lash look with lightweight multi-dimensional fans."
    },
    es: {
      name: "Juego de Volumen (2D-5D)",
      description: "Crea una mirada suave, abundante y esponjosa con abanicos livianos de volumen."
    },
    tl: {
      name: "Volume Lash Set (2D-5D)",
      description: "Mas makapal at fluffy na hitsura ng pilikmata gamit ang magagaan na volume fans."
    },
    pa: {
      name: "ਵੋਲਿਊਮ ਲੇਸ਼ ਸੈੱਟ (2D-5D)",
      description: "ਨਰਮ ਅਤੇ ਭਰਪੂਰ ਲੇਸ਼ ਦਿੱਖ ਲਈ।"
    },
    ar: {
      name: "مجموعة الفوليوم (2D-5D)",
      description: "رموش كثيفة وناعمة وخفيفة الوزن تمنح عينيك حسناً وجاذبية ساحرة."
    }
  },
  "Volume Fill": {
    en: {
      name: "Volume Fill",
      description: "Refill for volume lash set to replace shed fans."
    },
    es: {
      name: "Relleno de Volumen",
      description: "Relleno para el juego de volumen para reemplazar los abanicos caídos."
    },
    tl: {
      name: "Volume Lash Fill",
      description: "Retoke para sa volume lash set."
    },
    pa: {
      name: "ਵੋਲਿਊਮ ਫਿਲ",
      description: "ਵੋਲਿਊਮ ਲੇਸ਼ਿਜ਼ ਲਈ ਰਿਫਿਲ।"
    },
    ar: {
      name: "تعبئة الرموش الفوليوم",
      description: "تجديد رموش الفوليوم واستبدال الرموش المتساقطة."
    }
  },
  "Lip Neutralization": {
    en: {
      name: "Lip Neutralization",
      description: "Specialized color correction for cool or dark-toned lips."
    },
    es: {
      name: "Neutralización de Labios",
      description: "Corrección de color especializada para labios de tonos oscuros o fríos."
    },
    tl: {
      name: "Lip Neutralization",
      description: "Color correction para sa maitim o malamig na tono ng labi."
    },
    pa: {
      name: "ਲਿਪ ਨਿਊਟ੍ਰਲਾਈਜ਼ੇਸ਼ਨ",
      description: "ਬੁੱਲ੍ਹਾਂ ਦੇ ਰੰਗ ਨੂੰ ਸੰਤੁਲਿਤ ਕਰਨ ਲਈ ਵਿਸ਼ੇਸ਼ ਰੰਗ ਸੁਧਾਰ।"
    },
    ar: {
      name: "حياد وتفتيح الشفاه",
      description: "تصحيح لون الشفاه الداكنة وتوحيد لونها لمظهر ناعم ووردي."
    }
  },
  "Lip Blush": {
    en: {
      name: "Lip Blush",
      description: "Semi-permanent lip tattooing that enhances natural lip color and shape."
    },
    es: {
      name: "Micropigmentación de Labios (Lip Blush)",
      description: "Tatuaje semipermanente de labios que realza el color natural y define la forma."
    },
    tl: {
      name: "Lip Blush Tattoo",
      description: "Semi-permanent lip tattoo na nagpapaganda ng kulay at hugis ng labi."
    },
    pa: {
      name: "ਲਿਪ ਬਲੱਸ਼",
      description: "ਬੁੱਲ੍ਹਾਂ ਦੇ ਕੁਦਰਤੀ ਰੰਗ ਅਤੇ ਆਕਾਰ ਨੂੰ ਵਧਾਉਣ ਲਈ ਟੈਟੂ।"
    },
    ar: {
      name: "توريد الشفاه (Lip Blush)",
      description: "تتوريد الشفاه شبه الدائم الذي يعزز اللون الطبيعي ويحدد مظهر الشفاه."
    }
  },
  "Soft Powder Brows": {
    en: {
      name: "Soft Powder Brows",
      description: "Shading technique creating a soft, misty makeup finish for your eyebrows."
    },
    es: {
      name: "Cejas Polvo Suave (Soft Powder Brows)",
      description: "Técnica de sombreado que crea un acabado suave de maquillaje difuminado en tus cejas."
    },
    tl: {
      name: "Soft Powder Brows",
      description: "Shading technique para sa soft at parang makeup na kilay."
    },
    pa: {
      name: "ਸਾਫਟ ਪਾਊਡਰ ਬ੍ਰੋਜ਼",
      description: "ਆਈਬ੍ਰੋ ਲਈ ਨਰਮ ਮੇਕਅਪ ਫਿਨਿਸ਼ ਤਕਨੀਕ।"
    },
    ar: {
      name: "حواجب البودرة الناعمة",
      description: "تقنية تظليل تمنح حواجبك مظهراً ممتلئاً ومحدداً مثل المكياج الناعم."
    }
  },
  "Hydra Facial": {
    en: {
      name: "Hydra Facial",
      description: "Deep hydrating facial treatment combining cleansing, extraction, and serum infusion."
    },
    es: {
      name: "Facial Hidratante (Hydra Facial)",
      description: "Tratamiento facial de hidratación profunda que combina limpieza, extracción e infusión de suero."
    },
    tl: {
      name: "Hydra Facial Treatment",
      description: "Pangmalakasang hydration treatment para sa linis at ningning ng mukha."
    },
    pa: {
      name: "ਹਾਈਡ੍ਰਾ ਫੇਸ਼ੀਅਲ",
      description: "ਡੂੰਘੀ ਹਾਈਡ੍ਰੇਟਿੰਗ ਚਮੜੀ ਦੀ ਸਫਾਈ ਅਤੇ ਸੇਰਮ ਇਨਫਿਊਜ਼ਨ।"
    },
    ar: {
      name: "هيدرا فيشيال للوجه",
      description: "علاج ترطيب عميق يجمع بين التنظيف والتقشير وضخ السيروم المغذي."
    }
  },
  "Anti-aging Facial": {
    en: {
      name: "Anti-aging Facial",
      description: "Targeted facial that boosts collagen, firms skin, and reduces fine lines."
    },
    es: {
      name: "Facial Antiedad",
      description: "Facial focalizado que estimula el colágeno, reafirma la piel y reduce líneas de expresión."
    },
    tl: {
      name: "Anti-aging Facial",
      description: "Facial treatment na pampabata at pampatigas ng balat."
    },
    pa: {
      name: "ਐਂਟੀ-ਏਜਿੰਗ ਫੇਸ਼ੀਅਲ",
      description: "ਕੋਲੇਜਨ ਵਧਾਉਣ ਅਤੇ ਝੁਰੜੀਆਂ ਘਟਾਉਣ ਲਈ ਫੇਸ਼ੀਅਲ।"
    },
    ar: {
      name: "فيشيال مقاومة علامات التقدم بالسن",
      description: "جلسة العناية المركزة بالبشرة لتحفيز الكولاجين وشد البشرة وتقليل التجاعيد."
    }
  },
  "Basic Facial": {
    en: {
      name: "Basic Facial",
      description: "Essential maintenance facial including skin analysis, cleansing, and moisture restoration."
    },
    es: {
      name: "Facial Básico",
      description: "Facial esencial de mantenimiento que incluye análisis de piel, limpieza y restauración de humedad."
    },
    tl: {
      name: "Basic Facial",
      description: "Pangunahing pag-aalaga sa mukha kasama ang paglinis at pag-moisturize."
    },
    pa: {
      name: "ਬੇਸਿਕ ਫੇਸ਼ੀਅਲ",
      description: "ਚਮੜੀ ਦੀ ਸਫਾਈ ਅਤੇ ਨਮੀ ਲਈ ਜ਼ਰੂਰੀ ਫੇਸ਼ੀਅਲ।"
    },
    ar: {
      name: "فيشيال أساسي تنظيف وتغذية",
      description: "جلسة تنظيف أساسية وشاملة لتحليل البشرة وتنظيفها وتجديد رطوبتها."
    }
  },
  "Deep Cleansing Facial": {
    en: {
      name: "Deep Cleansing Facial",
      description: "Purifying treatment focusing on steam, extractions, and pore detoxification."
    },
    es: {
      name: "Facial de Limpieza Profunda",
      description: "Tratamiento purificante enfocado en vapor, extracciones y desintoxicación de poros."
    },
    tl: {
      name: "Deep Cleansing Facial",
      description: "Malalim na paglilinis ng pores gamit ang steam at extractions."
    },
    pa: {
      name: "ਡੀਪ ਕਲੀਨਜ਼ਿੰਗ ਫੇਸ਼ੀਅਲ",
      description: "ਮਸਾਮਾਂ ਦੀ ਡੂੰਘੀ ਸਫਾਈ ਲਈ ਵਿਸ਼ੇਸ਼ ਫੇਸ਼ੀਅਲ।"
    },
    ar: {
      name: "فيشيال التنظيف العميق للبشرة",
      description: "علاج تنقية تنظيف المسام وتخليص البشرة من الشوائب والزيوت الزائدة."
    }
  }
};

export function getLocalizedService(
  service: {
    name: string;
    description: string;
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
  },
  locale: Locale
): TranslatedService {
  // 1. Check database translations
  const dbName = service.nameTranslations?.[locale];
  const dbDesc = service.descriptionTranslations?.[locale];

  if (dbName && dbName.trim().length > 0) {
    return {
      name: dbName,
      description: dbDesc && dbDesc.trim().length > 0 ? dbDesc : service.description,
    };
  }

  // 2. Check fallback dictionary
  const fallbackMatch = SERVICE_FALLBACK_TRANSLATIONS[service.name];
  if (fallbackMatch && fallbackMatch[locale]) {
    return fallbackMatch[locale];
  }

  // 3. Default to English
  return {
    name: service.name,
    description: service.description,
  };
}
