import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { AuthError, getSession, requireManager } from "@/lib/auth/jwt";

export async function GET() {
  try {
    await connectDb();
    const services = await Service.find({ active: true }).sort({ sortOrder: 1 });
    return NextResponse.json({ services });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMin: z.number().int().min(15),
  priceCents: z.number().int().min(0),
  depositCents: z.number().int().min(0),
  category: z.string().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireManager();
    const body = createSchema.parse(await req.json());
    await connectDb();
    const service = await Service.create(body);
    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireManager();
    const body = createSchema.extend({ id: z.string() }).parse(await req.json());
    await connectDb();
    const { id, ...rest } = body;
    const service = await Service.findByIdAndUpdate(id, rest, { new: true });
    if (!service) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

/** Admin list including inactive */
export async function PATCH() {
  try {
    const session = await getSession();
    if (!session || session.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDb();
    const services = await Service.find().sort({ sortOrder: 1 });
    return NextResponse.json({ services });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}
