import { withManagerAuth } from "@/lib/auth/jwt";
import {
  handleUpdateProduct,
  handleDeleteProduct,
} from "../controllers/product.controller";
import {
  withValidation,
  updateProductSchema,
} from "../middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const PUT = withManagerAuth(
  withValidation(updateProductSchema, (req: Request, validatedData: any, context?: any) => {
    return handleUpdateProduct(req, validatedData, context?.params);
  })
);

export const DELETE = withManagerAuth(
  (req: Request, context?: any) => {
    return handleDeleteProduct(req, context?.params);
  }
);
