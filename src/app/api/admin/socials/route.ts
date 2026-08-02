import { handleGetAllSocials, handleSaveSocial, handleDeleteSocial } from "./controllers/socialLink.controller";
import { saveSocialLinkSchema, withValidation } from "./middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const GET = withManagerAuth(async (req: Request) => {
  return handleGetAllSocials();
});

export const POST = withManagerAuth(
  withValidation(saveSocialLinkSchema, async (req: Request, data: any) => {
    return handleSaveSocial(req, data);
  })
);

export const DELETE = withManagerAuth(async (req: Request) => {
  return handleDeleteSocial(req);
});
