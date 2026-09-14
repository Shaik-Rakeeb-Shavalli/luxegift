import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { CartItem } from "@/context/cart-context";

// Collection Names
export const COLLECTIONS = {
  ORDERS: "orders",
  CUSTOM_BOXES: "custom_boxes",
  REVIEWS: "reviews",
  OCCASIONS: "occasions",
  USERS: "users",
  PRODUCTS: "products",
  COUPONS: "coupons",
  ANALYTICS: "analytics",
} as const;

/**
 * Recursively strips `undefined` fields from an object/array so Firestore setDoc never throws.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if ((obj as any)._methodName || (obj as any).seconds !== undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as any;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

// ─── Analytics Types & Helpers ──────────────────────────────────────────────

export interface FirestoreAnalytics {
  grossRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  shopConversion: number;
  monthlyRevenue: number[];
  updatedAt?: any;
}

export const INITIAL_ANALYTICS: FirestoreAnalytics = {
  grossRevenue: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  shopConversion: 0,
  monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** Reset or set initial analytics document in Firestore to all zeros */
export async function resetAnalyticsInFirestore(): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ANALYTICS, "summary");
    await setDoc(docRef, {
      ...INITIAL_ANALYTICS,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Error resetting analytics in Firestore:", error);
    throw error;
  }
}

export const SINGLE_REAL_ORDER: FirestoreOrder = {
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
};

/**
 * Resets the orders collection in Firestore so it contains ONLY the single real order (LG-208173),
 * and resets analytics summary metrics to zero baselines.
 */
export async function resetOrdersToSingleRealOrder(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.id !== "LG-208173") {
        await deleteDoc(doc(db, COLLECTIONS.ORDERS, docSnap.id));
      }
    }

    const singleDocRef = doc(db, COLLECTIONS.ORDERS, "LG-208173");
    await setDoc(singleDocRef, {
      ...SINGLE_REAL_ORDER,
      createdAt: serverTimestamp(),
    });

    await resetAnalyticsInFirestore();
  } catch (error) {
    console.warn("Error resetting orders to single real order in Firestore:", error);
  }
}

/** Subscribe to real-time analytics document in Firestore */
export function subscribeToAnalytics(
  onUpdate: (analytics: FirestoreAnalytics) => void
): Unsubscribe {
  try {
    const docRef = doc(db, COLLECTIONS.ANALYTICS, "summary");
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as FirestoreAnalytics;
          onUpdate({
            grossRevenue: Number(data.grossRevenue) || 0,
            totalOrders: Number(data.totalOrders) || 0,
            averageOrderValue: Number(data.averageOrderValue) || 0,
            shopConversion: Number(data.shopConversion) || 0,
            monthlyRevenue: Array.isArray(data.monthlyRevenue) && data.monthlyRevenue.length === 12
              ? data.monthlyRevenue.map(v => Number(v) || 0)
              : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          });
        } else {
          resetAnalyticsInFirestore();
          onUpdate(INITIAL_ANALYTICS);
        }
      },
      () => {
        // Silently handle Firestore permission errors
      }
    );
  } catch {
    return () => {};
  }
}

// ─── Product Types & Helpers ────────────────────────────────────────────────

export interface FirestoreProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  occasion: string[];
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  tags: string[];
  color: string;
  image: string;
  description: string;
  qty?: number;
  inStock?: boolean;
}

/** Save (create or update) a product document in Firestore */
export async function saveProductToFirestore(product: FirestoreProduct): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    await setDoc(docRef, { ...product }, { merge: true });
  } catch (error) {
    console.warn("Error saving product to Firestore:", error);
    throw error;
  }
}

/** Delete a product document from Firestore */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Error deleting product from Firestore:", error);
    throw error;
  }
}

/** Update only the stock fields (qty and inStock) of a product document */
export async function updateProductStockInFirestore(
  productId: string,
  qty: number,
  inStock: boolean
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await setDoc(docRef, { qty, inStock }, { merge: true });
  } catch (error) {
    console.warn("Error updating product stock in Firestore:", error);
  }
}

/** Real-time listener for the products collection */
export function subscribeToProducts(
  onUpdate: (products: FirestoreProduct[]) => void
): Unsubscribe {
  try {
    const q = query(collection(db, COLLECTIONS.PRODUCTS));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreProduct[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as FirestoreProduct),
          id: docSnap.id,
        }));
        onUpdate(list);
      },
      () => {
        // Silently handle Firestore permission errors
      }
    );
  } catch {
    return () => {};
  }
}

// ─── Coupon Types & Helpers ──────────────────────────────────────────────────

export interface FirestoreCoupon {
  code: string;
  percentOff: number;
  active: boolean;
  desc: string;
}

/** Save (create or update) a coupon document in Firestore */
export async function saveCouponToFirestore(coupon: FirestoreCoupon): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.COUPONS, coupon.code);
    await setDoc(docRef, coupon, { merge: true });
  } catch (error) {
    console.warn("Error saving coupon to Firestore:", error);
    throw error;
  }
}

/** Delete a coupon document from Firestore by its code */
export async function deleteCouponFromFirestore(code: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.COUPONS, code);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Error deleting coupon from Firestore:", error);
    throw error;
  }
}

/** Real-time listener for the coupons collection */
export function subscribeToCoupons(
  onUpdate: (coupons: FirestoreCoupon[]) => void
): Unsubscribe {
  try {
    const q = query(collection(db, COLLECTIONS.COUPONS));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreCoupon[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as FirestoreCoupon),
          code: docSnap.id,
        }));
        onUpdate(list);
      },
      () => {
        // Silently handle Firestore permission errors
      }
    );
  } catch {
    return () => {};
  }
}

export interface FirestoreOrder {
  id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: string;
  status?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt?: any;
}

export interface FirestoreReview {
  id: string;
  productId: string;
  productSlug?: string;
  author: string;
  rating: number;
  body: string;
  approved: boolean;
  createdAt?: any;
}

/**
 * Update Analytics Summary document in Firestore when a new paid order is placed
 */
export async function updateAnalyticsOnNewOrder(orderTotal: number, orderDate?: Date): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ANALYTICS, "summary");
    const snap = await getDoc(docRef);
    let current: FirestoreAnalytics = snap.exists() ? (snap.data() as FirestoreAnalytics) : { ...INITIAL_ANALYTICS };

    const newGross = (current.grossRevenue || 0) + orderTotal;
    const newTotalOrders = (current.totalOrders || 0) + 1;
    const newAOV = newTotalOrders > 0 ? Math.round(newGross / newTotalOrders) : 0;

    const monthly = Array.isArray(current.monthlyRevenue) && current.monthlyRevenue.length === 12
      ? [...current.monthlyRevenue]
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const monthIdx = (orderDate || new Date()).getMonth();
    monthly[monthIdx] = (monthly[monthIdx] || 0) + orderTotal;

    await setDoc(
      docRef,
      {
        grossRevenue: newGross,
        totalOrders: newTotalOrders,
        averageOrderValue: newAOV,
        shopConversion: current.shopConversion || 0,
        monthlyRevenue: monthly,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Error updating analytics summary in Firestore:", error);
  }
}

/**
 * Save an order to Firestore (triggered by Customer Checkout)
 */
export async function saveOrderToFirestore(orderData: Omit<FirestoreOrder, "id">): Promise<string> {
  try {
    const sanitizedData = sanitizeForFirestore({
      ...orderData,
      status: orderData.status || "PAYMENT_PENDING",
      createdAt: serverTimestamp(),
    });
    const docRef = doc(db, COLLECTIONS.ORDERS, orderData.orderNumber);
    await setDoc(docRef, sanitizedData);

    if (orderData.status === "PAID" || orderData.paymentStatus === "PAID") {
      await updateAnalyticsOnNewOrder(orderData.total);
    }

    return orderData.orderNumber;
  } catch (error) {
    console.warn("Firestore error saving order:", error);
    throw error;
  }
}

/**
 * Update Order Status in Firestore (triggered by Admin Workspace)
 */
export async function updateOrderStatusInFirestore(orderNumber: string, status: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderNumber);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.warn("Error updating order status in Firestore:", error);
  }
}

/**
 * REAL-TIME LISTENERS: Subscribe to Live Orders across Admin and Customer portals
 */
export function subscribeToOrders(onUpdate: (orders: FirestoreOrder[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, COLLECTIONS.ORDERS));
    return onSnapshot(
      q,
      (snapshot) => {
        const ordersList: FirestoreOrder[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FirestoreOrder, "id">),
        }));
        onUpdate(ordersList);
      },
      () => {
        // Silently handle Firestore permissions restriction when security rules are locked
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * REAL-TIME LISTENERS: Subscribe to Live Customer Reviews
 */
export function subscribeToReviews(onUpdate: (reviews: FirestoreReview[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, COLLECTIONS.REVIEWS));
    return onSnapshot(
      q,
      (snapshot) => {
        const reviewsList: FirestoreReview[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as FirestoreReview),
          id: docSnap.id,
        }));
        onUpdate(reviewsList);
      },
      () => {
        // Silently handle Firestore permissions restriction when security rules are locked
      }
    );
  } catch {
    return () => {};
  }
}


/**
 * Update Review Approval Status in Firestore
 */
export async function updateReviewApprovalInFirestore(reviewId: string, approved: boolean): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    await updateDoc(docRef, { approved });
  } catch (error) {
    console.warn("Error updating review status in Firestore:", error);
  }
}

/**
 * Delete a review document from Firestore (used when admin rejects a review)
 */
export async function deleteReviewFromFirestore(reviewId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Error deleting review from Firestore:", error);
    throw error;
  }
}

/**
 * Fetch all orders from Firestore once
 */
export async function getOrdersFromFirestore(): Promise<FirestoreOrder[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ORDERS), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<FirestoreOrder, "id">),
    }));
  } catch (error) {
    console.warn("Error fetching orders from Firestore:", error);
    return [];
  }
}

/**
 * Save custom built gift box to Firestore
 */
export async function saveCustomBoxToFirestore(boxData: {
  userId?: string;
  boxSize: string;
  boxDesign: string;
  items: { productId: string; name: string; price: number }[];
  totalPrice: number;
  engravingText?: string;
  giftMessage?: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOM_BOXES), {
      ...boxData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn("Error saving custom box to Firestore:", error);
    throw error;
  }
}

/**
 * Save customer review to Firestore
 */
export async function saveReviewToFirestore(review: {
  productId: string;
  author: string;
  rating: number;
  body: string;
  approved?: boolean;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
      ...review,
      approved: review.approved ?? false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn("Error saving review to Firestore:", error);
    throw error;
  }
}

// User Profile & Address Types & Firestore Helpers
export interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  tier?: string;
}

export interface UserAddressItem {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
}

/**
 * Save user profile details to Cloud Firestore
 */
export async function saveUserProfileToFirestore(
  userId: string,
  profile: UserProfileData
): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const phoneValue = profile.phone || "";
    await setDoc(
      userDocRef,
      sanitizeForFirestore({
        phone: phoneValue,
        mobile: phoneValue,
        profile: {
          ...profile,
          phone: phoneValue,
          mobile: phoneValue,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn("Error saving user profile to Firestore:", error);
  }
}

/**
 * Fetch user profile details from Cloud Firestore
 */
export async function getUserProfileFromFirestore(
  userId: string
): Promise<UserProfileData | null> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const profile = data?.profile || {};
      const phone = profile.phone || profile.mobile || data.phone || data.mobile || "";
      return {
        name: profile.name || data.name || "",
        email: profile.email || data.email || "",
        phone,
        tier: profile.tier || "Prestige Tier Member",
      };
    }
    return null;
  } catch (error) {
    console.warn("Error loading user profile from Firestore:", error);
    return null;
  }
}

/**
 * Save user delivery addresses to Cloud Firestore
 */
export async function saveUserAddressesToFirestore(
  userId: string,
  addresses: UserAddressItem[]
): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(
      userDocRef,
      sanitizeForFirestore({
        addresses,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn("Error saving addresses to Firestore:", error);
  }
}

/**
 * Fetch user delivery addresses from Cloud Firestore
 */
export async function getUserAddressesFromFirestore(
  userId: string
): Promise<UserAddressItem[] | null> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && Array.isArray(snap.data()?.addresses)) {
      return snap.data().addresses as UserAddressItem[];
    }
    return null;
  } catch (error) {
    console.warn("Error loading addresses from Firestore:", error);
    return null;
  }
}

/**
 * Save new user account details to Cloud Firestore on registration or login
 */
export async function saveNewUserToFirestore(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  },
  mobile?: string
): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, user.id);
    const existingSnap = await getDoc(userDocRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;
    const existingProfile = existingData?.profile;

    const phone = mobile || user.phone || existingProfile?.phone || existingProfile?.mobile || existingData?.phone || existingData?.mobile || "";

    await setDoc(
      userDocRef,
      sanitizeForFirestore({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone,
        mobile: phone,
        profile: {
          name: user.name || existingProfile?.name || "",
          email: user.email || existingProfile?.email || "",
          phone,
          mobile: phone,
          tier: existingProfile?.tier || "Prestige Tier Member",
        },
        lastLoginAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn("Error saving user to Firestore:", error);
  }
}

/**
 * Save user cart, wishlist, and occasion activity to Cloud Firestore
 */
export async function saveUserActivityToFirestore(
  userId: string,
  activity: {
    cart?: any[];
    wishlist?: string[];
    occasions?: any[];
  }
): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(
      userDocRef,
      sanitizeForFirestore({
        ...activity,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn("Error saving user activity to Firestore:", error);
  }
}

/**
 * Fetch user cart, wishlist, and occasion activity from Cloud Firestore
 */
export async function getUserActivityFromFirestore(userId: string): Promise<{
  cart?: any[];
  wishlist?: string[];
  occasions?: any[];
} | null> {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        cart: Array.isArray(data.cart) ? data.cart : undefined,
        wishlist: Array.isArray(data.wishlist) ? data.wishlist : undefined,
        occasions: Array.isArray(data.occasions) ? data.occasions : undefined,
      };
    }
    return null;
  } catch (error) {
    console.warn("Error loading user activity from Firestore:", error);
    return null;
  }
}


