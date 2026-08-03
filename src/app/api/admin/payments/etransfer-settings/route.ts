import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, etransferSettingsSchema } from "../middlewares/validation.middleware";
import { handleGetEtransferSettings, handleSaveEtransferSettings } from "../controllers/etransfer.controller";

export const GET = withManagerAuth(handleGetEtransferSettings);

export const POST = withManagerAuth(async (req: Request, manager) => {
  const validator = withValidation(etransferSettingsSchema, (request, validatedData) =>
    handleSaveEtransferSettings(request, validatedData, manager),
  );
  return validator(req);
});
