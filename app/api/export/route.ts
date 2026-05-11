import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db";
import * as XLSX from "xlsx";
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

    const typeLabels: Record<string, string> = {
      winner: "فائز",
      companion: "مرافق",
      judge: "محكّم",
      coordinator: "منسّق",
      media: "إعلامي",
      other: "مدعو",
    };

    const rows = guests.map((guest, index) => ({
      "#": index + 1,
      "الاسم": guest.name,
      "رقم الجوال": guest.phone || "",
      "النوع": typeLabels[guest.type] || guest.type,
      "الفئة / الصفة": guest.category || "",
      "مرافق لـ": guest.parent_name || "",
      "رابط الدعوة": `${baseUrl}/send/invitation/${guest.qr_code}`,
      "رابط الصورة": `${baseUrl}/send/api/invitation-image/${guest.qr_code}`,
      "رمز QR": guest.qr_code,
      "الحضور": guest.attended ? "حضر" : "لم يحضر",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // #
      { wch: 35 },  // Name
      { wch: 15 },  // Phone
      { wch: 10 },  // Type
      { wch: 30 },  // Category
      { wch: 30 },  // Parent
      { wch: 50 },  // URL
      { wch: 55 },  // Image URL
      { wch: 20 },  // QR Code
      { wch: 10 },  // Attended
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الدعوات");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        ...headers,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=da3awat-export.xlsx",
      },
    });
  } catch (error) {
    console.error("Error exporting:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500, headers });
  }
}
