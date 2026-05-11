import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db";
import QRCode from "qrcode";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getSecurityHeaders } from "@/lib/security";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = rateLimit(ip);
  const headers = { ...getRateLimitHeaders(ip), ...getSecurityHeaders() };

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers }
    );
  }

  try {
    const guests = await getAllGuests();
    const baseUrl = process.env.BASE_URL || new URL(request.url).origin;

    // Add invitation URLs
    const guestsWithUrls = guests.map((guest) => ({
      ...guest,
      invitation_url: `${baseUrl}/send/invitation/${guest.qr_code}`,
      image_url: `${baseUrl}/send/api/invitation-image/${guest.qr_code}`,
    }));

    return NextResponse.json(guestsWithUrls, { headers });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers });
  }
}
