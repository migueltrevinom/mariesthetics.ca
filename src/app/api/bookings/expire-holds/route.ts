import { NextResponse } from "next/server";
import { expireStaleHolds } from "@/lib/booking/holds";

export async function POST() {
  const result = await expireStaleHolds();
  return NextResponse.json(result);
}
