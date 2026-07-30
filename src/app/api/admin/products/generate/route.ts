import { withManagerAuth } from "@/lib/auth/jwt";
import { handleGenerateServiceProducts } from "../controllers/product.controller";
import {
  withValidation,
  generateProductsSchema,
} from "../middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const POST = withManagerAuth(
  withValidation(generateProductsSchema, handleGenerateServiceProducts)
);
