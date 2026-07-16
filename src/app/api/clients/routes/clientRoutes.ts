import {
  handleGetClients,
  handleCreate,
  handleUpdate,
  handleDelete,
} from "../controllers/client.controller";
import {
  withValidation,
  createClientSchema,
  updateClientSchema,
} from "../middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const GET = withManagerAuth(handleGetClients);
export const POST = withManagerAuth(withValidation(createClientSchema, handleCreate));
export const PUT = withManagerAuth(withValidation(updateClientSchema, handleUpdate));
export const DELETE = withManagerAuth(handleDelete);
