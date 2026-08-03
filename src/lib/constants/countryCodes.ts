export interface CountryCodeOption {
  code: string;
  country: string;
  flag: string;
  label: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  // North America
  { code: "+1", country: "Canada", flag: "🇨🇦", label: "🇨🇦 +1 (Canada)" },
  { code: "+1", country: "United States", flag: "🇺🇸", label: "🇺🇸 +1 (USA)" },

  // Latin America (LATAM)
  { code: "+52", country: "Mexico", flag: "🇲🇽", label: "🇲🇽 +52 (Mexico)" },
  { code: "+57", country: "Colombia", flag: "🇨🇴", label: "🇨🇴 +57 (Colombia)" },
  { code: "+54", country: "Argentina", flag: "🇦🇷", label: "🇦🇷 +54 (Argentina)" },
  { code: "+55", country: "Brazil", flag: "🇧🇷", label: "🇧🇷 +55 (Brazil)" },
  { code: "+56", country: "Chile", flag: "🇨🇱", label: "🇨🇱 +56 (Chile)" },
  { code: "+51", country: "Peru", flag: "🇵🇪", label: "🇵🇪 +51 (Peru)" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪", label: "🇻🇪 +58 (Venezuela)" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨", label: "🇪🇨 +593 (Ecuador)" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹", label: "🇬🇹 +502 (Guatemala)" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷", label: "🇨🇷 +506 (Costa Rica)" },
  { code: "+507", country: "Panama", flag: "🇵🇦", label: "🇵🇦 +507 (Panama)" },
  { code: "+1", country: "Dominican Republic", flag: "🇩🇴", label: "🇩🇴 +1 (Dominican Rep)" },
  { code: "+1", country: "Puerto Rico", flag: "🇵🇷", label: "🇵🇷 +1 (Puerto Rico)" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻", label: "🇸🇻 +503 (El Salvador)" },
  { code: "+504", country: "Honduras", flag: "🇭🇳", label: "🇭🇳 +504 (Honduras)" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮", label: "🇳🇮 +505 (Nicaragua)" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴", label: "🇧🇴 +591 (Bolivia)" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾", label: "🇵🇾 +595 (Paraguay)" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾", label: "🇺🇾 +598 (Uruguay)" },

  // Europe & Global
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", label: "🇬🇧 +44 (UK)" },
  { code: "+34", country: "Spain", flag: "🇪🇸", label: "🇪🇸 +34 (Spain)" },
  { code: "+33", country: "France", flag: "🇫🇷", label: "🇫🇷 +33 (France)" },
  { code: "+49", country: "Germany", flag: "🇩🇪", label: "🇩🇪 +49 (Germany)" },
  { code: "+39", country: "Italy", flag: "🇮🇹", label: "🇮🇹 +39 (Italy)" },
  { code: "+351", country: "Portugal", flag: "🇵🇹", label: "🇵🇹 +351 (Portugal)" },

  // Asia & Oceania
  { code: "+63", country: "Philippines", flag: "🇵🇭", label: "🇵🇭 +63 (Philippines)" },
  { code: "+61", country: "Australia", flag: "🇦🇺", label: "🇦🇺 +61 (Australia)" },
  { code: "+81", country: "Japan", flag: "🇯🇵", label: "🇯🇵 +81 (Japan)" },
  { code: "+82", country: "South Korea", flag: "🇰🇷", label: "🇰🇷 +82 (South Korea)" },
  { code: "+91", country: "India", flag: "🇮🇳", label: "🇮🇳 +91 (India)" },
];
