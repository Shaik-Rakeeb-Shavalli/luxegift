import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment verification parameters." }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured in environment variables.");
      return NextResponse.json({ success: false, error: "Payment verification service not configured." }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return NextResponse.json({ success: true, message: "Payment verified successfully." });
    } else {
      return NextResponse.json({ success: false, error: "Invalid payment signature." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ success: false, error: "Payment verification failed." }, { status: 500 });
  }
}

