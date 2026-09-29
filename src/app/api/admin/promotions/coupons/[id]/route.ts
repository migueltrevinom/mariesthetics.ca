import { withManagerAuth } from "@/lib/auth/jwt";
import { handleDeleteCoupon, handleGetCoupon, handleUpdateCoupon } from "../../controllers/promotion.controller";

export const GET = withManagerAuth(
  async (_req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    return handleGetCoupon(id);
  },
);

export const PATCH = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    return handleUpdateCoupon(req, id);
  },
);

export const DELETE = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    return handleDeleteCoupon(req, id);
  },
);
