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

  if (loading) return <div className="text-center py-12">Loading order...</div>
  if (!order) return <div className="text-center py-12">Order not found.</div>

  const isPaid = order.status !== 'awaiting_payment' && order.status !== 'pending'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Order {order.id}</h1>
      {error && <div className="bg-red-900 text-white p-4 rounded mb-4">{error}</div>}
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <div className="flex justify-between">
          <span>Status</span>
          <span className="font-semibold capitalize">{order.status.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="capitalize">{order.delivery_type}</span>
        </div>
        <div className="flex justify-between">
          <span>Total</span>
          <span className="font-semibold">${parseFloat(order.price_usd).toFixed(2)}</span>
        </div>

        {!isPaid && (
          <>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-400 text-sm mb-4">
                Waiting for payment. Complete checkout to continue.
              </p>
              <button
                onClick={createCheckoutSession}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                {loading ? 'Loading checkout...' : 'Pay with Stripe'}
              </button>
            </div>
          </>
        )}

        {isPaid && (
          <div className="border-t border-gray-700 pt-4">
            <div className="text-green-400 font-bold mb-2">Payment received</div>
            <div className="text-sm text-gray-400">Provider: {order.payment_provider}</div>
            {order.paid_at && (
              <div className="text-sm text-gray-400">Paid at: {new Date(order.paid_at).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Order
