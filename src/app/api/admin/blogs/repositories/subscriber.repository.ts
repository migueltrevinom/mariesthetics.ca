import { connectDb } from "@/lib/db/connect";
import {
  NewsletterSubscriber,
  NewsletterDispatch,
  type NewsletterSubscriberDoc,
  type NewsletterDispatchDoc,
} from "@/lib/db/models";

export class SubscriberRepository {
  static async addSubscriber(data: {
    email: string;
    name?: string;
    language?: string;
    source?: string;
  }): Promise<NewsletterSubscriberDoc> {
    await connectDb();
    const cleanEmail = data.email.toLowerCase().trim();

    const existing = await NewsletterSubscriber.findOne({ email: cleanEmail });
    if (existing) {
      existing.status = "active";
      if (data.name) existing.name = data.name;
      if (data.language) existing.language = data.language;
      existing.unsubscribedAt = null;
      await existing.save();
      return existing;
    }

    const subscriber = await NewsletterSubscriber.create({
      email: cleanEmail,
      name: data.name || "",
      language: data.language || "en",
      source: data.source || "website",
      status: "active",
      subscribedAt: new Date(),
    });

    return subscriber;
  }

  static async updateStatus(id: string, status: "active" | "unsubscribed"): Promise<any> {
    await connectDb();
    const update: any = { status };
    if (status === "unsubscribed") {
      update.unsubscribedAt = new Date();
    } else {
      update.unsubscribedAt = null;
    }
    const subscriber = await NewsletterSubscriber.findByIdAndUpdate(id, { $set: update }, { new: true });
    return subscriber;
  }

  static async deleteSubscriber(id: string): Promise<any> {
    await connectDb();
    return await NewsletterSubscriber.findByIdAndDelete(id);
  }

  static async findActiveSubscribers(language?: string): Promise<NewsletterSubscriberDoc[]> {
    await connectDb();
    const query: any = { status: "active" };
    if (language && language !== "all") {
      query.language = language;
    }
    return await NewsletterSubscriber.find(query).lean();
  }

  static async getAllSubscribers(): Promise<NewsletterSubscriberDoc[]> {
    await connectDb();
    return await NewsletterSubscriber.find().sort({ createdAt: -1 }).lean();
  }

  static async countSubscribers(): Promise<{ active: number; total: number }> {
    await connectDb();
    const [active, total] = await Promise.all([
      NewsletterSubscriber.countDocuments({ status: "active" }),
      NewsletterSubscriber.countDocuments(),
    ]);
    return { active, total };
  }

  static async logDispatch(data: {
    blogId: string;
    subject: string;
    recipientsCount: number;
    language: string;
    status: "sent" | "failed" | "pending";
  }): Promise<NewsletterDispatchDoc> {
    await connectDb();
    return await NewsletterDispatch.create(data);
  }

  static async getDispatches(limit = 20): Promise<NewsletterDispatchDoc[]> {
    await connectDb();
    return await NewsletterDispatch.find().sort({ createdAt: -1 }).limit(limit).populate("blogId", "title slug").lean();
  }
}
