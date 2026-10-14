import { connectDb } from "@/lib/db/connect";
import { GoogleReviews } from "@/lib/db/models";

export type GoogleReviewItem = {
  authorName: string;
  authorUri?: string;
  rating: number;
  text: string;
  relativeTime?: string;
  publishTime?: string;
};

export type GoogleReviewsSnapshot = {
  rating: number;
  userRatingCount: number;
  googleMapsUri?: string;
  reviews: GoogleReviewItem[];
  fetchedAt?: string;
};

const TTL_MS = 10 * 60 * 1000;
let cache: { at: number; value: GoogleReviewsSnapshot | null } | null = null;

export function googlePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  googleMapsUri?: string;
};

/**
 * Fetches Place Details (rating, userRatingCount, reviews) and stores the snapshot.
 * Dormant (returns skipped) until GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are set.
 */
export async function refreshGoogleReviews(): Promise<{ skipped?: string; rating?: number; userRatingCount?: number; reviews?: number }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return { skipped: "GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID not set" };

  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: PlacesReview[];
  };

  const reviews = (data.reviews || [])
    .map((r) => ({
      authorName: r.authorAttribution?.displayName || "",
      authorUri: r.authorAttribution?.uri,
      authorPhotoUri: r.authorAttribution?.photoUri,
      rating: Number(r.rating) || 0,
      text: r.originalText?.text || r.text?.text || "",
      relativeTime: r.relativePublishTimeDescription,
      publishTime: r.publishTime,
      googleMapsUri: r.googleMapsUri,
    }))
    .filter((r) => r.authorName && r.rating > 0);

  await connectDb();
  await GoogleReviews.findOneAndUpdate(
    {},
    {
      $set: {
        placeId,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        googleMapsUri: data.googleMapsUri,
        reviews,
        fetchedAt: new Date(),
      },
    },
    { upsert: true }
  );
  cache = null;
  return { rating: data.rating, userRatingCount: data.userRatingCount, reviews: reviews.length };
}

/** Stored snapshot (cached 10 min). Null when nothing real has been fetched yet. */
export async function getGoogleReviews(): Promise<GoogleReviewsSnapshot | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    await connectDb();
    const doc = await GoogleReviews.findOne().lean<{
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: GoogleReviewItem[];
      fetchedAt?: Date;
    }>();
    const value =
      doc && Number(doc.rating) > 0 && Number(doc.userRatingCount) > 0
        ? {
            rating: Number(doc.rating),
            userRatingCount: Number(doc.userRatingCount),
            googleMapsUri: doc.googleMapsUri,
            reviews: (doc.reviews || []).map((r) => ({
              authorName: String(r.authorName),
              authorUri: r.authorUri,
              rating: Number(r.rating),
              text: String(r.text || ""),
              relativeTime: r.relativeTime,
              publishTime: r.publishTime,
            })),
            fetchedAt: doc.fetchedAt ? new Date(doc.fetchedAt).toISOString() : undefined,
          }
        : null;
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return cache?.value ?? null;
  }
}
