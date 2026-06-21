import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface Order {
  id: string
  status: string
  price_xmr: string
  xmr_address: string
  confirmations: number
  payment_tx_hash: string | null
  delivery_type: string
}

function Order() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="text-center py-12">Loading order...</div>
  if (!order) return <div className="text-center py-12">Order not found.</div>

  const isPaid = order.status !== 'awaiting_payment' && order.status !== 'pending'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Order {order.id}</h1>
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <div className="flex justify-between">
          <span>Status</span>
          <span className="font-semibold capitalize">{order.status.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="capitalize">{order.delivery_type}</span>
        </div>

        {!isPaid && (
          <>
            <div className="border-t border-gray-700 pt-4">
              <label className="block text-sm font-medium mb-2">Send exactly this amount of XMR</label>
              <div className="bg-gray-900 p-3 rounded font-mono break-all">{order.price_xmr}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To this address</label>
              <div className="bg-gray-900 p-3 rounded font-mono break-all text-sm">{order.xmr_address}</div>
            </div>
            <p className="text-gray-400 text-sm">
              Waiting for payment. This page updates automatically.
            </p>
          </>
        )}

        {isPaid && (
          <div className="border-t border-gray-700 pt-4">
            <div className="text-green-400 font-bold mb-2">Payment received</div>
            <div className="text-sm text-gray-400">Confirmations: {order.confirmations}</div>
            {order.payment_tx_hash && (
              <div className="text-sm text-gray-400 break-all">TX: {order.payment_tx_hash}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Order
