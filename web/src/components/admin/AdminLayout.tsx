import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { adminGet, adminPost } from '../../lib/admin'

const navItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/depots', label: 'Depots' },
  { path: '/admin/bots', label: 'Bots' },
]

function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminGet('/admin/stats')
      .then(() => {
        if (!cancelled) setChecking(false)
      })
      .catch(() => {
        if (!cancelled) navigate('/admin/login')
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await adminPost('/admin/logout', {})
    } finally {
      navigate('/admin/login')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
        <div className="text-zinc-400">Checking session…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="text-orange-500">Admin</span>
            <span>Shulker.Shop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Store
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

export default AdminLayout
