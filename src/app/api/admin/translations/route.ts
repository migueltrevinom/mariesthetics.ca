import {
  handleGetAllTranslations,
  handleSaveTranslation,
  handleSeedTranslations,
  handleDeleteTranslation,
} from "./controllers/translation.controller";
import {
  saveTranslationSchema,
  seedTranslationsSchema,
  withValidation,
} from "./middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const GET = withManagerAuth(async (req: Request) => {
  return handleGetAllTranslations();
});

export const POST = withManagerAuth(
  withValidation(saveTranslationSchema, async (req: Request, data: any) => {
    return handleSaveTranslation(req, data);
  })
);

export const PUT = withManagerAuth(
  withValidation(seedTranslationsSchema, async (req: Request, data: any) => {
    return handleSeedTranslations(req, data);
  })
);

export const DELETE = withManagerAuth(async (req: Request) => {
  return handleDeleteTranslation(req);
});
