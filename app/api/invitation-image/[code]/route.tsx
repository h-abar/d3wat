import { NextResponse } from "next/server";
import { getGuestByQrCode } from "@/lib/db";
import QRCode from "qrcode";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import React from "react";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getSecurityHeaders } from "@/lib/security";

const fontsDir = path.join(process.cwd(), "public", "fonts");

// Satori renders Arabic words LTR, so we reverse word order as workaround
function rtl(text: string): string {
  return text.split(" ").reverse().join(" ");
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    winner: "فائز",
    companion: "مرافق",
    judge: "محكّم",
    coordinator: "منسّق",
    media: "إعلامي",
    other: "مدعو",
  };
  return labels[type] || type;
}

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

    const baseUrl = process.env.BASE_URL || new URL(request.url).origin;
    const qrData = `${baseUrl}/send/invitation/${guest.qr_code}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: "#0d4f4f", light: "#ffffff" },
    });

    const boldFont = fs.readFileSync(path.join(fontsDir, "Tajawal-Bold.ttf"));
    const regularFont = fs.readFileSync(path.join(fontsDir, "Tajawal-Regular.ttf"));

    const typeLabel = getTypeLabel(guest.type);

    const el = (
      tag: string,
      props: Record<string, unknown>,
      ...children: (React.ReactNode | null)[]
    ) => React.createElement(tag, props, ...children.filter(Boolean));

    const textStyle = (
      size: number,
      color: string,
      bold = false,
      extra: Record<string, unknown> = {}
    ) => ({
      fontSize: `${size}px`,
      color,
      fontWeight: bold ? 700 : 400,
      textAlign: "center" as const,
      ...extra,
    });

    const svg = await satori(
      el(
        "div",
        {
          style: {
            width: "600px",
            height: "900px",
            background: "#0d4f4f",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "Tajawal",
            position: "relative",
          },
        },
        // Gold top bar
        el("div", {
          style: {
            width: "100%",
            height: "6px",
            background: "linear-gradient(to right, #c9a351, #e6c872, #c9a351)",
          },
        }),
        // Header
        el(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "40px",
              paddingLeft: "40px",
              paddingRight: "40px",
            },
          },
          el(
            "p",
            { style: textStyle(16, "#e6c872", false, { marginBottom: "8px" }) },
            rtl("يسرنا دعوتكم لحضور حفل تكريم الفائزين")
          ),
          el(
            "p",
            { style: textStyle(26, "white", true, { lineHeight: "1.4" }) },
            rtl("بجائزة الأمير فيصل بن بندر بن عبدالعزيز")
          ),
          el(
            "p",
            { style: textStyle(22, "#e6c872", true, { marginTop: "4px" }) },
            rtl("للتميز والإبداع في دورتها الرابعة")
          ),
          el("div", {
            style: {
              width: "80px",
              height: "2px",
              background: "#c9a351",
              marginTop: "20px",
              marginBottom: "20px",
            },
          })
        ),
        // Guest info
        el(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#0a3a3a",
              borderRadius: "16px",
              border: "1px solid #1a6a6a",
              padding: "24px 40px",
              marginLeft: "40px",
              marginRight: "40px",
              width: "520px",
            },
          },
          el("p", { style: textStyle(14, "#e6c872") }, rtl(typeLabel)),
          el(
            "p",
            { style: textStyle(28, "white", true, { marginTop: "4px" }) },
            rtl(guest.name)
          ),
          guest.category
            ? el(
                "p",
                { style: textStyle(14, "#d1d5db", false, { marginTop: "4px" }) },
                rtl(guest.category)
              )
            : null,
          guest.parent_name
            ? el(
                "p",
                { style: textStyle(12, "#9ca3af", false, { marginTop: "4px" }) },
                rtl("مرافق: " + guest.parent_name)
              )
            : null
        ),
        // QR Code
        el(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              marginTop: "24px",
              marginBottom: "24px",
            },
          },
          el(
            "div",
            {
              style: {
                background: "white",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
              },
            },
            el("img", { src: qrDataUrl, width: 160, height: 160 })
          )
        ),
        // Event details
        el(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            },
          },
          el(
            "p",
            { style: textStyle(14, "#d1d5db", false, { marginBottom: "4px" }) },
            rtl("المقام في رحاب جامعة المعرفة بالدرعية")
          ),
          el(
            "p",
            { style: textStyle(18, "white", true) },
            rtl("الثلاثاء 25 ذو القعدة 1447 هـ")
          ),
          el(
            "p",
            { style: textStyle(14, "#d1d5db") },
            rtl("الموافق 12 مايو 2026")
          )
        ),
        // Gold bottom bar
        el("div", {
          style: {
            width: "100%",
            height: "6px",
            background: "linear-gradient(to right, #c9a351, #e6c872, #c9a351)",
            position: "absolute",
            bottom: "0",
          },
        })
      ),
      {
        width: 600,
        height: 900,
        fonts: [
          {
            name: "Tajawal",
            data: boldFont,
            weight: 700 as const,
            style: "normal" as const,
          },
          {
            name: "Tajawal",
            data: regularFont,
            weight: 400 as const,
            style: "normal" as const,
          },
        ],
      }
    );

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width" as const, value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="invitation-${guest.qr_code}.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
