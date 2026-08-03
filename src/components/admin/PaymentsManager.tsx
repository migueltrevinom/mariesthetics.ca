"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

interface StripePaymentLinkItem {
	_id: string;
	createdAt: string;
	amountCents: number;
	kind: string;
	description: string;
	stripePaymentLinkUrl: string;
	stripeSessionId: string;
	status: string;
	clientEmail: string;
	booking?: {
		_id: string;
		start: string;
	} | null;
}

interface ClientOption {
	id: string;
	name: string;
	email: string;
	phone?: string;
}

interface BookingOption {
	_id: string;
	start: string;
	status: string;
	serviceId?: {
		name: string;
		depositCents: number;
		priceCents: number;
	};
	paymentSummary?: {
		depositCents: number;
		balanceDueCents: number;
		totalCents: number;
	};
}

interface EtransferPaymentItem {
	_id: string;
	createdAt: string;
	kind: string;
	amountCents: number;
	status: string;
	referenceNumber?: string;
	note?: string;
	proofUrl?: string;
	booking?: {
		_id: string;
		start: string;
		guestName?: string;
		guestEmail?: string;
		serviceName?: string;
	} | null;
}

interface EtransferSettingsItem {
	accountName: string;
	email: string;
	phone: string;
	autoDepositEnabled: boolean;
	instructions: string;
	updatedBy?: string;
}

interface PaymentsManagerProps {
	initialPayments: PaymentItem[];
	initialPaymentLinks: StripePaymentLinkItem[];
	initialEtransfers?: EtransferPaymentItem[];
	initialEtransferSettings?: EtransferSettingsItem;
}

export function PaymentsManager({
	initialPayments,
	initialPaymentLinks,
	initialEtransfers = [],
	initialEtransferSettings = {
		accountName: "Mari Esthetics / Marinelle Tala",
		email: "mari@mariesthetics.ca",
		phone: "+1 7809133081",
		autoDepositEnabled: true,
		instructions: "Please include your appointment date and full name in the e-Transfer note.",
	},
}: PaymentsManagerProps) {
	const [payments] = useState<PaymentItem[]>(initialPayments);
	const [paymentLinks, setPaymentLinks] = useState<StripePaymentLinkItem[]>(initialPaymentLinks);
	const [etransfers, setEtransfers] = useState<EtransferPaymentItem[]>(initialEtransfers);
	const [etSettings, setEtSettings] = useState<EtransferSettingsItem>(initialEtransferSettings);

	const searchParams = useSearchParams();
	const router = useRouter();
	const tabParam = searchParams.get("tab");

	// Navigation Tabs
	const [activeTab, setActiveTab] = useState<"transactions" | "links" | "etransfers">("transactions");

	useEffect(() => {
		if (tabParam === "links") {
			setActiveTab("links");
		} else if (tabParam === "etransfers") {
			setActiveTab("etransfers");
		} else {
			setActiveTab("transactions");
		}
	}, [tabParam]);

	const handleTabChange = (tab: "transactions" | "links" | "etransfers") => {
		setActiveTab(tab);
		router.replace(`/admin/payments?tab=${tab}`);
	};

	// e-Transfer Settings States
	const [savingSettings, setSavingSettings] = useState(false);
	const [settingsMsg, setSettingsMsg] = useState("");
	const [settingsErr, setSettingsErr] = useState("");

	// Manual e-Transfer Recording Form States
	const [manualEtName, setManualEtName] = useState("");
	const [manualEtEmail, setManualEtEmail] = useState("");
	const [manualEtAmount, setManualEtAmount] = useState("");
	const [manualEtRef, setManualEtRef] = useState("");
	const [manualEtKind, setManualEtKind] = useState<"deposit" | "balance" | "tip" | "adjustment">("balance");
	const [manualEtBookingId, setManualEtBookingId] = useState("");
	const [manualEtNote, setManualEtNote] = useState("");
	const [recordingEt, setRecordingEt] = useState(false);
	const [recordEtMsg, setRecordEtMsg] = useState("");
	const [recordEtErr, setRecordEtErr] = useState("");

	async function handleSaveEtransferSettings() {
		setSavingSettings(true);
		setSettingsMsg("");
		setSettingsErr("");
		try {
			const res = await fetch("/api/admin/payments/etransfer-settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(etSettings),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to save settings");
			setSettingsMsg("e-Transfer account details saved successfully!");
		} catch (err: any) {
			setSettingsErr(err.message || "Failed to save settings");
		} finally {
			setSavingSettings(false);
		}
	}

	async function handleRecordEtransfer() {
		if (!manualEtAmount || Number(manualEtAmount) <= 0) {
			setRecordEtErr("Please enter a valid amount.");
			return;
		}
		setRecordingEt(true);
		setRecordEtMsg("");
		setRecordEtErr("");
		try {
			const res = await fetch("/api/admin/payments/record-etransfer", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amountCad: Number(manualEtAmount),
					referenceNumber: manualEtRef,
					bookingId: manualEtBookingId,
					kind: manualEtKind,
					note: manualEtNote,
					clientName: manualEtName,
					clientEmail: manualEtEmail,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to record e-Transfer");
			
			setRecordEtMsg("Manual e-Transfer recorded successfully!");
			setManualEtAmount("");
			setManualEtRef("");
			setManualEtNote("");
			setManualEtName("");
			setManualEtEmail("");
			setManualEtBookingId("");
			
			if (data.payment) {
				setEtransfers((prev) => [
					{
						_id: String(data.payment._id),
						createdAt: new Date().toISOString(),
						kind: data.payment.kind,
						amountCents: data.payment.amountCents,
						status: "succeeded",
						referenceNumber: data.payment.referenceNumber,
						note: data.payment.note,
					},
					...prev,
				]);
			}
			router.refresh();
		} catch (err: any) {
			setRecordEtErr(err.message || "Failed to record e-Transfer");
		} finally {
			setRecordingEt(false);
		}
	}

	// Modal States
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [generatedUrl, setGeneratedUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const [copiedLinkId, setCopiedLinkId] = useState("");
	const [syncingLinkId, setSyncingLinkId] = useState("");
	const [syncedLinkId, setSyncedLinkId] = useState("");

	// Client Search & Bookings load
	const [searchQuery, setSearchQuery] = useState("");
	const [searchingClients, setSearchingClients] = useState(false);
	const [localClients, setLocalClients] = useState<ClientOption[]>([]);
	const [selectedClientId, setSelectedClientId] = useState("");

	const [clientBookings, setClientBookings] = useState<BookingOption[]>([]);
	const [loadingBookings, setLoadingBookings] = useState(false);

	// Form States
	const [amountCad, setAmountCad] = useState("");
	const [description, setDescription] = useState("");
	const [kind, setKind] = useState<"deposit" | "balance" | "tip" | "custom">("custom");
	const [clientEmail, setClientEmail] = useState("");
	const [bookingId, setBookingId] = useState("");

	// Debounced client search
	useEffect(() => {
		if (!searchQuery.trim()) {
			setLocalClients([]);
			return;
		}

		const delayDebounce = setTimeout(async () => {
			setSearchingClients(true);
			try {
				const res = await fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}&limit=20&page=1`);
				if (res.ok) {
					const data = await res.json();
					const formatted = (data.clients || []).map((c: any) => ({
						id: String(c._id),
						name: c.name,
						email: c.email,
						phone: c.phone || "",
					}));
					setLocalClients(formatted);
				}
			} catch (err) {
				console.error("Failed to search clients", err);
			} finally {
				setSearchingClients(false);
			}
		}, 300);

		return () => clearTimeout(delayDebounce);
	}, [searchQuery]);

	// Load bookings for selected client
	useEffect(() => {
		if (!selectedClientId) {
			setClientBookings([]);
			return;
		}

		const fetchBookings = async () => {
			setLoadingBookings(true);
			try {
				const res = await fetch(`/api/clients/details?id=${selectedClientId}`);
				if (res.ok) {
					const data = await res.json();
					setClientBookings(data.bookings || []);
				}
			} catch (err) {
				console.error("Failed to fetch client bookings", err);
			} finally {
				setLoadingBookings(false);
			}
		};

		void fetchBookings();
	}, [selectedClientId]);

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
		setSearchQuery("");
		setSelectedClientId("");
		setClientBookings([]);
	};

	const handleClientSelect = (clientId: string) => {
		setSelectedClientId(clientId);
		const chosen = localClients.find((c) => c.id === clientId);
		if (chosen) {
			setClientEmail(chosen.email);
			setBookingId(""); // Reset booking select
		}
	};

	const handleBookingSelect = (bId: string) => {
		setBookingId(bId);
		const chosen = clientBookings.find((b) => b._id === bId);
		if (chosen) {
			const serviceName = chosen.serviceId?.name || "Service";

			if (kind === "deposit") {
				setDescription(`${serviceName} Deposit`);
				if (chosen.paymentSummary) {
					setAmountCad((chosen.paymentSummary.depositCents / 100).toFixed(2));
				}
			} else if (kind === "balance") {
				setDescription(`${serviceName} Balance`);
				if (chosen.paymentSummary) {
					setAmountCad((chosen.paymentSummary.balanceDueCents / 100).toFixed(2));
				}
			} else if (kind === "tip") {
				setDescription(`${serviceName} Tip`);
				setAmountCad("");
			} else {
				setDescription(`${serviceName} Custom Payment`);
				if (chosen.paymentSummary) {
					setAmountCad((chosen.paymentSummary.totalCents / 100).toFixed(2));
				}
			}
		}
	};

	const handleKindChange = (newKind: "deposit" | "balance" | "tip" | "custom") => {
		setKind(newKind);
		if (bookingId) {
			const chosen = clientBookings.find((b) => b._id === bookingId);
			if (chosen) {
				const serviceName = chosen.serviceId?.name || "Service";
				if (newKind === "deposit") {
					setDescription(`${serviceName} Deposit`);
					if (chosen.paymentSummary) {
						setAmountCad((chosen.paymentSummary.depositCents / 100).toFixed(2));
					}
				} else if (newKind === "balance") {
					setDescription(`${serviceName} Balance`);
					if (chosen.paymentSummary) {
						setAmountCad((chosen.paymentSummary.balanceDueCents / 100).toFixed(2));
					}
				} else if (newKind === "tip") {
					setDescription(`${serviceName} Tip`);
					setAmountCad("");
				} else {
					setDescription(`${serviceName} Custom Payment`);
					if (chosen.paymentSummary) {
						setAmountCad((chosen.paymentSummary.totalCents / 100).toFixed(2));
					}
				}
			}
		}
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

			// Append new payment link to state for live updates
			if (data.link) {
				const chosenBooking = bookingId ? clientBookings.find((b) => b._id === bookingId) : null;
				const formattedNewLink: StripePaymentLinkItem = {
					_id: String(data.link._id),
					createdAt: new Date(data.link.createdAt).toISOString(),
					amountCents: data.link.amountCents,
					kind: data.link.kind,
					description: data.link.description,
					stripePaymentLinkUrl: data.link.stripePaymentLinkUrl,
					stripeSessionId: data.link.stripeSessionId,
					status: data.link.status,
					clientEmail: data.link.clientEmail || "",
					booking: data.link.bookingId
						? {
								_id: String(data.link.bookingId),
								start: chosenBooking?.start ? new Date(chosenBooking.start).toISOString() : "",
							}
						: null,
				};
				setPaymentLinks((prev) => [formattedNewLink, ...prev]);
			}
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

	const handleCopyTableLink = (id: string, url: string) => {
		void navigator.clipboard.writeText(url);
		setCopiedLinkId(id);
		setTimeout(() => setCopiedLinkId(""), 2000);
	};

	const handleSync = async (linkId: string, sessionId: string) => {
		setSyncingLinkId(linkId);
		try {
			const res = await fetch("/api/admin/payments/sync-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ stripeSessionId: sessionId }),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to sync status");
			}

			// Update the link's status in the local state table!
			setPaymentLinks((prev) =>
				prev.map((l) => (l._id === linkId ? { ...l, status: data.status } : l))
			);
			setSyncedLinkId(linkId);
			setTimeout(() => setSyncedLinkId(""), 2000);
		} catch (err: any) {
			alert(err.message || "An error occurred during synchronization");
		} finally {
			setSyncingLinkId("");
		}
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

			{/* Tab Switcher */}
			<div className="mt-6 flex border-b border-[var(--border-color)] text-sm font-medium">
				<button
					type="button"
					onClick={() => handleTabChange("transactions")}
					className={`pb-3 px-4 border-b-2 cursor-pointer transition-all duration-200 ${
						activeTab === "transactions"
							? "border-[#c8a86b] text-[#c8a86b] font-semibold"
							: "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
					}`}
				>
					Transactions
				</button>
				<button
					type="button"
					onClick={() => handleTabChange("links")}
					className={`pb-3 px-4 border-b-2 cursor-pointer transition-all duration-200 ${
						activeTab === "links"
							? "border-[#c8a86b] text-[#c8a86b] font-semibold"
							: "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
					}`}
				>
					Stripe Payment Links
				</button>
				<button
					type="button"
					onClick={() => handleTabChange("etransfers")}
					className={`pb-3 px-4 border-b-2 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
						activeTab === "etransfers"
							? "border-[#c8a86b] text-[#c8a86b] font-semibold"
							: "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
					}`}
				>
					<span>🏦 Interac e-Transfers</span>
				</button>
			</div>

			{/* Table Content */}
			<div className="mt-6 overflow-x-auto">
				{activeTab === "etransfers" && (
					<div className="space-y-8 mt-4 text-left">
						{/* 1. STUDIO E-TRANSFER RECEIVING ACCOUNT DETAILS CARD */}
						<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
								<div>
									<h2 className="text-xl font-[family-name:var(--font-display)] text-[var(--ink)] flex items-center gap-2">
										<span>🏦 Studio Interac e-Transfer Receiving Account</span>
									</h2>
									<p className="text-xs text-[var(--ink-soft)] mt-1">
										Configure your official full name, email, and phone number linked to your studio e-Transfer receiving account.
									</p>
								</div>
								<button
									type="button"
									disabled={savingSettings}
									onClick={() => void handleSaveEtransferSettings()}
									className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md shrink-0 cursor-pointer disabled:opacity-50"
								>
									{savingSettings ? "Saving..." : "💾 Save Account Details"}
								</button>
							</div>

							{settingsMsg && (
								<div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
									✓ {settingsMsg}
								</div>
							)}
							{settingsErr && (
								<div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
									⚠️ {settingsErr}
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Full Name Linked to Account
									</label>
									<input
										type="text"
										value={etSettings.accountName}
										onChange={(e) => setEtSettings({ ...etSettings, accountName: e.target.value })}
										placeholder="e.g. Marinelle Tala / Mari Esthetics"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-medium"
									/>
								</div>

								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										e-Transfer Email Address
									</label>
									<input
										type="email"
										value={etSettings.email}
										onChange={(e) => setEtSettings({ ...etSettings, email: e.target.value })}
										placeholder="e.g. mari@mariesthetics.ca"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-mono"
									/>
								</div>

								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										e-Transfer Phone Number
									</label>
									<input
										type="tel"
										value={etSettings.phone}
										onChange={(e) => setEtSettings({ ...etSettings, phone: e.target.value })}
										placeholder="e.g. +1 7809133081"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-mono"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
								<div className="space-y-3">
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block">
										Auto-Deposit Configuration
									</label>
									<label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-black/20 cursor-pointer">
										<input
											type="checkbox"
											checked={etSettings.autoDepositEnabled}
											onChange={(e) => setEtSettings({ ...etSettings, autoDepositEnabled: e.target.checked })}
											className="w-4 h-4 accent-[#c8a86b] rounded cursor-pointer"
										/>
										<span className="text-xs font-semibold text-[var(--ink)]">
											⚡ Interac Auto-Deposit Enabled (No security password required)
										</span>
									</label>
								</div>

								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Client Payment Memo / Instructions
									</label>
									<textarea
										rows={2}
										value={etSettings.instructions}
										onChange={(e) => setEtSettings({ ...etSettings, instructions: e.target.value })}
										placeholder="e.g. Please include your appointment date and full name in the e-Transfer note."
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
									/>
								</div>
							</div>

							{/* Live Customer Preview */}
							<div className="p-4 rounded-xl border border-[#c8a86b]/30 bg-[#c8a86b]/5 space-y-1.5">
								<span className="text-[10px] uppercase font-bold tracking-wider text-[#c8a86b] block">
									🔍 Live Checkout Preview (What clients see when paying via e-Transfer)
								</span>
								<div className="text-xs text-[var(--ink)] space-y-1 font-mono">
									<p><strong>Account Name:</strong> {etSettings.accountName}</p>
									<p><strong>Email:</strong> {etSettings.email}</p>
									<p><strong>Phone:</strong> {etSettings.phone}</p>
									<p><strong>Status:</strong> {etSettings.autoDepositEnabled ? "⚡ Auto-Deposit Enabled" : "🔒 Password Required"}</p>
									<p className="italic text-[var(--ink-soft)] font-sans">"{etSettings.instructions}"</p>
								</div>
							</div>
						</div>

						{/* 2. RECORD MANUAL E-TRANSFER CARD */}
						<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-5">
							<div>
								<h2 className="text-xl font-[family-name:var(--font-display)] text-[var(--ink)]">
									📝 Record Manual Interac e-Transfer
								</h2>
								<p className="text-xs text-[var(--ink-soft)] mt-1">
									Manually log e-Transfers received directly in bank account.
								</p>
							</div>

							{recordEtMsg && (
								<div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
									✓ {recordEtMsg}
								</div>
							)}
							{recordEtErr && (
								<div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
									⚠️ {recordEtErr}
								</div>
							)}

							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Sender / Client Name
									</label>
									<input
										type="text"
										value={manualEtName}
										onChange={(e) => setManualEtName(e.target.value)}
										placeholder="e.g. Sarah Johns"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
									/>
								</div>

								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Client Email
									</label>
									<input
										type="email"
										value={manualEtEmail}
										onChange={(e) => setManualEtEmail(e.target.value)}
										placeholder="e.g. sarah@verifik.co"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-mono"
									/>
								</div>

								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Amount ($ CAD) *
									</label>
									<input
										type="number"
										step="0.01"
										value={manualEtAmount}
										onChange={(e) => setManualEtAmount(e.target.value)}
										placeholder="e.g. 90.00"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-mono font-bold"
									/>
								</div>

								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Interac Ref / Confirmation #
									</label>
									<input
										type="text"
										value={manualEtRef}
										onChange={(e) => setManualEtRef(e.target.value)}
										placeholder="e.g. CA12345678"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-mono"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Payment Type
									</label>
									<select
										value={manualEtKind}
										onChange={(e: any) => setManualEtKind(e.target.value)}
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] cursor-pointer"
									>
										<option value="balance">Remaining Balance</option>
										<option value="deposit">Deposit ($30.00)</option>
										<option value="tip">Gratuity / Tip</option>
										<option value="adjustment">Manual Adjustment</option>
									</select>
								</div>

								<div className="sm:col-span-2">
									<label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block mb-1">
										Notes / Details
									</label>
									<input
										type="text"
										value={manualEtNote}
										onChange={(e) => setManualEtNote(e.target.value)}
										placeholder="e.g. Verified in RBC online banking app"
										className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
									/>
								</div>
							</div>

							<div className="flex justify-end pt-2">
								<button
									type="button"
									disabled={recordingEt || !manualEtAmount}
									onClick={() => void handleRecordEtransfer()}
									className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
								>
									{recordingEt ? "Recording..." : "+ Record e-Transfer Payment"}
								</button>
							</div>
						</div>

						{/* 3. INTERAC E-TRANSFERS DATA TABLE */}
						<div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm space-y-4">
							<h2 className="text-xl font-[family-name:var(--font-display)] text-[var(--ink)]">
								📋 e-Transfer History ({etransfers.length})
							</h2>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm text-[var(--ink)]">
									<thead className="text-[var(--ink-soft)]/75 border-b border-[var(--border-color)]">
										<tr>
											<th className="py-2.5 pr-4 font-bold text-xs uppercase">Date</th>
											<th className="py-2.5 pr-4 font-bold text-xs uppercase">Client / Sender</th>
											<th className="py-2.5 pr-4 font-bold text-xs uppercase">Interac Ref #</th>
											<th className="py-2.5 pr-4 font-bold text-xs uppercase">Kind</th>
											<th className="py-2.5 pr-4 font-bold text-xs uppercase">Amount</th>
											<th className="py-2.5 font-bold text-xs uppercase">Status</th>
										</tr>
									</thead>
									<tbody>
										{etransfers.map((et) => (
											<tr key={et._id} className="border-b border-[var(--border-color)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
												<td className="py-3 pr-4 text-xs font-mono text-[var(--ink-soft)]">
													{format(new Date(et.createdAt), "PP p")}
												</td>
												<td className="py-3 pr-4 font-semibold text-xs text-[var(--ink)]">
													{et.booking?.guestName || "Studio Client"}
													{et.booking?.guestEmail && (
														<span className="block text-[11px] font-mono text-[var(--ink-soft)] font-normal">
															{et.booking.guestEmail}
														</span>
													)}
												</td>
												<td className="py-3 pr-4 font-mono text-xs text-[#c8a86b]">
													{et.referenceNumber || et.note?.slice(0, 15) || "—"}
												</td>
												<td className="py-3 pr-4 font-semibold text-xs capitalize">
													{et.kind}
												</td>
												<td className="py-3 pr-4 font-bold text-xs font-mono">
													{formatCad(et.amountCents)}
												</td>
												<td className="py-3 text-xs font-bold">
													<span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
														{et.status}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
								{etransfers.length === 0 && (
									<p className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
										No e-Transfers recorded yet.
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{activeTab === "transactions" && (
					<>
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
					</>
				)}

				{activeTab === "links" && (
					<>
						<table className="w-full text-left text-sm text-[var(--ink)]">
							<thead className="text-[var(--ink-soft)]/75">
								<tr>
									<th className="py-2 pr-4 font-normal">Created</th>
									<th className="py-2 pr-4 font-normal">Kind</th>
									<th className="py-2 pr-4 font-normal">Description</th>
									<th className="py-2 pr-4 font-normal">Amount</th>
									<th className="py-2 pr-4 font-normal">Client Email</th>
									<th className="py-2 pr-4 font-normal">Booking</th>
									<th className="py-2 pr-4 font-normal">Status</th>
									<th className="py-2 text-right font-normal">Actions</th>
								</tr>
							</thead>
							<tbody>
								{paymentLinks.map((link) => (
									<tr key={link._id} className="border-t border-[var(--border-color)]">
										<td className="py-3 pr-4 text-[var(--ink-soft)] text-xs">
											{format(new Date(link.createdAt), "PP p")}
										</td>
										<td className="py-3 pr-4 font-medium capitalize text-xs">{link.kind}</td>
										<td className="py-3 pr-4 max-w-[150px] truncate text-xs">{link.description}</td>
										<td className="py-3 pr-4 font-medium text-xs">{formatCad(link.amountCents)}</td>
										<td className="py-3 pr-4 text-xs text-[var(--ink-soft)] truncate max-w-[150px]">
											{link.clientEmail || "—"}
										</td>
										<td className="py-3 pr-4 text-xs">
											{link.booking ? (
												<span className="text-[var(--ink-soft)]">
													{link.booking.start ? format(new Date(link.booking.start), "PP") : "Linked"}
												</span>
											) : (
												<span className="text-[var(--ink-soft)]/50">—</span>
											)}
										</td>
										<td className="py-3 pr-4 uppercase text-[10px] tracking-wider font-semibold">
											<span
												className={`px-2 py-0.5 rounded-full font-bold ${
													link.status === "paid"
														? "bg-leaf/10 text-leaf border border-leaf/20"
														: link.status === "pending"
															? "bg-[#c8a86b]/10 text-[#c8a86b] border border-[#c8a86b]/20"
															: "bg-blush/10 text-blush border border-blush/20"
												}`}
											>
												{link.status}
											</span>
										</td>
										<td className="py-3 text-right">
											<div className="flex justify-end gap-2">
												<a
													href={
														link.status === "paid"
															? `/payment-link?success=true&session_id=${link.stripeSessionId}`
															: link.stripePaymentLinkUrl
													}
													target="_blank"
													rel="noreferrer"
													className="px-2.5 py-1.5 border border-[var(--border-color)] hover:border-gold rounded-lg text-xs font-medium text-[var(--ink)] cursor-pointer"
												>
													{link.status === "paid" ? "Receipt" : "Open"}
												</a>
												<button
													type="button"
													onClick={() => handleCopyTableLink(link._id, link.stripePaymentLinkUrl)}
													className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-all ${
														copiedLinkId === link._id
															? "bg-leaf/10 text-leaf border-leaf/20"
															: "bg-[var(--card-bg)] text-[var(--ink)] border-[var(--border-color)] hover:border-gold"
													}`}
												>
													{copiedLinkId === link._id ? "Copied!" : "Copy"}
												</button>
												{link.status === "pending" && (
													<button
														type="button"
														disabled={syncingLinkId === link._id}
														onClick={() => handleSync(link._id, link.stripeSessionId)}
														className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-all ${
															syncingLinkId === link._id
																? "bg-[var(--card-bg)] text-[var(--ink-soft)] border-[var(--border-color)] opacity-60"
																: syncedLinkId === link._id
																	? "bg-leaf/10 text-leaf border-leaf/20"
																	: "bg-[var(--card-bg)] text-[var(--ink)] border-[var(--border-color)] hover:border-gold"
														}`}
													>
														{syncingLinkId === link._id
															? "Syncing..."
															: syncedLinkId === link._id
																? "Synced!"
																: "Sync"}
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{paymentLinks.length === 0 && (
							<p className="mt-6 text-sm text-[var(--ink-soft)]">No payment links created yet.</p>
						)}
					</>
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
								{/* Step 1: Search & Select Client (Optional, but pre-fills data) */}
								<div className="border border-[var(--border-color)] bg-white/[0.01] p-3.5 rounded-xl space-y-3">
									<span className="block text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
										Associate Client (Optional)
									</span>
									<div className="grid grid-cols-1 gap-2.5">
										<div>
											<label className="block text-[11px] font-medium text-[var(--ink-soft)] mb-1">
												Search Client (Name, Email, or Phone)
											</label>
											<input
												type="text"
												placeholder="Type client details to search..."
												className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
											/>
										</div>
										{localClients.length > 0 && (
											<div>
												<label className="block text-[11px] font-medium text-[var(--ink-soft)] mb-1">
													Select Client
												</label>
												<select
													className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
													value={selectedClientId}
													onChange={(e) => handleClientSelect(e.target.value)}
												>
													<option value="">-- Choose Client --</option>
													{localClients.map((c) => (
														<option key={c.id} value={c.id} className="bg-[var(--background)]">
															{c.name} ({c.email}) {c.phone ? `· ${c.phone}` : ""}
														</option>
													))}
												</select>
											</div>
										)}
									</div>

									{/* Step 2: Associated Booking Select (Shown only if client is selected) */}
									{selectedClientId && (
										<div className="pt-2 border-t border-[var(--border-color)]">
											<label className="block text-[11px] font-medium text-[var(--ink-soft)] mb-1">
												Associate Booking (today / upcoming)
											</label>
											{loadingBookings ? (
												<p className="text-xs text-[var(--ink-soft)] italic">Loading bookings...</p>
											) : clientBookings.length > 0 ? (
												<>
													<select
														className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
														value={bookingId}
														onChange={(e) => handleBookingSelect(e.target.value)}
													>
														<option value="">-- Choose Booking --</option>
														{clientBookings.map((b) => {
															const isPastStr = new Date(b.start) < new Date();
															const dateStr = format(new Date(b.start), "PP · p");
															return (
																<option key={b._id} value={b._id} className="bg-[var(--background)]">
																	{b.serviceId?.name || "Service"} on {dateStr} ({b.status}){isPastStr ? " ⚠️ [PAST APPOINTMENT]" : ""}
																</option>
															);
														})}
													</select>
													{(() => {
														const chosenObj = bookingId ? clientBookings.find((b) => b._id === bookingId) : null;
														if (chosenObj && new Date(chosenObj.start) < new Date()) {
															return (
																<div className="mt-2 text-[11px] border border-amber-500/40 bg-amber-500/10 p-2.5 rounded-lg text-amber-600 dark:text-amber-400 font-medium flex items-start gap-2 text-left">
																	<span className="text-sm shrink-0">⚠️</span>
																	<div>
																		<span className="font-bold">Past Appointment:</span> This appointment took place on{" "}
																		<span className="font-semibold underline decoration-dotted">{format(new Date(chosenObj.start), "PPP 'at' p")}</span>.
																	</div>
																</div>
															);
														}
														return null;
													})()}
												</>
											) : (
												<p className="text-xs text-[var(--ink-soft)] italic">
													No bookings found for this client.
												</p>
											)}
										</div>
									)}
								</div>

								{/* Step 3: Payment Link Configuration */}
								<div className="space-y-4">
									{/* Payment Kind & Amount */}
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
												Payment Kind *
											</label>
											<select
												className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
												value={kind}
												onChange={(e) => handleKindChange(e.target.value as any)}
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

									{/* Client Email & Associated Booking ID */}
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
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
											<label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
												Booking ID (optional)
											</label>
											<input
												type="text"
												readOnly
												placeholder="Auto-fills from booking select"
												className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none opacity-60 cursor-not-allowed"
												value={bookingId}
											/>
										</div>
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
