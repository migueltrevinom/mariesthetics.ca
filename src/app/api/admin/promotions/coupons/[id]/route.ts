import { withManagerAuth } from "@/lib/auth/jwt";
import { handleDeleteCoupon } from "../../controllers/promotion.controller";

export const DELETE = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    return handleDeleteCoupon(req, id);
  }
);
