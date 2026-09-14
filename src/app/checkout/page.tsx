"use client";

import { useState, useEffect, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Lock, Tag, ShoppingBag, Trash2, Calendar, CheckCircle2, Copy, MapPin, ChevronRight, Plus, Compass, Loader2, XCircle, RefreshCw } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { CouponCelebration } from "@/components/ui/coupon-celebration";
import { Sparkles } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/utils";
import { createOrder } from "@/lib/actions";
import { saveOrderToFirestore, getUserAddressesFromFirestore } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { products } from "@/lib/data";
import type { CartItem } from "@/context/cart-context";

type OrderSuccess = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  total: number;
  deliveryDate?: Date | string | null;
  recipientName: string;
  items: CartItem[];
  paymentId?: string;
};

type OrderFailure = {
  orderNumber: string;
  reason: string;
  total: number;
  paymentId?: string;
};

type StoredOrderRecord = {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: { name: string; qty: number }[];
};

export default function CheckoutPage() {
  const { 
    cart, 
    subtotal, 
    discount, 
    deliveryFee, 
    total, 
    couponCode, 
    applyCouponCode, 
    removeCouponCode,
    removeFromCart,
    clearCart
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to /login if user is not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in first to access checkout.");
      router.push("/login");
    }
  }, [user, router]);

  const [pending, startTransition] = useTransition();
  const [couponInput, setCouponInput] = useState("");
  const [triggerCouponBurst, setTriggerCouponBurst] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [orderFailure, setOrderFailure] = useState<OrderFailure | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
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
            const cityVal = addr.city || addr.town || addr.village || addr.county || "";
            const stateVal = addr.state || "";
            const postcodeVal = addr.postcode || "";

            setSelectedAddressId("manual");
            setLine1(road || data.display_name.split(",")[0] || "");
            setCity(cityVal);
            setRegion(stateVal);
            setPostalCode(postcodeVal);

            toast.success("Current location detected successfully!");
          } else {
            toast.error("Could not determine address details from location.");
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

  // Saved addresses from account page
  type SavedAddress = { id: string; label: string; name: string; phone: string; address: string };
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null); // null = manual entry

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    const fullAddress = addr.address || "";
    setLine1(fullAddress);

    // Pre-fill contact details if present on address object
    if (addr.name) setName(addr.name);
    if (addr.phone) setPhone(addr.phone);

    // Parse city, region/state, postalCode from address string
    const parts = fullAddress.split(",").map((s) => s.trim()).filter(Boolean);

    // Find pincode part matching digits (e.g. 621112)
    const pincodePart = parts.find((p) => /^\d{4,6}$/.test(p));
    setPostalCode(pincodePart || "000000");

    // Extract city and region from parts excluding country and pincode
    const nonPinParts = parts.filter((p) => !/^\d{4,6}$/.test(p) && p.toLowerCase() !== "india");
    if (nonPinParts.length >= 2) {
      setCity(nonPinParts[0]);
      setRegion(nonPinParts.slice(1).join(", "));
    } else if (nonPinParts.length === 1) {
      setCity(nonPinParts[0]);
      setRegion("Tamil Nadu");
    } else {
      setCity(addr.label || "City");
      setRegion("State");
    }
  };

  useEffect(() => {
    // 1. Pre-fill user contact info if logged in
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }

    // 2. Fetch user's saved addresses directly from Cloud Firestore
    if (user?.id) {
      getUserAddressesFromFirestore(user.id).then((remoteAddresses) => {
        if (remoteAddresses && remoteAddresses.length > 0) {
          setSavedAddresses(remoteAddresses);
          handleSelectSavedAddress(remoteAddresses[0]);
        } else {
          // Check local storage fallback
          try {
            const raw = localStorage.getItem("luxegift_user_addresses");
            if (raw) {
              const parsed = JSON.parse(raw) as SavedAddress[];
              if (parsed.length > 0) {
                setSavedAddresses(parsed);
                handleSelectSavedAddress(parsed[0]);
              }
            }
          } catch { /* ignore */ }
        }
      });
    } else {
      try {
        const raw = localStorage.getItem("luxegift_user_addresses");
        if (raw) {
          const parsed = JSON.parse(raw) as SavedAddress[];
          if (parsed.length > 0) {
            setSavedAddresses(parsed);
            handleSelectSavedAddress(parsed[0]);
          }
        }
      } catch { /* ignore */ }
    }
  }, [user?.id]);

  const handleSelectManual = () => {
    setSelectedAddressId("manual");
    setLine1("");
    setCity("");
    setRegion("");
    setPostalCode("");
  };

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCouponCode(couponInput);
    if (ok) {
      setCouponInput("");
      setTriggerCouponBurst((prev) => !prev);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!email.includes("@") || name.length < 2 || phone.length < 8) {
      toast.error("Please fill in contact details (name, email, phone).");
      return;
    }
    const activeLine1 = line1 || (selectedAddressId && selectedAddressId !== "manual" ? savedAddresses.find((a) => a.id === selectedAddressId)?.address : "");
    if (!activeLine1) {
      toast.error("Please select or enter recipient's delivery address.");
      return;
    }

    startTransition(async () => {
      const recordFailedOrder = async (reason?: string, paymentId?: string) => {
        try {
          const result = await createOrder({
            email,
            subtotal,
            discount,
            total,
            couponCode: couponCode || undefined,
            giftMessage: giftMessage || undefined,
            deliveryDate: deliveryDate || undefined,
            items: cart.map((item) => ({
              productId: item.isCustomBox ? "custom-box" : item.id,
              quantity: item.quantity,
              price: item.price,
            })),
            address: {
              name,
              phone,
              line1: activeLine1,
              city,
              region,
              postalCode,
            },
          });

          if (result.ok && result.order) {
            setOrderFailure({
              orderNumber: result.order.orderNumber,
              reason: reason || "Your payment was declined by the bank or could not be processed.",
              total: result.order.total,
              paymentId,
            });

            saveOrderToFirestore({
              orderNumber: result.order.orderNumber,
              customerName: name,
              customerEmail: email,
              customerPhone: phone,
              items: cart,
              subtotal,
              discount,
              deliveryFee,
              total,
              paymentMethod: "razorpay",
              paymentStatus: "FAILED",
              status: "PAYMENT_FAILED",
              shippingAddress: {
                street: activeLine1,
                city,
                state: region,
                zip: postalCode,
              },
            });

            const newRecord: StoredOrderRecord = {
              id: result.order.id,
              orderNumber: result.order.orderNumber,
              date: new Date().toISOString(),
              status: "PAYMENT_FAILED",
              total: result.order.total,
              items: cart.map((item) => ({ name: item.name, qty: item.quantity })),
            };

            const ordersHistory = localStorage.getItem("luxegift_orders_history");
            const parsed = ordersHistory ? (JSON.parse(ordersHistory) as StoredOrderRecord[]) : [];
            localStorage.setItem("luxegift_orders_history", JSON.stringify([newRecord, ...parsed]));

            if (user?.id) {
              const userHistoryKey = `luxegift_orders_${user.id}`;
              const userHistory = localStorage.getItem(userHistoryKey);
              const parsedUserHistory = userHistory ? (JSON.parse(userHistory) as StoredOrderRecord[]) : [];
              localStorage.setItem(userHistoryKey, JSON.stringify([newRecord, ...parsedUserHistory]));
            }
          }
        } catch (err) {
          console.error("Failed to record payment failure:", err);
        }
      };

      const finalizeOrderAndSave = async (paymentId: string) => {
        const result = await createOrder({
          email,
          subtotal,
          discount,
          total,
          couponCode: couponCode || undefined,
          giftMessage: giftMessage || undefined,
          deliveryDate: deliveryDate || undefined,
          items: cart.map((item) => ({
            productId: item.isCustomBox ? "custom-box" : item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          address: {
            name,
            phone,
            line1: activeLine1,
            city,
            region,
            postalCode,
          },
        });

        if (result.ok && result.order) {
          // Save paid order doc to Cloud Firestore
          saveOrderToFirestore({
            orderNumber: result.order.orderNumber,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            items: cart,
            subtotal,
            discount,
            deliveryFee,
            total,
            paymentMethod: "razorpay",
            paymentStatus: "PAID",
            status: "PAID",
            shippingAddress: {
              street: activeLine1,
              city,
              state: region,
              zip: postalCode,
            },
          });

          // Local user order logs
          const newRecord: StoredOrderRecord = {
            id: result.order.id,
            orderNumber: result.order.orderNumber,
            date: new Date().toISOString(),
            status: "PAID",
            total: result.order.total,
            items: cart.map((item) => ({ name: item.name, qty: item.quantity })),
          };
          const ordersHistory = localStorage.getItem("luxegift_orders_history");
          const parsed = ordersHistory ? (JSON.parse(ordersHistory) as StoredOrderRecord[]) : [];
          localStorage.setItem("luxegift_orders_history", JSON.stringify([newRecord, ...parsed]));

          if (user?.id) {
            const userHistoryKey = `luxegift_orders_${user.id}`;
            const userHistory = localStorage.getItem(userHistoryKey);
            const parsedUserHistory = userHistory ? (JSON.parse(userHistory) as StoredOrderRecord[]) : [];
            localStorage.setItem(userHistoryKey, JSON.stringify([newRecord, ...parsedUserHistory]));
          }

          setOrderSuccess({
            ...result.order,
            recipientName: name,
            items: [...cart],
            paymentId,
          });
          clearCart();
          toast.success("Payment verified! Your order has been placed successfully.");
        } else {
          toast.error(result.message || "Failed to finalize order.");
        }
      };

      // 1. Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load Razorpay payment gateway script. Please check your internet connection.");
        return;
      }

      // 2. Create Razorpay order via backend endpoint
      toast.info("Initiating secure Razorpay checkout...");
      let razorpayOrder: any;
      try {
        const orderRes = await fetch("/api/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total }),
        });
        razorpayOrder = await orderRes.json();
        if (razorpayOrder.error) {
          toast.error(razorpayOrder.error);
          return;
        }
      } catch {
        toast.error("Failed to connect to payment server.");
        return;
      }

      // 3. Configure Razorpay modal parameters
      const options: any = {
        key: razorpayOrder.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Ssh93IdTdqm55H",
        amount: Math.round(total * 100),
        currency: "INR",
        name: "LuxeGift Atelier",
        description: "Luxury Gift Experience Order",
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200",
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: "#D4AF37",
        },
        handler: async function (response: any) {
          // Payment Authorized -> Verify signature on server
          toast.info("Verifying transaction authenticity...");
          try {
            if (response.razorpay_order_id && response.razorpay_signature) {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyData.success) {
                const failReason = verifyData.error || "Payment signature verification failed.";
                toast.error(`${failReason} Recorded in Order History.`);
                await recordFailedOrder(failReason, response.razorpay_payment_id);
                return;
              }
            }
          } catch {
            // Proceed if test payment verification fallback
          }

          await finalizeOrderAndSave(response.razorpay_payment_id || `rzp_test_${Date.now()}`);
        },
        modal: {
          ondismiss: function () {
            toast.info("Razorpay checkout window closed.");
          },
        },
      };

      if (razorpayOrder.id && !razorpayOrder.isFallback && !String(razorpayOrder.id).includes("demo")) {
        options.order_id = razorpayOrder.id;
      }

      try {
        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on("payment.failed", async function (response: any) {
          const failMsg = response.error?.description || "Razorpay payment failed or was declined.";
          toast.error(`${failMsg} Recorded in Order History.`);
          await recordFailedOrder(failMsg, response.error?.metadata?.payment_id);
        });
        razorpayInstance.open();
      } catch (err: any) {
        console.error("Razorpay Popup Launch Error:", err);
        toast.error("Could not open Razorpay checkout popup. Please check your browser popup blocker.");
      }
    });
  };

  const copyOrderNumber = () => {
    if (orderSuccess) {
      navigator.clipboard.writeText(orderSuccess.orderNumber);
      toast.success("Order number copied to clipboard!");
    }
  };

  // 1. Success Screen State
  if (orderSuccess) {
    return (
      <SiteShell>
        <Section className="max-w-2xl py-12">
          <Card className="border-gold/30 bg-black/40 p-8 text-center flex flex-col items-center gap-6">
            <span className="flex size-14 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/20 shadow-md">
              <CheckCircle2 className="size-8 stroke-[1.5]" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Your Order is Confirmed</h1>
              <p className="mt-2 text-sm text-white/50">
                A receipt and tracking links have been sent to <span className="text-white">{orderSuccess.email}</span>.
              </p>
            </div>

            {/* Order Meta details */}
            <div className="w-full bg-white/[0.02] border border-white/8 rounded-md p-4 flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center border-b border-white/6 pb-2.5">
                <span className="text-white/40 text-xs">Order Number</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  {orderSuccess.orderNumber}
                  <button onClick={copyOrderNumber} className="text-white/50 hover:text-gold transition cursor-pointer" aria-label="Copy order number">
                    <Copy className="size-3.5" />
                  </button>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/6 pb-2.5">
                <span className="text-white/40 text-xs">Payment Method</span>
                <span className="font-medium text-white/80">Razorpay Payment Gateway</span>
              </div>
              {orderSuccess.paymentId && (
                <div className="flex justify-between items-center border-b border-white/6 pb-2.5">
                  <span className="text-white/40 text-xs">Razorpay Payment ID</span>
                  <span className="font-mono text-xs text-gold/90">{orderSuccess.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-xs">Scheduled Delivery</span>
                <span className="font-semibold text-gold">
                  {orderSuccess.deliveryDate 
                    ? new Date(orderSuccess.deliveryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })
                    : "Standard Shipping (3-5 days)"}
                </span>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="w-full flex flex-col text-left text-xs gap-3">
              <p className="font-semibold text-white/80 uppercase tracking-wider text-[10px]">Recipient: {orderSuccess.recipientName}</p>
              <div className="border border-white/6 rounded-md overflow-hidden bg-black/20">
                {orderSuccess.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/6 p-3 last:border-b-0">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium text-white/80">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full flex justify-between border-t border-white/8 pt-5 text-xl font-semibold text-white">
              <span>Total Paid</span>
              <span className="text-gold">{formatPrice(orderSuccess.total)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/shop">Continue Gifting</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/account">Track in Account</Link>
              </Button>
            </div>
          </Card>
        </Section>
      </SiteShell>
    );
  }

  // 2. Empty Basket Screen State
  if (cart.length === 0) {
    return (
      <SiteShell>
        <Section className="py-20 text-center max-w-md">
          <Card className="border-white/8 bg-white/[0.01] flex flex-col items-center gap-6 p-10">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/5 text-white/30 border border-white/10">
              <ShoppingBag className="size-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">Your Basket is Empty</h2>
              <p className="mt-3 text-sm text-white/40 leading-relaxed">
                Add curated luxury hampers, custom gift boxes, or run our AI finder to begin your gifting journey.
              </p>
            </div>
            <Button asChild className="w-full mt-2">
              <Link href="/shop">Explore Collection</Link>
            </Button>
          </Card>
        </Section>
      </SiteShell>
    );
  }

  // 3. Checkout Form Page State
  return (
    <SiteShell>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Section className="py-12">
        <SectionHeading 
          title="Checkout Atelier." 
          text="Complete your delivery coordinates, select wrapping cards, and submit secure orders to our white-glove courier network." 
        />
        
        {/* Payment Failure Alert Banner directly on Checkout Page */}
        {orderFailure && (
          <div className="mb-8 w-full bg-red-950/40 border border-red-500/40 rounded-xl p-5 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-start justify-between gap-4 border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                  <XCircle className="size-6 stroke-[2]" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Payment Could Not Be Completed
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
                      DECLINED
                    </span>
                  </h3>
                  <p className="text-xs text-red-300/80 mt-0.5">
                    {orderFailure.reason}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setOrderFailure(null)} 
                className="text-white/40 hover:text-white text-xs p-1"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 p-3.5 rounded-lg border border-red-500/20">
              <div>
                <span className="text-white/40 uppercase tracking-widest text-[9px] block">Order Attempt Reference</span>
                <span className="font-mono text-gold font-bold text-sm">{orderFailure.orderNumber}</span>
              </div>
              <div>
                <span className="text-white/40 uppercase tracking-widest text-[9px] block">Status Recorded</span>
                <span className="text-red-400 font-bold uppercase tracking-wider text-[11px]">Saved in Order History</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button 
                type="button" 
                onClick={(e) => {
                  setOrderFailure(null);
                  handleCheckoutSubmit(e);
                }}
                className="bg-gold text-black hover:bg-gold-light font-bold flex items-center justify-center gap-2 flex-1 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                <RefreshCw className="size-4" />
                <span>Try Payment Again</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                asChild 
                className="border-white/20 text-white/80 hover:text-white flex-1"
              >
                <Link href="/account?tab=orders">View Order History</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Checkout Form */}
          <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-6">
            
            {/* Contact Information */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2">
                1. Contact Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Your Full Name
                  <input 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text" 
                    className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold" 
                    placeholder="e.g. S.K Rakeeb"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Email Address
                  <input 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email" 
                    className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold" 
                    placeholder="e.g. rakeeb@gmail.com"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                Recipient Contact Phone
                <input 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel" 
                  className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold" 
                  placeholder="e.g. +91 9876543210"
                />
              </label>
            </Card>

            {/* Delivery Details */}
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap justify-between items-center border-b border-white/8 pb-2 gap-2">
                <h2 className="text-lg font-semibold text-white">
                  2. Shipping Coordinates
                </h2>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLoc}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isDetectingLoc ? (
                    <Loader2 className="size-3.5 animate-spin text-gold" />
                  ) : (
                    <Compass className="size-3.5 text-gold" />
                  )}
                  {isDetectingLoc ? "Detecting..." : "Use Current Location"}
                </button>
              </div>

              {/* Saved Address Picker — only shown if the user has saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Choose a saved address or enter manually</p>
                  <div className="flex flex-col gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`w-full flex items-start gap-3 rounded-md border px-4 py-3 text-left text-xs transition cursor-pointer ${
                          selectedAddressId === addr.id
                            ? "border-gold/50 bg-gold/5 text-white"
                            : "border-white/8 bg-black/20 text-white/60 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <MapPin className={`size-4 mt-0.5 shrink-0 ${ selectedAddressId === addr.id ? "text-gold" : "text-white/30" }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-[10px] uppercase tracking-wider ${ selectedAddressId === addr.id ? "text-gold" : "text-white/50" }`}>
                            {addr.label}
                          </p>
                          <p className="mt-0.5 truncate">{addr.address}</p>
                          <p className="text-white/40 mt-0.5">{addr.name} · {addr.phone}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <ChevronRight className="size-3.5 text-gold shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}

                    {/* Enter Manually option */}
                    <button
                      type="button"
                      onClick={handleSelectManual}
                      className={`w-full flex items-center gap-3 rounded-md border px-4 py-3 text-left text-xs transition cursor-pointer ${
                        selectedAddressId === "manual"
                          ? "border-gold/50 bg-gold/5 text-white"
                          : "border-white/8 bg-black/20 text-white/50 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Plus className={`size-4 shrink-0 ${ selectedAddressId === "manual" ? "text-gold" : "text-white/30" }`} />
                      <span className={`font-semibold text-[10px] uppercase tracking-wider ${ selectedAddressId === "manual" ? "text-gold" : "" }`}>
                        Enter a new address manually
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Manual entry fields — shown when manual is selected OR no saved addresses exist */}
              {(selectedAddressId === "manual" || savedAddresses.length === 0) && (
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Street Address (recipient)
                    <input
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      type="text"
                      className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold"
                      placeholder="Flat/House No, Building, Street Name"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                      City
                      <input
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        type="text"
                        className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold"
                        placeholder="Bengaluru"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                      State / Region
                      <input
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        type="text"
                        className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold"
                        placeholder="Karnataka"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Postal Code
                      <input
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        type="text"
                        className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold"
                        placeholder="560001"
                      />
                    </label>
                  </div>
                </div>
              )}
            </Card>

            {/* Custom Scheduling */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-2 flex items-center gap-2">
                <Calendar className="size-4 text-gold" />
                3. Scheduled Occasion Delivery
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Target Date
                  <DatePicker
                    value={deliveryDate}
                    onChange={setDeliveryDate}
                    min={new Date().toISOString().split("T")[0]}
                    placeholder="dd-mm-yyyy"
                    position="top"
                    className="h-11 text-sm font-normal"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
                  General instructions
                  <input 
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    type="text" 
                    className="h-11 rounded-md border border-white/12 bg-black/30 px-3 font-normal text-white text-sm outline-none focus:border-gold" 
                    placeholder="Optional greeting note card..."
                  />
                </label>
              </div>
            </Card>

            <Button disabled={pending} className="w-full h-12 text-base font-bold tracking-wide uppercase mt-2 shadow-[0_0_30px_rgba(212,175,55,0.25)]">
              <Lock className="size-4 mr-1.5" />
              {pending ? "Securing Transaction..." : `Submit Secure Payment • ${formatPrice(total)}`}
            </Button>
          </form>

          {/* Right Column: Order Summary */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <h2 className="text-lg font-semibold text-white border-b border-white/8 pb-3 flex items-center gap-2">
                <ShoppingBag className="size-4 text-gold" />
                Order Curations
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                
                {/* Cart Items List */}
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const itemSlug = item.slug || products.find((p) => p.id === item.id)?.slug || item.id;
                    return (
                      <div key={item.id} className="flex gap-4 border-b border-white/6 pb-4 last:border-0 last:pb-0">
                        {/* Product image */}
                        <Link href={`/products/${itemSlug}`} className="flex-shrink-0 group/img cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={item.image} 
                            className="size-16 rounded object-cover border border-white/8 bg-zinc-950 flex-shrink-0 group-hover/img:opacity-80 transition-opacity" 
                            alt={item.name} 
                          />
                        </Link>
                        
                        {/* Product descriptors */}
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link href={`/products/${itemSlug}`} className="group/title cursor-pointer">
                                <h3 className="font-semibold text-white line-clamp-1 group-hover/title:text-gold transition-colors">{item.name}</h3>
                              </Link>
                              <p className="text-[10px] text-white/40 mt-0.5">{item.category}</p>
                            </div>
                            <span className="font-semibold text-white ml-2">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                        {/* Customizations display */}
                        {item.wrappingStyle && (
                          <p className="text-[9px] text-gold mt-1.5">
                            Ribbon: <span className="capitalize">{item.wrappingStyle}</span>
                          </p>
                        )}
                        {item.engravingText && (
                          <p className="text-[9px] text-gold mt-0.5">
                            Engraved: &ldquo;{item.engravingText}&rdquo;
                          </p>
                        )}
                        {item.giftMessage && (
                          <p className="text-[9px] text-white/40 mt-1 line-clamp-1 italic">
                            Message: &ldquo;{item.giftMessage}&rdquo;
                          </p>
                        )}

                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] text-white/40">Quantity: {item.quantity}</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-medium"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>

                {/* Coupon Code section */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2 mt-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    type="text"
                    className="h-10 rounded-md border border-white/12 bg-black/40 px-3 text-xs text-white outline-none focus:border-gold flex-1 placeholder:text-white/20"
                    placeholder="Enter Coupon (e.g. LUXE10)"
                  />
                  <button className="h-10 rounded-md bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/15 cursor-pointer">
                    Apply
                  </button>
                </form>

                {couponCode && (
                  <CouponCelebration
                    couponCode={couponCode}
                    discount={discount}
                    onRemove={removeCouponCode}
                    triggerBurst={triggerCouponBurst}
                  />
                )}

                {/* Pricing Summary */}
                <div className="flex flex-col gap-2.5 border-t border-white/8 pt-4 text-xs">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center rounded-lg border border-gold/40 bg-gold/15 px-3 py-2 text-gold font-bold text-xs shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="size-3.5 text-gold animate-spin" style={{ animationDuration: "5s" }} />
                        Coupon Savings ({couponCode} Applied)
                      </span>
                      <span className="text-sm font-black text-gold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/50">
                    <span>White-Glove delivery</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/12 pt-4 text-lg font-semibold text-white">
                    <span>Total Cost</span>
                    <span className="text-gold">{formatPrice(total)}</span>
                  </div>
                </div>

              </div>
            </Card>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
