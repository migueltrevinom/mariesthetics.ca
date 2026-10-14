import { Schema, models, model } from "mongoose";

/** Singleton snapshot of the Google Business Profile rating + reviews (Places API New). */
const GoogleReviewSchema = new Schema(
  {
    authorName: String,
    authorUri: String,
    authorPhotoUri: String,
    rating: Number,
    text: String,
    relativeTime: String,
    publishTime: String,
    googleMapsUri: String,
  },
  { _id: false }
);

const GoogleReviewsSchema = new Schema(
  {
    placeId: { type: String, required: true },
    rating: Number,
    userRatingCount: Number,
    googleMapsUri: String,
    reviews: { type: [GoogleReviewSchema], default: [] },
    fetchedAt: Date,
  },
  { timestamps: true }
);

export const GoogleReviews = models.GoogleReviews || model("GoogleReviews", GoogleReviewsSchema);
