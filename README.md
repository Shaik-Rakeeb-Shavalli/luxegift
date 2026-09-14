# LuxeGift — Luxury Gift E-Commerce Platform

A cinematic, premium luxury gift shopping experience built with **Next.js 16**, **Firebase Firestore**, **Razorpay**, and **Framer Motion**.

## ✨ Features

- **Storefront** — Hero sliders, 3D product showcases, animated editorial sections
- **Shop & Catalog** — Real-time products from Firestore with filter/search
- **Product Detail Pages** — 3D viewer, reviews, add to cart/wishlist
- **Custom Gift Builder** — Interactive box builder saved to Firestore
- **Occasion Reminders** — Save dates and get reminded
- **Checkout** — Razorpay payment gateway with signature verification
- **Firebase Auth** — Customer sign-up/login, persisted user profiles
- **Admin Dashboard** — Analytics, orders, product catalog CRUD, coupons, review moderation
- **Real-time Sync** — Firestore `onSnapshot` listeners across admin & customer views

---

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/your-username/luxegift.git
cd luxegift
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your values in `.env`:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `RAZORPAY_KEY_ID` | ✅ (for payments) | Razorpay server-side key ID |
| `RAZORPAY_KEY_SECRET` | ✅ (for payments) | Razorpay server-side key secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ (for payments) | Razorpay client-side key ID |
| `NEXT_PUBLIC_SITE_URL` | Optional | Deployed site URL for SEO metadata |
| `SEED_SECRET` | Optional | Token to protect `/api/seed-firestore` |
| `DATABASE_URL` | Optional | PostgreSQL connection (Prisma fallback) |
| `RESEND_API_KEY` | Optional | Resend API for email notifications |

### 3. Seed Firebase (Optional)

To populate Firestore with sample products, coupons, and orders:

```bash
# Without SEED_SECRET:
curl http://localhost:3000/api/seed-firestore

# With SEED_SECRET configured:
curl -H "Authorization: Bearer your-seed-secret" http://localhost:3000/api/seed-firestore
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Admin Access

Navigate to `/admin/login` and use:
- **Email:** `admin@luxegift.com`
- **Password:** `admin123`

> ⚠️ **Important:** Change these credentials in `src/context/auth-context.tsx` before deploying to production.

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── shop/                 # Product catalog
│   ├── products/[slug]/      # Product detail pages
│   ├── checkout/             # Checkout + Razorpay
│   ├── login/                # Customer auth
│   ├── account/              # Customer dashboard
│   ├── gift-box-builder/     # Interactive builder
│   ├── gift-finder/          # AI gift finder
│   ├── occasions/[slug]/     # Occasion pages
│   ├── admin/                # Admin workspace
│   │   └── login/            # Admin auth
│   └── api/
│       ├── razorpay/order/   # Create Razorpay order
│       ├── razorpay/verify/  # Verify Razorpay payment
│       ├── razorpay/webhook/ # Razorpay webhook handler
│       ├── admin/upload/     # File upload endpoint
│       └── seed-firestore/   # Database seeding (protected)
├── components/
│   ├── layout/               # Shell, header, navigation
│   ├── commerce/             # Product cards, gift builder
│   ├── three/                # Three.js 3D components
│   └── ui/                   # Button, Card, DatePicker, etc.
├── context/
│   ├── auth-context.tsx      # Firebase Auth + user state
│   ├── cart-context.tsx      # Cart, wishlist, coupons
│   └── products-context.tsx  # Real-time Firestore products
└── lib/
    ├── firebase.ts           # Firebase app init + auth helpers
    ├── firestore.ts          # All Firestore CRUD operations
    ├── actions.ts            # Next.js server actions
    ├── db-helper.ts          # Prisma fallback helpers
    ├── data.ts               # Static product/category data
    ├── invoice.ts            # PDF invoice generator
    └── utils.ts              # cn() and formatPrice()
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Firebase Firestore (primary) |
| Auth | Firebase Authentication |
| Payments | Razorpay |
| Animations | Framer Motion, GSAP, Lenis |
| 3D | Three.js + React Three Fiber |
| Fallback DB | Prisma + PostgreSQL (optional) |
| Email | Resend (optional) |

---

## 📦 Deployment

Deploy to [Vercel](https://vercel.com) for the best Next.js experience:

1. Push to GitHub
2. Connect repository in Vercel dashboard
3. Add all environment variables in Vercel → Settings → Environment Variables
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL
5. Deploy

---

## 📋 Firebase Firestore Collections

| Collection | Purpose |
|---|---|
| `products` | Product catalog |
| `orders` | Customer orders |
| `reviews` | Product reviews (moderated) |
| `coupons` | Discount coupon codes |
| `custom_boxes` | Custom gift box submissions |
| `analytics` | Revenue/order analytics summary |
| `users` | User profiles and activity |
| `categories` | Product categories |
| `occasions` | Gift occasions |

---

## 🔒 Security Notes

- Firebase API keys are `NEXT_PUBLIC_*` (client-exposed by design — standard Firebase practice)
- Firestore Security Rules should be configured to restrict writes to authenticated users
- Razorpay `RAZORPAY_KEY_SECRET` must NEVER be exposed to the client
- Admin login uses hardcoded credentials — replace before production use
- Seed API is protected by `SEED_SECRET` environment variable
