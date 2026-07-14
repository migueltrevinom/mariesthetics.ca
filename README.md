# Mari Esthetics

Private home-studio booking platform for **Mari Esthetics** (Edmonton, AB).

Simple public marketing site + Calendly-depth booking engine with Stripe deposits, Interac e-Transfer holds, tips, subscriptions, and a hidden JWT management dashboard.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- MongoDB + Mongoose
- Email OTP → httpOnly JWT (`jose`)
- Stripe PaymentIntents / Checkout
- Resend for OTP email (console fallback in dev)
- Twilio SMS OTP stubbed for later

## Quick start

```bash
cp .env.example .env.local
# set MONGODB_URI, JWT_SECRET, and optionally Stripe / Resend

npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Management dashboard (not linked in public nav): [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Environment

See [`.env.example`](.env.example).

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Mongo connection |
| `JWT_SECRET` | Session signing |
| `SEED_MANAGER_EMAILS` | Comma-separated manager emails for seed |
| `RESEND_API_KEY` | OTP email (optional in dev — code logged) |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Card deposits, balance, tips |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `NEXT_PUBLIC_WHATSAPP` | Contact CTA (`50762639742`) |
| `TWILIO_*` | Future SMS OTP |

## Booking rules

1. **Stripe deposit** — PaymentIntent succeeds → booking `confirmed`, slot locked.
2. **E-Transfer deposit** — booking `held` for **2 hours**; client submits proof; manager confirms in `/admin/bookings`.
3. Expired holds → `expired` (cleanup via booking APIs / `POST /api/bookings/expire-holds`).
4. Admin can record **cash / e-transfer / Stripe** adjustments and generate balance/tip Checkout links.

## Key routes

| Path | Role |
|------|------|
| `/` `/services` `/contact` `/book` | Public |
| `/login` `/portal` | Client OTP + history / tips |
| `/admin/*` | Managers only |
| `/api/auth/*` | OTP request/verify |
| `/api/bookings/*` | Availability, create, proof |
| `/api/payments/*` | Deposit, balance, tip, adjust, webhook |

## Mongo collections

`managers`, `clients`, `clientsettings`, `clientcreditcards`, `otps`, `services`, `promotions`, `coupons`, `referrals`, `subscriptionplans`, `clientsubscriptions`, `bookings`, `payments`

`clients.subscription` references the active `ClientSubscription`.

## Scripts

```bash
npm run dev      # local server
npm run build    # production build
npm run seed     # sample services, plans, managers, coupon
npm run lint
```

## Studio

1211 Gillespie Crescent NW, Edmonton AB T5T 6M5  
WhatsApp: +507 6263-9742 (temporary)
