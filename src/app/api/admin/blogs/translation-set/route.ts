import { withManagerAuth } from "@/lib/auth/jwt";
import { handleCreateBlogTranslationSet } from "../controllers/blog.controller";
import {
  withValidation,
  createBlogTranslationSetSchema,
} from "../middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const POST = withManagerAuth(
  withValidation(createBlogTranslationSetSchema, handleCreateBlogTranslationSet)
);
