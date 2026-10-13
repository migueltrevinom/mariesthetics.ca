import { NextResponse } from "next/server";
import { z } from "zod";
import { withClientAuth, type SessionPayload, signSession, setSessionCookie } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { Client, Booking, StudioCharge } from "@/lib/db/models";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().optional().default(""),
  countryCode: z.string().trim().optional().default("+1"),
});

function withValidation<T>(
  schema: z.Schema<T>,
  handler: (req: Request, validatedData: T, session: SessionPayload) => Promise<NextResponse>
) {
  return async (req: Request, session: SessionPayload): Promise<NextResponse> => {
    try {
      const clonedReq = req.clone();
      const body = await clonedReq.json();
      const validatedData = schema.parse(body);
      return handler(req, validatedData, session);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
  };
}

async function handleUpdateProfile(
  _req: Request,
  data: z.infer<typeof updateProfileSchema>,
  session: SessionPayload
): Promise<NextResponse> {
  try {
    await connectDb();
    const clientId = session.sub;
    const oldEmail = session.email.toLowerCase().trim();
    const newEmail = data.email.toLowerCase().trim();

    // If email is changing, verify that no other client account has this email
    if (newEmail !== oldEmail) {
      const conflict = await Client.findOne({
        email: newEmail,
        _id: { $ne: clientId },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "This email address is already associated with another client account." },
          { status: 400 }
        );
      }
    }

    // 1. Update the Client document
    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        $set: {
          name: data.name,
          email: newEmail,
          phone: data.phone,
          countryCode: data.countryCode,
        },
      },
      { new: true }
    );

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 2. Synchronize across all bookings (by clientId and by oldEmail / newEmail)
    // Ensures existing bookings and unlinked guest records reflect the new email & details
    await Booking.updateMany(
      {
        $or: [
          { clientId: client._id },
          { "guest.email": oldEmail },
          { "guest.email": newEmail },
        ],
      },
      {
        $set: {
          clientId: client._id,
          "guest.name": data.name,
          "guest.email": newEmail,
          "guest.phone": data.phone,
          "guest.countryCode": data.countryCode,
        },
      }
    );

    // 3. Synchronize studio charges if email changed
    if (newEmail !== oldEmail) {
      await StudioCharge.updateMany(
        { clientEmail: oldEmail },
        {
          $set: {
            clientEmail: newEmail,
            clientName: data.name,
          },
        }
      );
    }

    // 4. Re-issue JWT session cookie so session reflects new email/name seamlessly
    const token = await signSession({
      sub: String(client._id),
      role: "client",
      email: client.email,
      name: client.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      message: "Profile updated and synchronized across all appointments.",
      client: {
        id: String(client._id),
        name: client.name,
        email: client.email,
        phone: client.phone,
        countryCode: client.countryCode,
      },
    });
  } catch (err: unknown) {
    console.error("[handleUpdateProfile Error]:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export const PUT = withClientAuth(withValidation(updateProfileSchema, handleUpdateProfile));
