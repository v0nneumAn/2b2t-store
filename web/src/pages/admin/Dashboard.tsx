import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet } from '../../lib/admin'

interface Stats {
  orders: number
  products: number
  depots: number
  bots: number
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [orders, products, depots, bots] = await Promise.all([
          adminGet<unknown[]>('/admin/orders'),
          adminGet<unknown[]>('/admin/products'),
          adminGet<unknown[]>('/admin/depots'),
          adminGet<unknown[]>('/api/bots'),
        ])
        setStats({
          orders: orders.length,
          products: products.length,
          depots: depots.length,
          bots: bots.length,
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = [
    { label: 'Orders', value: stats?.orders ?? 0, href: '/admin/orders' },
    { label: 'Products', value: stats?.products ?? 0, href: '/admin/products' },
    { label: 'Depots', value: stats?.depots ?? 0, href: '/admin/depots' },
    { label: 'Bots', value: stats?.bots ?? 0, href: '/admin/bots' },
  ]

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of your store.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-zinc-400">Loading stats…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.href}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors"
            >
              <div className="text-zinc-400 text-sm font-medium">{card.label}</div>
              <div className="text-3xl font-bold mt-2">{card.value}</div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

export default Dashboard
