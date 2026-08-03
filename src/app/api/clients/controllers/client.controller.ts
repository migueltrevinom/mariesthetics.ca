import { NextResponse } from "next/server";
import { backfillUnlinkedBookingClients } from "@/lib/booking/clientResolver";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../modules/client.module";

export async function handleGetClients(req: Request): Promise<NextResponse> {
  try {
    // Auto-backfill unlinked guest bookings (e.g. Sarah Johns) into Clients collection
    await backfillUnlinkedBookingClients();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";

    const data = await getClients({ page, limit, search, filter });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Client Controller GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}

export async function handleCreate(
  req: Request,
  validatedData: any
): Promise<NextResponse> {
  try {
    const client = await createClient(validatedData);
    return NextResponse.json({ client }, { status: 201 });
  } catch (err: any) {
    console.error("[Client Controller Create Error]:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to register client" },
      { status: 500 }
    );
  }
}

export async function handleUpdate(
  req: Request,
  validatedData: any
): Promise<NextResponse> {
  try {
    const { id, ...rest } = validatedData;
    const client = await updateClient(id, rest);
    return NextResponse.json({ client });
  } catch (err: any) {
    console.error("[Client Controller Update Error]:", err.message);
    const status = err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: err.message || "Failed to update client" }, { status });
  }
}

export async function handleDelete(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const client = await deleteClient(id);
    return NextResponse.json({ client, message: "Client profile deleted successfully" });
  } catch (err: any) {
    console.error("[Client Controller Delete Error]:", err.message);
    const status = err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: err.message || "Failed to delete client" }, { status });
  }
}
