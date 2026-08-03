import { connectDb } from "@/lib/db/connect";
import { Client, Booking } from "@/lib/db/models";

export async function findOrCreateClientForGuest(guest: { name: string; email: string; countryCode?: string; phone?: string }): Promise<any> {
	await connectDb();
	if (!guest || !guest.email) return null;

	const normalizedEmail = guest.email.toLowerCase().trim();
	const countryCode = guest.countryCode ? guest.countryCode.trim() : "+1";
	const normalizedPhone = guest.phone ? guest.phone.trim() : "";
	const clientName = guest.name ? guest.name.trim() : "Guest Client";

	// 1. Try finding client by email or phone
	const searchConditions: any[] = [{ email: normalizedEmail }];
	if (normalizedPhone) {
		searchConditions.push({ phone: normalizedPhone });
	}

	let client = await Client.findOne({ $or: searchConditions });

	if (client) {
		let modified = false;
		if (!client.phone && normalizedPhone) {
			client.phone = normalizedPhone;
			client.countryCode = countryCode;
			modified = true;
		}
		if (client.name !== clientName && clientName) {
			client.name = clientName;
			modified = true;
		}
		if (modified) {
			await client.save();
		}
		return client;
	}

	// 2. Create new Client document if none exists
	try {
		client = await Client.create({
			name: clientName,
			email: normalizedEmail,
			countryCode,
			phone: normalizedPhone,
			active: true,
			banned: false,
		});
		return client;
	} catch (err: any) {
		if (err.code === 11000) {
			// Race condition fallback
			client = await Client.findOne({ email: normalizedEmail });
			return client;
		}
		throw err;
	}
}

export async function backfillUnlinkedBookingClients(): Promise<number> {
	await connectDb();
	const unlinkedBookings = await Booking.find({
		$or: [{ clientId: { $exists: false } }, { clientId: null }],
		"guest.email": { $exists: true, $ne: "" },
	});

	let count = 0;
	for (const booking of unlinkedBookings) {
		if (!booking.guest || !booking.guest.email) continue;
		try {
			const client = await findOrCreateClientForGuest(booking.guest);
			if (client && client._id) {
				booking.clientId = client._id;
				await booking.save();
				count++;
			}
		} catch (err) {
			console.error("[backfillUnlinkedBookingClients Error]:", err);
		}
	}
	return count;
}
