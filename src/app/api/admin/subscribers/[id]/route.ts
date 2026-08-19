import { withManagerAuth } from "@/lib/auth/jwt";
import {
  handleUpdateSubscriberStatus,
  handleDeleteSubscriber,
} from "../../blogs/controllers/subscriber.controller";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const PATCH = withManagerAuth(async (req: Request, _manager, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  try {
    const body = await req.json();
    const status = body.status === "unsubscribed" ? "unsubscribed" : "active";
    return handleUpdateSubscriberStatus(req, id, status);
  } catch {
    return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
  }
});

export const DELETE = withManagerAuth(async (req: Request, _manager, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return handleDeleteSubscriber(req, id);
});
