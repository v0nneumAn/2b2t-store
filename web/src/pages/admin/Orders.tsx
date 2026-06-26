import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { adminGet, adminPost } from '../../lib/admin'

interface Order {
  id: string
  status: string
  customer_email: string | null
  customer_discord_id: string | null
  delivery_type: string
  price_usd: string
  handoff_coords: { x: number; y: number; z: number; dimension?: string } | null
  assigned_bot: string | null
  paid_at: string | null
  created_at: string
}

const STATE_ORDER = [
  'awaiting_payment',
  'paid',
  'preparing',
  'in_transit',
  'ready_for_pickup',
  'customer_arrived',
  'dropping',
  'delivered',
  'completed',
]

const DEMO_STATES = ['ready_for_pickup', 'customer_arrived', 'dropping', 'delivered', 'completed']

function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [demoEnabled, setDemoEnabled] = useState<boolean | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminGet<Order[]>('/admin/orders')
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadDemoMode = async () => {
    try {
      const status = await adminGet<{ enabled: boolean }>('/admin/demo-mode')
      setDemoEnabled(status.enabled)
    } catch {
      setDemoEnabled(false)
    }
  }

  useEffect(() => {
    load()
    loadDemoMode()
  }, [])

  const nextDemoState = (current: string): string | null => {
    const currentIndex = STATE_ORDER.indexOf(current)
    if (currentIndex === -1) return null
    return (
      DEMO_STATES.find((state) => STATE_ORDER.indexOf(state) > currentIndex) || null
    )
  }

  const advance = async (order: Order) => {
    const target = nextDemoState(order.status)
    if (!target) return

    setAdvancing(order.id)
    setError('')
    try {
      await adminPost(`/admin/orders/${order.id}/demo-advance`, { to: target })
      setToast(`Order advanced to ${target.replace(/_/g, ' ')}`)
      setTimeout(() => setToast(''), 3000)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdvancing(null)
    }
  }

  const statusStyle = (status: string) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold capitalize border '
    switch (status) {
      case 'awaiting_payment':
      case 'pending':
        return base + 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      case 'paid':
        return base + 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'ready_for_pickup':
        return base + 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'customer_arrived':
        return base + 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'dropping':
        return base + 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'delivered':
      case 'completed':
        return base + 'text-green-400 bg-green-400/10 border-green-400/20'
      default:
        return base + 'text-zinc-300 bg-zinc-800 border-zinc-700'
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-zinc-400 mt-1">View and manage customer orders.</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {toast && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg">
          {toast}
        </div>
      )}

      {demoEnabled === false && (
        <div className="mb-4 bg-zinc-800/50 border border-zinc-700 text-zinc-300 px-4 py-3 rounded-lg text-sm">
          Demo mode is disabled. Enable <code className="bg-zinc-900 px-1 rounded">DEMO_MODE=true</code> in the
          environment to simulate delivery states.
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Handoff</th>
              <th className="px-4 py-3">Demo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const target = nextDemoState(o.status)
                return (
                  <tr key={o.id} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-zinc-500">{o.id.slice(0, 16)}…</div>
                      <div className="text-xs text-zinc-400 capitalize">{o.delivery_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusStyle(o.status)}>{o.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.customer_email || '—'}</div>
                      {o.customer_discord_id && (
                        <div className="text-xs text-zinc-500">Discord: {o.customer_discord_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">${parseFloat(o.price_usd).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {o.handoff_coords ? (
                        <div className="text-xs font-mono">
                          {o.handoff_coords.x}, {o.handoff_coords.y}, {o.handoff_coords.z}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {demoEnabled && target ? (
                        <button
                          onClick={() => advance(o)}
                          disabled={advancing === o.id}
                          className="px-3 py-1.5 text-xs font-medium rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
                        >
                          {advancing === o.id ? 'Working…' : `Simulate ${target.replace(/_/g, ' ')}`}
                        </button>
                      ) : (
                        <span className="text-zinc-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export default Orders
