import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
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
      "رابط الدعوة": `${baseUrl}/invitation/${guest.qr_code}`,
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
      { wch: 20 },  // QR Code
      { wch: 10 },  // Attended
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الدعوات");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=da3awat-export.xlsx",
      },
    });
  } catch (error) {
    console.error("Error exporting:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
