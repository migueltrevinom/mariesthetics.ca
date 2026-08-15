import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import { Category, Client, ClientSettings, Coupon, Manager, Product, Promotion, Service, ServiceImage, SubscriptionPlan } from "../src/lib/db/models";

const envFile = resolve(process.cwd(), ".env");
const envLocal = resolve(process.cwd(), ".env.local");
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
	console.log("Connected to MongoDB Atlas");

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

	// 1. Categories synced from Production
	const categorySeed = [
		{
			name: "Facials & Skin Care",
			slug: "facials",
			description: "Customized facial treatments, deep cleansing & dermaplaning for healthy glowing skin.",
			active: true,
			sortOrder: 1,
		},
		{
			name: "Lashes & Lift",
			slug: "lashes",
			description: "Lash lifts, tinting & extensions tailored to your natural beauty.",
			active: true,
			sortOrder: 2,
		},
		{
			name: "Permanent MakeUp & Brows",
			slug: "permanentMakeUp",
			description: "Brow shaping, tinting & permanent cosmetics for low-maintenance beauty.",
			active: true,
			sortOrder: 3,
		},
		{
			name: "General Services",
			slug: "general",
			description: "Additional esthetics and studio care treatments.",
			active: false,
			sortOrder: 4,
		},
	];

	for (const cat of categorySeed) {
		await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
	}
	console.log("Categories synced with Production");

	// 2. All 13 REAL PRODUCTION SERVICES created by Marinelle on mariesthetics.ca
	const serviceSeed = [
		// --- LASHES ---
		{
			_id: new mongoose.Types.ObjectId("6a6fd62761dda32cf4b924ee"),
			name: "Hybrid Set",
			slug: "hybrid-set",
			description: "A mix of classic and volume lashes. Offers a fuller yet textured appearance.",
			durationMin: 135,
			priceCents: 9000,
			depositCents: 2500,
			sortOrder: 1,
			category: "lashes",
			photos: ["https://cdn.verifik.co/mariesthetics/services/hybrid-set.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6fdccb61dda32cf4b924f1"),
			name: "Volume Set (2D-5D)",
			slug: "volume-set",
			description: "Create a soft, fluffy, and fuller lash look with lightweight multi-dimensional lash extensions, including YY, W, UU, and premium 4D–5D premade fans.",
			durationMin: 150,
			priceCents: 10000,
			depositCents: 2500,
			sortOrder: 2,
			category: "lashes",
			photos: ["https://cdn.verifik.co/mariesthetics/services/volume-set.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6fe23c61dda32cf4b924f2"),
			name: "Hybrid Fill",
			slug: "fill-service",
			description: "Maintain your beautiful hybrid lashes with a refill designed to replace extensions that have naturally shed and restore fullness.",
			durationMin: 60,
			priceCents: 4500,
			depositCents: 2500,
			sortOrder: 3,
			category: "lashes",
			photos: ["https://cdn.verifik.co/mariesthetics/services/fill-service.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6fe50561dda32cf4b924f6"),
			name: "Volume Fill",
			slug: "fill-service",
			description: "Refresh your volume lash extensions by replacing lashes that have naturally shed, restoring their fluffy, full appearance.",
			durationMin: 90,
			priceCents: 5500,
			depositCents: 2500,
			sortOrder: 4,
			category: "lashes",
			photos: ["https://cdn.verifik.co/mariesthetics/services/fill-service.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6ec8e36bbb26a316fb204d"),
			name: "Classic Set",
			slug: "classic-set",
			description: "One extension is attached to one natural lash. Gives a natural, mascara-like look.",
			durationMin: 120,
			priceCents: 7000,
			depositCents: 2500,
			sortOrder: 5,
			category: "lashes",
			photos: ["https://cdn.verifik.co/mariesthetics/services/classic-set.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6ec8e36bbb26a316fb2060"),
			name: "Classic Fill",
			slug: "fill-service",
			description: "Keep your classic lash extensions looking fresh and full with a refill that replaces extensions lost through the natural lash shedding cycle.",
			durationMin: 90,
			priceCents: 4500,
			depositCents: 2500,
			sortOrder: 6,
			category: "lashes",
			photos: ["https://cdn.verifik.co/mariesthetics/services/fill-service.jpg"],
			active: true,
		},

		// --- PERMANENT MAKEUP & BROWS ---
		{
			_id: new mongoose.Types.ObjectId("6a70b05fbb6115f32bac5ad6"),
			name: "Lip Neutralization",
			slug: "lip-neutralization",
			description: "Lip neutralization is a specialized PMU treatment designed to correct cool, dark, or uneven lip pigmentation. Using carefully selected pigments, the procedure helps neutralize discoloration.",
			durationMin: 120,
			priceCents: 20000,
			depositCents: 7500,
			sortOrder: 7,
			category: "permanentMakeUp",
			photos: ["https://cdn.verifik.co/mariesthetics/services/lip-neutralization.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a735899191b0594eab40f2e"),
			name: "Lip Blush",
			slug: "lip-blush",
			description: "Lip Blush is a semi-permanent cosmetic tattoo that enhances your natural lip color, improves shape and symmetry, and creates the appearance of fuller, healthier-looking lips.",
			durationMin: 120,
			priceCents: 25000,
			depositCents: 7500,
			sortOrder: 8,
			category: "permanentMakeUp",
			photos: ["https://cdn.verifik.co/mariesthetics/services/lip-blush.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6ec8e36bbb26a316fb202c"),
			name: "Soft Powder Brows",
			slug: "soft-powder-brows",
			description: "A semi-permanent brow treatment that creates soft, natural-looking, fuller brows with a gentle powder effect. Perfect for anyone wanting effortless, everyday brows.",
			durationMin: 150,
			priceCents: 25000,
			depositCents: 7500,
			sortOrder: 9,
			category: "permanentMakeUp",
			photos: ["https://cdn.verifik.co/mariesthetics/services/soft-powder-brows.jpg"],
			active: true,
		},

		// --- FACIALS & SKINCARE ---
		{
			_id: new mongoose.Types.ObjectId("6a735938191b0594eab40f2f"),
			name: "Hydra Facial",
			slug: "hydra-facial",
			description: "HydraFacial is a non-invasive, multi-step facial treatment that deeply cleanses, exfoliates, extracts impurities, and infuses the skin with hydrating, nourishing serums.",
			durationMin: 150,
			priceCents: 10000,
			depositCents: 2500,
			sortOrder: 10,
			category: "facials",
			photos: ["https://cdn.verifik.co/mariesthetics/services/hydra-facial.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a78d5f781a61e538cb40eb2"),
			name: "Anti-aging Facial",
			slug: "anti-aging-facial",
			description: "A rejuvenating treatment designed to deeply hydrate, firm, and revitalize the skin while softening the appearance of fine lines.",
			durationMin: 75,
			priceCents: 10000,
			depositCents: 2500,
			sortOrder: 11,
			category: "facials",
			photos: ["https://cdn.verifik.co/mariesthetics/services/anti-aging-facial.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a6ec8e36bbb26a316fb201e"),
			name: "Basic Facial",
			slug: "basic-facial",
			description: "A Basic Facial (Express Facial) is a quick, refreshing skincare treatment designed to cleanse, hydrate, and revitalize the skin.",
			durationMin: 50,
			priceCents: 5000,
			depositCents: 2500,
			sortOrder: 12,
			category: "facials",
			photos: ["https://cdn.verifik.co/mariesthetics/services/basic-facial.jpg"],
			active: true,
		},
		{
			_id: new mongoose.Types.ObjectId("6a70aefdbb6115f32bac5ad5"),
			name: "Deep Cleansing Facial",
			slug: "deep-cleansing-facial",
			description: "Give your skin a fresh start with a deep cleansing facial designed to remove impurities, unclog pores, and restore a healthy glow.",
			durationMin: 90,
			priceCents: 8000,
			depositCents: 3000,
			sortOrder: 13,
			category: "facials",
			photos: ["https://cdn.verifik.co/mariesthetics/services/deep-cleansing-facial.jpg"],
			active: true,
		},
	];

	// Remove old seed services so development has 100% exact production services
	await Service.deleteMany({});

	for (const item of serviceSeed) {
		await Service.create(item);
		console.log(`Service created (Exact Prod Match): ${item.name} (${item.photos[0]})`);
	}

	// 3. Service Images (DigitalOcean Spaces CDN)
	for (const item of serviceSeed) {
		if (item.photos && item.photos.length > 0) {
			const photoUrl = item.photos[0];
			await ServiceImage.findOneAndUpdate(
				{ serviceId: item._id, url: photoUrl },
				{
					serviceId: item._id,
					ipfsHash: "",
					url: photoUrl,
					type: "service",
					isPrivate: false,
				},
				{ upsert: true, new: true },
			);
		}
	}
	console.log("All 13 Service Images synced to DigitalOcean CDN!");

	// 4. Products
	await Product.deleteMany({});
	for (const s of serviceSeed) {
		await Product.create({
			name: `${s.name} - Deposit`,
			description: `Required deposit for ${s.name}`,
			kind: "deposit",
			priceCents: s.depositCents,
			serviceId: s._id,
			active: true,
		});
		await Product.create({
			name: `${s.name} - Full Payment`,
			description: `Full payment for ${s.name}`,
			kind: "full_payment",
			priceCents: s.priceCents,
			serviceId: s._id,
			active: true,
		});
	}
	console.log("Products synced for all 13 production services!");

	const classicLashService = await Service.findOne({ name: "Classic Set" });
	const classicFillService = await Service.findOne({ name: "Classic Fill" });
	const lashServiceIds = [classicLashService?._id, classicFillService?._id].filter(Boolean);

	await SubscriptionPlan.findOneAndUpdate(
		{ name: "Lash Membership — Yearly" },
		{
			name: "Lash Membership — Yearly",
			description: "Monthly lash maintenance included. Pay yearly and get 12 months for the price of 10.",
			interval: "year",
			priceCents: 75000,
			billingNote: "12 for the price of 10 — two months free",
			includedServiceIds: lashServiceIds,
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
			includedServiceIds: lashServiceIds,
			visitsPerPeriod: 1,
			active: true,
		},
		{ upsert: true, new: true },
	);
	console.log("Subscription plans synced");

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

	const monthlyPlan = await SubscriptionPlan.findOne({ name: "Lash Membership — Monthly" });
	if (monthlyPlan && client) {
		const { ClientSubscription } = await import("../src/lib/db/models/ClientSubscription");
		const start = new Date();
		const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
		const sub = await ClientSubscription.findOneAndUpdate(
			{ clientId: client._id, planId: monthlyPlan._id },
			{
				clientId: client._id,
				planId: monthlyPlan._id,
				status: "active",
				currentPeriodStart: start,
				currentPeriodEnd: end,
				visitsUsedThisPeriod: 0,
			},
			{ upsert: true, new: true }
		);

		if (!client.activeSubscriptions) client.activeSubscriptions = [];
		if (!client.activeSubscriptions.includes(sub._id)) {
			client.activeSubscriptions.push(sub._id);
			await client.save();
		}
	}

	console.log("Sync complete! 13 Production services, prices & Pinata photos are now 100% active in dev!");
	await mongoose.disconnect();
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
