import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import { Client, ClientSettings, Coupon, Manager, Promotion, Service, SubscriptionPlan } from "../src/lib/db/models";

const envFile = resolve(process.cwd(), ".env");
const envLocal = resolve(process.cwd(), ".env.local");
// Prefer `.env` for Atlas / shared secrets; `.env.local` can override non-DB locals.
if (existsSync(envLocal)) loadEnv({ path: envLocal });
if (existsSync(envFile)) loadEnv({ path: envFile, override: true });
else loadEnv();

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const MANAGERS = [
	{
		name: "Marinelle Tala",
		email: "mari@mariesthetics.ca",
		phone: "+1 7809133081",
		role: "owner" as const,
	},
	{
		name: "Marinelle",
		email: "marinelle@yahoo.ca",
		phone: "+507 62639742",
		role: "owner" as const,
	},
	{
		name: "Miguel",
		email: "miguel.trevinom@gmail.com",
		phone: "+1 7809133081",
		role: "owner" as const,
	},
];

async function seed() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error("MONGODB_URI is required (set in .env)");
	}

	await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
	console.log("Connected to MongoDB");

	for (const manager of MANAGERS) {
		await Manager.findOneAndUpdate(
			{ email: manager.email },
			{
				email: manager.email,
				name: manager.name,
				phone: manager.phone,
				role: manager.role,
				active: true,
			},
			{ upsert: true, new: true },
		);
		console.log(`Manager ready: ${manager.name} <${manager.email}>`);
	}

	const serviceSeed = [
		{
			name: "Signature Facial",
			description: "A customized facial with cleanse, exfoliation, extraction, mask, and serum tailored to your skin.",
			durationMin: 60,
			priceCents: 12000,
			depositCents: 3000,
			sortOrder: 1,
			category: "facials",
		},
		{
			name: "Brow Shape & Tint",
			description: "Precision shaping with optional tint for soft, defined brows.",
			durationMin: 45,
			priceCents: 6500,
			depositCents: 2000,
			sortOrder: 2,
			category: "permanentMakeUp",
		},
		{
			name: "Classic Lash Lift",
			description: "Lift and set natural lashes for an open-eye look lasting weeks.",
			durationMin: 75,
			priceCents: 9500,
			depositCents: 2500,
			sortOrder: 3,
			category: "lashes",
		},
		{
			name: "Lash Fill / Maintenance",
			description: "Refresh and maintain your lash set for consistent fullness.",
			durationMin: 60,
			priceCents: 7500,
			depositCents: 2500,
			sortOrder: 4,
			category: "lashes",
		},
		{
			name: "Dermaplaning Glow",
			description: "Gentle physical exfoliation for smoother texture and product absorption.",
			durationMin: 45,
			priceCents: 11000,
			depositCents: 3000,
			sortOrder: 5,
			category: "facials",
		},
	];

	const serviceIds: mongoose.Types.ObjectId[] = [];
	for (const item of serviceSeed) {
		const doc = await Service.findOneAndUpdate({ name: item.name }, item, {
			upsert: true,
			new: true,
		});
		serviceIds.push(doc._id as mongoose.Types.ObjectId);
		console.log(`Service ready: ${item.name}`);
	}

	const lashService = await Service.findOne({ name: "Classic Lash Lift" });

	await SubscriptionPlan.findOneAndUpdate(
		{ name: "Lash Membership — Yearly" },
		{
			name: "Lash Membership — Yearly",
			description: "Monthly lash maintenance included. Pay yearly and get 12 months for the price of 10.",
			interval: "year",
			priceCents: 75000,
			billingNote: "12 for the price of 10 — two months free",
			includedServiceIds: lashService ? [lashService._id] : [],
			visitsPerPeriod: 12,
			active: true,
		},
		{ upsert: true, new: true },
	);

	await SubscriptionPlan.findOneAndUpdate(
		{ name: "Lash Membership — Monthly" },
		{
			name: "Lash Membership — Monthly",
			description: "One lash maintenance visit each month.",
			interval: "month",
			priceCents: 7500,
			billingNote: "Cancel anytime",
			includedServiceIds: lashService ? [lashService._id] : [],
			visitsPerPeriod: 1,
			active: true,
		},
		{ upsert: true, new: true },
	);
	console.log("Subscription plans ready");

	const now = new Date();
	const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
	await Promotion.findOneAndUpdate(
		{ title: "New Client Soft Launch" },
		{
			title: "New Client Soft Launch",
			description: "15% off your first facial during our soft launch month.",
			discountType: "percent",
			discountValue: 15,
			serviceIds: serviceIds.slice(0, 1),
			startsAt: now,
			endsAt: in30,
			active: true,
		},
		{ upsert: true, new: true },
	);

	await Coupon.findOneAndUpdate(
		{ code: "WELCOME15" },
		{
			code: "WELCOME15",
			type: "percent",
			value: 15,
			maxRedemptions: 100,
			redemptionCount: 0,
			expiresAt: in30,
			active: true,
		},
		{ upsert: true, new: true },
	);
	console.log("Promotion + coupon ready");

	const demoEmail = "demo.client@mariesthetics.ca";
	const client = await Client.findOneAndUpdate(
		{ email: demoEmail },
		{
			name: "Demo Client",
			email: demoEmail,
			phone: "+17805550123",
			referralCode: nanoid(),
		},
		{ upsert: true, new: true },
	);
	await ClientSettings.findOneAndUpdate(
		{ clientId: client._id },
		{ clientId: client._id, remindersEnabled: true, marketingOptIn: false },
		{ upsert: true, new: true },
	);
	console.log(`Demo client ready: ${demoEmail}`);

	console.log("Seed complete");
	await mongoose.disconnect();
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
