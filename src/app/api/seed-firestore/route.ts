import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { products, categories, occasions } from "@/lib/data";

const sampleReviews = [
  {
    id: "r1",
    productId: "p1",
    productSlug: "midnight-atelier-box",
    author: "Arjun M.",
    rating: 5,
    body: "Absolutely breathtaking unboxing. The gold ribbon was gorgeous.",
    approved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "r2",
    productId: "p2",
    productSlug: "aura-wellness-ritual",
    author: "Priya S.",
    rating: 5,
    body: "Very calming scents, the monogram engraving was excellent.",
    approved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "r3",
    productId: "p3",
    productSlug: "imperial-date-confectionery",
    author: "Ananya K.",
    rating: 4.8,
    body: "Delivered right on time for Eid hosting. Exquisite packaging.",
    approved: true,
    createdAt: new Date().toISOString(),
  },
];

const sampleCoupons = [
  { code: "LUXE10", percentOff: 10, active: true, desc: "10% off on all baskets" },
  { code: "WELCOME", percentOff: 15, active: true, desc: "15% off first order" },
];

const sampleOrders = [
  {
    orderNumber: "LG-208173",
    customerName: "Shaik Rakeeb Sha Valli",
    customerEmail: "shaikrakeebshavalli@gmail.com",
    customerPhone: "+91 9876543210",
    items: [
      {
        id: "p2",
        name: "Velvet Rose & Champagne Set",
        price: 312,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800",
        category: "Celebration Florals",
      },
    ],
    subtotal: 312,
    discount: 0,
    deliveryFee: 199,
    total: 511,
    paymentMethod: "razorpay",
    paymentStatus: "PAID",
    status: "PAID",
    shippingAddress: {
      street: "80 Feet Road, Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      zip: "560034",
    },
    createdAt: "2026-09-13T12:00:00.000Z",
  },
];

export async function GET(request: Request) {
  // Security: Require a seed secret token to prevent unauthorized data reseeding
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const authHeader = request.headers.get("authorization");
    const providedToken = authHeader?.replace("Bearer ", "").trim();
    if (providedToken !== seedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Provide a valid SEED_SECRET token in the Authorization header." },
        { status: 401 }
      );
    }
  } else {
    // No secret configured — warn but allow (for local development convenience)
    console.warn("[seed-firestore] SEED_SECRET env var not set. Seeding is unprotected. Set SEED_SECRET in .env for production.");
  }

  try {
    // 1. Seed Products
    for (const product of products) {
      await setDoc(doc(db, "products", product.id), product);
    }

    // 2. Seed Categories
    for (const category of categories) {
      const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await setDoc(doc(db, "categories", slug), { name: category, slug });
    }

    // 3. Seed Occasions
    for (const occasion of occasions) {
      const slug = occasion.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await setDoc(doc(db, "occasions", slug), { title: occasion, slug });
    }

    // 4. Seed Reviews
    for (const review of sampleReviews) {
      await setDoc(doc(db, "reviews", review.id), review);
    }

    // 5. Seed Orders
    for (const order of sampleOrders) {
      await setDoc(doc(db, "orders", order.orderNumber), order);
    }

    // 6. Seed Coupons
    for (const coupon of sampleCoupons) {
      await setDoc(doc(db, "coupons", coupon.code), coupon);
    }

    // 7. Seed Analytics summary as zero starting fresh
    await setDoc(doc(db, "analytics", "summary"), {
      grossRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      shopConversion: 0,
      monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Successfully seeded all project data into Firestore database!",
      seededCounts: {
        products: products.length,
        categories: categories.length,
        occasions: occasions.length,
        reviews: sampleReviews.length,
        orders: sampleOrders.length,
        coupons: sampleCoupons.length,
        analytics: 1,
      },
    });
  } catch (error: any) {
    console.error("Firestore Seeding Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed Firestore data" },
      { status: 500 }
    );
  }
}
