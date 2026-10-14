"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCad } from "@/lib/money";
import {
  generateIcsContent,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  type IcsEventOptions,
} from "@/lib/calendar/ics";

export interface InvoiceMerchant {
  name: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
}

export interface InvoiceClient {
  name: string;
  email: string;
  phone?: string;
}

export interface InvoiceAppointment {
  id?: string;
  serviceName: string;
  durationMin: number;
  start: string | null;
  end?: string | null;
}

export interface InvoiceReconciliation {
  treatmentTotalCents: number;
  depositPaidCents?: number;
  balancePaidCents?: number;
  tipPercent?: number;
  tipCents?: number;
  discountCents?: number;
  totalChargedTodayCents?: number;
  totalPaidToDateCents: number;
  balanceDueCents: number;
}

export interface LuxuryInvoiceProps {
  number: string;
  date: string;
  status?: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  merchant?: InvoiceMerchant;
  client: InvoiceClient;
  appointment?: InvoiceAppointment | null;
  reconciliation: InvoiceReconciliation;
  description?: string;
  isModal?: boolean;
  onClose?: () => void;
  portalUrl?: string;
}

const DEFAULT_MERCHANT: InvoiceMerchant = {
  name: "Mari Esthetics",
  tagline: "Private Esthetics Studio",
  address: "1211 Gillespie Cres NW, Edmonton, AB T5T 6M5",
  email: "info@mariesthetics.ca",
  phone: "+1 (825) 785-3081",
};

export function LuxuryInvoiceReceipt({
  number,
  date,
  status = "PAID",
  paymentMethod = "Stripe Online Card",
  stripeSessionId,
  merchant = DEFAULT_MERCHANT,
  client,
  appointment,
  reconciliation,
  description,
  isModal = false,
  onClose,
  portalUrl = "/portal",
}: LuxuryInvoiceProps) {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (
        ua.includes("iphone") ||
        ua.includes("ipad") ||
        ua.includes("ipod") ||
        ua.includes("macintosh") ||
        ua.includes("mac os")
      ) {
        setIsAppleDevice(true);
      }
    }
  }, []);

  const issueDate = new Date(date);
  const formattedDate = !isNaN(issueDate.getTime())
    ? format(issueDate, "PPpp")
    : date;

  const apptDate = appointment?.start ? new Date(appointment.start) : null;
  const apptEndDate = appointment?.end
    ? new Date(appointment.end)
    : apptDate
      ? new Date(apptDate.getTime() + (appointment?.durationMin || 60) * 60_000)
      : null;

  const calOpts: IcsEventOptions | null =
    apptDate && appointment
      ? {
          title: `Mari Esthetics — ${appointment.serviceName}`,
          description: `Appointment for ${appointment.serviceName} at Mari Esthetics Studio.\n\nTreatment Total: ${formatCad(
            reconciliation.treatmentTotalCents,
          )}\nStatus: ${status}`,
          location: merchant.address,
          start: apptDate,
          end: apptEndDate || new Date(apptDate.getTime() + 60 * 60_000),
          organizerName: merchant.name,
          organizerEmail: merchant.email,
        }
      : null;

  const googleCalUrl = calOpts ? getGoogleCalendarUrl(calOpts) : "";
  const outlookCalUrl = calOpts ? getOutlookCalendarUrl(calOpts) : "";

  const handleDownloadIcs = () => {
    if (!calOpts) return;
    const content = generateIcsContent(calOpts);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `mari-esthetics-appointment.ics`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const isFullySettled = reconciliation.balanceDueCents === 0;

  return (
    <div className={`w-full ${isModal ? "p-0" : "max-w-2xl mx-auto space-y-6"}`}>
      {/* ── STICKY MODAL CONTROLS BAR (Modal Mode Only) ── */}
      {isModal && (
        <div
          data-print-hidden="true"
          className="sticky top-0 z-40 mb-4 flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--card-bg)]/95 border border-[var(--border-color)] shadow-2xl backdrop-blur-xl print:hidden"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase bg-[#c8a86b]/15 text-[#b08d4b] dark:text-[#dfc28d] px-2.5 sm:px-3 py-1 rounded-full border border-[#c8a86b]/30 shrink-0">
              Official Invoice
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-[var(--ink)] truncate">
              {number}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#c8a86b] via-[#d4af37] to-[#b89552] text-[#0b100d] font-bold text-xs shadow-md hover:brightness-105 active:scale-[0.98] flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
              title="Print official receipt or save as PDF"
            >
              <svg
                className="w-4 h-4 text-[#0b100d]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Print Receipt</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-[var(--border-color)] bg-[var(--background)] hover:bg-stone-200 dark:hover:bg-white/10 flex items-center justify-center text-[var(--ink)] hover:text-[#c8a86b] transition-all cursor-pointer shadow-xs text-sm font-bold"
                aria-label="Close invoice"
                title="Close invoice (Esc)"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TOP STATUS BANNER (Standalone /pay Page Only) ── */}
      {!isModal && (
        <div
          data-print-hidden="true"
          className="print-hidden border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-7 rounded-3xl shadow-xl text-center backdrop-blur-md relative overflow-hidden"
        >
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl mb-3 shadow-inner">
            ✓
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[var(--ink)]">
            {isFullySettled
              ? "Payment Settled & Confirmed"
              : "Payment Received"}
          </h2>
          <p className="mt-1.5 text-xs text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
            {isFullySettled
              ? "Your treatment balance and gratuity have been fully settled. An official copy of this invoice was sent to your email."
              : "Your payment has been securely processed. Details and reconciliation are shown below."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 justify-center items-center">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] hover:border-[#c8a86b] bg-[var(--background)] hover:bg-[#c8a86b]/10 text-xs font-semibold text-[var(--ink)] cursor-pointer flex items-center gap-2 transition-all shadow-sm"
            >
              <svg
                className="w-4 h-4 text-[#c8a86b]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Print / Save PDF</span>
            </button>

            <Link
              href={portalUrl}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:opacity-95 text-[#1c1814] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>View in Client Portal</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── APPOINTMENT DETAILS & CALENDAR CARD (Hidden in print) ── */}
      {appointment && apptDate && (
        <div
          data-print-hidden="true"
          className="print-hidden border border-[#c8a86b]/40 bg-[var(--card-bg)] text-[var(--ink)] p-6 sm:p-7 rounded-3xl shadow-xl space-y-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#b08d4b] dark:text-[#c8a86b] flex items-center gap-1.5">
              <span>📅 Appointment Details</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
              {appointment.durationMin} Min Treatment
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--ink)] font-bold">
              {appointment.serviceName}
            </h3>
            <p className="text-sm font-bold text-[#9e762c] dark:text-[#e2c78c] font-mono">
              {format(apptDate, "EEEE, MMMM d, yyyy")} at {format(apptDate, "h:mm a")}
            </p>
            <p className="text-xs text-[var(--ink-soft)] pt-1 flex items-center gap-1.5">
              <span>📍 Studio:</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(merchant.address)}`}
                target="_blank"
                rel="noreferrer"
                className="underline text-[var(--ink)] hover:text-[#c8a86b] font-medium"
              >
                {merchant.address}
              </a>
            </p>
          </div>

          {/* Calendar buttons */}
          <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block">
              Add Appointment to Calendar
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isAppleDevice
                    ? "bg-[#2f5d4a] hover:bg-[#3b725b] text-white border border-transparent"
                    : "border border-[var(--border-color)] text-[var(--ink)] hover:text-[#c8a86b] hover:border-[#c8a86b] bg-[var(--background)]"
                }`}
              >
                <span></span>
                <span>{isAppleDevice ? "Add to Apple Calendar" : "Apple / iCal (.ics)"}</span>
              </button>

              {googleCalUrl && (
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs font-semibold text-[var(--ink)] hover:text-[#c8a86b] hover:border-[#c8a86b] flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>📅</span>
                  <span>Google Calendar</span>
                </a>
              )}

              {outlookCalUrl && (
                <a
                  href={outlookCalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-xs font-semibold text-[var(--ink)] hover:text-[#c8a86b] hover:border-[#c8a86b] flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>✉</span>
                  <span>Outlook</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICIAL STUDIO INVOICE / RECEIPT (Printable & Screen) ── */}
      <div
        id="printable-luxury-invoice"
        className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-10 shadow-2xl relative z-10 backdrop-blur-md print:border-none print:shadow-none print:bg-white print:text-black print:p-0 print:m-0 print:w-full print-avoid-break"
      >
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-[var(--border-color)] pb-6 gap-6 print:border-black/15 print:flex-row print:justify-between print:pb-6">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-widest text-[var(--ink)] uppercase print:text-black">
              {merchant.name}
            </h1>
            <p className="text-[10px] text-[#c8a86b] uppercase tracking-[0.28em] font-semibold mt-1 print:text-black">
              {merchant.tagline}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[var(--ink-soft)] space-y-1 print:text-right print:text-black">
            <p className="font-semibold text-[var(--ink)] print:text-black uppercase tracking-wider text-[10px]">
              Invoice / Receipt No.
            </p>
            <p className="font-mono text-sm font-bold text-[#c8a86b] print:text-black">
              {number}
            </p>
            <p className="pt-1 font-semibold text-[var(--ink)] print:text-black uppercase tracking-wider text-[10px]">
              Date Issued
            </p>
            <p className="font-mono">{formattedDate}</p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:border-black/30 print:text-black print:bg-transparent">
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Merchant Details & Billed To Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[var(--border-color)] text-xs print:grid-cols-2 print:border-black/15 print:py-6">
          {/* Merchant */}
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold mb-2 print:text-black">
              Merchant Details
            </span>
            <p className="font-semibold text-[var(--ink)] print:text-black text-sm">
              {merchant.name}
            </p>
            <p className="text-[var(--ink-soft)] print:text-black/80">{merchant.address}</p>
            <p className="text-[var(--ink-soft)] print:text-black/80">{merchant.email}</p>
            <p className="text-[var(--ink-soft)] print:text-black/80">{merchant.phone}</p>
          </div>

          {/* Client */}
          <div className="space-y-1 sm:text-right print:text-right">
            <span className="block text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold mb-2 print:text-black">
              Billed To
            </span>
            <p className="font-semibold text-[var(--ink)] print:text-black text-sm">
              {client.name || "Valued Client"}
            </p>
            <p className="text-[var(--ink-soft)] print:text-black/80">{client.email}</p>
            {client.phone && (
              <p className="text-[var(--ink-soft)] print:text-black/80">{client.phone}</p>
            )}
            <p className="text-[10px] text-[#c8a86b] font-medium print:text-black">
              Client Reservation
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b border-[var(--border-color)] print:border-black/15 print:py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[var(--ink-soft)] uppercase text-[10px] tracking-wider border-b border-[var(--border-color)] pb-2 print:border-black/15 print:text-black">
                <th className="pb-2 font-semibold">Description</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40 print:divide-black/10">
              {/* Service Line Item */}
              <tr>
                <td className="py-3.5 pr-4">
                  <p className="font-semibold text-sm text-[var(--ink)] print:text-black">
                    {appointment?.serviceName || description || "Esthetics Treatment Session"}
                  </p>
                  {appointment?.durationMin ? (
                    <p className="text-[11px] text-[var(--ink-soft)] mt-0.5 print:text-black/70">
                      Duration: {appointment.durationMin} Minutes
                    </p>
                  ) : null}
                  {apptDate ? (
                    <p className="text-[11px] text-[#c8a86b] mt-0.5 font-medium print:text-black">
                      Scheduled: {format(apptDate, "EEEE, MMMM d, yyyy · h:mm a")}
                    </p>
                  ) : null}
                </td>
                <td className="py-3.5 text-right font-mono font-bold text-sm text-[var(--ink)] print:text-black">
                  {formatCad(reconciliation.treatmentTotalCents)}
                </td>
              </tr>

              {/* Gratuity Line Item */}
              {reconciliation.tipCents && reconciliation.tipCents > 0 ? (
                <tr>
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-sm text-[var(--ink)] print:text-black">
                      Gratuity / Tip
                      {reconciliation.tipPercent
                        ? ` (${reconciliation.tipPercent}%)`
                        : ""}
                    </p>
                    <p className="text-[11px] text-[var(--ink-soft)] print:text-black/70">
                      Thank you for supporting our estheticians!
                    </p>
                  </td>
                  <td className="py-3.5 text-right font-mono font-medium text-sm text-[var(--ink)] print:text-black">
                    {formatCad(reconciliation.tipCents)}
                  </td>
                </tr>
              ) : null}

              {/* Promotional Discount / Gift Certificate Line Item */}
              {reconciliation.discountCents && reconciliation.discountCents > 0 ? (
                <tr>
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-sm text-emerald-500 dark:text-emerald-400 print:text-black">
                      Discount / Gift Certificate
                    </p>
                  </td>
                  <td className="py-3.5 text-right font-mono font-medium text-sm text-emerald-500 dark:text-emerald-400 print:text-black">
                    -{formatCad(reconciliation.discountCents)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* ── COMPLETE FINANCIAL RECONCILIATION & TOTALS ── */}
        <div className="pt-6 print:pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-6">
            {/* Left: Transaction Info */}
            <div className="text-[11px] text-[var(--ink-soft)] space-y-1.5 order-2 sm:order-1 sm:max-w-[45%] print:text-black/80">
              <p className="font-bold uppercase tracking-wider text-[10px] text-[var(--ink-soft)] mb-2.5 print:text-black">
                Transaction Info
              </p>
              <p>
                Payment Method:{" "}
                <span className="font-semibold text-[var(--ink)] print:text-black">
                  {paymentMethod}
                </span>
              </p>
              {stripeSessionId ? (
                <p className="break-all">
                  Session ID:{" "}
                  <span className="font-mono text-[9px] text-[var(--ink)] print:text-black">
                    {stripeSessionId}
                  </span>
                </p>
              ) : null}
              <p>
                Studio Location:{" "}
                <span className="font-medium text-[var(--ink)] print:text-black">
                  Edmonton, AB
                </span>
              </p>
            </div>

            {/* Right: Reconciliation Numbers */}
            <div className="w-full sm:w-auto text-right space-y-2 order-1 sm:order-2 self-stretch sm:self-auto text-xs min-w-[260px]">
              {/* Treatment total */}
              <div className="flex justify-between sm:justify-end gap-8 text-[var(--ink-soft)] print:text-black/80">
                <span className="whitespace-nowrap">Treatment Total</span>
                <span className="font-mono font-medium text-[var(--ink)] print:text-black">
                  {formatCad(reconciliation.treatmentTotalCents)}
                </span>
              </div>

              {/* Discount / Gift Certificate */}
              {reconciliation.discountCents && reconciliation.discountCents > 0 ? (
                <div className="flex justify-between sm:justify-end gap-8 text-emerald-500 dark:text-emerald-400 print:text-black">
                  <span className="whitespace-nowrap">Discount / Gift Certificate</span>
                  <span className="font-mono font-medium">
                    -{formatCad(reconciliation.discountCents)}
                  </span>
                </div>
              ) : null}

              {/* Deposit paid earlier */}
              {reconciliation.depositPaidCents && reconciliation.depositPaidCents > 0 ? (
                <div className="flex justify-between sm:justify-end gap-8 text-emerald-400 print:text-black">
                  <span className="whitespace-nowrap flex items-center gap-1 justify-end">
                    <span>Deposit Paid (Secured slot)</span>
                  </span>
                  <span className="font-mono font-medium">
                    -{formatCad(reconciliation.depositPaidCents)}
                  </span>
                </div>
              ) : null}

              {/* Remaining balance paid */}
              {reconciliation.balancePaidCents && reconciliation.balancePaidCents > 0 ? (
                <div className="flex justify-between sm:justify-end gap-8 text-[var(--ink)] print:text-black">
                  <span className="whitespace-nowrap">Remaining Balance Paid Today</span>
                  <span className="font-mono font-medium">
                    {formatCad(reconciliation.balancePaidCents)}
                  </span>
                </div>
              ) : null}

              {/* Gratuity */}
              {reconciliation.tipCents && reconciliation.tipCents > 0 ? (
                <div className="flex justify-between sm:justify-end gap-8 text-[var(--ink-soft)] print:text-black/80">
                  <span className="whitespace-nowrap">
                    Gratuity / Tip
                    {reconciliation.tipPercent
                      ? ` (${reconciliation.tipPercent}%)`
                      : ""}
                  </span>
                  <span className="font-mono font-medium text-[var(--ink)] print:text-black">
                    +{formatCad(reconciliation.tipCents)}
                  </span>
                </div>
              ) : null}

              {/* Total charged today */}
              {reconciliation.totalChargedTodayCents ? (
                <div className="flex justify-between sm:justify-end gap-8 text-sm font-bold border-t border-[var(--border-color)] pt-2.5 text-[var(--ink)] print:border-black/15 print:text-black">
                  <span className="whitespace-nowrap">Total Charged Today</span>
                  <span className="font-mono text-base text-[#c8a86b] print:text-black font-extrabold">
                    {formatCad(reconciliation.totalChargedTodayCents)}
                  </span>
                </div>
              ) : null}

              {/* Cumulative paid to date */}
              <div className="flex justify-between sm:justify-end gap-8 text-xs font-semibold pt-1 text-[var(--ink-soft)] print:text-black/80">
                <span className="whitespace-nowrap">Total Paid Across Treatment</span>
                <span className="font-mono text-[var(--ink)] print:text-black">
                  {formatCad(reconciliation.totalPaidToDateCents)}
                </span>
              </div>

              {/* Balance remaining */}
              <div
                className={`flex justify-between sm:justify-end gap-8 text-xs font-bold pt-1.5 border-t border-[var(--border-color)]/50 print:border-black/10 ${
                  reconciliation.balanceDueCents === 0
                    ? "text-emerald-400 print:text-black"
                    : "text-amber-500"
                }`}
              >
                <span className="whitespace-nowrap">Balance Remaining</span>
                <span className="font-mono">
                  {reconciliation.balanceDueCents === 0
                    ? "$0.00 (Fully Settled)"
                    : formatCad(reconciliation.balanceDueCents)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer sign-off */}
        <div className="mt-12 pt-6 border-t border-[var(--border-color)] text-center text-[11px] text-[var(--ink-soft)] space-y-1 print:border-black/15 print:text-black/70 print:mt-8 print:pt-4">
          <p className="font-medium text-[var(--ink)] print:text-black">
            Thank you for choosing Mari Esthetics Studio!
          </p>
          <p>
            For questions or rescheduling, contact{" "}
            <a
              href={`mailto:${merchant.email}`}
              className="text-[#c8a86b] underline print:text-black"
            >
              {merchant.email}
            </a>
          </p>
        </div>
      </div>

      {/* Footer Close Button in Modal Mode */}
      {isModal && onClose && (
        <div data-print-hidden="true" className="mt-6 mb-2 text-center print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[#c8a86b]/10 text-xs font-semibold text-[var(--ink)] hover:text-[#c8a86b] transition-all cursor-pointer shadow-sm"
          >
            ← Close Invoice & Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
