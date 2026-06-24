import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { sessionHeaders } from '../lib/session'
import { apiError } from '../lib/api'

interface Coords {
  x: number
  y: number
  z: number
  dimension?: string
}

interface Order {
  id: string
  status: string
  price_usd: string
  payment_provider: string
  payment_status: string
  payment_checkout_session_id: string | null
  paid_at: string | null
  delivery_type: string
  delivery_coords?: Coords | null
  handoff_coords?: Coords | null
  assigned_bot?: string | null
  customer_arrived_at?: string | null
  delivered_at?: string | null
}

const STATUS_STYLES: Record<string, string> = {
  awaiting_payment: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  paid: 'text-green-400 bg-green-400/10 border-green-400/20',
  preparing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_transit: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  ready_for_pickup: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  customer_arrived: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  dropping: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
  completed: 'text-green-400 bg-green-400/10 border-green-400/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
}

// Ordered timeline steps for the delivery flow.
const TIMELINE_STEPS = [
  { key: 'paid', label: 'Payment received' },
  { key: 'preparing', label: 'Bot preparing EnderChest' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'customer_arrived', label: 'You arrived' },
  { key: 'dropping', label: 'Bot dropping items' },
  { key: 'delivered', label: 'Items dropped' },
  { key: 'completed', label: 'Completed' },
]

function formatCoords(coords?: Coords | null) {
  if (!coords) return null
  return `${coords.x}, ${coords.y}, ${coords.z}${coords.dimension ? ` (${coords.dimension})` : ''}`
}

function Order() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [arrivalLoading, setArrivalLoading] = useState(false)

  const fetchOrder = async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/orders/${id}`, { headers: sessionHeaders() })
      if (!res.ok) throw await apiError(res)
      const data = await res.json()
      setOrder(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to load order')
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchOrder()
      setLoading(false)
    }
    load()
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. You can retry below.')
    }
  }, [searchParams])

  const createCheckoutSession = async () => {
    if (!order) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/payments/checkout/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        throw await apiError(res)
      }
      const data = await res.json()
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmArrival = async () => {
    if (!order) return
    setArrivalLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${order.id}/arrived`, {
        method: 'POST',
        headers: sessionHeaders(),
      })
      if (!res.ok) throw await apiError(res)
      const data = await res.json()
      setOrder(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setArrivalLoading(false)
    }
  }

  if (loading && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-zinc-400">
        <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
        Loading order…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <p className="text-zinc-400">We couldn’t locate that order.</p>
      </div>
    )
  }

  const isPaid = order.status !== 'awaiting_payment' && order.status !== 'pending'
  const statusStyle = STATUS_STYLES[order.status] || 'text-zinc-300 bg-zinc-800 border-zinc-700'

  // Determine timeline index. Anything before 'paid' is treated as step 0.
  const statusIndex = TIMELINE_STEPS.findIndex((s) => s.key === order.status)
  const activeStep = statusIndex >= 0 ? statusIndex : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-2">
          Order confirmation
        </div>
        <h1 className="text-3xl font-bold">Order {order.id}</h1>
      </div>

      {searchParams.get('success') === 'true' && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg mb-6">
          Thank you! Your payment has been received.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize border ${statusStyle}`}
          >
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Delivery</span>
          <span className="font-medium capitalize">{order.delivery_type.replace(/_/g, ' ')}</span>
        </div>

        {order.delivery_coords && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Your coordinates</span>
            <span className="font-medium">{formatCoords(order.delivery_coords)}</span>
          </div>
        )}

        {order.assigned_bot && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Delivery bot</span>
            <span className="font-medium">{order.assigned_bot}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
          <span className="text-zinc-400">Total paid</span>
          <span className="text-2xl font-bold">${parseFloat(order.price_usd).toFixed(2)}</span>
        </div>

        {!isPaid && (
          <div className="pt-2">
            <p className="text-zinc-400 text-sm mb-4">
              Waiting for payment. Complete checkout to confirm your order.
            </p>
            <button
              onClick={createCheckoutSession}
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Loading checkout…' : 'Pay with Stripe'}
            </button>
          </div>
        )}

        {isPaid && (
          <div className="border-t border-zinc-800 pt-5">
            <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Payment received
            </div>
            <div className="text-sm text-zinc-400">Provider: {order.payment_provider}</div>
            {order.paid_at && (
              <div className="text-sm text-zinc-400">
                Paid at: {new Date(order.paid_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delivery timeline */}
      {isPaid && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery progress</h2>
          <div className="relative">
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index < activeStep
              const isCurrent = index === activeStep
              return (
                <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm ${
                        isCompleted
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : isCurrent
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 mt-2 ${
                          isCompleted ? 'bg-green-500/40' : 'bg-zinc-800'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-2">
                    <div
                      className={`font-medium ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </div>
                    {step.key === 'ready_for_pickup' && order.handoff_coords && (
                      <div className="text-sm text-emerald-400 mt-1">
                        Pickup location: {formatCoords(order.handoff_coords)}
                      </div>
                    )}
                    {step.key === 'customer_arrived' && order.customer_arrived_at && (
                      <div className="text-sm text-zinc-500 mt-1">
                        Confirmed at {new Date(order.customer_arrived_at).toLocaleString()}
                      </div>
                    )}
                    {step.key === 'delivered' && order.delivered_at && (
                      <div className="text-sm text-zinc-500 mt-1">
                        Dropped at {new Date(order.delivered_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {order.status === 'ready_for_pickup' && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
                <p className="text-emerald-200 text-sm">
                  Travel to{' '}
                  <strong className="font-mono">{formatCoords(order.handoff_coords)}</strong> and
                  click the button below once you are standing at the EnderChest.
                </p>
              </div>
              <button
                onClick={confirmArrival}
                disabled={arrivalLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-lg transition-colors"
              >
                {arrivalLoading ? 'Confirming…' : 'I am at the location'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Order
