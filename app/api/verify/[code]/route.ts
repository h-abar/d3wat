import { NextResponse } from "next/server";
import { getGuestByQrCode, markAttended } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const guest = await getGuestByQrCode(code);

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Generate QR code as data URL
    const baseUrl = new URL(request.url).origin;
    const qrData = `${baseUrl}/send/invitation/${guest.qr_code}`;
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: "#0d4f4f", light: "#ffffff" },
    });

    return NextResponse.json({ ...guest, qr_image: qrImage });
  } catch (error) {
    console.error("Error fetching guest:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const guest = await markAttended(code);

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
