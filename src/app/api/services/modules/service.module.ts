import { connectDb } from "@/lib/db/connect";
import Service from "../models/service.model";
import "@/lib/db/models/ServiceImage";

export async function getActiveServices() {
  await connectDb();
  return Service.find({ active: true }).sort({ sortOrder: 1 }).populate("images");
}

export async function getAllServices() {
  await connectDb();
  return Service.find().sort({ sortOrder: 1 }).populate("images");
}

export async function createService(data: any) {
  await connectDb();
  return Service.create(data);
}

export async function updateService(id: string, data: any) {
  await connectDb();
  const service = await Service.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
}

export async function deleteService(id: string) {
  await connectDb();
  const service = await Service.findByIdAndDelete(id);
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
}
