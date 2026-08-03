import { withManagerAuth } from "@/lib/auth/jwt";
import { handleGetAllReviews } from "./controllers/review.controller";

export const GET = withManagerAuth(handleGetAllReviews);
