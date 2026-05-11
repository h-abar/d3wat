import { NextResponse } from "next/server";
import { getStats } from "@/lib/db";
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
    const stats = await getStats();
    return NextResponse.json(stats, { headers });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers });
  }
}
