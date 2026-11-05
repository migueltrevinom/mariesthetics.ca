/**
 * This site does not use /es/ /tl/ /pa/ /ar/ path prefixes.
 * Those hydra facial URLs permanently redirect to the canonical suffix (or Arabic) slug.
 * Destinations stay in sync with SERVICE_LANDING_PAGES via hydraMatch.test.ts.
 */
export const HYDRA_FACIAL_PREFIX_REDIRECTS = [
  {
    source: "/es/services/hydra-facial-edmonton",
    destination: "/services/hydra-facial-edmonton-es",
    permanent: true,
  },
  {
    source: "/tl/services/hydra-facial-edmonton",
    destination: "/services/hydra-facial-edmonton-tl",
    permanent: true,
  },
  {
    source: "/pa/services/hydra-facial-edmonton",
    destination: "/services/hydra-facial-edmonton-pa",
    permanent: true,
  },
  {
    source: "/ar/services/hydra-facial-edmonton",
    destination:
      "/services/%D9%87%D9%8A%D8%AF%D8%B1%D8%A7-%D9%81%D9%8A%D8%B4%D9%8A%D8%A7%D9%84-%D8%A7%D8%AF%D9%85%D9%88%D9%86%D8%AA%D9%88%D9%86",
    permanent: true,
  },
] as const;
