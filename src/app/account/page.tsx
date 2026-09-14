"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell, Heart, MapPin, Package, UserRound, Plus, Trash2,
  Calendar, ShoppingBag, Pencil, X, LogOut, Loader2, Compass,
  ChevronDown, ChevronUp, Truck, Download
} from "lucide-react";
import { OrderTimeline } from "@/components/commerce/order-timeline";
import { SiteShell } from "@/components/layout/site-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { products } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import { downloadOrderInvoice } from "@/lib/invoice";
import {
  subscribeToOrders,
  FirestoreOrder,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  saveUserAddressesToFirestore,
  getUserAddressesFromFirestore,
} from "@/lib/firestore";
import Link from "next/link";
import { toast } from "sonner";

type AccountTab = "orders" | "wishlist" | "addresses" | "occasions";

const RELATIONSHIP_OPTIONS = [
  { value: "partner", label: "Partner / Spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "friend", label: "Friend / Colleague" },
  { value: "client", label: "Corporate Client" },
];

const LEAD_DAYS_OPTIONS = [
  { value: 3, label: "3 days prior" },
  { value: 7, label: "7 days prior" },
  { value: 14, label: "14 days prior" },
];

type StoredOrderItem = {
  name: string;
  qty?: number;
  quantity?: number;
  price?: number;
};

type StoredOrder = {
  id: string;
  orderNumber: string;
  date?: string;
  createdAt?: string;
  status: "FULFILLED" | "PAID" | "PAYMENT_PENDING" | "CANCELLED" | "DELIVERED" | string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  email?: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: any;
  items: StoredOrderItem[];
};

type AddressItem = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
};

type UserProfileLocal = {
  name: string;
  email: string;
  phone: string;
  tier: string;
};

function AccountContent() {
  const { wishlist, toggleWishlist, occasions, addOccasion, removeOccasion, addToCart } = useCart();
  const { user, logout, updateUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<AccountTab>("orders");

  useEffect(() => {
    if (tabParam && ["orders", "wishlist", "addresses", "occasions"].includes(tabParam)) {
      setActiveTab(tabParam as AccountTab);
    }
  }, [tabParam]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // All data starts empty — loaded from Firestore per user
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [hasInitializedExpand, setHasInitializedExpand] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [profile, setProfile] = useState<UserProfileLocal>({
    name: "",
    email: "",
    phone: "",
    tier: "Prestige Tier Member",
  });

  useEffect(() => {
    if (orders.length > 0 && !hasInitializedExpand) {
      setExpandedOrderId(orders[0].id);
      setHasInitializedExpand(true);
    }
  }, [orders, hasInitializedExpand]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoadingData) {
      router.push("/login");
    }
  }, [user, isLoadingData, router]);

  // Load all user data from Firestore on login / user change
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    const userId = user.id;

    // 1. Load profile from Firestore
    getUserProfileFromFirestore(userId).then((remoteProfile) => {
      if (remoteProfile) {
        setProfile({
          name: remoteProfile.name || user.name || "",
          email: remoteProfile.email || user.email || "",
          phone: remoteProfile.phone || user.phone || "",
          tier: remoteProfile.tier || "Prestige Tier Member",
        });
      } else {
        // First login — populate from auth user
        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          tier: "Prestige Tier Member",
        });
      }
    });

    // 2. Load addresses from Firestore
    getUserAddressesFromFirestore(userId).then((remoteAddresses) => {
      if (remoteAddresses && remoteAddresses.length > 0) {
        setAddresses(remoteAddresses);
      } else {
        setAddresses([]); // Start empty — no hardcoded addresses
      }
      setIsLoadingData(false);
    });

    // 3. Load orders from localStorage (placed during checkout for this user)
    const history = localStorage.getItem(`luxegift_orders_${userId}`);
    if (history) {
      try { setOrders(JSON.parse(history) as StoredOrder[]); } catch { setOrders([]); }
    } else {
      setOrders([]);
    }
  }, [user?.id]);

  // Real-time Firestore listener: live order updates filtered by current user's email
  useEffect(() => {
    if (!user?.email) return;
    const unsub = subscribeToOrders((liveOrders) => {
      const userOrders = liveOrders.filter(
        (o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase()
      );
      setOrders(
        userOrders.map((fo) => {
          let isoDate = new Date().toISOString();
          if (fo.createdAt) {
            if (typeof (fo.createdAt as any).toDate === "function") {
              isoDate = (fo.createdAt as any).toDate().toISOString();
            } else if (typeof (fo.createdAt as any).seconds === "number") {
              isoDate = new Date((fo.createdAt as any).seconds * 1000).toISOString();
            } else if (typeof fo.createdAt === "string") {
              isoDate = fo.createdAt;
            }
          }
          return {
            id: fo.id || fo.orderNumber,
            orderNumber: fo.orderNumber,
            date: isoDate,
            status: fo.status || "PAYMENT_PENDING",
            total: fo.total,
            subtotal: fo.subtotal,
            deliveryFee: fo.deliveryFee,
            customerName: fo.customerName,
            customerEmail: fo.customerEmail,
            shippingAddress: fo.shippingAddress,
            items: (fo.items || []).map((it) => ({
              name: it.name,
              qty: it.quantity || (it as any).qty || 1,
              price: it.price,
            })),
          };
        })
      );
    });
    return () => unsub();
  }, [user?.email]);

  // Listen for new orders placed in this tab
  useEffect(() => {
    if (!user?.id) return;
    const handleStorageUpdate = () => {
      const history = localStorage.getItem(`luxegift_orders_${user.id}`);
      if (history) {
        try { setOrders(JSON.parse(history) as StoredOrder[]); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, [user?.id]);

  const handleSignOut = () => {
    logout();
    toast.success("Signed out successfully.");
    router.push("/login");
  };

  // ─── Occasion form ─────────────────────────────────────────────────────────
  const [occTitle, setOccTitle] = useState("");
  const [occRelation, setOccRelation] = useState("partner");
  const [occDate, setOccDate] = useState("");
  const [occLeadDays, setOccLeadDays] = useState(7);

  const handleAddOccasionSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!occTitle || !occDate) {
      toast.error("Please fill in occasion title and calendar date.");
      return;
    }
    addOccasion({ title: occTitle, relationship: occRelation, occasionDate: occDate, reminderLeadDays: Number(occLeadDays) });
    setOccTitle("");
    setOccDate("");
  };

  // ─── Wishlist ──────────────────────────────────────────────────────────────
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  // ─── Address CRUD ──────────────────────────────────────────────────────────
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrDetails, setAddrDetails] = useState("");
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLoc(true);
    toast.info("Fetching your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || "";
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            const postcode = addr.postcode || "";
            const country = addr.country || "";

            const formatted = [road, city, state, postcode, country]
              .filter(Boolean)
              .join(", ");

            setAddrDetails(formatted || data.display_name || "");
            if (!addrLabel) setAddrLabel("Home");
            if (!addrName) setAddrName(profile.name || "");
            if (!addrPhone) setAddrPhone(profile.phone || "");

            toast.success("Location coordinates detected successfully!");
          } else {
            toast.error("Could not determine full address details.");
          }
        } catch {
          toast.error("Failed to fetch address details from location.");
        } finally {
          setIsDetectingLoc(false);
        }
      },
      (error) => {
        setIsDetectingLoc(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable browser location access.");
        } else {
          toast.error("Unable to retrieve current location.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrLabel("");
    setAddrName(profile.name || "");
    setAddrPhone(profile.phone || "");
    setAddrDetails("");
    setIsAddressFormOpen(true);
  };

  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrDetails(addr.address);
    setIsAddressFormOpen(true);
  };

  const handleSaveAddressSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!addrLabel.trim() || !addrName.trim() || !addrPhone.trim() || !addrDetails.trim()) {
      toast.error("Please fill in all address fields.");
      return;
    }

    if (!user?.id) { toast.error("Please sign in to save addresses."); return; }

    const updated: AddressItem[] = editingAddressId
      ? addresses.map((item) =>
          item.id === editingAddressId
            ? { ...item, label: addrLabel.trim(), name: addrName.trim(), phone: addrPhone.trim(), address: addrDetails.trim() }
            : item
        )
      : [{ id: `addr-${Date.now()}`, label: addrLabel.trim(), name: addrName.trim(), phone: addrPhone.trim(), address: addrDetails.trim() }, ...addresses];

    setAddresses(updated);
    setIsAddressFormOpen(false);
    toast.success(editingAddressId ? "Address updated." : "Address saved.");

    // Sync to local storage & Cloud Firestore
    try { localStorage.setItem("luxegift_user_addresses", JSON.stringify(updated)); } catch { /* ignore */ }
    await saveUserAddressesToFirestore(user.id, updated);
  };

  const removeAddress = async (id: string) => {
    if (!user?.id) return;
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    toast.info("Address deleted.");
    try { localStorage.setItem("luxegift_user_addresses", JSON.stringify(updated)); } catch { /* ignore */ }
    await saveUserAddressesToFirestore(user.id, updated);
  };

  // ─── Profile Edit ──────────────────────────────────────────────────────────
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    setProfileName(profile.name);
    setProfileEmail(profile.email);
    setProfilePhone(profile.phone);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    if (!user?.id) { toast.error("Please sign in to update profile."); return; }

    setIsSavingProfile(true);
    const updated: UserProfileLocal = {
      ...profile,
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    };

    setProfile(updated);
    await updateUserProfile(profileName.trim(), profileEmail.trim(), profilePhone.trim());
    setIsSavingProfile(false);
    toast.success("Profile updated successfully.");
    setIsEditProfileOpen(false);
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SiteShell>
        <Section className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-white/50">
            <Loader2 className="size-8 animate-spin mx-auto mb-3 text-gold" />
            <p>Redirecting to sign in…</p>
          </div>
        </Section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Section>
        <SectionHeading
          title="Gifting Atelier Workspace"
          text="Manage your profile, addresses, wishlists, occasion reminders, and order history."
        />

        {isLoadingData ? (
          <div className="flex items-center justify-center py-24 text-white/40">
            <Loader2 className="size-6 animate-spin mr-2 text-gold" />
            Loading your account data…
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.8fr_2.2fr]">

            {/* ── Left Panel ── */}
            <div className="flex flex-col gap-6">
              <Card className="text-center flex flex-col items-center gap-4 relative group">
                <button
                  type="button"
                  onClick={handleOpenEditProfile}
                  className="absolute top-3 right-3 text-white/40 hover:text-gold transition cursor-pointer p-1.5 rounded-full hover:bg-white/5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                  title="Edit profile details"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>

                <span className="flex size-14 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/25 shadow-md mt-1">
                  <UserRound className="size-6" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {profile.name || user.name || "Client Member"}
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5">{profile.email || user.email}</p>
                  {profile.phone && (
                    <p className="text-[11px] text-white/60 mt-0.5 font-medium">{profile.phone}</p>
                  )}
                  <span className="mt-3 inline-block rounded bg-gold/10 border border-gold/20 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold">
                    {profile.tier}
                  </span>
                </div>
              </Card>

              {/* Navigation Tabs */}
              <div className="flex flex-col border border-white/8 rounded-md bg-white/[0.01] overflow-hidden">
                {[
                  { key: "orders" as const, label: "Order Tracking", icon: Package, badge: orders.length },
                  { key: "wishlist" as const, label: "Saved Wishlist", icon: Heart, badge: wishlist.length },
                  { key: "addresses" as const, label: "Delivery Addresses", icon: MapPin, badge: addresses.length },
                  { key: "occasions" as const, label: "Gift Reminders", icon: Bell, badge: occasions.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      router.push(`/account?tab=${tab.key}`, { scroll: false });
                    }}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-left border-b border-white/8 transition cursor-pointer last:border-0",
                      activeTab === tab.key
                        ? "bg-gold/10 text-gold font-bold"
                        : "text-white/60 hover:bg-white/[0.02] hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <tab.icon className="size-4" />
                      {tab.label}
                    </span>
                    {tab.badge > 0 && (
                      <span className={cn(
                        "size-5 rounded-full text-[9px] font-bold flex items-center justify-center border",
                        activeTab === tab.key ? "bg-gold text-black border-gold" : "bg-white/10 text-white/70 border-white/10"
                      )}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-4 py-3 rounded-md border border-white/8 bg-white/[0.01] text-white/50 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 text-xs font-semibold uppercase tracking-wider transition cursor-pointer group"
              >
                <LogOut className="size-4 group-hover:text-red-400 transition" />
                Sign Out
              </button>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex flex-col gap-6">

              {/* ORDERS */}
              {activeTab === "orders" && (
                <Card className="flex flex-col gap-5">
                  <h3 className="text-xl font-semibold text-white border-b border-white/8 pb-3 flex items-center gap-2">
                    <Package className="size-5 text-gold" />
                    Order History
                  </h3>
                  {orders.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {orders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                          <div
                            key={order.id}
                            className={cn(
                              "border rounded-lg p-5 flex flex-col gap-4 text-xs transition-all duration-300",
                              isExpanded
                                ? "border-gold/50 bg-black/40 shadow-[0_0_25px_rgba(212,175,55,0.12)]"
                                : "border-white/8 bg-black/20 hover:border-white/20"
                            )}
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-4 border-b border-white/6 pb-3">
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Order Reference</span>
                                <span className="font-semibold text-white text-sm font-mono truncate block">{order.orderNumber}</span>
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Order Date</span>
                                <span className="text-white/80 truncate block">
                                  {(() => {
                                    const rawDate = order.date || order.createdAt;
                                    if (!rawDate) return "Recent";
                                    if (rawDate === "Just now") return "Just now";
                                    const parsed = new Date(rawDate);
                                    return isNaN(parsed.getTime()) ? rawDate : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                  })()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-0.5">Status</span>
                                <div>
                                  <span className={cn(
                                    "inline-block rounded px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border whitespace-nowrap",
                                    order.status === "DELIVERED" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    order.status === "FULFILLED" && "bg-green-500/10 text-green-400 border-green-500/20",
                                    order.status === "PAID" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                    order.status === "PAYMENT_PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                    order.status === "CANCELLED" && "bg-red-500/10 text-red-400 border-red-500/20",
                                  )}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <div className="min-w-0 text-left sm:text-right">
                                <span className="text-[9px] uppercase tracking-wider text-white/40 block">Total</span>
                                <span className="font-bold text-gold text-sm truncate block">{formatPrice(order.total)}</span>
                              </div>
                            </div>

                            {/* Item breakdown & tracking trigger */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white/70 mb-1">Items</p>
                                <div className="flex flex-col gap-1 text-white/50">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span>• {item.name}</span>
                                      <span className="text-gold/80 font-mono text-[10px]">x{item.qty || item.quantity || 1}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto mt-2 sm:mt-0">
                                {order.status === "DELIVERED" && (
                                  <button
                                    type="button"
                                    onClick={() => downloadOrderInvoice(order, profile, addresses)}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition cursor-pointer shadow-sm"
                                    title="Download Official Tax Invoice (PDF)"
                                  >
                                    <Download className="size-3.5" />
                                    <span>Download Invoice</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                  className={cn(
                                    "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border cursor-pointer transition-all duration-200",
                                    isExpanded
                                      ? "bg-gold text-black border-gold font-bold shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                                      : "bg-gold/10 text-gold border-gold/30 hover:bg-gold/20"
                                  )}
                                >
                                  <Truck className="size-3.5" />
                                  <span>{isExpanded ? "Hide Tracking Timeline" : "Track Order Status"}</span>
                                  {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Order Timeline */}
                            {isExpanded && (
                              <div className="mt-2 pt-4 border-t border-white/8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <OrderTimeline status={order.status} orderNumber={order.orderNumber} date={order.date} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-white/40 flex flex-col items-center gap-3">
                      <Package className="size-10 text-white/15" />
                      <p>No orders yet.</p>
                      <Link href="/shop" className="text-xs text-gold underline">Browse the Collection</Link>
                    </div>
                  )}
                </Card>
              )}

              {/* WISHLIST */}
              {activeTab === "wishlist" && (
                <Card className="flex flex-col gap-5">
                  <h3 className="text-xl font-semibold text-white border-b border-white/8 pb-3 flex items-center gap-2">
                    <Heart className="size-5 text-gold" />
                    Your Saved Wishlist
                  </h3>
                  {wishlistedProducts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {wishlistedProducts.map((product) => (
                        <div key={product.id} className="border border-white/8 bg-black/20 rounded-md p-3 flex gap-3 items-center group">
                          <Link href={`/products/${product.slug || product.id}`} className="flex gap-3 items-center flex-1 min-w-0 group/item hover:opacity-90 transition-opacity cursor-pointer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image} className="size-16 object-cover rounded border border-white/8 flex-shrink-0" alt={product.name} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs uppercase tracking-wider text-gold font-semibold text-[9px]">{product.category}</p>
                              <p className="font-semibold text-white text-xs truncate mt-0.5 group-hover/item:text-gold transition-colors">{product.name}</p>
                              <p className="text-xs text-white/60 font-medium mt-1">{formatPrice(product.price)}</p>
                            </div>
                          </Link>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => toggleWishlist(product.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer" aria-label="Remove">
                              <Trash2 className="size-4" />
                            </button>
                            <button onClick={() => addToCart({ id: product.id, slug: product.slug, name: product.name, price: product.price, quantity: 1, image: product.image, category: product.category })} className="text-gold hover:text-gold/70 p-1 cursor-pointer" aria-label="Add to cart">
                              <ShoppingBag className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-white/40 flex flex-col items-center gap-3">
                      <Heart className="size-10 text-white/15" />
                      <p>Your wishlist is empty.</p>
                      <Link href="/shop" className="text-xs text-gold underline">Explore Shop Collection</Link>
                    </div>
                  )}
                </Card>
              )}

              {/* ADDRESSES */}
              {activeTab === "addresses" && (
                <Card className="flex flex-col gap-5">
                  <div className="flex flex-wrap justify-between items-center border-b border-white/8 pb-3 gap-2">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <MapPin className="size-5 text-gold" />
                      Delivery Addresses
                    </h3>
                    {!isAddressFormOpen && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenAddAddress();
                            handleDetectLocation();
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 hover:bg-gold/20 border border-gold/30 px-3 py-1.5 rounded cursor-pointer transition"
                        >
                          <Compass className="size-4" /> Use Current Location
                        </button>
                        <button onClick={handleOpenAddAddress} className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold/70 cursor-pointer transition px-2 py-1.5">
                          <Plus className="size-4" /> Add Address
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Address Form */}
                  {isAddressFormOpen && (
                    <form onSubmit={handleSaveAddressSubmit} className="border border-gold/25 bg-gold/5 rounded-lg p-5 flex flex-col gap-4 relative animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-white/8 pb-3">
                        <p className="text-xs font-semibold text-gold tracking-wide uppercase flex items-center gap-1.5">
                          <MapPin className="size-4" />
                          {editingAddressId ? "Edit Address" : "Add New Address"}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isDetectingLoc}
                            className="flex items-center gap-1.5 px-3 py-1 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            {isDetectingLoc ? (
                              <Loader2 className="size-3.5 animate-spin text-gold" />
                            ) : (
                              <Compass className="size-3.5 text-gold" />
                            )}
                            {isDetectingLoc ? "Detecting..." : "Use Current Location"}
                          </button>
                          <button type="button" onClick={() => setIsAddressFormOpen(false)} className="text-white/40 hover:text-white transition cursor-pointer p-1" aria-label="Cancel">
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                          Address Label
                          <input required value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} type="text" className="h-10 rounded border border-white/12 bg-black/40 px-3 text-xs text-white outline-none focus:border-gold" placeholder="e.g. Home, Office" />
                        </label>

                        <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                          Recipient Name
                          <input required value={addrName} onChange={(e) => setAddrName(e.target.value)} type="text" className="h-10 rounded border border-white/12 bg-black/40 px-3 text-xs text-white outline-none focus:border-gold" placeholder="Full name" />
                        </label>

                        <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase sm:col-span-2">
                          Phone Number
                          <input required value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} type="tel" className="h-10 rounded border border-white/12 bg-black/40 px-3 text-xs text-white outline-none focus:border-gold" placeholder="+91 98765 43210" />
                        </label>

                        <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase sm:col-span-2">
                          Complete Address
                          <textarea required value={addrDetails} onChange={(e) => setAddrDetails(e.target.value)} rows={3} className="rounded border border-white/12 bg-black/40 p-3 text-xs text-white outline-none focus:border-gold resize-none" placeholder="Flat No., Building, Street, City, Pincode" />
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-3 mt-2 border-t border-white/6 pt-4">
                        <button type="button" onClick={() => setIsAddressFormOpen(false)} className="h-9 px-4 rounded border border-white/15 bg-white/5 text-white/70 text-xs font-semibold hover:bg-white/10 transition cursor-pointer">Cancel</button>
                        <Button type="submit" className="h-9 px-5">{editingAddressId ? "Save Changes" : "Add Address"}</Button>
                      </div>
                    </form>
                  )}

                  {/* Address Cards */}
                  {addresses.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="border border-white/8 bg-black/25 rounded-md p-4 flex flex-col justify-between gap-4 text-xs group hover:border-gold/30 transition">
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-white">{addr.label}</span>
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => handleOpenEditAddress(addr)} className="text-white/40 hover:text-gold transition cursor-pointer p-1 rounded hover:bg-white/5" title="Edit">
                                  <Pencil className="size-3.5" />
                                </button>
                                <button type="button" onClick={() => removeAddress(addr.id)} className="text-white/40 hover:text-red-400 transition cursor-pointer p-1 rounded hover:bg-white/5" title="Delete">
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-3 text-white/80 font-medium">{addr.name}</p>
                            <p className="text-white/40 mt-0.5">{addr.phone}</p>
                            <p className="mt-2 text-white/60 leading-relaxed">{addr.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/40 flex flex-col items-center gap-3">
                      <MapPin className="size-10 text-white/15" />
                      <p>No addresses saved yet.</p>
                      <p className="text-[11px]">Click &quot;+ Add Address&quot; to add your first delivery address.</p>
                    </div>
                  )}
                </Card>
              )}

              {/* OCCASIONS */}
              {activeTab === "occasions" && (
                <Card className="flex flex-col gap-6">
                  <h3 className="text-xl font-semibold text-white border-b border-white/8 pb-3 flex items-center gap-2">
                    <Bell className="size-5 text-gold" />
                    Gift Occasion Reminders
                  </h3>

                  <form onSubmit={handleAddOccasionSubmit} className="border border-gold/15 bg-gold/5 rounded-lg p-5 flex flex-col gap-4">
                    <p className="text-xs font-semibold text-gold tracking-wide uppercase flex items-center gap-1.5">
                      <Calendar className="size-4" /> Schedule New Reminder
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                        Occasion Title
                        <input required value={occTitle} onChange={(e) => setOccTitle(e.target.value)} type="text" className="h-10 rounded border border-white/12 bg-black/40 px-3 text-xs text-white outline-none focus:border-gold" placeholder="e.g. Mom's Birthday" />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                        Relationship
                        <SelectDropdown
                          value={occRelation}
                          onChange={(val) => setOccRelation(val as string)}
                          options={RELATIONSHIP_OPTIONS}
                          size="md"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                        Date
                        <DatePicker
                          required
                          value={occDate}
                          onChange={setOccDate}
                          placeholder="Select date"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-1 border-t border-white/6 pt-4">
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-white/70 uppercase">
                        <span>Alert Lead Time:</span>
                        <div className="w-36">
                          <SelectDropdown
                            value={occLeadDays}
                            onChange={(val) => setOccLeadDays(val as number)}
                            options={LEAD_DAYS_OPTIONS}
                            size="sm"
                          />
                        </div>
                      </div>
                      <button type="submit" className="h-9 px-4 rounded bg-gold text-black text-xs font-semibold hover:bg-gold/80 cursor-pointer transition">Save Reminder</button>
                    </div>
                  </form>

                  {occasions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {occasions.map((occ) => (
                        <div key={occ.id} className="border border-white/8 bg-black/25 rounded-md p-4 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-4">
                            <span className="flex size-10 items-center justify-center rounded-full bg-white/5 text-gold border border-white/10">
                              <Calendar className="size-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-white">{occ.title}</p>
                              <p className="text-[10px] text-white/40 mt-0.5 capitalize">
                                {occ.relationship} · Alert {occ.reminderLeadDays} days before
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-5">
                            <span className="font-semibold text-white/80">
                              {new Date(occ.occasionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                            <button onClick={() => removeOccasion(occ.id)} className="text-red-400 hover:text-red-300 cursor-pointer" aria-label="Remove">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-white/40 flex flex-col items-center gap-2">
                      <Bell className="size-10 text-white/15" />
                      <p>No reminders yet. Use the form above to schedule one.</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md border border-gold/30 bg-[#12110e] rounded-xl p-6 shadow-2xl flex flex-col gap-5 relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserRound className="size-5 text-gold" /> Edit Profile
              </h3>
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="text-white/40 hover:text-white transition cursor-pointer p-1" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                Full Name
                <input required value={profileName} onChange={(e) => setProfileName(e.target.value)} type="text" className="h-10 rounded border border-white/12 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold" placeholder="Your full name" />
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                Email Address
                <input required value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} type="email" className="h-10 rounded border border-white/12 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold" placeholder="client@example.com" />
              </label>

              <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                Mobile Number
                <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} type="tel" className="h-10 rounded border border-white/12 bg-black/50 px-3 text-xs text-white outline-none focus:border-gold" placeholder="+91 98765 43210" />
              </label>

              <div className="flex items-center justify-end gap-3 mt-3 border-t border-white/8 pt-4">
                <button type="button" onClick={() => setIsEditProfileOpen(false)} className="h-9 px-4 rounded border border-white/15 bg-white/5 text-white/70 text-xs font-semibold hover:bg-white/10 transition cursor-pointer">Cancel</button>
                <Button type="submit" className="h-9 px-5" disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="size-4 animate-spin" /> : "Save Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteShell>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
          <Loader2 className="size-8 text-gold animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
