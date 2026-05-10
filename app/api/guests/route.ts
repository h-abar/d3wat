import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    const guests = await getAllGuests();
    const baseUrl = new URL(request.url).origin;

    // Add invitation URLs
    const guestsWithUrls = guests.map((guest) => ({
      ...guest,
      invitation_url: `${baseUrl}/send/invitation/${guest.qr_code}`,
    }));

    return NextResponse.json(guestsWithUrls);
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
