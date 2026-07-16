import { NextResponse } from "next/server";
import { requestManagerOtp, verifyManagerOtp } from "../modules/manager.module";
import { signSession, setSessionCookie } from "@/lib/auth/jwt";

export async function handleSendOtp(req: Request, validatedData: { email: string }): Promise<NextResponse> {
	try {
		const { email } = validatedData;

		// 1. Execute business logic to generate and send OTP
		const result = await requestManagerOtp(email);

		return NextResponse.json(result);
	} catch (err: any) {
		console.error("[Manager Controller Send OTP Error]:", err.message);
		const status = err.message.includes("No active manager account") ? 404 : 500;
		return NextResponse.json({ error: err.message || "Failed to request OTP" }, { status });
	}
}

export async function handleVerifyOtp(req: Request, validatedData: { email: string; code: string }): Promise<NextResponse> {
	try {
		const { email, code } = validatedData;

		// 1. Execute business logic to verify OTP
		const result = await verifyManagerOtp(email, code);

		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		// 2. Establish manager session cookies
		const { manager } = result;
		const token = await signSession({
			sub: manager.id,
			role: "manager",
			email: manager.email,
			name: manager.name,
		});

		await setSessionCookie(token);

		return NextResponse.json({
			ok: true,
			role: "manager",
			user: {
				id: manager.id,
				email: manager.email,
				name: manager.name,
			},
		});
	} catch (err: any) {
		console.error("[Manager Controller Verify OTP Error]:", err.message);
		return NextResponse.json({ error: err.message || "Failed to verify OTP" }, { status: 500 });
	}
}
