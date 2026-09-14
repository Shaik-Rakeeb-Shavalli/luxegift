"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  subscribeToProducts,
  subscribeToCoupons,
  type FirestoreProduct,
  type FirestoreCoupon,
} from "@/lib/firestore";
import { products as fallbackProducts } from "@/lib/data";
import type { Product } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductsContextType {
  /** Live products from Firestore (falls back to data.ts if Firestore is empty or unavailable) */
  products: Product[];
  /** Live coupons from Firestore */
  coupons: FirestoreCoupon[];
  /** True while the initial Firestore snapshot has not arrived yet */
  isLoading: boolean;
  /** Non-null if a Firestore connection error occurred */
  error: string | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProductsContext = createContext<ProductsContextType>({
  products: fallbackProducts,
  coupons: [],
  isLoading: true,
  error: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [coupons, setCoupons] = useState<FirestoreCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsReady, setProductsReady] = useState(false);
  const [couponsReady, setCouponsReady] = useState(false);

  useEffect(() => {
    let productsUnsub: () => void = () => {};
    let couponsUnsub: () => void = () => {};

    try {
      productsUnsub = subscribeToProducts((firestoreProducts: FirestoreProduct[]) => {
        if (firestoreProducts.length > 0) {
          setProducts(firestoreProducts as unknown as Product[]);
        } else {
          setProducts(fallbackProducts);
        }
        setProductsReady(true);
      });

      couponsUnsub = subscribeToCoupons((firestoreCoupons: FirestoreCoupon[]) => {
        setCoupons(firestoreCoupons);
        setCouponsReady(true);
      });
    } catch (err) {
      console.warn("ProductsContext: Firestore subscription failed:", err);
      setError("Failed to connect to Firestore. Using local data.");
      setProductsReady(true);
      setCouponsReady(true);
    }

    return () => {
      productsUnsub();
      couponsUnsub();
    };
  }, []);

  useEffect(() => {
    if (productsReady && couponsReady) {
      setIsLoading(false);
    }
  }, [productsReady, couponsReady]);

  return (
    <ProductsContext.Provider value={{ products, coupons, isLoading, error }}>
      {children}
    </ProductsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts(): ProductsContextType {
  return useContext(ProductsContext);
}
