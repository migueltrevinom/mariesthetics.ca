import { connectDb } from "@/lib/db/connect";
import { Client } from "@/lib/db/models/Client";
import "@/lib/db/models/ClientSubscription"; // Ensure subscription schema is loaded

export async function getClients(params: {
  page: number;
  limit: number;
  search: string;
  filter: string;
}) {
  await connectDb();
  const { page, limit, search, filter } = params;

  // Build Mongo query object
  const query: any = {};

  // Search logic: matches name, email, or phone (case-insensitive)
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  // Filter logic:
  // 'active', 'inactive', 'withSubscription', 'banned', or 'all'
  if (filter === "active") {
    query.active = { $ne: false };
    query.banned = { $ne: true };
  } else if (filter === "inactive") {
    query.active = false;
  } else if (filter === "banned") {
    query.banned = true;
  } else if (filter === "withSubscription") {
    query.subscription = { $ne: null };
  }

  const skip = (page - 1) * limit;

  // Execute count and paginated query concurrently
  const [clients, total] = await Promise.all([
    Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("subscription")
      .lean(),
    Client.countDocuments(query),
  ]);

  return {
    clients,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createClient(data: any) {
  await connectDb();
  // Check duplicate email
  const existing = await Client.findOne({ email: data.email.toLowerCase().trim() });
  if (existing) {
    throw new Error("A client with this email address already exists.");
  }
  return Client.create({
    ...data,
    email: data.email.toLowerCase().trim(),
  });
}

export async function updateClient(id: string, data: any) {
  await connectDb();
  // Check duplicate email if it's changing
  if (data.email) {
    const existing = await Client.findOne({
      email: data.email.toLowerCase().trim(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new Error("A client with this email address already exists.");
    }
    data.email = data.email.toLowerCase().trim();
  }

  const client = await Client.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!client) {
    throw new Error("Client not found");
  }
  return client;
}

export async function deleteClient(id: string) {
  await connectDb();
  const client = await Client.findByIdAndDelete(id);
  if (!client) {
    throw new Error("Client not found");
  }
  return client;
}

export async function getClientById(id: string) {
  await connectDb();
  return Client.findById(id).populate("subscription").lean();
}
