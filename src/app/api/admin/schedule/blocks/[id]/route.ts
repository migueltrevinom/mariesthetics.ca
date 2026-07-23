import { NextResponse } from "next/server";
import { withManagerAuth } from "@/lib/auth/jwt";
import { handleDeleteBlackoutBlock } from "../../controllers/schedule.controller";

export const DELETE = withManagerAuth(async (req: Request, ...args: any[]) => {
  // Extract params from route arguments (Next.js 15 route context)
  const params = args[0]?.params ? await args[0].params : {};
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Block ID is required" }, { status: 400 });
  }
  return handleDeleteBlackoutBlock(req, id);
});
