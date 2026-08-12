import { NextResponse } from "next/server";
import { ServiceImageRepository } from "../repositories/serviceImage.repository";
import { uploadToDigitalOceanSpaces } from "@/lib/storage/doSpaces";
import mongoose from "mongoose";

export async function handleUploadImage(req: Request): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const serviceId = formData.get("serviceId") as string | null;
    const type = (formData.get("type") as string | null) || "service";
    const isPrivate = formData.get("isPrivate") === "true";
    const clientId = formData.get("clientId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Convert file content to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload to DigitalOcean Spaces
    const { url, key } = await uploadToDigitalOceanSpaces(
      fileBuffer,
      file.name,
      file.type,
      type === "profile" ? "profiles" : "services"
    );

    // Profile photo early-exit (returns URL directly)
    if (type === "profile") {
      return NextResponse.json({ url }, { status: 201 });
    }

    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json({ error: "A valid Service ID is required." }, { status: 400 });
    }

    // Save to database
    const serviceImage = await ServiceImageRepository.createImage({
      serviceId,
      clientId: clientId || undefined,
      ipfsHash: key, // Stores object key
      url,
      type: type as "service" | "pre" | "post",
      isPrivate,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });

    return NextResponse.json({ serviceImage }, { status: 201 });
  } catch (err: any) {
    console.error("[ImagesController Upload Error]:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}

export async function handleDeleteImage(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "A valid Image ID is required." }, { status: 400 });
    }

    const deletedImage = await ServiceImageRepository.deleteImage(id);
    return NextResponse.json({
      deletedImage,
      message: "Image unpinned and deleted successfully.",
    });
  } catch (err: any) {
    console.error("[ImagesController Delete Error]:", err.message);
    const status = err.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: err.message || "Failed to delete image." }, { status });
  }
}
