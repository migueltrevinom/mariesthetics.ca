import { handleGetAllReels, handleSaveReel, handleDeleteReel } from "./controllers/reel.controller";
import { saveReelSchema, withValidation } from "./middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const GET = withManagerAuth(async (req: Request) => {
  return handleGetAllReels();
});

export const POST = withManagerAuth(
  withValidation(saveReelSchema, async (req: Request, data: any) => {
    return handleSaveReel(req, data);
  })
);

export const DELETE = withManagerAuth(async (req: Request) => {
  return handleDeleteReel(req);
});
