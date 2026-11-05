/**
 * Expired event wrappers → the evergreen post in the same language.
 * Arabic paths are the sitemap slugs, percent-encoded the same way as other
 * non-Latin URLs. statusCode 301 is a permanent redirect (Next's `permanent: true` is 308).
 * Do not add Christmas Market, cat-eye, or the volume cost post here.
 */
export const BLOG_CLEANUP_REDIRECTS = [
  {
    source: "/blog/volume-lash-fill-edmonton-scream-dia-de-los-muertos",
    destination: "/blog/volume-lash-fill-west-edmonton-no-fall-back-dark-mornings-fill-rhythm",
    statusCode: 301,
  },
  {
    source: "/blog/relleno-pestanas-volumen-edmonton-scream-dia-de-muertos",
    destination: "/blog/relleno-pestanas-volumen-west-edmonton-mananas-oscuras-ritmo-de-relleno",
    statusCode: 301,
  },
  {
    source: "/blog/volume-lash-fill-edmonton-scream-dia-de-los-muertos-tl",
    destination: "/blog/volume-lash-fill-west-edmonton-madilim-na-umaga-fill-rhythm",
    statusCode: 301,
  },
  {
    source: "/blog/edmonton-volume-lash-fill-scream-dia-de-los-muertos",
    destination: "/blog/west-edmonton-volume-fill-hanerhiyan-savere-fill-rhythm",
    statusCode: 301,
  },
  {
    source:
      "/blog/%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%B1%D9%85%D9%88%D8%B4-%D9%81%D9%88%D9%84%D9%8A%D9%88%D9%85-%D8%A7%D8%AF%D9%85%D9%88%D9%86%D8%AA%D9%88%D9%86-scream-%D9%8A%D9%88%D9%85-%D8%A7%D9%84%D9%85%D9%88%D8%AA%D9%89",
    destination:
      "/blog/%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%B1%D9%85%D9%88%D8%B4-%D9%81%D9%88%D9%84%D9%8A%D9%88%D9%85-%D8%BA%D8%B1%D8%A8-%D8%A7%D8%AF%D9%85%D9%88%D9%86%D8%AA%D9%88%D9%86-%D8%B5%D8%A8%D8%A7%D8%AD%D8%A7%D8%AA-%D9%85%D8%B8%D9%84%D9%85%D8%A9-%D8%A7%D9%8A%D9%82%D8%A7%D8%B9-%D8%A7%D9%84%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9",
    statusCode: 301,
  },
  {
    source: "/blog/classic-lash-fill-edmonton-before-halloween",
    destination: "/blog/classic-lash-fill-west-edmonton-fall-shed-november",
    statusCode: 301,
  },
  {
    source: "/blog/relleno-pestanas-clasicas-edmonton-antes-de-halloween",
    destination: "/blog/relleno-pestanas-clasicas-west-edmonton-caida-de-otono",
    statusCode: 301,
  },
  {
    source: "/blog/classic-lash-fill-edmonton-bago-mag-halloween",
    destination: "/blog/classic-lash-fill-west-edmonton-fall-shed-nobyembre",
    statusCode: 301,
  },
  {
    source: "/blog/edmonton-classic-lash-fill-halloween-ton-pehlan",
    destination: "/blog/west-edmonton-classic-lash-fill-patjhad-november",
    statusCode: 301,
  },
  {
    source:
      "/blog/%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%B1%D9%85%D9%88%D8%B4-%D9%83%D9%84%D8%A7%D8%B3%D9%8A%D9%83-%D8%A7%D8%AF%D9%85%D9%88%D9%86%D8%AA%D9%88%D9%86-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D9%87%D8%A7%D9%84%D9%88%D9%8A%D9%86",
    destination:
      "/blog/%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%B1%D9%85%D9%88%D8%B4-%D9%83%D9%84%D8%A7%D8%B3%D9%8A%D9%83-%D8%BA%D8%B1%D8%A8-%D8%A7%D8%AF%D9%85%D9%88%D9%86%D8%AA%D9%88%D9%86-%D8%AA%D8%B3%D8%A7%D9%82%D8%B7-%D8%A7%D9%84%D8%AE%D8%B1%D9%8A%D9%81",
    statusCode: 301,
  },
] as const;
