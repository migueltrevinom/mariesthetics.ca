import { handleGetActive, handleGetAll, handleCreate, handleUpdate, handleDelete } from "../controllers/service.controller";
import { withValidation, createServiceSchema, updateServiceSchema } from "../middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export async function GET() {
	return handleGetActive();
}

export const PATCH = withManagerAuth(handleGetAll);

export const POST = withManagerAuth(withValidation(createServiceSchema, handleCreate));

export const PUT = withManagerAuth(withValidation(updateServiceSchema, handleUpdate));

export const DELETE = withManagerAuth(handleDelete);
