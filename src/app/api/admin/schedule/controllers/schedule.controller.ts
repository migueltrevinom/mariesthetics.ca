import { NextResponse } from "next/server";
import {
  getScheduleConfig,
  updateWeeklySchedule,
  saveDateOverride,
  deleteDateOverride,
  createBlackoutBlock,
  deleteBlackoutBlock,
} from "../modules/schedule.module";

export async function handleGetSchedule(): Promise<NextResponse> {
  try {
    const data = await getScheduleConfig();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Schedule Controller GET Error]:", err);
    return NextResponse.json({ error: "Failed to load schedule config" }, { status: 500 });
  }
}

export async function handleUpdateWeeklySchedule(
  req: Request,
  validatedData: any
): Promise<NextResponse> {
  try {
    const schedule = await updateWeeklySchedule(validatedData.weeklyHours);
    return NextResponse.json({ success: true, schedule });
  } catch (err: any) {
    console.error("[Schedule Controller PUT Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update weekly schedule" }, { status: 500 });
  }
}

export async function handleSaveDateOverride(
  req: Request,
  validatedData: any
): Promise<NextResponse> {
  try {
    const schedule = await saveDateOverride(validatedData);
    return NextResponse.json({ success: true, schedule });
  } catch (err: any) {
    console.error("[Schedule Controller Override Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to save date override" }, { status: 500 });
  }
}

export async function handleDeleteDateOverride(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }
    const schedule = await deleteDateOverride(dateStr);
    return NextResponse.json({ success: true, schedule });
  } catch (err: any) {
    console.error("[Schedule Controller Delete Override Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to remove date override" }, { status: 500 });
  }
}

export async function handleCreateBlackoutBlock(
  req: Request,
  validatedData: any
): Promise<NextResponse> {
  try {
    const block = await createBlackoutBlock(validatedData);
    return NextResponse.json({ success: true, block });
  } catch (err: any) {
    console.error("[Schedule Controller Create Block Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to create blackout block" }, { status: 500 });
  }
}

export async function handleDeleteBlackoutBlock(
  req: Request,
  id: string
): Promise<NextResponse> {
  try {
    await deleteBlackoutBlock(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Schedule Controller Delete Block Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete blackout block" }, { status: 500 });
  }
}
