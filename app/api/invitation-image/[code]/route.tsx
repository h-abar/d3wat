import { NextResponse } from "next/server";
import { getGuestByQrCode } from "@/lib/db";
import QRCode from "qrcode";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import React from "react";

const fontsDir = path.join(process.cwd(), "public", "fonts");

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    winner: "\u0641\u0627\u0626\u0632",
    companion: "\u0645\u0631\u0627\u0641\u0642",
    judge: "\u0645\u062d\u0643\u0651\u0645",
    coordinator: "\u0645\u0646\u0633\u0651\u0642",
    media: "\u0625\u0639\u0644\u0627\u0645\u064a",
    other: "\u0645\u062f\u0639\u0648",
  };
  return labels[type] || type;
}

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

    const svg = await satori(
      React.createElement(
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
            direction: "rtl",
            position: "relative",
          },
        },
        // Gold top bar
        React.createElement("div", {
          style: {
            width: "100%",
            height: "6px",
            background: "linear-gradient(to right, #c9a351, #e6c872, #c9a351)",
          },
        }),
        // Header text
        React.createElement(
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
          React.createElement(
            "div",
            { style: { color: "#e6c872", fontSize: "16px", marginBottom: "8px" } },
            "\u064a\u0633\u0631\u0646\u0627 \u062f\u0639\u0648\u062a\u0643\u0645 \u0644\u062d\u0636\u0648\u0631 \u062d\u0641\u0644 \u062a\u0643\u0631\u064a\u0645 \u0627\u0644\u0641\u0627\u0626\u0632\u064a\u0646"
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "white",
                fontSize: "26px",
                fontWeight: 700,
                textAlign: "center",
                lineHeight: "1.4",
              },
            },
            "\u0628\u062c\u0627\u0626\u0632\u0629 \u0627\u0644\u0623\u0645\u064a\u0631 \u0641\u064a\u0635\u0644 \u0628\u0646 \u0628\u0646\u062f\u0631 \u0628\u0646 \u0639\u0628\u062f\u0627\u0644\u0639\u0632\u064a\u0632"
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "#e6c872",
                fontSize: "22px",
                fontWeight: 700,
                marginTop: "4px",
              },
            },
            "\u0644\u0644\u062a\u0645\u064a\u0632 \u0648\u0627\u0644\u0625\u0628\u062f\u0627\u0639 \u0641\u064a \u062f\u0648\u0631\u062a\u0647\u0627 \u0627\u0644\u0631\u0627\u0628\u0639\u0629"
          ),
          // Divider
          React.createElement("div", {
            style: {
              width: "80px",
              height: "2px",
              background: "#c9a351",
              marginTop: "20px",
              marginBottom: "20px",
            },
          })
        ),
        // Guest info box
        React.createElement(
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
          React.createElement(
            "div",
            { style: { color: "#e6c872", fontSize: "14px", marginBottom: "4px" } },
            typeLabel
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "white",
                fontSize: "28px",
                fontWeight: 700,
                textAlign: "center",
              },
            },
            guest.name
          ),
          guest.category
            ? React.createElement(
                "div",
                { style: { color: "#d1d5db", fontSize: "14px", marginTop: "4px" } },
                guest.category
              )
            : null,
          guest.parent_name
            ? React.createElement(
                "div",
                { style: { color: "#9ca3af", fontSize: "12px", marginTop: "4px" } },
                `\u0645\u0631\u0627\u0641\u0642: ${guest.parent_name}`
              )
            : null
        ),
        // QR Code
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              marginTop: "24px",
              marginBottom: "24px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                background: "white",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
              },
            },
            React.createElement("img", {
              src: qrDataUrl,
              width: 160,
              height: 160,
            })
          )
        ),
        // Event details
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            },
          },
          React.createElement(
            "div",
            { style: { color: "#d1d5db", fontSize: "14px", marginBottom: "4px" } },
            "\u0627\u0644\u0645\u0642\u0627\u0645 \u0641\u064a \u0631\u062d\u0627\u0628 \u062c\u0627\u0645\u0639\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0628\u0627\u0644\u062f\u0631\u0639\u064a\u0629"
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "white",
                fontSize: "18px",
                fontWeight: 700,
              },
            },
            "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621 25 \u0630\u0648 \u0627\u0644\u0642\u0639\u062f\u0629 1447 \u0647\u0640"
          ),
          React.createElement(
            "div",
            { style: { color: "#d1d5db", fontSize: "14px" } },
            "\u0627\u0644\u0645\u0648\u0627\u0641\u0642 12 \u0645\u0627\u064a\u0648 2026"
          )
        ),
        // Gold bottom bar
        React.createElement("div", {
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
          { name: "Tajawal", data: boldFont, weight: 700 as const, style: "normal" as const },
          { name: "Tajawal", data: regularFont, weight: 400 as const, style: "normal" as const },
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
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
