import { format } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Manager, Payment } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { config } from "@/lib/config";
import { generateIcsContent } from "@/lib/calendar/ics";
import { sendEmail } from "@/lib/mailgun";

export interface AdminNotificationOptions {
  bookingId: string;
  eventType:
    | "creation"
    | "deposit_initiated"
    | "deposit_paid"
    | "balance_paid"
    | "payment_paid"
    | "deposit_failed"
    | "rescheduled"
    | "cancelled";
  /** Amount of this charge, in cents. Used for balance and other non-deposit payments. */
  chargeCents?: number;
}

export async function notifyAdminsOfBooking(options: AdminNotificationOptions): Promise<void> {
  try {
    await connectDb();

    const booking = await Booking.findById(options.bookingId).populate("serviceId").lean();
    if (!booking) return;

    // Fetch active managers
    const activeManagers = await Manager.find({ active: true }).select("email").lean();
    const adminEmailsSet = new Set<string>();

    activeManagers.forEach((m) => {
      if (m.email) adminEmailsSet.add(m.email.toLowerCase().trim());
    });

    // Fallback default admin email if none registered
    adminEmailsSet.add("mari@mariesthetics.ca");

    const adminEmails = Array.from(adminEmailsSet);

    const serviceObj = booking.serviceId as any;
    const serviceName = serviceObj?.name || "Esthetics Service";
    const durationMin = serviceObj?.durationMin || 60;

    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end || startDate.getTime() + durationMin * 60_000);

    const formattedDate = format(startDate, "EEEE, MMMM d, yyyy");
    const formattedTime = format(startDate, "h:mm a");

    const summary = booking.paymentSummary || {};
    const totalFormatted = formatCad(summary.totalCents || serviceObj?.priceCents || 0);
    const discountCents = summary.discountCents || 0;
    const discountFormatted = discountCents > 0 ? formatCad(discountCents) : "";
    const depositRequiredFormatted = formatCad(summary.depositCents || serviceObj?.depositCents || 0);
    const separatesChargeFromDeposit =
      options.eventType === "balance_paid" || options.eventType === "payment_paid";
    const depositPaidFormatted = formatCad(
      separatesChargeFromDeposit ? summary.depositCents || 0 : summary.paidCents || 0
    );
    const paidToDateFormatted = separatesChargeFromDeposit
      ? formatCad(summary.paidCents || 0)
      : "";
    const chargeCents = options.chargeCents ?? 0;
    const chargeFormatted = chargeCents > 0 ? formatCad(chargeCents) : "";
    const chargeLabel =
      options.eventType === "balance_paid"
        ? "Remaining Balance Paid"
        : options.eventType === "payment_paid"
          ? "Payment Received"
          : "";
    const balanceDueFormatted = formatCad(
      summary.balanceDueCents ?? Math.max(0, (summary.totalCents || 0) - (summary.paidCents || 0))
    );

    let eventTitle = "";
    let statusBadgeText = (booking.status || "held").toUpperCase();
    let statusBadgeColor = "#c8a86b";

    switch (options.eventType) {
      case "creation":
      case "deposit_initiated":
        eventTitle = `⏳ Booking Initiated (Deposit Pending): ${serviceName}`;
        statusBadgeText = "PENDING DEPOSIT";
        statusBadgeColor = "#e6a100";
        break;
      case "deposit_paid":
        eventTitle = `✅ Deposit Payment Confirmed: ${serviceName}`;
        statusBadgeText = "DEPOSIT CONFIRMED";
        statusBadgeColor = "#2e7d32";
        break;
      case "balance_paid":
        eventTitle = `✅ Remaining Balance Paid: ${serviceName}`;
        statusBadgeText = "BALANCE PAID";
        statusBadgeColor = "#2e7d32";
        break;
      case "payment_paid":
        eventTitle = `✅ Payment Received: ${serviceName}`;
        statusBadgeText = "PAYMENT RECEIVED";
        statusBadgeColor = "#2e7d32";
        break;
      case "deposit_failed":
        eventTitle = `⚠️ Deposit Payment Failed: ${serviceName}`;
        statusBadgeText = "PAYMENT FAILED";
        statusBadgeColor = "#d32f2f";
        break;
      case "cancelled":
        eventTitle = `❌ Booking Cancelled / Expired: ${serviceName}`;
        statusBadgeText = "CANCELLED / EXPIRED";
        statusBadgeColor = "#d32f2f";
        break;
      case "rescheduled":
        eventTitle = `🔄 Appointment Rescheduled: ${serviceName}`;
        statusBadgeText = "RESCHEDULED";
        statusBadgeColor = "#1976d2";
        break;
    }

    // Generate iCal .ics file
    const icsContent = generateIcsContent({
      title: `Client Appointment: ${booking.guest?.name || "Client"} (${serviceName})`,
      description: separatesChargeFromDeposit
        ? `Client: ${booking.guest?.name || "Client"}\nEmail: ${booking.guest?.email || ""}\nPhone: ${booking.guest?.phone || ""}\nService: ${serviceName}\nStatus: ${statusBadgeText}\nDeposit Required: ${depositRequiredFormatted}\nDeposit Paid: ${depositPaidFormatted}\n${chargeLabel}: ${chargeFormatted || formatCad(0)}\nPaid to Date: ${paidToDateFormatted}\nBalance Due: ${balanceDueFormatted}`
        : `Client: ${booking.guest?.name || "Client"}\nEmail: ${booking.guest?.email || ""}\nPhone: ${booking.guest?.phone || ""}\nService: ${serviceName}\nStatus: ${statusBadgeText}\nDeposit Required: ${depositRequiredFormatted}\nDeposit Paid: ${depositPaidFormatted}\nBalance Due: ${balanceDueFormatted}`,
      location: config.studioAddress,
      start: startDate,
      end: endDate,
      organizerName: "Mari Esthetics Admin",
      organizerEmail: "mari@mariesthetics.ca",
    });

    // Send notification email to all admins
    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: `[ADMIN ALERT] ${eventTitle} — ${formattedDate}`,
        templateName: "admin-booking-notification",
        data: {
          eventTitle,
          statusBadgeText,
          statusBadgeColor,
          clientName: booking.guest?.name || "Guest Client",
          clientEmail: booking.guest?.email || "N/A",
          clientPhone: booking.guest?.phone || "",
          serviceName,
          formattedDate,
          formattedTime,
          durationMin,
          paymentStatus: booking.status,
          depositMethod: booking.depositMethod || "N/A",
          totalFormatted,
          discountFormatted,
          depositRequiredFormatted,
          depositPaidFormatted,
          chargeLabel,
          chargeFormatted,
          paidToDateFormatted,
          balanceDueFormatted,
          notes: booking.notes || "",
        },
        attachment: {
          filename: `booking-${booking.guest?.name || "client"}.ics`.toLowerCase().replace(/\s+/g, "-"),
          content: icsContent,
          contentType: "text/calendar",
        },
      });
    }
  } catch (err: any) {
    console.error("[Admin Notification Error]:", err.message);
  }
}

export interface ClientNotificationOptions {
  bookingId: string;
  recipientEmail?: string;
  kind?: "deposit" | "balance" | "tip" | "custom";
  chargeCents?: number;
  isRescheduled?: boolean;
  force?: boolean;
}

export async function notifyClientOfBooking(
  options: ClientNotificationOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    await connectDb();

    const booking = await Booking.findById(options.bookingId)
      .populate("serviceId")
      .populate("clientId")
      .lean();
    if (!booking) {
      console.warn(`[Client Notification] Booking not found: ${options.bookingId}`);
      return { success: false, error: "Booking not found" };
    }

    const recipientEmail =
      options.recipientEmail ||
      booking.guest?.email ||
      (booking.clientId as any)?.email;
    if (!recipientEmail) {
      console.warn(`[Client Notification] No recipient email found for booking: ${options.bookingId}`);
      return { success: false, error: "Recipient email is missing" };
    }

    const serviceObj = booking.serviceId as any;
    const serviceName = serviceObj?.name || "Esthetics Service";
    const durationMin = serviceObj?.durationMin || 60;

    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end || startDate.getTime() + durationMin * 60_000);

    const formattedDate = format(startDate, "EEEE, MMMM d, yyyy");
    const formattedTime = format(startDate, "h:mm a");

    const summary = booking.paymentSummary || {};
    const totalCents = summary.totalCents || serviceObj?.priceCents || 0;
    const discountCents = summary.discountCents || 0;
    const depositCents = summary.depositCents || 0;
    const paidCents = summary.paidCents || 0;
    const balanceDueCents =
      summary.balanceDueCents ?? Math.max(0, totalCents - discountCents - paidCents);

    let kind = options.kind;
    let chargeCents = options.chargeCents;

    if (!kind || chargeCents == null) {
      const latestPayment = await Payment.findOne({
        bookingId: booking._id,
        status: "succeeded",
      }).sort({ createdAt: -1 });
      const storedKind = latestPayment?.kind === "adjustment" ? "custom" : latestPayment?.kind;
      kind = kind || (storedKind as "deposit" | "balance" | "tip" | "custom" | undefined) || "deposit";
      if (chargeCents == null) chargeCents = latestPayment?.amountCents;
    }

    const totalFormatted = formatCad(totalCents);
    const discountFormatted = discountCents > 0 ? formatCad(discountCents) : "";
    const balanceDueFormatted = formatCad(balanceDueCents);
    const paidToDateFormatted = formatCad(paidCents);
    const depositPaidFormatted = formatCad(
      kind === "deposit" ? depositCents || chargeCents || paidCents : depositCents,
    );

    const isConfirmed = booking.status === "confirmed" || booking.status === "completed";
    const isHeld = booking.status === "held";
    const isFullyCovered = totalCents > 0 && totalCents <= discountCents;
    const isBalance = kind === "balance";
    const clientName = booking.guest?.name || (booking.clientId as any)?.name || "Valued Client";

    // Deduplicate initial confirmation email (e.g., Stripe webhook & checkout redirect race)
    if (isConfirmed && kind === "deposit" && !options.isRescheduled && !options.force) {
      const claim = await Booking.findOneAndUpdate(
        { _id: booking._id, confirmationEmailSentAt: null },
        { $set: { confirmationEmailSentAt: new Date() } }
      );
      if (!claim) {
        console.info(`[Client Notification] Confirmation email already sent for booking: ${options.bookingId}`);
        return { success: true, messageId: "already-sent" };
      }
    }

    let paidLineLabel = "Deposit Paid Today";
    let paidLineFormatted = depositPaidFormatted;
    let subject = `Appointment Confirmed: ${serviceName} on ${formattedDate}`;
    let statusIntro = `Your reservation for <strong style="color: #f3efe6;">${serviceName}</strong> has been received and confirmed. We look forward to welcoming you to the studio!`;

    if (options.isRescheduled) {
      paidLineLabel = summary.paidCents ? "Deposit / Paid to Date" : "Deposit Required";
      paidLineFormatted = summary.paidCents ? paidToDateFormatted : depositPaidFormatted;
      subject = `Appointment Rescheduled: ${serviceName} on ${formattedDate}`;
      statusIntro = `Your appointment for <strong style="color: #f3efe6;">${serviceName}</strong> has been successfully rescheduled to <strong style="color: #c8a86b;">${formattedDate} at ${formattedTime}</strong>. Your updated calendar invitation is attached below.`;
    } else if (isBalance) {
      paidLineLabel = "Remaining Balance Paid";
      paidLineFormatted = formatCad(chargeCents ?? Math.max(0, paidCents - depositCents));
      subject = `Payment Receipt: Remaining Balance Settled — ${serviceName}`;
      statusIntro = `Your remaining treatment balance has been settled. Details and reconciliation are shown below.`;
    } else if (kind === "tip") {
      paidLineLabel = "Tip Paid";
      paidLineFormatted = formatCad(chargeCents ?? 0);
      subject = `Payment Receipt: Gratuity Received — ${serviceName}`;
      statusIntro = `Thank you so much for supporting our estheticians! Your tip has been received.`;
    } else if (kind === "custom") {
      paidLineLabel = "Paid Today";
      paidLineFormatted = formatCad(chargeCents ?? 0);
      subject = `Payment Receipt — ${serviceName}`;
      statusIntro = `Your payment has been received and applied to your booking.`;
    } else if (isFullyCovered) {
      paidLineLabel = "Covered by Gift Certificate";
      paidLineFormatted = "$0.00 (100% Covered)";
      subject = `Appointment Confirmed: ${serviceName} on ${formattedDate}`;
      statusIntro = `Your reservation for <strong style="color: #f3efe6;">${serviceName}</strong> is <strong style="color: #2e7d32;">100% covered</strong> by your gift certificate/voucher and is fully confirmed!`;
    } else if (isHeld && booking.depositMethod === "etransfer") {
      paidLineLabel = "Deposit Due (Interac e-Transfer)";
      paidLineFormatted = formatCad(depositCents);
      subject = `Reservation Held: ${serviceName} on ${formattedDate}`;
      statusIntro = `Your reservation for <strong style="color: #f3efe6;">${serviceName}</strong> is held for 2 hours awaiting your ${formatCad(depositCents)} deposit via Interac e-Transfer to <strong style="color: #c8a86b;">mari@mariesthetics.ca</strong>. Once received and verified, your appointment will be fully confirmed!`;
    } else if (isHeld) {
      paidLineLabel = "Deposit Required";
      paidLineFormatted = formatCad(depositCents);
      subject = `Reservation Details: ${serviceName} on ${formattedDate}`;
      statusIntro = `Your reservation for <strong style="color: #f3efe6;">${serviceName}</strong> is awaiting deposit confirmation to lock your appointment slot.`;
    }

    const paymentLines = isBalance
      ? `Deposit Paid: ${depositPaidFormatted}\nRemaining Balance Paid: ${paidLineFormatted}\nPaid to Date: ${paidToDateFormatted}\nBalance Due: ${balanceDueFormatted}`
      : `Deposit: ${paidLineFormatted}\nBalance Due at Studio: ${balanceDueFormatted}`;

    const studioAddress = config.studioAddress;

    // Generate iCal .ics file content
    const icsContent = generateIcsContent({
      title: `Mari Esthetics — ${serviceName}`,
      description: `Appointment for ${serviceName} at Mari Esthetics.\n\n${paymentLines}\nClient: ${clientName}`,
      location: studioAddress,
      start: startDate,
      end: endDate,
      organizerName: "Mari Esthetics",
      organizerEmail: "mari@mariesthetics.ca",
    });

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      templateName: "booking-confirmation",
      data: {
        clientName,
        serviceName,
        formattedDate,
        formattedTime,
        durationMin,
        studioAddress,
        totalFormatted,
        discountFormatted,
        paymentKind: kind,
        paidLineLabel,
        paidLineFormatted,
        depositPaidFormatted,
        paidToDateFormatted,
        balanceDueFormatted,
        statusIntro,
      },
      attachment: {
        filename: `appointment-${serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`,
        content: icsContent,
        contentType: "text/calendar",
      },
    });

    if (!emailResult.success) {
      console.error(`[Client Notification Failed]: ${emailResult.error}`);
      if (isConfirmed && kind === "deposit" && !options.isRescheduled && !options.force) {
        await Booking.findByIdAndUpdate(booking._id, { $set: { confirmationEmailSentAt: null } });
      }
    } else {
      console.info(`[Client Notification Sent]: To ${recipientEmail} (${emailResult.messageId})`);
    }

    return emailResult;
  } catch (err: any) {
    console.error("[Client Notification Error]:", err.message);
    return { success: false, error: err.message };
  }
}
