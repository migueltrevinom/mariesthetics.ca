import { withManagerAuth } from "@/lib/auth/jwt";
import {
  handleGetProducts,
  handleCreateProduct,
} from "./controllers/product.controller";
import {
  withValidation,
  createProductSchema,
} from "./middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const GET = withManagerAuth(handleGetProducts);

export const POST = withManagerAuth(
  withValidation(createProductSchema, handleCreateProduct)
);
