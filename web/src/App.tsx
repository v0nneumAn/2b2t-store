import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Order from './pages/Order'
import MyOrders from './pages/MyOrders'
import CartDrawer from './components/CartDrawer'
import { useCartStore } from './stores/cartStore'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminDepots from './pages/admin/Depots'
import AdminBots from './pages/admin/Bots'

function App() {
  const [cartOpen, setCartOpen] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans">
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route
          path="/*"
          element={
            <StoreLayout cartOpen={cartOpen} setCartOpen={setCartOpen} itemCount={itemCount} />
          }
        />
      </Routes>
    </div>
  )
}

function StoreLayout({
  cartOpen,
  setCartOpen,
  itemCount,
}: {
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  itemCount: number
}) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-[68px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <img
              src="/assets/landing/shulker_box_white.png"
              alt="Shulker.Shop"
              className="h-8 w-auto"
            />
            <span>Shulker.Shop</span>
          </Link>

          <nav aria-label="Primary" className="hidden sm:flex items-center gap-6">
            <Link
              to="/shop?server=2b2t"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              2b2t
            </Link>
            <Link
              to="/shop?server=donutsmp"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Donut SMP
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/my-orders"
              className="hidden sm:flex text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              My Orders
            </Link>
            <Link
              to="/admin"
              className="hidden sm:flex text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Admin
            </Link>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              Discord
            </a>

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
              aria-label="Open cart"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-white text-orange-600 text-[10px] font-bold rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<Order />} />
          <Route path="/my-orders" element={<MyOrders />} />
        </Routes>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

function AdminLayout() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/products" element={<AdminProducts />} />
      <Route path="/orders" element={<AdminOrders />} />
      <Route path="/depots" element={<AdminDepots />} />
      <Route path="/bots" element={<AdminBots />} />
    </Routes>
  )
}

export default App
