"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatCad } from "@/lib/money";

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

	const success = searchParams.get("success") === "true";
	const cancelled = searchParams.get("cancelled") === "true";
	const sessionId = searchParams.get("session_id") || "";

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [data, setData] = useState<ReceiptData | null>(null);

	useEffect(() => {
		if (cancelled) {
			setLoading(false);
			return;
		}

		if (!sessionId) {
			setError("Invalid payment session. Session ID is missing.");
			setLoading(false);
			return;
		}

		const fetchReceipt = async () => {
			try {
				const res = await fetch(`/api/public/checkout-session?session_id=${sessionId}`);
				const json = await res.json();
				if (!res.ok) {
					throw new Error(json.error || "Failed to load receipt details.");
				}
				setData(json);
			} catch (err: any) {
				setError(err.message || "An error occurred loading receipt.");
			} finally {
				setLoading(false);
			}
		};

		void fetchReceipt();
	}, [sessionId, cancelled]);

	const handlePrint = () => {
		window.print();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
				<div className="text-center space-y-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto" />
					<p className="text-sm text-[var(--ink-soft)]">Retrieving payment status...</p>
				</div>
			</div>
		);
	}

	if (cancelled) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6 py-12 relative overflow-hidden">
				<div className="aurora pointer-events-none" />
				<div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--card-bg)] p-8 rounded-2xl shadow-xl text-center relative z-10 backdrop-blur-md">
					<div className="w-16 h-16 bg-blush/10 text-blush border border-blush/20 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
						✕
					</div>
					<h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
						Payment Cancelled
					</h1>
					<p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
						Your checkout session was cancelled or could not be completed. No charges were made.
					</p>
					<div className="mt-8 space-y-2">
						<Link href="/" className="btn-primary w-full text-center block !py-3 text-sm">
							Return to Home
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
					<div className="w-16 h-16 bg-blush/10 text-blush border border-blush/20 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
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

	const isPaid = data.paymentStatus === "paid";
	const formattedDate = format(new Date(data.receipt.createdAt), "PPpp");

	return (
		<div className="min-h-screen bg-[var(--background)] px-4 pt-16 pb-8 md:pt-24 md:pb-16 relative overflow-hidden print:bg-white print:p-0">
			<div className="aurora pointer-events-none print:hidden" />
			{isPaid && <ConfettiEffect />}

			<div className="max-w-xl mx-auto space-y-6 relative z-10 print:max-w-full print:my-0">
				{/* Top Status Card */}
				<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-md text-center backdrop-blur-sm print:hidden">
					{isPaid ? (
						<>
							<div className="w-12 h-12 bg-leaf/10 text-leaf border border-leaf/20 rounded-full flex items-center justify-center mx-auto text-xl mb-3 animate-bounce">
								✓
							</div>
							<h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
								Payment Successful!
							</h2>
							<p className="mt-1 text-xs text-[var(--ink-soft)]">
								Your payment has been securely processed. Thank you!
							</p>
						</>
					) : (
						<>
							<div className="w-12 h-12 bg-[#c8a86b]/10 text-[#c8a86b] border border-[#c8a86b]/20 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
								⏳
							</div>
							<h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
								Payment Pending
							</h2>
							<p className="mt-1 text-xs text-[var(--ink-soft)]">
								We are awaiting authorization confirmation from Stripe.
							</p>
						</>
					)}

					<div className="mt-5 flex gap-2 justify-center">
						<button
							type="button"
							onClick={handlePrint}
							className="px-4 py-2 border border-[var(--border-color)] hover:border-gold rounded-xl text-xs font-semibold text-[var(--ink)] bg-[var(--card-bg)] cursor-pointer flex items-center gap-1.5 transition-all"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
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

				{/* Invoice/Receipt Template */}
				<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-8 md:p-12 rounded-2xl shadow-xl relative z-10 backdrop-blur-md print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
					{/* Header Info */}
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-[var(--border-color)] pb-6 gap-6 print:flex-row print:justify-between print:pb-8">
						<div>
							<h1 className="font-[family-name:var(--font-display)] text-3xl tracking-widest text-[var(--ink)] uppercase print:text-black">
								{data.provider.businessName}
							</h1>
							<p className="text-[10px] text-gold uppercase tracking-[0.3em] font-semibold mt-1">
								Esthetics Studio
							</p>
						</div>
						<div className="text-left sm:text-right text-xs text-[var(--ink-soft)] space-y-1 print:text-right print:text-black">
							<p className="font-semibold text-[var(--ink)] print:text-black">Receipt No.</p>
							<p className="font-mono text-[var(--ink)] print:text-black text-[10px]">{data.receipt.id}</p>
							<p className="pt-1 font-semibold text-[var(--ink)] print:text-black">Date</p>
							<p>{formattedDate}</p>
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
							<p className="font-semibold text-[var(--ink)] print:text-black">{data.receipt.clientEmail}</p>
							<p className="text-[var(--ink-soft)]">Customer</p>
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
											Category: {data.receipt.kind}
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
									<p className="break-all">
										Stripe Session: <span className="font-mono text-[var(--ink)] print:text-black text-[9px]">{sessionId}</span>
									</p>
									<p>
										Status: <span className="font-semibold text-leaf tracking-wide uppercase">{data.paymentStatus}</span>
									</p>
								</div>
							</div>

							{/* Totals */}
							<div className="w-full sm:w-auto text-right space-y-2 order-1 sm:order-2 self-stretch sm:self-auto text-xs">
								{/* Symmetrical header placeholder to align right values with left labels */}
								<div className="h-4 select-none mb-3 print:hidden" aria-hidden="true" />
								<div className="space-y-2">
									<div className="flex justify-between sm:justify-end gap-12">
										<span className="text-[var(--ink-soft)] whitespace-nowrap">Subtotal</span>
										<span className="font-mono font-medium text-[var(--ink)] print:text-black">
											{formatCad(data.receipt.amountCents)}
										</span>
									</div>
									<div className="flex justify-between sm:justify-end gap-12 border-t border-[var(--border-color)]/30 pt-1.5">
										<span className="text-[var(--ink-soft)] whitespace-nowrap">Tax / GST (5%)</span>
										<span className="font-mono font-medium text-[var(--ink)] print:text-black">
											{formatCad(0)}
										</span>
									</div>
									<div className="flex justify-between sm:justify-end gap-12 text-sm font-semibold border-t border-[var(--border-color)] pt-3 text-[var(--ink)] print:text-black">
										<span className="whitespace-nowrap">Total Paid</span>
										<span className="font-mono text-base text-gold print:text-black">
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
						<p className="opacity-75">If you have any questions about this receipt, please contact us.</p>
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
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto" />
					<p className="text-sm text-[var(--ink-soft)]">Loading page components...</p>
				</div>
			</div>
		}>
			<PaymentLinkContent />
		</Suspense>
	);
}
