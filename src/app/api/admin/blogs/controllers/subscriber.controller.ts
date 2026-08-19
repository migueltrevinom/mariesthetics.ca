import { NextResponse } from "next/server";
import { SubscriberRepository } from "../repositories/subscriber.repository";

export async function handleGetSubscribers(): Promise<NextResponse> {
  try {
    const [subscribers, stats, dispatches] = await Promise.all([
      SubscriberRepository.getAllSubscribers(),
      SubscriberRepository.countSubscribers(),
      SubscriberRepository.getDispatches(),
    ]);

    return NextResponse.json({
      success: true,
      subscribers,
      stats,
      dispatches,
    });
  } catch (err: any) {
    console.error("[Subscriber Controller Get Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function handleCreateSubscriber(req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const subscriber = await SubscriberRepository.addSubscriber(validatedData);
    return NextResponse.json({ success: true, subscriber }, { status: 201 });
  } catch (err: any) {
    console.error("[Subscriber Controller Create Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to add subscriber" }, { status: 500 });
  }
}

export async function handleUpdateSubscriberStatus(
  req: Request,
  id: string,
  status: "active" | "unsubscribed"
): Promise<NextResponse> {
  try {
    const subscriber = await SubscriberRepository.updateStatus(id, status);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, subscriber });
  } catch (err: any) {
    console.error("[Subscriber Controller Update Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to update subscriber" }, { status: 500 });
  }
}

export async function handleDeleteSubscriber(req: Request, id: string): Promise<NextResponse> {
  try {
    const subscriber = await SubscriberRepository.deleteSubscriber(id);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Subscriber deleted", subscriber });
  } catch (err: any) {
    console.error("[Subscriber Controller Delete Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete subscriber" }, { status: 500 });
  }
}
