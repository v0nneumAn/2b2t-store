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

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminGet<Stats>('/admin/stats')
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const statCards = stats
    ? [
        { label: 'Orders', value: stats.orders, href: '/admin/orders' },
        { label: 'Products', value: stats.products, href: '/admin/products' },
        { label: 'Depots', value: stats.depots, href: '/admin/depots' },
        { label: 'Bots', value: stats.bots, href: '/admin/bots' },
      ]
    : []

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of your store.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading stats</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={loadStats}
            className="mt-3 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-100 px-3 py-1 rounded transition-colors"
          >
            Retry
          </button>
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
