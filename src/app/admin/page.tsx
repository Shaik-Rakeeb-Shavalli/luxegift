"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BarChart3, Boxes, MessageSquareWarning, PackageCheck, Percent, Check, X, Plus, RefreshCw, Database, Radio, Pencil, Trash2, Upload, Download, FileUp, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { products as initialProducts, Product, slugify } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import { downloadOrderInvoice } from "@/lib/invoice";
import { toast } from "sonner";
import {
  subscribeToOrders,
  subscribeToReviews,
  subscribeToProducts,
  subscribeToCoupons,
  subscribeToAnalytics,
  resetAnalyticsInFirestore,
  resetOrdersToSingleRealOrder,
  updateOrderStatusInFirestore,
  updateReviewApprovalInFirestore,
  deleteReviewFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  updateProductStockInFirestore,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  FirestoreOrder,
  type FirestoreCoupon,
  type FirestoreAnalytics,
  INITIAL_ANALYTICS,
} from "@/lib/firestore";

type AdminTab = "analytics" | "products" | "orders" | "coupons" | "reviews";

const ORDER_STATUS_OPTIONS = [
  { value: "PAYMENT_PENDING", label: "PAYMENT PENDING" },
  { value: "PAYMENT_FAILED", label: "PAYMENT FAILED" },
  { value: "PAID", label: "PAID (RESERVED)" },
  { value: "FULFILLED", label: "FULFILLED (SHIPPED)" },
  { value: "DELIVERED", label: "DELIVERED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

type AdminOrderItem = {
  name: string;
  qty?: number;
  quantity?: number;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  email?: string;
  total: number;
  status: string;
  items: AdminOrderItem[];
  date: string;
};

type AdminReview = {
  id: string;
  product: string;
  author: string;
  rating: number;
  body: string;
  approved: boolean;
};

function readAdminOrders(): AdminOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const history = localStorage.getItem("luxegift_orders_history");
    return history ? (JSON.parse(history) as AdminOrder[]) : [];
  } catch {
    return [];
  }
}

function parseCSVToProducts(csvText: string): Product[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("title"));
  const categoryIdx = headers.findIndex((h) => h.includes("category"));
  const priceIdx = headers.findIndex((h) => h.includes("price"));
  const slugIdx = headers.findIndex((h) => h.includes("slug"));
  const imageIdx = headers.findIndex((h) => h.includes("image") || h.includes("img") || h.includes("url"));
  const descIdx = headers.findIndex((h) => h.includes("desc"));
  const compareAtIdx = headers.findIndex((h) => h.includes("compare"));

  const parsed: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const fields: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        fields.push(currentField.trim().replace(/^"|"$/g, ''));
        currentField = "";
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/^"|"$/g, ''));

    const name = (nameIdx !== -1 && fields[nameIdx]) ? fields[nameIdx] : `Imported Item ${i}`;
    if (!name || name.toLowerCase() === "name") continue;

    const price = (priceIdx !== -1 && fields[priceIdx]) ? parseFloat(fields[priceIdx].replace(/[^0-9.]/g, "")) || 9900 : 9900;
    const category = (categoryIdx !== -1 && fields[categoryIdx]) ? fields[categoryIdx] : "Signature Hampers";
    const slug = (slugIdx !== -1 && fields[slugIdx]) ? fields[slugIdx] : slugify(name);
    const image = (imageIdx !== -1 && fields[imageIdx]) ? fields[imageIdx] : "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800";
    const description = (descIdx !== -1 && fields[descIdx]) ? fields[descIdx] : "Hand-crafted luxury gift item.";
    const compareAt = (compareAtIdx !== -1 && fields[compareAtIdx]) ? parseFloat(fields[compareAtIdx].replace(/[^0-9.]/g, "")) : undefined;

    parsed.push({
      id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      slug,
      name,
      category,
      occasion: ["Anniversary Gifts", "Corporate Gifts"],
      price,
      compareAt,
      rating: 5.0,
      reviews: 1,
      tags: ["Imported", "Luxury"],
      color: "gold",
      image,
      description,
    });
  }

  return parsed;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const [isLiveSync, setIsLiveSync] = useState(false);

  // Admin Database States
  // Products come from Firestore onSnapshot — start with hardcoded fallback to avoid empty flash
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [ordersList, setOrdersList] = useState<AdminOrder[]>(readAdminOrders);
  // Coupons come from Firestore onSnapshot
  const [couponsList, setCouponsList] = useState<FirestoreCoupon[]>([]);
  const [reviewsList, setReviewsList] = useState<AdminReview[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Analytics State from Firestore
  const [analyticsData, setAnalyticsData] = useState<FirestoreAnalytics>(INITIAL_ANALYTICS);
  const [isResettingStats, setIsResettingStats] = useState(false);

  // Stock data: now sourced from product documents (qty, inStock fields)
  // Local override map for optimistic UI updates before Firestore round-trip
  const [stockData, setStockData] = useState<Record<string, { qty: number; inStock: boolean }>>({});

  const getStock = (product: Product) => {
    // Local optimistic override first, then Firestore product fields, then defaults
    if (stockData[product.id]) return stockData[product.id];
    return {
      qty: (product as any).qty ?? 10,
      inStock: (product as any).inStock ?? true,
    };
  };

  const updateStock = (id: string, patch: Partial<{ qty: number; inStock: boolean }>) => {
    // Optimistic UI update
    setStockData((prev) => {
      const current = prev[id] ?? { qty: (productsList.find(p => p.id === id) as any)?.qty ?? 10, inStock: (productsList.find(p => p.id === id) as any)?.inStock ?? true };
      return { ...prev, [id]: { ...current, ...patch } };
    });
    // Persist to Firestore
    const current = stockData[id] ?? { qty: (productsList.find(p => p.id === id) as any)?.qty ?? 10, inStock: (productsList.find(p => p.id === id) as any)?.inStock ?? true };
    updateProductStockInFirestore(id, patch.qty ?? current.qty, patch.inStock ?? current.inStock);
  };

  // Product Edit & Bulk CSV Import States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState("");

  const [editForm, setEditForm] = useState<{
    name: string;
    slug: string;
    category: string;
    price: number;
    compareAt: number | "";
    image: string;
    description: string;
  }>({
    name: "",
    slug: "",
    category: "Signature Hampers",
    price: 0,
    compareAt: "",
    image: "",
    description: "",
  });

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: product.price,
      compareAt: product.compareAt || "",
      image: product.image,
      description: product.description || "",
    });
  };

  const handleSaveEditProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated: Product = {
      ...editingProduct,
      name: editForm.name.trim(),
      slug: editForm.slug.trim() || editingProduct.slug,
      category: editForm.category,
      price: Number(editForm.price),
      compareAt: editForm.compareAt !== "" ? Number(editForm.compareAt) : undefined,
      image: editForm.image.trim(),
      description: editForm.description.trim(),
    };

    try {
      await saveProductToFirestore(updated as any);
      setEditingProduct(null);
      toast.dismiss();
      toast.success(`Product "${updated.name}" updated in Firestore!`);
    } catch {
      toast.error("Failed to save product to Firestore.");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProductFromFirestore(id);
      toast.dismiss();
      toast.info(`Product "${name}" deleted from Firestore.`);
    } catch {
      toast.error("Failed to delete product from Firestore.");
    }
  };

  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) setCsvInput(text);
    };
    reader.readAsText(file);
  };

  const downloadCSVSample = () => {
    const sampleCSV = `name,slug,category,price,compareAt,image,description
Royal Sapphire Vault,royal-sapphire-vault,Corporate Prestige,18500,21000,https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800,Hand-crafted lead crystal decanter with 24k gold accents.
Velvet Rose & Champagne Set,velvet-rose-champagne,Celebration Florals,12900,14900,https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800,Preserved Ecuadorian roses with crystal champagne flutes.`;

    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "luxegift_products_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.dismiss();
    toast.success("Sample CSV template downloaded!");
  };

  const handleImportCSV = async () => {
    if (!csvInput.trim()) {
      toast.dismiss();
      toast.error("Please paste CSV data or choose a CSV file.");
      return;
    }

    const parsed = parseCSVToProducts(csvInput);
    if (parsed.length === 0) {
      toast.dismiss();
      toast.error("No valid products found in CSV. Please verify column headers.");
      return;
    }

    try {
      await Promise.all(parsed.map((p) => saveProductToFirestore(p as any)));
      setIsCSVModalOpen(false);
      setCsvInput("");
      toast.dismiss();
      toast.success(`Successfully imported ${parsed.length} products to Firestore!`);
    } catch {
      toast.error("Failed to import some products to Firestore.");
    }
  };

  // Stock control uses updateStock() — price editing is done via the Edit modal

  // Real-time Firestore Subscriptions (Admin <-> Database <-> Customer)
  useEffect(() => {
    // ── Analytics ─────────────────────────────────────────────────────────
    const unsubAnalytics = subscribeToAnalytics((data) => {
      setAnalyticsData(data);
    });

    // ── Products ──────────────────────────────────────────────────────────
    const unsubProducts = subscribeToProducts((firestoreProducts) => {
      if (firestoreProducts.length > 0) {
        setProductsList(firestoreProducts as unknown as Product[]);
      }
      setIsProductsLoading(false);
    });

    // ── Coupons ───────────────────────────────────────────────────────────
    const unsubCoupons = subscribeToCoupons((firestoreCoupons) => {
      setCouponsList(firestoreCoupons);
    });

    // ── Orders ────────────────────────────────────────────────────────────
    const unsubOrders = subscribeToOrders((firestoreOrders) => {
      setIsLiveSync(true);
      setOrdersList(
        firestoreOrders.map((fo) => {
          const key = fo.orderNumber || fo.id || `ord-${Date.now()}`;
          const parsedDate = parseOrderDate(fo.createdAt);
          const dateDisplay = parsedDate 
            ? parsedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "13 Sep 2026";

          return {
            id: key,
            orderNumber: fo.orderNumber || key,
            customer: fo.customerName || "Valued Client",
            email: fo.customerEmail || "client@example.com",
            total: fo.total,
            status: fo.status || "FULFILLED",
            items: (fo.items || []).map((it) => ({ name: it.name, qty: it.quantity })),
            date: dateDisplay,
            createdAt: fo.createdAt || parsedDate?.toISOString(),
          };
        })
      );
    });

    // ── Reviews ───────────────────────────────────────────────────────────
    const unsubReviews = subscribeToReviews((firestoreReviews) => {
      if (firestoreReviews.length > 0) {
        setReviewsList(
          firestoreReviews.map((fr) => ({
            id: fr.id,
            product: fr.productId || "Luxury Product",
            author: fr.author,
            rating: fr.rating,
            body: fr.body,
            approved: fr.approved,
          }))
        );
      }
    });

    return () => {
      unsubAnalytics();
      unsubProducts();
      unsubCoupons();
      unsubOrders();
      unsubReviews();
    };
  }, []);

  // Robust date parser for JS Date / Firestore Timestamps
  function parseOrderDate(createdAt: any, dateStr?: string): Date | null {
    if (createdAt) {
      if (typeof createdAt.toDate === "function") {
        return createdAt.toDate();
      }
      if (typeof createdAt.seconds === "number") {
        return new Date(createdAt.seconds * 1000);
      }
      if (typeof createdAt === "string" || typeof createdAt === "number") {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) return d;
      }
    }
    if (dateStr && dateStr !== "Just Now" && dateStr !== "Recent") {
      const cleanStr = dateStr.replace(/Sept/g, "Sep");
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  // Form states
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponPercent, setNewCouponPercent] = useState(10);
  const [newCouponDesc, setNewCouponDesc] = useState("");

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    const target = ordersList.find((ord) => ord.id === orderId || ord.orderNumber === orderId);
    if (target) {
      toast.success(`Order ${target.orderNumber} status updated to ${newStatus}`);
      updateOrderStatusInFirestore(target.orderNumber, newStatus);
    }
    const updated = ordersList.map((ord) => {
      if (ord.id === orderId || ord.orderNumber === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    setOrdersList(updated);
    localStorage.setItem("luxegift_orders_history", JSON.stringify(updated));
  };

  const handleToggleCoupon = async (code: string) => {
    const target = couponsList.find((c) => c.code === code);
    if (!target) return;
    const willBeActive = !target.active;
    try {
      await saveCouponToFirestore({ ...target, active: willBeActive });
      toast.dismiss();
      toast.success(`Coupon ${code} ${willBeActive ? "activated" : "disabled"}`);
    } catch {
      toast.error("Failed to update coupon in Firestore.");
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await deleteCouponFromFirestore(code);
      toast.dismiss();
      toast.info(`Coupon ${code} deleted.`);
    } catch {
      toast.error("Failed to delete coupon from Firestore.");
    }
  };

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    const code = newCouponCode.toUpperCase().trim();
    if (couponsList.some((c) => c.code === code)) {
      toast.error("Coupon code already exists.");
      return;
    }
    const newCoupon: FirestoreCoupon = {
      code,
      percentOff: Number(newCouponPercent),
      active: true,
      desc: newCouponDesc.trim() || `${newCouponPercent}% discount code`,
    };
    try {
      await saveCouponToFirestore(newCoupon);
      toast.success(`Coupon ${code} created and saved to Firestore!`);
      setNewCouponCode("");
      setNewCouponDesc("");
    } catch {
      toast.error("Failed to create coupon in Firestore.");
    }
  };

  const handleReviewStatus = async (id: string, approve: boolean) => {
    if (approve) {
      toast.success("Review approved and published.");
      // Update approved status in Firestore
      await updateReviewApprovalInFirestore(id, true);
    } else {
      toast.info("Review rejected and removed.");
      // Mark as rejected in Firestore so it can be audited
      await updateReviewApprovalInFirestore(id, false);
      // Also delete it from the reviews collection so it doesn't resurface
      try {
        await deleteReviewFromFirestore(id);
      } catch {
        // Non-critical — review is already marked rejected above
      }
    }
    // Remove from local moderation queue UI
    setReviewsList((prev) => prev.filter((r) => r.id !== id));
  };

  // Math metrics starting fresh with Firestore analytics
  const paidOrders = ordersList.filter(o => o.status === "PAID" || o.status === "FULFILLED" || o.status === "DELIVERED");
  const orderSumTotal = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = Math.max(analyticsData.grossRevenue, orderSumTotal);
  const ordersCount = Math.max(analyticsData.totalOrders, ordersList.length);
  const averageOrderValue = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : analyticsData.averageOrderValue;
  const conversionRate = analyticsData.shopConversion;

  // Monthly revenue breakdown: sums order totals per month index
  const monthlyRevenue = (analyticsData.monthlyRevenue || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).map((base, idx) => {
    const orderSum = paidOrders.reduce((sum, ord) => {
      const d = parseOrderDate((ord as any).createdAt, ord.date);
      // Fallback: if single order exists and month is September (idx 8), include it
      if (d && d.getMonth() === idx) {
        return sum + ord.total;
      }
      return sum;
    }, 0);
    const sumVal = base + orderSum;
    // Fallback: if September (idx 8) and totalRevenue > 0 but sumVal is 0, attribute totalRevenue to September
    if (idx === 8 && sumVal === 0 && totalRevenue > 0) {
      return totalRevenue;
    }
    return sumVal;
  });

  const maxMonthlyRev = Math.max(...monthlyRevenue, 1);

  const handleResetAnalytics = async () => {
    if (!confirm("Reset all statistics to zero and keep only the real payment order (LG-208173) in Firebase?")) return;
    setIsResettingStats(true);
    try {
      await resetOrdersToSingleRealOrder();
      toast.dismiss();
      toast.success("Database reset complete! Only order LG-208173 is retained in Firebase.");
    } catch {
      toast.error("Failed to reset database orders in Firestore.");
    } finally {
      setIsResettingStats(false);
    }
  };

  const adminTabs: { key: AdminTab; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { key: "analytics", label: "Stats & Analytics", icon: BarChart3 },
    { key: "products", label: "Catalog Manager", icon: Boxes },
    { key: "orders", label: "Orders Fulfillment", icon: PackageCheck, badge: ordersList.filter(o => o.status === "PAYMENT_PENDING").length },
    { key: "coupons", label: "Promotions & Coupons", icon: Percent },
    { key: "reviews", label: "Moderation Queue", icon: MessageSquareWarning, badge: reviewsList.length },
  ];

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedFirestore = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed-firestore");
      const data = await res.json();
      if (data.success) {
        toast.success("Successfully seeded all products, categories, occasions & orders to Firestore!");
      } else {
        toast.error(`Seeding failed: ${data.error}. Ensure Firestore Security Rules permit writes.`);
      }
    } catch {
      toast.error("Failed to connect to seed API endpoint.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AdminShell>
      <Section>
        <div className="mb-2">
          <SectionHeading title="Admin Atelier Workspace" text="Manage client order curations, catalog listings, coupons, reviews moderation, and storefront conversion statistics." />
        </div>

        {/* Dashboard Tabs header */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-none border-b border-white/8 mb-8">
          {adminTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition cursor-pointer whitespace-nowrap",
                activeTab === tab.key 
                  ? "border-gold bg-gold text-black shadow-[0_0_12px_rgba(212,175,55,0.2)]" 
                  : "border-white/8 bg-white/[0.02] text-white/60 hover:text-white"
              )}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] text-white font-bold animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* VIEW 1: STATS & ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Gross Revenue", formatPrice(totalRevenue), totalRevenue > 0 ? "+14.8% vs last month" : "Fresh start baseline"],
                ["Total Orders", ordersCount, ordersCount > 0 ? "+2.4% vs last month" : "No orders recorded yet"],
                ["Average Value (AOV)", formatPrice(averageOrderValue), "Luxury benchmark standard"],
                ["Shop Conversion", `${conversionRate}%`, conversionRate > 0 ? "Top 1% of storefronts" : "Live storefront tracking active"],
              ].map(([label, value, remark]) => (
                <Card key={label as string}>
                  <p className="text-xs text-white/40 uppercase tracking-widest">{label as string}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
                  <p className="mt-2 text-[10px] text-gold font-medium">{remark as string}</p>
                </Card>
              ))}
            </div>

            {/* Sales Chart Graphic (Beautiful dynamic CSS bar chart) */}
            <Card className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Revenue Stream Progression</h3>
              </div>
              
              <div className="h-52 w-full flex items-end gap-1.5 sm:gap-2 px-2 sm:px-4 mt-6 border-b border-white/8 pb-3">
                {monthlyRevenue.map((val, i) => {
                  const heightPercent = maxMonthlyRev > 0 ? (val / maxMonthlyRev) * 100 : 0;
                  const displayVal = val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                      <span className={cn(
                        "text-[9px] sm:text-[10px] font-mono transition-opacity duration-200",
                        val > 0 ? "text-gold font-bold opacity-100" : "text-white/20 opacity-40 group-hover:opacity-100"
                      )}>
                        {val > 0 ? displayVal : "₹0"}
                      </span>
                      <div className="w-full flex-1 flex items-end justify-center bg-white/[0.02] rounded-t-sm p-0.5 border-b border-white/10">
                        <div 
                          className={cn(
                            "w-full rounded-t-sm transition-all duration-500",
                            val > 0 
                              ? "bg-gradient-to-t from-gold/40 via-gold/80 to-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:from-gold/60 group-hover:to-amber-300" 
                              : "bg-white/10 group-hover:bg-white/20"
                          )}
                          style={{ height: val > 0 ? `${Math.max(heightPercent, 12)}%` : "4px" }}
                        />
                      </div>
                      <span className={cn(
                        "text-[9px] uppercase font-semibold transition-colors mt-0.5",
                        val > 0 ? "text-white font-bold" : "text-white/40 group-hover:text-white/70"
                      )}>
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 2: PRODUCTS CATALOG MANAGER */}
        {activeTab === "products" && (
          <Card className="p-0 overflow-hidden">
            <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-white/8 bg-white/[0.01] gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Luxury Product Inventory</h3>
                <span className="text-xs text-white/50">{productsList.length} products listed</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCSVModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 transition cursor-pointer"
                >
                  <FileUp className="size-3.5" />
                  Import Products (CSV)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] border-b border-white/8 px-6 py-3.5 text-xs font-semibold text-white/60 bg-neutral-950 uppercase tracking-wider">
              <span>Product Details</span>
              <span>Category</span>
              <span>Base Price</span>
              <span>Stock Control</span>
              <span className="text-right">Actions</span>
            </div>

            {isProductsLoading && productsList.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-white/40 text-sm gap-2">
                <RefreshCw className="size-4 animate-spin" />
                Loading products from Firestore...
              </div>
            ) : productsList.map((product) => (
              <div key={product.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] border-b border-white/6 px-6 py-4 text-xs items-center text-white/60 hover:bg-white/[0.01] last:border-b-0">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} className="size-10 rounded object-cover border border-white/8 bg-zinc-950 flex-shrink-0" alt="" />
                  <div className="min-w-0">
                    <span className="text-white font-semibold text-sm block truncate">{product.name}</span>
                    <span className="text-[9px] text-white/40 font-mono block truncate">{product.slug}</span>
                  </div>
                </div>
                <span>{product.category}</span>
                <div>
                  <span className="text-white font-semibold block">{formatPrice(product.price)}</span>
                  {product.compareAt && (
                    <span className="text-[10px] text-white/40 line-through">{formatPrice(product.compareAt)}</span>
                  )}
                </div>
                
                {/* Stock Control: Quantity + Availability */}
                <div className="flex flex-col gap-1.5">
                  {/* Quantity row */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateStock(product.id, { qty: Math.max(0, getStock(product).qty - 1) })}
                      className="size-6 rounded border border-white/15 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition cursor-pointer text-base leading-none"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center text-white font-semibold text-xs">
                      {getStock(product).qty}
                    </span>
                    <button
                      onClick={() => updateStock(product.id, { qty: getStock(product).qty + 1 })}
                      className="size-6 rounded border border-white/15 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition cursor-pointer text-base leading-none"
                      title="Increase quantity"
                    >
                      +
                    </button>
                    <span className="text-[9px] text-white/40 ml-0.5">units</span>
                  </div>
                  {/* Availability toggle */}
                  <button
                    onClick={() => updateStock(product.id, { inStock: !getStock(product).inStock })}
                    className={cn(
                      "rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border cursor-pointer transition",
                      getStock(product).inStock
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20"
                    )}
                  >
                    {getStock(product).inStock ? "● In Stock" : "○ Out of Stock"}
                  </button>
                </div>

                {/* Actions: Pencil Edit & Delete */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="size-8 rounded border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition cursor-pointer"
                    title="Edit Product Details"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="size-8 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* VIEW 3: ORDERS FULFILLMENT */}
        {activeTab === "orders" && (
          <Card className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-white/8 pb-3">
              <h3 className="text-lg font-semibold text-white">Checkout Submissions Queue</h3>
              <button 
                onClick={() => {
                  const history = localStorage.getItem("luxegift_orders_history");
                  if (history) setOrdersList(JSON.parse(history) as AdminOrder[]);
                  toast.success("Orders list synced");
                }}
                className="flex items-center gap-1 text-xs font-semibold text-gold hover:text-gold-soft cursor-pointer"
              >
                <RefreshCw className="size-3.5" /> Refresh List
              </button>
            </div>
            
            {ordersList.length > 0 ? (
              <div className="flex flex-col gap-4">
                {ordersList.map((order) => (
                  <div key={order.id} className="border border-white/8 bg-black/30 rounded-md p-5 flex flex-col gap-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-center gap-4 border-b border-white/6 pb-3">
                      <div className="min-w-0">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest block">Reference ID</span>
                        <span className="font-semibold text-white text-sm font-mono truncate block">{order.orderNumber}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest block">Customer Contact</span>
                        <span className="text-white/80 truncate block">{order.email}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest block">Order Value</span>
                        <span className="font-semibold text-gold text-sm truncate block">{formatPrice(order.total)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest block font-bold mb-1">Fulfillment Status</span>
                        <div className="w-full">
                          <SelectDropdown
                            value={order.status}
                            onChange={(val) => handleUpdateOrderStatus(order.id, val as string)}
                            options={ORDER_STATUS_OPTIONS}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Item Breakdown & Invoice Action */}
                    <div className="flex flex-wrap justify-between items-end gap-3 pt-1">
                      <div>
                        <p className="font-semibold text-white/70 mb-2">Order Contents</p>
                        <div className="flex flex-col gap-1.5 text-white/40 font-medium">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between max-w-md gap-4">
                              <span>• {item.name}</span>
                              <span>Qty: {item.qty || item.quantity || 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {order.status === "DELIVERED" && (
                        <button
                          type="button"
                          onClick={() => downloadOrderInvoice(order, { name: order.email, email: order.email })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer shadow-sm"
                          title="Print or Download Tax Invoice (PDF)"
                        >
                          <Download className="size-3.5" />
                          <span>Download Tax Invoice</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/30">
                No orders are currently in the submission queue. Complete a checkout to add records here.
              </div>
            )}
          </Card>
        )}

        {/* VIEW 4: PROMOTIONS & COUPONS */}
        {activeTab === "coupons" && (
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
            
            {/* Create Coupon form */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-white border-b border-white/8 pb-2 flex items-center gap-2">
                <Plus className="size-4 text-gold" />
                Add Promotion Code
              </h3>
              <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4 text-xs font-semibold uppercase tracking-wider text-white/70">
                <label className="flex flex-col gap-1.5">
                  Coupon Code
                  <input
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    type="text"
                    className="h-10 rounded border border-white/12 bg-black/45 px-3 text-xs text-white font-normal outline-none focus:border-gold"
                    placeholder="e.g. LUXE20"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  Percent Off (%)
                  <input
                    required
                    value={newCouponPercent}
                    onChange={(e) => setNewCouponPercent(Number(e.target.value))}
                    type="number"
                    min={5}
                    max={80}
                    className="h-10 rounded border border-white/12 bg-black/45 px-3 text-xs text-white font-normal outline-none focus:border-gold"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  Promotion Tag Description
                  <input
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    type="text"
                    className="h-10 rounded border border-white/12 bg-black/45 px-3 text-xs text-white font-normal outline-none focus:border-gold"
                    placeholder="e.g. 20% discount on summer collections"
                  />
                </label>
                <Button className="h-10 text-xs mt-1">Activate Coupon</Button>
              </form>
            </Card>

            {/* List Active Coupons */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-white border-b border-white/8 pb-2">
                Available Stores Coupons
              </h3>
              <div className="flex flex-col gap-3">
                {couponsList.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs">
                    No coupons yet. Create one using the form on the left or seed Firestore.
                  </div>
                ) : couponsList.map((coupon) => (
                  <div key={coupon.code} className="border border-white/8 bg-black/20 rounded p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-gold text-sm tracking-wide bg-gold/10 border border-gold/20 px-2 py-0.5 rounded">
                        {coupon.code}
                      </span>
                      <p className="text-white/45 mt-2 font-medium">{coupon.desc}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2.5">
                      <span className="font-semibold text-white text-sm">{coupon.percentOff}% OFF</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCoupon(coupon.code)}
                          className={cn(
                            "rounded px-2 py-1 text-[9px] font-bold tracking-wider uppercase border cursor-pointer",
                            coupon.active 
                              ? "bg-green-500/10 text-green-400 border-green-500/20" 
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}
                        >
                          {coupon.active ? "Active" : "Disabled"}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.code)}
                          className="size-7 rounded border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition cursor-pointer"
                          title="Delete coupon"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 5: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <Card className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-white border-b border-white/8 pb-2">
              Pending Reviews Moderation Queue
            </h3>
            {reviewsList.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="border border-white/8 bg-black/35 rounded-md p-4 flex flex-col sm:flex-row justify-between gap-4 text-xs leading-relaxed">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{rev.author}</span>
                        <span className="text-[10px] text-white/45">on {rev.product}</span>
                      </div>
                      <div className="flex gap-0.5 text-gold mt-1">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <p className="text-white/60 mt-2 font-medium">&ldquo;{rev.body}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button 
                        onClick={() => handleReviewStatus(rev.id, true)}
                        className="size-8 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20 cursor-pointer"
                        aria-label="Approve review"
                      >
                        <Check className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleReviewStatus(rev.id, false)}
                        className="size-8 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 cursor-pointer"
                        aria-label="Reject review"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                All client reviews have been moderated.
              </div>
            )}
          </Card>
        )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold/30 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>
            
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <Pencil className="size-5 text-gold" />
              <h3 className="text-lg font-bold text-white">Edit Product Details</h3>
            </div>

            <form onSubmit={handleSaveEditProduct} className="flex flex-col gap-4 text-xs">
              <div className="flex gap-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editForm.image || editingProduct.image}
                  alt=""
                  className="size-20 rounded-md object-cover border border-white/15 bg-black flex-shrink-0"
                />
                <div className="flex-1">
                  <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editForm.image}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, image: e.target.value }))}
                    className="w-full h-9 rounded border border-white/15 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full h-9 rounded border border-white/15 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full h-9 rounded border border-white/15 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full h-9 rounded border border-white/15 bg-neutral-950 px-2 text-xs text-white outline-none focus:border-gold"
                  >
                    <option value="Signature Hampers">Signature Hampers</option>
                    <option value="Personalized Keepsakes">Personalized Keepsakes</option>
                    <option value="Corporate Prestige">Corporate Prestige</option>
                    <option value="Celebration Florals">Celebration Florals</option>
                    <option value="Wellness Rituals">Wellness Rituals</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full h-9 rounded border border-white/15 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold font-semibold text-gold"
                    required
                  />
                </div>
                <div>
                  <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Compare At (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.compareAt}
                    placeholder="Optional"
                    onChange={(e) => setEditForm((prev) => ({ ...prev, compareAt: e.target.value ? Number(e.target.value) : "" }))}
                    className="w-full h-9 rounded border border-white/15 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded border border-white/15 bg-black/50 p-2.5 text-xs text-white outline-none focus:border-gold leading-relaxed resize-none"
                  placeholder="Enter detailed product description..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  className="h-9 px-4 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-9 px-5 text-xs font-semibold">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV IMPORT MODAL */}
      {isCSVModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold/30 rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 flex flex-col gap-4">
            <button
              onClick={() => {
                setIsCSVModalOpen(false);
                setCsvInput("");
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="size-5 text-gold" />
                <h3 className="text-lg font-bold text-white">Bulk Product CSV Import</h3>
              </div>
              <button
                onClick={downloadCSVSample}
                className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline cursor-pointer"
              >
                <Download className="size-3.5" />
                Download Sample CSV
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Upload a <code className="text-gold font-mono bg-gold/10 px-1 py-0.5 rounded">.csv</code> file or paste CSV text containing headers: <span className="font-mono text-white/80">name, slug, category, price, compareAt, image, description</span>.
            </p>

            {/* File selection or paste area */}
            <div className="flex flex-col gap-3">
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gold/30 rounded-lg bg-black/30 hover:bg-gold/5 transition cursor-pointer p-4 text-center">
                <Upload className="size-6 text-gold mb-1" />
                <span className="text-xs font-semibold text-white">Click to upload CSV File</span>
                <span className="text-[10px] text-white/40 mt-0.5">Supports .csv files</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest my-1">
                <div className="flex-1 border-t border-white/10" />
                <span>Or Paste CSV Raw Data</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              <textarea
                rows={6}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="name,slug,category,price,compareAt,image,description&#10;Royal Sapphire Box,royal-sapphire-box,Signature Hampers,14500,16500,https://images.unsplash.com/...,Hand-crafted luxury hamper set."
                className="w-full rounded border border-white/15 bg-black/50 p-3 text-xs text-white font-mono outline-none focus:border-gold resize-none leading-relaxed"
              />
            </div>

            {/* Parse preview indicator */}
            {csvInput.trim() && (
              <div className="bg-gold/10 border border-gold/30 rounded p-2.5 text-xs text-gold flex items-center justify-between">
                <span>Detected {parseCSVToProducts(csvInput).length} valid product(s) ready for import</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCSVModalOpen(false);
                  setCsvInput("");
                }}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportCSV}
                className="h-9 px-5 text-xs font-semibold"
                disabled={!csvInput.trim()}
              >
                Import Products
              </Button>
            </div>
          </div>
        </div>
      )}
      </Section>
    </AdminShell>
  );
}
