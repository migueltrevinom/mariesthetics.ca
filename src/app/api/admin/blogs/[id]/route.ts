import { withManagerAuth } from "@/lib/auth/jwt";
import {
  handleGetBlogById,
  handleUpdateBlog,
  handleDeleteBlog,
} from "../controllers/blog.controller";
import { withValidation, updateBlogSchema } from "../middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const GET = withManagerAuth(async (req: Request, _manager, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return handleGetBlogById(req, id);
});

export const PUT = withManagerAuth(async (req: Request, _manager, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return withValidation(updateBlogSchema, (r, data) => handleUpdateBlog(r, data, id))(req);
});

export const DELETE = withManagerAuth(async (req: Request, _manager, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return handleDeleteBlog(req, id);
});
