import { Schema } from "mongoose";

const AttributionTouchSchema = new Schema(
  {
    referrerHost: { type: String, default: "" },
    referrerUrl: { type: String, default: "" },
    landingPath: { type: String, default: "" },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmTerm: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    gclid: { type: String, default: "" },
    fbclid: { type: String, default: "" },
    msclkid: { type: String, default: "" },
    ttclid: { type: String, default: "" },
    ts: { type: String, default: "" },
    blogSlug: { type: String, default: "" },
    blogLanguage: { type: String, default: "" },
    channel: { type: String, default: "" },
  },
  { _id: false },
);

/** Optional on Booking and Client. Missing on every document created before this shipped. */
export const BookingSourceSchema = new Schema(
  {
    channel: { type: String, default: "" },
    heardAbout: { type: String, default: "" },
    heardAboutDetail: { type: String, default: "" },
    landingPath: { type: String, default: "" },
    referrerHost: { type: String, default: "" },
    referrerUrl: { type: String, default: "" },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmTerm: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    blogSlug: { type: String, default: "" },
    blogLanguage: { type: String, default: "" },
    adClick: { type: String, default: "" },
    firstTouch: { type: AttributionTouchSchema, default: undefined },
    lastTouch: { type: AttributionTouchSchema, default: undefined },
  },
  { _id: false },
);
