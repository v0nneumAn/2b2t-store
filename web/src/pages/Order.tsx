import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

interface Order {
  id: string
  status: string
  price_usd: string
  payment_provider: string
  payment_status: string
  payment_checkout_session_id: string | null
  paid_at: string | null
  delivery_type: string
  delivery_coords?: { x: number; y: number; z: number; dimension: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  awaiting_payment: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  paid: 'text-green-400 bg-green-400/10 border-green-400/20',
  completed: 'text-green-400 bg-green-400/10 border-green-400/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
}

function Order() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) throw new Error('Order not found')
        const data = await res.json()
        setOrder(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
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
        body: JSON.stringify({
          success_url: `${window.location.origin}/order/${order.id}?success=true`,
          cancel_url: `${window.location.origin}/order/${order.id}?canceled=true`,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Checkout session failed')
      }
      const data = await res.json()
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
            <span className="text-zinc-400">Coordinates</span>
            <span className="font-medium">
              {order.delivery_coords.x}, {order.delivery_coords.y}, {order.delivery_coords.z}{' '}
              <span className="text-zinc-500 capitalize">({order.delivery_coords.dimension})</span>
            </span>
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
    </div>
  )
}

export default Order
