import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (secret && signature) {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  return NextResponse.json({ ok: true });
}
