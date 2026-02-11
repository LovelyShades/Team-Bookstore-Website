# 📚 Bookstore E-Commerce — Project Showcase

[![Framework](https://img.shields.io/badge/Framework-Next.js%2016-black.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2019-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Supabase%20(Postgres%2FAuth%2FStorage)-3ECF8E.svg)]()
[![Status](https://img.shields.io/badge/Status-Showcase-lightgrey.svg)]()

**Bookstore E-Commerce** is a modern full-stack bookstore built to demonstrate **team collaboration, scalable database design, and production-style checkout flows**.  
Users can browse items, add to cart, apply discounts, and checkout — powered by a **single atomic Supabase RPC**.

> **Team:** Alanna Matundan + Team  
> **Purpose:** Portfolio · Educational Review · Demonstration Only

---

## ✨ Highlights

- Full-stack architecture with **Next.js + Supabase**
- **Role-based authentication** (customer/admin)
- Admin dashboard for **inventory + order management**
- Postgres schema for **users, items, carts, orders, discounts**
- Atomic checkout using **Supabase RPC** (`fn_checkout`) to ensure consistency:
  - Validates discount
  - Computes subtotal → discount → tax → total
  - Inserts orders + order_items
  - Decrements inventory
  - Clears cart

---

## 🎬 Showcase (Demo)

> Add your demo video here (recommended)

### Option A — YouTube thumbnail link
[![Watch Demo](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

### Option B — Custom screenshot/GIF
<!--
<p align="center">
  <img src="public/demo.gif" alt="Demo"><br>
  <em>Checkout flow + admin dashboard</em>
</p>
-->

---

## 🧰 Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS, TypeScript
- **Backend:** Supabase (Postgres, Auth, Storage, RPC)
- **Deployment:** Vercel (auto-deploy from GitHub)

---

## 🚀 Getting Started

### ✅ Requirements
- **Node.js 22 LTS** (required)

Check:
```bash
node -v
🖥️ Install & Run Locally
bash
Copy code
# Clone the repository
git clone https://github.com/YOUR_ORG/bookstore-ecommerce.git
cd bookstore-ecommerce

# Install dependencies
npm install

# Create env file
# Keys are provided in the file shared on Discord
echo "NEXT_PUBLIC_SUPABASE_URL=your-project-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

# Start dev server
npm run dev
Open:

http://localhost:3000

🔐 Checkout RPC (Core System)
Checkout is performed atomically via:

await supabase.rpc('fn_checkout', { cart_id, discount_code });

What fn_checkout(cart_id, discount_code) does:
Validate discount code

Compute subtotal → discount → tax (8.25%) → total

Insert into orders and order_items

Decrement items.qty_available

Clear cart contents

🧱 Project Structure
bash
Copy code
bookstore-ecommerce/
├─ pages/          # Next.js routes (/catalog, /cart, /checkout, /admin)
├─ components/     # Reusable UI components
├─ supabase/       # Supabase client, types, RPC helpers
├─ public/         # Static assets
├─ styles/         # Tailwind + styling configs
├─ package.json
├─ tsconfig.json
└─ next.config.ts

👥 Team
Name	Role	Focus
Alanna	Auth + Items Schema	Supabase / Database + Frontend Polish
Sebastian	Cart + Discount RPC	Backend Logic
Emily	UI + Layout	Next.js + Tailwind
Travis	Auth Pages	User Flows
Mark	Orders / Checkout UI	Layouts
Christopher	Checkout Contract	Testing & Data

🧾 Scripts
Command	Description
npm run dev	Start development server
npm run build	Build for production
npm run start	Run built app
npm run lint	Lint code with ESLint

🩵 Common Issues
Problem	Fix
npm: command not found	Node not installed / not in PATH — install Node 22 LTS
next: not recognized	Run npm install again
.env.local missing	Create it using the commands above
Port 3000 in use	npx kill-port 3000 or npm run dev -- -p 3001

🚢 Deployment
Deployed on Vercel — pushing to main triggers an automatic production deployment.

⚖️ License
MIT License — free for educational and collaborative use.

👩‍💻 Authors
Alanna Matundan — database/auth design + full-stack features + architecture

Team Contributors — UI, backend logic, checkout flows, testing

© 2026 Alanna Matundan & Contributors. All rights reserved.



