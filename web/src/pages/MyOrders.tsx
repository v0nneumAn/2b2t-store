import { useState } from 'react'
import { Link } from 'react-router-dom'

interface OrderSummary {
  id: string
  status: string
  price_usd: string
  created_at: string | null
  paid_at: string | null
  delivered_at: string | null
}

function statusBadgeClass(status: string) {
  const base = 'px-2.5 py-1 rounded-full text-xs font-medium capitalize'
  switch (status) {
    case 'delivered':
    case 'completed':
      return `${base} bg-green-500/10 text-green-400 border border-green-500/20`
    case 'paid':
    case 'ready_for_pickup':
      return `${base} bg-blue-500/10 text-blue-400 border border-blue-500/20`
    case 'awaiting_payment':
      return `${base} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`
    default:
      return `${base} bg-zinc-500/10 text-zinc-400 border border-zinc-500/20`
  }
}

function MyOrders() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = orderId.trim()
    const trimmedEmail = email.trim()
    if (!trimmedId || !trimmedEmail) return

    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const resp = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: trimmedId, email: trimmedEmail }),
      })
      if (!resp.ok) {
        if (resp.status === 404) {
          throw new Error('Order not found. Please check the order ID and email.')
        }
        throw new Error('Failed to look up order.')
      }
      const data = (await resp.json()) as OrderSummary
      setOrder(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Track your order</h1>
      <p className="text-zinc-400 mb-8">
        Enter your order ID and the email used at checkout.
      </p>

      <form onSubmit={search} className="space-y-4 mb-8">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order ID (e.g. v-xxx...)"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-orange-500/50 text-white placeholder-zinc-500"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email used at checkout"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-orange-500/50 text-white placeholder-zinc-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Searching…' : 'Find order'}
        </button>
      </form>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {order && (
        <Link
          to={`/order/${order.id}`}
          className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm text-zinc-400">{order.id}</span>
            <span className={statusBadgeClass(order.status)}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-300">${order.price_usd}</span>
            <span className="text-zinc-500">
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString()
                : '—'}
            </span>
          </div>
          {order.delivered_at && (
            <div className="mt-2 text-xs text-green-400">Delivered</div>
          )}
        </Link>
      )}
    </div>
  )
}

export default MyOrders
