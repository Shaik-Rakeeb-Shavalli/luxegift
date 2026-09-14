"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product, products } from "@/lib/data";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { getUserActivityFromFirestore, saveUserActivityToFirestore, subscribeToCoupons, type FirestoreCoupon } from "@/lib/firestore";

export interface CartItem {
  id: string; // Product ID, or a custom string for gift boxes
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  isCustomBox?: boolean;
  boxDesign?: string;
  wrappingStyle?: string;
  engravingText?: string;
  giftMessage?: string;
  photoUrls?: string[];
  deliveryDate?: string;
  boxItems?: { product: Product; quantity: number }[];
}

export interface OccasionReminder {
  id: string;
  title: string;
  relationship: string;
  occasionDate: string;
  reminderLeadDays: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  occasions: OccasionReminder[];
  couponCode: string | null;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addToCart: (item: CartItem) => boolean;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => boolean;
  isInWishlist: (productId: string) => boolean;
  addOccasion: (occasion: Omit<OccasionReminder, "id">) => boolean;
  removeOccasion: (id: string) => void;
  applyCouponCode: (code: string) => boolean;
  removeCouponCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<OccasionReminder[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // Live Firestore coupons for dynamic validation
  const [liveCoupons, setLiveCoupons] = useState<FirestoreCoupon[]>([]);

  // Read stored values safely after client hydration completes
  useEffect(() => {
    setCouponCode(readStoredJson<string | null>("luxegift_coupon", null));
    setIsLoaded(true);
  }, []);

  // Subscribe to Firestore coupons for real-time coupon validation
  useEffect(() => {
    const unsub = subscribeToCoupons((firestoreCoupons) => {
      setLiveCoupons(firestoreCoupons);
    });
    return () => unsub();
  }, []);

  // Synchronize cart, wishlist, and occasions with Cloud Firestore per user UID
  useEffect(() => {
    // Legacy cleanup: remove global un-scoped items that leaked into local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("luxegift_cart");
      localStorage.removeItem("luxegift_wishlist");
      localStorage.removeItem("luxegift_occasions");
    }

    if (!user?.id) {
      setCart([]);
      setWishlist([]);
      setOccasions([]);
      return;
    }

    // Load local user-scoped storage as instant initial state
    const localCart = readStoredJson<CartItem[]>(`luxegift_cart_${user.id}`, []);
    const localWishlist = readStoredJson<string[]>(`luxegift_wishlist_${user.id}`, []);
    const localOccasions = readStoredJson<OccasionReminder[]>(`luxegift_occasions_${user.id}`, []);

    setCart(localCart);
    setWishlist(localWishlist);
    setOccasions(localOccasions);

    // Fetch remote user activity from Firestore
    getUserActivityFromFirestore(user.id).then((remoteActivity) => {
      if (!remoteActivity) return;
      const userCart = remoteActivity.cart || localCart;
      const userWishlist = remoteActivity.wishlist || localWishlist;
      const userOccasions = remoteActivity.occasions || localOccasions;

      setCart(userCart);
      setWishlist(userWishlist);
      setOccasions(userOccasions);

      localStorage.setItem(`luxegift_cart_${user.id}`, JSON.stringify(userCart));
      localStorage.setItem(`luxegift_wishlist_${user.id}`, JSON.stringify(userWishlist));
      localStorage.setItem(`luxegift_occasions_${user.id}`, JSON.stringify(userOccasions));
    });
  }, [user?.id]);

  // Save to user-scoped localStorage & Cloud Firestore on change
  useEffect(() => {
    if (!isLoaded) return;
    if (user?.id) {
      localStorage.setItem(`luxegift_cart_${user.id}`, JSON.stringify(cart));
      saveUserActivityToFirestore(user.id, { cart });
    }
  }, [cart, isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (user?.id) {
      localStorage.setItem(`luxegift_wishlist_${user.id}`, JSON.stringify(wishlist));
      saveUserActivityToFirestore(user.id, { wishlist });
    }
  }, [wishlist, isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (user?.id) {
      localStorage.setItem(`luxegift_occasions_${user.id}`, JSON.stringify(occasions));
      saveUserActivityToFirestore(user.id, { occasions });
    }
  }, [occasions, isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("luxegift_coupon", JSON.stringify(couponCode));
  }, [couponCode, isLoaded]);


  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  // Dynamic discount: look up the applied coupon's percentOff from Firestore coupons.
  // Falls back to hardcoded LUXE10=10% if Firestore coupons haven't loaded yet.
  const discount = useMemo(() => {
    if (!couponCode) return 0;
    const matched = liveCoupons.find(
      (c) => c.code === couponCode.toUpperCase() && c.active
    );
    if (matched) return Math.round(subtotal * (matched.percentOff / 100));
    // Hardcoded fallback while Firestore loads
    if (couponCode.toUpperCase() === "LUXE10") return Math.round(subtotal * 0.1);
    return 0;
  }, [couponCode, liveCoupons, subtotal]);

  const deliveryFee = subtotal > 0 ? 499 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const addToCart = (item: CartItem): boolean => {
    if (!user) {
      toast.dismiss();
      toast.error("Please sign in first to add items to your cart.");
      router.push("/login");
      return false;
    }

    if (item.isCustomBox) {
      toast.dismiss();
      toast.success(`Bespoke ${item.name} added to cart`);
      setCart((prev) => [...prev, { ...item, id: `box-${Date.now()}` }]);
      return true;
    }

    const existing = cart.find((i) => i.id === item.id && !i.isCustomBox);
    toast.dismiss();
    if (existing) {
      toast.success(`Increased ${item.name} quantity to ${existing.quantity + item.quantity}`);
      setCart((prev) =>
        prev.map((i) =>
          i.id === item.id && !i.isCustomBox
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      );
    } else {
      toast.success(`${item.name} added to cart`);
      setCart((prev) => [...prev, item]);
    }
    return true;
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeFromCart = (id: string) => {
    const removed = cart.find((i) => i.id === id);
    if (removed) {
      toast.dismiss();
      toast.info(`Removed ${removed.name} from cart`);
    }
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode(null);
  };

  const toggleWishlist = (productId: string): boolean => {
    if (!user) {
      toast.dismiss();
      toast.error("Please sign in first to save items to your wishlist.");
      router.push("/login");
      return false;
    }

    const isWished = wishlist.includes(productId);
    const product = products.find((p) => p.id === productId);
    const name = product ? product.name : "Product";

    toast.dismiss();
    if (isWished) {
      toast.info(`Removed ${name} from your collection`);
      setWishlist((prev) => prev.filter((id) => id !== productId));
    } else {
      toast.success(`Saved ${name} to your collection`);
      setWishlist((prev) => [...prev, productId]);
    }
    return true;
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const addOccasion = (occ: Omit<OccasionReminder, "id">): boolean => {
    if (!user) {
      toast.dismiss();
      toast.error("Please sign in first to save gift reminders.");
      router.push("/login");
      return false;
    }

    const newOccasion: OccasionReminder = {
      ...occ,
      id: `occ-${Date.now()}`,
    };
    toast.dismiss();
    toast.success(`Gift reminder saved for "${occ.title}"`);
    setOccasions((prev) => [...prev, newOccasion]);
    return true;
  };

  const removeOccasion = (id: string) => {
    const removed = occasions.find((o) => o.id === id);
    if (removed) {
      toast.dismiss();
      toast.info(`Reminder for "${removed.title}" removed`);
    }
    setOccasions((prev) => prev.filter((o) => o.id !== id));
  };

  const applyCouponCode = (code: string) => {
    const formattedCode = code.toUpperCase().trim();
    toast.dismiss();

    // First check against live Firestore coupons
    if (liveCoupons.length > 0) {
      const matched = liveCoupons.find((c) => c.code === formattedCode);
      if (!matched) {
        toast.error("Invalid coupon code.");
        return false;
      }
      if (!matched.active) {
        toast.error(`Coupon ${formattedCode} is currently disabled.`);
        return false;
      }
      setCouponCode(formattedCode);
      toast.success(`Coupon ${formattedCode} applied! ${matched.percentOff}% discount subtracted.`);
      return true;
    }

    // Fallback: hardcoded LUXE10 while Firestore loads
    if (formattedCode === "LUXE10") {
      setCouponCode("LUXE10");
      toast.success("Coupon LUXE10 applied! 10% discount subtracted.");
      return true;
    }
    toast.error("Invalid coupon code.");
    return false;
  };

  const removeCouponCode = () => {
    setCouponCode(null);
    toast.dismiss();
    toast.info("Coupon removed.");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        occasions,
        couponCode,
        discount,
        subtotal,
        deliveryFee,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInWishlist,
        addOccasion,
        removeOccasion,
        applyCouponCode,
        removeCouponCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
