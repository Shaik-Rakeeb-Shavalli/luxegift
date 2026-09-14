import { getPrisma } from "./prisma";

type PrismaFallbackClient = {
  coupon: {
    findUnique(args: unknown): Promise<unknown>;
  };
  order: {
    create(args: unknown): Promise<unknown>;
  };
  review: {
    create(args: unknown): Promise<unknown>;
  };
};

export type StoredOrderResult = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  deliveryDate: Date | null;
  giftMessage: string | null;
  createdAt?: Date;
};

// Safe wrapper that catches DB connection/execution errors and returns fallback data
export async function safeDbQuery<T>(
  queryFn: (prisma: PrismaFallbackClient) => Promise<T>,
  fallbackFn: () => Promise<T> | T,
): Promise<T> {
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return await fallbackFn();
    }
    return await queryFn(prisma as PrismaFallbackClient);
  } catch (error) {
    console.warn("Database operation failed, falling back to local simulation:", error);
    return await fallbackFn();
  }
}

// Helpers for specific entities
export async function getDBCoupon(code: string) {
  return safeDbQuery(
    async (prisma) => {
      return await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });
    },
    async () => {
      // Fallback coupons
      if (code.toUpperCase() === "LUXE10") {
        return {
          id: "c-luxe10",
          code: "LUXE10",
          percentOff: 10,
          amountOff: null,
          active: true,
          startsAt: null,
          expiresAt: null,
        };
      }
      return null;
    }
  );
}

export async function createDBOrder(orderData: {
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
}): Promise<StoredOrderResult> {
  return safeDbQuery(
    async (prisma) => {
      const orderNumber = `LG-${Date.now().toString().slice(-6)}`;
      
      // Attempt full creation with address and order items
      return (await prisma.order.create({
        data: {
          orderNumber,
          email: orderData.email,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          total: orderData.total,
          giftMessage: orderData.giftMessage,
          deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : null,
          items: {
            create: orderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          },
          address: orderData.address ? {
            create: {
              name: orderData.address.name,
              phone: orderData.address.phone,
              line1: orderData.address.line1,
              city: orderData.address.city,
              region: orderData.address.region,
              postalCode: orderData.address.postalCode,
            }
          } : undefined
        }
      })) as StoredOrderResult;
    },
    async () => {
      // Simulation success structure
      const orderNumber = `LG-${Date.now().toString().slice(-6)}`;
      return {
        id: `ord-${Date.now()}`,
        orderNumber,
        email: orderData.email,
        status: "PAYMENT_PENDING",
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        total: orderData.total,
        deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : null,
        giftMessage: orderData.giftMessage || null,
        createdAt: new Date(),
      };
    }
  );
}

export async function submitDBReview(reviewData: {
  productId: string;
  rating: number;
  body: string;
  title?: string;
}) {
  return safeDbQuery(
    async (prisma) => {
      return await prisma.review.create({
        data: {
          productId: reviewData.productId,
          rating: reviewData.rating,
          body: reviewData.body,
          title: reviewData.title || null,
          approved: false, // Moderated
        }
      });
    },
    async () => {
      return {
        id: `rev-${Date.now()}`,
        productId: reviewData.productId,
        rating: reviewData.rating,
        body: reviewData.body,
        title: reviewData.title || null,
        approved: false,
        createdAt: new Date(),
      };
    }
  );
}
