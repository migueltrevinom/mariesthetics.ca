"use client";

import { useState } from "react";
import { format } from "date-fns";
import { formatCad } from "@/lib/money";

interface PaymentItem {
	_id: string;
	createdAt: string;
	kind: string;
	method: string;
	amountCents: number;
	status: string;
}

interface PaymentsManagerProps {
	initialPayments: PaymentItem[];
}

export function PaymentsManager({ initialPayments }: PaymentsManagerProps) {
	const [payments] = useState<PaymentItem[]>(initialPayments);

	// Modal States
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [generatedUrl, setGeneratedUrl] = useState("");
	const [copied, setCopied] = useState(false);

	// Form States
	const [amountCad, setAmountCad] = useState("");
	const [description, setDescription] = useState("");
	const [kind, setKind] = useState<"deposit" | "balance" | "tip" | "custom">("custom");
	const [clientEmail, setClientEmail] = useState("");
	const [bookingId, setBookingId] = useState("");

	const handleOpen = () => {
		setIsOpen(true);
		setError("");
		setGeneratedUrl("");
		setCopied(false);
		setAmountCad("");
		setDescription("");
		setKind("custom");
		setClientEmail("");
		setBookingId("");
	};

	const handleCreateLink = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setGeneratedUrl("");

		try {
			const res = await fetch("/api/admin/payments/create-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amountCad: parseFloat(amountCad),
					description: description.trim(),
					kind,
					clientEmail: clientEmail.trim() || undefined,
					bookingId: bookingId.trim() || undefined,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to generate link");
			}

			setGeneratedUrl(data.url);
		} catch (err: any) {
			setError(err.message || "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleCopy = () => {
		if (!generatedUrl) return;
		void navigator.clipboard.writeText(generatedUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="w-full text-left">
			{/* Title Row */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
						Payments
					</h1>
					<p className="mt-2 text-sm text-[var(--ink-soft)]">
						Deposits, balances, tips, and manual adjustments.
					</p>
				</div>
				<div>
					<button
						type="button"
						onClick={handleOpen}
						className="btn-primary flex items-center gap-2 !py-2.5 !px-5 text-sm cursor-pointer shadow-md hover:shadow-lg transition-all"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
						</svg>
						Create Payment Link
					</button>
				</div>
			</div>

			{/* Payments Table */}
			<div className="mt-8 overflow-x-auto">
				<table className="w-full text-left text-sm text-[var(--ink)]">
					<thead className="text-[var(--ink-soft)]/75">
						<tr>
							<th className="py-2 pr-4 font-normal">When</th>
							<th className="py-2 pr-4 font-normal">Kind</th>
							<th className="py-2 pr-4 font-normal">Method</th>
							<th className="py-2 pr-4 font-normal">Amount</th>
							<th className="py-2 font-normal">Status</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => (
							<tr key={p._id} className="border-t border-[var(--border-color)]">
								<td className="py-3 pr-4 text-[var(--ink-soft)]">
									{format(new Date(p.createdAt), "PP p")}
								</td>
								<td className="py-3 pr-4 font-medium capitalize">{p.kind}</td>
								<td className="py-3 pr-4 uppercase text-xs tracking-wider">{p.method}</td>
								<td className="py-3 pr-4 font-medium">{formatCad(p.amountCents)}</td>
								<td className="py-3 uppercase text-xs tracking-wider font-semibold">
									<span
										className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
											p.status === "succeeded"
												? "bg-leaf/10 text-leaf border border-leaf/20"
												: p.status === "pending"
													? "bg-[#c8a86b]/10 text-[#c8a86b] border border-[#c8a86b]/20"
													: "bg-blush/10 text-blush border border-blush/20"
										}`}
									>
										{p.status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{payments.length === 0 && (
					<p className="mt-6 text-sm text-[var(--ink-soft)]">No payments yet.</p>
				)}
			</div>

			{/* Create Payment Link Modal */}
			{isOpen && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--background)] p-6 rounded-2xl shadow-2xl text-left max-h-[90vh] overflow-y-auto transition-colors duration-200">
						<div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
							<h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
								Create Payment Link
							</h2>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm cursor-pointer px-2 py-1"
							>
								✕
							</button>
						</div>

						{error && (
							<div className="mt-4 border border-[#e8a0a2]/20 bg-[#e8a0a2]/5 px-4 py-2.5 rounded-lg text-xs text-[#e8a0a2]">
								{error}
							</div>
						)}

						{generatedUrl ? (
							<div className="mt-6 space-y-4">
								<div className="border border-leaf/20 bg-leaf/5 px-4 py-3.5 rounded-xl text-sm text-leaf flex items-start gap-2.5">
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="shrink-0 mt-0.5"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
									<div>
										<p className="font-semibold">Stripe Link Generated</p>
										<p className="text-xs opacity-90 mt-0.5">
											Copy the link below and send it to your client.
										</p>
									</div>
								</div>

								<div>
									<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
										Payment URL
									</label>
									<div className="flex gap-2">
										<input
											type="text"
											readOnly
											value={generatedUrl}
											className="flex-1 border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-xs text-[var(--ink)] select-all focus:outline-none"
										/>
										<button
											type="button"
											onClick={handleCopy}
											className={`px-4 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
												copied
													? "bg-leaf/10 text-leaf border-leaf/20"
													: "bg-[var(--card-bg)] text-[var(--ink)] border-[var(--border-color)] hover:border-gold"
											}`}
										>
											{copied ? "Copied!" : "Copy"}
										</button>
									</div>
								</div>

								<div className="pt-2 flex gap-2">
									<a
										href={generatedUrl}
										target="_blank"
										rel="noreferrer"
										className="flex-1 btn-primary text-center text-xs font-semibold py-3 rounded-xl block cursor-pointer"
									>
										Open Payment Page
									</a>
									<button
										type="button"
										onClick={() => setGeneratedUrl("")}
										className="px-4 border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--ink)] hover:border-gold cursor-pointer"
									>
										Generate Another
									</button>
								</div>
							</div>
						) : (
							<form onSubmit={handleCreateLink} className="mt-4 space-y-4 text-[var(--ink)]">
								{/* Amount & Kind */}
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
											Amount (CAD) *
										</label>
										<input
											type="number"
											step="0.01"
											min="0.50"
											required
											placeholder="100.00"
											className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
											value={amountCad}
											onChange={(e) => setAmountCad(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
											Payment Kind *
										</label>
										<select
											className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
											value={kind}
											onChange={(e) => setKind(e.target.value as any)}
										>
											<option value="custom" className="bg-[var(--background)]">
												Custom Amount
											</option>
											<option value="deposit" className="bg-[var(--background)]">
												Deposit
											</option>
											<option value="balance" className="bg-[var(--background)]">
												Remaining Balance
											</option>
											<option value="tip" className="bg-[var(--background)]">
												Tip / Gratuity
											</option>
										</select>
									</div>
								</div>

								{/* Description */}
								<div>
									<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
										Description *
									</label>
									<input
										type="text"
										required
										placeholder="e.g. Lash Lift Deposit, Custom Tip"
										className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
									/>
								</div>

								{/* Optional fields: email & booking ID */}
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1 text-ellipsis overflow-hidden whitespace-nowrap">
											Client Email (optional)
										</label>
										<input
											type="email"
											placeholder="client@example.com"
											className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
											value={clientEmail}
											onChange={(e) => setClientEmail(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1 text-ellipsis overflow-hidden whitespace-nowrap">
											Booking ID (optional)
										</label>
										<input
											type="text"
											placeholder="booking _id"
											className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
											value={bookingId}
											onChange={(e) => setBookingId(e.target.value)}
										/>
									</div>
								</div>

								{/* Submit */}
								<div className="pt-2">
									<button
										type="submit"
										disabled={loading}
										className="w-full bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] text-[#24180a] font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-md hover:shadow-lg"
									>
										{loading ? "Generating Link..." : "Create Link"}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
