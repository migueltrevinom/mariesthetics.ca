import { withManagerAuth } from "@/lib/auth/jwt";
import { handleGetClients } from "@/app/api/clients/controllers/client.controller";

export const GET = withManagerAuth(handleGetClients);
