import { format } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Booking, Manager } from "@/lib/db/models";
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
    | "deposit_failed"
    | "rescheduled"
    | "cancelled";
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
    const depositRequiredFormatted = formatCad(summary.depositCents || serviceObj?.depositCents || 0);
    const depositPaidFormatted = formatCad(summary.paidCents || 0);
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
      description: `Client: ${booking.guest?.name || "Client"}\nEmail: ${booking.guest?.email || ""}\nPhone: ${booking.guest?.phone || ""}\nService: ${serviceName}\nStatus: ${statusBadgeText}\nDeposit Required: ${depositRequiredFormatted}\nDeposit Paid: ${depositPaidFormatted}\nBalance Due: ${balanceDueFormatted}`,
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
          depositRequiredFormatted,
          depositPaidFormatted,
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
