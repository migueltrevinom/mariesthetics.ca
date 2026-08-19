import { withManagerAuth } from "@/lib/auth/jwt";
import { handleGetBlogs, handleCreateBlog } from "./controllers/blog.controller";
import { withValidation, createBlogSchema } from "./middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const GET = withManagerAuth(handleGetBlogs);

export const POST = withManagerAuth(
  withValidation(createBlogSchema, handleCreateBlog)
);
