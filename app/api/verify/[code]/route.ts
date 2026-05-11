import { NextResponse } from "next/server";
import { getGuestByQrCode, markAttended } from "@/lib/db";
import QRCode from "qrcode";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getSecurityHeaders } from "@/lib/security";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
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
    const { code } = await params;
    
    // Input validation
    if (!code || typeof code !== "string" || code.length > 100) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400, headers });
    }

    const guest = await getGuestByQrCode(code);

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404, headers });
    }

    // Generate QR code as data URL
    const baseUrl = process.env.BASE_URL || new URL(request.url).origin;
    const qrData = `${baseUrl}/send/invitation/${guest.qr_code}`;
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: "#0d4f4f", light: "#ffffff" },
    });

    return NextResponse.json({ ...guest, qr_image: qrImage }, { headers });
  } catch (error) {
    console.error("Error fetching guest:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
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
    const { code } = await params;
    
    // Input validation
    if (!code || typeof code !== "string" || code.length > 100) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400, headers });
    }

    const guest = await markAttended(code);

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404, headers });
    }

    return NextResponse.json(guest, { headers });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers });
  }
}
