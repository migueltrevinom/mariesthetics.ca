import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, recordEtransferSchema } from "../middlewares/validation.middleware";
import { handleRecordEtransfer } from "../controllers/etransfer.controller";

export const POST = withManagerAuth(async (req: Request, manager) => {
  const validator = withValidation(recordEtransferSchema, (request, validatedData) =>
    handleRecordEtransfer(request, validatedData, manager),
  );
  return validator(req);
});
