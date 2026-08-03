import { connectDb } from "@/lib/db/connect";
import { EtransferSettings } from "@/lib/db/models/EtransferSettings";
import { Payment } from "@/lib/db/models/Payment";
import { Booking } from "@/lib/db/models/Booking";

export class EtransferRepository {
  /**
   * Get existing studio e-Transfer settings or create defaults.
   */
  static async getOrCreateSettings(): Promise<any> {
    await connectDb();
    let settings = await EtransferSettings.findOne().lean();
    if (!settings) {
      settings = await EtransferSettings.create({
        accountName: "Mari Esthetics / Marinelle Tala",
        email: "mari@mariesthetics.ca",
        phone: "+1 7809133081",
        autoDepositEnabled: true,
        instructions: "Please include your appointment date and full name in the e-Transfer note.",
      });
    }
    return settings;
  }

  /**
   * Update studio receiving e-Transfer account settings.
   */
  static async updateSettings(
    data: {
      accountName: string;
      email: string;
      phone: string;
      autoDepositEnabled: boolean;
      instructions?: string;
    },
    updatedByEmail: string,
  ): Promise<any> {
    await connectDb();
    let settings = await EtransferSettings.findOne();
    if (!settings) {
      settings = new EtransferSettings(data);
    } else {
      settings.accountName = data.accountName;
      settings.email = data.email;
      settings.phone = data.phone;
      settings.autoDepositEnabled = data.autoDepositEnabled;
      settings.instructions = data.instructions || "";
    }
    settings.updatedBy = updatedByEmail || "Admin";
    await settings.save();
    return settings;
  }

  /**
   * Record a manual Interac e-Transfer and update linked booking accounting.
   */
  static async recordManualPayment(
    data: {
      amountCad: number;
      referenceNumber?: string;
      bookingId?: string;
      kind: "deposit" | "balance" | "tip" | "adjustment";
      note?: string;
      clientEmail?: string;
      clientName?: string;
    },
    managerEmail: string,
    managerSub?: string,
  ): Promise<any> {
    await connectDb();
    const amountCents = Math.round(data.amountCad * 100);

    let booking: any = null;
    if (data.bookingId) {
      booking = await Booking.findById(data.bookingId);
    }

    const payment = await Payment.create({
      bookingId: booking ? booking._id : undefined,
      kind: data.kind,
      method: "etransfer",
      amountCents,
      status: "succeeded",
      referenceNumber: data.referenceNumber,
      note: data.note || `Manual e-Transfer recorded by ${managerEmail}`,
      confirmedBy: managerSub || undefined,
      confirmedAt: new Date(),
    });

    if (booking) {
      const summary = booking.paymentSummary ?? {
        totalCents: 0,
        depositCents: 0,
        paidCents: 0,
        tipCents: 0,
        discountCents: 0,
        balanceDueCents: 0,
      };

      if (data.kind === "tip") {
        summary.tipCents = (summary.tipCents ?? 0) + amountCents;
      } else {
        summary.paidCents = (summary.paidCents ?? 0) + amountCents;
        summary.balanceDueCents = Math.max(
          0,
          (summary.totalCents ?? 0) - (summary.discountCents ?? 0) - summary.paidCents,
        );
      }

      booking.paymentSummary = summary;
      if (booking.status === "held") {
        booking.status = "confirmed";
        booking.holdExpiresAt = null;
      }
      await booking.save();
    }

    return payment;
  }
}
