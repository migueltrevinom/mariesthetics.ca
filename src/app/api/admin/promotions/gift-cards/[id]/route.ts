import { withManagerAuth } from "@/lib/auth/jwt";
import { handleDeleteGiftCard } from "../../controllers/promotion.controller";

export const DELETE = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    return handleDeleteGiftCard(req, id);
  }
);
