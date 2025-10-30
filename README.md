# 📚 Bookstore-Ecommerce

A modern full-stack bookstore built with **Next.js 16**, **React 19**, and **Supabase (Postgres + Auth + Storage + RPC)**.  
Users can browse items, add to cart, apply discounts, and checkout — all through a single Supabase function.

---

## 🧰 1️⃣ System Setup (Before Running)

### ✅ Install Node 22 LTS
This project **requires Node 22 LTS**.  
Older or newer versions (like Node 24) may cause build errors.

#### 🔍 Check your version
```bash
node -v

If it’s not v22.x, install or switch to Node 22 LTS:

# If you used nvm-windows:
nvm install 22
nvm use 22
node -v

If you installed Node via the official installer, uninstall from
Control Panel → Programs → Node.js → Uninstall, then reinstall from
👉 https://nodejs.org
 (choose the green “22 LTS” version).

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install 22
nvm use 22

echo "22" > .nvmrc

# Clone repository
git clone https://github.com/your-org/bookstore-ecommerce.git
cd bookstore-ecommerce


Create environment file
echo "NEXT_PUBLIC_SUPABASE_URL=your-project-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

Install dependencies
npm install

Start development server
npm run dev


Open 👉 http://localhost:3000



💻 3️⃣ Technologies Used

Frontend: Next.js (React) + Tailwind CSS

Component-based UI (buttons, inputs, tables)

File-based routing: /catalog, /cart, /checkout, /admin

Deployed on Vercel with auto-deploys from GitHub

Backend / Database: Supabase (Postgres + Auth + Storage + RPC)

Postgres stores users, items, carts, orders, discounts

Auth handles login/register (customer/admin roles)

Storage hosts product images (book covers)

RPC fn_checkout(cart_id, discount_code) runs checkout atomically:

1. Validate discount
2. Compute subtotal → discount → tax (8.25%) → total
3. Insert orders + order_items
4. Decrement item.qty_available
5. Clear cart


Called from frontend:

await supabase.rpc('fn_checkout', { cart_id, discount_code });


📁 4️⃣ Project Structure
bookstore-ecommerce/
├─ pages/         # Next.js routes
├─ components/    # Reusable UI
├─ supabase/      # Client, types, RPC
├─ public/        # Static assets
├─ styles/        # Tailwind configs
├─ package.json
├─ tsconfig.json
└─ next.config.ts

👥 5️⃣ Team
Name	Role	Focus
Alanna	Auth + Items Schema	Supabase / Database
Sebastian	Cart + Discount RPC	Backend Logic
Emily	UI + Layout	Next.js + Tailwind
Travis	Auth Pages	User Flows
Mark	Orders / Checkout UI	Layouts
Christopher	Checkout Contract	Testing & Data

🧾 6️⃣ Scripts
Command	Description
npm run dev	Start development server
npm run build	Build for production
npm run start	Run built app
npm run lint	Lint code with ESLint
🩵 7️⃣ Common Issues
Problem	Fix
npm: command not found	Node not added to PATH — reinstall Node 22 LTS
next: not recognized	Run npm install again
.env.local missing	Create file using commands above
Port 3000 in use	Run npx kill-port 3000 or npm run dev -- -p 3001
🧩 8️⃣ Deployment

Deployed on Vercel — pushing to main automatically deploys to production.

⚖️ License

MIT License — free for educational and collaborative use.


---

### 🔑 Summary for your teammates
They only need to:
1. **Install Node 22 LTS**  
2. Run  
   ```bash
   git clone ...
   npm install
   npm run dev

