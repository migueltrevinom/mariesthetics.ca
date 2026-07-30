"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatCad } from "@/lib/money";
import { generateIcsContent, getGoogleCalendarUrl, getOutlookCalendarUrl } from "@/lib/calendar/ics";

interface BookingDetails {
	id: string;
	start: string | null;
	end: string | null;
	status: string;
	guestName: string;
	guestEmail: string;
	guestPhone: string;
	serviceName: string;
	durationMin: number;
	totalCents: number;
	depositCents: number;
	paidCents: number;
	balanceDueCents: number;
}

interface ReceiptData {
	paymentStatus: string;
	sessionStatus: string;
	paymentMethod: string;
	receipt: {
		id: string;
		amountCents: number;
		description: string;
		kind: string;
		clientEmail: string;
		createdAt: string;
		bookingDate: string | null;
		bookingServiceName: string | null;
	};
	booking?: BookingDetails | null;
	provider: {
		name: string;
		businessName: string;
		address: string;
		email: string;
		phone: string;
	};
}

function ConfettiEffect() {
	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none z-10 print:hidden">
			{[...Array(50)].map((_, i) => {
				const left = Math.random() * 100;
				const delay = Math.random() * 5;
				const duration = 4 + Math.random() * 4;
				const size = 6 + Math.random() * 12;
				const rotation = Math.random() * 360;
				const colors = ["#c8a86b", "#e2c78c", "#2f6b50", "#9dceb8", "#f3efe6"];
				const color = colors[Math.floor(Math.random() * colors.length)];
				return (
					<span
						key={i}
						className="absolute top-0 rounded-sm opacity-75 animate-fall"
						style={{
							left: `${left}%`,
							animationDelay: `${delay}s`,
							animationDuration: `${duration}s`,
							width: `${size}px`,
							height: `${size}px`,
							backgroundColor: color,
							transform: `rotate(${rotation}deg)`,
						}}
					/>
				);
			})}
			<style dangerouslySetInnerHTML={{
				__html: `
					@keyframes fall {
						0% {
							transform: translateY(-20px) rotate(0deg);
							opacity: 1;
						}
						100% {
							transform: translateY(100vh) rotate(720deg);
							opacity: 0;
						}
					}
					.animate-fall {
						animation: fall linear infinite;
					}
				`
			}} />
		</div>
	);
}

function PaymentLinkContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const cancelled = searchParams.get("cancelled") === "true";
	const sessionId = searchParams.get("session_id") || "";
	const bookingId = searchParams.get("bookingId") || "";
	const paymentId = searchParams.get("paymentId") || "";
	const id = searchParams.get("id") || "";

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [data, setData] = useState<ReceiptData | null>(null);

	// Device Detection
	const [isAppleDevice, setIsAppleDevice] = useState(false);

	// Email Sending State
	const [sendEmailInput, setSendEmailInput] = useState("");
	const [sendingEmail, setSendingEmail] = useState(false);
	const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const ua = window.navigator.userAgent.toLowerCase();
			if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod") || ua.includes("macintosh") || ua.includes("mac os")) {
				setIsAppleDevice(true);
			}
		}
	}, []);

	useEffect(() => {
		if (cancelled) {
			setLoading(false);
			return;
		}

		if (!sessionId && !bookingId && !paymentId && !id) {
			setError("Receipt parameter missing. Please check your confirmation link.");
			setLoading(false);
			return;
		}

		const fetchReceipt = async () => {
			try {
				const query = new URLSearchParams();
				if (sessionId) query.set("session_id", sessionId);
				if (bookingId) query.set("bookingId", bookingId);
				if (paymentId) query.set("paymentId", paymentId);
				if (id) query.set("id", id);

				const res = await fetch(`/api/public/checkout-session?${query.toString()}`);
				const json = await res.json();
				if (!res.ok) {
					throw new Error(json.error || "Failed to load receipt details.");
				}
				setData(json);
				if (json.receipt?.clientEmail || json.booking?.guestEmail) {
					setSendEmailInput(json.receipt?.clientEmail || json.booking?.guestEmail);
				}
			} catch (err: any) {
				setError(err.message || "An error occurred loading receipt.");
			} finally {
				setLoading(false);
			}
		};

		void fetchReceipt();
	}, [sessionId, bookingId, paymentId, id, cancelled]);

	const handlePrint = () => {
		window.print();
	};

	const handleDownloadIcs = () => {
		if (!data?.booking || !data.booking.start) return;
		const startDate = new Date(data.booking.start);
		const endDate = new Date(data.booking.end || startDate.getTime() + (data.booking.durationMin || 60) * 60_000);

		const icsText = generateIcsContent({
			title: `Mari Esthetics — ${data.booking.serviceName}`,
			description: `Appointment for ${data.booking.serviceName} at Mari Esthetics.\n\nDeposit Paid: ${formatCad(data.booking.depositCents)}\nBalance Due at Studio: ${formatCad(data.booking.balanceDueCents)}\nClient: ${data.booking.guestName}`,
			location: data.provider.address,
			start: startDate,
			end: endDate,
			organizerName: data.provider.businessName,
			organizerEmail: data.provider.email,
		});

		const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `mari-esthetics-${data.booking.serviceName.toLowerCase().replace(/\s+/g, "-")}.ics`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleSendEmail = async () => {
		const targetBookingId = data?.booking?.id || bookingId;
		if (!targetBookingId) {
			setEmailStatus({ type: "error", text: "No booking ID associated with this receipt." });
			return;
		}
		if (!sendEmailInput || !sendEmailInput.includes("@")) {
			setEmailStatus({ type: "error", text: "Please enter a valid email address." });
			return;
		}

		setSendingEmail(true);
		setEmailStatus(null);
		try {
			const res = await fetch("/api/bookings/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId: targetBookingId, email: sendEmailInput }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Failed to send email.");
			setEmailStatus({ type: "success", text: `✓ Confirmation and .ics calendar sent to ${sendEmailInput}` });
		} catch (err: any) {
			setEmailStatus({ type: "error", text: err.message || "Failed to send email." });
		} finally {
			setSendingEmail(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
				<div className="text-center space-y-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8a86b] border-t-transparent mx-auto" />
					<p className="text-sm text-[var(--ink-soft)] font-medium">Retrieving booking receipt status...</p>
				</div>
			</div>
		);
	}

	if (cancelled) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6 py-12 relative overflow-hidden">
				<div className="aurora pointer-events-none" />
				<div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--card-bg)] p-8 rounded-2xl shadow-xl text-center relative z-10 backdrop-blur-md">
					<div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
						✕
					</div>
					<h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
						Payment Cancelled
					</h1>
					<p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
						Your checkout session was cancelled or could not be completed. No charges were made.
					</p>
					<div className="mt-8 space-y-2">
						<Link href="/book" className="btn-primary w-full text-center block !py-3 text-sm">
							Try Booking Again
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6 py-12 relative overflow-hidden">
				<div className="aurora pointer-events-none" />
				<div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--card-bg)] p-8 rounded-2xl shadow-xl text-center relative z-10 backdrop-blur-md">
					<div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
						!
					</div>
					<h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
						Receipt Error
					</h1>
					<p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
						{error || "We couldn't retrieve the details for this transaction."}
					</p>
					<div className="mt-8">
						<Link href="/" className="btn-primary w-full text-center block !py-3 text-sm">
							Return to Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const isPaid = data.paymentStatus === "paid" || data.paymentStatus === "succeeded";
	const formattedCreatedDate = format(new Date(data.receipt.createdAt), "PPpp");

	// Booking specific variables
	const b = data.booking;
	const bookingStartDate = b?.start ? new Date(b.start) : null;
	const bookingEndDate = b?.start ? new Date(b.end || bookingStartDate!.getTime() + (b.durationMin || 60) * 60_000) : null;

	const googleCalendarUrl = bookingStartDate && b ? getGoogleCalendarUrl({
		title: `Mari Esthetics — ${b.serviceName}`,
		description: `Appointment for ${b.serviceName} at Mari Esthetics.\n\nDeposit Paid: ${formatCad(b.depositCents)}\nBalance Due at Studio: ${formatCad(b.balanceDueCents)}`,
		location: data.provider.address,
		start: bookingStartDate,
		end: bookingEndDate!,
	}) : "";

	const outlookCalendarUrl = bookingStartDate && b ? getOutlookCalendarUrl({
		title: `Mari Esthetics — ${b.serviceName}`,
		description: `Appointment for ${b.serviceName} at Mari Esthetics.\n\nDeposit Paid: ${formatCad(b.depositCents)}\nBalance Due at Studio: ${formatCad(b.balanceDueCents)}`,
		location: data.provider.address,
		start: bookingStartDate,
		end: bookingEndDate!,
	}) : "";

	return (
		<div className="min-h-screen bg-[var(--background)] px-4 pt-16 pb-8 md:pt-24 md:pb-16 relative overflow-hidden print:bg-white print:p-0">
			<div className="aurora pointer-events-none print:hidden" />
			{isPaid && <ConfettiEffect />}

			<div className="max-w-xl mx-auto space-y-6 relative z-10 print:max-w-full print:my-0">
				
				{/* Top Status Banner */}
				<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-md text-center backdrop-blur-sm print:hidden">
					{isPaid ? (
						<>
							<div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
								✓
							</div>
							<h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
								{b ? "Appointment Reserved & Confirmed!" : "Payment Successful!"}
							</h2>
							<p className="mt-1 text-xs text-[var(--ink-soft)]">
								{b ? "Your deposit payment has been processed and your appointment slot is secured." : "Your payment has been securely processed. Thank you!"}
							</p>
						</>
					) : (
						<>
							<div className="w-12 h-12 bg-[#c8a86b]/10 text-[#c8a86b] border border-[#c8a86b]/20 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
								⏳
							</div>
							<h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
								Deposit Payment Pending
							</h2>
							<p className="mt-1 text-xs text-[var(--ink-soft)]">
								We are awaiting deposit confirmation. Your slot is reserved.
							</p>
						</>
					)}

					<div className="mt-5 flex flex-wrap gap-2 justify-center">
						<button
							type="button"
							onClick={handlePrint}
							className="px-4 py-2 border border-[var(--border-color)] hover:border-[#c8a86b] rounded-xl text-xs font-semibold text-[var(--ink)] bg-[var(--card-bg)] cursor-pointer flex items-center gap-1.5 transition-all"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="6 9 6 2 18 2 18 9" />
								<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
								<rect x="6" y="14" width="12" height="8" />
							</svg>
							Print / Download Receipt
						</button>
						<Link
							href="/"
							className="px-4 py-2 border border-transparent rounded-xl text-xs font-semibold text-[#24180a] bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:opacity-90 block transition-all"
						>
							Go to Home
						</Link>
					</div>
				</div>

				{/* BOOKING APPOINTMENT SUMMARY CARD */}
				{b && bookingStartDate && (
					<div className="border border-[#c8a86b]/30 bg-black/10 dark:bg-black/30 p-6 rounded-2xl shadow-lg backdrop-blur-md space-y-4 text-left print:hidden">
						<div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
							<span className="text-[10px] uppercase font-bold tracking-wider text-[#c8a86b] flex items-center gap-1.5">
								<span>📅 Appointment Details</span>
							</span>
							<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
								{b.durationMin} Min Treatment
							</span>
						</div>

						<div className="space-y-1">
							<h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] font-bold">
								{b.serviceName}
							</h3>
							<p className="text-sm font-semibold text-[#c8a86b]">
								{format(bookingStartDate, "EEEE, MMMM d, yyyy")} at {format(bookingStartDate, "h:mm a")}
							</p>
							<p className="text-xs text-[var(--ink-soft)] pt-1 flex items-center gap-1">
								<span>📍 Studio:</span>
								<a
									href={`https://maps.google.com/?q=${encodeURIComponent(data.provider.address)}`}
									target="_blank"
									rel="noreferrer"
									className="underline text-[var(--ink)] hover:text-[#c8a86b] font-medium"
								>
									{data.provider.address}
								</a>
							</p>
						</div>

						{/* ADD TO CALENDAR BUTTONS BAR */}
						<div className="pt-3 border-t border-[var(--border-color)] space-y-2">
							<span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block">
								Add Appointment to Calendar
							</span>

							<div className="flex flex-wrap gap-2">
								{/* Smart Apple / iCal Button */}
								<button
									type="button"
									onClick={handleDownloadIcs}
									className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
										isAppleDevice
											? "bg-[#2f5d4a] hover:bg-[#3b725b] text-white border border-transparent"
											: "border border-[var(--border-color)] text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card-bg)]"
									}`}
								>
									<span></span>
									<span>{isAppleDevice ? "Add to Apple Calendar" : "Apple / iCal (.ics)"}</span>
								</button>

								{/* Google Calendar */}
								<a
									href={googleCalendarUrl}
									target="_blank"
									rel="noreferrer"
									className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[#c8a86b] flex items-center gap-1.5 transition-all"
								>
									<span>📅</span>
									<span>Google Calendar</span>
								</a>

								{/* Outlook Calendar */}
								<a
									href={outlookCalendarUrl}
									target="_blank"
									rel="noreferrer"
									className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[#c8a86b] flex items-center gap-1.5 transition-all"
								>
									<span>✉</span>
									<span>Outlook</span>
								</a>

								{/* Download .ics */}
								{!isAppleDevice && (
									<button
										type="button"
										onClick={handleDownloadIcs}
										className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer"
									>
										<span>📥</span>
										<span>Download .ics File</span>
									</button>
								)}
							</div>
						</div>

						{/* SEND CONFIRMATION VIA EMAIL */}
						<div className="pt-3 border-t border-[var(--border-color)] space-y-2">
							<span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block">
								Email Booking Confirmation &amp; Calendar (.ics)
							</span>

							<div className="flex flex-col sm:flex-row gap-2">
								<input
									type="email"
									placeholder="Enter your email..."
									style={{ backgroundColor: "var(--card-bg)" }}
									className="flex-1 border border-[var(--border-color)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
									value={sendEmailInput}
									onChange={(e) => setSendEmailInput(e.target.value)}
								/>
								<button
									type="button"
									disabled={sendingEmail || !sendEmailInput}
									onClick={handleSendEmail}
									className="px-4 py-2 bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] text-[#24180a] text-xs font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-sm whitespace-nowrap"
								>
									{sendingEmail ? "Sending..." : "✉ Send Email & .ics"}
								</button>
							</div>

							{emailStatus && (
								<p className={`text-xs font-medium mt-1 ${emailStatus.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
									{emailStatus.text}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Invoice/Receipt Template */}
				<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-8 md:p-12 rounded-2xl shadow-xl relative z-10 backdrop-blur-md print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
					{/* Header Info */}
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-[var(--border-color)] pb-6 gap-6 print:flex-row print:justify-between print:pb-8">
						<div>
							<h1 className="font-[family-name:var(--font-display)] text-3xl tracking-widest text-[var(--ink)] uppercase print:text-black">
								{data.provider.businessName}
							</h1>
							<p className="text-[10px] text-[#c8a86b] uppercase tracking-[0.3em] font-semibold mt-1">
								Esthetics Studio
							</p>
						</div>
						<div className="text-left sm:text-right text-xs text-[var(--ink-soft)] space-y-1 print:text-right print:text-black">
							<p className="font-semibold text-[var(--ink)] print:text-black">Receipt No.</p>
							<p className="font-mono text-[var(--ink)] print:text-black text-[10px]">{data.receipt.id}</p>
							<p className="pt-1 font-semibold text-[var(--ink)] print:text-black">Date</p>
							<p>{formattedCreatedDate}</p>
						</div>
					</div>

					{/* Provider & Client Billing Row */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-[var(--border-color)] text-xs print:grid-cols-2 print:py-8">
						{/* Provider info */}
						<div className="space-y-1">
							<span className="block text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold mb-2">
								Merchant Details
							</span>
							<p className="font-semibold text-[var(--ink)] print:text-black">{data.provider.name}</p>
							<p className="text-[var(--ink-soft)]">{data.provider.address}</p>
							<p className="text-[var(--ink-soft)]">{data.provider.email}</p>
							<p className="text-[var(--ink-soft)]">{data.provider.phone}</p>
						</div>

						{/* Client info */}
						<div className="space-y-1 sm:text-right print:text-right">
							<span className="block text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold mb-2 print:text-right">
								Payment From
							</span>
							<p className="font-semibold text-[var(--ink)] print:text-black">{data.receipt.clientEmail || "Customer"}</p>
							<p className="text-[var(--ink-soft)]">Client Reservation</p>
						</div>
					</div>

					{/* Line Items Table */}
					<div className="py-8 border-b border-[var(--border-color)] print:py-8">
						<table className="w-full text-left text-xs">
							<thead>
								<tr className="text-[var(--ink-soft)] uppercase text-[10px] tracking-wider border-b border-[var(--border-color)] pb-2">
									<th className="pb-2 font-semibold">Description</th>
									<th className="pb-2 text-right font-semibold">Amount</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-[var(--border-color)]/50">
									<td className="py-4 pr-4">
										<p className="font-medium text-sm text-[var(--ink)] print:text-black">
											{data.receipt.description}
										</p>
										<p className="text-[10px] text-[var(--ink-soft)] mt-1 font-medium capitalize">
											Category: {data.receipt.kind.replace("_", " ")}
										</p>
										{data.receipt.bookingDate && (
											<p className="text-[10px] text-[var(--ink-soft)] mt-0.5">
												Service: {data.receipt.bookingServiceName} on{" "}
												{format(new Date(data.receipt.bookingDate), "PP · p")}
											</p>
										)}
									</td>
									<td className="py-4 text-right font-semibold text-sm text-[var(--ink)] print:text-black font-mono">
										{formatCad(data.receipt.amountCents)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					{/* Totals & Payments Details */}
					<div className="pt-8 border-t border-[var(--border-color)]/30 print:pt-8">
						<div className="flex flex-col sm:flex-row sm:justify-between items-start gap-8">
							{/* Payment details */}
							<div className="text-[10px] text-[var(--ink-soft)] space-y-1.5 order-2 sm:order-1 sm:max-w-[60%]">
								<p className="font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-3">
									Transaction Info
								</p>
								<div className="space-y-1.5">
									<p>
										Payment Method: <span className="font-medium text-[var(--ink)] print:text-black">{data.paymentMethod}</span>
									</p>
									{sessionId && (
										<p className="break-all">
											Stripe Session: <span className="font-mono text-[var(--ink)] print:text-black text-[9px]">{sessionId}</span>
										</p>
									)}
									<p>
										Status: <span className="font-semibold text-emerald-500 tracking-wide uppercase">{data.paymentStatus}</span>
									</p>
								</div>
							</div>

							{/* Totals */}
							<div className="w-full sm:w-auto text-right space-y-2 order-1 sm:order-2 self-stretch sm:self-auto text-xs">
								<div className="h-4 select-none mb-3 print:hidden" aria-hidden="true" />
								<div className="space-y-2">
									{b && (
										<div className="flex justify-between sm:justify-end gap-12">
											<span className="text-[var(--ink-soft)] whitespace-nowrap">Treatment Total</span>
											<span className="font-mono font-medium text-[var(--ink)] print:text-black">
												{formatCad(b.totalCents)}
											</span>
										</div>
									)}
									<div className="flex justify-between sm:justify-end gap-12">
										<span className="text-[var(--ink-soft)] whitespace-nowrap">Deposit Paid Today</span>
										<span className="font-mono font-medium text-emerald-400 print:text-black">
											{formatCad(data.receipt.amountCents)}
										</span>
									</div>
									{b && (
										<div className="flex justify-between sm:justify-end gap-12 border-t border-[var(--border-color)]/30 pt-1.5">
											<span className="text-[var(--ink-soft)] whitespace-nowrap">Balance Due at Studio</span>
											<span className="font-mono font-medium text-[#c8a86b] print:text-black">
												{formatCad(b.balanceDueCents)}
											</span>
										</div>
									)}
									<div className="flex justify-between sm:justify-end gap-12 text-sm font-semibold border-t border-[var(--border-color)] pt-3 text-[var(--ink)] print:text-black">
										<span className="whitespace-nowrap">Total Charged Today</span>
										<span className="font-mono text-base text-[#c8a86b] print:text-black">
											{formatCad(data.receipt.amountCents)}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Signature / Footer */}
					<div className="mt-16 text-center text-[10px] text-[var(--ink-soft)] border-t border-[var(--border-color)]/40 pt-6 space-y-1 print:mt-24 print:pt-6">
						<p>Thank you for choosing Mari Esthetics!</p>
						<p className="opacity-75">If you have any questions about this appointment receipt, please contact us.</p>
					</div>
				</div>
			</div>

			{/* Global Print Optimized Media Stylesheet */}
			<style dangerouslySetInnerHTML={{
				__html: `
					@media print {
						body {
							background: white !important;
							color: black !important;
						}
						.print\\:hidden {
							display: none !important;
						}
						.print\\:text-black {
							color: black !important;
						}
						.print\\:border-none {
							border: none !important;
						}
						.print\\:bg-white {
							background: white !important;
						}
						.print\\:shadow-none {
							box-shadow: none !important;
						}
						.print\\:max-w-full {
							max-width: 100% !important;
							width: 100% !important;
						}
						.print\\:p-0 {
							padding: 0 !important;
						}
						.print\\:m-0 {
							margin: 0 !important;
						}
						.print\\:mt-24 {
							margin-top: 6rem !important;
						}
						.print\\:pb-8 {
							padding-bottom: 2rem !important;
						}
						.print\\:py-8 {
							padding-top: 2rem !important;
							padding-bottom: 2rem !important;
						}
						.print\\:pt-8 {
							padding-top: 2rem !important;
						}
						.print\\:grid-cols-2 {
							grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
						}
						.print\\:flex-row {
							flex-direction: row !important;
						}
						.print\\:justify-between {
							justify-content: space-between !important;
						}
					}
				`
			}} />
		</div>
	);
}

export default function PaymentLinkPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
				<div className="text-center space-y-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8a86b] border-t-transparent mx-auto" />
					<p className="text-sm text-[var(--ink-soft)]">Loading page components...</p>
				</div>
			</div>
		}>
			<PaymentLinkContent />
		</Suspense>
	);
}
