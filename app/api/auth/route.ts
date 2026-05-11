import { NextResponse } from "next/server";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "Um@2030";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return NextResponse.json({ success: true, token: Buffer.from(`${ADMIN_USER}:${Date.now()}`).toString("base64") });
    }

    return NextResponse.json({ success: false, error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
