import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";

const schema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().default("INR"),
});

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
  }

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  // If environment variables are not configured, return a fallback response
  if (!key_id || !key_secret) {
    console.warn("Razorpay env vars not configured — returning demo fallback order.");
    return NextResponse.json({
      id: `order_rzp_demo_${Date.now()}`,
      amount: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      isFallback: true,
      authError: "Razorpay API keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
    });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });

    const order = await razorpay.orders.create({
      amount: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({ ...order, key_id, isFallback: false });
  } catch (err: any) {
    console.warn("Razorpay API authentication or order creation warning:", err);
    return NextResponse.json({
      id: `order_rzp_${Date.now()}`,
      amount: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      key_id,
      isFallback: true,
      authError: "Razorpay API key authentication failed. Check your Secret Key in .env",
    });
  }
}
