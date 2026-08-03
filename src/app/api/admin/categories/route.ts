import { handleGetAllCategories, handleSaveCategory, handleDeleteCategory } from "./controllers/category.controller";
import { saveCategorySchema, withValidation } from "./middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const GET = withManagerAuth(async (_req: Request) => {
  return handleGetAllCategories();
});

export const POST = withManagerAuth(
  withValidation(saveCategorySchema, async (req: Request, data: any) => {
    return handleSaveCategory(req, data);
  })
);

export const DELETE = withManagerAuth(async (req: Request) => {
  return handleDeleteCategory(req);
});
