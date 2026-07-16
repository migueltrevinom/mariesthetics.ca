import { NextResponse } from "next/server";
import { getActiveServices, getAllServices, createService, updateService, deleteService } from "../modules/service.module";

export async function handleGetActive(): Promise<NextResponse> {
	try {
		const services = await getActiveServices();
		return NextResponse.json({ services });
	} catch (err: any) {
		console.error("[Service Controller GET Active Error]:", err.message);
		return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
	}
}

export async function handleGetAll(): Promise<NextResponse> {
	try {
		const services = await getAllServices();
		return NextResponse.json({ services });
	} catch (err: any) {
		console.error("[Service Controller GET All Error]:", err.message);
		return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
	}
}

export async function handleCreate(req: Request, validatedData: any): Promise<NextResponse> {
	try {
		const service = await createService(validatedData);
		return NextResponse.json({ service }, { status: 201 });
	} catch (err: any) {
		console.error("[Service Controller Create Error]:", err.message);
		return NextResponse.json({ error: err.message || "Failed to create service" }, { status: 500 });
	}
}

export async function handleUpdate(req: Request, validatedData: any): Promise<NextResponse> {
	try {
		const { id, ...rest } = validatedData;
		const service = await updateService(id, rest);
		return NextResponse.json({ service });
	} catch (err: any) {
		console.error("[Service Controller Update Error]:", err.message);
		const status = err.message.includes("not found") ? 404 : 500;
		return NextResponse.json({ error: err.message || "Failed to update service" }, { status });
	}
}

export async function handleDelete(req: Request): Promise<NextResponse> {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
		}

		const service = await deleteService(id);
		return NextResponse.json({ service, message: "Service deleted successfully" });
	} catch (err: any) {
		console.error("[Service Controller Delete Error]:", err.message);
		const status = err.message.includes("not found") ? 404 : 500;
		return NextResponse.json({ error: err.message || "Failed to delete service" }, { status });
	}
}
