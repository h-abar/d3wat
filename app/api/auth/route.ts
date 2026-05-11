import { NextResponse } from "next/server";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getSecurityHeaders } from "@/lib/security";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "Um@2030";

export async function POST(request: Request) {
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
    const { username, password } = await request.json();

    // Input validation
    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401, headers }
      );
    }

    // Length validation
    if (username.length > 100 || password.length > 100) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401, headers }
      );
    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return NextResponse.json(
        { success: true, token: Buffer.from(`${ADMIN_USER}:${Date.now()}`).toString("base64") },
        { headers }
      );
    }

    return NextResponse.json(
      { success: false, error: "بيانات الدخول غير صحيحة" },
      { status: 401, headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers }
    );
  }
}
