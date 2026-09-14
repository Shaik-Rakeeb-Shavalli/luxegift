"use server";

import { z } from "zod";

const couponSchema = z.object({
  code: z.string().trim().min(2).max(32),
  subtotal: z.coerce.number().positive(),
});

export async function validateCoupon(input: unknown) {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid coupon." };
  }

  const code = parsed.data.code.toUpperCase();
  if (code === "LUXE10") {
    return {
      ok: true,
      code,
      discount: Math.round(parsed.data.subtotal * 0.1),
      message: "LUXE10 applied.",
    };
  }

  return { ok: false, message: "Coupon is not active for this order." };
}

import { createDBOrder, type StoredOrderResult } from "./db-helper";

export async function createOrder(orderData: {
  email: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  giftMessage?: string;
  deliveryDate?: string;
  items: { productId: string; quantity: number; price: number }[];
  address?: {
    name: string;
    phone: string;
    line1: string;
    city: string;
    region: string;
    postalCode: string;
  };
}): Promise<
  | { ok: false; message: string; order?: never }
  | { ok: true; order: StoredOrderResult; message: string }
> {
  if (!orderData.email || !orderData.email.includes("@")) {
    return { ok: false, message: "Add a valid email." };
  }

  const order = await createDBOrder(orderData);
  return {
    ok: true,
    order,
    message: `Order reserved: ${order.orderNumber}.`,
  };
}

export async function saveGiftBoxDraft(payload: unknown) {
  return {
    ok: true,
    draftId: `BOX-${Date.now().toString().slice(-6)}`,
    payload,
  };
}

export async function toggleWishlist(productId: string) {
  return { ok: true, productId, wished: true };
}

export async function submitReview() {
  return { ok: true, message: "Review queued for moderation." };
}

export async function saveOccasion() {
  return { ok: true, message: "Occasion saved. Reminder emails require Resend configuration." };
}
